/* Cobra Certo: modo offline. A página sempre tenta a internet primeiro (assim as atualizações chegam) e cai para a cópia guardada quando não há sinal. */
var VERSAO = 'cobra-certo-v1';
var ARQUIVOS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSAO).then(function(c){ return c.addAll(ARQUIVOS); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== VERSAO; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var fonte = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fonte) return;
  if (fonte) {
    e.respondWith(caches.open(VERSAO).then(function(c){
      return c.match(req).then(function(hit){
        var rede = fetch(req).then(function(r){ c.put(req, r.clone()); return r; }).catch(function(){ return hit; });
        return hit || rede;
      });
    }));
    return;
  }
  e.respondWith(fetch(req).then(function(r){
    var copia = r.clone();
    caches.open(VERSAO).then(function(c){ c.put(req, copia); });
    return r;
  }).catch(function(){
    return caches.match(req).then(function(hit){ return hit || caches.match('index.html'); });
  }));
});
