import {createServer} from 'node:https';
import {randomBytes,createHash,X509Certificate} from 'node:crypto';
import {networkInterfaces} from 'node:os';
import {join,resolve,sep,extname} from 'node:path';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import selfsigned from 'selfsigned';

const DEFAULT_PORT=8787;
const METHODS=new Set(['authState','describe','login','validate','logout','load','action']);
const MIME={'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.html':'text/html; charset=utf-8','.json':'application/json; charset=utf-8',
 '.webmanifest':'application/manifest+json','.svg':'image/svg+xml',
 '.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
const fingerprint=pem=>new X509Certificate(pem).fingerprint256;
const sha=value=>createHash('sha256').update(value).digest('hex');
const ips=()=>[...new Set(Object.values(networkInterfaces()).flat().filter(n=>n?.family==='IPv4'&&!n.internal).map(n=>n.address))].sort((a,b)=>{
 const priority=x=>x.startsWith('192.168.')?0:x.startsWith('10.')?1:x.startsWith('172.')?2:3;
 return priority(a)-priority(b);
});
const json=(res,status,value)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(value))};
async function readJson(req){
 if(!req.headers['content-type']?.toLowerCase().startsWith('application/json'))throw Error('Envie JSON.');
 let size=0,parts=[];
 for await(const chunk of req){size+=chunk.length;if(size>128*1024)throw Error('Requisicao muito grande.');parts.push(chunk)}
 return JSON.parse(Buffer.concat(parts).toString('utf8')||'{}');
}
function activeIp(host){return host==='127.0.0.1'?'127.0.0.1':ips()[0]??null}
async function tlsMaterial(dir,addresses){
 await mkdir(dir,{recursive:true});
 const path=join(dir,'mobile-tls.json');
 try{
  const item=JSON.parse(await readFile(path,'utf8'));
  const valid=new X509Certificate(item.cert).validTo;
  if(Date.parse(valid)>Date.now()+7*86400000&&addresses.every(ip=>item.addresses.includes(ip))&&item.privateKey&&item.cert)return item;
 }catch{}
 const result=await selfsigned.generate([{name:'commonName',value:'ArtiSys Frota (rede local)'}],{
  keySize:2048,days:365,algorithm:'sha256',extensions:[
    {name:'basicConstraints',cA:true},
    {name:'keyUsage',keyCertSign:true,digitalSignature:true,keyEncipherment:true},
    {name:'extKeyUsage',serverAuth:true},
    {name:'subjectAltName',altNames:addresses.map(ip=>({type:7,ip}))}
  ]
 });
 const item={privateKey:result.private,cert:result.cert,addresses};
 await writeFile(path,JSON.stringify(item),{mode:0o600});
 return item;
}
export function createMobileAccess({dataDir,distDir,backend}){
 if(!dataDir||!distDir||!backend)throw Error('Dados, interface e backend obrigatorios.');
 let server=null,info=null,code=null,codeUntil=0,used=false;
 const tokens=new Map(),attempts=new Map();
 const rotate=()=>{code=String(Math.floor(Math.random()*1e8)).padStart(8,'0');codeUntil=Date.now()+5*60000;used=false;return code};
 const status=()=>info?{enabled:true,url:info.url,addresses:info.addresses,port:info.port,
  pairingCode:used||Date.now()>codeUntil?null:code,pairingExpiresAt:codeUntil,
  certificateFingerprint:info.certificateFingerprint}:{enabled:false};
 const allowedOrigin=(req,port,allowed)=>{const origin=req.headers.origin;
  if(!origin)return false;
  try{const u=new URL(origin);return u.protocol==='https:'&&Number(u.port||443)===port&&allowed.includes(u.hostname)}catch{return false}
 };
 const replyError=(res,status,message)=>json(res,status,{error:message});
 return {
  status,
  async start({host='0.0.0.0',port=DEFAULT_PORT}={}){
   if(server)return status();
   if(!(await backend.authState()).hasUsers)throw Error('Configure um administrador no Windows antes de liberar o celular.');
   if(host!=='0.0.0.0'&&host!=='127.0.0.1')throw Error('Endereco de escuta invalido.');
   const address=activeIp(host);
   if(!address)throw Error('Conecte o computador a uma rede local antes de habilitar o celular.');
   const addresses=host==='127.0.0.1'?['127.0.0.1']:[...new Set([...ips(),'127.0.0.1'])];
   const tls=await tlsMaterial(dataDir,addresses);
   const root=resolve(distDir);
   const listener=createServer({key:tls.privateKey,cert:tls.cert},async(req,res)=>{
    res.setHeader('x-content-type-options','nosniff');
    res.setHeader('referrer-policy','no-referrer');
    res.setHeader('x-frame-options','DENY');
    res.setHeader('content-security-policy',"default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'");
    let path;
    try{path=new URL(req.url,'https://localhost').pathname}catch{return replyError(res,400,'Caminho invalido.')}
    if(req.method==='POST'&&(path==='/api/pair'||path==='/api/rpc')){
     try{
      if(path==='/api/rpc'){
       const token=req.headers.authorization?.replace(/^Bearer /i,'');
       const expires=token&&tokens.get(sha(token));
       if(!expires||expires<Date.now())return replyError(res,401,'Pareie novamente o celular.');
       if(!allowedOrigin(req,listener.address().port,addresses))return replyError(res,403,'Origem nao autorizada.');
       const {method,params}=await readJson(req);
       if(!METHODS.has(method))return replyError(res,403,'Operacao nao permitida.');
       const result=await backend[method](params);
       return json(res,200,{result});
      }
      if(!allowedOrigin(req,listener.address().port,addresses))return replyError(res,403,'Origem nao autorizada.');
      const ip=req.socket.remoteAddress??'unknown',now=Date.now();
      const recent=(attempts.get(ip)??[]).filter(t=>now-t<300000);
      if(recent.length>=5)return replyError(res,429,'Tentativas excedidas. Aguarde cinco minutos.');
      const {code:provided}=await readJson(req);
      if(used||now>codeUntil||typeof provided!=='string'||provided!==code){
       recent.push(now);attempts.set(ip,recent);return replyError(res,403,'Codigo invalido ou expirado.');
      }
      used=true;code=null;
      const token=randomBytes(32).toString('base64url');
      tokens.set(sha(token),Date.now()+8*60*60*1000);
      return json(res,200,{token});
     }catch(e){return replyError(res,400,e?.message||'Requisicao invalida.')}
    }
    if(req.method!=='GET'&&req.method!=='HEAD')return replyError(res,405,'Metodo nao permitido.');
    if(path.startsWith('/api/'))return replyError(res,404,'Nao encontrado.');
    if(path==='/certificate.crt'){
     res.writeHead(200,{'content-type':'application/x-x509-ca-cert','content-disposition':'attachment; filename="artisys-frota-local.crt"','cache-control':'no-store'});return res.end(tls.cert);
    }
    let relative;
    try{relative=decodeURIComponent(path)}catch{return replyError(res,400,'Caminho invalido.')}
    if(relative.includes('\0'))return replyError(res,400,'Caminho invalido.');
    const filename=relative==='/'?'index.html':relative.replace(/^\/+/,''),target=resolve(root,filename);
    if(target!==join(root,'index.html')&&!target.startsWith(root+sep))return replyError(res,403,'Caminho nao permitido.');
    try{
     let content=await readFile(target);
     if(filename==='index.html')content=Buffer.from(content.toString('utf8').replace('</head>','<script>window.__ARTISYS_REMOTE__=true;</script></head>'));
     res.writeHead(200,{'content-type':MIME[extname(filename)]??'application/octet-stream','cache-control':filename==='index.html'?'no-store':'public, max-age=3600'});
     return req.method==='HEAD'?res.end():res.end(content);
    }catch{return replyError(res,404,'Arquivo nao encontrado.')}
   });
   try{
    await new Promise((ok,fail)=>{listener.once('error',fail);listener.listen(port,host,()=>{listener.off('error',fail);ok()})});
   }catch(e){listener.close();throw e}
   server=listener;
   info={url:'https://'+address+':'+server.address().port,
    addresses,port:server.address().port,certificateFingerprint:fingerprint(tls.cert)};
   tokens.clear();attempts.clear();rotate();
   return status();
  },
  newCode(){if(!server)throw Error('Ative o acesso pelo celular primeiro.');rotate();return status()},
  async stop(){
   if(!server)return;
   const current=server;server=null;info=null;code=null;tokens.clear();attempts.clear();
   current.closeAllConnections?.();
   await new Promise(resolve=>current.close(()=>resolve()));
  }
 };
}
