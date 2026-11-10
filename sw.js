/* TerraFleet — service worker: hace que la app abra sin señal.
   - index.html y archivos sin versión: primero la red; si no hay, la copia guardada.
   - css/js con ?v=: primero la copia (cambian de nombre con cada versión).
   - version.txt y las llamadas a Supabase: siempre por red, nunca se guardan. */
const CACHE='terrafleet-v1';
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',function(e){
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  const propio=u.origin===self.location.origin;
  const fuente=/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(!propio&&!fuente)return;
  if(u.pathname.endsWith('version.txt'))return;
  e.respondWith((async function(){
    const cache=await caches.open(CACHE);
    const esDoc=r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('index.html');
    if(propio&&u.search&&!esDoc){
      const hit=await cache.match(r);
      if(hit)return hit;
      const res=await fetch(r);
      if(res.ok){
        cache.put(r,res.clone());
        /* borrar versiones viejas del mismo archivo */
        cache.keys().then(function(ks){ks.forEach(function(k){const ku=new URL(k.url);if(ku.pathname===u.pathname&&ku.search!==u.search)cache.delete(k)})});
      }
      return res;
    }
    try{
      const res=await fetch(r);
      if(res.ok||res.type==='opaque')cache.put(r,res.clone());
      return res;
    }catch(err){
      const hit=await cache.match(r,{ignoreSearch:esDoc});
      if(hit)return hit;
      throw err;
    }
  })());
});
