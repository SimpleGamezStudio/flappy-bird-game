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
    image: new Image()
};
bird.image.src = 'https://i.postimg.cc/8CT5CDQ8/image.png';

let pipes = [];
let frame = 0;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;

const background = new Image();
background.src = 'https://i.postimg.cc/gjFy5fhM/image.png';
const pipeImage = new Image();
pipeImage.src = 'https://i.postimg.cc/3N4FN2Mc/image-removebg-preview.png';

document.getElementById('highscore').innerText = `High Score: ${highScore}`;

// Create and configure the audio object for background music
const backgroundMusic = new Audio('https://www.bensound.com/bensound-music/bensound-ukulele.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.1; // Set volume to 10% of full volume
const defaultVolume = 0.1;

// Sound effect for wing flap (shortened version)
const flapSound = new Audio('https://dl.dropboxusercontent.com/s/dy7etu816q8kroyvb6ywe/shortened_flap.mp3?rlkey=occqopkrvb6n7mh0oaa6l5gxw&st=ji76lly7');
flapSound.volume = 1.0; // Increase volume to 100%

// Sound effect for point
const pointSound = new Audio('https://dl.dropboxusercontent.com/s/2ucyszjls3ituu59464ts/coin-collect-retro-8-bit-sound-effect-145251.mp3?rlkey=wzym0m0bpq4fyxawdl3wamfys&st=galhnk70');
pointSound.volume = 1.0; // Increase volume to 100%

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

function drawBird() {
    ctx.drawImage(bird.image, bird.x, bird.y, bird.width, bird.height);
}

function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        resetGame();
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
        pipe.x -= 1.5; // Reduced speed
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

function checkCollision() {
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
            resetGame();
        }
    });
}

function resetGame() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        document.getElementById('highscore').innerText = `High Score: ${highScore}`;
    }
    bird.y = 150;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    document.getElementById('score').innerText = `Score: ${score}`;
}

function drawBackground() {
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawBird();
    drawPipes();
    updateBird();
    updatePipes();
    checkCollision();
    frame++;
    requestAnimationFrame(gameLoop);
}

// Add event listener to start music, bird movement, and play flap sound on key press
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') { // Space key for bird lift
        bird.velocity += bird.lift;
        playFlapSound();
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
    bird.velocity += bird.lift;
    playFlapSound();
    if (backgroundMusic.paused) {
        startMusic();
    }
});

gameLoop();
