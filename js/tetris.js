// 俄罗斯方块游戏 - 模块化架构

// ==================== 常量配置 ====================
const CONFIG = {
  GRID_SIZE: 40,
  COLS: 10,
  ROWS: 20,
  INITIAL_SPEED: 800,
  MIN_SPEED: 100,
  SPEED_DECREMENT: 50,
  LINES_PER_LEVEL: 10,
  SCORE_TABLE: [0, 100, 300, 500, 800],
  COLORS: {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000',
    GRID: '#e0e0e0',
    BACKGROUND: '#f8f8f8'
  },
  SHAPES: {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]]
  },
  ROTATIONS: {
    I: [
      [[1, 1, 1, 1]],
      [[1], [1], [1], [1]],
      [[1, 1, 1, 1]],
      [[1], [1], [1], [1]]
    ],
    O: [
      [[1, 1], [1, 1]],
      [[1, 1], [1, 1]],
      [[1, 1], [1, 1]],
      [[1, 1], [1, 1]]
    ],
    T: [
      [[0, 1, 0], [1, 1, 1]],
      [[1, 0], [1, 1], [1, 0]],
      [[1, 1, 1], [0, 1, 0]],
      [[0, 1], [1, 1], [0, 1]]
    ],
    S: [
      [[0, 1, 1], [1, 1, 0]],
      [[1, 0], [1, 1], [0, 1]],
      [[0, 1, 1], [1, 1, 0]],
      [[1, 0], [1, 1], [0, 1]]
    ],
    Z: [
      [[1, 1, 0], [0, 1, 1]],
      [[0, 1], [1, 1], [1, 0]],
      [[1, 1, 0], [0, 1, 1]],
      [[0, 1], [1, 1], [1, 0]]
    ],
    J: [
      [[1, 0, 0], [1, 1, 1]],
      [[1, 1], [1, 0], [1, 0]],
      [[1, 1, 1], [0, 0, 1]],
      [[0, 1], [0, 1], [1, 1]]
    ],
    L: [
      [[0, 0, 1], [1, 1, 1]],
      [[1, 0], [1, 0], [1, 1]],
      [[1, 1, 1], [1, 0, 0]],
      [[1, 1], [0, 1], [0, 1]]
    ]
  }
};

// ==================== Tetromino 类 ====================
class Tetromino {
  constructor(type) {
    this.type = type;
    this.shape = CONFIG.SHAPES[type].map(row => [...row]);
    this.color = CONFIG.COLORS[type];
  }

  getShape(rotation = 0) {
    const rotations = CONFIG.ROTATIONS[this.type];
    if (rotations && rotations[rotation] !== undefined) {
      return rotations[rotation];
    }
    return this.shape;
  }

  getColor() {
    return this.color;
  }

  getType() {
    return this.type;
  }

  static getRandomType() {
    const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    return types[Math.floor(Math.random() * types.length)];
  }

  static createRandom() {
    return new Tetromino(Tetromino.getRandomType());
  }
}

// ==================== TetrisBoard 类 ====================
class TetrisBoard {
  constructor(cols = CONFIG.COLS, rows = CONFIG.ROWS) {
    this.cols = cols;
    this.rows = rows;
    this.grid = [];
    this.clear();
  }

  clear() {
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
  }

  isValidPosition(piece, x, y, rotation = 0) {
    const shape = piece.getShape(rotation);

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;

          // 检查边界
          if (newX < 0 || newX >= this.cols || newY >= this.rows) {
            return false;
          }

          // 检查碰撞 - 只检查在网格范围内的位置
          if (newY >= 0 && this.grid[newY][newX]) {
            return false;
          }
        }
      }
    }

    return true;
  }

  lockPiece(piece, x, y, rotation = 0) {
    const shape = piece.getShape(rotation);
    const color = piece.getColor();

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const gridY = y + row;
          const gridX = x + col;

          if (gridY >= 0 && gridY < this.rows && gridX >= 0 && gridX < this.cols) {
            this.grid[gridY][gridX] = color;
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

  getGrid() {
    return this.grid;
  }

  getCols() {
    return this.cols;
  }

  getRows() {
    return this.rows;
  }
}

// ==================== Renderer 类 ====================
class Renderer {
  constructor(ctx, nextCtx, gridSize = CONFIG.GRID_SIZE) {
    this.ctx = ctx;
    this.nextCtx = nextCtx;
    this.gridSize = gridSize;
    this.previewGridSize = 33;
  }

  clear(canvas) {
    const context = canvas === 'next' ? this.nextCtx : this.ctx;
    const width = canvas === 'next' ? 100 : CONFIG.COLS * this.gridSize;
    const height = canvas === 'next' ? 100 : CONFIG.ROWS * this.gridSize;

    context.fillStyle = CONFIG.COLORS.BACKGROUND;
    context.fillRect(0, 0, width, height);
  }

  drawBoard(grid) {
    const rows = grid.length;
    const cols = grid[0].length;

    // 绘制网格线
    this.drawGrid(cols, rows);

    // 绘制已固定的方块
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (grid[row][col]) {
          this.drawBlock(this.ctx, col, row, grid[row][col], this.gridSize);
        }
      }
    }
  }

  drawPiece(piece, x, y, rotation = 0) {
    const shape = piece.getShape(rotation);
    const color = piece.getColor();

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const gridX = x + col;
          const gridY = y + row;

          // 只绘制在画布范围内的方块
          if (gridX >= 0 && gridX < CONFIG.COLS && gridY >= 0 && gridY < CONFIG.ROWS) {
            this.drawBlock(this.ctx, gridX, gridY, color, this.gridSize);
          }
        }
      }
    }
  }

  drawNextPiece(piece) {
    if (!piece) return;

    this.clear('next');

    const shape = piece.getShape(0);
    const color = piece.getColor();
    const offsetX = Math.floor((4 - shape[0].length) / 2);
    const offsetY = Math.floor((4 - shape.length) / 2);

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const x = offsetX + col;
          const y = offsetY + row;
          this.drawBlock(this.nextCtx, x, y, color, this.previewGridSize, 1);
        }
      }
    }
  }

  drawGrid(cols, rows) {
    this.ctx.strokeStyle = CONFIG.COLORS.GRID;
    this.ctx.lineWidth = 1;

    // 水平线
    for (let row = 0; row <= rows; row++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, row * this.gridSize);
      this.ctx.lineTo(cols * this.gridSize, row * this.gridSize);
      this.ctx.stroke();
    }

    // 垂直线
    for (let col = 0; col <= cols; col++) {
      this.ctx.beginPath();
      this.ctx.moveTo(col * this.gridSize, 0);
      this.ctx.lineTo(col * this.gridSize, rows * this.gridSize);
      this.ctx.stroke();
    }
  }

  drawBlock(context, x, y, color, size, offset = 1) {
    const px = x * size + offset;
    const py = y * size + offset;

    context.fillStyle = color;
    context.fillRect(px, py, size - 2 * offset, size - 2 * offset);

    // 绘制边框效果
    context.strokeStyle = this.darkenColor(color);
    context.lineWidth = 2;
    context.strokeRect(px, py, size - 2 * offset, size - 2 * offset);
  }

  darkenColor(color) {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 50);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 50);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 50);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

// ==================== InputHandler 类 ====================
class InputHandler {
  constructor() {
    this.keyCallbacks = {};
    this.boundHandler = this.handleKeyDown.bind(this);
    this.enabled = false;
  }

  onKey(key, callback) {
    this.keyCallbacks[key] = callback;
  }

  setup() {
    if (!this.enabled) {
      document.addEventListener('keydown', this.boundHandler);
      this.enabled = true;
    }
  }

  destroy() {
    if (this.enabled) {
      document.removeEventListener('keydown', this.boundHandler);
      this.enabled = false;
    }
  }

  handleKeyDown(event) {
    const callback = this.keyCallbacks[event.key];
    if (callback) {
      event.preventDefault();
      callback();
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// ==================== ScoreManager 类 ====================
class ScoreManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.lines = 0;
    this.level = 1;
  }

  addLines(count) {
    this.lines += count;
    this.score += CONFIG.SCORE_TABLE[count] || 0;
    this.updateLevel();
  }

  updateLevel() {
    this.level = Math.floor(this.lines / CONFIG.LINES_PER_LEVEL) + 1;
  }

  getScore() {
    return this.score;
  }

  getLevel() {
    return this.level;
  }

  getLines() {
    return this.lines;
  }

  getSpeed() {
    return Math.max(CONFIG.MIN_SPEED, CONFIG.INITIAL_SPEED - (this.level - 1) * CONFIG.SPEED_DECREMENT);
  }

  updateHighScore(gameType) {
    if (typeof GameStorage !== 'undefined') {
      return GameStorage.getMaxScore(gameType);
    }
    return 0;
  }

  saveScore(gameType) {
    const score = this.getScore();
    if (typeof GameStorage !== 'undefined') {
      GameStorage.updateScore(gameType, score);
    } else {
      // 直接使用localStorage保存分数
      const maxScoreKey = `game_${gameType}_maxScore`;
      const lastPlayedKey = `game_${gameType}_lastPlayed`;
      
      // 更新最高分
      const currentMax = parseInt(localStorage.getItem(maxScoreKey)) || 0;
      if (score > currentMax) {
        localStorage.setItem(maxScoreKey, score.toString());
      }
      
      // 更新最后游玩时间
      localStorage.setItem(lastPlayedKey, Date.now().toString());
    }
  }
}

// ==================== TetrisGame 类 ====================
class TetrisGame {
  constructor() {
    // 获取画布上下文
    this.canvas = document.getElementById('gameCanvas');
    this.nextCanvas = document.getElementById('nextCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.nextCtx = this.nextCanvas.getContext('2d');

    // 获取DOM元素
    this.currentScoreEl = document.getElementById('currentScore');
    this.maxScoreEl = document.getElementById('maxScore');
    this.levelEl = document.getElementById('level');
    this.linesEl = document.getElementById('lines');
    this.gameOverlay = document.getElementById('gameOverlay');
    this.finalScoreEl = document.getElementById('finalScore');
    this.finalLinesEl = document.getElementById('finalLines');

    // 初始化模块
    this.board = new TetrisBoard(CONFIG.COLS, CONFIG.ROWS);
    this.renderer = new Renderer(this.ctx, this.nextCtx, CONFIG.GRID_SIZE);
    this.inputHandler = new InputHandler();
    this.scoreManager = new ScoreManager();

    // 游戏状态
    this.isRunning = false;
    this.isPaused = false;
    this.lastUpdateTime = 0;
    this.dropTime = 0;
    this.animationId = null;
    this.landingTimer = 0;
    this.canMovePiece = true;

    // 当前方块状态
    this.currentPiece = null;
    this.currentX = 0;
    this.currentY = 0;
    this.currentRotation = 0;
    this.nextPiece = null;

    // 初始化
    this.reset();
    this.updateHighScore();
    this.setupEventListeners();
  }

  reset() {
    // 重置游戏板
    this.board.clear();

    // 重置分数管理器
    this.scoreManager.reset();

    // 重置游戏状态
    this.isRunning = false;
    this.isPaused = false;
    this.lastUpdateTime = 0;
    this.dropTime = 0;

    // 重置方块
    this.currentPiece = null;
    this.currentX = 0;
    this.currentY = 0;
    this.currentRotation = 0;
    this.nextPiece = Tetromino.createRandom();

    // 清除动画
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // 隐藏游戏结束界面
    this.gameOverlay.style.display = 'none';

    // 更新暂停按钮文本
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
      pauseBtn.textContent = '暂停';
    }

    // 清空画布并更新显示
    this.draw();
    this.updateDisplay();
  }

  start() {
    if (this.isRunning) return;

    // 重置游戏状态
    this.reset();

    // 生成第一个方块
    this.currentPiece = Tetromino.createRandom();
    this.currentRotation = 0;
    this.spawnPiece();

    // 生成下一个方块
    this.nextPiece = Tetromino.createRandom();

    // 设置运行状态
    this.isRunning = true;
    
    // 初始化下落时间
    this.dropTime = Date.now();

    // 开始游戏循环
    this.gameLoop();

    console.log('Tetris game started', {
      pieceType: this.currentPiece.getType(),
      x: this.currentX,
      y: this.currentY
    });
  }

  spawnPiece() {
    const shape = this.currentPiece.getShape(this.currentRotation);
    this.currentX = Math.floor(CONFIG.COLS / 2) - Math.floor(shape[0].length / 2);
    this.currentY = 0;

    // 确保方块位置有效
    if (this.currentX < 0) this.currentX = 0;
    if (this.currentX > CONFIG.COLS - shape[0].length) {
      this.currentX = CONFIG.COLS - shape[0].length;
    }
  }

  pause() {
    if (!this.isRunning) return;

    this.isPaused = !this.isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
      pauseBtn.textContent = this.isPaused ? '继续' : '暂停';
    }

    if (!this.isPaused) {
      // 重置下落时间，确保恢复游戏后立即开始计时
      this.dropTime = Date.now();
      this.gameLoop();
    }
  }

  gameLoop() {
    if (!this.isRunning) return;

    if (this.isPaused) {
      this.animationId = requestAnimationFrame(() => this.gameLoop());
      return;
    }

    const currentTime = Date.now();
    const gameSpeed = this.scoreManager.getSpeed();

    // 控制下落速度
    if (this.dropTime === 0 || currentTime - this.dropTime >= gameSpeed) {
      this.dropTime = currentTime;
      this.autoDrop();
    }

    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  autoDrop() {
    // 尝试下落
    if (this.canMove(0, 1, this.currentRotation)) {
      // 方块可以下落，重置落地计时器
      this.landingTimer = 0;
      this.canMovePiece = true;
      this.currentY++;
      this.draw();
    } else {
      // 方块不能下落，开始落地倒计时
      if (this.landingTimer === 0) {
        this.landingTimer = Date.now();
      }

      const landingTime = 300; // 0.3秒
      const elapsed = Date.now() - this.landingTimer;

      // 只有在落地前0.3秒内可以移动
      this.canMovePiece = elapsed >= (this.scoreManager.getSpeed() - landingTime);

      // 倒计时结束，固定方块
      if (elapsed >= this.scoreManager.getSpeed()) {
        // 固定方块到网格
        this.lockPiece();

        // 检查并消除满行
        const clearedLines = this.board.clearLines();
        if (clearedLines > 0) {
          this.scoreManager.addLines(clearedLines);
        }

        // 生成新方块
        this.currentPiece = this.nextPiece;
        this.currentRotation = 0;

        // 计算新方块位置
        this.spawnPiece();

        // 检查游戏结束
        if (!this.canMove(0, 0, this.currentRotation)) {
          this.gameOver();
          return;
        }

        // 生成下一个方块
        this.nextPiece = Tetromino.createRandom();

        // 重置状态
        this.landingTimer = 0;
        this.canMovePiece = true;
        this.dropTime = Date.now();

        this.draw();
        this.updateDisplay();
      }
    }
  }

  canMove(dx, dy, rotation) {
    return this.board.isValidPosition(this.currentPiece, this.currentX + dx, this.currentY + dy, rotation);
  }

  lockPiece() {
    this.board.lockPiece(this.currentPiece, this.currentX, this.currentY, this.currentRotation);
  }

  moveLeft() {
    if (!this.isRunning || this.isPaused) return;

    // 检查是否可以移动
    if (!this.canMovePiece) return;

    if (this.canMove(-1, 0, this.currentRotation)) {
      this.currentX--;
      this.draw();
    }
  }

  moveRight() {
    if (!this.isRunning || this.isPaused) return;

    // 检查是否可以移动
    if (!this.canMovePiece) return;

    if (this.canMove(1, 0, this.currentRotation)) {
      this.currentX++;
      this.draw();
    }
  }

  rotate() {
    if (!this.isRunning || this.isPaused) return;

    // 检查是否可以移动
    if (!this.canMovePiece) return;

    const newRotation = (this.currentRotation + 1) % 4;

    if (this.canMove(0, 0, newRotation)) {
      this.currentRotation = newRotation;
      this.draw();
    } else {
      // 尝试左右偏移来容纳旋转（踢墙）
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

  softDrop() {
    if (!this.isRunning || this.isPaused) return;

    // 检查是否可以移动
    if (!this.canMovePiece) return;

    if (this.canMove(0, 1, this.currentRotation)) {
      this.currentY++;
      this.draw();
    }
  }

  hardDrop() {
    if (!this.isRunning || this.isPaused) return;

    // 检查是否可以移动
    if (!this.canMovePiece) return;

    while (this.canMove(0, 1, this.currentRotation)) {
      this.currentY++;
    }

    this.draw();
  }

  draw() {
    // 清空主画布
    this.renderer.clear();

    // 绘制网格和已固定的方块
    this.renderer.drawBoard(this.board.getGrid());

    // 绘制当前方块
    if (this.currentPiece) {
      this.renderer.drawPiece(this.currentPiece, this.currentX, this.currentY, this.currentRotation);
    }

    // 绘制下一个方块
    this.renderer.drawNextPiece(this.nextPiece);
  }

  updateDisplay() {
    this.currentScoreEl.textContent = this.scoreManager.getScore();
    this.linesEl.textContent = this.scoreManager.getLines();
    this.levelEl.textContent = this.scoreManager.getLevel();
  }

  updateHighScore() {
    const highScore = this.scoreManager.updateHighScore('tetris');
    this.maxScoreEl.textContent = highScore;
  }

  gameOver() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // 保存分数
    this.scoreManager.saveScore('tetris');
    this.updateHighScore();

    // 显示游戏结束界面
    this.finalScoreEl.textContent = this.scoreManager.getScore();
    this.finalLinesEl.textContent = this.scoreManager.getLines();
    this.gameOverlay.style.display = 'flex';
  }

  setupEventListeners() {
    // 设置键盘输入处理
    this.inputHandler.onKey('ArrowUp', () => this.rotate());
    this.inputHandler.onKey('ArrowDown', () => this.softDrop());
    this.inputHandler.onKey('ArrowLeft', () => this.moveLeft());
    this.inputHandler.onKey('ArrowRight', () => this.moveRight());
    this.inputHandler.onKey(' ', () => this.hardDrop());
    this.inputHandler.setup();

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

// ==================== 游戏初始化 ====================
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
