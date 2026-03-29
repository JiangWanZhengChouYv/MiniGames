// 扫雷游戏逻辑

class MinesweeperGame {
  constructor() {
    this.board = [];
    this.rows = 9;
    this.cols = 9;
    this.mineCount = 10;
    this.revealedCount = 0;
    this.flaggedCount = 0;
    this.isGameOver = false;
    this.isGameWon = false;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.timerInterval = null;
    
    // DOM元素
    this.boardElement = document.getElementById('minesweeperBoard');
    this.gameStatusElement = document.getElementById('gameStatus');
    this.mineCountElement = document.getElementById('mineCount');
    this.timeElapsedElement = document.getElementById('timeElapsed');
    this.gameOverlay = document.getElementById('gameOverlay');
    this.gameOverTitle = document.getElementById('gameOverTitle');
    this.gameOverMessage = document.getElementById('gameOverMessage');
    this.finalTimeElement = document.getElementById('finalTime');
    this.highScoreElement = document.getElementById('highScore');
    this.bestTimeElement = document.getElementById('bestTime');
    this.gameCountElement = document.getElementById('gameCount');
    
    this.init();
  }
  
  init() {
    this.setDifficulty('easy');
    this.updateStats();
  }
  
  setDifficulty(difficulty) {
    switch(difficulty) {
      case 'easy':
        this.rows = 9;
        this.cols = 9;
        this.mineCount = 10;
        break;
      case 'medium':
        this.rows = 16;
        this.cols = 16;
        this.mineCount = 40;
        break;
      case 'hard':
        this.rows = 16;
        this.cols = 30;
        this.mineCount = 99;
        break;
    }
    this.resetGame();
  }
  
  resetGame() {
    this.board = [];
    this.revealedCount = 0;
    this.flaggedCount = 0;
    this.isGameOver = false;
    this.isGameWon = false;
    this.elapsedTime = 0;
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    this.gameStatusElement.textContent = '准备开始';
    this.mineCountElement.textContent = this.mineCount;
    this.timeElapsedElement.textContent = '0';
    this.gameOverlay.style.display = 'none';
    
    this.generateBoard();
    this.renderBoard();
  }
  
  generateBoard() {
    // 初始化空白棋盘
    for (let row = 0; row < this.rows; row++) {
      this.board[row] = [];
      for (let col = 0; col < this.cols; col++) {
        this.board[row][col] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0
        };
      }
    }
  }
  
  placeMines(firstClickRow, firstClickCol) {
    let minesPlaced = 0;
    
    while (minesPlaced < this.mineCount) {
      const row = Math.floor(Math.random() * this.rows);
      const col = Math.floor(Math.random() * this.cols);
      
      // 确保不在首次点击的位置及其周围放置地雷
      if (!this.board[row][col].isMine && 
          Math.abs(row - firstClickRow) > 1 && 
          Math.abs(col - firstClickCol) > 1) {
        this.board[row][col].isMine = true;
        minesPlaced++;
      }
    }
    
    // 计算每个格子周围的地雷数量
    this.calculateAdjacentMines();
  }
  
  calculateAdjacentMines() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (!this.board[row][col].isMine) {
          let count = 0;
          for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c++) {
              if (this.board[r][c].isMine) {
                count++;
              }
            }
          }
          this.board[row][col].adjacentMines = count;
        }
      }
    }
  }
  
  renderBoard() {
    this.boardElement.style.gridTemplateRows = `repeat(${this.rows}, 30px)`;
    this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;
    this.boardElement.innerHTML = '';
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = document.createElement('div');
        cell.className = 'minesweeper-cell';
        
        const cellData = this.board[row][col];
        
        if (cellData.isRevealed) {
          cell.classList.add('revealed');
          if (cellData.isMine) {
            cell.classList.add('mine');
            cell.textContent = '💣';
          } else if (cellData.adjacentMines > 0) {
            cell.textContent = cellData.adjacentMines;
            cell.style.color = this.getNumberColor(cellData.adjacentMines);
          }
        } else if (cellData.isFlagged) {
          cell.classList.add('flagged');
          cell.textContent = '🚩';
        }
        
        cell.addEventListener('click', () => this.revealCell(row, col));
        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.toggleFlag(row, col);
        });
        
        this.boardElement.appendChild(cell);
      }
    }
  }
  
  getNumberColor(number) {
    const colors = {
      1: '#0000ff',
      2: '#008000',
      3: '#ff0000',
      4: '#000080',
      5: '#800000',
      6: '#008080',
      7: '#000000',
      8: '#808080'
    };
    return colors[number] || '#000000';
  }
  
  revealCell(row, col) {
    if (this.isGameOver || this.isGameWon) return;
    
    const cell = this.board[row][col];
    
    if (cell.isRevealed || cell.isFlagged) return;
    
    // 首次点击，放置地雷
    if (this.revealedCount === 0) {
      this.placeMines(row, col);
      this.startTime = Date.now();
      this.startTimer();
    }
    
    cell.isRevealed = true;
    this.revealedCount++;
    
    if (cell.isMine) {
      this.gameOver(false);
      return;
    }
    
    // 自动揭开周围空白格子
    if (cell.adjacentMines === 0) {
      for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c++) {
          if (!this.board[r][c].isRevealed && !this.board[r][c].isFlagged) {
            this.revealCell(r, c);
          }
        }
      }
    }
    
    this.checkWin();
    this.renderBoard();
  }
  
  toggleFlag(row, col) {
    if (this.isGameOver || this.isGameWon) return;
    
    const cell = this.board[row][col];
    
    if (cell.isRevealed) return;
    
    cell.isFlagged = !cell.isFlagged;
    this.flaggedCount += cell.isFlagged ? 1 : -1;
    this.mineCountElement.textContent = this.mineCount - this.flaggedCount;
    
    this.renderBoard();
  }
  
  startTimer() {
    this.timerInterval = setInterval(() => {
      this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
      this.timeElapsedElement.textContent = this.elapsedTime;
    }, 1000);
  }
  
  checkWin() {
    const totalCells = this.rows * this.cols;
    const nonMineCells = totalCells - this.mineCount;
    
    if (this.revealedCount === nonMineCells) {
      this.gameOver(true);
    }
  }
  
  gameOver(won) {
    this.isGameOver = true;
    this.isGameWon = won;
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    // 揭示所有地雷
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.board[row][col].isMine) {
          this.board[row][col].isRevealed = true;
        }
      }
    }
    
    this.renderBoard();
    
    // 显示游戏结束界面
    this.gameOverlay.style.display = 'flex';
    
    if (won) {
      this.gameOverTitle.textContent = '恭喜获胜！';
      this.gameOverMessage.textContent = `你成功扫完了所有地雷！`;
      this.saveScore();
    } else {
      this.gameOverTitle.textContent = '游戏结束！';
      this.gameOverMessage.textContent = `很遗憾，你踩到了地雷！`;
      this.saveGameTime();
    }
    
    this.finalTimeElement.textContent = this.elapsedTime;
  }
  
  saveGameTime() {
    const gameType = 'minesweeper';
    
    if (typeof GameStorage !== 'undefined') {
      // 调用updateScore，即使分数为0也会记录最后游玩时间
      GameStorage.updateScore(gameType, 0);
    } else {
      // 直接使用localStorage
      const lastPlayedKey = `game_${gameType}_lastPlayed`;
      const gameCountKey = `game_${gameType}_gameCount`;
      
      // 更新最后游玩时间
      localStorage.setItem(lastPlayedKey, Date.now().toString());
      
      // 更新游戏次数
      const gameCount = parseInt(localStorage.getItem(gameCountKey)) || 0;
      localStorage.setItem(gameCountKey, (gameCount + 1).toString());
    }
    
    this.updateStats();
  }
  
  saveScore() {
    const gameType = 'minesweeper';
    const score = this.calculateScore();
    
    if (typeof GameStorage !== 'undefined') {
      GameStorage.updateScore(gameType, score);
    } else {
      // 直接使用localStorage
      const maxScoreKey = `game_${gameType}_maxScore`;
      const bestTimeKey = `game_${gameType}_bestTime`;
      const gameCountKey = `game_${gameType}_gameCount`;
      const lastPlayedKey = `game_${gameType}_lastPlayed`;
      
      // 更新最高分
      const currentMax = parseInt(localStorage.getItem(maxScoreKey)) || 0;
      if (score > currentMax) {
        localStorage.setItem(maxScoreKey, score.toString());
      }
      
      // 更新最快时间
      const currentBestTime = parseInt(localStorage.getItem(bestTimeKey)) || Infinity;
      if (this.elapsedTime < currentBestTime) {
        localStorage.setItem(bestTimeKey, this.elapsedTime.toString());
      }
      
      // 更新游戏次数
      const gameCount = parseInt(localStorage.getItem(gameCountKey)) || 0;
      localStorage.setItem(gameCountKey, (gameCount + 1).toString());
      
      // 更新最后游玩时间
      localStorage.setItem(lastPlayedKey, Date.now().toString());
    }
    
    this.updateStats();
  }
  
  calculateScore() {
    // 基于难度、时间和剩余地雷计算分数
    const baseScore = this.mineCount * 10;
    const timeBonus = Math.max(0, 1000 - this.elapsedTime * 10);
    const difficultyMultiplier = {
      easy: 1,
      medium: 2,
      hard: 3
    }[this.getDifficulty()] || 1;
    
    return Math.floor((baseScore + timeBonus) * difficultyMultiplier);
  }
  
  getDifficulty() {
    if (this.rows === 9 && this.cols === 9) return 'easy';
    if (this.rows === 16 && this.cols === 16) return 'medium';
    return 'hard';
  }
  
  updateStats() {
    const gameType = 'minesweeper';
    
    let highScore = 0;
    let bestTime = Infinity;
    let gameCount = 0;
    
    if (typeof GameStorage !== 'undefined') {
      highScore = GameStorage.getMaxScore(gameType);
      // 从历史记录中获取最快时间
      const history = GameStorage.getHistory(gameType);
      if (history.length > 0) {
        const winGames = history.filter(item => item.score > 0);
        if (winGames.length > 0) {
          bestTime = Math.min(...winGames.map(item => {
            // 假设历史记录中包含时间信息
            return item.time || Infinity;
          }));
        }
        gameCount = history.length;
      }
    } else {
      // 直接从localStorage读取
      highScore = parseInt(localStorage.getItem(`game_${gameType}_maxScore`)) || 0;
      bestTime = parseInt(localStorage.getItem(`game_${gameType}_bestTime`)) || Infinity;
      gameCount = parseInt(localStorage.getItem(`game_${gameType}_gameCount`)) || 0;
    }
    
    this.highScoreElement.textContent = highScore;
    this.bestTimeElement.textContent = bestTime === Infinity ? '--:--' : `${Math.floor(bestTime / 60)}:${(bestTime % 60).toString().padStart(2, '0')}`;
    this.gameCountElement.textContent = gameCount;
  }
  
  startGame() {
    this.resetGame();
  }
}

// 初始化游戏
let minesweeperGame;

window.addEventListener('load', () => {
  minesweeperGame = new MinesweeperGame();
});