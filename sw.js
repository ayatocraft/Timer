const CACHE_NAME = 'full-clock-tool-v1';
const urlsToCache = [
  './',
  './index.html', // index.htmlと仮定
  './style.css', // 外部CSSがあれば（今回はHTML内なので不要だがテンプレートとして）
  // ... アプリで使用される他の主要なアセット (アイコン、フォントなど)
];

// インストールイベント: アセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // HTML内で定義されている全ての外部依存をここに追加する
        return cache.addAll(urlsToCache).catch(err => {
          console.error('Cache add failed:', err);
        });
      })
  );
});

// フェッチイベント: キャッシュからアセットを返す
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュ内に見つかった場合はそれを返す
        if (response) {
          return response;
        }
        // キャッシュにない場合はネットワークから取得
        return fetch(event.request);
      }
    )
  );
});

// アクティベートイベント: 古いキャッシュをクリア
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // ホワイトリストにない古いキャッシュを削除
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
