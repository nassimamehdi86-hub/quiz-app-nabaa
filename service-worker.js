const CACHE_NAME = 'naba-app-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './naba-part1.mp4',
  './naba-part2.mp4'
];

// ملفات يجب دائمًا تفضيل النسخة الأحدث من الإنترنت (حتى تصل التحديثات فورًا)
const NETWORK_FIRST = ['index.html', 'manifest.json', 'service-worker.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isNetworkFirst =
    event.request.mode === 'navigate' ||
    NETWORK_FIRST.some((name) => url.pathname.endsWith(name));

  if (isNetworkFirst) {
    // جرّب الإنترنت أولًا؛ إن فشل (بدون اتصال) استعمل النسخة المخزّنة كحل احتياطي فقط
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // بقية الملفات (فيديو، أيقونات): من الذاكرة المؤقتة أولًا لسرعة التحميل
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res)=>{
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache)=>cache.put(event.request, resClone));
        return res;
      }).catch(() => cached);
    })
  );
});
