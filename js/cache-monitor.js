// 缓存监控模块
// 跟踪缓存命中率和加载性能改进

class CacheMonitor {
    constructor() {
        this.cacheStats = {
            hits: 0,
            misses: 0,
            total: 0,
            hitRate: 0
        };
        
        this.performanceData = {
            navigationStart: 0,
            domContentLoaded: 0,
            loadEvent: 0,
            totalLoadTime: 0
        };
        
        this.init();
    }
    
    // 初始化监控
    init() {
        // 监听页面性能数据
        this.monitorPerformance();
        
        // 监听Service Worker消息
        this.listenToServiceWorker();
        
        // 定期报告缓存状态
        setInterval(() => this.reportCacheStatus(), 60000); // 每分钟报告一次
    }
    
    // 监控页面性能
    monitorPerformance() {
        if (performance && performance.timing) {
            const timing = performance.timing;
            
            // 监听DOMContentLoaded事件
            document.addEventListener('DOMContentLoaded', () => {
                this.performanceData.domContentLoaded = Date.now() - timing.navigationStart;
                console.log('DOM加载时间:', this.performanceData.domContentLoaded, 'ms');
            });
            
            // 监听load事件
            window.addEventListener('load', () => {
                this.performanceData.navigationStart = timing.navigationStart;
                this.performanceData.loadEvent = Date.now() - timing.navigationStart;
                this.performanceData.totalLoadTime = timing.loadEventEnd - timing.navigationStart;
                console.log('页面加载时间:', this.performanceData.totalLoadTime, 'ms');
                this.reportPerformance();
            });
        }
    }
    
    // 监听Service Worker消息
    listenToServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'CACHE_STAT') {
                    this.updateCacheStats(event.data.stats);
                }
            });
        }
    }
    
    // 更新缓存统计数据
    updateCacheStats(stats) {
        this.cacheStats.hits = stats.hits || 0;
        this.cacheStats.misses = stats.misses || 0;
        this.cacheStats.total = this.cacheStats.hits + this.cacheStats.misses;
        this.cacheStats.hitRate = this.cacheStats.total > 0 
            ? (this.cacheStats.hits / this.cacheStats.total * 100).toFixed(2) 
            : 0;
        
        console.log('缓存命中率:', this.cacheStats.hitRate, '%');
    }
    
    // 报告性能数据
    reportPerformance() {
        const data = {
            timestamp: Date.now(),
            performance: this.performanceData,
            cacheStats: this.cacheStats,
            storageUsage: typeof GameStorage !== 'undefined' ? GameStorage.getStorageUsage() : null
        };
        
        // 存储性能数据到localStorage
        const performanceHistory = this.getPerformanceHistory();
        performanceHistory.push(data);
        
        // 只保留最近的100条记录
        if (performanceHistory.length > 100) {
            performanceHistory.splice(0, performanceHistory.length - 100);
        }
        
        localStorage.setItem('cache_monitor_performance', JSON.stringify(performanceHistory));
        
        // 输出性能报告
        this.generatePerformanceReport(data);
    }
    
    // 报告缓存状态
    reportCacheStatus() {
        if ('caches' in window) {
            caches.keys().then((cacheNames) => {
                cacheNames.forEach((cacheName) => {
                    caches.open(cacheName).then((cache) => {
                        cache.keys().then((requests) => {
                            console.log(`缓存 ${cacheName} 包含 ${requests.length} 个资源`);
                        });
                    });
                });
            });
        }
        
        // 输出存储使用情况
        if (typeof GameStorage !== 'undefined') {
            const storageUsage = GameStorage.getStorageUsage();
            console.log('本地存储使用情况:', storageUsage);
        }
    }
    
    // 获取性能历史数据
    getPerformanceHistory() {
        const history = localStorage.getItem('cache_monitor_performance');
        if (history) {
            try {
                return JSON.parse(history);
            } catch (e) {
                console.error('解析性能历史数据失败:', e);
                return [];
            }
        }
        return [];
    }
    
    // 生成性能报告
    generatePerformanceReport(data) {
        const report = `
==============================================
缓存监控性能报告
==============================================
时间: ${new Date(data.timestamp).toLocaleString()}
页面加载时间: ${data.performance.totalLoadTime} ms
DOM加载时间: ${data.performance.domContentLoaded} ms
缓存命中率: ${data.cacheStats.hitRate}%
缓存请求总数: ${data.cacheStats.total}
缓存命中: ${data.cacheStats.hits}
缓存未命中: ${data.cacheStats.misses}
`;
        
        if (data.storageUsage) {
            report += `本地存储使用: ${data.storageUsage.usedMB} MB / ${data.storageUsage.quotaMB} MB
`;
        }
        
        report += '==============================================';
        
        console.log(report);
    }
    
    // 获取缓存监控数据
    getCacheMonitorData() {
        return {
            cacheStats: this.cacheStats,
            performanceData: this.performanceData,
            performanceHistory: this.getPerformanceHistory(),
            storageUsage: typeof GameStorage !== 'undefined' ? GameStorage.getStorageUsage() : null
        };
    }
    
    // 清除监控数据
    clearMonitorData() {
        localStorage.removeItem('cache_monitor_performance');
        this.cacheStats = {
            hits: 0,
            misses: 0,
            total: 0,
            hitRate: 0
        };
        console.log('缓存监控数据已清除');
    }
}

// 导出模块（支持不同环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheMonitor;
} else if (typeof window !== 'undefined') {
    window.CacheMonitor = CacheMonitor;
}
