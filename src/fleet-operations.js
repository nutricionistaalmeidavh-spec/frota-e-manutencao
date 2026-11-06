import {createEntityRepository} from '../shared/core.mjs';
import {createFleetDocument,createFleetTire,createFleetFueling,createFleetSupplier} from './catalog.js';
import {installFleetTire,removeFleetTire} from './operations.js';

const fail=(message)=>{throw new Error(message)};
const idOf=(value,label)=>{const s=String(value??'').trim();if(!s)fail('Informe '+label+'.');return s};
const compare=(record,expected)=>{if(expected!=null&&Number(expected)!==(record?.version??0))fail('Registro foi atualizado em outra operação. Reabra antes de salvar.')};
const rows=list=>list.map(x=>x.payload);

export function createOperationalServices({fleet,finance,orders,inventory,assertVehicle}){
 async function save(repo,id,payload,make,{createOnly=false}={}){
  const old=await repo.get(id);
  compare(old,payload.expectedVersion);
  if(createOnly&&old)fail('Registro já existe.');
  const next=make({...old?.payload,...payload});
  return repo.save(next,{expectedVersion:old?.version??0});
 }
 async function completedOrderLines(){
  return (await orders.list()).filter(o=>o.payload.status==='completed');
 }
 async function allFinanceRecords(){
  const [base,completed,fuelings]=await Promise.all([finance.list(),completedOrderLines(),fleet.fuelings.list()]);
  const generated=[];
  for(const record of completed){
   const order=record.payload;
   if(!Number.isSafeInteger(order.totalCostMinor)||order.totalCostMinor<=0)continue;
   const id='maintenance:'+order.id;
   generated.push({collection:'fleet-maintenance.finance',id,version:record.version,derived:true,payload:{
    id,direction:'expense',amountMinor:order.totalCostMinor,description:'OS '+order.id+' — '+order.title,
    allocation:{kind:'vehicle',id:order.assetId},
    metadata:{workOrderId:order.id,assetId:order.assetId,category:'maintenance',source:'completed-work-order'},
    dueDate:null,status:'open',settlements:[]
   }});
  }
  for(const record of fuelings){
   const fueling=record.payload,id='fuel:'+fueling.id;
   generated.push({collection:'fleet-maintenance.finance',id,version:record.version,derived:true,payload:{
    id,direction:'expense',amountMinor:fueling.totalMinor,description:'Abastecimento '+fueling.id,
    allocation:{kind:'vehicle',id:fueling.assetId},
    metadata:{fuelingId:fueling.id,assetId:fueling.assetId,category:'fuel',source:'fleet-fueling'},
    dueDate:null,status:'open',settlements:[]
   }});
  }
  const canonical=new Set(base.map(x=>x.id));
  if(generated.some(x=>canonical.has(x.id)))fail('Conflito de identificador financeiro; revise os cadastros.');
  return [...base,...generated];
 }
 async function stockSnapshot(){
  const [ledger,completed]=await Promise.all([inventory.snapshot(),completedOrderLines()]);
  const state=structuredClone(ledger.state??{});
  const events=[...(ledger.events??[])];
  for(const rec of completed){
   for(const item of rec.payload.items??[]){
    if(item.type!=='part'||!item.sku)continue;
    const cur=state[item.sku]??{sku:item.sku,onHand:0,reserved:0};
    state[item.sku]={...cur,onHand:cur.onHand-Number(item.quantity)};
    events.push({type:'maintenance-consumption',sku:item.sku,quantity:item.quantity,orderId:rec.payload.id,occurredAt:rec.payload.completedAt});
   }
  }
  return {...ledger,state,events};
 }
 async function verifyParts(order){
  const stock=await stockSnapshot(),needed=new Map();
  for(const item of order.items??[]){
   if(item.type!=='part')continue;
   if(!item.sku)fail('Peça da OS sem código SKU: '+item.description);
   needed.set(item.sku,(needed.get(item.sku)??0)+Number(item.quantity));
  }
  for(const [sku,quantity] of needed){
   const item=stock.state[sku];
   if(!item||Number(item.onHand??0)-Number(item.reserved??0)<quantity)
    fail('Estoque insuficiente para '+sku+'. Receba as peças antes de concluir a OS.');
  }
 }
 async function applyStock(input,kind){
  if(kind==='out'){
   const snapshot=await stockSnapshot(),item=snapshot.state[String(input.sku)];
   if(!item||Number(item.onHand??0)-Number(item.reserved??0)<Number(input.quantity))
    fail('Estoque insuficiente para saída da peça.');
  }
  return inventory.apply({...input,kind});
 }
 async function reserveStock(sku,quantity,meta={}){
  const snapshot=await stockSnapshot(),item=snapshot.state[String(sku)];
  if(!item||Number(item.onHand??0)-Number(item.reserved??0)<Number(quantity))fail('Estoque insuficiente para reserva.');
  return inventory.reserve(sku,quantity,meta);
 }
 const screens={
  suppliers:{kind:'table-form',load:async()=>({rows:await fleet.suppliers.list()}),actions:{
   save:input=>save(fleet.suppliers,idOf(input.partyId,'código do fornecedor'),input,createFleetSupplier)
  }},
  documents:{kind:'table-form',load:async()=>({rows:await fleet.documents.list()}),actions:{
   save:async input=>{await assertVehicle(input.assetId);return save(fleet.documents,idOf(input.id,'código do documento'),input,createFleetDocument)}
  }},
  tires:{kind:'table-form',load:async()=>({rows:await fleet.tires.list()}),actions:{
   save:input=>save(fleet.tires,idOf(input.id,'código do pneu'),input,createFleetTire),
   install:async({id,assetId,position,odometer,expectedVersion})=>{
    const current=await fleet.tires.get(id);if(!current)fail('Pneu não encontrado.');
    compare(current,expectedVersion);
    const vehicle=await assertVehicle(assetId);
    if(Number(odometer)<Number(vehicle.payload.odometer??0))fail('Quilometragem menor que a leitura atual.');
    const mounted=await fleet.tires.list();
    if(mounted.some(x=>x.id!==id&&x.payload.status==='installed'&&x.payload.assetId===assetId&&x.payload.position===position))fail('Essa posição já possui um pneu instalado.');
    return fleet.tires.save(installFleetTire(current.payload,{assetId,position,odometer}),{expectedVersion:current.version});
   },
   remove:async({id,odometer,reason,expectedVersion})=>{
    const current=await fleet.tires.get(id);if(!current)fail('Pneu não encontrado.');
    compare(current,expectedVersion);
    await assertVehicle(current.payload.assetId);
    return fleet.tires.save(removeFleetTire(current.payload,{odometer,reason}),{expectedVersion:current.version});
   }
  }},
  fuelings:{kind:'table-form',load:async()=>({rows:await fleet.fuelings.list()}),actions:{
   create:async input=>{
    await assertVehicle(input.assetId);
    if(input.supplierPartyId&&!await fleet.suppliers.get(input.supplierPartyId))fail('Fornecedor não encontrado.');
    const fuel=createFleetFueling(input);
    return fleet.fuelings.save(fuel,{expectedVersion:0});
   }
  }}
 };
 return Object.freeze({screens,stockSnapshot,verifyParts,applyStock,reserveStock,allFinanceRecords,completedOrderLines});
}
