// sw.js
const CACHE_NAME = 'bsac-schedule-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './schedule.json',
  './logo.jpg'
];

// 1. Усталёўка (кэшаванне файлаў)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Актывацыя (чыстка старога кэша, калі змянілася версія)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// 3. Перахоп запытаў (Сетка -> калі памылка -> Кэш)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Калі ўсё добра, вяртаем адказ і абнаўляем яго ў кэшы
        if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Калі памылка сеткі (афлайн), бярэм з кэша
        return caches.match(event.request);
      })
  );
});