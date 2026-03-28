// 贪吃蛇游戏逻辑

class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏配置
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        this.gameSpeed = 150; // 游戏速度，单位毫秒（值越大越慢）
        
        // DOM元素
        this.currentScoreEl = document.getElementById('currentScore');
        this.maxScoreEl = document.getElementById('maxScore');
        this.snakeLengthEl = document.getElementById('snakeLength');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.finalScoreEl = document.getElementById('finalScore');
        this.finalLengthEl = document.getElementById('finalLength');
        
        // 游戏状态变量
        this.lastUpdateTime = 0;
        
        // 初始化游戏状态
        this.reset();
        
        // 初始化
        this.updateHighScore();
        this.setupEventListeners();
    }
    
    generateFood() {
        return {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
    }
    
    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (event) => {
            if (!this.isRunning && event.key !== ' ') return;
            
            switch(event.key) {
                case 'ArrowUp':
                    if (this.direction.y === 0) this.direction = {x: 0, y: -1};
                    break;
                case 'ArrowDown':
                    if (this.direction.y === 0) this.direction = {x: 0, y: 1};
                    break;
                case 'ArrowLeft':
                    if (this.direction.x === 0) this.direction = {x: -1, y: 0};
                    break;
                case 'ArrowRight':
                    if (this.direction.x === 0) this.direction = {x: 1, y: 0};
                    break;
                case ' ':
                    event.preventDefault();
                    if (!this.isRunning) {
                        this.start();
                    } else if (this.isPaused) {
                        this.resume();
                    } else {
                        this.pause();
                    }
                    break;
            }
        });
        
        // 按钮控制
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('restartBtn').addEventListener('click', () => this.start());
    }
    
    updateHighScore() {
        this.highScore = GameStorage.getMaxScore('snake');
        this.maxScoreEl.textContent = this.highScore;
    }
    
    draw() {
        // 清屏
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 画网格
        this.ctx.strokeStyle = '#f5f5f5';
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
        
        // 画蛇
        this.ctx.fillStyle = '#4CAF50';
        this.snake.forEach(segment => {
            this.ctx.fillRect(segment.x * this.gridSize + 1, segment.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
        });
        
        // 画食物
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(this.food.x * this.gridSize + 1, this.food.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
        
        // 更新信息
        this.currentScoreEl.textContent = this.score;
        this.snakeLengthEl.textContent = this.snake.length;
    }
    
    update() {
        if (!this.isRunning || this.isPaused) return;
        
        // 如果没有方向，不移动
        if (this.direction.x === 0 && this.direction.y === 0) {
            this.draw();
            return;
        }
        
        // 移动蛇
        const head = {x: this.snake[0].x + this.direction.x, y: this.snake[0].y + this.direction.y};
        
        // 检查碰撞
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount || 
            this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.food = this.generateFood();
            
            // 确保食物不会生成在蛇身上
            while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y)) {
                this.food = this.generateFood();
            }
            
            // 更新最高分
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.maxScoreEl.textContent = this.highScore;
            }
        } else {
            this.snake.pop();
        }
        
        this.draw();
    }
    
    start() {
        if (this.isRunning) return;
        
        // 重置游戏状态
        this.reset();
        
        // 设置运行状态
        this.isRunning = true;
        this.isPaused = false;
        
        // 开始游戏循环
        this.gameLoop();
    }
    
    pause() {
        if (!this.isRunning) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? '继续' : '暂停';
        
        if (!this.isPaused) {
            this.gameLoop();
        }
    }
    
    resume() {
        this.pause();
    }
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.snake = [{x: 10, y: 10}];
        this.direction = {x: 0, y: 0}; // 初始静止，等待玩家输入
        this.food = this.generateFood();
        
        // 确保食物不会生成在蛇身上
        while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y)) {
            this.food = this.generateFood();
        }
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.gameOverlay.style.display = 'none';
        this.draw();
        
        // 更新显示
        this.currentScoreEl.textContent = this.score;
        this.snakeLengthEl.textContent = this.snake.length;
    }
    
    gameOver() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // 保存分数
        GameStorage.updateScore('snake', this.score);
        this.updateHighScore();
        
        // 显示游戏结束界面
        this.finalScoreEl.textContent = this.score;
        this.finalLengthEl.textContent = this.snake.length;
        this.gameOverlay.style.display = 'flex';
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning || this.isPaused) return;
        
        // 控制游戏速度
        if (currentTime - this.lastUpdateTime < this.gameSpeed) {
            this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }
        
        this.lastUpdateTime = currentTime;
        this.update();
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// 游戏初始化
let snakeGame;

// 页面加载完成后初始化游戏
window.addEventListener('load', () => {
    snakeGame = new SnakeGame();
});

// 防止空格键滚动页面
window.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
        event.preventDefault();
    }
});