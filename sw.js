const PREFIX='qingke-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE=PREFIX+'v1';
const ASSETS=['./','./index.html','./styles.css','./app.mjs','./core.mjs','./excel.mjs','./transfer.mjs','./vendor/jszip.min.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!ASSETS.some(asset=>new URL(asset,self.registration.scope).pathname===url.pathname))return;
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request).then(cached=>cached||fetch(event.request))));
});
