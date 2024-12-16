import { initializeGame } from './game.js';
const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080';
initializeGame(websocketUrl);