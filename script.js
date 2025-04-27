document.addEventListener('DOMContentLoaded', () => {
    // Navigation Menu
    const links = document.querySelectorAll('#menu a');
    const sections = document.querySelectorAll('#content > div');

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
        if (targetId !== 'game_page') {
            resetGame();
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

    // Add dailog event listener to the about button
    // Get references to the dialog and the About link
    const aboutDialog = document.getElementById('about_page');
    const aboutLink = document.getElementById('about_link');
    const closeDialogBtn = document.getElementById('closeDialogBtn');
    console.log(aboutDialog, aboutLink, closeDialogBtn);

    // Open the dialog when the About link is clicked
    aboutLink.addEventListener('click', function(event) {
        event.preventDefault();  // Prevent default action of the link
        console.log('About link clicked');
        aboutDialog.showModal();  // Open the dialog
    });

    // Close the dialog when the Close X button is clicked
    closeDialogBtn.addEventListener('click', function() {
        aboutDialog.close();  // Close the dialog
    });

    // Close the dialog when clicking outside (on the backdrop)
    aboutDialog.addEventListener('click', function(event) {
        if (event.target === aboutDialog) {
            aboutDialog.close();  // Close the dialog if click is on the backdrop
        }
    });

    // Handle Restart Button
document.getElementById('restartBtn').addEventListener('click', () => {
    showScreen('game_page');
    cancelAnimationFrame(gameFrameId);
    keys = {}; // stop stuck key presses
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    // document.getElementById('restartBtn').style.display = 'none';
    setupGame();
});

    // Quit game logic
    document.getElementById('quitGameBtn').addEventListener('click', () => {
        showScreen('welcome_page');
    });


});

let selectedShipImage = 'images/spaceship1.png'; // Default selection

document.querySelectorAll('.ship-choice').forEach(img => {
    img.addEventListener('click', () => {
        // Remove 'selected' class from all
        document.querySelectorAll('.ship-choice').forEach(img => img.classList.remove('selected'));
        // Add 'selected' class to clicked image
        img.classList.add('selected');
        // Save selected ship
        selectedShipImage = img.getAttribute('data-ship');
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

    // const color = document.getElementById('ship_color').value;

    // Save config
    gameConfig = {
        shootKey: key,
        timeLimit: time,
        // shipColor: color
    };

    // Apply config
    // player.color = color;
    player.shipImageSrc = selectedShipImage;


    showScreen('game_page');
    setupGame(); // start the game when config is done
});



// ------------------------------
// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let player = { x: 400, y: 500, width: 40, height: 40, color: gameConfig.shipColor };
let keys = {};
let scoreHistoryList = []; // globally store history for drawing
let gameFrameId = null;

// player variables
// Set random start position for the player within allowed movement area (40% of canvas)
let startX = Math.random()*(canvas.width-player.width);
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
let playerShipImg = new Image();
playerShipImg.src = 'images/spaceship1.png'; // default ship image


const goodBulletImg = new Image();
goodBulletImg.src = 'images/good_bullet.png';

const playerHitSound = new Audio('sounds/player_hit.mp3');


// enemy variables
let enemies = [];
let enemyRows = 4;
let enemyCols = 5;
let enemyWidth = 50;
let enemyHeight = 30;
let enemySpacing = 20;
let enemyDirection = 1; // 1 = right, -1 = left
let enemySpeed = 1;

const badShipImg = new Image();
badShipImg.src = 'images/badShip.png';

const badBulletImg = new Image();
badBulletImg.src = 'images/bad_bullet.png';

const hitEnemySound = new Audio('sounds/enemy_hit.mp3');

let enemyBullets = [];
let lastShotTime = 0;
let bulletCooldown = 1000; // milliseconds
let speedupFactor = 1;

// timer variables
let startTime = null;
let timeLeft = gameConfig.timeLimit * 60; // in seconds

//sounds
const winGameSound = new Audio('sounds/win_game.mp3'); 
const gameOverSound = new Audio('sounds/game_over.mp3');
const backgroundMusic = new Audio('sounds/background_music.mp3');
backgroundMusic.loop = true; 
backgroundMusic.volume = 0.5;

function resetGame() {
    // Stop background music if playing
    if (backgroundMusic && !backgroundMusic.paused) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    gameFrameId = null;

   // Reset player position
    player.x = Math.random() * (canvas.width - player.width);
    player.y = canvas.height - player.height ; // bottom of screen

    playerBullets = [];
    lives = 3;
    score = 0;
    speedBoosts = 0;
    maxSpeedBoosts = 4;
    boostInterval = 10000; // every 5 seconds
    lastBoostTime = Date.now();
    gameOver = false;

    // enemy variables
    enemies = [];
    enemyRows = 4;
    enemyCols = 5;
    enemyWidth = 50;
    enemyHeight = 30;
    enemySpacing = 20;
    enemyDirection = 1; // 1 = right, -1 = left
    enemySpeed = 1;

    enemyBullets = [];
    lastShotTime = 0;
    bulletCooldown = 1000; // milliseconds
    speedupFactor = 1;

    // timer variables
    startTime = null;
    timeLeft = gameConfig.timeLimit * 60; // in seconds
}
// >>>>>>> main


function initEnemies() {
    enemies = [];
    const baseWidth = 40; 
    const baseHeight = 25;
    const spacing = enemySpacing; 
    for (let row = 0; row < enemyRows; row++) {
        let scaleFactor = 1 + (row * 0.3); 
        let currentWidth = baseWidth * scaleFactor;
        let currentHeight = baseHeight * scaleFactor;
        
        const totalRowWidth = enemyCols * currentWidth + (enemyCols - 1) * spacing;
        const startX = (canvas.width - totalRowWidth) / 2;

        for (let col = 0; col < enemyCols; col++) {
            // enemies.push({
            //     x: startX + col * (currentWidth + spacing),
            //     y: 50 + row * (currentHeight + spacing),
            //     width: currentWidth,
            //     height: currentHeight,
            //     row: row 
            // });
            enemies.push({
                x: 100 + col * (enemyWidth + enemySpacing),
                y: 50 + row * (enemyHeight + enemySpacing),
                width: enemyWidth,
                height: enemyHeight,
                row: row,
                dx: 1, // מהירות בציר X
                dy: 0.2 // מהירות בציר Y - כדי שיזוזו קצת גם למטה/למעלה
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
        width: 20,
        height: 20,
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

// Function to handle game score history
function updateScoreHistory() {
    const storedUser = JSON.parse(localStorage.getItem('registeredUser'));
    if (!storedUser || !storedUser.username) return;

    const historyKey = `scoreHistory_${storedUser.username}`;
    let history = JSON.parse(localStorage.getItem(historyKey)) || [];

    const newEntry = { score: score, timestamp: new Date().toISOString() };
    history.push(newEntry);
    history.sort((a, b) => b.score - a.score); // high-to-low

    localStorage.setItem(historyKey, JSON.stringify(history));

    scoreHistoryList = history; // keep a copy to draw later
    scoreHistoryList.latestTimestamp = newEntry.timestamp;
}

function keydownHandler(e) {
    keys[e.key] = true;
}
function keyupHandler(e) {
    keys[e.key] = false;
}


function setupGame() {
    // Reset game flags and state
    resetGame();
    startTime = Date.now();

    backgroundMusic.play();
    // playerShipImg = new Image();
    playerShipImg.src = player.shipImageSrc || 'images/spaceship1.png'; // Default fallback
    // Keyboard input
    document.addEventListener('keydown', (e) => keys[e.key] = true);
    document.addEventListener('keyup', (e) => keys[e.key] = false);
    
    initEnemies();

    player.justShot = false;

    // Re-initialize player position
    player.x = Math.random() * (canvas.width - player.width);
    player.y = canvas.height - player.height;

    // Prevent duplicate listeners
    document.removeEventListener('keydown', keydownHandler);
    document.removeEventListener('keyup', keyupHandler);
    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keyup', keyupHandler);

    gameOver = false;
    gameLoop(); // Start the game
}

function update() {
    if (keys[gameConfig.shootKey] && !player.justShot) {
        console.log("Pew! Pew!");
        // add shoot logic later
        playerBullets.push({
            x: player.x + player.width / 2 - 3,
            y: player.y,
            width: 20,
            height: 20,
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
            playerHitSound.play();
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
                hitEnemySound.play(); 
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
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Show lives
    ctx.fillStyle = "white";
    ctx.font = "20px Rajdhani";
    // ctx.bold = true;
    ctx.fillText(`Lives: ${lives}`, 20, 20);

    // Show time left
    ctx.fillText(`Time: ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`, canvas.width - 100, 20);
    
    // // Show score
    ctx.fillText(`Score: ${score}`, 20, 40);

    // Draw the player spaceship (rectangle for now)
    // const playerShipImg = new Image();
    // playerShipImg.src = player.shipImageSrc || 'images/spaceship1.png'; // Default fallback

    ctx.drawImage(playerShipImg, player.x, player.y, player.width, player.height);

    for (let enemy of enemies) {
        ctx.drawImage(badShipImg, enemy.x, enemy.y, enemy.width, enemy.height);
    }
    
    // Draw player bullets
    for (let bullet of playerBullets) {
        ctx.drawImage(goodBulletImg, bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Draw enemy bullets
    for (let bullet of enemyBullets) {
        ctx.drawImage(badBulletImg, bullet.x, bullet.y, bullet.width, bullet.height);
    }
    

    // Win/Lose conditionsz
    if (!gameOver) {
        // if we reach game over condition:
        if (lives <= 0 || enemies.length === 0 || timeLeft <= 0) {
            // stop background music
            if (backgroundMusic && !backgroundMusic.paused) {
                backgroundMusic.pause();
                backgroundMusic.currentTime = 0;
            }
            // clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            gameOver = true;
            updateScoreHistory();
        }

        if (lives <= 0) {
            gameOverSound.play();
            ctx.fillStyle = "red";
            ctx.font = "bold 60px Orbitron";
            ctx.textAlign = "center";
            ctx.fillText("You Lost!", canvas.width / 2, 50);
            document.getElementById('restartBtn').style.display = 'inline-block';
        } 
        
        else if (enemies.length === 0) {
            winGameSound.play();
            ctx.fillStyle = "green";
            ctx.font = "bold 60px Orbitron";
            ctx.textAlign = "center";
            ctx.fillText("Champion!", canvas.width / 2, 50);
            document.getElementById('restartBtn').style.display = 'inline-block';
        }
        else{
            if (timeLeft <= 0) {
                if (score < 100) {
                    gameOverSound.play();
                    ctx.fillStyle = "orange";
                    ctx.font = "bold 30px Orbitron";
                    ctx.textAlign = "center";
                    ctx.fillText(`You can do better! score: ${score}`, canvas.width / 2, 50);
                }
                else{
                    winGameSound.play();
                    ctx.fillStyle = "green";
                    ctx.font = "bold 30px Orbitron";
                    ctx.textAlign = "center";
                    ctx.fillText(`Winner!`, canvas.width / 2, 50);
                }
            }
        }
        // Draw score history after message
        if (gameOver) {
            // === Score History Table ===
            if (scoreHistoryList.length > 0) {
                const listX = canvas.width / 2;
                const listTop = 80; 
                const lineHeight = 24;

                ctx.textAlign = "center";
                ctx.fillStyle = "black";
                ctx.font = "20px monospace";
                ctx.fillText("Top Scores:", listX, listTop);

                ctx.font = "16px monospace";
                scoreHistoryList.slice(0, 25).forEach((entry, i) => {
                    let isLatest = entry.timestamp === scoreHistoryList.latestTimestamp;
                    ctx.fillStyle = isLatest ? "gold" : "black";
                    ctx.fillText(`#${i + 1}: ${entry.score}`, listX, listTop + 30 + i * lineHeight);
                });
            }
        }
    }
    
}


function gameLoop() {
    update();
    draw();
    if (!gameOver) {
        gameFrameId = requestAnimationFrame(gameLoop);
    }
}


