document.addEventListener('DOMContentLoaded', () => {
    // clear the local storage:
    localStorage.clear();
    // Ensure guest user exists
    function initializeGuestUser() {
        const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
        const guestExists = users.some(u => u.username === 'p' && u.password === 'testuser');
        if (!guestExists) {
            users.push({
                username: 'p',
                password: 'testuser',
                firstname: 'Guest',
                surname: '',
                email: 'guest@example.com',
                birthdate: ''
            });
            localStorage.setItem('registeredUsers', JSON.stringify(users));
        }
    }
    initializeGuestUser();

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

    const form = document.getElementById('register_form');
    const password = document.getElementById('register_password');
    const confirmPassword = document.getElementById('confirm_password');
    
    // Clear previous custom messages
    password.setCustomValidity('');
    confirmPassword.setCustomValidity('');

    function validatePasswordMatch() {
        if (password.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match.');
        } else {
            confirmPassword.setCustomValidity('');
        }
    }
    password.addEventListener('input', validatePasswordMatch);
    confirmPassword.addEventListener('input', validatePasswordMatch);

    // Handle Register Form Submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        
        validatePasswordMatch()
        const newUser = {
            username: document.getElementById('register_username').value,
            password: document.getElementById('register_password').value,
            confirmPassword: document.getElementById('confirm_password').value,
            firstname: document.getElementById('firstname').value,
            surname: document.getElementById('surname').value,
            email: document.getElementById('email').value,
            birthdate: document.getElementById('birthdate').value
        };     
        
        // built-in validity checks
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Check password match
        if (password.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match.');
            confirmPassword.reportValidity(); // shows the bubble
            return;
        }
        // // Check if username/email already exist
        // const storedUser = JSON.parse(localStorage.getItem('registeredUser'));
        // if (storedUser && (storedUser.username === user.username || storedUser.email === user.email)) {
        //     document.getElementById('username').setCustomValidity('Username or email already exists.');
        //     document.getElementById('username').reportValidity();
        //     return;
        // }

        // // Save to localStorage
        // localStorage.setItem('registeredUser', JSON.stringify(user));

        const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];

        if (users.some(u => u.username === newUser.username || u.email === newUser.email)) {
            alert('Username or email already exists.');
            return;
        }

        users.push(newUser);
        localStorage.setItem('registeredUsers', JSON.stringify(users));

        alert('Registration successful! Please log in.');
        showScreen('login_page');
    });

    // Handle Login Form Submission
    document.getElementById('login_form').addEventListener('submit', function (e) {
        e.preventDefault();

        // const storedUser = JSON.parse(localStorage.getItem('registeredUser'));

        const username = this.username.value;
        const password = this.password.value;

        const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
        const foundUser = users.find(u => u.username === username && u.password === password);

        // if (storedUser && storedUser.username === username && storedUser.password === password) {
        //     alert(`Welcome back, ${storedUser.firstname}!`);
        //     showScreen('config_page');
        // } else {
        //     // check if it's a guest login
        //     const guestUsername = 'p';
        //     const guestPassword = 'testuser';
        //     if (username === guestUsername && password === guestPassword) {
        //         alert('Welcome back, Guest!');
        //         showScreen('config_page');
        //         return;
        //     }
        //     else{
        //         alert('Invalid username or password.');
        //     }
        // }

        if (foundUser) {
            localStorage.setItem('lastLoggedInUser', JSON.stringify(foundUser));
            alert(`Welcome back, ${foundUser.firstname || foundUser.username}!`);
            showScreen('config_page');
        } else {
            alert('Invalid username or password.');
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

const badShipBlueImg = new Image();
badShipBlueImg.src = 'images/badshipblue.png';

const badShipRedImg = new Image();
badShipRedImg.src = 'images/badshipred.png';

const badShipGreenImg = new Image();
badShipGreenImg.src = 'images/badshipgreen.png';

const badShipBlackImg = new Image();
badShipBlackImg.src = 'images/badshipblack.png';

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


function initEnemies() {
    enemies = [];
    const baseWidth = 50; //40; 
    const baseHeight = 35; //25;
    const spacing = enemySpacing; 
    for (let row = 0; row < enemyRows; row++) {
        let scaleFactor = 1 // + (row * 0.1); 
        let currentWidth = baseWidth * scaleFactor;
        let currentHeight = baseHeight * scaleFactor;
        
        const totalRowWidth = enemyCols * currentWidth + (enemyCols - 1) * spacing;
        const startX = (canvas.width - totalRowWidth) / 2;

        for (let col = 0; col < enemyCols; col++) {
            enemies.push({
                x: startX + col * (currentWidth + spacing),
                y: 50 + row * (currentHeight + spacing),
                width: currentWidth,
                height: currentHeight,
                row: row ,
                dx: enemySpeed * enemyDirection,
                dy: 0.3
            });
            // enemies.push({
            //     x: 100 + col * (enemyWidth + enemySpacing),
            //     y: 50 + row * (enemyHeight + enemySpacing),
            //     width: enemyWidth,
            //     height: enemyHeight,
            //     row: row,
            //     dx: 1, // מהירות בציר X
            //     dy: 0.2 // מהירות בציר Y - כדי שיזוזו קצת גם למטה/למעלה
            // });
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
        speed: 4,
        directionX: Math.random() < 0.5 ? 1 : -1
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
    // const storedUser = JSON.parse(localStorage.getItem('registeredUser'));
    // if (!storedUser || !storedUser.username) return;

    // const historyKey = `scoreHistory_${storedUser.username}`;
    // let history = JSON.parse(localStorage.getItem(historyKey)) || [];

    const currentUser = JSON.parse(localStorage.getItem('lastLoggedInUser'));
    if (!currentUser || !currentUser.username) return;

    const historyKey = `scoreHistory_${currentUser.username}`;
    let history = JSON.parse(localStorage.getItem(historyKey)) || [];

    const newEntry = { score: score, timestamp: new Date().toISOString() };
    history.push(newEntry);
    // Sort history by score (high to low)
    // history.sort((a, b) => b.score - a.score); // high-to-low

    // sort by score and timestamp
    history.sort((a, b) => {
        if (b.score === a.score) {
            return new Date(b.timestamp) - new Date(a.timestamp); // sort by timestamp if scores are equal
        }
        return b.score - a.score; // high-to-low
    });

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

    // for (let enemy of enemies) {
    //     if (enemy.x + enemy.width >= canvas.width || enemy.x <= 0) {
    //         shouldReverse = true;
    //         break;
    //     }
    // }

    for (let enemy of enemies) {
        if (enemy.x + enemy.width >= canvas.width || enemy.x <= 0) {
            enemy.dx *= -1; // reverse horizontal direction
        }
        if (enemy.y <= 0 || enemy.y + enemy.height >= canvas.height * 0.5) {
            enemy.dy *= -1; // reverse vertical direction
        }
    }
    

    // If we need to reverse, do it before moving
    if (shouldReverse) {
        enemyDirection *= -1;
    }

    // // Now move all enemies in the same direction
    // for (let enemy of enemies) {
    //     enemy.x += enemySpeed * enemyDirection;
    // }
    for (let enemy of enemies) {
        enemy.x += enemy.dx;
        enemy.y += enemy.dy;
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
        // only move on the Y axis
        // bullet.y += bullet.speed;

        // add move with random diagonal:        
        // Set a random speed for the horizontal direction 
        bullet.x += bullet.speed * bullet.directionX * 0.5;  // Move in x-direction (left or right)

        // Move vertically downwards 
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

    if ((timeLeft <= 0 || lives === 0 || enemies.length === 0) && !gameOver) {
        gameOver = true;
        console.log("Game Over triggered!");
        
        // Stop background music
        if (backgroundMusic && !backgroundMusic.paused) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        }

        updateScoreHistory(); // Save score immediately
    }

}


function drawTopScores() {
    const currentUser = JSON.parse(localStorage.getItem('lastLoggedInUser'));
    if (!currentUser || !currentUser.username) return;

    const history = JSON.parse(localStorage.getItem(`scoreHistory_${currentUser.username}`)) || [];

    // if (scoreHistoryList.length > 0) {
    if (history.length > 0) {

        const listX = canvas.width / 2;
        const listTop = 130;
        const lineHeight = 26;

        ctx.fillStyle = "#333";
        ctx.font = "bold 24px 'Segoe UI', 'Roboto', sans-serif";
        ctx.fillText("🏆 Top Scores 🏆", listX, listTop);

        ctx.font = "16px 'Segoe UI', 'Roboto', sans-serif";

        // scoreHistoryList.slice(0, 10).forEach((entry, i) => {
        history.slice(0, 10).forEach((entry, i) => {
            const date = new Date(entry.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isLatest = entry.timestamp === scoreHistoryList.latestTimestamp;

            ctx.fillStyle = isLatest ? "gold" : "white";
            ctx.fillText(`#${i + 1}: ${entry.score} - ${formattedDate}`, listX, listTop + 40 + i * lineHeight);
        });
    }
}

const backgroundImg = new Image();
backgroundImg.src = 'images/background_spcace.jpg';



function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "15px Orbitron";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(`Lives: ${lives}`,  canvas.width - 20, 80);
    ctx.fillText(`Score: ${score}`,  canvas.width - 20, 50);

    // ctx.textAlign = "right";
    ctx.fillText(`Time: ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`, canvas.width - 20, 20);

    ctx.textAlign = "left"; // reset for other draws

    // Draw all game objects
    ctx.drawImage(playerShipImg, player.x, player.y, player.width, player.height);
    enemies.forEach(enemy => {
        let img = badShipGreenImg;
        if (enemy.row === 0) img = badShipBlackImg;
        else if (enemy.row === 1) img = badShipRedImg;
        else if (enemy.row === 2) img = badShipBlueImg;
        ctx.drawImage(img, enemy.x, enemy.y, enemy.width, enemy.height);
    });
    playerBullets.forEach(b => ctx.drawImage(goodBulletImg, b.x, b.y, b.width, b.height));
    enemyBullets.forEach(b => ctx.drawImage(badBulletImg, b.x, b.y, b.width, b.height));

    // === Game Over screen ===
    if (gameOver) {
        // clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "white";
        ctx.font = "bold 60px Orbitron";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
  
        if (lives <= 0) {
            gameOverSound.play();
            ctx.fillStyle = "red";
            ctx.fillText("You Lost!", canvas.width / 2, 50);
        }
        else if (enemies.length === 0) {
            winGameSound.play();
            ctx.fillStyle = "green";
            ctx.fillText("Champion!", canvas.width / 2, 50);
        }
        else if (timeLeft <= 0) {
            if (score < 100) {
                gameOverSound.play();
                ctx.fillStyle = "orange";
                ctx.font = "bold 40px Orbitron"; // smaller font for long text
                ctx.fillText(`You can do better! Score: ${score}`, canvas.width / 2, 50);
            } else {
                winGameSound.play();
                ctx.fillStyle = "green";
                ctx.font = "bold 50px Orbitron";
                ctx.fillText("Winner!", canvas.width / 2, 50);
            }
        }

        // Draw Top Scores below
        drawTopScores();
    }
}


function gameLoop() {
    update();
    draw();
    if (!gameOver) {
        gameFrameId = requestAnimationFrame(gameLoop);
    }
}


