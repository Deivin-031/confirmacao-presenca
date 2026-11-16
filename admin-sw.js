// Apenas os arquivos visuais do painel sao armazenados. Dados e APIs nunca sao interceptados.
const CACHE = 'casamento-admin-shell-v1';
const ASSETS = ['./admin.html','./styles.css','./admin-app.css','./admin-app.js','./admin-icon-192.png','./admin-icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('casamento-admin-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
// Network-first somente para arquivos do shell; evita versoes antigas do painel.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !ASSETS.some(asset => url.pathname === new URL(asset, self.registration.scope).pathname)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
    return response;
  }).catch(() => caches.match(event.request)));
});
