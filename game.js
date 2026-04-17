const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

canvas.width = 600;
canvas.height = 800;

// Game State
let score = 0;
let lives = 3;
let gameOver = false;
let gameLoop;
let lastTime = 0;
let particles = [];
let stars = [];

// Initialize stars
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 2 + 0.5,
        size: Math.random() * 2
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1.0,
            color
        });
    }
}

// Player Ship
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    speed: 5,
    color: '#00f',
    bullets: []
};

// Enemies
let enemies = [];
const enemyRows = 4;
const enemyCols = 8;
const enemyWidth = 40;
const enemyHeight = 30;
const enemyPadding = 15;
const enemyOffsetTop = 60;
const enemyOffsetLeft = 50;

// Enemy bullets
let enemyBullets = [];

// Input handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && !gameOver) {
        shoot();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function initEnemies() {
    enemies = [];
    for (let r = 0; r < enemyRows; r++) {
        for (let c = 0; c < enemyCols; c++) {
            enemies.push({
                x: c * (enemyWidth + enemyPadding) + enemyOffsetLeft,
                y: r * (enemyHeight + enemyPadding) + enemyOffsetTop,
                width: enemyWidth,
                height: enemyHeight,
                color: r === 0 ? '#f00' : (r === 1 ? '#ff0' : '#0f0'),
                alive: true,
                direction: 1,
                speed: 1 + (score / 1000)
            });
        }
    }
}

function shoot() {
    if (player.bullets.length < 3) {
        player.bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 15,
            speed: 7,
            color: '#fff'
        });
    }
}

function update(deltaTime) {
    if (gameOver) return;

    // Move stars
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });

    // Move particles
    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    });

    // Move player
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

    // Update player bullets
    player.bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) {
            player.bullets.splice(index, 1);
        }
    });

    // Update enemy bullets
    enemyBullets.forEach((bullet, index) => {
        bullet.y += bullet.speed;
        if (bullet.y > canvas.height) {
            enemyBullets.splice(index, 1);
        }

        // Collision with player
        if (
            bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y
        ) {
            enemyBullets.splice(index, 1);
            createParticles(player.x + player.width/2, player.y + player.height/2, '#f00');
            lives--;
            livesElement.textContent = `Vidas: ${lives}`;
            if (lives <= 0) {
                endGame();
            }
        }
    });

    // Update enemies
    let moveDown = false;
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        enemy.x += enemy.speed * enemy.direction;

        if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
            moveDown = true;
        }
    });

    if (moveDown) {
        enemies.forEach(enemy => {
            enemy.direction *= -1;
            enemy.y += 20;
            if (enemy.y + enemy.height >= player.y) {
                endGame();
            }
        });
    }

    // Enemy shooting
    if (Math.random() < 0.02) {
        const aliveEnemies = enemies.filter(e => e.alive);
        if (aliveEnemies.length > 0) {
            const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            enemyBullets.push({
                x: randomEnemy.x + randomEnemy.width / 2 - 2,
                y: randomEnemy.y + randomEnemy.height,
                width: 4,
                height: 10,
                speed: 4,
                color: '#f0f'
            });
        }
    }

    // Check collisions
    player.bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (enemy.alive &&
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
                enemy.alive = false;
                player.bullets.splice(bIndex, 1);
                score += 100;
                scoreElement.textContent = `Puntuación: ${score}`;

                if (enemies.every(e => !e.alive)) {
                    initEnemies();
                }
            }
        });
    });
}

function drawPlayer() {
    ctx.fillStyle = '#fff';
    // Main body
    ctx.fillRect(player.x + 20, player.y + 10, 10, 30);
    // Wings
    ctx.fillStyle = '#00f';
    ctx.fillRect(player.x + 5, player.y + 25, 15, 15);
    ctx.fillRect(player.x + 30, player.y + 25, 15, 15);
    // Nose
    ctx.fillStyle = '#f00';
    ctx.fillRect(player.x + 22, player.y, 6, 15);
}

function drawEnemy(enemy) {
    ctx.fillStyle = enemy.color;
    // Main body
    ctx.fillRect(enemy.x + 5, enemy.y + 5, 30, 20);
    // Antennae or feet
    ctx.fillRect(enemy.x + 10, enemy.y, 5, 5);
    ctx.fillRect(enemy.x + 25, enemy.y, 5, 5);
    ctx.fillRect(enemy.x + 5, enemy.y + 25, 5, 5);
    ctx.fillRect(enemy.x + 30, enemy.y + 25, 5, 5);
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(enemy.x + 10, enemy.y + 10, 5, 5);
    ctx.fillRect(enemy.x + 25, enemy.y + 10, 5, 5);
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Draw particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1.0;

    // Draw player
    drawPlayer();

    // Draw player bullets
    player.bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw enemies
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        drawEnemy(enemy);
    });

    // Draw enemy bullets
    enemyBullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function gameLoopStep(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    if (!gameOver) {
        requestAnimationFrame(gameLoopStep);
    }
}

function endGame() {
    gameOver = true;
    gameOverElement.classList.remove('hidden');
    finalScoreElement.textContent = score;
}

function restartGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    scoreElement.textContent = `Puntuación: ${score}`;
    livesElement.textContent = `Vidas: ${lives}`;
    gameOverElement.classList.add('hidden');
    player.x = canvas.width / 2 - 25;
    player.bullets = [];
    enemyBullets = [];
    initEnemies();
    lastTime = performance.now();
    requestAnimationFrame(gameLoopStep);
}

restartBtn.addEventListener('click', restartGame);

// Start game
initEnemies();
requestAnimationFrame(gameLoopStep);
