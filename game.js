class AppleGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 게임 설정
        this.gridCols = 15;
        this.gridRows = 8;
        this.cellWidth = 40;
        this.cellHeight = 40;
        
        // 게임 상태
        this.apples = [];
        this.selectedApples = [];
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragEnd = { x: 0, y: 0 };
        this.score = 0;
        this.timeLeft = 60;
        this.gameActive = true;
        
        // 타이머
        this.gameTimer = null;
        
        this.init();
    }
    
    init() {
        this.generateApples();
        this.setupEventListeners();
        this.startTimer();
        this.gameLoop();
    }
    
    generateApples() {
        this.apples = [];
        for (let row = 0; row < this.gridRows; row++) {
            this.apples[row] = [];
            for (let col = 0; col < this.gridCols; col++) {
                this.apples[row][col] = {
                    number: Math.floor(Math.random() * 9) + 1,
                    x: col * this.cellWidth,
                    y: row * this.cellHeight,
                    selected: false,
                    removed: false,
                    row: row,
                    col: col
                };
            }
        }
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    handleMouseDown(e) {
        if (!this.gameActive) return;
        
        const pos = this.getMousePos(e);
        // 사과 클릭 시 효과음 재생
        const col = Math.floor(pos.x / this.cellWidth);
        const row = Math.floor(pos.y / this.cellHeight);
        if (row >= 0 && row < this.gridRows && col >= 0 && col < this.gridCols) {
            const apple = this.apples[row][col];
            if (apple && !apple.removed) {
                soundManager.playClick();
            }
        }
        this.isDragging = true;
        this.dragStart = { x: pos.x, y: pos.y };
        this.dragEnd = { x: pos.x, y: pos.y };
        
        // 기존 선택 해제
        this.clearSelection();
    }
    
    handleMouseMove(e) {
        if (!this.gameActive || !this.isDragging) return;
        
        const pos = this.getMousePos(e);
        this.dragEnd = { x: pos.x, y: pos.y };
        
        // 드래그 영역 내의 사과들을 선택
        this.updateSelection();
    }
    
    handleMouseUp(e) {
        if (!this.gameActive || !this.isDragging) return;
        
        this.isDragging = false;
        this.validateSelection();
    }
    
    updateSelection() {
        this.clearSelection();
        
        const minX = Math.min(this.dragStart.x, this.dragEnd.x);
        const maxX = Math.max(this.dragStart.x, this.dragEnd.x);
        const minY = Math.min(this.dragStart.y, this.dragEnd.y);
        const maxY = Math.max(this.dragStart.y, this.dragEnd.y);
        
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const apple = this.apples[row][col];
                if (apple.removed) continue;
                
                const appleCenterX = apple.x + this.cellWidth / 2;
                const appleCenterY = apple.y + this.cellHeight / 2;
                
                if (appleCenterX >= minX && appleCenterX <= maxX &&
                    appleCenterY >= minY && appleCenterY <= maxY) {
                    apple.selected = true;
                    this.selectedApples.push(apple);
                }
            }
        }
        
        this.updateUI();
    }
    
    clearSelection() {
        this.selectedApples.forEach(apple => {
            apple.selected = false;
        });
        this.selectedApples = [];
        this.updateUI();
    }
    
    validateSelection() {
        if (this.selectedApples.length === 0) return;
        
        const sum = this.selectedApples.reduce((total, apple) => total + apple.number, 0);
        
        if (sum === 10) {
            // 조건 만족 - 사과 제거 및 점수 추가
            const selectedCount = this.selectedApples.length; // 제거하기 전에 개수 저장
            this.removeSelectedApples();
            this.score += selectedCount; // 저장된 개수를 점수에 추가
            this.updateScore();
            
            // 성공 피드백 (점수 애니메이션)
            this.showScoreAnimation(selectedCount);
        } else {
            // 조건 불만족 - 선택 해제
            this.clearSelection();
        }
    }
    
    removeSelectedApples() {
        this.selectedApples.forEach(apple => {
            apple.removed = true;
            apple.selected = false;
        });
        this.selectedApples = [];
        this.updateUI();
    }
    
    updateUI() {
        const selectedCount = this.selectedApples.length;
        const sum = this.selectedApples.reduce((total, apple) => total + apple.number, 0);
        
        document.getElementById('selectedCount').textContent = selectedCount;
        document.getElementById('sumDisplay').textContent = sum;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    showScoreAnimation(points) {
        // 점수 애니메이션을 위한 임시 요소 생성
        const scoreElement = document.getElementById('score');
        const originalText = scoreElement.textContent;
        
        // 점수 요소에 애니메이션 클래스 추가
        scoreElement.style.transform = 'scale(1.2)';
        scoreElement.style.color = '#FFD700';
        scoreElement.style.transition = 'all 0.3s ease';
        
        // 0.3초 후 원래 상태로 복원
        setTimeout(() => {
            scoreElement.style.transform = 'scale(1)';
            scoreElement.style.color = '';
        }, 300);
        
        // 추가 점수 표시 (선택사항)
        this.showFloatingScore(points);
    }
    
    showFloatingScore(points) {
        // 화면에 떠다니는 점수 표시
        const floatingScore = document.createElement('div');
        floatingScore.textContent = `+${points}점!`;
        floatingScore.style.position = 'fixed';
        floatingScore.style.left = '50%';
        floatingScore.style.top = '50%';
        floatingScore.style.transform = 'translate(-50%, -50%)';
        floatingScore.style.color = '#FFD700';
        floatingScore.style.fontSize = '2em';
        floatingScore.style.fontWeight = 'bold';
        floatingScore.style.pointerEvents = 'none';
        floatingScore.style.zIndex = '1000';
        floatingScore.style.animation = 'fadeOutUp 1s ease-out forwards';
        
        // CSS 애니메이션 추가
        if (!document.getElementById('scoreAnimationStyle')) {
            const style = document.createElement('style');
            style.id = 'scoreAnimationStyle';
            style.textContent = `
                @keyframes fadeOutUp {
                    0% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -70%) scale(1.2);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(floatingScore);
        
        // 1초 후 요소 제거
        setTimeout(() => {
            if (floatingScore.parentNode) {
                floatingScore.parentNode.removeChild(floatingScore);
            }
        }, 1000);
    }
    
    startTimer() {
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('time').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    endGame() {
        this.gameActive = false;
        clearInterval(this.gameTimer);
        
        // 현재 점수를 전역 변수에 저장
        currentScore = this.score;
        
        document.getElementById('finalScore').textContent = this.score;
        
        // 게임 오버 화면을 부드럽게 표시
        const gameOverElement = document.getElementById('gameOver');
        gameOverElement.style.display = 'flex';
        gameOverElement.classList.add('show');
        
        // 약간의 지연 후 애니메이션 시작
        setTimeout(() => {
            gameOverElement.style.opacity = '1';
        }, 100);
    }

    stopGame() {
        // 게임 중단 (타이머만 정지, 게임오버 화면은 표시하지 않음)
        this.gameActive = false;
        clearInterval(this.gameTimer);
        console.log('게임이 중단되었습니다.');
    }
    
    drawApple(ctx, apple) {
        if (apple.removed) return;
        
        const centerX = apple.x + this.cellWidth / 2;
        const centerY = apple.y + this.cellHeight / 2;
        const radius = Math.min(this.cellWidth, this.cellHeight) / 2 - 5;
        
        // 사과 본체 그리기 (사과 모양)
        ctx.save();
        
        // 사과 본체 색상
        ctx.fillStyle = apple.selected ? '#FFD700' : '#FF4444';
        
        // 사과 모양 경로 생성
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - radius * 0.1, radius, radius * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 사과 하이라이트 (빛나는 부분)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX - radius * 0.3, centerY - radius * 0.4, radius * 0.3, radius * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 사과 꼭지 (줄기)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(centerX - 2, centerY - radius - 5, 4, 8);
        
        // 사과 잎
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(centerX + 3, centerY - radius - 3, 6, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 선택된 사과 테두리
        if (apple.selected) {
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY - radius * 0.1, radius, radius * 0.9, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // 숫자 표시 (사과 안에)
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.font = `bold ${Math.min(radius * 0.8, 19)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 숫자에 그림자 효과
        ctx.strokeText(apple.number.toString(), centerX + 1, centerY + 1);
        ctx.fillText(apple.number.toString(), centerX, centerY);
    }
    
    drawDragBox() {
        if (!this.isDragging) return;
        
        const minX = Math.min(this.dragStart.x, this.dragEnd.x);
        const maxX = Math.max(this.dragStart.x, this.dragEnd.x);
        const minY = Math.min(this.dragStart.y, this.dragEnd.y);
        const maxY = Math.max(this.dragStart.y, this.dragEnd.y);
        
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        this.ctx.setLineDash([]);
    }
    
    draw() {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 그리드 배경
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const apple = this.apples[row][col];
                if (apple.removed) {
                    this.ctx.fillRect(apple.x, apple.y, this.cellWidth, this.cellHeight);
                }
            }
        }
        
        // 사과 그리기
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                this.drawApple(this.ctx, this.apples[row][col]);
            }
        }
        
        // 드래그 박스 그리기
        this.drawDragBox();
    }
    
    gameLoop() {
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 게임 초기화
let game;
let currentScore = 0;

// 배경음악 관리
class AudioManager {
    constructor() {
        this.bgMusic = document.getElementById('bgMusic');
        this.isPlaying = false;
        this.setupAudio();
    }
    
    setupAudio() {
        if (!this.bgMusic) {
            console.log('오디오 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 오디오 로드 이벤트
        this.bgMusic.addEventListener('loadstart', () => {
            console.log('배경음악 로드 시작...');
        });
        
        this.bgMusic.addEventListener('canplay', () => {
            console.log('배경음악이 준비되었습니다.');
        });
        
        this.bgMusic.addEventListener('error', (e) => {
            console.log('배경음악 로드 오류:', e);
            console.log('플래시 번쩍.mp3 파일이 work 폴더에 있는지 확인해주세요.');
        });
        
        // 볼륨 설정 (0.0 ~ 1.0)
        this.bgMusic.volume = 0.3;
    }
    
    async startMusic() {
        if (!this.bgMusic || this.isPlaying) return;
        
        try {
            await this.bgMusic.play();
            this.isPlaying = true;
            console.log('배경음악 재생 시작');
        } catch (error) {
            console.log('배경음악 자동 재생 실패:', error);
            console.log('브라우저 정책으로 인해 사용자 상호작용 후 재생됩니다.');
        }
    }
    
    stopMusic() {
        if (!this.bgMusic || !this.isPlaying) return;
        
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
        this.isPlaying = false;
        console.log('배경음악 정지');
    }
    
    pauseMusic() {
        if (!this.bgMusic || !this.isPlaying) return;
        
        this.bgMusic.pause();
        this.isPlaying = false;
        console.log('배경음악 일시정지');
    }
    
    resumeMusic() {
        if (!this.bgMusic || this.isPlaying) return;
        
        this.bgMusic.play().then(() => {
            this.isPlaying = true;
            console.log('배경음악 재생 재개');
        }).catch(error => {
            console.log('배경음악 재생 재개 실패:', error);
        });
    }
    
    setVolume(volume) {
        if (!this.bgMusic) return;
        
        this.bgMusic.volume = Math.max(0, Math.min(1, volume));
        console.log('볼륨 설정:', this.bgMusic.volume);
    }
}

const audioManager = new AudioManager();

// 효과음 관리 (클릭 사운드)
class SoundManager {
    constructor() {
        this.clickUrl = 'video-game-menu-click-sounds-148373.mp3';
        this.baseClickAudio = new Audio(this.clickUrl);
        this.baseClickAudio.volume = 0.6;
        this.baseClickAudio.preload = 'auto';
    }

    playClick() {
        try {
            const audio = this.baseClickAudio.cloneNode(true);
            audio.volume = this.baseClickAudio.volume;
            audio.play();
        } catch (e) {
            console.log('클릭 사운드 재생 실패:', e);
        }
    }
}

const soundManager = new SoundManager();

// 랭킹 시스템 (점수파일.txt 기반 - File System Access API 사용)
class Leaderboard {
    constructor() {
        this.scores = [];
        this.fileHandle = null;
        this.fileName = '점수파일.txt';
        this.loadScores();
    }
    
    // File System Access API 지원 확인
    isFileSystemAccessSupported() {
        return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
    }
    
    // 점수파일.txt에서 랭킹 자동 로드
    async loadScores() {
        try {
            if (!this.isFileSystemAccessSupported()) {
                console.log('File System Access API가 지원되지 않습니다. localStorage를 사용합니다.');
                this.loadFromLocalStorage();
                return;
            }
            
            // 사용자가 점수파일.txt를 선택하도록 안내
            this.loadFromLocalStorage(); // 임시로 localStorage 사용
            
        } catch (error) {
            console.error('파일 로드 오류:', error);
            this.loadFromLocalStorage();
        }
    }
    
    // localStorage에서 로드 (백업용)
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('appleGameLeaderboard');
            this.scores = saved ? JSON.parse(saved) : [];
            console.log('localStorage에서 랭킹을 불러왔습니다.');
        } catch (error) {
            console.error('localStorage 로드 오류:', error);
            this.scores = [];
        }
    }
    
    // localStorage에 저장 (백업용)
    saveToLocalStorage() {
        try {
            localStorage.setItem('appleGameLeaderboard', JSON.stringify(this.scores));
        } catch (error) {
            console.error('localStorage 저장 오류:', error);
        }
    }
    
    // 점수파일.txt에 자동 저장 및 다운로드
    async saveToFile() {
        try {
            const data = JSON.stringify(this.scores, null, 2);
            
            // 자동 다운로드로 점수파일.txt 업데이트
            const blob = new Blob([data], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = this.fileName;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            console.log('점수파일.txt가 자동으로 다운로드되었습니다. work 폴더에 저장해주세요.');
            
        } catch (error) {
            console.error('파일 저장 오류:', error);
        }
    }
    
    // 점수 추가
    async addScore(name, score) {
        // 새 점수 추가
        this.scores.push({ name: name, score: score, date: new Date().toISOString() });
        this.scores.sort((a, b) => b.score - a.score);
        
        // 상위 10개만 유지
        if (this.scores.length > 10) {
            this.scores = this.scores.slice(0, 10);
        }
        
        // localStorage에 백업
        this.saveToLocalStorage();
        
        // 파일로 자동 저장
        await this.saveToFile();
        
        const rank = this.scores.findIndex(item => item.name === name && item.score === score) + 1;
        console.log(`${rank}위로 등록되었습니다!`);
        
        return rank;
    }
    
    // 점수파일.txt 불러오기 (수동)
    async loadFromFile() {
        try {
            if (!this.isFileSystemAccessSupported()) {
                alert('이 브라우저는 파일 시스템 접근을 지원하지 않습니다.');
                return;
            }
            
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: '텍스트 파일',
                    accept: { 'text/plain': ['.txt'] }
                }]
            });
            
            const file = await fileHandle.getFile();
            const contents = await file.text();
            
            if (contents.trim()) {
                this.scores = JSON.parse(contents);
                this.saveToLocalStorage(); // localStorage에도 동기화
                this.display();
                console.log('점수파일.txt에서 랭킹을 불러왔습니다.');
            }
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('파일 불러오기 오류:', error);
            }
        }
    }
    
    display() {
        const rankingsContainer = document.getElementById('rankings');
        rankingsContainer.innerHTML = '';
        
        if (this.scores.length === 0) {
            rankingsContainer.innerHTML = `
                <p>아직 등록된 점수가 없습니다.<br>게임을 플레이하여 첫 번째 기록을 만들어보세요!</p>
                <div style="margin-top: 15px; padding: 10px; background: rgba(255, 193, 7, 0.1); border-radius: 10px; font-size: 0.9em;">
                    <strong>📌 안내:</strong> 점수 등록 시 <strong>점수파일.txt</strong>가 자동으로 다운로드됩니다.<br>
                    다운로드된 파일을 work 폴더에 저장해주세요.
                </div>
            `;
            
            // 파일 불러오기 버튼 (기존 점수파일.txt가 있는 경우)
            if (this.isFileSystemAccessSupported()) {
                const loadButton = document.createElement('button');
                loadButton.textContent = '📁 점수파일.txt 불러오기';
                loadButton.onclick = () => this.loadFromFile();
                loadButton.style.cssText = `
                    background: #007bff; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 15px; 
                    cursor: pointer; 
                    margin-top: 10px;
                    width: 100%;
                `;
                rankingsContainer.appendChild(loadButton);
            }
            
            return;
        }
        
        this.scores.forEach((item, index) => {
            const rankingItem = document.createElement('div');
            rankingItem.className = 'ranking-item';
            
            if (index < 3) {
                rankingItem.classList.add('top3');
            }
            
            rankingItem.innerHTML = `
                <div class="rank-number">${index + 1}위</div>
                <div class="rank-name">${item.name}</div>
                <div class="rank-score">${item.score}점</div>
            `;
            
            rankingsContainer.appendChild(rankingItem);
        });
        
        // 파일 관련 안내 및 버튼
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = `
            margin-top: 15px;
            padding: 10px;
            background: rgba(40, 167, 69, 0.1);
            border-radius: 10px;
            font-size: 0.9em;
            color: #155724;
            text-align: center;
        `;
        infoDiv.innerHTML = '📁 점수 등록 시 <strong>점수파일.txt</strong>가 자동으로 업데이트됩니다.';
        rankingsContainer.appendChild(infoDiv);
        
        // 수동 파일 불러오기 버튼
        if (this.isFileSystemAccessSupported()) {
            const loadButton = document.createElement('button');
            loadButton.textContent = '📂 점수파일.txt 다시 불러오기';
            loadButton.onclick = () => this.loadFromFile();
            loadButton.style.cssText = `
                background: #6c757d; 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 12px; 
                cursor: pointer; 
                margin-top: 10px;
                width: 100%;
                font-size: 0.9em;
            `;
            rankingsContainer.appendChild(loadButton);
        }
    }
}

const leaderboard = new Leaderboard();

function hideIntroScreen() {
    const introScreen = document.getElementById('introScreen');
    introScreen.style.display = 'none';
}

function showIntroScreen() {
    const introScreen = document.getElementById('introScreen');
    introScreen.style.display = 'flex';
}

function startGame() {
    // 모든 오버레이/모달 숨기기 (깨끗한 시작)
    const gameOverElement = document.getElementById('gameOver');
    if (gameOverElement) {
        gameOverElement.style.display = 'none';
        gameOverElement.classList.remove('show');
        gameOverElement.style.opacity = '0';
    }
    const scoreRegElement = document.getElementById('scoreRegistration');
    if (scoreRegElement) {
        scoreRegElement.style.display = 'none';
    }
    const leaderboardElement = document.getElementById('leaderboard');
    if (leaderboardElement) {
        leaderboardElement.style.display = 'none';
    }

    hideIntroScreen();
    const gameContainer = document.querySelector('.game-container');
    gameContainer.classList.add('show');

    // 기존 게임이 있다면 정리
    if (game) {
        game.stopGame();
    }
    game = new AppleGame();
    
    // 배경음악 시작 (사용자가 게임을 시작했으므로 재생 가능)
    audioManager.startMusic();
}

function exitGame() {
    // 게임 종료 확인
    if (confirm('정말 게임을 종료하시겠습니까?')) {
        // 배경음악 정지
        audioManager.stopMusic();
        
        window.close();
        // 브라우저에서 창 닫기가 지원되지 않는 경우
        if (!window.closed) {
            alert('게임을 종료하려면 브라우저 탭을 닫아주세요.');
        }
    }
}

function goToMainMenu() {
    console.log('goToMainMenu 함수가 호출되었습니다.');
    
    // 커스텀 확인 창 표시
    const confirmDialog = document.getElementById('confirmDialog');
    confirmDialog.classList.add('show');
}

function confirmMainMenu(confirmed) {
    // 확인 창 숨기기
    const confirmDialog = document.getElementById('confirmDialog');
    confirmDialog.classList.remove('show');
    
    if (confirmed) {
        console.log('메인 화면으로 이동 확인됨');
        
        // 현재 게임 중단 (타이머 정지)
        if (game) {
            game.stopGame();
        }
        
        // 모든 게임 관련 화면 숨기기
        const gameContainer = document.querySelector('.game-container');
        gameContainer.classList.remove('show');
        gameContainer.style.display = 'none';
        
        // 게임 오버 화면 숨기기
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            gameOverElement.style.display = 'none';
            gameOverElement.classList.remove('show');
        }
        
        // 점수 등록 화면 숨기기
        const scoreRegistration = document.getElementById('scoreRegistration');
        if (scoreRegistration) {
            scoreRegistration.style.display = 'none';
        }
        
        // 리더보드 화면 숨기기
        const leaderboard = document.getElementById('leaderboard');
        if (leaderboard) {
            leaderboard.style.display = 'none';
        }
        
        // 인트로 화면 보이기
        showIntroScreen();
        
        console.log('메인 화면으로 돌아갔습니다.');
    } else {
        console.log('메인 화면 이동 취소됨');
    }
}

function restartGame() {
    // 게임 오버 화면 숨기기
    const gameOverElement = document.getElementById('gameOver');
    gameOverElement.style.display = 'none';
    gameOverElement.classList.remove('show');
    gameOverElement.style.opacity = '0';
    
    // 새 게임 시작
    game = new AppleGame();
}

function showScoreRegistration() {
    // 게임 오버 화면 숨기기
    const gameOverElement = document.getElementById('gameOver');
    gameOverElement.style.display = 'none';
    
    // 점수 등록 화면 표시
    const scoreRegElement = document.getElementById('scoreRegistration');
    scoreRegElement.style.display = 'flex';
    
    // 현재 점수 표시
    document.getElementById('registerScore').textContent = currentScore;
    
    // 이름 입력 필드에 포커스
    document.getElementById('playerName').focus();
}

function hideScoreRegistration() {
    const scoreRegElement = document.getElementById('scoreRegistration');
    scoreRegElement.style.display = 'none';
    
    // 게임 오버 화면 다시 표시
    const gameOverElement = document.getElementById('gameOver');
    gameOverElement.style.display = 'flex';
}

async function registerScore() {
    const playerName = document.getElementById('playerName').value.trim();
    
    if (playerName === '') {
        alert('이름을 입력해주세요!');
        return;
    }
    
    if (playerName.length > 8) {
        alert('이름은 8자 이하로 입력해주세요!');
        return;
    }
    
    // 점수 등록 (비동기)
    const rank = await leaderboard.addScore(playerName, currentScore);
    
    if (rank > 0) {
        console.log(`${rank}위로 등록되었습니다!`);
    }
    
    // 점수 등록 화면 숨기기
    hideScoreRegistration();
    
    // 랭킹 보드 표시
    showLeaderboard();
}

function showLeaderboard() {
    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.style.display = 'flex';
    
    // 랭킹 보드 업데이트
    leaderboard.display();
}

function continueAfterRegister() {
    // 랭킹 보드 숨기기
    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.style.display = 'none';
    
    // 등록 후 버튼들 다시 표시 (다음에 사용할 수 있도록)
    const afterRegisterButtons = document.querySelector('.after-register-buttons');
    if (afterRegisterButtons) {
        afterRegisterButtons.style.display = 'flex';
    }
    
    // 새 게임 시작 (startGame 함수 사용)
    startGame();
}

function exitAfterRegister() {
    // 랭킹 보드 숨기기
    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.style.display = 'none';
    
    // 인트로 화면으로 돌아가기
    const gameContainer = document.querySelector('.game-container');
    gameContainer.classList.remove('show');
    showIntroScreen();
}

function showLeaderboardFromIntro() {
    // 인트로 화면 숨기기
    hideIntroScreen();
    
    // 배경음악 시작 (사용자 상호작용 발생)
    audioManager.startMusic();
    
    // 랭킹 보드 표시
    const leaderboardElement = document.getElementById('leaderboard');
    if (leaderboardElement) {
        leaderboardElement.style.display = 'flex';
        
        // 랭킹 보드 업데이트
        leaderboard.display();
        
        // 등록 후 버튼들 숨기기 (인트로에서 보는 것이므로)
        const afterRegisterButtons = document.querySelector('.after-register-buttons');
        if (afterRegisterButtons) {
            afterRegisterButtons.style.display = 'none';
        }
        
        // 인트로에서 온 경우의 선택 버튼들 표시
        showLeaderboardChoiceButtons();
    }
}

function showLeaderboardChoiceButtons() {
    const leaderboardContent = document.querySelector('.leaderboard-content');
    if (leaderboardContent) {
        // 기존 버튼들 제거
        const existingButtons = document.querySelector('.leaderboard-choice-buttons');
        if (existingButtons) {
            existingButtons.remove();
        }
        
        // 새로운 선택 버튼들 생성
        const choiceButtons = document.createElement('div');
        choiceButtons.className = 'leaderboard-choice-buttons';
        choiceButtons.innerHTML = `
            <button class="game-start-from-leaderboard-btn" onclick="startGameFromLeaderboard()">🎮 게임 시작하기</button>
            <button class="back-to-intro-from-leaderboard-btn" onclick="backToIntroFromLeaderboard()">🏠 인트로로 돌아가기</button>
        `;
        
        leaderboardContent.appendChild(choiceButtons);
    }
}

function startGameFromLeaderboard() {
    // 랭킹 보드 숨기기
    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.style.display = 'none';
    
    // 선택 버튼들 제거
    const choiceButtons = document.querySelector('.leaderboard-choice-buttons');
    if (choiceButtons) {
        choiceButtons.remove();
    }
    
    // 등록 후 버튼들 다시 표시 (정리를 위해)
    const afterRegisterButtons = document.querySelector('.after-register-buttons');
    if (afterRegisterButtons) {
        afterRegisterButtons.style.display = 'flex';
    }
    
    // 게임 시작
    startGame();
}

function backToIntroFromLeaderboard() {
    // 랭킹 보드 숨기기
    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.style.display = 'none';
    
    // 등록 후 버튼들 다시 표시 (점수 등록 후 상황을 위해)
    const afterRegisterButtons = document.querySelector('.after-register-buttons');
    if (afterRegisterButtons) {
        afterRegisterButtons.style.display = 'flex';
    }
    
    // 선택 버튼들 제거
    const choiceButtons = document.querySelector('.leaderboard-choice-buttons');
    if (choiceButtons) {
        choiceButtons.remove();
    }
    
    // 인트로 화면 표시
    showIntroScreen();
}

function backToIntroFromGameOver() {
    // 게임 오버 화면 숨기기
    const gameOverElement = document.getElementById('gameOver');
    if (gameOverElement) {
        gameOverElement.style.display = 'none';
        gameOverElement.classList.remove('show');
        gameOverElement.style.opacity = '0';
    }
    // 점수 등록 화면 숨기기
    const scoreRegElement = document.getElementById('scoreRegistration');
    if (scoreRegElement) {
        scoreRegElement.style.display = 'none';
    }
    // 랭킹 보드 숨기기
    const leaderboardElement = document.getElementById('leaderboard');
    if (leaderboardElement) {
        leaderboardElement.style.display = 'none';
    }
    // 게임 컨테이너 숨기기
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.classList.remove('show');
        gameContainer.style.display = 'none';
    }
    // 인트로 화면 표시
    showIntroScreen();
}

// 팝업 관련 함수들은 더 이상 사용하지 않음

// 음악 제어 함수들
function toggleMusic() {
    const toggleBtn = document.getElementById('musicToggle');
    
    if (audioManager.isPlaying) {
        audioManager.pauseMusic();
        toggleBtn.textContent = '🔇 음악 OFF';
    } else {
        audioManager.resumeMusic();
        toggleBtn.textContent = '🔊 음악 ON';
    }
}

function changeVolume(value) {
    const volume = value / 100;
    audioManager.setVolume(volume);
}

// 페이지 로드 시 인트로 화면 표시
window.addEventListener('load', () => {
    showIntroScreen();
});

// 이름 입력 필드에서 Enter 키 처리
document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('playerName');
    if (nameInput) {
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                registerScore();
            }
        });
    }
    // 모든 버튼 및 시작 사과 클릭에 클릭 사운드 적용
    document.addEventListener('click', (e) => {
        const isButton = e.target.closest && e.target.closest('button');
        const isStartApple = e.target.closest && e.target.closest('.apple-start-button');
        if (isButton || isStartApple) {
            soundManager.playClick();
        }
    });
});
