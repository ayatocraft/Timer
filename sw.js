// キャッシュのバージョン (v3)
const CACHE_NAME = 'full-clock-tool-cache-v3';

// キャッシュするファイル
const urlsToCache = [
  './index.html', // index.html をキャッシュ
  './manifest.json',
  './sw.js',
  'https://www.gstatic.com/android/keyboard/emojikit/v20210831/1F553/1F553.svg'
];

// 1. インストールイベント
self.addEventListener('install', event => {
  console.log('Service Worker installing (v3)...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME);
        // PWAに必要なファイルをキャッシュ
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Core files cached successfully (v3).');
        // 即座に有効化(activate)に進む
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Cache addAll failed (v3):', err);
      })
  );
});

// 2. アクティベートイベント
self.addEventListener('activate', event => {
  console.log('Service worker activating (v3)...');
  
  // 即座にページを制御できるようにする
  event.waitUntil(self.clients.claim()); 
  
  // 古いキャッシュ（v2など）を削除
  const cacheWhitelist = [CACHE_NAME]; // v3 のみ残す
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // v3 以外のキャッシュを削除
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. フェッチイベント (Cache First, Network Fallback)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    // 1. まずキャッシュから探す
    caches.match(event.request)
      .then(cachedResponse => {
        
        // 2. キャッシュにあれば、それを返す
        if (cachedResponse) {
          return cachedResponse;
        }

        // 3. キャッシュになければ、ネットワークに取りに行く
        return fetch(event.request).then(
          networkResponse => {
            
            // （オプション：インストール時以外に取得した音声ファイルなども動的にキャッシュする）
            // 今回はインストールの確実性を優先し、必須ファイル以外はキャッシュしません。
            
            return networkResponse;
          }
        ).catch(error => {
          console.warn('Fetch failed, resource not in cache:', event.request.url, error);
        });
      }
    )
  );
});
