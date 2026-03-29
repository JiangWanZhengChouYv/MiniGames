class GomokuGame {
    constructor() {
        this.boardSize = 15;
        this.board = [];
        this.currentPlayer = 'black';
        this.gameStatus = 'ready'; // ready, playing, ended
        this.winner = null;
        this.difficulty = 'easy';
        this.aiDepth = {
            easy: 2,
            medium: 3,
            hard: 4
        };
        
        this.initializeBoard();
        this.setupEventListeners();
        this.renderBoard();
    }
    
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
        // 难度选择
        document.getElementById('easy').addEventListener('click', () => this.setDifficulty('easy'));
        document.getElementById('medium').addEventListener('click', () => this.setDifficulty('medium'));
        document.getElementById('hard').addEventListener('click', () => this.setDifficulty('hard'));
        
        // 重新开始
        document.getElementById('restart').addEventListener('click', () => this.restartGame());
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        // 更新按钮状态
        document.querySelectorAll('.difficulty-buttons button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(difficulty).classList.add('active');
        
        this.updateStatus('准备开始 - 难度: ' + this.getDifficultyText());
    }
    
    getDifficultyText() {
        const texts = {
            easy: '简单',
            medium: '中等',
            hard: '困难'
        };
        return texts[this.difficulty];
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
        if (this.gameStatus !== 'playing' || this.board[row][col] !== null) {
            return;
        }
        
        // 玩家落子
        this.makeMove(row, col, this.currentPlayer);
        
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
        
        // AI落子
        setTimeout(() => {
            this.aiMove();
        }, 500);
    }
    
    makeMove(row, col, player) {
        this.board[row][col] = player;
        this.renderBoard();
    }
    
    checkWin(row, col, player) {
        // 检查水平
        let count = 1;
        let j = col - 1;
        while (j >= 0 && this.board[row][j] === player) {
            count++;
            j--;
        }
        j = col + 1;
        while (j < this.boardSize && this.board[row][j] === player) {
            count++;
            j++;
        }
        if (count >= 5) return true;
        
        // 检查垂直
        count = 1;
        let i = row - 1;
        while (i >= 0 && this.board[i][col] === player) {
            count++;
            i--;
        }
        i = row + 1;
        while (i < this.boardSize && this.board[i][col] === player) {
            count++;
            i++;
        }
        if (count >= 5) return true;
        
        // 检查对角线
        count = 1;
        i = row - 1;
        j = col - 1;
        while (i >= 0 && j >= 0 && this.board[i][j] === player) {
            count++;
            i--;
            j--;
        }
        i = row + 1;
        j = col + 1;
        while (i < this.boardSize && j < this.boardSize && this.board[i][j] === player) {
            count++;
            i++;
            j++;
        }
        if (count >= 5) return true;
        
        // 检查反对角线
        count = 1;
        i = row - 1;
        j = col + 1;
        while (i >= 0 && j < this.boardSize && this.board[i][j] === player) {
            count++;
            i--;
            j++;
        }
        i = row + 1;
        j = col - 1;
        while (i < this.boardSize && j >= 0 && this.board[i][j] === player) {
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
        }
    }
    
    getBestMove() {
        const depth = this.aiDepth[this.difficulty];
        const result = this.minimax(depth, -Infinity, Infinity, true);
        return result.move;
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
        
        return score;
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
        
        while (i >= 0 && i < this.boardSize && j >= 0 && j < this.boardSize && this.board[i][j] === player) {
            count++;
            i += dr;
            j += dc;
        }
        
        i = row - dr;
        j = col - dc;
        while (i >= 0 && i < this.boardSize && j >= 0 && j < this.boardSize && this.board[i][j] === player) {
            count++;
            i -= dr;
            j -= dc;
        }
        
        // 根据连子数量给予不同分数
        switch (count) {
            case 5:
                return 1000;
            case 4:
                return 100;
            case 3:
                return 10;
            case 2:
                return 1;
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
    }
    
    restartGame() {
        this.initializeBoard();
        this.gameStatus = 'ready';
        this.winner = null;
        this.renderBoard();
        this.updateStatus('准备开始 - 难度: ' + this.getDifficultyText());
    }
    
    endGame(winner) {
        this.gameStatus = 'ended';
        this.winner = winner;
        
        if (winner === 'black') {
            this.updateStatus('恭喜你赢了！');
            this.saveGameResult(true);
        } else if (winner === 'white') {
            this.updateStatus('AI赢了，再试一次！');
            this.saveGameResult(false);
        } else {
            this.updateStatus('平局！');
            this.saveGameResult(null);
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
    const game = new GomokuGame();
    
    // 点击棋盘外的区域开始游戏
    document.addEventListener('click', function(e) {
        if (game.gameStatus === 'ready' && e.target.id !== 'board') {
            game.startGame();
        }
    });
};