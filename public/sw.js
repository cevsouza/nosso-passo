// Service worker do Nosso Passo.
//
// Existe por um motivo concreto: rotina acontece na cozinha, no carro e na casa
// da avo. Uma falha de rede no meio da transicao e exatamente a crise que o app
// existe para evitar — e sem service worker o aparelho mostra a tela de erro do
// navegador, que e o pior desfecho possivel para uma crianca no meio do dia.
//
// Estrategia por tipo de pedido:
//   navegacao   -> rede primeiro, cache como rede de seguranca
//   estatico    -> cache primeiro (os arquivos do Next tem hash no nome: nunca
//                  mudam de conteudo sem mudar de URL)
//   /api/*      -> so rede. O cache de dados vive no firebase-bridge, que sabe
//                  a qual crianca e a qual dia aquilo pertence.
//
// Trocar CACHE invalida tudo. Faca isso quando o shell mudar de verdade.

const CACHE = 'nosso-passo-v1';

const SHELL = [
  '/',
  '/routine',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll e tudo-ou-nada: um 404 em qualquer item aborta a instalacao
      // inteira. Aqui cada item vai por conta propria.
      .then((cache) => Promise.allSettled(SHELL.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Dados nunca passam por aqui: servir uma rotina velha achando que e a de
  // hoje seria pior do que nao servir nada.
  if (url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          // Sem esta pagina no cache, entrega a que a crianca usa. Melhor a
          // tela certa do dia anterior do que o dinossauro do navegador.
          return (await caches.match('/routine')) || (await caches.match('/')) || Response.error();
        })
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        });
      })
    );
  }
});
