// 排行榜存储模块 - 使用localStorage

class GameStorage {
    // 更新游戏分数
    static updateScore(gameName, score) {
        const currentTime = Date.now();
        const maxScoreKey = `game_${gameName}_maxScore`;
        const lastPlayedKey = `game_${gameName}_lastPlayed`;
        const historyKey = `game_${gameName}_history`;
        
        // 更新最高分
        const currentMax = parseInt(localStorage.getItem(maxScoreKey)) || 0;
        if (score > currentMax) {
            localStorage.setItem(maxScoreKey, score.toString());
        }
        
        // 更新最后游玩时间
        localStorage.setItem(lastPlayedKey, currentTime.toString());
        
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
        
        localStorage.setItem(historyKey, JSON.stringify(history));
    }
    
    // 获取游戏最高分
    static getMaxScore(gameName) {
        return parseInt(localStorage.getItem(`game_${gameName}_maxScore`)) || 0;
    }
    
    // 获取最后游玩时间
    static getLastPlayed(gameName) {
        return localStorage.getItem(`game_${gameName}_lastPlayed`);
    }
    
    // 获取游戏历史记录
    static getHistory(gameName) {
        const history = localStorage.getItem(`game_${gameName}_history`);
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
}

// 导出模块（支持不同环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameStorage;
} else if (typeof window !== 'undefined') {
    window.GameStorage = GameStorage;
}