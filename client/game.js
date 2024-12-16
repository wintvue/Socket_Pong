// require('dotenv').config();


export function initializeGame(websocketUrl) {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let socket;
    addResetListener();

    // Get the WebSocket URL from environment variables
    console.log(websocketUrl);
    socket = new WebSocket(websocketUrl);

    let playerNumber;
    let gameState;
    let gameActive = true;

    socket.onopen = () => console.log('WebSocket connection established.');
    socket.onerror = (error) => console.error('WebSocket error:', error);
    socket.onclose = (event) => console.log('WebSocket connection closed:', event);

    socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        // console.log("Message received:", data);
        if (data.type === 'start') {
            playerNumber = data.player;
            alert(`You are Player ${playerNumber}`);
        } else if (data.type === 'stateUpdate') {
            gameState = data.state;
            gameLoop();
            if (data.winner) {
                // winnerDiv.textContent = `Player ${data.winner} Wins!`;
                alert(`Player ${data.winner} Wins!`);
                endGame();
            }
        } else if (data.type === 'restart') {
            console.log("Restarting WebSocket...");
            gameActive = true;
            gameLoop();
        }

    };

    const keys = {};
    window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
            keys[e.key] = true;
            sendInput();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
            keys[e.key] = false;
            sendInput();
        }
    });

    function sendInput() {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'input', keys, player: playerNumber }));
        }
    }

    function drawGame() {
        if (!gameState) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw paddles
        ctx.fillStyle = '#29adff';
        ctx.fillRect(gameState.paddle1.x, gameState.paddle1.y, gameState.paddle1.width, gameState.paddle1.height);
        ctx.fillRect(gameState.paddle2.x, gameState.paddle2.y, gameState.paddle2.width, gameState.paddle2.height);

        // Draw ball
        ctx.beginPath();
        ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffccaa';
        ctx.fill();
        ctx.closePath();

        drawScores();
    }

    function gameLoop() {
        drawScores();
        drawGame();
        requestAnimationFrame(gameLoop);
    }

    function drawScores() {
        // Draw scores
        ctx.font = '24px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(`Player 1: ${gameState.score1}`, 20, 30);
        ctx.fillText(`Player 2: ${gameState.score2}`, canvas.width - 150, 30);
    }

    function addResetListener() {
        // Add event listener to reset the game
        resetButton.addEventListener('click', () => {
            requestRestart();
        });
    }

    // gameLoop();
}

function requestRestart() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'restart' }));
    }
}

function endGame() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'end' }));
    }
}

// initializeGame();