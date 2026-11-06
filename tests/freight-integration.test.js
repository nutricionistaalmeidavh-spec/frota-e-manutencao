import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStandaloneHost} from '../runtime/host.mjs';
import {getActionFields,allowedActions,buildActionInput} from '../web/action-model.mjs';

async function setup(fn){
 const dir=await mkdtemp(join(tmpdir(),'frota-fretes-'));
 const h=await createStandaloneHost({dataDir:dir});
 try {
  await h.backend.bootstrap({username:'admin',password:'frete-test-123'});
  const session=await h.backend.login({username:'admin',password:'frete-test-123'});
  const auth={sessionId:session.session.id,token:session.token};
  const call=(screenId,action,input)=>h.backend.action({screenId,action,input,auth});
  const load=screenId=>h.backend.load({screenId,auth});
  await fn({h,auth,call,load});
 } finally {await h.close();await rm(dir,{recursive:true,force:true})}
}

test('frete usa veículo e motorista CANÔNICOS e impede despachar referências inexistentes',()=>setup(async({call,load,h})=>{
 const createdVehicle=await call('fleet','save',{assetId:'CAM-1',plate:'ABC1D23',odometer:1200,hourmeter:32});
 await call('drivers','save',{partyId:'MOT-1',licenseNumber:'01234567890',licenseCategory:'D',licenseExpiresAt:'2028-12-31T12:00:00.000Z'});
 const order=await call('freights','create',{id:'FRT-1',customerPartyId:'CLI-1',origin:'Ribeirão Preto',destination:'Uberaba',cargoDescription:'Peças',priceMinor:65000});
 assert.equal(order.payload.status,'planned');
 await assert.rejects(()=>call('freights','dispatch',{id:'FRT-1',vehicleAssetId:'INV',driverPartyId:'MOT-1',expectedVersion:1}),/veículo/i);
 await assert.rejects(()=>call('freights','dispatch',{id:'FRT-1',vehicleAssetId:'CAM-1',driverPartyId:'INV',expectedVersion:1}),/motorista/i);
 const moving=await call('freights','dispatch',{id:'FRT-1',vehicleAssetId:'CAM-1',driverPartyId:'MOT-1',odometerStart:1200,expectedVersion:1});
 assert.equal(moving.payload.status,'in-transit');
 assert.equal(moving.payload.vehicleAssetId,createdVehicle.payload.assetId);
 const vehicle=await load('fleet');assert.equal(vehicle.rows.length,1);
 const drivers=await h.persistence.listRecords('fleet.drivers');assert.equal(drivers.length,1);
 assert.equal((await h.persistence.listRecords('freight.drivers')).length,0);
 await assert.rejects(()=>call('freights','complete',{id:'FRT-1',expectedVersion:1,odometerEnd:1300}),/atualizad|versão|versao|revisão/i);
 const end=await call('freights','complete',{id:'FRT-1',expectedVersion:2,odometerEnd:1300});
 assert.equal(end.payload.status,'completed');
 assert.equal(end.payload.distanceKm,100);
}));

test('despesa de viagem gera um único lançamento financeiro canônico e alimenta margem/CSV',()=>setup(async({call,load,h})=>{
 await call('fleet','save',{assetId:'CAM-2',plate:'DEF2G34'});
 await call('drivers','save',{partyId:'MOT-2',licenseNumber:'123',licenseCategory:'E',licenseExpiresAt:'2028-12-31T12:00:00Z'});
 await call('freights','create',{id:'FRT-2',customerPartyId:'CLI-2',origin:'A',destination:'B',cargoDescription:'Grãos',priceMinor:100000});
 await call('freights','dispatch',{id:'FRT-2',vehicleAssetId:'CAM-2',driverPartyId:'MOT-2',odometerStart:0,expectedVersion:1});
 await call('freights','tripExpense',{id:'FRT-2',expenseId:'EXP-1',category:'toll',description:'Pedágio',amountMinor:15000});
 await assert.rejects(()=>call('freights','tripExpense',{id:'FRT-2',expenseId:'EXP-1',category:'toll',description:'Duplicado',amountMinor:1000}),/exist|duplicad/i);
 const finance=await load('finance');
 assert.equal(finance.rows.filter(x=>x.payload.id==='EXP-1').length,1);
 const summary=await load('freights');
 assert.equal(summary.rows[0].payload.expenseMinor,15000);
 assert.equal(summary.rows[0].payload.marginMinor,85000);
 const csv=await call('reports','csv',{type:'freight-margin',rows:[{id:'FAKE',marginMinor:999999}]});
 assert.match(csv.content,/FRT-2/);
 assert.doesNotMatch(csv.content,/FAKE/);
 assert.equal((await h.persistence.listRecords('freight.finance')).length,0);
}));

test('contrato e rota são persistidos sem duplicar veículos e frete pode precificar por km',()=>setup(async({call,load})=>{
 await call('freight-contracts','save',{id:'CONT-1',customerPartyId:'CLI-3',rateType:'per-km',rateMinor:220});
 await call('freight-routes','save',{id:'ROTA-1',origin:'RP',destination:'UB',distanceKm:200,tollEstimateMinor:3000});
 const order=await call('freights','create',{id:'FRT-3',customerPartyId:'CLI-3',contractId:'CONT-1',routeId:'ROTA-1',origin:'RP',destination:'UB',cargoDescription:'Carga teste'});
 assert.equal(order.payload.priceMinor,44000);
 assert.equal((await load('freight-contracts')).rows.length,1);
 assert.equal((await load('freight-routes')).rows.length,1);
}));

test('interface expõe ações coerentes com estado e monta payload sem inventar motorista/veículo',()=>{
 assert.deepEqual(allowedActions('freights'),['create']);
 assert.ok(allowedActions('freights',{payload:{status:'in-transit'}}).includes('complete'));
 assert.equal(allowedActions('freights',{payload:{status:'completed'}}).includes('dispatch'),false);
 const fields=getActionFields('freights','dispatch',{vehicles:[{assetId:'CAM-1',plate:'ABC1D23'}],drivers:[{partyId:'MOT-1',licenseNumber:'123'}]});
 assert.ok(fields.some(x=>x.key==='vehicleAssetId'&&x.options?.[0]?.value==='CAM-1'));
 assert.ok(fields.some(x=>x.key==='driverPartyId'&&x.options?.[0]?.value==='MOT-1'));
 const input=buildActionInput('freights','tripExpense',[
  {key:'category',label:'Categoria',type:'text',required:true},
  {key:'amountMinor',label:'Valor',type:'money',required:true,min:0.01}
 ],{category:'fuel',amountMinor:'123.45'},{selected:{payload:{id:'FRT-2'},version:2},uuid:()=> 'EXP-1'});
 assert.equal(input.expenseId,'EXP-1');
 assert.equal(input.id,'FRT-2');
 assert.equal(input.amountMinor,12345);
});
