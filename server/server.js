const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let gameState = {
    paddle1: { x: 5, y: 125, width: 5, height: 50 },
    paddle2: { x: 390, y: 125, width: 5, height: 50 },
    ball: { x: 200, y: 150, radius: 5, dx: 3, dy: 3 },
    score1: 0,
    score2: 0,
};
const winningScore = 5;
let players = [];
let inputs = {};
let gameEnd = false;

function updateGameState() {
    if (players.length < 2) {
        resetGame();
        return;
    }

    if (gameEnd) return;

    // Update paddles
    if (inputs[1]?.ArrowUp && gameState.paddle1.y > 0) gameState.paddle1.y -= 5;
    if (inputs[1]?.ArrowDown && gameState.paddle1.y < 300 - gameState.paddle1.height) gameState.paddle1.y += 5;
    if (inputs[2]?.ArrowUp && gameState.paddle2.y > 0) gameState.paddle2.y -= 5;
    if (inputs[2]?.ArrowDown && gameState.paddle2.y < 300 - gameState.paddle2.height) gameState.paddle2.y += 5;

    // Update ball position
    gameState.ball.x += gameState.ball.dx;
    gameState.ball.y += gameState.ball.dy;

    // Ball collision with top/bottom walls
    if (gameState.ball.y - gameState.ball.radius <= 0 || gameState.ball.y + gameState.ball.radius >= 300) {
        gameState.ball.dy *= -1;
    }

    // Ball collision with paddles
    if (
        (gameState.ball.x - gameState.ball.radius <= gameState.paddle1.x + gameState.paddle1.width &&
            gameState.ball.y >= gameState.paddle1.y &&
            gameState.ball.y <= gameState.paddle1.y + gameState.paddle1.height) ||
        (gameState.ball.x + gameState.ball.radius >= gameState.paddle2.x &&
            gameState.ball.y >= gameState.paddle2.y &&
            gameState.ball.y <= gameState.paddle2.y + gameState.paddle2.height)
    ) {
        gameState.ball.dx *= -1.1;
    }

    // Ball out of bounds
    if (gameState.ball.x - gameState.ball.radius <= 0) {
        gameState.score2++;
        resetBall();
    }
    if (gameState.ball.x + gameState.ball.radius >= 400) {
        gameState.score1++;
        resetBall();
    }


    // Check for a winner
    if (gameState.score1 >= winningScore || gameState.score2 >= winningScore) {
        const winner = gameState.score1 >= winningScore ? 1 : 2;
        broadcastGameState(winner);
        resetGame();
        return;
    }

    broadcastGameState();
}

function resetBall() {
    gameState.ball = { x: 200, y: 150, radius: 5, dx: 3, dy: 3 };
}

function resetGame() {
    gameState.score1 = 0;
    gameState.score2 = 0;
    resetBall();
}

function resetGameState() {
    gameState = {
        paddle1: { x: 5, y: 125, width: 5, height: 50 },
        paddle2: { x: 390, y: 125, width: 5, height: 50 },
        ball: { x: 200, y: 150, radius: 5, dx: 3, dy: 3 },
        score1: 0,
        score2: 0,
    };
    inputs = {};
    console.log("Game state reset");
}

function broadcastGameState(winner = null) {
    const stateUpdate = { type: 'stateUpdate', state: gameState, winner };
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(stateUpdate));
        }
    });
}

function broadcast(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: message }));
        }
    });
}

wss.on('connection', (ws) => {
    if (players.length >= 2) {
        ws.close();
        return;
    }

    const player = players.length + 1;
    players.push(ws);

    ws.send(JSON.stringify({ type: 'start', player }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'input') {
            inputs[player] = data.keys;
        } else if (data.type === 'restart') {
            resetGameState();
            broadcast('restart');
            gameEnd = false;
        } else if (data.type === 'end') {
            gameEnd = true;
        }
    });

    ws.on('close', () => {
        players = players.filter((playerWs) => playerWs !== ws);
        inputs = {};
    });
});

setInterval(updateGameState, 1000 / 60);

console.log('WebSocket server running on ws://localhost:8080');