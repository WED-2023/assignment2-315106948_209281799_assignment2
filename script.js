document.addEventListener('DOMContentLoaded', () => {
    // Navigation Menu
    const links = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('content > div');

    // Function to clear active class from all sections and show the target section
    // based on the targetId passed
    function showScreen(targetId) {
        sections.forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }
    // Add click event listeners to all links
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            showScreen(targetId);
        });
    });

    // Make showScreen globally accessible for inline buttons
    window.showScreen = showScreen;

    // Show welcome page by default
    showScreen('welcome_page');

    // Handle Register Form Submission
    document.getElementById('register_form').addEventListener('submit', function (e) {
        e.preventDefault();

        const user = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            firstname: document.getElementById('firstname').value,
            surname: document.getElementById('surname').value,
            email: document.getElementById('email').value,
            birthdate: document.getElementById('birthdate').value
        };

        // Save to localStorage
        localStorage.setItem('registeredUser', JSON.stringify(user));
        // alert('Registration successful! Please log in.');
        showScreen('login_page');
    });

    // Handle Login Form Submission
    document.getElementById('login_form').addEventListener('submit', function (e) {
        e.preventDefault();

        const storedUser = JSON.parse(localStorage.getItem('registeredUser'));

        const username = this.username.value;
        const password = this.password.value;

        if (storedUser && storedUser.username === username && storedUser.password === password) {
            alert(`Welcome back, ${storedUser.firstname}!`);
            showScreen('config_page');
        } else {
            // check if it's a guest login
            const guestUsername = 'p';
            const guestPassword = 'testuser';
            if (username === guestUsername && password === guestPassword) {
                // alert('Welcome back, Guest!');
                showScreen('config_page');
                return;
            }
            else{
                alert('Invalid username or password.');
            }
        }
    });

});

// ------------------------------ Game logic ------------------------------
// Default config
let gameConfig = {
    shootKey: ' ', // space
    timeLimit: 2, // in minutes
    shipColor: 'lime'
};

document.getElementById('config_form').addEventListener('submit', function (e) {
    e.preventDefault();

    let key = document.getElementById('shoot_key').value.trim().toLowerCase();
    // add logic to validate key input: only letters or "space" allowed
    
    if (key.length === 1){
        const isLetter = /^[a-zA-Z]$/.test(key);
        if (!isLetter) {
            alert('Invalid key: selected key is not a letter. Please enter a single letter or "space".');
            return;
        }
    }
    else if (key !== 'space') {
        alert('Invalid key: selected key is not a letter. Please enter a single letter or "space".');
        return;
    }

    // Good to go
    key = (key === 'space') ? ' ' : key.charAt(0); // sanitize input
    
    const time = parseInt(document.getElementById('game_time').value);
    if (time < 2) {
        alert('Game time must be at least 2 minutes.');
        return;
    }

    const color = document.getElementById('ship_color').value;

    // Save config
    gameConfig = {
        shootKey: key,
        timeLimit: time,
        shipColor: color
    };

    // Apply config
    player.color = color;

    showScreen('game_page');
    setupGame(); // start the game when config is done
});

// ------------------------------
// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let player = { x: 400, y: 500, width: 40, height: 40, color: gameConfig.shipColor };
let keys = {};

// player variables
// Set random start position for the player within allowed movement area (40% of canvas)
const startX = Math.random()*(canvas.width-player.width);
player.x = startX;
player.y = canvas.height - player.height ; // bottom of screen

let playerBullets = [];
let lives = 3;
let score = 0;
let speedBoosts = 0;
let maxSpeedBoosts = 4;
let boostInterval = 10000; // every 5 seconds
let lastBoostTime = Date.now();
let gameOver = false;

// enemy variables
let enemies = [];
let enemyRows = 4;
let enemyCols = 5;
let enemyWidth = 50;
let enemyHeight = 30;
let enemySpacing = 20;
let enemyDirection = 1; // 1 = right, -1 = left
let enemySpeed = 1;

let enemyBullets = [];
let lastShotTime = 0;
let bulletCooldown = 1000; // milliseconds
let speedupFactor = 1;

// timer variables
let startTime = null;
let timeLeft = gameConfig.timeLimit * 60; // in seconds

function initEnemies() {
    enemies = [];
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            enemies.push({
                x: 100 + col * (enemyWidth + enemySpacing),
                y: 50 + row * (enemyHeight + enemySpacing),
                width: enemyWidth,
                height: enemyHeight,
                row: row // <== track row number (0 to 3)
            });
        }
    }
}

// Function to handle enemy shooting
function shootFromRandomEnemy() {
    // Only one bullet allowed unless the last one passed 3/4 down the canvas
    if (enemyBullets.length > 0) {
        const lastBullet = enemyBullets[enemyBullets.length - 1];
        if (lastBullet.y < canvas.height * 0.75) {
            return;
        }
    }

    const aliveEnemies = enemies.filter(e => e !== null); // all enemies still alive
    if (aliveEnemies.length === 0) return;

    const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    enemyBullets.push({
        x: randomEnemy.x + randomEnemy.width / 2 - 3,
        y: randomEnemy.y + randomEnemy.height,
        width: 6,
        height: 15,
        speed: 4
    });
}

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function setupGame() {
    startTime = Date.now();

    // Keyboard input
    document.addEventListener('keydown', (e) => keys[e.key] = true);
    document.addEventListener('keyup', (e) => keys[e.key] = false);
    initEnemies();

    gameLoop(); // Start the game
}

function update() {
    if (keys[gameConfig.shootKey] && !player.justShot) {
        console.log("Pew! Pew!");
        // add shoot logic later
        playerBullets.push({
            x: player.x + player.width / 2 - 3,
            y: player.y,
            width: 6,
            height: 15,
            speed: -4
        });
        player.justShot = true;
        setTimeout(() => player.justShot = false, 200);


    }
    const moveSpeed = 5;
    const allowedLeft = 0;
    const allowedRight = canvas.width - player.width;
    const allowedTop = 0.6*canvas.height; // 40% of the screen
    const allowedBottom = canvas.height - player.height;

    if (keys["ArrowLeft"] && player.x > allowedLeft) {
        player.x -= moveSpeed;
    }
    if (keys["ArrowRight"] && player.x < allowedRight) {
        player.x += moveSpeed;
    }
    if (keys["ArrowUp"] && player.y > allowedTop) {
        player.y -= moveSpeed;
    }
    if (keys["ArrowDown"] && player.y < allowedBottom) {
        player.y += moveSpeed;
    }

    // ---- Move enemies ----:
    let shouldReverse = false;

    for (let enemy of enemies) {
        if (enemy.x + enemy.width >= canvas.width || enemy.x <= 0) {
            shouldReverse = true;
            break;
        }
    }

    // If we need to reverse, do it before moving
    if (shouldReverse) {
        enemyDirection *= -1;
    }

    // Now move all enemies in the same direction
    for (let enemy of enemies) {
        enemy.x += enemySpeed * enemyDirection;
    }

    // ---- Enemy shooting ----:
    // Try to shoot every 1s
    const now = Date.now();
    if (now - lastShotTime > bulletCooldown) {
        shootFromRandomEnemy();
        lastShotTime = now;
    }

    // Move enemy bullets
    for (let bullet of enemyBullets) {
        bullet.y += bullet.speed;
    }

    // Remove enemy bullets that are off screen
    enemyBullets = enemyBullets.filter(bullet => bullet.y <= canvas.height);

    // Check for collisions between player and enemy bullets
    for (let bullet of enemyBullets) {
        if (checkCollision(bullet, player)) {
            console.log("Player hit!");
            // damage logic
            lives--;
            // Reset player position
            player.x = Math.random()*(canvas.width-player.width);
            player.y = canvas.height - player.height; // bottom of screen
            // Remove the bullet
            enemyBullets = enemyBullets.filter(b => b !== bullet);
            break; // Exit loop after collision
        }
    }

    // Boost enemy speed and enemy bullets speed logic
    const currentTime = Date.now();
    if (currentTime - lastBoostTime >= boostInterval && speedBoosts < maxSpeedBoosts) {
        enemySpeed += speedupFactor; // or 1 for more intense change
        for (let bullet of enemyBullets) {
            bullet.speed += speedupFactor; // increase existing bullets
        }
        speedBoosts++;
        lastBoostTime = currentTime;
        console.log("Speed boosted!", speedBoosts);
    }


    // Move player bullets
    for (let bullet of playerBullets) {
        bullet.y += bullet.speed;
    }

    // Check for collisions between player bullets and enemies
    for (let bullet of playerBullets) {
        for (let enemy of enemies) {
            if (checkCollision(bullet, enemy)) {
                console.log("Enemy hit!");
                // Calculate score by row
                const row = enemy.row;
                let points = 0;
                if (row === 3) points = 5;
                else if (row === 2) points = 10;
                else if (row === 1) points = 15;
                else if (row === 0) points = 20;
                score += points;
                // Remove the bullet and enemy
                playerBullets = playerBullets.filter(b => b !== bullet);
                enemies = enemies.filter(e => e !== enemy);
                break; // Exit loop after collision
            }
        }
    }
    // Remove player bullets that go off-screen
    playerBullets = playerBullets.filter(bullet => bullet.y + bullet.height > 0);
    // Timer countdown
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    timeLeft = Math.max(0, gameConfig.timeLimit * 60 - elapsed);

    if (timeLeft === 0 && !gameOver) {
        gameOver = true;
        console.log("Time's up!");
    }

}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Show lives
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Lives: ${lives}`, 10, 20);

    // Show time left
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Time: ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`, canvas.width - 120, 20);

    // Show score
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 10, 45);

    // Draw the player spaceship (rectangle for now)
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = "red";
    for (let enemy of enemies) {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }

    // Draw enemy bullets
    ctx.fillStyle = "yellow";
    for (let bullet of enemyBullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
    // Draw player bullets
    ctx.fillStyle = "blue";
    for (let bullet of playerBullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Win/Lose conditions
    // Win condition
    if (enemies.length === 0) {
        ctx.fillStyle = "green";
        ctx.font = "40px Arial";
        ctx.fillText("YOU WIN!", canvas.width / 2 - 100, canvas.height / 2);
        gameOver = true;
    }
    // Game over condition
    if (lives <= 0) {
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2 - 120, canvas.height / 2);
        gameOver = true;
    }
}

function gameLoop() {
    update();
    draw();
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// ------------------------------


