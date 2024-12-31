const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room_id');
    const playerName = params.get('playername');

    if (roomId && playerName) {
        console.log(`ルームに参加します: room_id=${roomId}, playername=${playerName}`);
        socket.emit('join_room', { room_id: roomId, playername: playerName });
    } else {
        console.error('ルームIDまたはプレイヤー名が見つかりません');
    }
});
// ルームに参加
function joinRoom(roomId, playerName) {
    socket.emit('join_room', { room_id: roomId, playername: playerName });
}

// リアルタイムでルーム情報を更新
socket.on('update_room', (room) => {
    // `<section id="update_room">` を取得
    const updateRoomSection = document.getElementById('update_room');
    // room オブジェクトが正しく受信されたか確認
    if (room && Array.isArray(room.players)) {
        // プレイヤーリストを生成
        const playersList = room.players.map(player => `<li>${player}</li>`).join('');

        // セクション内のHTMLを更新
        updateRoomSection.innerHTML = playersList;
    } else {
        // データが正しくない場合の表示
        updateRoomSection.innerHTML = '<p>プレイヤー情報を取得できませんでした。</p>';
    }
});


document.getElementById('startGameButton').addEventListener('click', () => {
    const params = new URLSearchParams(window.location.search);//クリエパラメータから取得している
    const roomId = params.get('room_id'); // room_idを取得
    const playerName = params.get('playername'); // playernameを取得
    console.log("room_id:", params.get('room_id'));
    console.log("playername:", params.get('playername'));
    startGame(roomId, playerName);
});

// ゲーム開始
function startGame(roomId, playerName) {
    socket.emit('start_game', { room_id: roomId, playername: playerName });
}

// ゲーム開始の通知
socket.on('game_started', (data) => {
    console.log("ゲームが開始されました:", data); // dataの内容も確認できるようにする

    // URLのクエリパラメータからplayernameを取得する
    const params = new URLSearchParams(window.location.search);
    const playerName = params.get('playername');  // 'playername' パラメータを取得

    // game.html に遷移（プレイヤーネームもクエリパラメータとして追加）
    location.href = `game.html?room_id=${data.room_id}&playername=${playerName}`;
});


// エラーメッセージの表示
socket.on('error', (error) => {
    alert(`エラー: ${error.message}`);
});

socket.on('connect', () => {
    console.log("ソケットがサーバーに接続されました！");
});

socket.on('disconnect', () => {
    console.log("ソケット切断");
});
