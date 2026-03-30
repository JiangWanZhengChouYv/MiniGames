class GomokuGame {
    constructor() {
        this.boardSize = 15;
        this.board = [];
        this.currentPlayer = 'black';
        this.gameStatus = 'ready'; // ready, playing, ended
        this.winner = null;
        
        // 对弈数据收集相关属性
        this.currentGameRecord = null;
        this.moveNumber = 0;
        this.storageKey = 'gomoku_game_records';
        
        // AI训练系统
        this.aiTraining = {
            isTrained: false,
            patternWeights: {
                // 基础棋型权重
                five: 100000,           // 五连
                openFour: 10000,        // 活四
                closedFour: 1000,       // 冲四
                openThree: 1000,        // 活三
                closedThree: 100,       // 眠三
                openTwo: 100,           // 活二
                closedTwo: 10,          // 眠二
                // 用户偏好调整
                userPreferredPositions: {},  // 用户偏好位置
                userAggressiveness: 0.5,     // 用户进攻倾向 (0-1)
                userDefensiveness: 0.5,      // 用户防守倾向 (0-1)
                userCenterPreference: 0.5,   // 用户中心偏好 (0-1)
            },
            openingBook: {},             // 开局库
            trainingDataKey: 'gomoku_ai_training_data',
            lastTrainingTime: null,
            totalGamesAnalyzed: 0
        };
        
        // 训练状态管理
        this.trainingState = {
            isTraining: false,
            progress: 0,
            analyzedGames: 0,
            foundPatterns: 0,
            cancelRequested: false,
            totalGames: 0,
            startTime: null,
            analysis: null
        };
        
        // 自动学习状态管理
        this.autoLearnState = {
            isLearning: false,
            progress: 0,
            completedGames: 0,
            totalGames: 50, // 默认自我对弈50局
            currentGame: 0,
            cancelRequested: false,
            startTime: null,
            performanceData: [],
            isPaused: false
        };
        
        // 加载训练数据
        this.loadTrainingData();
        
        // AI对话内容库
        this.dialogues = {
            // 开局问候
            greeting: [
                "你好！我是你的五子棋对手，让我们开始吧！",
                "欢迎来到五子棋世界！我已经准备好了，你呢？",
                "嘿！很高兴和你下棋，让我们来一场精彩的对决吧！",
                "你好呀！我是AI棋手，希望能和你有一场愉快的对局！",
                "准备好了吗？我要使出全力了哦！",
                "又来挑战我了？放马过来吧！",
                "今天状态不错，希望能和你下出好棋！"
            ],
            // AI落子时的评论
            aiMove: [
                "这步棋怎么样？",
                "让我想想...",
                "这里似乎不错！",
                "看我的应对！",
                "有点意思，不过我还有对策！",
                "这一步我考虑了一下~",
                "别小看我哦！",
                "来，接招！",
                "这个位置很关键！",
                "发现一个好位置！",
                "防守一波~",
                "进攻是最好的防守！"
            ],
            // 玩家获胜时的反馈
            playerWin: [
                "恭喜你赢了！你下得真好！",
                "太厉害了！我甘拜下风！",
                "哇，你真的很强！下次我一定会更努力的！",
                "精彩的对局！你的棋艺让我佩服！",
                "你赢了！这场比赛真的很精彩！",
                "厉害厉害，我输得心服口服！",
                "下次我一定要赢回来！"
            ],
            // AI获胜时的反馈
            aiWin: [
                "这次我赢了，下次再接再厉！",
                "嘿嘿，承让承让！下次我们再战！",
                "好险好险，终于赢了一局！",
                "耶！我赢了！不过你下得也很棒！",
                "这次运气站在我这边，下次不一定哦！",
                "赢啦！不过你的棋力也很强呢！",
                "侥幸获胜，下次再来！"
            ],
            // 平局时的反馈
            draw: [
                "势均力敌啊，真是精彩的对局！",
                "平局！我们都太强了！",
                "旗鼓相当！这局下得真过瘾！",
                "平分秋色，下次一定要分出胜负！",
                "和棋！这是一场高质量的对决！",
                "棋逢对手，真是痛快！",
                "难分高下，下次再战！"
            ],
            // 玩家落子后的评论
            playerMove: [
                "不错的一步！",
                "有意思的选择...",
                "让我看看你怎么应对我的下一步！",
                "这招挺有意思的！",
                "嗯，有点水平嘛！",
                "这手棋有想法！",
                "我得认真应对了~"
            ]
        };
        
        this.initializeBoard();
        this.setupEventListeners();
        this.renderBoard();
    }
    
    // 显示AI对话
    showDialog(message, showTyping = false) {
        const dialogText = document.getElementById('ai-dialog-text');
        const typingIndicator = document.getElementById('typing-indicator');
        const dialogBubble = document.getElementById('ai-dialog');
        
        if (!dialogText) return;
        
        if (showTyping) {
            // 显示输入中动画
            dialogText.style.display = 'none';
            typingIndicator.classList.add('active');
            
            // 重新触发动画
            dialogBubble.style.animation = 'none';
            setTimeout(() => {
                dialogBubble.style.animation = 'fadeIn 0.3s ease-in-out';
            }, 10);
        } else {
            // 直接显示消息
            typingIndicator.classList.remove('active');
            dialogText.style.display = 'block';
            dialogText.textContent = message;
            
            // 重新触发动画
            dialogBubble.style.animation = 'none';
            setTimeout(() => {
                dialogBubble.style.animation = 'fadeIn 0.3s ease-in-out';
            }, 10);
        }
    }
    
    // 获取随机对话
    getRandomDialogue(category) {
        const dialogues = this.dialogues[category];
        if (!dialogues || dialogues.length === 0) return "";
        return dialogues[Math.floor(Math.random() * dialogues.length)];
    }
    
    // ==================== 存储空间监控方法 ====================
    
    // 获取当前已使用的localStorage空间（字节数）
    getStorageUsage() {
        let totalSize = 0;
        try {
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        // 更精确的计算：key和value都使用UTF-16编码，每个字符2字节
                        totalSize += key.length * 2;
                        totalSize += value.length * 2;
                    }
                }
            }
        } catch (e) {
            console.warn('计算存储空间失败:', e);
        }
        return totalSize;
    }
    
    // 返回5MB的限制（浏览器localStorage通常限制为5-10MB）
    getStorageLimit() {
        // 浏览器localStorage通常限制为5MB，保守起见使用4.5MB作为警告阈值
        return 4718592; // 4.5MB = 4.5 * 1024 * 1024
    }
    
    // 计算已使用空间的百分比
    getStoragePercentage() {
        const usage = this.getStorageUsage();
        const limit = this.getStorageLimit();
        return Math.min(100, (usage / limit) * 100);
    }
    
    // 获取实际的localStorage配额信息（如果浏览器支持）
    async getStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    usage: estimate.usage || 0,
                    quota: estimate.quota || this.getStorageLimit(),
                    percentage: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
                };
            } catch (e) {
                console.warn('获取存储配额失败:', e);
            }
        }
        return null;
    }
    
    // 将字节数格式化为人类可读的字符串
    formatStorageSize(bytes) {
        if (bytes === 0) return '0B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
        return size + units[i];
    }
    
    // ==================== 数据压缩存储方法 ====================
    
    // 压缩单条对弈记录
    compressGameRecord(record) {
        const compressed = {
            i: record.gameId,
            s: record.startTime,
            e: record.endTime,
            w: record.winner,
            t: record.totalMoves,
            m: record.moves.map(move => ({
                p: move.player,
                r: move.row,
                c: move.col,
                n: move.moveNumber,
                ts: move.timestamp
            }))
        };
        return compressed;
    }
    
    // 解压缩对弈记录
    decompressGameRecord(compressed) {
        return {
            gameId: compressed.i,
            startTime: compressed.s,
            endTime: compressed.e,
            winner: compressed.w,
            totalMoves: compressed.t,
            moves: compressed.m.map(m => ({
                player: m.p,
                row: m.r,
                col: m.c,
                moveNumber: m.n,
                timestamp: m.ts
            }))
        };
    }
    
    // 压缩训练数据
    compressTrainingData(data) {
        const compressed = {
            tr: data.isTrained,
            lt: data.lastTrainingTime,
            tg: data.totalGamesAnalyzed,
            pw: {
                f: data.patternWeights.five,
                of: data.patternWeights.openFour,
                cf: data.patternWeights.closedFour,
                ot: data.patternWeights.openThree,
                ct: data.patternWeights.closedThree,
                otw: data.patternWeights.openTwo,
                ctw: data.patternWeights.closedTwo,
                upp: data.patternWeights.userPreferredPositions,
                ua: data.patternWeights.userAggressiveness,
                ud: data.patternWeights.userDefensiveness,
                ucp: data.patternWeights.userCenterPreference
            },
            ob: data.openingBook
        };
        return compressed;
    }
    
    // 解压缩训练数据
    decompressTrainingData(compressed) {
        return {
            isTrained: compressed.tr,
            lastTrainingTime: compressed.lt,
            totalGamesAnalyzed: compressed.tg,
            patternWeights: {
                five: compressed.pw.f,
                openFour: compressed.pw.of,
                closedFour: compressed.pw.cf,
                openThree: compressed.pw.ot,
                closedThree: compressed.pw.ct,
                openTwo: compressed.pw.otw,
                closedTwo: compressed.pw.ctw,
                userPreferredPositions: compressed.pw.upp,
                userAggressiveness: compressed.pw.ua,
                userDefensiveness: compressed.pw.ud,
                userCenterPreference: compressed.pw.ucp
            },
            openingBook: compressed.ob
        };
    }
    
    // ==================== 自动清理机制 ====================
    
    // 检查存储空间，如果超过80%则自动清理（降低阈值，提前清理）
    checkStorageAndCleanup() {
        const percentage = this.getStoragePercentage();
        if (percentage >= 80) {
            console.warn(`存储空间使用率达到 ${percentage.toFixed(2)}%，开始自动清理...`);
            this.cleanupOldRecords();
            return true;
        }
        return false;
    }
    
    // 清理最旧的对弈记录，保留最近30局（减少保留数量，节省空间）
    cleanupOldRecords() {
        const records = this.getAllGameRecords();
        const keepCount = 30;
        
        if (records.length <= keepCount) {
            return false;
        }
        
        // 按开始时间排序，保留最新的
        records.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        const recordsToKeep = records.slice(0, keepCount);
        
        try {
            const compressedRecords = recordsToKeep.map(r => this.compressGameRecord(r));
            localStorage.setItem(this.storageKey, JSON.stringify(compressedRecords));
            console.log(`已清理旧记录，保留 ${keepCount} 条最新记录`);
            return true;
        } catch (error) {
            console.error('清理旧记录失败:', error);
            return false;
        }
    }
    
    // 获取当前存储的记录数量
    getRecordsCount() {
        return this.getAllGameRecords().length;
    }
    
    // ==================== 手动清理功能 ====================
    
    // 手动清理，保留指定数量的最近记录
    manualCleanup(keepCount = 30) {
        const records = this.getAllGameRecords();
        
        if (records.length <= keepCount) {
            console.log(`当前记录数 ${records.length}，无需清理（保留数量：${keepCount}）`);
            return { success: true, removed: 0, remaining: records.length };
        }
        
        // 按开始时间排序，保留最新的
        records.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        const recordsToKeep = records.slice(0, keepCount);
        const removedCount = records.length - keepCount;
        
        try {
            const compressedRecords = recordsToKeep.map(r => this.compressGameRecord(r));
            localStorage.setItem(this.storageKey, JSON.stringify(compressedRecords));
            console.log(`手动清理完成，删除 ${removedCount} 条记录，保留 ${keepCount} 条`);
            return { success: true, removed: removedCount, remaining: keepCount };
        } catch (error) {
            console.error('手动清理失败:', error);
            return { success: false, removed: 0, remaining: records.length, error: error.message };
        }
    }
    
    // 清空所有对弈数据和训练数据（保留最高分记录）
    clearAllData() {
        try {
            // 保存最高分记录
            const maxScoreKey = 'game_gomoku_maxScore';
            const maxScore = localStorage.getItem(maxScoreKey);
            
            // 删除对弈记录
            localStorage.removeItem(this.storageKey);
            
            // 删除训练数据
            localStorage.removeItem(this.aiTraining.trainingDataKey);
            
            // 恢复最高分记录
            if (maxScore !== null) {
                localStorage.setItem(maxScoreKey, maxScore);
            }
            
            // 重置训练数据状态
            this.aiTraining.isTrained = false;
            this.aiTraining.patternWeights = {
                five: 100000,
                openFour: 10000,
                closedFour: 1000,
                openThree: 1000,
                closedThree: 100,
                openTwo: 100,
                closedTwo: 10,
                userPreferredPositions: {},
                userAggressiveness: 0.5,
                userDefensiveness: 0.5,
                userCenterPreference: 0.5,
            };
            this.aiTraining.openingBook = {};
            this.aiTraining.lastTrainingTime = null;
            this.aiTraining.totalGamesAnalyzed = 0;
            
            console.log('已清空所有对弈数据和训练数据，最高分记录已保留');
            return { success: true, message: '所有数据已清空，最高分记录已保留' };
        } catch (error) {
            console.error('清空数据失败:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ==================== 对弈数据收集方法 ====================
    
    // 开始记录新游戏
    startRecording() {
        const gameId = Date.now().toString();
        this.currentGameRecord = {
            gameId: gameId,
            startTime: new Date().toISOString(),
            endTime: null,
            moves: [],
            winner: null,
            totalMoves: 0
        };
        this.moveNumber = 0;
    }
    
    // 记录每一步棋
    recordMove(row, col, player) {
        if (!this.currentGameRecord) return;
        
        this.moveNumber++;
        const move = {
            player: player,
            row: row,
            col: col,
            timestamp: new Date().toISOString(),
            moveNumber: this.moveNumber
        };
        
        this.currentGameRecord.moves.push(move);
        this.currentGameRecord.totalMoves = this.moveNumber;
    }
    
    // 结束记录
    endRecording(winner) {
        if (!this.currentGameRecord) return;
        
        this.currentGameRecord.endTime = new Date().toISOString();
        this.currentGameRecord.winner = winner;
        this.currentGameRecord.totalMoves = this.moveNumber;
        
        this.saveGameRecord(this.currentGameRecord);
        
        // 游戏结束后触发AI训练
        this.trainAI();
        
        // 重置当前记录
        this.currentGameRecord = null;
        this.moveNumber = 0;
    }
    
    // 保存对弈记录到localStorage（带空间检查和自动清理）
    saveGameRecord(record) {
        try {
            // 在保存前检查空间，如果超过90%则自动清理
            const wasCleaned = this.checkStorageAndCleanup();
            if (wasCleaned) {
                console.log('存储空间不足，已自动清理旧记录');
            }
            
            const existingRecords = this.getAllGameRecords();
            existingRecords.push(record);
            
            // 压缩记录后存储
            const compressedRecords = existingRecords.map(r => this.compressGameRecord(r));
            localStorage.setItem(this.storageKey, JSON.stringify(compressedRecords));
            
            // 显示存储状态
            const usage = this.getStorageUsage();
            const percentage = this.getStoragePercentage();
            console.log(`对弈记录已保存。存储使用: ${this.formatStorageSize(usage)} (${percentage.toFixed(2)}%)`);
        } catch (error) {
            console.error('保存对弈记录失败:', error);
            // 如果是存储空间不足错误，尝试清理后重试
            if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
                console.warn('存储空间不足，尝试清理后重试...');
                this.cleanupOldRecords();
                try {
                    const existingRecords = this.getAllGameRecords();
                    existingRecords.push(record);
                    const compressedRecords = existingRecords.map(r => this.compressGameRecord(r));
                    localStorage.setItem(this.storageKey, JSON.stringify(compressedRecords));
                    console.log('清理后保存成功');
                } catch (retryError) {
                    console.error('清理后仍无法保存:', retryError);
                }
            }
        }
    }
    
    // 获取所有对弈记录（自动处理压缩/未压缩数据）
    getAllGameRecords() {
        try {
            const records = localStorage.getItem(this.storageKey);
            if (!records) return [];
            
            const parsed = JSON.parse(records);
            
            // 检查是否是压缩格式（通过检查第一个记录的键名）
            if (parsed.length > 0 && parsed[0].i !== undefined) {
                // 压缩格式，需要解压缩
                return parsed.map(r => this.decompressGameRecord(r));
            }
            
            // 未压缩格式，直接返回
            return parsed;
        } catch (error) {
            console.error('获取对弈记录失败:', error);
            return [];
        }
    }
    
    // 根据ID获取特定对弈记录
    getGameRecordById(gameId) {
        const records = this.getAllGameRecords();
        return records.find(record => record.gameId === gameId) || null;
    }
    
    // 清空所有对弈记录
    clearAllGameRecords() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('清空对弈记录失败:', error);
            return false;
        }
    }
    
    // ==================== 对弈数据收集方法结束 ====================
    
    // ==================== AI训练系统方法 ====================
    
    // 主训练方法
    trainAI() {
        try {
            // 使用 requestIdleCallback 或 setTimeout 确保不阻塞主线程
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => this._performTraining(), { timeout: 2000 });
            } else {
                setTimeout(() => this._performTraining(), 100);
            }
        } catch (error) {
            console.error('AI训练启动失败:', error);
        }
    }
    
    // 执行训练（内部方法）
    _performTraining() {
        const startTime = Date.now();
        
        // 获取所有对弈记录
        const records = this.getAllGameRecords();
        
        if (records.length === 0) {
            console.log('没有对弈记录，跳过训练');
            return;
        }
        
        // 分析用户模式
        const analysis = this.analyzeUserPatterns(records);
        
        // 更新AI参数
        this.updateAIParameters(analysis);
        
        // 更新训练状态
        this.aiTraining.isTrained = true;
        this.aiTraining.lastTrainingTime = new Date().toISOString();
        this.aiTraining.totalGamesAnalyzed = records.length;
        
        // 保存训练数据
        this.saveTrainingData();
        
        const endTime = Date.now();
        console.log(`AI训练完成，耗时 ${endTime - startTime}ms，分析了 ${records.length} 场对局`);
    }
    
    // 分析用户下棋模式
    analyzeUserPatterns(records) {
        const analysis = {
            positionFrequency: {},      // 位置频率
            firstMovePositions: [],     // 首步位置
            secondMovePositions: [],    // 第二步位置
            totalMoves: 0,              // 总步数
            userWins: 0,                // 用户获胜次数
            aiWins: 0,                  // AI获胜次数
            draws: 0,                   // 平局次数
            averageGameLength: 0,       // 平均对局长度
            aggressiveMoves: 0,         // 进攻性着法
            defensiveMoves: 0,          // 防守性着法
            centerMoves: 0,             // 中心区域着法
            edgeMoves: 0,               // 边缘区域着法
            commonPatterns: {},         // 常见棋型
            openingMoves: {}            // 开局库数据
        };
        
        const centerStart = Math.floor(this.boardSize / 2) - 2;
        const centerEnd = Math.floor(this.boardSize / 2) + 2;
        
        records.forEach(record => {
            // 统计胜负
            if (record.winner === 'black') {
                analysis.userWins++;
            } else if (record.winner === 'white') {
                analysis.aiWins++;
            } else {
                analysis.draws++;
            }
            
            // 统计对局长度
            analysis.totalMoves += record.moves.length;
            
            // 分析每一步
            record.moves.forEach((move, index) => {
                if (move.player === 'black') {
                    const posKey = `${move.row},${move.col}`;
                    
                    // 统计位置频率
                    analysis.positionFrequency[posKey] = (analysis.positionFrequency[posKey] || 0) + 1;
                    
                    // 统计首步和第二步
                    if (index === 0) {
                        analysis.firstMovePositions.push({ row: move.row, col: move.col });
                    } else if (index === 2) {
                        analysis.secondMovePositions.push({ row: move.row, col: move.col });
                    }
                    
                    // 判断中心偏好
                    if (move.row >= centerStart && move.row <= centerEnd && 
                        move.col >= centerStart && move.col <= centerEnd) {
                        analysis.centerMoves++;
                    } else if (move.row <= 2 || move.row >= this.boardSize - 3 || 
                               move.col <= 2 || move.col >= this.boardSize - 3) {
                        analysis.edgeMoves++;
                    }
                    
                    // 收集开局数据（前6步）
                    if (index < 6) {
                        const openingKey = `move${index}_${move.row}_${move.col}`;
                        analysis.openingMoves[openingKey] = (analysis.openingMoves[openingKey] || 0) + 1;
                    }
                }
            });
            
            // 分析棋型（简化版）
            this.analyzePatternsInGame(record, analysis);
        });
        
        // 计算平均值
        analysis.averageGameLength = analysis.totalMoves / records.length;
        
        // 计算进攻/防守倾向
        const userMoves = analysis.totalMoves / 2; // 用户大约走一半的步数
        analysis.aggressiveness = analysis.aggressiveMoves / Math.max(userMoves, 1);
        analysis.defensiveness = analysis.defensiveMoves / Math.max(userMoves, 1);
        analysis.centerPreference = analysis.centerMoves / Math.max(userMoves, 1);
        
        return analysis;
    }
    
    // 分析单局游戏中的棋型
    analyzePatternsInGame(record, analysis) {
        // 简化的棋型分析
        // 在实际应用中，这里可以分析活三、活四等棋型
        const userMoves = record.moves.filter(m => m.player === 'black');
        
        userMoves.forEach((move, idx) => {
            if (idx > 0) {
                const prevMove = userMoves[idx - 1];
                const distance = Math.abs(move.row - prevMove.row) + Math.abs(move.col - prevMove.col);
                
                // 距离近可能是防守，距离远可能是进攻
                if (distance <= 2) {
                    analysis.defensiveMoves++;
                } else if (distance >= 4) {
                    analysis.aggressiveMoves++;
                }
            }
        });
    }
    
    // 根据分析结果更新AI参数
    updateAIParameters(analysis) {
        const weights = this.aiTraining.patternWeights;
        
        // 更新用户偏好位置（加强这些位置的防守权重）
        const sortedPositions = Object.entries(analysis.positionFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20); // 取前20个最常走的位置
        
        weights.userPreferredPositions = {};
        sortedPositions.forEach(([pos, count], index) => {
            // 排名越靠前，权重越高
            const weight = Math.max(0.5, 1 - (index * 0.025));
            weights.userPreferredPositions[pos] = weight;
        });
        
        // 更新用户风格参数
        weights.userAggressiveness = Math.min(1, Math.max(0, analysis.aggressiveness || 0.5));
        weights.userDefensiveness = Math.min(1, Math.max(0, analysis.defensiveness || 0.5));
        weights.userCenterPreference = Math.min(1, Math.max(0, analysis.centerPreference || 0.5));
        
        // 根据用户风格调整棋型权重
        if (weights.userAggressiveness > 0.6) {
            // 用户进攻性强，AI加强防守权重
            weights.openFour *= 1.2;
            weights.openThree *= 1.1;
        } else if (weights.userDefensiveness > 0.6) {
            // 用户防守性强，AI加强进攻权重
            weights.five *= 1.1;
            weights.openFour *= 1.15;
        }
        
        // 更新开局库
        this.updateOpeningBook(analysis);
    }
    
    // 更新开局库
    updateOpeningBook(analysis) {
        const openingBook = {};
        
        // 分析首步位置
        if (analysis.firstMovePositions.length > 0) {
            const firstMoveFreq = {};
            analysis.firstMovePositions.forEach(pos => {
                const key = `${pos.row},${pos.col}`;
                firstMoveFreq[key] = (firstMoveFreq[key] || 0) + 1;
            });
            
            // 选择最常见的首步作为开局库
            const sortedFirstMoves = Object.entries(firstMoveFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            openingBook.firstMoves = sortedFirstMoves.map(([pos, count]) => ({
                position: pos,
                frequency: count / analysis.firstMovePositions.length
            }));
        }
        
        // 分析第二步位置
        if (analysis.secondMovePositions.length > 0) {
            const secondMoveFreq = {};
            analysis.secondMovePositions.forEach(pos => {
                const key = `${pos.row},${pos.col}`;
                secondMoveFreq[key] = (secondMoveFreq[key] || 0) + 1;
            });
            
            const sortedSecondMoves = Object.entries(secondMoveFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            openingBook.secondMoves = sortedSecondMoves.map(([pos, count]) => ({
                position: pos,
                frequency: count / analysis.secondMovePositions.length
            }));
        }
        
        this.aiTraining.openingBook = openingBook;
    }
    
    // 保存训练数据到localStorage（带压缩）
    saveTrainingData() {
        try {
            const dataToSave = {
                isTrained: this.aiTraining.isTrained,
                patternWeights: this.aiTraining.patternWeights,
                openingBook: this.aiTraining.openingBook,
                lastTrainingTime: this.aiTraining.lastTrainingTime,
                totalGamesAnalyzed: this.aiTraining.totalGamesAnalyzed
            };
            // 压缩后存储
            const compressedData = this.compressTrainingData(dataToSave);
            localStorage.setItem(this.aiTraining.trainingDataKey, JSON.stringify(compressedData));
        } catch (error) {
            console.error('保存AI训练数据失败:', error);
        }
    }
    
    // 从localStorage加载训练数据（自动处理压缩/未压缩数据）
    loadTrainingData() {
        try {
            const savedData = localStorage.getItem(this.aiTraining.trainingDataKey);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                
                // 检查是否是压缩格式（通过检查tr键是否存在）
                if (parsed.tr !== undefined) {
                    // 压缩格式，需要解压缩
                    const decompressed = this.decompressTrainingData(parsed);
                    this.aiTraining.isTrained = decompressed.isTrained || false;
                    this.aiTraining.patternWeights = decompressed.patternWeights || this.aiTraining.patternWeights;
                    this.aiTraining.openingBook = decompressed.openingBook || {};
                    this.aiTraining.lastTrainingTime = decompressed.lastTrainingTime || null;
                    this.aiTraining.totalGamesAnalyzed = decompressed.totalGamesAnalyzed || 0;
                } else {
                    // 未压缩格式，直接加载
                    this.aiTraining.isTrained = parsed.isTrained || false;
                    this.aiTraining.patternWeights = parsed.patternWeights || this.aiTraining.patternWeights;
                    this.aiTraining.openingBook = parsed.openingBook || {};
                    this.aiTraining.lastTrainingTime = parsed.lastTrainingTime || null;
                    this.aiTraining.totalGamesAnalyzed = parsed.totalGamesAnalyzed || 0;
                }
                
                console.log('AI训练数据已加载，已分析对局数:', this.aiTraining.totalGamesAnalyzed);
            } else {
                // 如果没有训练数据，加载预设的训练数据
                this.loadDefaultTrainingData();
            }
        } catch (error) {
            console.error('加载AI训练数据失败:', error);
            // 加载失败时使用预设训练数据
            this.loadDefaultTrainingData();
        }
    }
    
    // 加载预设的训练数据
    loadDefaultTrainingData() {
        console.log('加载预设训练数据...');
        
        // 预设的对弈记录
        const defaultRecords = [
            {
                gameId: 'default_1',
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                moves: [
                    { player: 'black', row: 7, col: 7, timestamp: new Date().toISOString(), moveNumber: 1 },
                    { player: 'white', row: 6, col: 6, timestamp: new Date().toISOString(), moveNumber: 2 },
                    { player: 'black', row: 8, col: 7, timestamp: new Date().toISOString(), moveNumber: 3 },
                    { player: 'white', row: 5, col: 5, timestamp: new Date().toISOString(), moveNumber: 4 },
                    { player: 'black', row: 9, col: 7, timestamp: new Date().toISOString(), moveNumber: 5 },
                    { player: 'white', row: 4, col: 4, timestamp: new Date().toISOString(), moveNumber: 6 },
                    { player: 'black', row: 10, col: 7, timestamp: new Date().toISOString(), moveNumber: 7 },
                    { player: 'white', row: 3, col: 3, timestamp: new Date().toISOString(), moveNumber: 8 },
                    { player: 'black', row: 11, col: 7, timestamp: new Date().toISOString(), moveNumber: 9 }
                ],
                winner: 'black',
                totalMoves: 9
            },
            {
                gameId: 'default_2',
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                moves: [
                    { player: 'black', row: 7, col: 7, timestamp: new Date().toISOString(), moveNumber: 1 },
                    { player: 'white', row: 7, col: 6, timestamp: new Date().toISOString(), moveNumber: 2 },
                    { player: 'black', row: 6, col: 7, timestamp: new Date().toISOString(), moveNumber: 3 },
                    { player: 'white', row: 8, col: 6, timestamp: new Date().toISOString(), moveNumber: 4 },
                    { player: 'black', row: 5, col: 7, timestamp: new Date().toISOString(), moveNumber: 5 },
                    { player: 'white', row: 9, col: 6, timestamp: new Date().toISOString(), moveNumber: 6 },
                    { player: 'black', row: 4, col: 7, timestamp: new Date().toISOString(), moveNumber: 7 },
                    { player: 'white', row: 10, col: 6, timestamp: new Date().toISOString(), moveNumber: 8 },
                    { player: 'black', row: 3, col: 7, timestamp: new Date().toISOString(), moveNumber: 9 }
                ],
                winner: 'black',
                totalMoves: 9
            },
            {
                gameId: 'default_3',
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                moves: [
                    { player: 'black', row: 6, col: 6, timestamp: new Date().toISOString(), moveNumber: 1 },
                    { player: 'white', row: 7, col: 7, timestamp: new Date().toISOString(), moveNumber: 2 },
                    { player: 'black', row: 6, col: 7, timestamp: new Date().toISOString(), moveNumber: 3 },
                    { player: 'white', row: 7, col: 6, timestamp: new Date().toISOString(), moveNumber: 4 },
                    { player: 'black', row: 6, col: 8, timestamp: new Date().toISOString(), moveNumber: 5 },
                    { player: 'white', row: 7, col: 5, timestamp: new Date().toISOString(), moveNumber: 6 },
                    { player: 'black', row: 6, col: 9, timestamp: new Date().toISOString(), moveNumber: 7 },
                    { player: 'white', row: 7, col: 4, timestamp: new Date().toISOString(), moveNumber: 8 },
                    { player: 'black', row: 6, col: 10, timestamp: new Date().toISOString(), moveNumber: 9 }
                ],
                winner: 'black',
                totalMoves: 9
            },
            {
                gameId: 'default_4',
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                moves: [
                    { player: 'black', row: 7, col: 7, timestamp: new Date().toISOString(), moveNumber: 1 },
                    { player: 'white', row: 8, col: 8, timestamp: new Date().toISOString(), moveNumber: 2 },
                    { player: 'black', row: 6, col: 6, timestamp: new Date().toISOString(), moveNumber: 3 },
                    { player: 'white', row: 9, col: 9, timestamp: new Date().toISOString(), moveNumber: 4 },
                    { player: 'black', row: 5, col: 5, timestamp: new Date().toISOString(), moveNumber: 5 },
                    { player: 'white', row: 10, col: 10, timestamp: new Date().toISOString(), moveNumber: 6 },
                    { player: 'black', row: 4, col: 4, timestamp: new Date().toISOString(), moveNumber: 7 },
                    { player: 'white', row: 11, col: 11, timestamp: new Date().toISOString(), moveNumber: 8 },
                    { player: 'black', row: 3, col: 3, timestamp: new Date().toISOString(), moveNumber: 9 }
                ],
                winner: 'black',
                totalMoves: 9
            },
            {
                gameId: 'default_5',
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                moves: [
                    { player: 'black', row: 7, col: 7, timestamp: new Date().toISOString(), moveNumber: 1 },
                    { player: 'white', row: 8, col: 7, timestamp: new Date().toISOString(), moveNumber: 2 },
                    { player: 'black', row: 7, col: 6, timestamp: new Date().toISOString(), moveNumber: 3 },
                    { player: 'white', row: 9, col: 7, timestamp: new Date().toISOString(), moveNumber: 4 },
                    { player: 'black', row: 7, col: 8, timestamp: new Date().toISOString(), moveNumber: 5 },
                    { player: 'white', row: 10, col: 7, timestamp: new Date().toISOString(), moveNumber: 6 },
                    { player: 'black', row: 7, col: 5, timestamp: new Date().toISOString(), moveNumber: 7 },
                    { player: 'white', row: 11, col: 7, timestamp: new Date().toISOString(), moveNumber: 8 },
                    { player: 'black', row: 7, col: 4, timestamp: new Date().toISOString(), moveNumber: 9 }
                ],
                winner: 'black',
                totalMoves: 9
            }
        ];
        
        // 保存预设记录到localStorage
        try {
            const compressedRecords = defaultRecords.map(r => this.compressGameRecord(r));
            localStorage.setItem(this.storageKey, JSON.stringify(compressedRecords));
            console.log('预设对弈记录已保存');
            
            // 对预设数据进行训练
            this.trainAI();
        } catch (error) {
            console.error('保存预设训练数据失败:', error);
        }
    }
    
    // 清除训练数据
    clearTrainingData() {
        try {
            localStorage.removeItem(this.aiTraining.trainingDataKey);
            this.aiTraining.isTrained = false;
            this.aiTraining.patternWeights = {
                five: 100000,
                openFour: 10000,
                closedFour: 1000,
                openThree: 1000,
                closedThree: 100,
                openTwo: 100,
                closedTwo: 10,
                userPreferredPositions: {},
                userAggressiveness: 0.5,
                userDefensiveness: 0.5,
                userCenterPreference: 0.5,
            };
            this.aiTraining.openingBook = {};
            this.aiTraining.lastTrainingTime = null;
            this.aiTraining.totalGamesAnalyzed = 0;
            return true;
        } catch (error) {
            console.error('清除AI训练数据失败:', error);
            return false;
        }
    }
    
    // ==================== AI训练系统方法结束 ====================
    
    initializeBoard() {
        this.board = [];
        for (let i = 0; i < this.boardSize; i++) {
            const row = [];
            for (let j = 0; j < this.boardSize; j++) {
                row.push(null);
            }
            this.board.push(row);
        }
    }
    
    setupEventListeners() {
        // 重新开始
        document.getElementById('restart').addEventListener('click', () => this.restartGame());
        
        // 训练控制按钮
        const trainBtn = document.getElementById('train-ai-btn');
        const autoLearnBtn = document.getElementById('auto-learn-btn');
        const cancelBtn = document.getElementById('cancel-training-btn');
        const cleanupBtn = document.getElementById('cleanup-btn');
        const closeResultBtn = document.getElementById('close-result-btn');
        
        if (trainBtn) {
            trainBtn.addEventListener('click', () => this.startTraining());
        }
        
        if (autoLearnBtn) {
            autoLearnBtn.addEventListener('click', () => this.startAutoLearning());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (this.autoLearnState.isLearning) {
                    this.cancelAutoLearning();
                } else {
                    this.cancelTraining();
                }
            });
        }
        
        if (cleanupBtn) {
            cleanupBtn.addEventListener('click', () => this.handleCleanup());
        }
        
        if (closeResultBtn) {
            closeResultBtn.addEventListener('click', () => this.closeTrainingResult());
        }
        
        // 初始化存储空间显示
        this.updateStorageUI();
    }
    
    // ==================== 训练状态反馈界面方法 ====================
    
    // 开始训练（手动触发）
    startTraining() {
        if (this.trainingState.isTraining) {
            return;
        }
        
        const records = this.getAllGameRecords();
        if (records.length === 0) {
            alert('暂无对弈记录，请先进行几局游戏后再训练AI！');
            return;
        }
        
        // 重置训练状态
        this.trainingState = {
            isTraining: true,
            progress: 0,
            analyzedGames: 0,
            foundPatterns: 0,
            cancelRequested: false,
            totalGames: records.length,
            startTime: Date.now(),
            analysis: null
        };
        
        // 显示训练面板
        this.showTrainingPanel();
        this.updateTrainingUI();
        
        // 开始训练
        this.performTrainingWithProgress(records);
    }
    
    // 显示训练面板
    showTrainingPanel() {
        const panel = document.getElementById('training-panel');
        const trainBtn = document.getElementById('train-ai-btn');
        
        if (panel) {
            panel.classList.add('active');
        }
        
        if (trainBtn) {
            trainBtn.disabled = true;
            trainBtn.textContent = '训练中...';
        }
    }
    
    // 隐藏训练面板
    hideTrainingPanel() {
        const panel = document.getElementById('training-panel');
        const trainBtn = document.getElementById('train-ai-btn');
        const autoLearnBtn = document.getElementById('auto-learn-btn');
        
        if (panel) {
            panel.classList.remove('active');
        }
        
        if (trainBtn) {
            trainBtn.disabled = false;
            trainBtn.textContent = '开始训练';
        }
        
        if (autoLearnBtn) {
            autoLearnBtn.disabled = false;
            autoLearnBtn.textContent = '自动学习';
        }
    }
    
    // ==================== 自动学习功能 ====================
    
    // 开始自动学习
    startAutoLearning() {
        if (this.autoLearnState.isLearning) {
            return;
        }
        
        // 重置自动学习状态
        this.autoLearnState = {
            isLearning: true,
            progress: 0,
            completedGames: 0,
            totalGames: 50, // 默认自我对弈50局
            currentGame: 0,
            cancelRequested: false,
            startTime: Date.now(),
            performanceData: [],
            isPaused: false
        };
        
        // 显示训练面板
        this.showTrainingPanel();
        
        // 禁用按钮
        const autoLearnBtn = document.getElementById('auto-learn-btn');
        if (autoLearnBtn) {
            autoLearnBtn.disabled = true;
            autoLearnBtn.textContent = '学习中...';
        }
        
        // 开始自动学习
        this.performAutoLearning();
    }
    
    // 执行自动学习
    async performAutoLearning() {
        try {
            const { totalGames } = this.autoLearnState;
            
            // 禁用棋盘交互
            this.setBoardInteraction(false);
            
            for (let i = 0; i < totalGames; i++) {
                // 检查是否请求取消
                if (this.autoLearnState.cancelRequested) {
                    console.log('自动学习已取消');
                    this.autoLearnState.isLearning = false;
                    this.autoLearnState.progress = 0;
                    this.autoLearnState.completedGames = 0;
                    this.autoLearnState.currentGame = 0;
                    this.setBoardInteraction(true);
                    this.updateAutoLearnUI();
                    this.hideTrainingPanel();
                    return;
                }
                
                // 检查是否暂停
                while (this.autoLearnState.isPaused) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                // 更新当前游戏进度
                this.autoLearnState.currentGame = i + 1;
                this.autoLearnState.progress = (i / totalGames) * 100;
                this.updateAutoLearnUI();
                
                // 轮换先手，确保公平性
                const firstPlayer = i % 2 === 0 ? 'black' : 'white';
                
                // 模拟自我对弈
                const gameResult = await this.simulateSelfGame(firstPlayer);
                
                // 检查是否被取消
                if (gameResult.cancelled) {
                    console.log('对局被取消，跳过记录');
                    break;
                }
                
                // 记录性能数据
                this.autoLearnState.performanceData.push(gameResult);
                this.autoLearnState.completedGames++;
                
                // 立即更新UI，确保数据实时显示
                this.updateAutoLearnUI();
                
                // 让出时间片，避免阻塞UI
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
            
            // 完成自动学习
            this.autoLearnState.isLearning = false;
            this.autoLearnState.progress = 100;
            this.updateAutoLearnUI();
            
            // 恢复棋盘交互
            this.setBoardInteraction(true);
            
            // 触发AI训练，使用新的自我对弈数据
            this.trainAI();
            
            // 显示学习结果
            this.showAutoLearnResult();
            
            // 隐藏训练面板
            this.hideTrainingPanel();
        } catch (error) {
            console.error('自动学习过程中发生错误:', error);
            
            // 恢复棋盘交互
            this.setBoardInteraction(true);
            
            // 重置训练状态
            this.autoLearnState.isLearning = false;
            this.autoLearnState.progress = 0;
            this.autoLearnState.completedGames = 0;
            this.autoLearnState.currentGame = 0;
            this.autoLearnState.cancelRequested = false;
            
            // 更新UI
            this.updateAutoLearnUI();
            
            // 显示错误信息
            const statusEl = document.getElementById('training-status');
            if (statusEl) {
                statusEl.textContent = `训练过程中发生错误: ${error.message}`;
            }
            
            // 隐藏训练面板
            setTimeout(() => {
                this.hideTrainingPanel();
            }, 2000);
        }
    }
    
    // 模拟自我对弈
    async simulateSelfGame(firstPlayer = 'black') {
        try {
            // 创建一个临时棋盘
            const tempBoard = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
            const moves = [];
            let currentPlayer = firstPlayer;
            let gameStatus = 'playing';
            let winner = null;
            let moveCount = 0;
            
            const startTime = Date.now();
            
            // 模拟对局过程
            while (gameStatus === 'playing' && moveCount < 225) { // 15x15棋盘最多225步
                // 检查是否请求取消
                if (this.autoLearnState.cancelRequested) {
                    console.log('自我对弈已取消');
                    // 重置游戏状态
                    gameStatus = 'ended';
                    winner = null;
                    break;
                }
                
                try {
                    // 生成AI落子
                    const move = this.getAIMove(tempBoard, currentPlayer);
                    
                    if (!move) {
                        break; // 没有可用位置
                    }
                    
                    // 落子到临时棋盘
                    tempBoard[move.row][move.col] = currentPlayer;
                    
                    // 同时更新实际棋盘用于可视化
                    this.board[move.row][move.col] = currentPlayer;
                    this.renderBoard();
                    
                    moves.push({ 
                        player: currentPlayer, 
                        row: move.row, 
                        col: move.col, 
                        timestamp: new Date().toISOString(),
                        moveNumber: moveCount + 1
                    });
                    
                    moveCount++;
                    
                    // 检查胜负
                    if (this.checkWin(move.row, move.col, currentPlayer, tempBoard)) {
                        winner = currentPlayer;
                        gameStatus = 'ended';
                    } else if (moveCount === 225) {
                        gameStatus = 'ended'; // 平局
                    }
                    
                    // 切换玩家
                    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
                    
                    // 添加延迟，使用户可以观察到落子过程
                    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms延迟，使可视化效果更明显
                    
                    // 添加随机延迟，模拟AI思考时间，使时间数据更加真实
                    const randomDelay = Math.floor(Math.random() * 10) + 1; // 1-10ms的随机延迟
                    await new Promise(resolve => setTimeout(resolve, randomDelay));
                } catch (stepError) {
                    console.error('自我对弈步骤错误:', stepError);
                    // 继续下一局，不影响整体训练
                    break;
                }
            }
            
            const endTime = Date.now();
            
            // 检查是否被取消
            if (this.autoLearnState.cancelRequested) {
                console.log('取消后不保存游戏记录');
                // 清空棋盘
                this.initializeBoard();
                this.renderBoard();
                return {
                    gameId: null,
                    winner: null,
                    moveCount: moveCount,
                    duration: endTime - startTime,
                    cancelled: true
                };
            }
            
            // 创建游戏记录
            const gameRecord = {
                gameId: `auto_${Date.now()}`,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                moves: moves,
                winner: winner,
                totalMoves: moveCount
            };
            
            // 保存游戏记录
            this.saveGameRecord(gameRecord);
            
            // 清空棋盘，为下一局做准备
            this.initializeBoard();
            this.renderBoard();
            
            return {
                gameId: gameRecord.gameId,
                winner: winner,
                moveCount: moveCount,
                duration: endTime - startTime
            };
        } catch (error) {
            console.error('自我对弈过程中发生错误:', error);
            // 清空棋盘
            this.initializeBoard();
            this.renderBoard();
            return {
                gameId: null,
                winner: null,
                moveCount: 0,
                duration: 0,
                cancelled: true,
                error: error.message
            };
        }
    }
    
    // 获取AI落子（用于自我对弈）
    getAIMove(board, player) {
        // 简单的AI落子逻辑，基于评分
        const emptyPositions = [];
        
        // 收集所有空位置
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (!board[i][j]) {
                    emptyPositions.push({ row: i, col: j });
                }
            }
        }
        
        if (emptyPositions.length === 0) {
            return null;
        }
        
        // 对每个位置进行评分
        const scoredPositions = emptyPositions.map(pos => {
            const score = this.evaluatePosition(board, pos.row, pos.col, player);
            return { ...pos, score };
        });
        
        // 按评分排序
        scoredPositions.sort((a, b) => b.score - a.score);
        
        // 返回评分最高的位置
        return scoredPositions[0];
    }
    
    // 评估位置的分数
    evaluatePosition(board, row, col, player) {
        let score = 0;
        const opponent = player === 'black' ? 'white' : 'black';
        
        // 模拟落子
        board[row][col] = player;
        
        // 评估当前玩家的优势
        score += this.evaluateLine(board, row, col, player) * 1.2; // 进攻权重稍高
        
        // 评估对手的威胁
        score += this.evaluateLine(board, row, col, opponent);
        
        // 撤销落子
        board[row][col] = null;
        
        // 中心位置奖励
        const center = Math.floor(this.boardSize / 2);
        const distanceToCenter = Math.abs(row - center) + Math.abs(col - center);
        score += (10 - distanceToCenter) * 0.1;
        
        return score;
    }
    
    // 评估某位置的线条
    evaluateLine(board, row, col, player) {
        let score = 0;
        const directions = [
            [1, 0],   // 水平
            [0, 1],   // 垂直
            [1, 1],   // 对角线
            [1, -1]   // 反对角线
        ];
        
        directions.forEach(([dr, dc]) => {
            let lineScore = 0;
            let consecutive = 0;
            let openEnds = 0;
            
            // 检查正方向
            for (let i = 1; i < 5; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
                    if (board[r][c] === player) {
                        consecutive++;
                    } else if (!board[r][c]) {
                        openEnds++;
                        break;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
            
            // 检查反方向
            for (let i = 1; i < 5; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
                    if (board[r][c] === player) {
                        consecutive++;
                    } else if (!board[r][c]) {
                        openEnds++;
                        break;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
            
            // 根据连续子数和开放端计算分数
            if (consecutive >= 4) {
                lineScore = 100000; // 五连
            } else if (consecutive === 3 && openEnds === 2) {
                lineScore = 10000; // 活四
            } else if (consecutive === 3 && openEnds === 1) {
                lineScore = 1000; // 冲四
            } else if (consecutive === 2 && openEnds === 2) {
                lineScore = 1000; // 活三
            } else if (consecutive === 2 && openEnds === 1) {
                lineScore = 100; // 眠三
            } else if (consecutive === 1 && openEnds === 2) {
                lineScore = 100; // 活二
            } else if (consecutive === 1 && openEnds === 1) {
                lineScore = 10; // 眠二
            }
            
            score += lineScore;
        });
        
        return score;
    }
    
    // 更新自动学习UI
    updateAutoLearnUI() {
        const progressEl = document.getElementById('training-progress');
        const progressPercentEl = document.getElementById('progress-percent');
        const statusEl = document.getElementById('training-status');
        const statGamesEl = document.getElementById('stat-games');
        const statPatternsEl = document.getElementById('stat-patterns');
        const statBlackWinsEl = document.getElementById('stat-black-wins');
        const statWhiteWinsEl = document.getElementById('stat-white-wins');
        const detailTotalGamesEl = document.getElementById('detail-total-games');
        const detailAvgMovesEl = document.getElementById('detail-avg-moves');
        const detailAvgDurationEl = document.getElementById('detail-avg-duration');
        const detailTotalDurationEl = document.getElementById('detail-total-duration');
        
        if (progressEl) {
            progressEl.style.width = this.autoLearnState.progress + '%';
        }
        
        if (progressPercentEl) {
            progressPercentEl.textContent = Math.round(this.autoLearnState.progress) + '%';
        }
        
        if (statGamesEl) {
            statGamesEl.textContent = this.autoLearnState.completedGames;
        }
        
        if (statPatternsEl) {
            statPatternsEl.textContent = this.autoLearnState.currentGame;
        }
        
        // 统计黑子和白子的胜场
        if (statBlackWinsEl && statWhiteWinsEl) {
            const blackWins = this.autoLearnState.performanceData.filter(game => game.winner === 'black').length;
            const whiteWins = this.autoLearnState.performanceData.filter(game => game.winner === 'white').length;
            statBlackWinsEl.textContent = blackWins;
            statWhiteWinsEl.textContent = whiteWins;
        }
        
        // 更新训练详情
        if (detailTotalGamesEl) {
            detailTotalGamesEl.textContent = this.autoLearnState.totalGames;
        }
        
        if (detailAvgMovesEl && this.autoLearnState.performanceData.length > 0) {
            const avgMoves = this.autoLearnState.performanceData.reduce((sum, game) => sum + game.moveCount, 0) / this.autoLearnState.performanceData.length;
            detailAvgMovesEl.textContent = avgMoves.toFixed(1);
        }
        
        if (detailAvgDurationEl && this.autoLearnState.performanceData.length > 0) {
            const avgDuration = this.autoLearnState.performanceData.reduce((sum, game) => sum + game.duration, 0) / this.autoLearnState.performanceData.length;
            detailAvgDurationEl.textContent = (avgDuration / 1000).toFixed(2) + 's';
        }
        
        if (detailTotalDurationEl && this.autoLearnState.startTime) {
            const totalDuration = Date.now() - this.autoLearnState.startTime;
            detailTotalDurationEl.textContent = (totalDuration / 1000).toFixed(2) + 's';
        }
        
        if (statusEl) {
            if (this.autoLearnState.isLearning) {
                statusEl.textContent = `自我对弈中：第 ${this.autoLearnState.currentGame}/${this.autoLearnState.totalGames} 局`;
            } else if (this.autoLearnState.progress >= 100) {
                statusEl.textContent = '自动学习完成！';
            } else if (this.autoLearnState.cancelRequested) {
                statusEl.textContent = '训练已取消';
            } else {
                statusEl.textContent = '准备开始自动学习...';
            }
        }
    }
    
    // 取消自动学习
    cancelAutoLearning() {
        this.autoLearnState.cancelRequested = true;
        console.log('取消自动学习请求已发送');
        
        // 更新UI状态
        const statusEl = document.getElementById('training-status');
        if (statusEl) {
            statusEl.textContent = '正在取消训练...';
        }
    }
    
    // 暂停自动学习
    pauseAutoLearning() {
        this.autoLearnState.isPaused = true;
    }
    
    // 继续自动学习
    resumeAutoLearning() {
        this.autoLearnState.isPaused = false;
    }
    
    // 显示自动学习结果
    showAutoLearnResult() {
        const modal = document.getElementById('training-result-modal');
        const summary = document.getElementById('training-result-summary');
        
        if (!modal || !summary) return;
        
        const { performanceData, totalGames, startTime } = this.autoLearnState;
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 统计数据
        const blackWins = performanceData.filter(game => game.winner === 'black').length;
        const whiteWins = performanceData.filter(game => game.winner === 'white').length;
        const draws = performanceData.filter(game => !game.winner).length;
        const avgMoves = performanceData.reduce((sum, game) => sum + game.moveCount, 0) / performanceData.length;
        const avgDuration = performanceData.reduce((sum, game) => sum + game.duration, 0) / performanceData.length;
        
        // 生成结果HTML
        const resultHTML = `
            <div class="result-item">
                <span class="result-label">总对局数</span>
                <span class="result-value">${totalGames}</span>
            </div>
            <div class="result-item">
                <span class="result-label">黑子胜</span>
                <span class="result-value">${blackWins} 局</span>
            </div>
            <div class="result-item">
                <span class="result-label">白子胜</span>
                <span class="result-value">${whiteWins} 局</span>
            </div>
            <div class="result-item">
                <span class="result-label">平局</span>
                <span class="result-value">${draws} 局</span>
            </div>
            <div class="result-item">
                <span class="result-label">平均步数</span>
                <span class="result-value">${avgMoves.toFixed(1)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">平均时长</span>
                <span class="result-value">${(avgDuration / 1000).toFixed(2)}s</span>
            </div>
            <div class="result-item">
                <span class="result-label">总耗时</span>
                <span class="result-value">${(duration / 1000).toFixed(2)}s</span>
            </div>
        `;
        
        summary.innerHTML = resultHTML;
        modal.classList.add('active');
    }
    
    // 更新训练UI
    updateTrainingUI() {
        const progressEl = document.getElementById('training-progress');
        const progressPercentEl = document.getElementById('progress-percent');
        const statusEl = document.getElementById('training-status');
        const statGamesEl = document.getElementById('stat-games');
        const statPatternsEl = document.getElementById('stat-patterns');
        
        if (progressEl) {
            progressEl.style.width = this.trainingState.progress + '%';
        }
        
        if (progressPercentEl) {
            progressPercentEl.textContent = Math.round(this.trainingState.progress) + '%';
        }
        
        if (statGamesEl) {
            statGamesEl.textContent = this.trainingState.analyzedGames;
        }
        
        if (statPatternsEl) {
            statPatternsEl.textContent = this.trainingState.foundPatterns;
        }
        
        if (statusEl) {
            if (this.trainingState.isTraining) {
                statusEl.textContent = `正在分析第 ${this.trainingState.analyzedGames}/${this.trainingState.totalGames} 局...`;
            } else if (this.trainingState.progress >= 100) {
                statusEl.textContent = '训练完成！';
            } else {
                statusEl.textContent = '准备开始训练...';
            }
        }
    }
    
    // 带进度反馈的训练执行
    async performTrainingWithProgress(records) {
        const startTime = Date.now();
        
        // 禁用棋盘交互，防止训练期间游戏数据混乱
        this.setBoardInteraction(false);
        
        // 初始化分析结果
        const analysis = {
            positionFrequency: {},
            firstMovePositions: [],
            secondMovePositions: [],
            totalMoves: 0,
            userWins: 0,
            aiWins: 0,
            draws: 0,
            averageGameLength: 0,
            aggressiveMoves: 0,
            defensiveMoves: 0,
            centerMoves: 0,
            edgeMoves: 0,
            commonPatterns: {},
            openingMoves: {}
        };
        
        const centerStart = Math.floor(this.boardSize / 2) - 2;
        const centerEnd = Math.floor(this.boardSize / 2) + 2;
        
        // 批量处理大小（每批处理的记录数）
        const batchSize = 10;
        const totalRecords = records.length;
        
        // 分批处理，避免阻塞UI
        for (let batchStart = 0; batchStart < totalRecords; batchStart += batchSize) {
            // 检查是否请求取消
            if (this.trainingState.cancelRequested) {
                console.log('训练已取消');
                this.trainingState.isTraining = false;
                this.setBoardInteraction(true);
                this.hideTrainingPanel();
                return;
            }
            
            const batchEnd = Math.min(batchStart + batchSize, totalRecords);
            
            // 处理当前批次
            for (let i = batchStart; i < batchEnd; i++) {
                const record = records[i];
                
                // 统计胜负
                if (record.winner === 'black') {
                    analysis.userWins++;
                } else if (record.winner === 'white') {
                    analysis.aiWins++;
                } else {
                    analysis.draws++;
                }
                
                // 统计对局长度
                analysis.totalMoves += record.moves.length;
                
                // 分析每一步
                record.moves.forEach((move, index) => {
                    if (move.player === 'black') {
                        const posKey = `${move.row},${move.col}`;
                        
                        // 统计位置频率
                        analysis.positionFrequency[posKey] = (analysis.positionFrequency[posKey] || 0) + 1;
                        
                        // 统计首步和第二步
                        if (index === 0) {
                            analysis.firstMovePositions.push({ row: move.row, col: move.col });
                        } else if (index === 2) {
                            analysis.secondMovePositions.push({ row: move.row, col: move.col });
                        }
                        
                        // 判断中心偏好
                        if (move.row >= centerStart && move.row <= centerEnd && 
                            move.col >= centerStart && move.col <= centerEnd) {
                            analysis.centerMoves++;
                        } else if (move.row <= 2 || move.row >= this.boardSize - 3 || 
                                   move.col <= 2 || move.col >= this.boardSize - 3) {
                            analysis.edgeMoves++;
                        }
                        
                        // 收集开局数据
                        if (index < 6) {
                            const openingKey = `move${index}_${move.row}_${move.col}`;
                            analysis.openingMoves[openingKey] = (analysis.openingMoves[openingKey] || 0) + 1;
                        }
                    }
                });
                
                // 分析棋型
                this.analyzePatternsInGame(record, analysis);
            }
            
            // 更新进度
            this.trainingState.analyzedGames = batchEnd;
            this.trainingState.progress = (batchEnd / totalRecords) * 100;
            this.trainingState.foundPatterns = Object.keys(analysis.positionFrequency).length;
            
            // 更新UI
            this.updateTrainingUI();
            
            // 让出时间片，避免阻塞UI
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
        
        // 计算平均值
        analysis.averageGameLength = analysis.totalMoves / records.length;
        
        // 计算进攻/防守倾向
        const userMoves = analysis.totalMoves / 2;
        analysis.aggressiveness = analysis.aggressiveMoves / Math.max(userMoves, 1);
        analysis.defensiveness = analysis.defensiveMoves / Math.max(userMoves, 1);
        analysis.centerPreference = analysis.centerMoves / Math.max(userMoves, 1);
        
        // 保存分析结果
        this.trainingState.analysis = analysis;
        
        // 更新AI参数
        this.updateAIParameters(analysis);
        
        // 更新训练状态
        this.aiTraining.isTrained = true;
        this.aiTraining.lastTrainingTime = new Date().toISOString();
        this.aiTraining.totalGamesAnalyzed = records.length;
        
        // 保存训练数据
        this.saveTrainingData();
        
        // 标记训练完成
        this.trainingState.isTraining = false;
        this.trainingState.progress = 100;
        this.updateTrainingUI();
        
        // 恢复棋盘交互
        this.setBoardInteraction(true);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`AI训练完成，耗时 ${duration}ms，分析了 ${records.length} 场对局`);
        
        // 显示训练结果
        setTimeout(() => {
            this.showTrainingResult({
                duration,
                analyzedGames: records.length,
                analysis
            });
            this.hideTrainingPanel();
            this.updateStorageUI();
        }, 500);
    }
    
    // 设置棋盘交互状态
    setBoardInteraction(enabled) {
        const board = document.getElementById('board');
        const restartBtn = document.getElementById('restart');
        
        if (board) {
            if (enabled) {
                board.style.pointerEvents = '';
                board.style.opacity = '';
            } else {
                board.style.pointerEvents = 'none';
                board.style.opacity = '0.6';
            }
        }
        
        if (restartBtn) {
            restartBtn.disabled = !enabled;
        }
    }
    
    // 取消训练
    cancelTraining() {
        if (this.trainingState.isTraining) {
            this.trainingState.cancelRequested = true;
            const statusEl = document.getElementById('training-status');
            if (statusEl) {
                statusEl.textContent = '正在取消训练...';
            }
        }
    }
    
    // 显示训练结果
    showTrainingResult(result) {
        const modal = document.getElementById('training-result-modal');
        const summaryEl = document.getElementById('training-result-summary');
        
        if (!modal || !summaryEl) return;
        
        const { duration, analyzedGames, analysis } = result;
        
        // 计算学习到的偏好
        const aggressiveness = Math.round((analysis.aggressiveness || 0.5) * 100);
        const defensiveness = Math.round((analysis.defensiveness || 0.5) * 100);
        const centerPref = Math.round((analysis.centerPreference || 0.5) * 100);
        
        // 确定主要风格
        let playStyle = '均衡型';
        if (aggressiveness > 60) playStyle = '进攻型';
        else if (defensiveness > 60) playStyle = '防守型';
        else if (centerPref > 60) playStyle = '控制中心型';
        
        // 构建结果HTML
        summaryEl.innerHTML = `
            <div class="result-item">
                <span class="result-label">📊 分析局数</span>
                <span class="result-value">${analyzedGames} 局</span>
            </div>
            <div class="result-item">
                <span class="result-label">⏱️ 训练耗时</span>
                <span class="result-value">${(duration / 1000).toFixed(2)} 秒</span>
            </div>
            <div class="result-item">
                <span class="result-label">🎯 发现模式</span>
                <span class="result-value">${Object.keys(analysis.positionFrequency).length} 个</span>
            </div>
            <div class="result-item">
                <span class="result-label">🏆 你的胜率</span>
                <span class="result-value">${Math.round((analysis.userWins / analyzedGames) * 100)}%</span>
            </div>
            <div class="result-item">
                <span class="result-label">🎨 棋风类型</span>
                <span class="result-value">${playStyle}</span>
            </div>
            <div class="result-item">
                <span class="result-label">⚔️ 进攻倾向</span>
                <span class="result-value">${aggressiveness}%</span>
            </div>
            <div class="result-item">
                <span class="result-label">🛡️ 防守倾向</span>
                <span class="result-value">${defensiveness}%</span>
            </div>
            <div class="result-item">
                <span class="result-label">📍 中心偏好</span>
                <span class="result-value">${centerPref}%</span>
            </div>
        `;
        
        modal.classList.add('active');
        
        // 显示AI对话反馈
        const winRate = Math.round((analysis.userWins / analyzedGames) * 100);
        let feedbackMessage = '';
        if (winRate > 70) {
            feedbackMessage = `训练完成！你赢了 ${winRate}% 的对局，太强了！我会继续学习你的棋风。`;
        } else if (winRate > 40) {
            feedbackMessage = `训练完成！我们的对局很精彩，我会学习你的${playStyle}风格来提升自己！`;
        } else {
            feedbackMessage = `训练完成！我已经分析了你的下棋习惯，下次我会更有针对性地应对！`;
        }
        this.showDialog(feedbackMessage);
    }
    
    // 关闭训练结果弹窗
    closeTrainingResult() {
        const modal = document.getElementById('training-result-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    // 更新存储空间UI
    updateStorageUI() {
        const storageFill = document.getElementById('storage-fill');
        const storageText = document.getElementById('storage-text');
        
        if (!storageFill || !storageText) return;
        
        const usage = this.getStorageUsage();
        const limit = this.getStorageLimit();
        const percentage = this.getStoragePercentage();
        
        storageFill.style.width = percentage + '%';
        storageText.textContent = `${this.formatStorageSize(usage)} / ${this.formatStorageSize(limit)}`;
        
        // 根据使用率设置颜色
        storageFill.classList.remove('warning', 'danger');
        if (percentage >= 90) {
            storageFill.classList.add('danger');
        } else if (percentage >= 70) {
            storageFill.classList.add('warning');
        }
    }
    
    // 处理清理按钮点击
    handleCleanup() {
        const result = this.manualCleanup(30);
        
        if (result.success) {
            if (result.removed > 0) {
                alert(`清理完成！已删除 ${result.removed} 条旧记录，保留 ${result.remaining} 条最新记录。`);
            } else {
                alert(`当前记录数 ${result.remaining}，无需清理。`);
            }
            this.updateStorageUI();
        } else {
            alert('清理失败：' + (result.error || '未知错误'));
        }
    }
    
    renderBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < this.boardSize; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('td');
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                if (this.board[i][j]) {
                    const piece = document.createElement('div');
                    piece.className = `piece ${this.board[i][j]}`;
                    cell.appendChild(piece);
                }
                
                cell.addEventListener('click', () => this.handleCellClick(i, j));
                row.appendChild(cell);
            }
            boardElement.appendChild(row);
        }
    }
    
    handleCellClick(row, col) {
        // 如果游戏未开始，点击棋盘开始游戏
        if (this.gameStatus === 'ready') {
            this.startGame();
            // 如果点击的是有效位置，继续处理落子
            if (this.board[row][col] !== null) {
                return;
            }
        }
        
        if (this.gameStatus !== 'playing' || this.board[row][col] !== null) {
            return;
        }
        
        // 玩家落子
        this.makeMove(row, col, this.currentPlayer);
        
        // 玩家落子后显示评论（30%概率，避免过于频繁）
        if (Math.random() < 0.3) {
            const dialogue = this.getRandomDialogue('playerMove');
            this.showDialog(dialogue);
        }
        
        // 检查胜负
        if (this.checkWin(row, col, this.currentPlayer)) {
            this.endGame(this.currentPlayer);
            return;
        }
        
        // 检查平局
        if (this.checkDraw()) {
            this.endGame(null);
            return;
        }
        
        // 切换玩家
        this.currentPlayer = 'white';
        this.updateStatus('AI思考中...');
        
        // 显示AI思考中的对话
        this.showDialog("让我想想...", true);
        
        // AI落子
        setTimeout(() => {
            this.aiMove();
        }, 500);
    }
    
    makeMove(row, col, player) {
        this.board[row][col] = player;
        this.renderBoard();
        
        // 记录这一步棋
        this.recordMove(row, col, player);
    }
    
    checkWin(row, col, player, board = null) {
        // 使用提供的棋盘或默认使用当前棋盘
        const checkBoard = board || this.board;
        
        // 检查水平
        let count = 1;
        let j = col - 1;
        while (j >= 0 && checkBoard[row][j] === player) {
            count++;
            j--;
        }
        j = col + 1;
        while (j < this.boardSize && checkBoard[row][j] === player) {
            count++;
            j++;
        }
        if (count >= 5) return true;
        
        // 检查垂直
        count = 1;
        let i = row - 1;
        while (i >= 0 && checkBoard[i][col] === player) {
            count++;
            i--;
        }
        i = row + 1;
        while (i < this.boardSize && checkBoard[i][col] === player) {
            count++;
            i++;
        }
        if (count >= 5) return true;
        
        // 检查对角线
        count = 1;
        i = row - 1;
        j = col - 1;
        while (i >= 0 && j >= 0 && checkBoard[i][j] === player) {
            count++;
            i--;
            j--;
        }
        i = row + 1;
        j = col + 1;
        while (i < this.boardSize && j < this.boardSize && checkBoard[i][j] === player) {
            count++;
            i++;
            j++;
        }
        if (count >= 5) return true;
        
        // 检查反对角线
        count = 1;
        i = row - 1;
        j = col + 1;
        while (i >= 0 && j < this.boardSize && checkBoard[i][j] === player) {
            count++;
            i--;
            j++;
        }
        i = row + 1;
        j = col - 1;
        while (i < this.boardSize && j >= 0 && checkBoard[i][j] === player) {
            count++;
            i++;
            j--;
        }
        if (count >= 5) return true;
        
        return false;
    }
    
    checkDraw() {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === null) {
                    return false;
                }
            }
        }
        return true;
    }
    
    aiMove() {
        const move = this.getBestMove();
        if (move) {
            this.makeMove(move.row, move.col, 'white');
            
            // 检查胜负
            if (this.checkWin(move.row, move.col, 'white')) {
                this.endGame('white');
                return;
            }
            
            // 检查平局
            if (this.checkDraw()) {
                this.endGame(null);
                return;
            }
            
            // 切换玩家
            this.currentPlayer = 'black';
            this.updateStatus('你的回合 - 黑棋');
            
            // AI落子后显示随机评论（50%概率，避免过于频繁）
            if (Math.random() < 0.5) {
                const dialogue = this.getRandomDialogue('aiMove');
                this.showDialog(dialogue);
            }
        }
    }
    
    getBestMove() {
        // 检查是否可以使用开局库
        const openingMove = this.getOpeningBookMove();
        if (openingMove) {
            console.log('使用开局库:', openingMove);
            return openingMove;
        }
        
        const depth = 3;
        const result = this.minimax(depth, -Infinity, Infinity, true);
        return result.move;
    }
    
    // 从开局库获取最佳开局
    getOpeningBookMove() {
        if (!this.aiTraining.isTrained) return null;
        
        const moveCount = this.currentGameRecord ? this.currentGameRecord.moves.length : 0;
        const openingBook = this.aiTraining.openingBook;
        
        // 根据当前步数选择开局
        if (moveCount === 0 && openingBook.firstMoves && openingBook.firstMoves.length > 0) {
            // AI第一手：选择用户最常走的位置附近
            const bestMove = openingBook.firstMoves[0];
            const [row, col] = bestMove.position.split(',').map(Number);
            // 在用户偏好位置附近落子（防守策略）
            const offsetRow = Math.floor(Math.random() * 3) - 1;
            const offsetCol = Math.floor(Math.random() * 3) - 1;
            return {
                row: Math.max(0, Math.min(this.boardSize - 1, row + offsetRow)),
                col: Math.max(0, Math.min(this.boardSize - 1, col + offsetCol))
            };
        } else if (moveCount === 2 && openingBook.secondMoves && openingBook.secondMoves.length > 0) {
            // AI第二手
            const bestMove = openingBook.secondMoves[0];
            const [row, col] = bestMove.position.split(',').map(Number);
            return { row, col };
        }
        
        return null;
    }
    
    minimax(depth, alpha, beta, maximizingPlayer) {
        if (depth === 0) {
            return { score: this.evaluateBoard() };
        }
        
        const emptyCells = this.getEmptyCells();
        
        if (maximizingPlayer) {
            let maxScore = -Infinity;
            let bestMove = null;
            
            for (const cell of emptyCells) {
                this.board[cell.row][cell.col] = 'white';
                
                if (this.checkWin(cell.row, cell.col, 'white')) {
                    this.board[cell.row][cell.col] = null;
                    return { score: 1000, move: cell };
                }
                
                const result = this.minimax(depth - 1, alpha, beta, false);
                this.board[cell.row][cell.col] = null;
                
                if (result.score > maxScore) {
                    maxScore = result.score;
                    bestMove = cell;
                }
                
                alpha = Math.max(alpha, result.score);
                if (beta <= alpha) {
                    break;
                }
            }
            
            return { score: maxScore, move: bestMove };
        } else {
            let minScore = Infinity;
            let bestMove = null;
            
            for (const cell of emptyCells) {
                this.board[cell.row][cell.col] = 'black';
                
                if (this.checkWin(cell.row, cell.col, 'black')) {
                    this.board[cell.row][cell.col] = null;
                    return { score: -1000, move: cell };
                }
                
                const result = this.minimax(depth - 1, alpha, beta, true);
                this.board[cell.row][cell.col] = null;
                
                if (result.score < minScore) {
                    minScore = result.score;
                    bestMove = cell;
                }
                
                beta = Math.min(beta, result.score);
                if (beta <= alpha) {
                    break;
                }
            }
            
            return { score: minScore, move: bestMove };
        }
    }
    
    evaluateBoard() {
        let score = 0;
        
        // 评估AI的优势
        score += this.evaluatePlayer('white');
        // 评估玩家的优势
        score -= this.evaluatePlayer('black');
        
        // 如果已训练，应用用户偏好位置的防守权重
        if (this.aiTraining.isTrained) {
            score += this.applyUserPreferenceDefense();
        }
        
        return score;
    }
    
    // 应用用户偏好位置的防守权重
    applyUserPreferenceDefense() {
        let defenseScore = 0;
        const weights = this.aiTraining.patternWeights;
        const preferredPositions = weights.userPreferredPositions;
        
        // 检查用户偏好位置，加强防守
        for (const [posKey, weight] of Object.entries(preferredPositions)) {
            const [row, col] = posKey.split(',').map(Number);
            
            // 如果该位置为空，评估其战略价值
            if (this.board[row] && this.board[row][col] === null) {
                // 检查该位置附近是否有用户棋子（需要防守）
                const nearbyUserPieces = this.countNearbyPieces(row, col, 'black', 2);
                if (nearbyUserPieces > 0) {
                    // 增加防守权重
                    defenseScore += nearbyUserPieces * weight * 50;
                }
            }
        }
        
        // 根据用户中心偏好调整中心位置权重
        if (weights.userCenterPreference > 0.6) {
            // 用户喜欢中心，AI也要争夺中心
            const center = Math.floor(this.boardSize / 2);
            for (let i = center - 2; i <= center + 2; i++) {
                for (let j = center - 2; j <= center + 2; j++) {
                    if (this.board[i] && this.board[i][j] === 'white') {
                        defenseScore += 20 * weights.userCenterPreference;
                    }
                }
            }
        }
        
        return defenseScore;
    }
    
    // 计算某位置附近的棋子数量
    countNearbyPieces(row, col, player, radius) {
        let count = 0;
        for (let i = Math.max(0, row - radius); i <= Math.min(this.boardSize - 1, row + radius); i++) {
            for (let j = Math.max(0, col - radius); j <= Math.min(this.boardSize - 1, col + radius); j++) {
                if (i === row && j === col) continue;
                if (this.board[i] && this.board[i][j] === player) {
                    count++;
                }
            }
        }
        return count;
    }
    
    evaluatePlayer(player) {
        let score = 0;
        
        // 评估所有可能的连子
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === player) {
                    // 水平方向
                    score += this.evaluateLine(i, j, 0, 1, player);
                    // 垂直方向
                    score += this.evaluateLine(i, j, 1, 0, player);
                    // 对角线方向
                    score += this.evaluateLine(i, j, 1, 1, player);
                    // 反对角线方向
                    score += this.evaluateLine(i, j, 1, -1, player);
                }
            }
        }
        
        return score;
    }
    
    evaluateLine(row, col, dr, dc, player) {
        let count = 1;
        let i = row + dr;
        let j = col + dc;
        let openEnds = 0; // 记录连子两端的开放程度
        
        while (i >= 0 && i < this.boardSize && j >= 0 && j < this.boardSize && this.board[i][j] === player) {
            count++;
            i += dr;
            j += dc;
        }
        // 检查末端是否开放
        if (i >= 0 && i < this.boardSize && j >= 0 && j < this.boardSize && this.board[i][j] === null) {
            openEnds++;
        }
        
        i = row - dr;
        j = col - dc;
        while (i >= 0 && i < this.boardSize && j >= 0 && j < this.boardSize && this.board[i][j] === player) {
            count++;
            i -= dr;
            j -= dc;
        }
        // 检查另一端是否开放
        if (i >= 0 && i < this.boardSize && j >= 0 && j < this.boardSize && this.board[i][j] === null) {
            openEnds++;
        }
        
        // 使用训练后的权重（如果有）
        const weights = this.aiTraining.patternWeights;
        
        // 根据连子数量和开放程度给予不同分数
        switch (count) {
            case 5:
                return weights.five;
            case 4:
                // 活四（两端都开放）比冲四（一端开放）更有价值
                return openEnds === 2 ? weights.openFour : weights.closedFour;
            case 3:
                return openEnds === 2 ? weights.openThree : weights.closedThree;
            case 2:
                return openEnds === 2 ? weights.openTwo : weights.closedTwo;
            default:
                return 0;
        }
    }
    
    getEmptyCells() {
        const cells = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === null) {
                    cells.push({ row: i, col: j });
                }
            }
        }
        return cells;
    }
    
    startGame() {
        this.gameStatus = 'playing';
        this.currentPlayer = 'black';
        this.updateStatus('游戏开始 - 你的回合 (黑棋)');
        
        // 开始记录对弈数据
        this.startRecording();
        
        // 游戏开始时显示问候语
        const greeting = this.getRandomDialogue('greeting');
        this.showDialog(greeting);
    }
    
    restartGame() {
        this.initializeBoard();
        this.gameStatus = 'ready';
        this.winner = null;
        this.currentPlayer = 'black';
        this.renderBoard();
        this.updateStatus('准备开始 - 点击棋盘任意位置开始游戏');
        // 重置对话为初始状态
        this.showDialog('你好！我是你的五子棋对手 🤖 点击棋盘任意位置开始游戏吧！');
    }
    
    endGame(winner) {
        this.gameStatus = 'ended';
        this.winner = winner;
        
        // 结束对弈记录并保存
        this.endRecording(winner);
        
        if (winner === 'black') {
            this.updateStatus('恭喜你赢了！');
            this.saveGameResult(true);
            // 玩家获胜时显示祝贺对话
            const dialogue = this.getRandomDialogue('playerWin');
            this.showDialog(dialogue);
        } else if (winner === 'white') {
            this.updateStatus('AI赢了，再试一次！');
            this.saveGameResult(false);
            // AI获胜时显示对话
            const dialogue = this.getRandomDialogue('aiWin');
            this.showDialog(dialogue);
        } else {
            this.updateStatus('平局！');
            this.saveGameResult(null);
            // 平局时显示对话
            const dialogue = this.getRandomDialogue('draw');
            this.showDialog(dialogue);
        }
    }
    
    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }
    
    saveGameResult(isWin) {
        // 计算得分
        const score = isWin ? 1 : (isWin === false ? 0 : 0.5);
        
        // 使用GameStorage保存数据
        if (window.GameStorage) {
            GameStorage.updateScore('gomoku', score);
        } else {
            // 备用方案：直接保存到localStorage
            const currentTime = Date.now();
            const maxScoreKey = 'game_gomoku_maxScore';
            const lastPlayedKey = 'game_gomoku_lastPlayed';
            
            // 更新最高分
            const currentMax = parseInt(localStorage.getItem(maxScoreKey)) || 0;
            if (score > currentMax) {
                localStorage.setItem(maxScoreKey, score.toString());
            }
            
            // 更新最后游玩时间
            localStorage.setItem(lastPlayedKey, currentTime.toString());
        }
    }
}

// 初始化游戏
window.onload = function() {
    window.game = new GomokuGame();
};