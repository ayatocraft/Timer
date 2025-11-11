// キャッシュのバージョン (名前を変更して強制的に更新)
const CACHE_NAME = 'full-clock-tool-cache-v2';

// ★★★修正点★★★
// キャッシュするファイルを、PWAインストールに必須のローカルファイルのみに限定します。
// (外部の音声ファイルやアイコンを除外)
const urlsToCache = [
  './full_clock_tool.html',
  './manifest.json',
  './sw.js' // Service Worker自体もキャッシュ対象に含めます
];

// 1. インストールイベント
self.addEventListener('install', event => {
  console.log('Service Worker installing (v2)...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME);
        // ローカルファイルのみをキャッシュ
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Core files cached successfully.');
        // インストールが完了したら、古いSWがいても即座に有効化(activate)に進む
        return self.skipWaiting();
      })
      .catch(err => {
        // キャッシュに失敗した場合、インストールは失敗する
        console.error('Cache addAll failed:', err);
      })
  );
});

// 2. アクティベートイベント
self.addEventListener('activate', event => {
  console.log('Service worker activating (v2)...');
  
  // skipWaiting()から来た新しいSWが即座にページを制御できるようにする
  event.waitUntil(self.clients.claim()); 
  
  // 古いキャッシュ（v1など）を削除
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // このキャッシュ名がホワイトリストになければ削除
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. フェッチイベント (Cache First, Network Fallback)
// ネットワークリクエストが発生するたびに実行されます
self.addEventListener('fetch', event => {
  // GETリクエスト以外はブラウザのデフォルトに任せる
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    // 1. まずキャッシュから探す
    caches.match(event.request)
      .then(cachedResponse => {
        
        // 2. キャッシュにあれば、それを返す
        if (cachedResponse) {
          // console.log('Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // 3. キャッシュになければ、ネットワークに取りに行く
        // console.log('Fetching from network:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // ネットワークから取得成功
            
            // ★重要★
            // 外部リソース（音声ファイルやアイコン）は、ここで初めてネットワークから取得されます。
            // これらを動的にキャッシュすることも可能ですが、
            // まずはインストールを優先するため、ここではキャッシュせず、応答をそのまま返します。
            
            return networkResponse;
          }
        ).catch(error => {
          // 4. ネットワークも失敗した場合（オフライン時）
          console.warn('Fetch failed, resource not in cache:', event.request.url, error);
          // (オプション) ここでオフライン用の代替ページや画像を返すこともできます
        });
      }
    )
  );
});
