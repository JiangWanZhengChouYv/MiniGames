// 俄罗斯方块游戏逻辑

class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // 游戏配置
        this.gridSize = 30;
        this.cols = 10;
        this.rows = 20;
        this.gameSpeed = 500; // 下落速度，单位毫秒（从800改为500，速度更快）
        
        // 颜色配置
        this.colors = {
            'I': '#00f0f0',
            'O': '#f0f000',
            'T': '#a000f0',
            'S': '#00f000',
            'Z': '#f00000',
            'J': '#0000f0',
            'L': '#f0a000',
            'grid': '#e0e0e0',
            'background': '#f8f8f8'
        };
        
        // 方块定义
        this.tetrominoes = {
            'I': [[1,1,1,1]],
            'O': [[1,1],[1,1]],
            'T': [[0,1,0],[1,1,1]],
            'S': [[0,1,1],[1,1,0]],
            'Z': [[1,1,0],[0,1,1]],
            'J': [[1,0,0],[1,1,1]],
            'L': [[0,0,1],[1,1,1]]
        };
        
        // 旋转后的方块（简化处理，实际游戏中需要计算）
        this.rotations = {
            'I': [[1,1,1,1], [1],[1],[1],[1]],
            'T': [[0,1,0],[1,1,1], [1,0],[1,1],[0,1]],
            'S': [[0,1,1],[1,1,0], [1,0],[1,1],[0,1]],
            'Z': [[1,1,0],[0,1,1], [0,1],[1,1],[1,0]],
            'J': [[1,0,0],[1,1,1], [0,1,1],[0,0,1],[1,1,0]],
            'L': [[0,0,1],[1,1,1], [1,1,0],[1,0,0],[0,1,1]]
        };
        
        // DOM元素
        this.currentScoreEl = document.getElementById('currentScore');
        this.maxScoreEl = document.getElementById('maxScore');
        this.levelEl = document.getElementById('level');
        this.linesEl = document.getElementById('lines');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.finalScoreEl = document.getElementById('finalScore');
        this.finalLinesEl = document.getElementById('finalLines');
        
        // 游戏状态变量
        this.lastUpdateTime = 0;
        this.dropTime = 0;
        this.grid = [];
        
        // 初始化游戏
        this.reset();
        
        // 初始化
        this.updateHighScore();
        this.setupEventListeners();
    }
    
    reset() {
        // 初始化网格
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        
        // 游戏状态
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameSpeed = 800;
        this.isRunning = false;
        this.isPaused = false;
        
        // 当前方块
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.currentRotation = 0;
        
        // 下一个方块
        this.nextPiece = this.generatePiece();
        this.nextRotation = 0;
        
        // 时间记录
        this.lastUpdateTime = 0;
        this.dropTime = 0;
        
        // 清除动画
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // 隐藏游戏结束界面
        this.gameOverlay.style.display = 'none';
        
        // 清空画布
        this.draw();
        this.drawNext();
        
        // 更新显示
        this.updateDisplay();
    }
    
    generatePiece() {
        const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const shape = this.tetrominoes[randomType];
        
        // 返回深拷贝的方块，避免修改原数据
        return {
            type: randomType,
            shape: shape.map(row => row.slice()),
            color: this.colors[randomType]
        };
    }
    
    getRotatedShape(piece, rotation) {
        // 简化旋转逻辑
        const rotations = this.rotations[piece.type];
        if (rotations && rotations[rotation]) {
            return rotations[rotation];
        }
        return piece.shape;
    }
    
    start() {
        if (this.isRunning) return;
        
        // 重置游戏状态，但不重置isRunning
        this.isRunning = false;
        this.isPaused = false;
        
        // 清空网格
        this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        
        // 重置分数
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameSpeed = 800;
        
        // 生成第一个方块
        this.currentPiece = this.generatePiece();
        this.currentRotation = 0;
        this.currentX = Math.floor(this.cols / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentY = 0;
        
        // 确保方块位置有效
        if (this.currentX < 0) this.currentX = 0;
        if (this.currentX > this.cols - this.currentPiece.shape[0].length) {
            this.currentX = this.cols - this.currentPiece.shape[0].length;
        }
        
        // 生成下一个方块
        this.nextPiece = this.generatePiece();
        this.nextRotation = 0;
        
        // 时间记录
        this.lastUpdateTime = 0;
        this.dropTime = Date.now(); // 使用当前时间初始化
        
        // 清除动画
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // 隐藏游戏结束界面
        this.gameOverlay.style.display = 'none';
        
        // 更新显示
        this.draw();
        this.drawNext();
        this.updateDisplay();
        
        // 设置运行状态
        this.isRunning = true;
        
        // 开始游戏循环
        this.gameLoop(Date.now());
        
        console.log('Tetris game started', {
            pieceType: this.currentPiece.type,
            shape: this.currentPiece.shape,
            x: this.currentX,
            y: this.currentY
        });
    }
    
    pause() {
        if (!this.isRunning) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? '继续' : '暂停';
        
        if (!this.isPaused) {
            this.gameLoop();
        }
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning || this.isPaused) return;
        
        // 控制下落速度
        if (currentTime - this.dropTime < this.gameSpeed) {
            this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }
        
        this.dropTime = currentTime;
        
        // 尝试下落
        if (this.canMove(0, 1, this.currentRotation)) {
            this.currentY++;
            this.draw();
        } else {
            // 固定方块到网格
            this.lockPiece();
            
            // 检查并消除满行
            const clearedLines = this.clearLines();
            if (clearedLines > 0) {
                this.lines += clearedLines;
                this.updateScore(clearedLines);
                this.updateLevel();
            }
            
            // 生成新方块
            this.currentPiece = this.nextPiece;
            this.currentRotation = this.nextRotation;
            this.currentX = Math.floor(this.cols / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
            this.currentY = 0;
            
            // 生成下一个方块
            this.nextPiece = this.generatePiece();
            this.nextRotation = 0;
            this.drawNext();
            
            // 检查游戏结束
            if (!this.canMove(0, 0, this.currentRotation)) {
                this.gameOver();
                return;
            }
        }
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    canMove(dx, dy, rotation) {
        const shape = this.getRotatedShape(this.currentPiece, rotation);
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = this.currentX + col + dx;
                    const newY = this.currentY + row + dy;
                    
                    // 检查边界
                    if (newX < 0 || newX >= this.cols || newY >= this.rows) {
                        return false;
                    }
                    
                    // 检查碰撞
                    if (newY >= 0 && this.grid[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    lockPiece() {
        const shape = this.currentPiece.shape;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const gridY = this.currentY + row;
                    const gridX = this.currentX + col;
                    
                    if (gridY >= 0 && gridY < this.rows && gridX >= 0 && gridX < this.cols) {
                        this.grid[gridY][gridX] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.grid[row].every(cell => cell !== 0)) {
                // 移除满行
                this.grid.splice(row, 1);
                this.grid.unshift(Array(this.cols).fill(0));
                linesCleared++;
            }
        }
        
        return linesCleared;
    }
    
    updateScore(linesCleared) {
        const points = [0, 100, 300, 500, 800];
        this.score += points[linesCleared] || 0;
        this.currentScoreEl.textContent = this.score;
    }
    
    updateLevel() {
        this.level = Math.floor(this.lines / 10) + 1;
        this.levelEl.textContent = this.level;
        
        // 每10行加快一次速度（从800改为500，速度更快）
        this.gameSpeed = Math.max(100, 500 - (this.level - 1) * 50);
    }
    
    updateHighScore() {
        this.highScore = GameStorage.getMaxScore('tetris');
        this.maxScoreEl.textContent = this.highScore;
    }
    
    updateDisplay() {
        this.currentScoreEl.textContent = this.score;
        this.linesEl.textContent = this.lines;
        this.levelEl.textContent = this.level;
    }
    
    rotate() {
        if (!this.isRunning || this.isPaused) return;
        
        const newRotation = (this.currentRotation + 1) % 4;
        
        if (this.canMove(0, 0, newRotation)) {
            this.currentRotation = newRotation;
            this.draw();
        } else {
            // 尝试左右偏移来容纳旋转
            if (this.canMove(-1, 0, newRotation)) {
                this.currentX--;
                this.currentRotation = newRotation;
                this.draw();
            } else if (this.canMove(1, 0, newRotation)) {
                this.currentX++;
                this.currentRotation = newRotation;
                this.draw();
            }
        }
    }
    
    moveLeft() {
        if (!this.isRunning || this.isPaused) return;
        
        if (this.canMove(-1, 0, this.currentRotation)) {
            this.currentX--;
            this.draw();
        }
    }
    
    moveRight() {
        if (!this.isRunning || this.isPaused) return;
        
        if (this.canMove(1, 0, this.currentRotation)) {
            this.currentX++;
            this.draw();
        }
    }
    
    drop() {
        if (!this.isRunning || this.isPaused) return;
        
        while (this.canMove(0, 1, this.currentRotation)) {
            this.currentY++;
        }
        
        this.draw();
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 画已固定的方块
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col]) {
                    this.ctx.fillStyle = this.grid[row][col];
                    this.ctx.fillRect(col * this.gridSize + 1, row * this.gridSize + 1, 
                                    this.gridSize - 2, this.gridSize - 2);
                }
            }
        }
        
        // 画当前方块
        if (this.currentPiece) {
            const shape = this.getRotatedShape(this.currentPiece, this.currentRotation);
            
            console.log('Drawing piece:', {
                type: this.currentPiece.type,
                shape: shape,
                color: this.currentPiece.color,
                x: this.currentX,
                y: this.currentY,
                rotation: this.currentRotation
            });
            
            this.ctx.fillStyle = this.currentPiece.color;
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = (this.currentX + col) * this.gridSize + 1;
                        const y = (this.currentY + row) * this.gridSize + 1;
                        const gridX = this.currentX + col;
                        const gridY = this.currentY + row;
                        
                        console.log(`  Drawing cell at (${gridX}, ${gridY}) -> canvas (${x}, ${y})`);
                        
                        // 只绘制在画布范围内的方块
                        if (gridX >= 0 && gridX < this.cols && gridY >= 0 && gridY < this.rows) {
                            this.ctx.fillRect(x, y, this.gridSize - 2, this.gridSize - 2);
                        }
                    }
                }
            }
        }
    }
    
    drawNext() {
        if (!this.nextPiece) return;
        
        // 清空画布
        this.nextCtx.fillStyle = this.colors.background;
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        // 画下一个方块
        const shape = this.nextPiece.shape;
        const offsetX = Math.floor((4 - shape[0].length) / 2);
        const offsetY = Math.floor((4 - shape.length) / 2);
        
        this.nextCtx.fillStyle = this.nextPiece.color;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = (offsetX + col) * 25 + 1;
                    const y = (offsetY + row) * 25 + 1;
                    this.nextCtx.fillRect(x, y, 23, 23);
                }
            }
        }
    }
    
    gameOver() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // 保存分数
        GameStorage.updateScore('tetris', this.score);
        this.updateHighScore();
        
        // 显示游戏结束界面
        this.finalScoreEl.textContent = this.score;
        this.finalLinesEl.textContent = this.lines;
        this.gameOverlay.style.display = 'flex';
    }
    
    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (event) => {
            if (!this.isRunning || this.isPaused) return;
            
            switch(event.key) {
                case 'ArrowUp':
                    this.rotate();
                    break;
                case 'ArrowDown':
                    if (this.canMove(0, 1, this.currentRotation)) {
                        this.currentY++;
                        this.draw();
                    }
                    break;
                case 'ArrowLeft':
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                    this.moveRight();
                    break;
                case ' ':
                    event.preventDefault();
                    this.drop();
                    break;
            }
        });
        
        // 按钮控制
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const resetBtn = document.getElementById('resetBtn');
        const restartBtn = document.getElementById('restartBtn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pause());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.start());
        }
    }
}

// 游戏初始化
let tetrisGame;

// 页面加载完成后初始化游戏
window.addEventListener('load', () => {
    tetrisGame = new TetrisGame();
});

// 防止空格键滚动页面
window.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
        event.preventDefault();
    }
});