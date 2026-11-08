const CORE_CACHE = 'hf-pwa-shell-__HF_REVISION__';
const ORIGINAL_CACHE = 'hf-pwa-originals-__HF_ORIGINAL_REVISION__';
const CORE_FILES = __HF_CORE_FILES__;
const ORIGINAL_FILES = __HF_ORIGINAL_FILES__;
const corePaths = new Set(CORE_FILES);
const originalPaths = new Set(ORIGINAL_FILES);
const downloadPorts = new Set();
let downloadJob;
let completed = 0;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE_CACHE);
    try {
      await cache.addAll(CORE_FILES.map(path => new Request(path, { cache: 'reload' })));
    } catch (error) {
      await caches.delete(CORE_CACHE);
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const originals = await caches.open(ORIGINAL_CACHE);
    for (const name of await caches.keys()) {
      if (name === CORE_CACHE || name === ORIGINAL_CACHE) continue;
      // Earlier releases stored original texts together with the application shell.
      if (name.startsWith('hf-offline-')) {
        const previous = await caches.open(name);
        for (const request of await previous.keys()) {
          const path = new URL(request.url).pathname;
          if (originalPaths.has(path) && !(await originals.match(path))) {
            const response = await previous.match(request);
            if (response?.ok) await originals.put(path, response);
          }
        }
      }
      if (name.startsWith('hf-offline-') || name.startsWith('hf-pwa-')) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

async function cachedResource(path, cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(path);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(path, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Account and authentication endpoints always reach the service that owns them.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;
  if (event.request.mode === 'navigate' && ['/', '/index.html'].includes(url.pathname)) {
    event.respondWith(cachedResource('/index.html', CORE_CACHE, event.request));
  } else if (corePaths.has(url.pathname)) {
    event.respondWith(cachedResource(url.pathname, CORE_CACHE, event.request));
  } else if (originalPaths.has(url.pathname)) {
    event.respondWith(cachedResource(url.pathname, ORIGINAL_CACHE, event.request).catch(() =>
      new Response('Baixe este livro com conexão para consultá-lo offline.', { status: 503 })
    ));
  }
});

function broadcast(message) {
  for (const port of downloadPorts) {
    try { port.postMessage(message); } catch { downloadPorts.delete(port); }
  }
}

async function downloadOriginals() {
  const cache = await caches.open(ORIGINAL_CACHE);
  completed = 0;
  for (const path of ORIGINAL_FILES) {
    if (!(await cache.match(path))) {
      const response = await fetch(path, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw Error('Livro indisponível.');
      await cache.put(path, response);
    }
    completed++;
    broadcast({ type: 'PROGRESS', completed, total: ORIGINAL_FILES.length });
  }
}

self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') {
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (event.data?.type !== 'DOWNLOAD_ORIGINALS' || !event.ports[0]) return;
  const port = event.ports[0];
  downloadPorts.add(port);
  port.postMessage({ type: 'PROGRESS', completed, total: ORIGINAL_FILES.length });
  if (!downloadJob) {
    downloadJob = downloadOriginals()
      .then(() => broadcast({ type: 'COMPLETE' }))
      .catch(() => broadcast({ type: 'ERROR' }))
      .finally(() => {
        downloadJob = null;
        for (const current of downloadPorts) current.close();
        downloadPorts.clear();
      });
  }
  event.waitUntil(downloadJob);
});
