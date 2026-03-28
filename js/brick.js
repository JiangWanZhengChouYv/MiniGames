// 打砖块游戏逻辑

class BrickBreakerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.nextLevelCanvas = document.getElementById('nextLevelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCtx = this.nextLevelCanvas.getContext('2d');
        
        // 游戏配置
        this.paddleWidth = 140; // 从120增加到140，更容易接球
        this.paddleHeight = 12; // 从10增加到12，更容易接球
        this.paddleY = this.canvas.height - 35;
        this.paddleX = this.canvas.width / 2 - this.paddleWidth / 2;
        this.paddleSpeed = 18; // 从20降到18，更平缓
        
        this.ballRadius = 8;
        this.ballX = this.canvas.width / 2;
        this.ballY = this.canvas.height / 2;
        this.ballSpeedX = 3.0; // 从3.5降到3.0，更容易控制
        this.ballSpeedY = -3.0; // 从-3.5降到-3.0
        this.ballSpeed = 3.0; // 从3.5降到3.0
        
        this.brickRows = 3; // 从4行减少到3行，降低难度
        this.brickCols = 5; // 从6列减少到5列
        this.brickWidth = 65; // 从60增加到65，更容易击中
        this.brickHeight = 25;
        this.brickPadding = 10;
        this.brickOffsetTop = 50;
        this.brickOffsetLeft = 20; // 从25降到20，居中显示
        
        // 颜色配置
        this.colors = {
            paddle: '#4a90e2',
            ball: '#e74c3c',
            bricks: ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4a90e2', '#a855f7'],
            background: '#f8f8f8',
            grid: '#e0e0e0',
            text: '#333'
        };
        
        // 砖块数组
        this.bricks = [];
        this.initializeBricks();
        
        // 游戏状态
        this.score = 0;
        this.level = 1;
        this.balls = 5; // 从3增加到5，增加初始生命值
        this.isRunning = false;
        this.isPaused = false;
        
        // DOM元素
        this.currentScoreEl = document.getElementById('currentScore');
        this.maxScoreEl = document.getElementById('maxScore');
        this.levelEl = document.getElementById('level');
        this.ballsEl = document.getElementById('balls');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.finalScoreEl = document.getElementById('finalScore');
        this.finalLevelEl = document.getElementById('finalLevel');
        this.gameOverTitle = document.getElementById('gameOverTitle');
        this.gameOverMessage = document.getElementById('gameOverMessage');
        this.levelFeature = document.getElementById('levelFeature');
        
        // 初始化游戏
        this.reset();
        
        // 初始化
        this.updateHighScore();
        this.setupEventListeners();
        this.drawNextLevel();
    }
    
    initializeBricks() {
        for (let row = 0; row < this.brickRows; row++) {
            this.bricks[row] = [];
            for (let col = 0; col < this.brickCols; col++) {
                this.bricks[row][col] = {
                    x: 0,
                    y: 0,
                    status: 1,
                    color: this.colors.bricks[row % this.colors.bricks.length]
                };
            }
        }
    }
    
    reset() {
        // 游戏状态
        this.score = 0;
        this.level = 1;
        this.balls = 3;
        this.isRunning = false;
        this.isPaused = false;
        
        // 重置挡板位置
        this.paddleX = this.canvas.width / 2 - this.paddleWidth / 2;
        this.paddleY = this.canvas.height - 30;
        
        // 重置球位置
        this.resetBall();
        
        // 重新初始化砖块
        this.initializeBricks();
        this.updateBrickPositions();
        
        // 清除动画
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // 隐藏游戏结束界面
        this.gameOverlay.style.display = 'none';
        
        // 清空画布
        this.draw();
        
        // 更新显示
        this.updateDisplay();
    }
    
    resetBall() {
        this.ballX = this.canvas.width / 2;
        this.ballY = this.canvas.height / 2;
        this.ballSpeedX = this.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
        this.ballSpeedY = -this.ballSpeed;
    }
    
    updateBrickPositions() {
        for (let row = 0; row < this.brickRows; row++) {
            for (let col = 0; col < this.brickCols; col++) {
                if (this.bricks[row][col].status === 1) {
                    this.bricks[row][col].x = col * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
                    this.bricks[row][col].y = row * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
                }
            }
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        this.reset();
        
        // 设置运行状态
        this.isRunning = true;
        this.isPaused = false;
        
        // 开始游戏循环
        this.gameLoop(Date.now());
    }
    
    pause() {
        if (!this.isRunning) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? '继续' : '暂停';
        
        if (!this.isPaused) {
            this.gameLoop(Date.now());
        }
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning || this.isPaused) return;
        
        // 更新球的位置
        this.ballX += this.ballSpeedX;
        this.ballY += this.ballSpeedY;
        
        // 碰撞检测
        this.checkCollisions();
        
        // 绘制游戏
        this.draw();
        
        // 继续游戏循环
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    checkCollisions() {
        // 球与上下边界碰撞
        if (this.ballY - this.ballRadius <= 0) {
            this.ballSpeedY = -this.ballSpeedY;
            this.ballY = this.ballRadius;
        } else if (this.ballY + this.ballRadius >= this.canvas.height) {
            // 球掉落，失去一个球
            this.balls--;
            this.ballsEl.textContent = this.balls;
            
            if (this.balls <= 0) {
                this.gameOver();
                return;
            } else {
                this.resetBall();
                return;
            }
        }
        
        // 球与左右边界碰撞
        if (this.ballX - this.ballRadius <= 0 || this.ballX + this.ballRadius >= this.canvas.width) {
            this.ballSpeedX = -this.ballSpeedX;
            if (this.ballX - this.ballRadius <= 0) {
                this.ballX = this.ballRadius;
            } else {
                this.ballX = this.canvas.width - this.ballRadius;
            }
        }
        
        // 球与挡板碰撞
        if (this.ballY + this.ballRadius >= this.paddleY &&
            this.ballY - this.ballRadius <= this.paddleY + this.paddleHeight &&
            this.ballX >= this.paddleX && this.ballX <= this.paddleX + this.paddleWidth) {
            
            // 根据碰撞位置改变反弹角度
            const paddleCenter = this.paddleX + this.paddleWidth / 2;
            const ballCenter = this.ballX;
            const relativeIntersectX = (paddleCenter - ballCenter) / (this.paddleWidth / 2);
            const angle = relativeIntersectX * (Math.PI / 3); // 60度最大角度
            
            const speed = Math.sqrt(this.ballSpeedX * this.ballSpeedX + this.ballSpeedY * this.ballSpeedY);
            this.ballSpeedX = speed * Math.sin(angle);
            this.ballSpeedY = -speed * Math.cos(angle);
            
            // 调整球的位置，防止卡住
            this.ballY = this.paddleY - this.ballRadius;
        }
        
        // 球与砖块碰撞
        for (let row = 0; row < this.brickRows; row++) {
            for (let col = 0; col < this.brickCols; col++) {
                const brick = this.bricks[row][col];
                if (brick.status === 1) {
                    if (this.ballX + this.ballRadius >= brick.x &&
                        this.ballX - this.ballRadius <= brick.x + this.brickWidth &&
                        this.ballY + this.ballRadius >= brick.y &&
                        this.ballY - this.ballRadius <= brick.y + this.brickHeight) {
                        
                        // 碰撞处理
                        brick.status = 0;
                        this.score += 10;
                        this.currentScoreEl.textContent = this.score;
                        
                        // 根据碰撞方向反弹
                        const brickCenterX = brick.x + this.brickWidth / 2;
                        const brickCenterY = brick.y + this.brickHeight / 2;
                        const ballCenterX = this.ballX;
                        const ballCenterY = this.ballY;
                        
                        // 计算碰撞法线
                        const dx = ballCenterX - brickCenterX;
                        const dy = ballCenterY - brickCenterY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const normalX = dx / distance;
                        const normalY = dy / distance;
                        
                        // 反射速度
                        const dotProduct = this.ballSpeedX * normalX + this.ballSpeedY * normalY;
                        this.ballSpeedX -= 2 * dotProduct * normalX;
                        this.ballSpeedY -= 2 * dotProduct * normalY;
                        
                        // 检查是否清除所有砖块
                        this.checkLevelComplete();
                    }
                }
            }
        }
    }
    
    checkLevelComplete() {
        let bricksRemaining = 0;
        for (let row = 0; row < this.brickRows; row++) {
            for (let col = 0; col < this.brickCols; col++) {
                if (this.bricks[row][col].status === 1) {
                    bricksRemaining++;
                }
            }
        }
        
        if (bricksRemaining === 0) {
            // 关卡完成
            this.level++;
            this.levelEl.textContent = this.level;
            
            // 增加速度（从1.1倍降到1.05倍，更平缓）
            this.ballSpeed *= 1.05;
            
            // 重新初始化砖块
            this.initializeBricks();
            this.updateBrickPositions();
            
            // 重置球位置
            this.resetBall();
            
            // 更新关卡特色
            this.updateLevelFeature();
        }
    }
    
    updateLevelFeature() {
        const features = [
            "标准砖块布局",
            "双层砖块布局",
            "坚固砖块布局",
            "快速球关卡",
            "挑战模式"
        ];
        const featureIndex = (this.level - 1) % features.length;
        this.levelFeature.textContent = features[featureIndex];
    }
    
    updateHighScore() {
        this.highScore = GameStorage.getMaxScore('brick');
        this.maxScoreEl.textContent = this.highScore;
    }
    
    updateDisplay() {
        this.currentScoreEl.textContent = this.score;
        this.levelEl.textContent = this.level;
        this.ballsEl.textContent = this.balls;
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格线
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.canvas.width; i += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i <= this.canvas.height; i += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
        
        // 绘制砖块
        for (let row = 0; row < this.brickRows; row++) {
            for (let col = 0; col < this.brickCols; col++) {
                const brick = this.bricks[row][col];
                if (brick.status === 1) {
                    this.ctx.fillStyle = brick.color;
                    this.ctx.fillRect(brick.x, brick.y, this.brickWidth, this.brickHeight);
                    
                    // 绘制边框效果
                    this.ctx.strokeStyle = this.darkenColor(brick.color);
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(brick.x, brick.y, this.brickWidth, this.brickHeight);
                }
            }
        }
        
        // 绘制挡板
        this.ctx.fillStyle = this.colors.paddle;
        this.ctx.fillRect(this.paddleX, this.paddleY, this.paddleWidth, this.paddleHeight);
        
        // 绘制边框效果
        this.ctx.strokeStyle = this.darkenColor(this.colors.paddle);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.paddleX, this.paddleY, this.paddleWidth, this.paddleHeight);
        
        // 绘制球
        this.ctx.fillStyle = this.colors.ball;
        this.ctx.beginPath();
        this.ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制边框效果
        this.ctx.strokeStyle = this.darkenColor(this.colors.ball);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    drawNextLevel() {
        // 清空画布
        this.nextCtx.fillStyle = this.colors.background;
        this.nextCtx.fillRect(0, 0, this.nextLevelCanvas.width, this.nextLevelCanvas.height);
        
        // 绘制预览砖块
        const previewRows = 4;
        const previewCols = 4;
        const previewBrickWidth = 30;
        const previewBrickHeight = 15;
        const previewPadding = 5;
        
        for (let row = 0; row < previewRows; row++) {
            for (let col = 0; col < previewCols; col++) {
                const x = col * (previewBrickWidth + previewPadding) + 10;
                const y = row * (previewBrickHeight + previewPadding) + 10;
                
                this.nextCtx.fillStyle = this.colors.bricks[(row + 1) % this.colors.bricks.length];
                this.nextCtx.fillRect(x, y, previewBrickWidth, previewBrickHeight);
                
                // 绘制边框
                this.nextCtx.strokeStyle = this.darkenColor(this.colors.bricks[(row + 1) % this.colors.bricks.length]);
                this.nextCtx.lineWidth = 1;
                this.nextCtx.strokeRect(x, y, previewBrickWidth, previewBrickHeight);
            }
        }
        
        // 绘制预览文字
        this.nextCtx.fillStyle = this.colors.text;
        this.nextCtx.font = '12px Arial';
        this.nextCtx.textAlign = 'center';
        this.nextCtx.fillText('第 1 关', this.nextLevelCanvas.width / 2, this.nextLevelCanvas.height - 10);
    }
    
    darkenColor(color) {
        // 将十六进制颜色变暗约20%
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 50);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 50);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 50);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    gameOver() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // 保存分数
        GameStorage.updateScore('brick', this.score);
        this.updateHighScore();
        
        // 显示游戏结束界面
        this.finalScoreEl.textContent = this.score;
        this.finalLevelEl.textContent = this.level - 1;
        
        if (this.balls <= 0) {
            this.gameOverTitle.textContent = '游戏结束！';
            this.gameOverMessage.textContent = '球数用尽，下次继续努力！';
        } else {
            this.gameOverTitle.textContent = '关卡完成！';
            this.gameOverMessage.textContent = `恭喜通过所有关卡！最终得分: ${this.score}`;
        }
        
        this.gameOverlay.style.display = 'flex';
    }
    
    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (event) => {
            if (!this.isRunning || this.isPaused) return;
            
            switch(event.key) {
                case 'ArrowLeft':
                    if (this.paddleX > 0) {
                        this.paddleX -= this.paddleSpeed;
                    }
                    break;
                case 'ArrowRight':
                    if (this.paddleX < this.canvas.width - this.paddleWidth) {
                        this.paddleX += this.paddleSpeed;
                    }
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
let brickGame;

// 页面加载完成后初始化游戏
window.addEventListener('load', () => {
    brickGame = new BrickBreakerGame();
});