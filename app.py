from flask import Flask, render_template, request, redirect, url_for
from flask_socketio import SocketIO, join_room, leave_room, emit
import uuid  # UUIDを生成するモジュール
import sys
import logging

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

app = Flask(__name__)

# Socket.IOの初期化
socketio = SocketIO(app, cors_allowed_origins="*")

# ゲーム用のデータ
rooms = {}  # ルームIDをキーとして保持

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/roomselect')
def roomselect():
    return render_template('roomselect.html', rooms=rooms)

@app.route('/roommake', methods=['GET', 'POST'])
def roommake():
    room_id = str(uuid.uuid4())[:8]
    if request.method == 'POST':
        playername = request.form.get('playername')
        roomname = request.form.get('roomname')
        rule = request.form.get('rule')
        if not playername or not roomname or not rule:
            logging.warning("入力エラー: 必要な情報が不足しています")
            return redirect(url_for('roomselect'))

        # 新しいルームを作成
        rooms[room_id] = {
            'name': roomname,
            'rule': rule,
            'host': playername,
            'players': [playername],
        }
        logging.info(f"ルーム作成: {rooms[room_id]}")  # 確認用
        logging.info(f"Received playername: {playername}, room_id: {room_id}")  # 確認用

        # room_id と playername をクエリパラメータとして渡す
        return redirect(url_for('roomwait', room_id=room_id, playername=playername))
    return render_template('roommake.html', room_id=room_id)


@app.route('/roomwait', methods=['GET', 'POST'])
def roomwait():
    if request.method == 'POST':
        room_id = request.form.get('roomid')  # フォームデータからルームIDを取得
        playername = request.form.get('playername')  # フォームデータからプレイヤー名を取得
    else:  # GETリクエストの場合（クエリパラメータから取得）
        room_id = request.args.get('room_id')
        playername = request.args.get('playername')

    logging.info(f"Received playername: {playername}, room_id: {room_id}")

    # バリデーション
    if not room_id or room_id not in rooms:
        logging.warning("入力エラー: 不正なroom_id")
        return redirect(url_for('roomselect'))

    if not playername:
        logging.warning("入力エラー: playernameが指定されていません")
        return redirect(url_for('roomselect'))

    # プレイヤー追加（重複しない場合のみ）
    if playername not in rooms[room_id]['players']:
        rooms[room_id]['players'].append(playername)

    logging.info(f"ルーム更新: {rooms[room_id]}")
    return render_template('roomwait.html', room_id=room_id, playername=playername, room=rooms[room_id])



@socketio.on('join_room')
def handle_join(data):
    room_id = data.get('room_id')
    playername = data.get('playername')
    if not room_id or room_id not in rooms:
        emit('error', {'message': 'ルームが存在しません'})
        return
    rooms[room_id]['players'].append(playername)
    join_room(room_id)
    emit('update_room', rooms[room_id], room=room_id)

@socketio.on('start_game')
def handle_start_game(data):
    room_id = data.get('room_id')
    if not room_id or room_id not in rooms:
        emit('error', {'message': 'ルームが存在しません'})
        return
    emit('game_started', {'message': 'ゲームが開始されました'}, room=room_id)

@socketio.on('disconnect')
def handle_disconnect():
    for room_id, room_data in list(rooms.items()):
        if request.sid in room_data['players']:
            room_data['players'].remove(request.sid)
            emit('update_room', room_data, room=room_id)
            if not room_data['players']:
                del rooms[room_id]
            break

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=8080, debug=True)
