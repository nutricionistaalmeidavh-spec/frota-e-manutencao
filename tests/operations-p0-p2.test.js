import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStandaloneHost} from '../runtime/host.mjs';

async function scenario(fn){
 const dir=await mkdtemp(join(tmpdir(),'frota-p0-p2-'));
 const h=await createStandaloneHost({dataDir:dir});
 try {
  await h.backend.bootstrap({username:'admin',password:'strong-password-2026'});
  const s=await h.backend.login({username:'admin',password:'strong-password-2026'});
  const auth={sessionId:s.session.id,token:s.token};
  const call=(screenId,action,input)=>h.backend.action({screenId,action,input,auth});
  const load=screenId=>h.backend.load({screenId,auth});
  await fn({h,call,load,auth});
 } finally {await h.close();await rm(dir,{force:true,recursive:true});}
}

test('P0 leitura canônica atualiza vencimento dos planos sem duplicar medidores',()=>scenario(async({call,load})=>{
 await call('fleet','save',{assetId:'CAM-P0',plate:'ABC1D23',odometer:1000,hourmeter:15});
 await call('preventive-plans','create',{id:'PLAN-P0',assetId:'CAM-P0',name:'Óleo',trigger:{metric:'odometer',interval:100,baseline:1000}});
 await call('readings','save',{assetId:'CAM-P0',odometer:1100,hourmeter:16,expectedVersion:1});
 const plans=await load('preventive-plans');
 assert.equal(plans.rows[0].due.due,true);
 assert.equal(plans.rows[0].due.current,1100);
 assert.equal((await load('overview')).cards.maintenanceDue,1);
}));

test('P0 OS preventiva concluída reinicia vencimento pelo serviço realizado sem recalcular histórico',()=>scenario(async({call,load})=>{
 await call('fleet','save',{assetId:'CAM-OS',plate:'BBB1B22',odometer:1000,hourmeter:40});
 await call('preventive-plans','create',{id:'PLAN-OS',assetId:'CAM-OS',name:'Filtro',trigger:{metric:'odometer',interval:100,baseline:1000}});
 await call('readings','save',{assetId:'CAM-OS',odometer:1110,hourmeter:45});
 await call('work-orders','create',{id:'OS-CYCLE',assetId:'CAM-OS',type:'preventive',sourceRef:'PLAN-OS',title:'Troca preventiva'});
 await call('work-orders','authorize',{id:'OS-CYCLE',authorizedByPartyId:'RESP'});
 await call('work-orders','start',{id:'OS-CYCLE',technicianPartyId:'TEC'});
 await call('work-orders','complete',{id:'OS-CYCLE',meterReading:1110});
 const after=await load('preventive-plans');
 assert.equal(after.rows[0].due.due,false);
 assert.equal(after.rows[0].due.dueAt,1210);
 assert.equal((await load('overview')).cards.maintenanceDue,0);
 await call('readings','save',{assetId:'CAM-OS',odometer:1210,hourmeter:50});
 assert.equal((await load('preventive-plans')).rows[0].due.due,true);
 await assert.rejects(()=>call('work-orders','complete',{id:'OS-CYCLE',meterReading:1210}),/in-progress/i);
}));

test('P0 configuração protege backup e restauração contra usuários não administradores',()=>scenario(async({h,auth,load,call})=>{
 const session=await h.backend.validate(auth);
 const userId=session.user.id;
 const old=await h.persistence.getRecord('security-users:fleet-maintenance',userId);
 await h.persistence.putRecord('security-users:fleet-maintenance',userId,{...old.payload,roles:['viewer']},{expectedVersion:old.version});
 await assert.rejects(()=>call('settings','backup',{}),/permission denied/i);
 await assert.rejects(()=>call('settings','restore',{id:'fake'}),/permission denied/i);
 await assert.rejects(()=>load('settings'),/permission denied/i);
}));

test('P1 conclusão da OS efetiva custos e consumo canônicos sem duplicidade',()=>scenario(async({call,load,h})=>{
 await call('fleet','save',{assetId:'CAM-S',plate:'CCC1C33',odometer:500});
 await call('inventory','receive',{sku:'FILTRO',quantity:5});
 await call('work-orders','create',{id:'OS-CUSTO',assetId:'CAM-S',type:'corrective',title:'Serviço'});
 await call('work-orders','addItem',{id:'OS-CUSTO',item:{id:'ITEM-1',type:'part',sku:'FILTRO',description:'Filtro de óleo',quantity:2,unitCostMinor:1000}});
 await call('work-orders','addItem',{id:'OS-CUSTO',item:{id:'ITEM-2',type:'service',description:'Mão de obra',quantity:1,unitCostMinor:3000}});
 await call('work-orders','authorize',{id:'OS-CUSTO',authorizedByPartyId:'RESP'});
 await call('work-orders','start',{id:'OS-CUSTO',technicianPartyId:'TEC'});
 await call('work-orders','complete',{id:'OS-CUSTO'});
 const stock=await load('inventory');assert.equal(stock.state.FILTRO.onHand,3);
 const f=await load('finance');assert.equal(f.rows.filter(x=>x.payload.metadata?.workOrderId==='OS-CUSTO').length,1);
 assert.equal(f.rows.find(x=>x.payload.metadata?.workOrderId==='OS-CUSTO').payload.amountMinor,5000);
 assert.equal((await h.persistence.listRecords('fleet-maintenance.finance')).length,0);
 await assert.rejects(()=>call('inventory','consume',{sku:'FILTRO',quantity:4}),/insufficient|insuficiente/i);
 const csv=await call('reports','csv',{type:'vehicle-cost'});
 assert.match(csv.content,/CAM-S,500,5000,10/);
}));

test('P1 OS não finaliza sem saldo suficiente ou sem código canônico da peça',()=>scenario(async({call,load})=>{
 await call('fleet','save',{assetId:'CAM-N',plate:'DDD1D44'});
 await call('inventory','receive',{sku:'PECA',quantity:1});
 await call('work-orders','create',{id:'OS-N',assetId:'CAM-N',title:'Reparo'});
 await assert.rejects(()=>call('work-orders','addItem',{id:'OS-N',item:{id:'X',type:'part',description:'Peça sem código',quantity:1}}),/SKU|código/i);
 await call('work-orders','addItem',{id:'OS-N',item:{id:'Y',type:'part',sku:'PECA',description:'Peça',quantity:2,unitCostMinor:100}});
 await call('work-orders','authorize',{id:'OS-N',authorizedByPartyId:'RESP'});
 await call('work-orders','start',{id:'OS-N',technicianPartyId:'TEC'});
 await assert.rejects(()=>call('work-orders','complete',{id:'OS-N'}),/estoque|saldo|insuficiente/i);
 assert.equal((await load('work-orders')).rows[0].payload.status,'in-progress');
}));

test('P1 cadastros e abastecimentos utilizam as coleções canônicas da frota',()=>scenario(async({call,load,h})=>{
 await call('fleet','save',{assetId:'CAM-F',plate:'EEE1E55',odometer:1000});
 await call('suppliers','save',{partyId:'POSTO-1',name:'Posto Centro',categories:['fuel']});
 await call('documents','save',{id:'DOC-1',assetId:'CAM-F',type:'licenciamento',number:'2026',expiresAt:'2027-12-31T12:00:00Z'});
 await call('tires','save',{id:'PNEU-1',serialNumber:'PN-1'});
 await call('tires','install',{id:'PNEU-1',assetId:'CAM-F',position:'DD',odometer:1000});
 await call('fuelings','create',{id:'ABAST-1',assetId:'CAM-F',supplierPartyId:'POSTO-1',liters:50,unitPriceMinor:600,odometer:1020,occurredAt:'2026-11-06T10:00:00Z'});
 assert.equal((await load('suppliers')).rows.length,1);
 assert.equal((await load('documents')).rows.length,1);
 assert.equal((await load('tires')).rows[0].payload.status,'installed');
 assert.equal((await load('fuelings')).rows[0].payload.totalMinor,30000);
 assert.equal((await load('finance')).rows.some(x=>x.payload.metadata?.fuelingId==='ABAST-1'),true);
 assert.equal((await h.persistence.listRecords('fleet.fuelings')).length,1);
 assert.equal((await h.persistence.listRecords('freight.fuelings')).length,0);
 await call('tires','remove',{id:'PNEU-1',odometer:1040,reason:'rodizio'});
 assert.equal((await load('tires')).rows[0].payload.distanceKm,40);
}));

test('P2 relatórios são calculados do banco e não de linhas forjadas pelo cliente',()=>scenario(async({call,load})=>{
 await call('fleet','save',{assetId:'CAM-R',plate:'FFF1F66',odometer:500});
 await call('fuelings','create',{id:'ABAST-R',assetId:'CAM-R',liters:30,unitPriceMinor:500,odometer:500,occurredAt:'2026-11-06T10:00:00Z'});
 await call('work-orders','create',{id:'OS-R',assetId:'CAM-R',title:'Revisão'});
 await call('work-orders','authorize',{id:'OS-R',authorizedByPartyId:'RESP'});
 await call('work-orders','start',{id:'OS-R',technicianPartyId:'TEC'});
 await call('work-orders','complete',{id:'OS-R'});
 for(const type of ['maintenance-history','fuel-consumption','operating-cost','freight-margin']){
  const csv=await call('reports','csv',{type,rows:[{id:'FAKE',assetId:'FAKE'}]});
  assert.ok(csv.content.includes('CAM-R')||csv.content.includes('OS-R')||type==='freight-margin');
  assert.doesNotMatch(csv.content,/FAKE/);
 }
 assert.equal((await load('overview')).cards.fuelCostMinor,15000);
}));
