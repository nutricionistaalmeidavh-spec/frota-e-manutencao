import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {request} from 'node:https';
import {createMobileAccess} from '../runtime/mobile-access.mjs';

const post=(port,path,body,{token,origin}={})=>new Promise((resolve,reject)=>{
 const payload=Buffer.from(JSON.stringify(body));
 const req=request({hostname:'127.0.0.1',port,path,method:'POST',rejectUnauthorized:false,
  headers:{'content-type':'application/json','content-length':payload.length,
    ...(token?{'authorization':'Bearer '+token}:{}),...(origin?{origin}:{} )}},res=>{
   let data='';res.on('data',c=>data+=c);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(data)}));
 });req.on('error',reject);req.end(payload);
});
test('celular requer pareamento, usuario existente e bloqueia bootstrap remoto',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'frota-mobile-'));
 const dist=join(dir,'dist');await import('node:fs/promises').then(fs=>fs.mkdir(dist));
 await writeFile(join(dist,'index.html'),'<html><head></head><body>Frota</body></html>');
 const calls=[];
 const backend={authState:async()=>({hasUsers:true}),login:async v=>{calls.push(['login',v]);return {token:'ok',session:{id:'s'}}},describe:async()=>({productId:'fleet-maintenance'}),load:async()=>({rows:[]})};
 let mobile;
 try{
  mobile=createMobileAccess({dataDir:dir,distDir:dist,backend});
  const status=await mobile.start({port:0,host:'127.0.0.1'});
  const origin=status.url;
  assert.ok(origin.startsWith('https://'));
  const port=Number(new URL(origin).port);
  assert.equal((await post(port,'/api/rpc',{method:'login',params:{username:'admin'}})).status,401);
  assert.equal((await post(port,'/api/pair',{code:'000000'}, {origin})).status,403);
  const pair=await post(port,'/api/pair',{code:status.pairingCode},{origin});
  assert.equal(pair.status,200);assert.ok(pair.body.token);
  assert.equal((await post(port,'/api/rpc',{method:'bootstrap',params:{}},{token:pair.body.token,origin})).status,403);
  assert.equal((await post(port,'/api/rpc',{method:'login',params:{username:'admin',password:'senha'}},{token:pair.body.token,origin})).status,200);
  assert.equal(calls.length,1);
  assert.equal((await post(port,'/api/rpc',{method:'describe'},{token:pair.body.token,origin:'https://bad.example'})).status,403);
  await mobile.stop();
  await assert.rejects(post(port,'/api/rpc',{method:'describe'},{token:pair.body.token,origin}));
 }finally{await mobile?.stop();await rm(dir,{recursive:true,force:true})}
});
test('pareamento exige usuario previamente configurado no Windows',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'frota-mobile-'));
 let mobile;
 try{
  mobile=createMobileAccess({dataDir:dir,distDir:dir,backend:{authState:async()=>({hasUsers:false})}});
  await assert.rejects(mobile.start({host:'127.0.0.1',port:0}),/administrador|usuário|usuario/i);
 }finally{await mobile?.stop();await rm(dir,{recursive:true,force:true})}
});
