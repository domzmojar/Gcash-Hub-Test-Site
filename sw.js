// Cache version is stamped automatically by build.js on every Vercel deploy
var CACHE = 'cashhub-mqdok3fzth38';

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll([location.href]).catch(function(){});
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){
      return self.clients.claim();
    }).then(function(){
      return self.clients.matchAll({type:'window'}).then(function(clients){
        clients.forEach(function(c){
          c.postMessage({type:'SW_UPDATED', version: CACHE});
        });
      });
    })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request).then(function(r){
        var cl = r.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, cl); });
        return r;
      }).catch(function(){
        return caches.match(e.request).then(function(r){
          return r || new Response(
            '<h2 style="font-family:sans-serif;text-align:center;margin-top:40px">You are offline.<br><small>Open CashHub when connected to get the latest version.</small></h2>',
            {status:503, headers:{'Content-Type':'text/html'}}
          );
        });
      })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(function(r){
        return r || fetch(e.request).catch(function(){
          return new Response('', {status:408});
        });
      })
    );
  }
});
