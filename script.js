const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 320;
canvas.height = 480;

let bird = {
    x: 50,
    y: 150,
    width: 40,
    height: 40,
    gravity: 0.4,
    lift: -10,
    velocity: 0,
    speed: 1.5,
    image: new Image(),
    isInvincible: false,
    extraLife: false
};
bird.image.src = 'https://i.postimg.cc/8CT5CDQ8/image.png';

let pipes = [];
let enemies = [];
let powerUps = [];
let projectiles = [];
let frame = 0;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let shootCooldown = 0;
let gameActive = false;

const background = new Image();
background.src = 'https://i.postimg.cc/gjFy5fhM/image.png';
const pipeImage = new Image();
pipeImage.src = 'https://i.postimg.cc/3N4FN2Mc/image-removebg-preview.png';
const enemyImage = new Image();
enemyImage.src = 'https://i.postimg.cc/Z5f3jbdJ/image.png'; // New flying enemy image
const speedPowerUpImage = new Image();
speedPowerUpImage.src = 'https://i.postimg.cc/R0kmztHG/image.png'; // New speed power-up image
const invincibilityPowerUpImage = new Image();
invincibilityPowerUpImage.src = 'https://i.postimg.cc/0j5p5zgK/image.png'; // New invincibility power-up image
const scoreMultiplierPowerUpImage = new Image();
scoreMultiplierPowerUpImage.src = 'https://i.postimg.cc/hjt56PCM/image.png'; // New score multiplier power-up image
const extraLifePowerUpImage = new Image();
extraLifePowerUpImage.src = 'https://i.postimg.cc/0yY9pgrn/powerup.png'; // Previous extra life power-up image
const projectileImage = new Image();
projectileImage.src = 'https://i.postimg.cc/3JW5gVj6/projectile.png'; // Replace with actual projectile image URL

document.getElementById('highscore').innerText = `High Score: ${highScore}`;

// Create and configure the audio object for background music
const backgroundMusic = new Audio('https://www.bensound.com/bensound-music/bensound-ukulele.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.1; // Set volume to 10% of full volume
const defaultVolume = 0.1;

// Sound effect for wing flap (shortened version)
const flapSound = new Audio('https://dl.dropboxusercontent.com/s/dy7etu816q8kroyvb6n7mh0oaa6l5gxw/shortened_flap.mp3?rlkey=occqopkrvb6n7mh0oaa6l5gxw&st=ji76lly7');
flapSound.volume = 1.0; // Increase volume to 100%

// Sound effect for point
const pointSound = new Audio('https://dl.dropboxusercontent.com/s/2ucyszjls3ituu59464ts/coin-collect-retro-8-bit-sound-effect-145251.mp3?rlkey=wzym0m0bpq4fyxawdl3wamfys&st=galhnk70');
pointSound.volume = 1.0; // Increase volume to 100%

// Sound effect for shooting
const shootSound = new Audio('https://dl.dropboxusercontent.com/s/6zy9eulx8fql4vc/shoot-sound.mp3?rlkey=d4uepi4c1n1asx7mbv3uy1zk1&st=gxdm2u'); // Replace with actual shoot sound URL
shootSound.volume = 1.0;

let animationFrameId;

function startMusic() {
    backgroundMusic.play();
}

function playFlapSound() {
    flapSound.currentTime = 0; // Reset to start
    flapSound.play().catch(error => console.error('Flap sound error:', error));
}

function playPointSound() {
    pointSound.currentTime = 0; // Reset to start
    pointSound.play().catch(error => console.error('Point sound error:', error));
}

function playShootSound() {
    shootSound.currentTime = 0; // Reset to start
    shootSound.play().catch(error => console.error('Shoot sound error:', error));
}

function drawBird() {
    ctx.drawImage(bird.image, bird.x, bird.y, bird.width, bird.height);
    if (bird.isInvincible) {
        ctx.beginPath();
        ctx.arc(bird.x + bird.width / 2, bird.y + bird.height / 2, 30, 0, Math.PI * 2, false);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
        ctx.stroke();
    }
}

function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        if (bird.extraLife) {
            bird.extraLife = false;
            bird.y = 150;
            bird.velocity = 0;
        } else {
            gameOver();
        }
    }
}

function drawPipes() {
    pipes.forEach(pipe => {
        // Draw top pipe upside down
        ctx.save();
        ctx.translate(pipe.x + pipe.width / 2, pipe.topHeight);
        ctx.scale(1, -1);
        ctx.drawImage(pipeImage, -pipe.width / 2, 0, pipe.width, pipe.topHeight);
        ctx.restore();
        
        // Draw bottom pipe normally
        ctx.drawImage(pipeImage, pipe.x, pipe.bottom, pipe.width, canvas.height - pipe.bottom);
    });
}

function updatePipes() {
    if (frame % 90 === 0) {
        let topHeight = Math.floor(Math.random() * (canvas.height / 2));
        pipes.push({
            x: canvas.width,
            top: 0,
            topHeight: topHeight,
            bottom: topHeight + 150, // Increased gap
            width: 40,
            scored: false
        });
    }
    pipes.forEach(pipe => {
        pipe.x -= bird.speed; // Adjusted speed based on bird's speed
        if (!pipe.scored && pipe.x + pipe.width < bird.x) {
            pipe.scored = true;
            score++;
            document.getElementById('score').innerText = `Score: ${score}`;
            playPointSound();
        }
        if (pipe.x + pipe.width < 0) {
            pipes.shift();
        }
    });
}

function spawnEnemy() {
    if (frame % 120 === 0) { // Spawn enemy every 120 frames
        enemies.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 40),
            width: 40,
            height: 40,
            speed: 2
        });
    }
}

function updateEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.x -= enemy.speed;
        if (enemy.x + enemy.width < 0) {
            enemies.splice(index, 1); // Remove off-screen enemies
        }
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

function spawnPowerUp() {
    if (frame % 300 === 0) { // Spawn power-up every 300 frames
        const powerUpType = Math.floor(Math.random() * 4); // 4 types of power-ups
        powerUps.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 40),
            width: 20,
            height: 20,
            speed: 1.5,
            type: powerUpType
        });
    }
}

function updatePowerUps() {
    powerUps.forEach((powerUp, index) => {
        powerUp.x -= powerUp.speed;
        if (powerUp.x + powerUp.width < 0) {
            powerUps.splice(index, 1); // Remove off-screen power-ups
        }
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        let image;
        switch (powerUp.type) {
            case 0:
                image = speedPowerUpImage;
                break;
            case 1:
                image = invincibilityPowerUpImage;
                break;
            case 2:
                image = scoreMultiplierPowerUpImage;
                break;
            case 3:
                image = extraLifePowerUpImage;
                break;
        }
        ctx.drawImage(image, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });
}

function applyPowerUp(type) {
    switch (type) {
        case 0:
            bird.speed = 3; // Double speed
            setTimeout(() => bird.speed = 1.5, 5000); // Reset after 5 seconds
            break;
        case 1:
            bird.isInvincible = true;
            setTimeout(() => bird.isInvincible = false, 5000); // Reset after 5 seconds
            break;
        case 2:
            score += 2; // Add 2 points to the score
            document.getElementById('score').innerText = `Score: ${score}`;
            break;
        case 3:
            bird.extraLife = true;
            break;
    }
}

function checkCollision() {
    if (!bird.isInvincible) {
        pipes.forEach(pipe => {
            const birdHitbox = {
                x: bird.x + 10,
                y: bird.y + 10,
                width: bird.width - 20,
                height: bird.height - 20
            };
            if (
                birdHitbox.x < pipe.x + pipe.width &&
                birdHitbox.x + birdHitbox.width > pipe.x &&
                (birdHitbox.y < pipe.topHeight || birdHitbox.y + birdHitbox.height > pipe.bottom)
            ) {
                gameOver();
            }
        });
        enemies.forEach((enemy, enemyIndex) => {
            if (
                bird.x < enemy.x + enemy.width &&
                bird.x + bird.width > enemy.x &&
                bird.y < enemy.y + enemy.height &&
                bird.y + bird.height > enemy.y
            ) {
                gameOver();
            }
            projectiles.forEach((projectile, projectileIndex) => {
                if (
                    projectile.x < enemy.x + enemy.width &&
                    projectile.x + projectile.width > enemy.x &&
                    projectile.y < enemy.y + enemy.height &&
                    projectile.y + projectile.height > enemy.y
                ) {
                    // Remove both the projectile and the enemy upon collision
                    enemies.splice(enemyIndex, 1);
                    projectiles.splice(projectileIndex, 1);
                }
            });
        });
    }
    powerUps.forEach((powerUp, index) => {
        if (
            bird.x < powerUp.x + powerUp.width &&
            bird.x + bird.width > powerUp.x &&
            bird.y < powerUp.y + powerUp.height &&
            bird.y + powerUp.height > powerUp.y
        ) {
            applyPowerUp(powerUp.type); // Apply the power-up effect
            powerUps.splice(index, 1); // Remove collected power-up
        }
    });
}

function drawProjectiles() {
    projectiles.forEach(projectile => {
        ctx.drawImage(projectileImage, projectile.x, projectile.y, projectile.width, projectile.height);
    });
}

function updateProjectiles() {
    projectiles.forEach((projectile, index) => {
        projectile.x += projectile.speed;
        if (projectile.x > canvas.width) {
            projectiles.splice(index, 1); // Remove off-screen projectiles
        }
    });
}

function shootProjectiles() {
    if (shootCooldown === 0) {
        projectiles.push({
            x: bird.x + bird.width,
            y: bird.y + bird.height / 2 - 5,
            width: 10,
            height: 5,
            speed: 5
        });
        playShootSound();
        shootCooldown = 20; // Cooldown period to control shooting rate
    } else {
        shootCooldown--;
    }
}

function resetGame() {
    bird.y = 150;
    bird.velocity = 0;
    pipes = [];
    enemies = [];
    powerUps = [];
    projectiles = [];
    score = 0;
    frame = 0;
    document.getElementById('score').innerText = `Score: ${score}`;
}

function drawBackground() {
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    if (!gameActive) return; // Stop the loop if the game is not active
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawBird();
    drawPipes();
    drawEnemies();
    drawPowerUps();
    drawProjectiles();
    updateBird();
    updatePipes();
    spawnEnemy();
    updateEnemies();
    spawnPowerUp();
    updatePowerUps();
    updateProjectiles();
    checkCollision();
    shootProjectiles(); // Make the bird shoot projectiles continuously
    frame++;
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Add event listener to start music, bird movement, and play flap sound on key press
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') { // Space key for bird lift
        if (gameActive) {
            bird.velocity += bird.lift;
            playFlapSound();
        }
        if (backgroundMusic.paused) {
            startMusic();
        }
    } else if (e.key.toLowerCase() === 'f') { // 'f' key to toggle volume
        backgroundMusic.volume = backgroundMusic.volume === 0 ? defaultVolume : 0;
    }
});

// Add event listener to start music, bird movement, and play flap sound on touch
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    if (gameActive) {
        bird.velocity += bird.lift;
        playFlapSound();
    }
    if (backgroundMusic.paused) {
        startMusic();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.getElementById('play-button');
    const mainMenu = document.getElementById('main-menu');
    const leagueDisplay = document.getElementById('league-display');

    // Function to determine league based on high score
    function getLeague(score) {
        if (score >= 40) return 'Master';
        if (score >= 30) return 'Gold';
        if (score >= 20) return 'Silver';
        if (score >= 10) return 'Bronze';
        return 'None';
    }

    // Function to update league display
    function updateLeagueDisplay() {
        const league = getLeague(highScore);
        leagueDisplay.textContent = `League: ${league}`;
    }

    // Function to start the game
    function startGame() {
        mainMenu.style.display = 'none';
        canvas.style.display = 'block';
        gameActive = true;
        gameLoop(); // Start game loop
    }

    // Set initial states
    canvas.style.display = 'none';
    updateLeagueDisplay();

    // Add event listener to play button
    playButton.addEventListener('click', startGame);

    // Game over logic to update high score and return to main menu
    function gameOver() {
        gameActive = false;
        cancelAnimationFrame(animationFrameId); // Stop the game loop
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
            document.getElementById('highscore').innerText = `High Score: ${highScore}`;
        }
        updateLeagueDisplay();
        mainMenu.style.display = 'block';
        canvas.style.display = 'none';
        resetGame();
    }

    window.gameOver = gameOver; // Expose gameOver function for debugging
});
