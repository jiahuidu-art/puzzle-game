(function() {
    const imageInput = document.getElementById('imageInput');
    const gridSizeInput = document.getElementById('gridSize');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const checkBtn = document.getElementById('checkBtn');
    const backBtn = document.getElementById('backBtn');
    const puzzleGrid = document.getElementById('puzzleGrid');
    const previewImage = document.getElementById('previewImage');
    const gameInfo = document.getElementById('gameInfo');
    const gameContainer = document.getElementById('gameContainer');
    const moveCountEl = document.getElementById('moveCount');
    const placedCountEl = document.getElementById('placedCount');
    const difficultyEl = document.getElementById('difficulty');
    const completeOverlay = document.getElementById('completeOverlay');
    const finalMovesEl = document.getElementById('finalMoves');
    const finalTimeEl = document.getElementById('finalTime');
    const timeElapsedEl = document.getElementById('timeElapsed');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const toggleRotationBtn = document.getElementById('toggleRotationBtn');
    
    let rows = 3;
    let cols = 3;
    let pieceWidth, pieceHeight;
    let puzzlePieces = [];
    let piecePositions = [];
    let originalImage = null;
    let moveCount = 0;
    let placedCount = 0;
    let isGameStarted = false;
    let draggedPiece = null;
    let rotationHintsVisible = false;
    
    let cachedPuzzlePieces = null;
    let aiThinking = false;
    let aiResponseElement = null;
    
    // 拖动相关变量
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let currentDraggedElement = null;

    function loadDefaultImage() {
        originalImage = new Image();
        originalImage.onload = function() {
            console.log('图片加载完成:', originalImage.width, 'x', originalImage.height);
            previewImage.src = originalImage.src;
            try {
                cacheDefaultPuzzlePieces();
            } catch (error) {
                console.error('缓存默认图片拼图块失败:', error);
            }
            startBtn.disabled = false;
            startBtn.title = '';
            initPuzzle();
        };
        originalImage.onerror = function() {
            console.error('图片加载失败:', '../assets/images/test.jpeg');
            alert('默认图片加载失败，请手动选择一张图片！');
        };
        // 添加版本号防止图片缓存，每次更新图片时修改版本号
        const imageVersion = 'v1.0.1_20260316';
        const imageUrl = `../assets/images/test.jpeg?t=${imageVersion}`;
        console.log('开始加载图片:', imageUrl);
        originalImage.src = imageUrl;
    }
    
    function cacheDefaultPuzzlePieces() {
        console.log('开始缓存默认图片拼图块');
        
        const defaultRows = 3;
        const defaultCols = 3;
        
        const squareSize = Math.min(originalImage.width, originalImage.height);
        const offsetX = (originalImage.width - squareSize) / 2;
        const offsetY = (originalImage.height - squareSize) / 2;
        
        const canvas = document.createElement('canvas');
        canvas.width = squareSize;
        canvas.height = squareSize;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(
            originalImage,
            offsetX, offsetY, squareSize, squareSize,
            0, 0, squareSize, squareSize
        );
        
        const gridWidth = Math.min(500, window.innerWidth - 100);
        const gridHeight = gridWidth;
        const pieceWidth = gridWidth / defaultCols;
        const pieceHeight = gridHeight / defaultRows;
        const pieceSize = Math.min(pieceWidth, pieceHeight);
        
        cachedPuzzlePieces = [];
        for (let i = 0; i < defaultRows; i++) {
            for (let j = 0; j < defaultCols; j++) {
                const pieceCanvas = document.createElement('canvas');
                pieceCanvas.width = pieceSize;
                pieceCanvas.height = pieceSize;
                const pieceCtx = pieceCanvas.getContext('2d');
                
                const sourceX = (j / defaultCols) * squareSize;
                const sourceY = (i / defaultRows) * squareSize;
                const sourceW = squareSize / defaultCols;
                const sourceH = squareSize / defaultRows;
                
                pieceCtx.drawImage(
                    canvas,
                    sourceX, sourceY, sourceW, sourceH,
                    0, 0, pieceSize, pieceSize
                );
                
                try {
                    const dataUrl = pieceCanvas.toDataURL();
                    cachedPuzzlePieces.push({
                        row: i,
                        col: j,
                        dataUrl: dataUrl
                    });
                } catch (error) {
                    console.error('缓存拼图块失败:', error);
                    cachedPuzzlePieces = null;
                    return;
                }
            }
        }
        
        if (cachedPuzzlePieces) {
            console.log('默认图片拼图块缓存完成:', cachedPuzzlePieces.length, '个拼图块');
        }
    }
    
    window.addEventListener('load', function() {
        startBtn.disabled = true;
        startBtn.title = '图片正在加载中...';
        loadDefaultImage();
        testBackendConnection();
    });
    
    function initPuzzle() {
        rows = parseInt(gridSizeInput.value) || 3;
        cols = parseInt(gridSizeInput.value) || 3;
        rows = Math.max(2, Math.min(10, rows));
        cols = Math.max(2, Math.min(10, cols));
        gridSizeInput.value = rows;
        
        difficultyEl.textContent = `${rows}×${cols}`;
        
        createPuzzle(false);
    }
    let timerInterval = null;
    let startTime = 0;
    let elapsedTime = 0;
    
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

    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                originalImage = new Image();
                originalImage.onload = function() {
                    previewImage.src = originalImage.src;
                    startBtn.disabled = false;
                    startBtn.title = '';
                    cachedPuzzlePieces = null;
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
    backBtn.addEventListener('click', function() {
        playAudio(audioClick);
        window.location.href = '../index.html';
    });
    toggleRotationBtn.addEventListener('click', function() {
        playAudio(audioClick);
        rotationHintsVisible = !rotationHintsVisible;
        if (rotationHintsVisible) {
            toggleRotationBtn.textContent = '隐藏旋转角度';
            puzzlePieces.forEach(piece => {
                const rotateHint = piece.querySelector('.rotate-hint');
                if (rotateHint) {
                    rotateHint.style.display = 'block';
                }
            });
        } else {
            toggleRotationBtn.textContent = '显示旋转角度';
            puzzlePieces.forEach(piece => {
                const rotateHint = piece.querySelector('.rotate-hint');
                if (rotateHint) {
                    rotateHint.style.display = 'none';
                }
            });
        }
    });
    playAgainBtn.addEventListener('click', function() {
        playAudio(audioClick);
        completeOverlay.classList.remove('show');
        startGame();
    });

    function startGame() {
        if (!originalImage) {
            alert('请先选择一张图片！');
            return;
        }

        if (!originalImage.complete || originalImage.width === 0 || originalImage.height === 0) {
            alert('图片正在加载中，请稍后再试！');
            return;
        }

        rows = parseInt(gridSizeInput.value) || 3;
        cols = parseInt(gridSizeInput.value) || 3;
        rows = Math.max(2, Math.min(10, rows));
        cols = Math.max(2, Math.min(10, cols));
        gridSizeInput.value = rows;

        difficultyEl.textContent = `${rows}×${cols}`;

        createPuzzle(true);
    }

    function createPuzzle(startGameFlag = true) {
        if (!originalImage || !originalImage.complete || originalImage.width === 0 || originalImage.height === 0) {
            console.error('图片未加载完成:', originalImage);
            alert('图片正在加载中，请稍后再试！');
            return;
        }
        console.log('开始创建拼图:', rows, 'x', cols);
        console.log('图片信息:', originalImage.width, 'x', originalImage.height);
        console.log('是否使用默认图片:', originalImage.src.includes('test.jpeg'));
        console.log('缓存的拼图块:', cachedPuzzlePieces);
        
        puzzleGrid.innerHTML = '';
        puzzlePieces = [];
        piecePositions = [];
        moveCount = 0;
        placedCount = 0;
        isGameStarted = startGameFlag;
        updateInfo();
        
        if (startGameFlag) {
            startTimer();
        }

        const gridWidth = Math.min(500, window.innerWidth - 100);
        const gridHeight = gridWidth;

        puzzleGrid.style.width = gridWidth + 'px';
        puzzleGrid.style.height = gridHeight + 'px';

        pieceWidth = gridWidth / cols;
        pieceHeight = gridHeight / rows;
        
        const pieceSize = Math.min(pieceWidth, pieceHeight);
        pieceWidth = pieceSize;
        pieceHeight = pieceSize;

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

        const isDefaultImage = originalImage.src.includes('test.jpeg');
        
        if (isDefaultImage && cachedPuzzlePieces && rows === 3 && cols === 3) {
            console.log('使用缓存的默认图片拼图块');
            
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const piece = document.createElement('div');
                    piece.className = 'puzzle-piece';
                    piece.dataset.correctRow = i;
                    piece.dataset.correctCol = j;
                    piece.dataset.currentRow = -1;
                    piece.dataset.currentCol = -1;

                    const cachedPiece = cachedPuzzlePieces.find(p => p.row === i && p.col === j);
                    if (cachedPiece) {
                        piece.style.width = pieceSize + 'px';
                        piece.style.height = pieceSize + 'px';
                        piece.style.backgroundImage = `url(${cachedPiece.dataUrl})`;
                        piece.style.backgroundSize = '100% 100%';
                        console.log('使用缓存的拼图块:', i, j);
                    } else {
                        console.log('缓存中没有找到拼图块，使用原始逻辑:', i, j);
                        createPuzzlePiece(piece, i, j, pieceSize);
                    }

                    const rotation = Math.floor(Math.random() * 4) * 90;
                    piece.dataset.rotation = rotation;
                    piece.style.transform = `rotate(${rotation}deg)`;

                    const rotateHint = document.createElement('span');
                    rotateHint.className = 'rotate-hint';
                    rotateHint.textContent = `${rotation}°`;
                    piece.appendChild(rotateHint);

                    puzzlePieces.push(piece);
                    piecePositions.push({
                        row: -1,
                        col: -1,
                        occupied: false
                    });
                    
                    puzzleGrid.appendChild(piece);
                }
            }
        } else {
            console.log('使用原始逻辑创建拼图块');
            
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

                    piece.style.width = pieceSize + 'px';
                    piece.style.height = pieceSize + 'px';
                    try {
                        const dataUrl = pieceCanvas.toDataURL();
                        piece.style.backgroundImage = `url(${dataUrl})`;
                        piece.style.backgroundSize = '100% 100%';
                    } catch (error) {
                        console.error('生成拼图块失败:', error);
                        piece.style.backgroundImage = `url(${originalImage.src})`;
                        
                        const pieceW = squareSize / cols;
                        const pieceH = squareSize / rows;
                        const scaleX = pieceSize / pieceW;
                        const scaleY = pieceSize / pieceH;
                        const backgroundWidth = originalImage.width * scaleX;
                        const backgroundHeight = originalImage.height * scaleY;
                        const pieceX = j * pieceW;
                        const pieceY = i * pieceH;
                        const backgroundX = -(offsetX + pieceX) * scaleX;
                        const backgroundY = -(offsetY + pieceY) * scaleY;
                        
                        piece.style.backgroundSize = `${backgroundWidth}px ${backgroundHeight}px`;
                        piece.style.backgroundPosition = `${backgroundX}px ${backgroundY}px`;
                    }

                    const rotation = Math.floor(Math.random() * 4) * 90;
                    piece.dataset.rotation = rotation;
                    piece.style.transform = `rotate(${rotation}deg)`;

                    const rotateHint = document.createElement('span');
                    rotateHint.className = 'rotate-hint';
                    rotateHint.textContent = `${rotation}°`;
                    piece.appendChild(rotateHint);

                    puzzlePieces.push(piece);
                    piecePositions.push({
                        row: -1,
                        col: -1,
                        occupied: false
                    });
                    
                    puzzleGrid.appendChild(piece);
                }
            }
        }

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
            piece.style.transform = `rotate(${parseInt(piece.dataset.rotation)}deg)`;
        });
    }
    
    function createPuzzlePiece(piece, row, col, pieceSize) {
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
        
        const pieceCanvas = document.createElement('canvas');
        pieceCanvas.width = pieceSize;
        pieceCanvas.height = pieceSize;
        const pieceCtx = pieceCanvas.getContext('2d');

        const sourceX = (col / 3) * squareSize;
        const sourceY = (row / 3) * squareSize;
        const sourceW = squareSize / 3;
        const sourceH = squareSize / 3;

        pieceCtx.drawImage(
            canvas,
            sourceX, sourceY, sourceW, sourceH,
            0, 0, pieceSize, pieceSize
        );

        piece.style.width = pieceSize + 'px';
        piece.style.height = pieceSize + 'px';
        piece.style.backgroundImage = `url(${pieceCanvas.toDataURL()})`;
        piece.style.backgroundSize = '100% 100%';
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
            piece.style.transform = `rotate(${parseInt(piece.dataset.rotation)}deg)`;
            
            puzzleGrid.appendChild(piece);
        });
    }

    function isPositionOccupied(row, col) {
        return piecePositions.some(pos => pos.row === row && pos.col === col && pos.occupied);
    }

    function setupDragAndDrop() {
        puzzlePieces.forEach(piece => {
            piece.addEventListener('mousedown', handleDragStart);
            piece.addEventListener('touchstart', handleDragStart, { passive: false });
        });

        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchend', handleDragEnd);

        puzzleGrid.addEventListener('dblclick', handleDoubleClick);
    }

    function handleDragStart(e) {
        if (!isGameStarted) return;
        
        e.preventDefault();
        const piece = e.target.closest('.puzzle-piece');
        if (!piece) return;

        draggedPiece = piece;
        draggedPiece.classList.add('dragging');

        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        const rect = puzzleGrid.getBoundingClientRect();
        const pieceRect = piece.getBoundingClientRect();

        dragOffsetX = clientX - pieceRect.left;
        dragOffsetY = clientY - pieceRect.top;

        const currentRotation = parseInt(piece.dataset.rotation);
        if (currentRotation === 90 || currentRotation === 270) {
            dragOffsetX = clientX - (pieceRect.left + (pieceWidth - pieceHeight) / 2);
            dragOffsetY = clientY - (pieceRect.top + (pieceHeight - pieceWidth) / 2);
        }

        const gridRect = puzzleGrid.getBoundingClientRect();
        let newLeft = clientX - gridRect.left - dragOffsetX;
        let newTop = clientY - gridRect.top - dragOffsetY;

        piece.style.left = newLeft + 'px';
        piece.style.top = newTop + 'px';
        piece.style.zIndex = '1000';
    }

    function handleDragMove(e) {
        if (!draggedPiece) return;
        e.preventDefault();

        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        const gridRect = puzzleGrid.getBoundingClientRect();
        let newLeft = clientX - gridRect.left - dragOffsetX;
        let newTop = clientY - gridRect.top - dragOffsetY;

        newLeft = Math.max(0, Math.min(newLeft, puzzleGrid.offsetWidth - draggedPiece.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, puzzleGrid.offsetHeight - draggedPiece.offsetHeight));

        draggedPiece.style.left = newLeft + 'px';
        draggedPiece.style.top = newTop + 'px';
    }

    function handleDragEnd(e) {
        if (!draggedPiece) return;

        const pieceIndex = puzzlePieces.indexOf(draggedPiece);
        if (pieceIndex === -1) {
            draggedPiece.classList.remove('dragging');
            draggedPiece = null;
            return;
        }

        const gridRect = puzzleGrid.getBoundingClientRect();
        const pieceRect = draggedPiece.getBoundingClientRect();

        let dropX = pieceRect.left - gridRect.left + pieceWidth / 2;
        let dropY = pieceRect.top - gridRect.top + pieceHeight / 2;

        const currentRotation = parseInt(draggedPiece.dataset.rotation);
        if (currentRotation === 90 || currentRotation === 270) {
            dropX = pieceRect.left - gridRect.left + pieceHeight / 2;
            dropY = pieceRect.top - gridRect.top + pieceWidth / 2;
        }

        let targetCol = Math.floor(dropX / pieceWidth);
        let targetRow = Math.floor(dropY / pieceHeight);

        targetCol = Math.max(0, Math.min(targetCol, cols - 1));
        targetRow = Math.max(0, Math.min(targetRow, rows - 1));

        const oldRow = piecePositions[pieceIndex].row;
        const oldCol = piecePositions[pieceIndex].col;

        if (targetRow !== oldRow || targetCol !== oldCol) {
            if (!isPositionOccupied(targetRow, targetCol)) {
                piecePositions[pieceIndex].row = targetRow;
                piecePositions[pieceIndex].col = targetCol;
                piecePositions[pieceIndex].occupied = true;
                if (oldRow !== -1 && oldCol !== -1) {
                    const oldPieceIndex = piecePositions.findIndex(
                        pos => pos.row === oldRow && pos.col === oldCol
                    );
                    if (oldPieceIndex !== -1) {
                        piecePositions[oldPieceIndex].occupied = false;
                    }
                }
                moveCount++;
                updateInfo();
            } else {
                const existingPieceIndex = piecePositions.findIndex(
                    pos => pos.row === targetRow && pos.col === targetCol
                );
                
                if (existingPieceIndex !== -1 && existingPieceIndex !== pieceIndex) {
                    const existingPiece = puzzlePieces[existingPieceIndex];
                    
                    const tempRow = piecePositions[pieceIndex].row;
                    const tempCol = piecePositions[pieceIndex].col;
                    const tempOccupied = piecePositions[pieceIndex].occupied;
                    
                    piecePositions[pieceIndex].row = targetRow;
                    piecePositions[pieceIndex].col = targetCol;
                    piecePositions[pieceIndex].occupied = true;
                    
                    piecePositions[existingPieceIndex].row = tempRow;
                    piecePositions[existingPieceIndex].col = tempCol;
                    piecePositions[existingPieceIndex].occupied = tempOccupied;
                    
                    existingPiece.style.left = (tempCol * pieceWidth) + 'px';
                    existingPiece.style.top = (tempRow * pieceHeight) + 'px';
                    
                    playAudio(audioMove);
                    moveCount++;
                    updateInfo();
                }
            }
        }

        draggedPiece.style.left = (targetCol * pieceWidth) + 'px';
        draggedPiece.style.top = (targetRow * pieceHeight) + 'px';
        draggedPiece.style.zIndex = '';

        draggedPiece.classList.remove('dragging');
        draggedPiece = null;

        checkPlaced();
    }

    function handleDoubleClick(e) {
        if (!isGameStarted) return;
        
        const piece = e.target.closest('.puzzle-piece');
        if (!piece) return;

        rotatePiece(piece);
    }

    function rotatePiece(piece) {
        let currentRotation = parseInt(piece.dataset.rotation);
        currentRotation = (currentRotation + 90) % 360;
        piece.dataset.rotation = currentRotation;
        
        const rotationText = piece.querySelector('.rotate-hint');
        if (rotationText) {
            rotationText.textContent = `${currentRotation}°`;
        }

        const currentLeft = parseFloat(piece.style.left);
        const currentTop = parseFloat(piece.style.top);
        
        const col = Math.round(currentLeft / pieceWidth);
        const row = Math.round(currentTop / pieceHeight);
        
        const cellCenterX = col * pieceWidth + pieceWidth / 2;
        const cellCenterY = row * pieceHeight + pieceHeight / 2;
        
        if (currentRotation === 90 || currentRotation === 270) {
            piece.style.width = pieceHeight + 'px';
            piece.style.height = pieceWidth + 'px';
            
            const newWidth = pieceHeight;
            const newHeight = pieceWidth;
            const newLeft = cellCenterX - newWidth / 2;
            const newTop = cellCenterY - newHeight / 2;
            
            piece.style.left = newLeft + 'px';
            piece.style.top = newTop + 'px';
        } else {
            piece.style.width = pieceWidth + 'px';
            piece.style.height = pieceHeight + 'px';
            
            const newWidth = pieceWidth;
            const newHeight = pieceHeight;
            const newLeft = cellCenterX - newWidth / 2;
            const newTop = cellCenterY - newHeight / 2;
            
            piece.style.left = newLeft + 'px';
            piece.style.top = newTop + 'px';
        }

        const transform = piece.style.transform;
        const currentAngle = parseInt(transform.match(/rotate\((\d+)deg\)/)?.[1] || '0');
        const newAngle = currentAngle + 90;
        piece.style.transform = `rotate(${newAngle}deg)`;
        checkPlaced();
    }

    function checkPlaced() {
        placedCount = 0;
        
        puzzlePieces.forEach((piece, index) => {
            const correctRow = parseInt(piece.dataset.correctRow);
            const correctCol = parseInt(piece.dataset.correctCol);
            const currentRow = piecePositions[index].row;
            const currentCol = piecePositions[index].col;
            const rotation = parseInt(piece.dataset.rotation);

            if (currentRow === correctRow && 
                currentCol === correctCol && 
                rotation === 0) {
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
                showComplete();
            }, 300);
        }
    }

    function checkComplete() {
        checkPlaced();
        if (placedCount === rows * cols) {
            showComplete();
        } else {
            alert(`还有 ${rows * cols - placedCount} 块未正确放置！`);
        }
    }

    function showComplete() {
        stopTimer();
        
        playAudio(audioWin);
        finalMovesEl.textContent = moveCount;
        finalTimeEl.textContent = formatTime(elapsedTime);
        completeOverlay.classList.add('show');
    }

    function resetGame() {
        if (originalImage) {
            startGame();
        }
    }

    function updateInfo() {
        moveCountEl.textContent = moveCount;
        placedCountEl.textContent = placedCount + ' / ' + (rows * cols);
    }

    function testBackendConnection() {
        console.log('开始测试后端连接...');
        
        fetch('/api/test/hello')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                console.log('后端连接成功:', data);
                showBackendStatus('success', '后端连接成功: ' + data);
            })
            .catch(error => {
                console.error('后端连接失败:', error);
                showBackendStatus('error', '后端连接失败: ' + error.message);
            });
    }

    function showBackendStatus(type, message) {
        let statusDiv = document.getElementById('backendStatus');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'backendStatus';
            statusDiv.className = 'backend-status';
            document.body.appendChild(statusDiv);
        }

        statusDiv.className = 'backend-status ' + type;
        statusDiv.textContent = message;

        setTimeout(() => {
            statusDiv.style.opacity = '0';
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.parentNode.removeChild(statusDiv);
                }
            }, 500);
        }, 5000);
    }



    async function getAIHint() {
        if (!aiResponseElement) {
            console.error('AI响应元素未创建');
            return;
        }
        if (aiThinking) return;
        if (!isGameStarted) {
            alert('请先开始游戏！');
            return;
        }




        // 显示思考状态
        showAIThinking();

        const puzzleState = {
            rows: rows,
            cols: cols,
            moveCount: moveCount,
            pieces: puzzlePieces.map((piece, index) => ({
                id: index,
                currentRow: piecePositions[index].row,
                currentCol: piecePositions[index].col,
                correctRow: parseInt(piece.dataset.correctRow),
                correctCol: parseInt(piece.dataset.correctCol),
                rotation: parseInt(piece.dataset.rotation)
            }))
        };

        try {
            const response = await fetch('/api/ai/hint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(puzzleState)
            });

            if (!response.ok) throw new Error('请求失败');

            const data = await response.json();

            // 显示结果（简单直接）
            const resultDiv = aiResponseElement.querySelector('.ai-result');
            const pieceNumber = data.pieceId + 1;
            const currentRow = data.currentRow + 1;
            const currentCol = data.currentCol + 1;
            const targetRow = data.targetRow + 1;
            const targetCol = data.targetCol + 1;

            resultDiv.innerHTML = `
            🤖 AI助手建议
            ⭕ 第 ${pieceNumber} 号拼图块
            📌 当前位置: (${currentRow}, ${currentCol})
            🎯 目标位置: (${targetRow}, ${targetCol})
            🔄 需要旋转: ${data.targetRotation}°
            💡 ${data.reason}
            🎯 ${data.encouragement}
            👆 双击该拼图块可旋转
            `.replace(/\n/g, '<br>');  // 将换行转换为HTML换行
            // 高亮显示建议的拼图块
            highlightSuggestedPiece(data.pieceId);

        } catch (error) {
            aiResponseElement.querySelector('.ai-result').innerHTML = '❌ AI助手暂时不可用，请稍后重试';
        } finally {
            // 隐藏思考状态
            aiThinking = false;
            aiResponseElement.querySelector('.ai-thinking').style.display = 'none';
            document.getElementById('aiAssistantBtn').disabled = false;
        }
    }

    // 点击其他地方关闭提示框
    document.addEventListener('click', function(e) {
        if (aiResponseElement &&
            aiResponseElement.style.display === 'block' &&
            !aiResponseElement.contains(e.target) &&
            !e.target.closest('#aiAssistantBtn')) {
            aiResponseElement.style.display = 'none';
        }
    });




    function createAIAssistantButton() {
        // 创建AI助手按钮
        const aiButton = document.createElement('button');
        aiButton.textContent = '🤖 AI助手';
        aiButton.id = 'aiAssistantBtn';
        aiButton.className = 'ai-assistant-btn';
        aiButton.addEventListener('click', function() {
            playAudio(audioClick);
            getAIHint();
        });
        document.body.appendChild(aiButton);

        // 创建AI响应提示框
        const aiResponseDiv = document.createElement('div');
        aiResponseDiv.id = 'aiResponse';
        aiResponseDiv.className = 'ai-response';
        aiResponseDiv.style.display = 'none';
        aiResponseDiv.innerHTML = `
        <div class="ai-thinking">🤔 AI助手正在思考...</div>
        <div class="ai-result"></div>
    `;
        // 修复：将弹窗追加到body，而不是容器内部
        // 这样才能确保fixed定位正常工作
        document.body.appendChild(aiResponseDiv);
        aiResponseElement = aiResponseDiv;
        
        // 立即初始化拖动功能
        setTimeout(() => {
            addDragFunctionality();
        }, 100);
    }

    function addDragFunctionality() {
        const aiResponse = document.getElementById('aiResponse');
        if (!aiResponse) return;

        // 鼠标按下事件 - 开始拖动
        aiResponse.addEventListener('mousedown', function(e) {
            // 简化：整个对话框都可拖动
            isDragging = true;
            currentDraggedElement = aiResponse;

            // 计算鼠标位置与元素位置的偏移量
            const rect = aiResponse.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;

            // 添加拖动样式
            aiResponse.classList.add('dragging');

            // 防止文本选择
            e.preventDefault();
            return false;
        });

        // 鼠标移动事件 - 处理拖动
        document.addEventListener('mousemove', function(e) {
            if (!isDragging || !currentDraggedElement) return;

            // 计算新位置
            const newX = e.clientX - dragOffsetX;
            const newY = e.clientY - dragOffsetY;

            // 限制在可视区域内
            const maxX = window.innerWidth - currentDraggedElement.offsetWidth;
            const maxY = window.innerHeight - currentDraggedElement.offsetHeight;

            const boundedX = Math.max(0, Math.min(newX, maxX));
            const boundedY = Math.max(0, Math.min(newY, maxY));

            // 应用新位置
            currentDraggedElement.style.left = boundedX + 'px';
            currentDraggedElement.style.top = boundedY + 'px';
            currentDraggedElement.style.transform = 'none'; // 移除居中transform
        });

        // 鼠标释放事件 - 结束拖动
        document.addEventListener('mouseup', function() {
            if (isDragging && currentDraggedElement) {
                isDragging = false;
                currentDraggedElement.classList.remove('dragging');
                currentDraggedElement = null;
            }
        });

        // 触摸设备支持
        aiResponse.addEventListener('touchstart', function(e) {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                isDragging = true;
                currentDraggedElement = aiResponse;

                const rect = aiResponse.getBoundingClientRect();
                dragOffsetX = touch.clientX - rect.left;
                dragOffsetY = touch.clientY - rect.top;

                aiResponse.classList.add('dragging');
                e.preventDefault();
            }
        });

        document.addEventListener('touchmove', function(e) {
            if (!isDragging || !currentDraggedElement || e.touches.length !== 1) return;

            const touch = e.touches[0];
            const newX = touch.clientX - dragOffsetX;
            const newY = touch.clientY - dragOffsetY;

            const maxX = window.innerWidth - currentDraggedElement.offsetWidth;
            const maxY = window.innerHeight - currentDraggedElement.offsetHeight;

            const boundedX = Math.max(0, Math.min(newX, maxX));
            const boundedY = Math.max(0, Math.min(newY, maxY));

            currentDraggedElement.style.left = boundedX + 'px';
            currentDraggedElement.style.top = boundedY + 'px';
            currentDraggedElement.style.transform = 'none';
            e.preventDefault();
        });

        document.addEventListener('touchend', function() {
            if (isDragging && currentDraggedElement) {
                isDragging = false;
                currentDraggedElement.classList.remove('dragging');
                currentDraggedElement = null;
            }
        });
    }

    // 高亮显示AI建议的拼图块
    function highlightSuggestedPiece(pieceId) {
        // 移除之前的高亮
        puzzlePieces.forEach(p => {
            p.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.15)';
            p.style.border = '2px solid #ffffff';
            p.style.animation = 'none';
        });

        // 高亮建议的块
        if (puzzlePieces[pieceId]) {
            puzzlePieces[pieceId].style.boxShadow = '0 0 0 3px #ffc107, 0 4px 15px rgba(0,0,0,0.3)';
            puzzlePieces[pieceId].style.border = '2px solid #ffc107';
            puzzlePieces[pieceId].style.animation = 'pulse 1.5s infinite';
        }
    }

    // 显示AI思考状态
    function showAIThinking() {
        aiThinking = true;
        
        // 确保对话框存在
        if (!aiResponseElement) {
            createAIAssistantButton();
        }
        
        aiResponseElement.style.display = 'block';
        aiResponseElement.querySelector('.ai-thinking').style.display = 'block';
        aiResponseElement.querySelector('.ai-result').innerHTML = '';
        
        // 初始化拖动功能
        setTimeout(() => {
            addDragFunctionality();
        }, 100);
        
        // 禁用AI按钮
        const aiBtn = document.getElementById('aiHintBtn');
        if (aiBtn) {
            aiBtn.disabled = true;
        }
    }
    
    // 隐藏AI思考状态
    function hideAIThinking() {
        aiThinking = false;
        
        // 启用AI按钮
        const aiBtn = document.getElementById('aiHintBtn');
        if (aiBtn) {
            aiBtn.disabled = false;
        }
    }

    window.addEventListener('load', function() {
        startBtn.disabled = true;
        startBtn.title = '图片正在加载中...';
        loadDefaultImage();
        testBackendConnection();
        createAIAssistantButton();
    });
})();
