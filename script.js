document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('content > div');

    function showScreen(targetId) {
        sections.forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

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
        alert('Registration successful! Please log in.');
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
                alert('Welcome back, Guest!');
                showScreen('config_page');
                return;
            }
            else{
                alert('Invalid username or password.');
            }
        }
    });

});
// Default config
let gameConfig = {
    shootKey: ' ', // space
    timeLimit: 2, // in minutes
    shipColor: 'lime'
};

document.getElementById('config_form').addEventListener('submit', function (e) {
    e.preventDefault();

    let key = document.getElementById('shoot_key').value.trim().toLowerCase();
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
let canvas, ctx;
let player = { x: 400, y: 500, width: 40, height: 40, color: gameConfig.shipColor };
let keys = {};

function setupGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Keyboard input
    document.addEventListener('keydown', (e) => keys[e.key] = true);
    document.addEventListener('keyup', (e) => keys[e.key] = false);

    gameLoop(); // Start the game
}

function update() {
    if (keys[gameConfig.shootKey]) {
        console.log("Pew! Pew!");
        // add shoot logic later
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the player spaceship (rectangle for now)
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ------------------------------


