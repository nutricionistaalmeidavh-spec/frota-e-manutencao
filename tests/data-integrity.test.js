
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStandaloneHost} from '../runtime/host.mjs';

async function withHost(fn){
 const dir=await mkdtemp(join(tmpdir(),'frota-canonical-'));const h=await createStandaloneHost({dataDir:dir});
 try{await h.backend.bootstrap({username:'admin',password:'strong-test-password'});const login=await h.backend.login({username:'admin',password:'strong-test-password'});const auth={sessionId:login.session.id,token:login.token};await fn(h,auth)}
 finally{await h.close();await rm(dir,{recursive:true,force:true})}
}
test('veículo mantém identidade e versão; leitura rejeita retrocesso e revisão antiga',()=>withHost(async(h,auth)=>{
 const call=(screenId,action,input)=>h.backend.action({screenId,action,input,auth});
 const created=await call('fleet','save',{assetId:'CAM-001',plate:'abc1d23',odometer:1500,hourmeter:100});
 assert.equal(created.payload.plate,'ABC1D23');
 assert.equal(created.version,1);
 const reading=await call('readings','save',{assetId:'CAM-001',odometer:1550,hourmeter:101,expectedVersion:1});
 assert.equal(reading.version,2);
 assert.equal(reading.payload.odometer,1550);
 await assert.rejects(()=>call('fleet','save',{assetId:'CAM-001',plate:'ABC1D23',odometer:1600,expectedVersion:1}),/mudou/i);
 await assert.rejects(()=>call('readings','save',{assetId:'CAM-001',odometer:1500,hourmeter:101,expectedVersion:2}),/voltar/i);
 const list=await h.backend.load({screenId:'fleet',auth});
 assert.equal(list.rows.length,1);
 assert.equal(list.rows[0].payload.assetId,'CAM-001');
 assert.equal(list.rows[0].payload.odometer,1550);
}));
test('relatório de custos usa lançamentos canônicos e ignora linhas manipuladas pelo cliente',()=>withHost(async(h,auth)=>{
 const call=(screenId,action,input)=>h.backend.action({screenId,action,input,auth});
 await call('fleet','save',{assetId:'CAM-001',plate:'AAA1A11',odometer:1000});
 await call('finance','addExpense',{id:'desp-1',assetId:'CAM-001',amountMinor:12345,description:'Troca de pneu',category:'maintenance'});
 const csv=await call('reports','csv',{type:'vehicle-cost',rows:[{assetId:'FALSO',expenseMinor:9999999}]});
 assert.match(csv.content,/CAM-001,1000,12345,12/);
 assert.doesNotMatch(csv.content,/FALSO/);
 const issued=await call('reports','issue',{type:'vehicle-cost',id:'rel-1'});
 assert.equal(issued.id,'rel-1');
 const screen=await h.backend.load({screenId:'reports',auth});
 assert.equal(screen.issued.length,1);
 await assert.rejects(()=>call('finance','addExpense',{id:'desp-2',assetId:'inexistente',amountMinor:100,description:'Sem veículo'}),/não encontrado/i);
}));
test('OS preserva o fluxo canônico e protege alterações concorrentes',()=>withHost(async(h,auth)=>{
 const call=(screenId,action,input)=>h.backend.action({screenId,action,input,auth});
 await call('fleet','save',{assetId:'CAM-002',plate:'BBB1B22'});
 const os=await call('work-orders','create',{id:'OS-001',assetId:'CAM-002',title:'Troca do filtro'});
 assert.equal(os.payload.status,'draft');
 await assert.rejects(()=>call('work-orders','start',{id:'OS-001',technicianPartyId:'TEC-1'}),/authorized/i);
 const authorized=await call('work-orders','authorize',{id:'OS-001',authorizedByPartyId:'RESP-1',expectedVersion:1});
 assert.equal(authorized.payload.status,'authorized');
 await assert.rejects(()=>call('work-orders','start',{id:'OS-001',technicianPartyId:'TEC-1',expectedVersion:1}),/mudou/i);
 const started=await call('work-orders','start',{id:'OS-001',technicianPartyId:'TEC-1',expectedVersion:2});
 assert.equal(started.payload.status,'in-progress');
}));
