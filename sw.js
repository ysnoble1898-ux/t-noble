/* 연세노블병원 통합포털 Service Worker */
const CACHE_NAME = 'yn-portal-v1';
const CACHE_URLS = [
  './index.html',
  './manifest.json',
  './icon.svg'
];

/* 설치 — 핵심 파일 캐시 */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS);
    })
  );
  self.skipWaiting();
});

/* 활성화 — 구버전 캐시 삭제 */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* fetch — 네트워크 우선, 실패 시 캐시 */
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  /* Firebase API 요청은 캐시 안 함 */
  if (e.request.url.includes('firestore.googleapis.com') ||
      e.request.url.includes('firebase') ||
      e.request.url.includes('gstatic.com')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        /* 성공하면 캐시에도 저장 */
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, resClone);
        });
        return res;
      })
      .catch(function() {
        /* 오프라인이면 캐시에서 반환 */
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('./index.html');
        });
      })
  );
});
