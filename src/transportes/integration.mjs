import {createEntityRepository,createFinancialEntry} from '../../shared/core.mjs';
import {createFleetDriver} from '../catalog.js';
import {createFreightContract,calculateFreightPrice,createRoutePlan,createFreightOrder,dispatchFreight,completeFreight,addFreightStatusEvent,registerFreightIncident,cancelFreight} from './domain.mjs';

const must=(x,label)=>{if(!x)throw new Error(label+' não encontrado.');return x};
const identity=x=>String(x??'').trim();
const cost=arr=>arr.reduce((sum,x)=>sum+x.payload.amountMinor,0);
export function createTransportIntegration({persistence,fleet,finance}){
 const drivers=fleet.drivers; // ÚNICO cadastro de motoristas do produto
 const contracts=createEntityRepository(persistence,{collection:'freight.contracts'});
 const routes=createEntityRepository(persistence,{collection:'freight.routes'});
 const orders=createEntityRepository(persistence,{collection:'freight.orders'});
 async function mutate({id,expectedVersion},transform){
  const current=must(await orders.get(identity(id)),'Frete');
  if(expectedVersion!=null&&Number(expectedVersion)!==current.version)throw new Error('O frete foi atualizado. Atualize a lista antes de continuar.');
  return orders.save(await transform(current.payload),{expectedVersion:current.version});
 }
 async function saveExisting(repo,id,make,input,{idKey='id'}={}){
  const current=await repo.get(id);
  if(input.expectedVersion!=null&&Number(input.expectedVersion)!==(current?.version??0))throw new Error('Cadastro atualizado. Reabra antes de salvar.');
  const entity=make({...current?.payload,...input,[idKey]:id});
  return repo.save(entity,{expectedVersion:current?.version??0});
 }
 const screens={
  drivers:{kind:'table-form',load:async()=>({rows:await drivers.list()}),actions:{save:async input=>{
   const id=identity(input.partyId);if(!id)throw new Error('Informe o código do motorista.');
   return saveExisting(drivers,id,createFleetDriver,input,{idKey:'partyId'});
  }}},
  'freight-routes':{kind:'table-form',load:async()=>({rows:await routes.list()}),actions:{save:async input=>{
   const id=identity(input.id);if(!id)throw new Error('Informe o código da rota.');
   return saveExisting(routes,id,createRoutePlan,input);
  }}},
  'freight-contracts':{kind:'table-form',load:async()=>({rows:await contracts.list()}),actions:{save:async input=>{
   const id=identity(input.id);if(!id)throw new Error('Informe o código do contrato.');
   return saveExisting(contracts,id,createFreightContract,input);
  }}},
  freights:{kind:'workflow',async load(){
   const [all,entries]=await Promise.all([orders.list(),finance.list()]);
   return {rows:all.map(record=>{
    const expenseMinor=cost(entries.filter(e=>e.payload.direction==='expense'&&e.payload.allocation?.kind==='freight'&&e.payload.allocation.id===record.payload.id));
    return {...record,payload:{...record.payload,expenseMinor,marginMinor:record.payload.priceMinor-expenseMinor}};
   })};
  },actions:{
   create:async input=>{
    let details={...input},priceMinor=input.priceMinor;
    if(input.routeId){
     const route=must(await routes.get(identity(input.routeId)),'Rota').payload;
     if(route.origin!==input.origin||route.destination!==input.destination)throw new Error('Origem e destino devem corresponder à rota selecionada.');
     details.distanceKm=route.distanceKm;
    }
    if(input.contractId){
     const contract=must(await contracts.get(identity(input.contractId)),'Contrato').payload;
     if(contract.customerPartyId!==input.customerPartyId)throw new Error('O contrato pertence a outro cliente.');
     if(priceMinor==null)priceMinor=calculateFreightPrice(contract,{distanceKm:details.distanceKm??0,weightKg:input.weightKg??0});
    }
    return orders.save(createFreightOrder({...details,priceMinor}),{expectedVersion:0});
   },
   dispatch:input=>mutate(input,async current=>{
    const vehicle=must(await fleet.vehicles.get(identity(input.vehicleAssetId)),'Veículo');
    const driver=must(await drivers.get(identity(input.driverPartyId)),'Motorista');
    if(driver.payload.status==='inactive')throw new Error('Motorista inativo.');
    if(Date.parse(driver.payload.licenseExpiresAt)<Date.now())throw new Error('CNH do motorista vencida.');
    if(Number(input.odometerStart)<Number(vehicle.payload.odometer??0))throw new Error('Quilometragem de saída menor que a leitura atual do veículo.');
    return dispatchFreight(current,input);
   }),
   event:input=>mutate(input,current=>addFreightStatusEvent(current,input)),
   incident:input=>mutate(input,current=>registerFreightIncident(current,input)),
   complete:input=>mutate(input,current=>completeFreight(current,input)),
   cancel:input=>mutate(input,current=>cancelFreight(current,input)),
   tripExpense:async input=>{
    const current=must(await orders.get(identity(input.id)),'Frete');
    if(input.expectedVersion!=null&&Number(input.expectedVersion)!==current.version)throw new Error('O frete foi atualizado. Reabra antes de lançar a despesa.');
    if(!['in-transit','completed'].includes(current.payload.status))throw new Error('Despesa de viagem exige um frete despachado.');
    const id=identity(input.expenseId);if(!id)throw new Error('Identificador da despesa obrigatório.');
    if(await finance.get(id,{includeDeleted:true}))throw new Error('Despesa já existente. Não foi duplicada.');
    const amountMinor=Number(input.amountMinor);
    const entry=createFinancialEntry({id,direction:'expense',amountMinor,description:identity(input.description),allocation:{kind:'freight',id:current.payload.id},metadata:{freightId:current.payload.id,vehicleAssetId:current.payload.vehicleAssetId,category:identity(input.category)}});
    return finance.save(entry,{expectedVersion:0});
   }
  }}
 };
 async function reportRows(){
  const records=(await screens.freights.load()).rows;
  return records.map(r=>({id:r.payload.id,vehicleAssetId:r.payload.vehicleAssetId??'',driverPartyId:r.payload.driverPartyId??'',origin:r.payload.origin,destination:r.payload.destination,status:r.payload.status,priceMinor:r.payload.priceMinor,expenseMinor:r.payload.expenseMinor,marginMinor:r.payload.marginMinor,distanceKm:r.payload.distanceKm??0}));
 }
 async function dashboard(){
  const records=(await screens.freights.load()).rows.map(x=>x.payload);
  return {plannedFreights:records.filter(x=>x.status==='planned').length,inTransitFreights:records.filter(x=>x.status==='in-transit').length,completedFreights:records.filter(x=>x.status==='completed').length};
 }
 return Object.freeze({screens,reportRows,dashboard});
}
