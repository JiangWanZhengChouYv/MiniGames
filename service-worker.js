// Service Worker for 迷你游戏合集
// 缓存静态资源，提供离线访问能力

const CACHE_NAME = 'mini-games-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/games.css',
  '/js/storage.js',
  '/js/cache-monitor.js',
  '/games/snake.html',
  '/games/brick.html',
  '/games/tetris.html',
  '/games/minesweeper.html',
  '/games/gomoku.html',
  '/js/snake.js',
  '/js/brick.js',
  '/js/tetris.js',
  '/js/minesweeper.js',
  '/js/gomoku.js'
];

// 缓存统计数据
let cacheStats = {
  hits: 0,
  misses: 0
};

// 安装Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存已打开');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有响应，则返回缓存的响应
        if (response) {
          console.log('从缓存返回:', event.request.url);
          cacheStats.hits++;
          sendCacheStats();
          return response;
        }
        
        // 否则，发送网络请求
        cacheStats.misses++;
        sendCacheStats();
        
        return fetch(event.request)
          .then((response) => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应，因为响应流只能使用一次
            const responseToCache = response.clone();
            
            // 将响应添加到缓存
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // 如果网络请求失败，返回离线页面
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// 向客户端发送缓存统计数据
function sendCacheStats() {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'CACHE_STAT',
        stats: cacheStats
      });
    });
  });
}

// 处理后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'game-stats-sync') {
    event.waitUntil(syncGameStats());
  }
});

// 同步游戏数据
async function syncGameStats() {
  // 这里可以实现游戏数据的同步逻辑
  console.log('同步游戏数据');
  // 例如，将本地存储的游戏数据同步到服务器（如果有）
}