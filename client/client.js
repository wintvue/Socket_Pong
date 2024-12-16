import { initializeGame } from './game.js';
let websocketUrl;
try {
    websocketUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080';
} catch {
    websocketUrl = 'ws://localhost:8080';
}

initializeGame(websocketUrl);