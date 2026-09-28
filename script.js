const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const restartButton = document.getElementById('restartButton');

const gridSize = 20;
let snake = [];
let food = {};
let dx = 1;
let dy = 0;
let score = 0;
let isGameOver = false;
let gameInterval;

setTimeout(() => {
    gameInterval = setInterval(gameLoop, 100);
}, 3000);
 
function generateFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

    ctx.fillStyle = 'lime';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });
}

function update() {
    if (isGameOver) {
        return;
    }

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = `Pontos: ${score}`;
        generateFood();
    } else {
        snake.pop();
    }

    if (checkCollision()) {
        endGame();
        return;
    }
}

function checkCollision() {
    const head = snake[0];

    const hitWall = head.x < 0 || head.x >= canvas.width / gridSize || head.y < 0 || head.y >= canvas.height / gridSize;

    const hitSelf = snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);

    return hitWall || hitSelf;
}

function endGame() {
    isGameOver = true;
    clearInterval(gameInterval);
    alert(`Fim de jogo! Sua pontuação: ${score}`);
}

function gameLoop() {
    update();
    draw();
}

function startGame() {
    snake = [{ x: 10, y: 10 }];
    dx = 1;
    dy = 0;
    score = 0;
    isGameOver = false;
    scoreElement.textContent = `Pontos: 0`;

    if (gameInterval) {
        clearInterval(gameInterval);
    }
    generateFood();
    gameInterval = setInterval(gameLoop, 100);
}

document.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
            if (dy === 0) { dx = 0; dy = -1; }
            break;
        case 'ArrowDown':
            if (dy === 0) { dx = 0; dy = 1; }
            break;
        case 'ArrowLeft':
            if (dx === 0) { dx = -1; dy = 0; }
            break;
        case 'ArrowRight':
            if (dx === 0) { dx = 1; dy = 0; }
            break;
    }
});

    let inicioX = 0;
let inicioY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();

    inicioX = e.touches[0].clientX;
    inicioY = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();

    const fimX = e.changedTouches[0].clientX;
    const fimY = e.changedTouches[0].clientY;

    const diferencaX = fimX - inicioX;
    const diferencaY = fimY - inicioY;

    if (Math.abs(diferencaX) < 30 && Math.abs(diferencaY) < 30) {
        return;
    }

    if (Math.abs(diferencaX) > Math.abs(diferencaY)) {

        if (diferencaX > 0) {
            if (dx === 0) {
                dx = 1;
                dy = 0;
            }
        } else {
            if (dx === 0) {
                dx = -1;
                dy = 0;
            }
        }

    } else {
        if (diferencaY > 0) {
            if (dy === 0) {
                dx = 0;
                dy = 1;
            }
        } else {
            if (dy === 0) {
                dx = 0;
                dy = -1;
            }
        }
    }
}, { passive: false });


restartButton.addEventListener('click', startGame);
startGame();