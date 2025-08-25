// Game Variables
let gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    health: 130,
    maxHealth: 160,
    level: 1,
    enemiesKilled: 0,
    difficulty: 'normal',
    isMobile: false
};

let player = {
    x: 420,
    y: 295,
    width: 60,
    height: 60,
    speed: 7.3,
    element: null,
    angle: 0,
    invulnerable: 0
};

let gameElements = {
    bullets: [],
    enemies: [],
    powerups: [],
    particles: []
};

let gameSettings = {
    musicEnabled: true,
    sfxEnabled: true,
    spawnRate: 0.0089,
    powerupChance: 0.3
};

let weapons = {
    milk: { damage: 25, speed: 8, size: 12, cooldown: 200 },
    powerMilk: { damage: 40, speed: 10, size: 16, cooldown: 250 },
    megaMilk: { damage: 60, speed: 12, size: 20, cooldown: 400 }
};

let currentWeapon = 'milk';
let lastShotTime = 0;
let specialAttackCooldown = 0;

// Input handling
let keys = {};
let mousePos = { x: 450, y: 325 };

// Mobile input handling
let mobileInput = {
    movement: { x: 0, y: 0 },
    shooting: false,
    joystickActive: false,
    joystickCenter: { x: 0, y: 0 },
    joystickRadius: 50
};

// DOM Elements
let gameArea, playerElement, scoreElement, healthElement, levelElement, weaponElement;
let joystick, joystickKnob, shootBtn, specialBtn;

// Initialize Game
document.addEventListener('DOMContentLoaded', function() {
    detectMobile();
    initializeGame();
    setupEventListeners();
    setupMobileControls();
});

function detectMobile() {
    gameState.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        (window.innerWidth <= 768 && 'ontouchstart' in window);
    
    if (gameState.isMobile) {
        document.body.classList.add('mobile-device');
    }
}

function initializeGame() {
    // Get DOM elements
    gameArea = document.getElementById('gameArea');
    playerElement = document.getElementById('player');
    scoreElement = document.getElementById('score');
    healthElement = document.getElementById('health');
    levelElement = document.getElementById('level');
    weaponElement = document.getElementById('weaponType');
    
    // Mobile elements
    joystick = document.getElementById('joystick');
    joystickKnob = document.getElementById('joystickKnob');
    shootBtn = document.getElementById('shootBtn');
    specialBtn = document.getElementById('specialBtn');
    
    player.element = playerElement;
    updatePlayerPosition();
    updateUI();
    
    // Adjust game area size for mobile
    if (gameState.isMobile) {
        adjustGameAreaForMobile();
    }
}

function adjustGameAreaForMobile() {
    const rect = gameArea.getBoundingClientRect();
    player.x = rect.width / 2 - player.width / 2;
    player.y = rect.height / 2 - player.height / 2;
    mousePos.x = rect.width / 2;
    mousePos.y = rect.height / 2;
}

function setupEventListeners() {
    // Prevent text selection and context menu
    document.addEventListener('selectstart', e => e.preventDefault());
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dragstart', e => e.preventDefault());
    
    // Keyboard events
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Mouse events (desktop only)
    if (!gameState.isMobile) {
        gameArea.addEventListener('mousemove', handleMouseMove);
        gameArea.addEventListener('mousedown', handleMouseDown);
        gameArea.addEventListener('mouseup', handleMouseUp);
    }
    
    // Touch events for mobile
    gameArea.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameArea.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameArea.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Button events
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('menuBtn').addEventListener('click', showMainMenu);
    document.getElementById('musicToggle').addEventListener('click', toggleMusic);
    document.getElementById('sfxToggle').addEventListener('click', toggleSFX);
}

function setupMobileControls() {
    if (!gameState.isMobile) return;
    
    // Joystick setup
    if (joystick) {
        const joystickRect = joystick.getBoundingClientRect();
        mobileInput.joystickCenter.x = joystickRect.width / 2;
        mobileInput.joystickCenter.y = joystickRect.height / 2;
        mobileInput.joystickRadius = (joystickRect.width / 2) - 20;
        
        joystick.addEventListener('touchstart', handleJoystickStart, { passive: false });
        joystick.addEventListener('touchmove', handleJoystickMove, { passive: false });
        joystick.addEventListener('touchend', handleJoystickEnd, { passive: false });
    }
    
    // Shoot button setup
    if (shootBtn) {
        shootBtn.addEventListener('touchstart', handleShootStart, { passive: false });
        shootBtn.addEventListener('touchend', handleShootEnd, { passive: false });
    }
    
    // Special button setup
    if (specialBtn) {
        specialBtn.addEventListener('touchstart', handleSpecialAttack, { passive: false });
    }
}

// Mobile Touch Handlers
function handleJoystickStart(e) {
    e.preventDefault();
    mobileInput.joystickActive = true;
    handleJoystickMove(e);
}

function handleJoystickMove(e) {
    if (!mobileInput.joystickActive) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + mobileInput.joystickCenter.x;
    const centerY = rect.top + mobileInput.joystickCenter.y;
    
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance <= mobileInput.joystickRadius) {
        joystickKnob.style.left = (mobileInput.joystickCenter.x + deltaX - 20) + 'px';
        joystickKnob.style.top = (mobileInput.joystickCenter.y + deltaY - 20) + 'px';
        
        mobileInput.movement.x = deltaX / mobileInput.joystickRadius;
        mobileInput.movement.y = deltaY / mobileInput.joystickRadius;
    } else {
        const normalizedX = deltaX / distance;
        const normalizedY = deltaY / distance;
        
        joystickKnob.style.left = (mobileInput.joystickCenter.x + normalizedX * mobileInput.joystickRadius - 20) + 'px';
        joystickKnob.style.top = (mobileInput.joystickCenter.y + normalizedY * mobileInput.joystickRadius - 20) + 'px';
        
        mobileInput.movement.x = normalizedX;
        mobileInput.movement.y = normalizedY;
    }
}

function handleJoystickEnd(e) {
    e.preventDefault();
    mobileInput.joystickActive = false;
    mobileInput.movement.x = 0;
    mobileInput.movement.y = 0;
    
    // Reset joystick position
    joystickKnob.style.left = (mobileInput.joystickCenter.x - 20) + 'px';
    joystickKnob.style.top = (mobileInput.joystickCenter.y - 20) + 'px';
}

function handleShootStart(e) {
    e.preventDefault();
    mobileInput.shooting = true;
    shootBtn.classList.add('active');
}

function handleShootEnd(e) {
    e.preventDefault();
    mobileInput.shooting = false;
    shootBtn.classList.remove('active');
}

function handleSpecialAttack(e) {
    e.preventDefault();
    if (gameState.isRunning && !gameState.isPaused && specialAttackCooldown <= 0) {
        useSpecialAttack();
    }
}

// General Touch Handlers
function handleTouchStart(e) {
    if (!gameState.isMobile || !gameState.isRunning || gameState.isPaused) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = gameArea.getBoundingClientRect();
    mousePos.x = touch.clientX - rect.left;
    mousePos.y = touch.clientY - rect.top;
    
    updatePlayerRotation();
}

function handleTouchMove(e) {
    if (!gameState.isMobile || !gameState.isRunning || gameState.isPaused) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = gameArea.getBoundingClientRect();
    mousePos.x = touch.clientX - rect.left;
    mousePos.y = touch.clientY - rect.top;
    
    updatePlayerRotation();
}

function handleTouchEnd(e) {
    e.preventDefault();
}

// Desktop Input Handlers
function handleKeyDown(e) {
    e.preventDefault();
    keys[e.code.toLowerCase()] = true;
    
    if (e.code === 'Space') {
        if (gameState.isRunning && !gameState.isPaused && specialAttackCooldown <= 0) {
            useSpecialAttack();
        }
    }
    
    if (e.code === 'Escape') {
        if (gameState.isRunning && !gameState.isPaused) {
            pauseGame();
        } else if (gameState.isPaused) {
            resumeGame();
        }
    }
}

function handleKeyUp(e) {
    e.preventDefault();
    keys[e.code.toLowerCase()] = false;
}

function handleMouseMove(e) {
    e.preventDefault();
    const rect = gameArea.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
    
    if (gameState.isRunning && !gameState.isPaused) {
        updatePlayerRotation();
    }
}

function handleMouseDown(e) {
    e.preventDefault();
    if (gameState.isRunning && !gameState.isPaused && e.button === 0) {
        mobileInput.shooting = true;
    }
}

function handleMouseUp(e) {
    e.preventDefault();
    if (e.button === 0) {
        mobileInput.shooting = false;
    }
}

function updatePlayerRotation() {
    if (playerElement) {
        const dx = mousePos.x - (player.x + player.width / 2);
        const dy = mousePos.y - (player.y + player.height / 2);
        player.angle = Math.atan2(dy, dx);
        const degrees = (player.angle * 180 / Math.PI) + 90;
        playerElement.style.transform = `rotate(${degrees}deg)`;
    }
}

// Game State Management
function startGame() {
    gameState.difficulty = document.getElementById('difficulty').value;
    document.getElementById('startScreen').classList.add('hidden');
    
    if (playerElement) {
        playerElement.classList.remove('hidden'); // Show player when starting
    }
    
    resetGame();
    gameState.isRunning = true;
    gameState.isPaused = false;
    
    playSound('bgMusic', true);
    gameLoop();
}

function pauseGame() {
    if (!gameState.isRunning) return;
    gameState.isPaused = true;
    stopSound('bgMusic');
}

function resumeGame() {
    gameState.isPaused = false;
    if (gameSettings.musicEnabled) {
        playSound('bgMusic', true);
    }
}

function restartGame() {
    document.getElementById('gameOver').classList.add('hidden');
    startGame();
}

function showMainMenu() {
    gameState.isRunning = false;
    gameState.isPaused = false;
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');
    
    if (playerElement) {
        playerElement.classList.add('hidden'); // Hide player in main menu
    }
    
    clearGameElements();
    stopSound('bgMusic');
}

function gameOver() {
    gameState.isRunning = false;
    gameState.isPaused = false;
    
    stopSound('bgMusic');
    playSound('gameOverSound');
    
    document.getElementById('finalScore').textContent = gameState.score.toLocaleString();
    document.getElementById('enemiesKilled').textContent = gameState.enemiesKilled;
    document.getElementById('levelReached').textContent = gameState.level;
    
    document.getElementById('gameOver').classList.remove('hidden');
}

function resetGame() {
    gameState.score = 0;
    gameState.health = gameState.maxHealth;
    gameState.level = 1;
    gameState.enemiesKilled = 0;
    
    const rect = gameArea.getBoundingClientRect();
    player.x = rect.width / 2 - player.width / 2;
    player.y = rect.height / 2 - player.height / 2;
    player.invulnerable = 0;
    
    mousePos.x = rect.width / 2;
    mousePos.y = rect.height / 2;
    
    currentWeapon = 'milk';
    specialAttackCooldown = 0;
    
    clearGameElements();
    updateUI();
    updatePlayerPosition();
}

// Player Management
function updatePlayer() {
    if (player.invulnerable > 0) {
        player.invulnerable--;
        playerElement.style.opacity = Math.floor(player.invulnerable / 5) % 2 ? '0.5' : '1';
    } else {
        playerElement.style.opacity = '1';
    }
    
    // Movement
    let moveX = 0, moveY = 0;
    
    if (gameState.isMobile) {
        // Mobile movement from joystick
        moveX = mobileInput.movement.x * player.speed;
        moveY = mobileInput.movement.y * player.speed;
    } else {
        // Desktop movement from keyboard
        if (keys['keyw'] || keys['arrowup']) moveY = -player.speed;
        if (keys['keys'] || keys['arrowdown']) moveY = player.speed;
        if (keys['keya'] || keys['arrowleft']) moveX = -player.speed;
        if (keys['keyd'] || keys['arrowright']) moveX = player.speed;
        
        // Diagonal movement adjustment
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707;
            moveY *= 0.707;
        }
    }
    
    // Update position with boundaries
    const rect = gameArea.getBoundingClientRect();
    player.x = Math.max(0, Math.min(rect.width - player.width, player.x + moveX));
    player.y = Math.max(0, Math.min(rect.height - player.height, player.y + moveY));
    
    updatePlayerPosition();
    
    // Auto-shooting for mobile or manual shooting for desktop
    if (mobileInput.shooting) {
        shootBullet();
    }
}

function updatePlayerPosition() {
    if (playerElement) {
        playerElement.style.left = player.x + 'px';
        playerElement.style.top = player.y + 'px';
    }
}

// Shooting System
function shootBullet() {
    const currentTime = Date.now();
    const weapon = weapons[currentWeapon];
    
    if (currentTime - lastShotTime < weapon.cooldown) return;
    
    lastShotTime = currentTime;
    playSound('shootSound');
    
    const bullet = createBullet();
    gameElements.bullets.push(bullet);
    gameArea.appendChild(bullet.element);
}

function createBullet() {
    const weapon = weapons[currentWeapon];
    const bulletElement = document.createElement('div');
    bulletElement.className = 'bullet';
    bulletElement.style.width = weapon.size + 'px';
    bulletElement.style.height = weapon.size + 'px';
    
    const startX = player.x + player.width / 2 - weapon.size / 2;
    const startY = player.y + player.height / 2 - weapon.size / 2;
    
    const bullet = {
        x: startX,
        y: startY,
        width: weapon.size,
        height: weapon.size,
        vx: Math.cos(player.angle) * weapon.speed,
        vy: Math.sin(player.angle) * weapon.speed,
        damage: weapon.damage,
        element: bulletElement,
        size: weapon.size
    };
    
    bulletElement.style.left = bullet.x + 'px';
    bulletElement.style.top = bullet.y + 'px';
    
    return bullet;
}

function useSpecialAttack() {
    specialAttackCooldown = 300;
    playSound('specialAttackSound');
    
    // Update special button state
    if (specialBtn) {
        specialBtn.classList.add('disabled');
    }
    
    // Create circular wave of bullets
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const bulletElement = document.createElement('div');
        bulletElement.className = 'bullet';
        bulletElement.style.width = '20px';
        bulletElement.style.height = '20px';
        bulletElement.style.background = 'radial-gradient(circle, #FF69B4, #FF1493)';
        
        const startX = player.x + player.width / 2 - 10;
        const startY = player.y + player.height / 2 - 10;
        
        const bullet = {
            x: startX,
            y: startY,
            width: 20,
            height: 20,
            vx: Math.cos(angle) * 12,
            vy: Math.sin(angle) * 12,
            damage: 50,
            element: bulletElement,
            size: 20,
            special: true
        };
        
        bulletElement.style.left = bullet.x + 'px';
        bulletElement.style.top = bullet.y + 'px';
        
        gameElements.bullets.push(bullet);
        gameArea.appendChild(bulletElement);
    }
    
    // Screen shake effect
    gameArea.style.animation = 'none';
    setTimeout(() => {
        gameArea.style.animation = 'shake 0.5s ease-in-out';
    }, 10);
}

// Enemy Management
function spawnEnemy() {
    const enemyElement = document.createElement('div');
    enemyElement.className = 'enemy character';
    const healthBar = document.createElement('div');
    healthBar.className = 'health-bar';
    const healthFill = document.createElement('div');
    healthFill.className = 'health-fill';
    healthBar.appendChild(healthFill);
    enemyElement.appendChild(healthBar);
    
    const rect = gameArea.getBoundingClientRect();
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: // Top
            x = Math.random() * rect.width;
            y = -50;
            break;
        case 1: // Right
            x = rect.width + 50;
            y = Math.random() * rect.height;
            break;
        case 2: // Bottom
            x = Math.random() * rect.width;
            y = rect.height + 50;
            break;
        case 3: // Left
            x = -50;
            y = Math.random() * rect.height;
            break;
    }
    
    const enemy = createEnemyData(x, y, enemyElement);
    gameElements.enemies.push(enemy);
    gameArea.appendChild(enemyElement);
}

function createEnemyData(x, y, element) {
    const types = ['basic', 'fast', 'tank'];
    const typeWeights = [0.6, 0.3, 0.1];
    const type = getWeightedRandom(types, typeWeights);
    
    let enemyStats;
    switch(type) {
    case 'fast':
        enemyStats = { health: 20, speed: 3, damage: 10, points: 15, color: '#FF4500' }; // Health from 30 to 20, damage from 15 to 10
        break;
    case 'tank':
        enemyStats = { health: 60, speed: 1, damage: 20, points: 25, color: '#2F4F4F' }; // Health from 80 to 60, damage from 30 to 20
        break;
    default:
        enemyStats = { health: 35, speed: 1.5, damage: 15, points: 10, color: '#DC143C' }; // Health from 50 to 35, damage from 20 to 15
}
    
    const levelMultiplier = 1 + (gameState.level - 1) * 0.13;
    enemyStats.health *= levelMultiplier;
    enemyStats.speed *= (1 + (gameState.level - 1) * 0.1);
    enemyStats.points *= Math.floor(levelMultiplier);
    
    element.style.background = `radial-gradient(circle, ${enemyStats.color}, #8B0000)`;
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    
    return {
        x: x,
        y: y,
        width: 45,
        height: 45,
        health: enemyStats.health,
        maxHealth: enemyStats.health,
        speed: enemyStats.speed,
        damage: enemyStats.damage,
        points: enemyStats.points,
        type: type,
        element: element,
        lastDamageTime: 0
    };
}

function updateEnemies() {
    gameElements.enemies.forEach((enemy, index) => {
        if (enemy.health <= 0) {
            destroyEnemy(enemy, index);
            return;
        }
        
        if (enemy.lastDamageTime > 0) {
            enemy.lastDamageTime--;
            enemy.element.style.filter = enemy.lastDamageTime > 0 ? 'brightness(1.5)' : 'brightness(1)';
        }
        
        const dx = (player.x + player.width / 2) - (enemy.x + enemy.width / 2);
        const dy = (player.y + player.height / 2) - (enemy.y + enemy.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
            
            enemy.element.style.left = enemy.x + 'px';
            enemy.element.style.top = enemy.y + 'px';
        }
        
        if (player.invulnerable === 0 && checkCollision(player, enemy)) {
            damagePlayer(enemy.damage);
            createParticles(player.x + player.width / 2, player.y + player.height / 2, '#FF0000');
        }
    });
}

function destroyEnemy(enemy, index) {
    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    playSound('enemyDeathSound');
    
    gameState.score += enemy.points;
    gameState.enemiesKilled++;
    
    if (enemy.element && enemy.element.parentNode) {
        enemy.element.parentNode.removeChild(enemy.element);
    }
    gameElements.enemies.splice(index, 1);
    
    if (Math.random() < gameSettings.powerupChance) {
        spawnPowerup(enemy.x, enemy.y);
    }
    
    if (gameState.enemiesKilled % 10 === 0) {
        levelUp();
    }
    
    updateUI();
}

// Bullet Management
function updateBullets() {
    const rect = gameArea.getBoundingClientRect();
    
    for (let bulletIndex = gameElements.bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
        const bullet = gameElements.bullets[bulletIndex];
        
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        bullet.element.style.left = bullet.x + 'px';
        bullet.element.style.top = bullet.y + 'px';
        
        if (bullet.x < -50 || bullet.x > rect.width + 50 ||
            bullet.y < -50 || bullet.y > rect.height + 50) {
            removeBullet(bullet, bulletIndex);
            continue;
        }
        
        let bulletHitEnemy = false;
        for (let enemyIndex = 0; enemyIndex < gameElements.enemies.length; enemyIndex++) {
            const enemy = gameElements.enemies[enemyIndex];
            
            if (enemy.health <= 0) continue;
            
            if (checkCollision(bullet, enemy)) {
                damageEnemy(enemy, bullet.damage);
                createParticles(bullet.x, bullet.y, '#FFFF00');
                removeBullet(bullet, bulletIndex);
                playSound('enemyHitSound');
                bulletHitEnemy = true;
                break;
            }
        }
    }
}

function removeBullet(bullet, index) {
    if (bullet.element && bullet.element.parentNode) {
        bullet.element.parentNode.removeChild(bullet.element);
    }
    gameElements.bullets.splice(index, 1);
}

function damageEnemy(enemy, damage) {
    enemy.health -= damage;
    enemy.lastDamageTime = 10;
    
    if (enemy.health < enemy.maxHealth && enemy.health > 0) {
        let healthBar = enemy.element.querySelector('.health-bar');
        if (!healthBar) {
            healthBar = document.createElement('div');
            healthBar.className = 'health-bar';
            const healthFill = document.createElement('div');
            healthFill.className = 'health-fill';
            healthBar.appendChild(healthFill);
            enemy.element.appendChild(healthBar);
        }
        
        const healthFill = healthBar.querySelector('.health-fill');
        const healthPercent = (enemy.health / enemy.maxHealth) * 100;
        healthFill.style.width = Math.max(0, healthPercent) + '%';
        enemy.element.classList.add('damaged');
        
        setTimeout(() => {
            enemy.element.classList.remove('damaged');
        }, 300);
    }
}

// Powerup Management
function spawnPowerup(x, y) {
    const types = ['health', 'speed', 'weapon'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const powerupElement = document.createElement('div');
    powerupElement.className = `powerup ${type}`;
    powerupElement.style.left = x + 'px';
    powerupElement.style.top = y + 'px';
    
    const powerup = {
        x: x,
        y: y,
        width: 35,
        height: 35,
        type: type,
        element: powerupElement,
        lifespan: 600
    };
    
    gameElements.powerups.push(powerup);
    gameArea.appendChild(powerupElement);
}

function updatePowerups() {
    gameElements.powerups.forEach((powerup, index) => {
        powerup.lifespan--;
        
        if (powerup.lifespan <= 0) {
            removePowerup(powerup, index);
            return;
        }
        
        if (checkCollision(player, powerup)) {
            applyPowerup(powerup.type);
            playSound('powerupSound');
            createParticles(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, '#FFD700');
            removePowerup(powerup, index);
        }
    });
}

function applyPowerup(type) {
    switch(type) {
        case 'health':
            gameState.health = Math.min(gameState.health + 30, gameState.maxHealth);
            showPowerupIndicator('Health Boost!', 'assets/ui/health_powerup.png');
            break;
        case 'speed':
            player.speed = Math.min(player.speed + 1, 8);
            showPowerupIndicator('Speed Boost!', 'assets/ui/speed_powerup.png');
            setTimeout(() => { player.speed = Math.max(player.speed - 1, 5); }, 10000);
            break;
        case 'weapon':
            upgradeWeapon();
            break;
    }
    updateUI();
}

function upgradeWeapon() {
    if (currentWeapon === 'milk') {
        currentWeapon = 'powerMilk';
        showPowerupIndicator('Power Milk!', 'assets/ui/weapon_powerup.png');
        setTimeout(() => { 
            currentWeapon = 'milk'; 
            updateUI(); 
        }, 15000);
    } else if (currentWeapon === 'powerMilk') {
        currentWeapon = 'megaMilk';
        showPowerupIndicator('Mega Milk!', 'assets/ui/mega_weapon_powerup.png');
        setTimeout(() => { 
            currentWeapon = 'powerMilk';
            setTimeout(() => { 
                currentWeapon = 'milk'; 
                updateUI(); 
            }, 5000);
            updateUI(); 
        }, 10000);
    }
    updateUI();
}

function removePowerup(powerup, index) {
    if (powerup.element && powerup.element.parentNode) {
        powerup.element.parentNode.removeChild(powerup.element);
    }
    gameElements.powerups.splice(index, 1);
}

// Utility Functions
function checkCollision(obj1, obj2) {
    if (!obj1.width) obj1.width = obj1.size || 12;
    if (!obj1.height) obj1.height = obj1.size || 12;
    if (!obj2.width) obj2.width = 45;
    if (!obj2.height) obj2.height = 45;
    
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function damagePlayer(damage) {
    gameState.health -= damage;
    player.invulnerable = 60;
    playSound('hitSound');
    
    // Add vibration feedback for mobile
    if (gameState.isMobile && gameSettings.sfxEnabled && 'vibrate' in navigator) {
        navigator.vibrate(50);
    }
    
    if (gameState.health <= 0) {
        gameState.health = 0;
        gameOver();
    }
    
    updateUI();
}

function levelUp() {
    gameState.level++;
    playSound('levelUpSound');
    gameSettings.spawnRate += 0.005;
    showPowerupIndicator(`Level ${gameState.level}!`, 'assets/ui/level_up.png');
    updateUI();
}

function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = (x - 30) + 'px';
    explosion.style.top = (y - 30) + 'px';
    gameArea.appendChild(explosion);
    
    setTimeout(() => {
        if (explosion.parentNode) {
            explosion.parentNode.removeChild(explosion);
        }
    }, 400);
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.background = color;
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.width = '4px';
        particle.style.height = '4px';
        
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 30 + Math.random() * 20;
        particle.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--dy', Math.sin(angle) * distance + 'px');
        
        gameArea.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1000);
    }
}

function showPowerupIndicator(text, iconSrc) {
    const indicator = document.getElementById('powerUpIndicator');
    const textEl = document.getElementById('powerUpText');
    const iconEl = document.getElementById('powerUpIcon');
    
    if (textEl) textEl.textContent = text;
    if (iconEl) iconEl.src = iconSrc;
    
    indicator.classList.remove('hidden');
    setTimeout(() => {
        indicator.classList.add('hidden');
    }, 3000);
}

// Audio Management
function playSound(soundId, loop = false) {
    if ((soundId === 'bgMusic' && !gameSettings.musicEnabled) || 
        (soundId !== 'bgMusic' && !gameSettings.sfxEnabled)) {
        return;
    }
    
    const audio = document.getElementById(soundId);
    if (audio) {
        audio.loop = loop;
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}

function stopSound(soundId) {
    const audio = document.getElementById(soundId);
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}

function toggleMusic() {
    gameSettings.musicEnabled = !gameSettings.musicEnabled;
    const icon = document.getElementById('musicIcon');
    const btn = document.getElementById('musicToggle');
    
    if (gameSettings.musicEnabled) {
        icon.src = 'assets/ui/music_on.png';
        btn.classList.remove('muted');
        if (gameState.isRunning && !gameState.isPaused) {
            playSound('bgMusic', true);
        }
    } else {
        icon.src = 'assets/ui/music_off.png';
        btn.classList.add('muted');
        stopSound('bgMusic');
    }
}

function toggleSFX() {
    gameSettings.sfxEnabled = !gameSettings.sfxEnabled;
    const icon = document.getElementById('sfxIcon');
    const btn = document.getElementById('sfxToggle');
    
    if (gameSettings.sfxEnabled) {
        icon.src = 'assets/ui/sfx_on.png';
        btn.classList.remove('muted');
    } else {
        icon.src = 'assets/ui/sfx_off.png';
        btn.classList.add('muted');
    }
}

// UI Updates
function updateUI() {
    if (scoreElement) scoreElement.textContent = gameState.score.toLocaleString();
    if (healthElement) healthElement.textContent = gameState.health;
    if (levelElement) levelElement.textContent = gameState.level;
    if (weaponElement) {
        const weaponNames = {
            milk: 'Milk Blaster',
            powerMilk: 'Power Milk',
            megaMilk: 'Mega Milk'
        };
        weaponElement.textContent = weaponNames[currentWeapon];
    }
    
    const healthBar = document.getElementById('playerHealthBar');
    if (healthBar) {
        const healthPercent = (gameState.health / gameState.maxHealth) * 100;
        healthBar.style.width = Math.max(0, healthPercent) + '%';
    }
    
    // Update special button state
    if (specialBtn) {
        if (specialAttackCooldown <= 0) {
            specialBtn.classList.remove('disabled');
        } else {
            specialBtn.classList.add('disabled');
        }
    }
}

function clearGameElements() {
    [...gameElements.bullets, ...gameElements.enemies, ...gameElements.powerups].forEach(obj => {
        if (obj.element && obj.element.parentNode) {
            obj.element.parentNode.removeChild(obj.element);
        }
    });
    
    gameElements.bullets = [];
    gameElements.enemies = [];
    gameElements.powerups = [];
    gameElements.particles = [];
}

function getWeightedRandom(items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }
    return items[items.length - 1];
}

function getDifficultyMultiplier() {
    const multipliers = { easy: 0.7, normal: 1.0, hard: 1.3 };
    return multipliers[gameState.difficulty] || 1.0;
}

// Game Loop
function gameLoop() {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    updatePlayer();
    updateBullets();
    updateEnemies();
    updatePowerups();
    
    if (specialAttackCooldown > 0) {
        specialAttackCooldown--;
    }
    
    const difficultyMultiplier = getDifficultyMultiplier();
    const spawnChance = gameSettings.spawnRate * difficultyMultiplier * (1 + gameState.level * 0.1);
    
    if (Math.random() < spawnChance) {
        spawnEnemy();
    }
    
    updateUI();
    requestAnimationFrame(gameLoop);
}

// Resize handler for responsive design
window.addEventListener('resize', function() {
    if (gameState.isRunning) {
        adjustGameAreaForMobile();
        updatePlayerPosition();
    }
});

// Prevent zoom on double tap for mobile
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

let lastTouchEnd = 0;

// CSS Keyframes for animations
const style = document.createElement('style');
style.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}
`;
document.head.appendChild(style);