const CACHE_NAME = 'timer-cache-v1';
const urlsToCache = [
  // GitHub Pagesのサブディレクトリ構成に合わせてパスを 
  '/index.html',
  'manifest.json',
  // ★ 実際に使用しているCSS/JSファイル名に合わせてください ★
];

// インストール: 必須アセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// フェッチ: キャッシュ優先でリソースを提供
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュ内にあればそれを返す
        if (response) {
          return response;
        }
        // なければネットワークから取得
        return fetch(event.request);
      })
  );
});

// アクティベート: 古いキャッシュのクリーンアップ
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
