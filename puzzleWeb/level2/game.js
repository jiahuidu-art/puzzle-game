(function() {
    const imageInput = document.getElementById('imageInput');
    const gridSizeInput = document.getElementById('gridSize');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const checkBtn = document.getElementById('checkBtn');
    const hintBtn = document.getElementById('hintBtn');
    const backBtn = document.getElementById('backBtn');
    const puzzleGrid = document.getElementById('puzzleGrid');
    const previewImage = document.getElementById('previewImage');
    const previewTimer = document.getElementById('previewTimer');
    const timerCount = document.getElementById('timerCount');
    const previewHint = document.getElementById('previewHint');
    const gameInfo = document.getElementById('gameInfo');
    const gameContainer = document.getElementById('gameContainer');
    const moveCountEl = document.getElementById('moveCount');
    const placedCountEl = document.getElementById('placedCount');
    const difficultyEl = document.getElementById('difficulty');
    const currentScoreEl = document.getElementById('currentScore');
    const remainingHintsEl = document.getElementById('remainingHints');
    const timeElapsedEl = document.getElementById('timeElapsed');
    const completeOverlay = document.getElementById('completeOverlay');
    const finalMovesEl = document.getElementById('finalMoves');
    const finalTimeEl = document.getElementById('finalTime');
    const finalHintsEl = document.getElementById('finalHints');
    const finalScoreEl = document.getElementById('finalScore');
    const finalGradeEl = document.getElementById('finalGrade');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const backToLevelsBtn = document.getElementById('backToLevelsBtn');
    const nextLevelBtn = document.getElementById('nextLevelBtn');
    const currentLevelEl = document.getElementById('currentLevel');
    const gameLevelEl = document.getElementById('gameLevel');
    
    let rows = 4;
    let cols = 4;
    let currentLevel = 1;
    const levelImages = [
        '../assets/images/level2/mao1.jpg',
        '../assets/images/level2/mao2.jpg',
        '../assets/images/level2/mao3.jpg',
        '../assets/images/level2/mao4.jpg'
    ];
    let pieceWidth, pieceHeight;
    let puzzlePieces = [];
    let piecePositions = [];
    let originalImage = null;
    let originalImageSrc = null;
    let moveCount = 0;
    let placedCount = 0;
    let isGameStarted = false;
    let isPreviewPhase = false;
    let remainingHints = 3;
    let draggedPiece = null;
    let gameId = null;
    
    const API_BASE_URL = '/api/level2';
    
    let timerInterval = null;
    let previewTimerInterval = null;
    let startTime = 0;
    let elapsedTime = 0;
    
    // 松鼠图片轮播 - 添加版本号防止缓存
    const squirrelImgFront = document.getElementById('squirrelImgFront');
    const squirrelImgBack = document.getElementById('squirrelImgBack');
    const imageVersion = 'v1.0.1_20260316';
    const squirrelImages = [
        `../assets/images/1.jpg?t=${imageVersion}`,
        `../assets/images/2.jpg?t=${imageVersion}`,
        `../assets/images/3.jpg?t=${imageVersion}`,
        `../assets/images/4.jpg?t=${imageVersion}`
    ];
    let currentSquirrelIndex = 0;
    let squirrelInterval = null;
    let isFrontActive = true;
    
    function switchSquirrelImage() {
        // 计算下一张图片索引
        const nextIndex = (currentSquirrelIndex + 1) % squirrelImages.length;
        
        // 获取当前显示和隐藏的图片元素
        const frontImg = isFrontActive ? squirrelImgFront : squirrelImgBack;
        const backImg = isFrontActive ? squirrelImgBack : squirrelImgFront;
        
        // 先设置下一张图片到背面
        backImg.src = squirrelImages[nextIndex];
        
        // 直接切换，不使用透明度动画避免重影
        frontImg.style.visibility = 'hidden';
        backImg.style.visibility = 'visible';
        
        // 更新当前索引和活跃状态
        currentSquirrelIndex = nextIndex;
        isFrontActive = !isFrontActive;
    }
    
    function startSquirrelAnimation() {
        if (squirrelInterval) {
            clearInterval(squirrelInterval);
        }
        // 与松鼠脉冲动画同步：3秒一个周期
        squirrelInterval = setInterval(switchSquirrelImage, 3000);
    }
    
    // 页面加载时启动松鼠动画
    startSquirrelAnimation();
    
    const audioClick = new Audio('../assets/sounds/sfx/点击.mp3');
    const audioMove = new Audio('../assets/sounds/sfx/移动.mp3');
    const audioWin = new Audio('../assets/sounds/sfx/游戏胜利.mp3');
    
    audioMove.playbackRate = 5;
    
    function playAudio(audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio playback failed:', e));
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    function startTimer() {
        startTime = Date.now();
        elapsedTime = 0;
        timeElapsedEl.textContent = '00:00';
        
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        timerInterval = setInterval(() => {
            elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            timeElapsedEl.textContent = formatTime(elapsedTime);
        }, 1000);
    }
    
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
    
    function loadDefaultImage() {
        originalImage = new Image();
        originalImage.onload = function() {
            console.log('图片加载完成:', originalImage.width, 'x', originalImage.height);
            previewImage.src = originalImage.src;
            previewImage.style.display = 'none';
            startBtn.disabled = false;
            startBtn.title = '';
            initPuzzle();
        };
        originalImage.onerror = function() {
            console.error('图片加载失败:', levelImages[currentLevel - 1]);
            alert('默认图片加载失败，请手动选择一张图片！');
        };
        const imageVersion = 'v1.0.1_20260316';
        const imageUrl = `${levelImages[currentLevel - 1]}?t=${imageVersion}`;
        console.log('开始加载图片:', imageUrl);
        originalImage.src = imageUrl;
    }
    
    function initPuzzle() {
        const gridSize = parseInt(gridSizeInput.value) || 3;
        rows = gridSize;
        cols = gridSize;
        rows = Math.max(2, Math.min(10, rows));
        cols = Math.max(2, Math.min(10, cols));
        gridSizeInput.value = rows;
        
        difficultyEl.textContent = `${rows}×${cols}`;
        
        createEmptyPuzzleGrid();
    }
    
    function createEmptyPuzzleGrid() {
        puzzleGrid.innerHTML = '';
        
        const gridWidth = Math.min(500, window.innerWidth - 100);
        const gridHeight = gridWidth;
        
        puzzleGrid.style.width = gridWidth + 'px';
        puzzleGrid.style.height = gridHeight + 'px';
        
        puzzleGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        puzzleGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'puzzle-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                puzzleGrid.appendChild(cell);
            }
        }
    }
    
    window.addEventListener('load', function() {
        startBtn.disabled = true;
        startBtn.title = '图片正在加载中...';
        loadDefaultImage();
    });
    
    gridSizeInput.addEventListener('change', function() {
        initPuzzle();
    });
    
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                originalImage = new Image();
                originalImage.onload = function() {
                    previewImage.src = originalImage.src;
                    previewImage.style.display = 'none';
                    startBtn.disabled = false;
                    startBtn.title = '';
                    initPuzzle();
                };
                originalImage.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    startBtn.addEventListener('click', function() {
        playAudio(audioClick);
        startGame();
    });
    
    resetBtn.addEventListener('click', function() {
        playAudio(audioClick);
        resetGame();
    });
    
    checkBtn.addEventListener('click', function() {
        playAudio(audioClick);
        checkComplete();
    });
    
    hintBtn.addEventListener('click', function() {
        playAudio(audioClick);
        useHint();
    });
    
    backBtn.addEventListener('click', function() {
        playAudio(audioClick);
        goBackToLevels();
    });
    
    playAgainBtn.addEventListener('click', function() {
        playAudio(audioClick);
        completeOverlay.classList.remove('show');
        startGame();
    });
    
    nextLevelBtn.addEventListener('click', function() {
        playAudio(audioClick);
        goToNextLevel();
    });
    
    backToLevelsBtn.addEventListener('click', function() {
        playAudio(audioClick);
        goBackToLevels();
    });
    
    async function startGame() {
        if (!originalImage) {
            alert('请先选择一张图片！');
            return;
        }

        if (!originalImage.complete || originalImage.width === 0 || originalImage.height === 0) {
            alert('图片正在加载中，请稍后再试！');
            return;
        }

        const gridSize = parseInt(gridSizeInput.value) || 3;
        rows = gridSize;
        cols = gridSize;
        rows = Math.max(2, Math.min(10, rows));
        cols = Math.max(2, Math.min(10, cols));
        gridSizeInput.value = rows;

        difficultyEl.textContent = `${rows}×${cols}`;

        moveCount = 0;
        placedCount = 0;
        remainingHints = 3;
        isGameStarted = true;
        isPreviewPhase = true;
        
        updateInfo();
        
        try {
            const params = new URLSearchParams({
                rows: rows,
                cols: cols,
                imageUrl: originalImage.src
            });
            
            const response = await fetch(`${API_BASE_URL}/start?${params}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            
            gameId = await response.text();
            
            console.log('游戏开始成功:', gameId);
            
            createPuzzle(true);
            startPreviewTimer();
        } catch (error) {
            console.error('开始游戏失败:', error);
            alert('开始游戏失败，请稍后重试！');
            isGameStarted = false;
        }
    }
    
    function createPuzzle(startGameFlag = true) {
        if (!originalImage || !originalImage.complete || originalImage.width === 0 || originalImage.height === 0) {
            console.error('图片未加载完成:', originalImage);
            alert('图片正在加载中，请稍后再试！');
            return;
        }
        console.log('开始创建拼图:', rows, 'x', cols);
        console.log('图片信息:', originalImage.width, 'x', originalImage.height);
        
        puzzleGrid.innerHTML = '';
        puzzlePieces = [];
        piecePositions = [];
        moveCount = 0;
        placedCount = 0;
        isGameStarted = startGameFlag;
        updateInfo();
        
        const gridWidth = Math.min(500, window.innerWidth - 100);
        const gridHeight = gridWidth;
        
        console.log('网格尺寸:', gridWidth, 'x', gridHeight);
        
        puzzleGrid.style.width = gridWidth + 'px';
        puzzleGrid.style.height = gridHeight + 'px';

        pieceWidth = gridWidth / cols;
        pieceHeight = gridHeight / rows;
        
        const pieceSize = Math.min(pieceWidth, pieceHeight);
        pieceWidth = pieceSize;
        pieceHeight = pieceSize;
        
        console.log('拼图块尺寸:', pieceWidth, 'x', pieceHeight);

        puzzleGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        puzzleGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'puzzle-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                puzzleGrid.appendChild(cell);
            }
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const squareSize = Math.min(originalImage.width, originalImage.height);
        const offsetX = (originalImage.width - squareSize) / 2;
        const offsetY = (originalImage.height - squareSize) / 2;
        
        canvas.width = squareSize;
        canvas.height = squareSize;
        
        ctx.drawImage(
            originalImage,
            offsetX, offsetY, squareSize, squareSize,
            0, 0, squareSize, squareSize
        );

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const piece = document.createElement('div');
                piece.className = 'puzzle-piece';
                piece.dataset.correctRow = i;
                piece.dataset.correctCol = j;
                piece.dataset.currentRow = -1;
                piece.dataset.currentCol = -1;

                const pieceCanvas = document.createElement('canvas');
                pieceCanvas.width = pieceSize;
                pieceCanvas.height = pieceSize;
                const pieceCtx = pieceCanvas.getContext('2d');

                const sourceX = (j / cols) * squareSize;
                const sourceY = (i / rows) * squareSize;
                const sourceW = squareSize / cols;
                const sourceH = squareSize / rows;

                pieceCtx.drawImage(
                    canvas,
                    sourceX, sourceY, sourceW, sourceH,
                    0, 0, pieceSize, pieceSize
                );

                piece.style.position = 'absolute';
                piece.style.width = pieceSize + 'px';
                piece.style.height = pieceSize + 'px';
                piece.style.backgroundImage = `url(${pieceCanvas.toDataURL()})`;
                piece.style.backgroundSize = '100% 100%';

                puzzlePieces.push(piece);
                piecePositions.push({
                    row: -1,
                    col: -1,
                    occupied: false
                });
                
                puzzleGrid.appendChild(piece);
            }
        }
        
        console.log('创建了', puzzlePieces.length, '个拼图块');

        if (startGameFlag) {
            scatterPieces();
        } else {
            placePiecesInOrder();
        }
        setupDragAndDrop();
    }
    
    function placePiecesInOrder() {
        puzzlePieces.forEach((piece, index) => {
            const correctRow = parseInt(piece.dataset.correctRow);
            const correctCol = parseInt(piece.dataset.correctCol);
            
            piecePositions[index].row = correctRow;
            piecePositions[index].col = correctCol;
            piecePositions[index].occupied = true;
            
            const x = correctCol * pieceWidth;
            const y = correctRow * pieceHeight;
            
            piece.style.left = x + 'px';
            piece.style.top = y + 'px';
        });
    }
    
    function scatterPieces() {
        const usedPositions = [];

        puzzlePieces.forEach((piece, index) => {
            let randomRow, randomCol;
            let attempts = 0;
            
            do {
                randomRow = Math.floor(Math.random() * rows);
                randomCol = Math.floor(Math.random() * cols);
                attempts++;
            } while (isPositionOccupied(randomRow, randomCol) && attempts < 100);

            piecePositions[index].row = randomRow;
            piecePositions[index].col = randomCol;
            piecePositions[index].occupied = true;
            usedPositions.push({ row: randomRow, col: randomCol });

            const x = randomCol * pieceWidth;
            const y = randomRow * pieceHeight;

            piece.style.left = x + 'px';
            piece.style.top = y + 'px';
            
            piece.classList.add('disabled');
        });
        
        gameInfo.style.display = 'flex';
    }
    
    function isPositionOccupied(row, col) {
        return piecePositions.some(pos => pos.row === row && pos.col === col && pos.occupied);
    }
    
    function setupDragAndDrop() {
        puzzlePieces.forEach(piece => {
            piece.addEventListener('mousedown', startDrag);
            piece.addEventListener('touchstart', startDragTouch);
        });
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchmove', dragTouch);
        document.addEventListener('touchend', endDragTouch);
    }
    
    function startDrag(e) {
        if (!isGameStarted || isPreviewPhase) return;
        
        draggedPiece = e.target;
        draggedPiece.classList.add('dragging');
        
        const rect = puzzleGrid.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left - draggedPiece.offsetLeft;
        dragOffsetY = e.clientY - rect.top - draggedPiece.offsetTop;
        
        e.preventDefault();
    }
    
    function startDragTouch(e) {
        if (!isGameStarted || isPreviewPhase) return;
        
        draggedPiece = e.target;
        draggedPiece.classList.add('dragging');
        
        const rect = puzzleGrid.getBoundingClientRect();
        const touch = e.touches[0];
        dragOffsetX = touch.clientX - rect.left - draggedPiece.offsetLeft;
        dragOffsetY = touch.clientY - rect.top - draggedPiece.offsetTop;
        
        e.preventDefault();
    }
    
    function drag(e) {
        if (!draggedPiece) return;
        
        const rect = puzzleGrid.getBoundingClientRect();
        let x = e.clientX - rect.left - dragOffsetX;
        let y = e.clientY - rect.top - dragOffsetY;
        
        x = Math.max(0, Math.min(x, puzzleGrid.offsetWidth - pieceWidth));
        y = Math.max(0, Math.min(y, puzzleGrid.offsetHeight - pieceHeight));
        
        draggedPiece.style.left = x + 'px';
        draggedPiece.style.top = y + 'px';
    }
    
    function dragTouch(e) {
        if (!draggedPiece) return;
        
        const rect = puzzleGrid.getBoundingClientRect();
        const touch = e.touches[0];
        let x = touch.clientX - rect.left - dragOffsetX;
        let y = touch.clientY - rect.top - dragOffsetY;
        
        x = Math.max(0, Math.min(x, puzzleGrid.offsetWidth - pieceWidth));
        y = Math.max(0, Math.min(y, puzzleGrid.offsetHeight - pieceHeight));
        
        draggedPiece.style.left = x + 'px';
        draggedPiece.style.top = y + 'px';
        
        e.preventDefault();
    }
    
    function endDrag(e) {
        if (!draggedPiece) return;
        
        draggedPiece.classList.remove('dragging');
        
        const rect = draggedPiece.getBoundingClientRect();
        const gridRect = puzzleGrid.getBoundingClientRect();
        
        const pieceCenterX = rect.left + rect.width / 2 - gridRect.left;
        const pieceCenterY = rect.top + rect.height / 2 - gridRect.top;
        
        const col = Math.floor(pieceCenterX / pieceWidth);
        const row = Math.floor(pieceCenterY / pieceHeight);
        
        const pieceIndex = puzzlePieces.indexOf(draggedPiece);
        
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
            const targetPositionIndex = piecePositions.findIndex(p => p.row === row && p.col === col);
            
            if (targetPositionIndex !== -1) {
                const targetPiece = puzzlePieces[targetPositionIndex];
                
                if (piecePositions[targetPositionIndex].occupied) {
                    const tempRow = piecePositions[pieceIndex].row;
                    const tempCol = piecePositions[pieceIndex].col;
                    
                    piecePositions[pieceIndex].row = row;
                    piecePositions[pieceIndex].col = col;
                    piecePositions[pieceIndex].occupied = true;
                    
                    piecePositions[targetPositionIndex].row = tempRow;
                    piecePositions[targetPositionIndex].col = tempCol;
                    piecePositions[targetPositionIndex].occupied = tempRow !== -1 && tempCol !== -1;
                    
                    if (tempRow !== -1 && tempCol !== -1) {
                        targetPiece.style.left = tempCol * pieceWidth + 'px';
                        targetPiece.style.top = tempRow * pieceHeight + 'px';
                    } else {
                        const randomX = Math.random() * (puzzleGrid.offsetWidth - pieceWidth);
                        const randomY = Math.random() * (puzzleGrid.offsetHeight - pieceHeight);
                        targetPiece.style.left = randomX + 'px';
                        targetPiece.style.top = randomY + 'px';
                    }
                } else {
                    piecePositions[pieceIndex].row = row;
                    piecePositions[pieceIndex].col = col;
                    piecePositions[pieceIndex].occupied = true;
                }
                
                draggedPiece.style.left = col * pieceWidth + 'px';
                draggedPiece.style.top = row * pieceHeight + 'px';
                
                moveCount++;
                updateInfo();
                
                playAudio(audioMove);
            }
        }
        
        draggedPiece = null;
        
        checkPlaced();
    }
    
    function endDragTouch(e) {
        if (!draggedPiece) return;
        
        draggedPiece.classList.remove('dragging');
        
        const rect = draggedPiece.getBoundingClientRect();
        const gridRect = puzzleGrid.getBoundingClientRect();
        
        const pieceCenterX = rect.left + rect.width / 2 - gridRect.left;
        const pieceCenterY = rect.top + rect.height / 2 - gridRect.top;
        
        const col = Math.floor(pieceCenterX / pieceWidth);
        const row = Math.floor(pieceCenterY / pieceHeight);
        
        const pieceIndex = puzzlePieces.indexOf(draggedPiece);
        
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
            const targetPositionIndex = piecePositions.findIndex(p => p.row === row && p.col === col);
            
            if (targetPositionIndex !== -1) {
                const targetPiece = puzzlePieces[targetPositionIndex];
                
                if (piecePositions[targetPositionIndex].occupied) {
                    const tempRow = piecePositions[pieceIndex].row;
                    const tempCol = piecePositions[pieceIndex].col;
                    
                    piecePositions[pieceIndex].row = row;
                    piecePositions[pieceIndex].col = col;
                    piecePositions[pieceIndex].occupied = true;
                    
                    piecePositions[targetPositionIndex].row = tempRow;
                    piecePositions[targetPositionIndex].col = tempCol;
                    piecePositions[targetPositionIndex].occupied = tempRow !== -1 && tempCol !== -1;
                    
                    if (tempRow !== -1 && tempCol !== -1) {
                        targetPiece.style.left = tempCol * pieceWidth + 'px';
                        targetPiece.style.top = tempRow * pieceHeight + 'px';
                    } else {
                        const randomX = Math.random() * (puzzleGrid.offsetWidth - pieceWidth);
                        const randomY = Math.random() * (puzzleGrid.offsetHeight - pieceHeight);
                        targetPiece.style.left = randomX + 'px';
                        targetPiece.style.top = randomY + 'px';
                    }
                } else {
                    piecePositions[pieceIndex].row = row;
                    piecePositions[pieceIndex].col = col;
                    piecePositions[pieceIndex].occupied = true;
                }
                
                draggedPiece.style.left = col * pieceWidth + 'px';
                draggedPiece.style.top = row * pieceHeight + 'px';
                
                moveCount++;
                updateInfo();
                
                playAudio(audioMove);
            }
        }
        
        draggedPiece = null;
    }
    
    function updateInfo() {
        moveCountEl.textContent = moveCount;
        placedCountEl.textContent = placedCount;
        remainingHintsEl.textContent = remainingHints;
        currentScoreEl.textContent = calculateCurrentScore();
    }
    
    function calculateCurrentScore() {
        if (!isGameStarted) return 0;
        
        const totalPieces = rows * cols;
        const scorePerPiece = 1000 / totalPieces;
        const baseSteps = totalPieces * 2;
        
        const placementScore = placedCount * scorePerPiece;
        const stepPenalty = Math.max(0, (moveCount - baseSteps) * 1);
        const hintPenalty = (3 - remainingHints) * 50;
        
        const currentScore = placementScore - stepPenalty - hintPenalty;
        
        return Math.max(0, Math.round(currentScore));
    }
    
    function startPreviewTimer() {
        isPreviewPhase = true;
        previewTimer.style.display = 'block';
        previewImage.style.display = 'block';
        previewHint.textContent = '💡 提示：原图预览中，请记住图片！';
        
        originalImageSrc = originalImage.src;
        
        let secondsLeft = 5;
        timerCount.textContent = secondsLeft;
        
        previewTimerInterval = setInterval(() => {
            secondsLeft--;
            timerCount.textContent = secondsLeft;
            
            if (secondsLeft <= 0) {
                clearInterval(previewTimerInterval);
                endPreviewPhase();
            }
        }, 1000);
    }
    
    function endPreviewPhase() {
        isPreviewPhase = false;
        previewTimer.style.display = 'none';
        previewImage.src = '../assets/images/lookcat.jpg';
        previewImage.style.display = 'block';
        previewHint.textContent = '💡 提示：原图已隐藏，凭记忆拼图！点击"查看原图"按钮可短暂查看原图（共3次）';
        
        puzzlePieces.forEach(piece => {
            piece.classList.remove('disabled');
        });
        
        startTimer();
    }
    
    function useHint() {
        if (remainingHints <= 0 || !isGameStarted || isPreviewPhase) {
            alert('没有剩余提示次数了！');
            return;
        }
        
        remainingHints--;
        updateInfo();
        hintBtn.textContent = '查看原图 (' + remainingHints + ')';
        
        previewImage.src = originalImageSrc;
        previewImage.style.display = 'block';
        previewHint.textContent = '💡 提示：原图显示中，3秒后隐藏...';
        
        setTimeout(() => {
            previewImage.src = '../assets/images/lookcat.jpg';
            previewHint.textContent = '💡 提示：原图已隐藏，凭记忆拼图！点击"查看原图"按钮可短暂查看原图（共' + remainingHints + '次）';
        }, 3000);
    }
    
    function checkComplete() {
        if (!isGameStarted) return;
        
        let correctCount = 0;
        puzzlePieces.forEach((piece, index) => {
            const currentRow = piecePositions[index].row;
            const currentCol = piecePositions[index].col;
            const correctRow = parseInt(piece.dataset.correctRow);
            const correctCol = parseInt(piece.dataset.correctCol);
            
            if (currentRow === correctRow && currentCol === correctCol) {
                correctCount++;
            }
        });
        
        placedCount = correctCount;
        updateInfo();
        
        if (correctCount === rows * cols) {
            gameComplete();
        } else {
            alert(`还有 ${rows * cols - correctCount} 个拼图块位置不正确，请继续努力！`);
        }
    }
    
    function checkPlaced() {
        placedCount = 0;
        
        puzzlePieces.forEach((piece, index) => {
            const correctRow = parseInt(piece.dataset.correctRow);
            const correctCol = parseInt(piece.dataset.correctCol);
            const currentRow = piecePositions[index].row;
            const currentCol = piecePositions[index].col;

            if (currentRow === correctRow && currentCol === correctCol) {
                placedCount++;
                piece.style.opacity = '0.9';
                piece.style.borderColor = '#4caf50';
            } else {
                piece.style.opacity = '1';
                piece.style.borderColor = '#fff';
            }
        });

        updateInfo();

        if (placedCount === rows * cols) {
            setTimeout(() => {
                gameComplete();
            }, 300);
        }
    }
    
    async function gameComplete() {
        stopTimer();
        isGameStarted = false;
        
        playAudio(audioWin);
        
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        const hintsUsed = 3 - remainingHints;
        
        currentLevelEl.textContent = currentLevel;
        
        try {
            const response = await fetch(`${API_BASE_URL}/finish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameId: gameId,
                    moveCount: moveCount,
                    hintsUsed: hintsUsed,
                    elapsedTime: elapsedTime,
                    correctPieces: placedCount
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                finalMovesEl.textContent = data.totalMoves;
                finalTimeEl.textContent = formatTime(data.totalTime);
                finalHintsEl.textContent = data.hintsUsed;
                finalScoreEl.textContent = data.finalScore;
                finalGradeEl.textContent = data.grade;
            } else {
                const baseScore = 1000;
                const movePenalty = moveCount * 2;
                const timePenalty = elapsedTime * 1;
                const hintPenalty = hintsUsed * 100;
                const finalScore = Math.max(0, baseScore - movePenalty - timePenalty - hintPenalty);
                
                finalMovesEl.textContent = moveCount;
                finalTimeEl.textContent = formatTime(elapsedTime);
                finalHintsEl.textContent = hintsUsed;
                finalScoreEl.textContent = finalScore;
                finalGradeEl.textContent = '-';
            }
        } catch (error) {
            console.error('获取游戏结果失败:', error);
            const baseScore = 1000;
            const movePenalty = moveCount * 2;
            const timePenalty = elapsedTime * 1;
            const hintPenalty = hintsUsed * 100;
            const finalScore = Math.max(0, baseScore - movePenalty - timePenalty - hintPenalty);
            
            finalMovesEl.textContent = moveCount;
            finalTimeEl.textContent = formatTime(elapsedTime);
            finalHintsEl.textContent = hintsUsed;
            finalScoreEl.textContent = finalScore;
            finalGradeEl.textContent = '-';
        }
        
        if (currentLevel >= levelImages.length) {
            nextLevelBtn.textContent = '最后一关';
            nextLevelBtn.disabled = true;
        } else {
            nextLevelBtn.textContent = '下一关';
            nextLevelBtn.disabled = false;
        }
        
        completeOverlay.classList.add('show');
    }
    
    function resetGame() {
        stopTimer();
        isGameStarted = false;
        isPreviewPhase = false;
        
        if (previewTimerInterval) {
            clearInterval(previewTimerInterval);
        }
        
        moveCount = 0;
        placedCount = 0;
        remainingHints = 3;
        
        previewTimer.style.display = 'none';
        previewImage.style.display = 'none';
        previewHint.textContent = '💡 提示：点击"开始游戏"后加载原图预览';
        
        gameInfo.style.display = 'none';
        completeOverlay.classList.remove('show');
        
        startBtn.disabled = false;
        hintBtn.disabled = false;
        hintBtn.textContent = '查看原图 (3)';
        
        updateInfo();
        createEmptyPuzzleGrid();
    }
    
    function goBackToLevels() {
        window.location.href = '../index.html';
    }
    
    function goToNextLevel() {
        if (currentLevel < levelImages.length) {
            currentLevel++;
            currentLevelEl.textContent = currentLevel;
            gameLevelEl.textContent = currentLevel;
            completeOverlay.classList.remove('show');
            loadDefaultImage();
        } else {
            alert('已经是最后一关了！');
        }
    }
})();
