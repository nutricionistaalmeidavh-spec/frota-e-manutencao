const CACHE='artisys-frota-shell-v1';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/','/manifest.webmanifest','/icon.svg']))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok&&url.pathname!=='/certificate.crt'){
   const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));
  }
  return response;
 }).catch(async()=>await caches.match(event.request)||new Response('Computador offline. Conecte ao mesmo Wi-Fi e abra o Frota do Windows.',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}})));
});
