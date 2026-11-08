const CACHE='hf-offline-v4-study';
const CORE=['/','/index.html','/style.css','/book.css','/app.js','/core.js','/study-guides.js','/presentation.js','/sync.js','/sync-config.json','/icon.svg','/manifest.webmanifest',...['bible','devotionals','quiz','lessons','summaries','dictionary','timeline'].map(x=>`/data/${x}.json`)];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{
 const current=await caches.open(CACHE);
 for(const name of await caches.keys()){
  if(name===CACHE||!name.startsWith('hf-offline-'))continue;
  const previous=await caches.open(name);
  for(const request of await previous.keys()){
   if(new URL(request.url).pathname.startsWith('/data/original/')&&!(await current.match(request))){const response=await previous.match(request);if(response)await current.put(request,response);}
  }
  await caches.delete(name);
 }
 await self.clients.claim();
})());});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;}).catch(async()=>{
  const cached=await caches.match(event.request);if(cached)return cached;
  if(event.request.mode==='navigate'){const page=await caches.match('/index.html');if(page)return page;}
  return new Response('Arquivo indisponível offline.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 }));
});
