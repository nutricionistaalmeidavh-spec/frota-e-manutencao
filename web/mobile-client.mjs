const STORAGE='artisys-frota-mobile-pairing';
export function createMobileBackend({storage=globalThis.sessionStorage,request=globalThis.fetch}={}){
 let token=storage.getItem(STORAGE);
 const rpc=async(method,params)=>{
  if(!token)throw Error('Pareie o celular com o computador primeiro.');
  const response=await request('/api/rpc',{method:'POST',credentials:'same-origin',
   headers:{'content-type':'application/json',authorization:'Bearer '+token},
   body:JSON.stringify({method,params})});
  const body=await response.json();
  if(response.status===401){token=null;storage.removeItem(STORAGE);}
  if(!response.ok)throw Error(body.error||'Falha de conexao ao computador.');
  return body.result;
 };
 const api={
  paired:()=>!!token,
  async pair(code){
   const response=await request('/api/pair',{method:'POST',credentials:'same-origin',
    headers:{'content-type':'application/json'},body:JSON.stringify({code:String(code).trim()})});
   const body=await response.json();
   if(!response.ok)throw Error(body.error||'Nao foi possivel parear.');
   token=body.token;storage.setItem(STORAGE,token);
  },
  forget(){token=null;storage.removeItem(STORAGE)},
 };
 for(const method of ['describe','authState','login','validate','logout','load','action'])
  api[method]=params=>rpc(method,params);
 return Object.freeze(api);
}
