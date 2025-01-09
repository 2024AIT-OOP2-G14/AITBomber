// socket.js
const socket = io();  // socket.ioの初期化
window.socket = socket;  // グローバルにsocketを公開
console.error('socket')