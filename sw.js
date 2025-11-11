const CACHE_NAME = 'full-clock-tool-cache-v1';
// キャッシュするファイルのリスト
const urlsToCache = [
  './full_clock_tool.html',
  './manifest.json',
  // マニフェストで使用しているアイコンもキャッシュします
  'https://www.gstatic.com/android/keyboard/emojikit/v20210831/1F553/1F553.svg',
  // アプリが使用する音声ファイルもキャッシュに追加します（オフラインで音が鳴るように）
  'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
  'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.mp3',
  'https://actions.google.com/sounds/v1/alarms/fire_pager_alert.ogg',
  'https://actions.google.com/sounds/v1/alarms/fire_pager_alert.mp3'
];

// 1. インストールイベント
// Service Workerがインストールされたときに、コアファイルをキャッシュします
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // 指定されたファイルをすべてキャッシュに追加します
        // addAllはアトミックです（1つでも失敗すると全体が失敗します）
        return cache.addAll(urlsToCache).catch(err => {
            console.error('Failed to cache urls:', err);
        });
      })
  );
});

// 2. フェッチイベント
// ページがリクエスト（fetch）を行うたびに発生します
self.addEventListener('fetch', event => {
  event.respondWith(
    // まずキャッシュ内にリクエストと一致するものがあるか確認します
    caches.match(event.request)
      .then(response => {
        // キャッシュにあれば、キャッシュからレスポンスを返します
        if (response) {
          return response;
        }
        
        // キャッシュになければ、ネットワークにリクエストしに行きます
        return fetch(event.request).catch(() => {
            // ネットワークリクエストが失敗した場合（オフライン時など）
            // 代替の応答を返すことができますが、ここでは単純にエラーを返します。
            console.warn('Fetch failed, resource not in cache:', event.request.url);
        });
      }
    )
  );
});

// 3. アクティベートイベント
// 古いキャッシュを削除するために使われます
self.addEventListener('activate', event => {
  console.log('Service worker activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // このキャッシュ名がホワイトリストになければ削除
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
