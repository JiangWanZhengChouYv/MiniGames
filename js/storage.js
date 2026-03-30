// 游戏存储模块 - 使用localStorage，增强缓存功能

class GameStorage {
    // 更新游戏分数
    static updateScore(gameName, score) {
        const currentTime = Date.now();
        const maxScoreKey = `game_${gameName}_maxScore`;
        const lastPlayedKey = `game_${gameName}_lastPlayed`;
        const historyKey = `game_${gameName}_history`;
        
        // 更新最高分
        const currentMax = parseInt(this.getItemWithExpiry(maxScoreKey)) || 0;
        if (score > currentMax) {
            this.setItemWithExpiry(maxScoreKey, score.toString(), 31536000000); // 1年过期
        }
        
        // 更新最后游玩时间
        this.setItemWithExpiry(lastPlayedKey, currentTime.toString(), 31536000000); // 1年过期
        
        // 添加到历史记录
        const history = this.getHistory(gameName);
        history.push({
            score: score,
            timestamp: currentTime
        });
        
        // 只保留最近的50条记录
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
        
        this.setItemWithExpiry(historyKey, JSON.stringify(history), 31536000000); // 1年过期
    }
    
    // 获取游戏最高分
    static getMaxScore(gameName) {
        return parseInt(this.getItemWithExpiry(`game_${gameName}_maxScore`)) || 0;
    }
    
    // 获取最后游玩时间
    static getLastPlayed(gameName) {
        return this.getItemWithExpiry(`game_${gameName}_lastPlayed`);
    }
    
    // 获取游戏历史记录
    static getHistory(gameName) {
        const history = this.getItemWithExpiry(`game_${gameName}_history`);
        if (history) {
            try {
                return JSON.parse(history);
            } catch (e) {
                console.error('解析历史记录失败:', e);
                return [];
            }
        }
        return [];
    }
    
    // 清除游戏数据
    static clearGameData(gameName) {
        localStorage.removeItem(`game_${gameName}_maxScore`);
        localStorage.removeItem(`game_${gameName}_lastPlayed`);
        localStorage.removeItem(`game_${gameName}_history`);
    }
    
    // 获取所有游戏统计数据
    static getAllStats() {
        const games = ['snake', 'brick', 'tetris', 'minesweeper', 'gomoku'];
        const stats = {};
        
        games.forEach(game => {
            stats[game] = {
                maxScore: this.getMaxScore(game),
                lastPlayed: this.getLastPlayed(game),
                totalGames: this.getHistory(game).length
            };
        });
        
        return stats;
    }
    
    // 重置所有数据
    static resetAll() {
        const games = ['snake', 'brick', 'tetris', 'minesweeper', 'gomoku'];
        games.forEach(game => this.clearGameData(game));
    }
    
    // 带过期时间的存储
    static setItemWithExpiry(key, value, ttl) {
        const item = {
            value: value,
            expiry: Date.now() + ttl,
        };
        localStorage.setItem(key, JSON.stringify(item));
    }
    
    // 获取带过期时间的存储
    static getItemWithExpiry(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) {
            return null;
        }
        
        const item = JSON.parse(itemStr);
        if (Date.now() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        
        return item.value;
    }
    
    // 检查并清理过期数据
    static cleanupExpiredData() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            this.getItemWithExpiry(key); // 自动清理过期数据
        }
    }
    
    // 获取存储使用情况
    static getStorageUsage() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length;
            }
        }
        return {
            used: totalSize,
            usedMB: (totalSize / 1024 / 1024).toFixed(2),
            quota: 5 * 1024 * 1024, // 5MB 是典型的localStorage配额
            quotaMB: 5
        };
    }
    
    // 压缩存储数据
    static compressData() {
        // 实现简单的数据压缩，例如合并历史记录
        const games = ['snake', 'brick', 'tetris', 'minesweeper', 'gomoku'];
        games.forEach(game => {
            const history = this.getHistory(game);
            // 只保留最近的30条记录，进一步减少存储空间
            if (history.length > 30) {
                history.splice(0, history.length - 30);
                this.setItemWithExpiry(`game_${game}_history`, JSON.stringify(history), 31536000000);
            }
        });
    }
}

// 导出模块（支持不同环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameStorage;
} else if (typeof window !== 'undefined') {
    window.GameStorage = GameStorage;
}