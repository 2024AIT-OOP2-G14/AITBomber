from flask import Flask, render_template, request, redirect, session, url_for, send_from_directory
from flask_socketio import SocketIO, join_room, leave_room, emit
import uuid  # UUIDを生成するモジュール
import sys
import logging
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

app = Flask(__name__)
app.config["SECRET_KEY"] = "f4Pjp3UgJa51"  # セキュリティーのためにいるらしい

# Socket.IOの初期化
socketio = SocketIO(app, cors_allowed_origins="*")

# ゲーム用のデータ
rooms = {}  # ルームIDをキーとして保持
death_order = {}  # 死亡順を保持
rooms_operable = {}  # 各ルームのプレイヤーの状態を管理する辞書
rooms_count = {}  # 各ルームのプレイヤー総数を管理する辞書
connected_users={}  #各ルームの初期接続人数を管理する辞書

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/roomselect', methods=['GET', 'POST'])
def roomselect():
    if request.method == 'POST':
        playername = request.form.get('playername')
        room_id = request.form.get('room_id')
        if not playername or not room_id:
            logging.warning("入力エラー: 必要な情報が不足しています")
            return redirect(url_for('roomselect'))
        #logging.info(f"ルーム作成: {rooms[room_id]}")  # 確認用
        #logging.info(f"Received playername: {playername}, room_id: {room_id}")  # 確認用

        # 同じ名前のプレイヤーチェック
        if playername in rooms[room_id]['players']:
            return render_template(
                'roomselect.html',
                rooms=rooms,
                error=f"プレイヤー名 {playername} は既に使用されています。別の名前を選んでください。"
            )
        return redirect(url_for('roomwait', room_id=room_id, playername=playername))
    return render_template('roomselect.html', rooms=rooms)

@app.route('/roommake', methods=['GET', 'POST'])
def roommake():

    room_id = str(uuid.uuid4())[:8]
    if request.method == 'POST':
        playername = request.form.get('playername')
        roomname = request.form.get('roomname')
        room_id = request.form.get('room_id')  # HTML から取得
        if not playername or not roomname:
            logging.warning("入力エラー: 必要な情報が不足しています")
            return redirect(url_for('roomselect'))
        # 新しいルームを作成
        rooms[room_id] = {
            'name': roomname,
            'host': playername,
            'players': [playername],
        }
        logging.info(f"Received playername: {playername}, room_id: {room_id}")  # 確認用
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
    
    # プレイヤーの数を四人に制限(タスク：警告文を出したい)
    if len(rooms[room_id]['players']) > 4:
        return redirect(url_for('roomselect'))

    #logging.info(f"ルーム更新: {rooms[room_id]}")
    return render_template('roomwait.html', room_id=room_id, playername=playername, room=rooms[room_id])

@socketio.on('join_room')
def handle_join_room(data):
    room_id = data.get('room_id')
    playername = data.get('playername')

    if not room_id or room_id not in rooms:
        emit('error', {'message': '不正なルームIDです'})
        return
    
        # プレイヤーが既にリストに含まれていない場合のみ追加
    if playername not in rooms[room_id]['players']:
        rooms[room_id]['players'].append(playername)
        # プレイヤー名とセッションIDを紐付け
        rooms[room_id].setdefault('sessions', {})[request.sid] = playername

    # プレイヤーをルームに追加
    join_room(room_id)
    countn=len(rooms[room_id]['players'])
    # ルーム全員にルーム情報を送信
    emit('update_room', {'message': f'{playername} がルームに参加しました', 'players': rooms[room_id]['players']}, room=room_id, countN=countn)


@socketio.on('start_game')
def handle_start_game(data):
    room_id = data.get('room_id')
    playername = data.get('playername')

    if not room_id or room_id not in rooms:
        emit('error', {'message': 'ルームが存在しません'})
        return

    if rooms[room_id]['host'] != playername:
        emit('error', {'message': 'ゲームを開始できるのはホストのみです'})
        return
    if len(rooms[room_id]['players']) <= 1:
        emit('error', {'message': '参加者が一人だけではゲームを開始できません'})
        return
    # ログにゲーム開始を記録
    logging.warning(f"ルーム {room_id} で {playername} によりゲームが開始されました")

    # 全員にゲーム開始通知(プレーヤーネームはホストの名前で上書きされるため送らない)
    emit('game_started', {
        'message': 'ゲームが開始されました',
        'room_id': room_id
    }, room=room_id)



@socketio.on('disconnect')
def handle_disconnect():
    for room_id, room_data in list(rooms.items()):
        # セッションIDからプレイヤー名を取得
        playername = room_data.get('sessions', {}).pop(request.sid, None)
        if playername:
            # プレイヤーをリストから削除
            room_data['players'].remove(playername)
            emit('update_room', {
                'message': f'{playername} が切断しました',
                'players': room_data['players']
            }, room=room_id)

            # プレイヤーがいない場合はルームを削除
            if not room_data['players']:
                del rooms[room_id]
            break

@app.route('/game.html', methods=['GET', 'POST'])#ゲーム画面に遷移
def game():
    if request.method == 'POST':
        room_id = request.form.get('roomid')  # フォームデータからルームIDを取得
        playername = request.form.get('playername')  # フォームデータからプレイヤー名を取得
    else:  # GETリクエストの場合（クエリパラメータから取得）
        room_id = request.args.get('room_id')
        playername = request.args.get('playername')
    # プレイヤー番号を計算して送信
    logging.warning(f"ルーム {rooms[room_id]}")
    myN = rooms[room_id]['players'].index(playername)
    countmyN = len(rooms[room_id]['players'])
    return render_template('game.html', room_id=room_id, myN=myN, countmyN=countmyN,players_in_room=rooms[room_id]['players'])

#死亡判定
@socketio.on('operable')
def operable(data):
    global rooms_operable, rooms_count, death_order

    operable = data.get('operable')  # 生きているか
    room_id = data.get('room_id')  # ルームID
    playername = data.get('playername')  # プレイヤー名
    countmyN = data.get('countmyN')  # 現在の部屋のプレイヤー数

    # 初期化
    if room_id not in rooms_operable:
        rooms_operable[room_id] = {}
        rooms_count[room_id] = countmyN
    death_order.setdefault(room_id, [])

    # 状態を更新
    rooms_operable[room_id][playername] = operable

    # 死亡リストの更新
    if operable == 0 and playername not in death_order[room_id]:
        death_order[room_id].append(playername)

    # 生存者数をルームの全体の人数から死亡した人数を引いて計算
    total_players = rooms_count[room_id]  # ルーム内の全体のプレイヤー数
    dead_players = len(death_order[room_id])  # 死亡したプレイヤーの数
    alive_count = total_players - dead_players  # 生存者数を計算
    
    # プレイヤーが2人以上であれば、arriveを判定（これないと一人でデバック作業するとゲーム終わってしまう）
    if len(death_order[room_id]) >= 1:
    # 生存者が1人になった場合
        if alive_count == 1:
            logging.warning(f"total_players {total_players}dead_players {dead_players}")
            # 最後の生存者を死亡リストに追加
            for player, state in rooms_operable[room_id].items():
                if state == 1 and player not in death_order[room_id]:
                    death_order[room_id].append(player)
                    break
        
            # ランキングデータ送信
            emit('ranking_data', {
                'room_id': room_id,
                'death_order': death_order[room_id]
            }, room=room_id)

            # ゲーム終了イベント送信
            emit('game_end', {'room_id': room_id, 'death_order': death_order[room_id]}, room=room_id)

@socketio.on('connect_count')
def handle_connect(data):
    global connected_users

    room_id = data.get('room_id') # ルームID
    countmyN = data.get('countmyN') # 現在の部屋のプレイヤー数

    if room_id not in connected_users:
        connected_users[room_id] = 0

    connected_users[room_id]+=1
    # 指定人数に達したら、mapを配る
    if connected_users[room_id] == countmyN:
        emit('map_up',broadcast=True,room=room_id)
        connected_users[room_id]=0

#ホストからのマップ情報をホスト以外全員へ送る
@socketio.on('save_map')
def server_echo(data):
    room_id = data.get('room_id') # ルームID
    mapData = data.get('map') # 現在の部屋のプレイヤー数
    emit('maploader',mapData,broadcast=True,room=room_id)

#マップの変更点を送る
@socketio.on('changes_map')
def change(data):
    cy = data.get('cy')
    cx = data.get('cx')
    mapData = data.get('mapData')
    room_id = data.get('room_id') # ルームID

    emit('mapchanger', {'cy': cy, 'cx': cx, 'mapData': mapData}, broadcast=True,room=room_id)

 #プレイヤー情報を送る
@socketio.on('send_player')
def send(playerData,room_id):
    emit('playerReceiver', playerData, broadcast=True,room=room_id)

@app.route('/ranking.html', methods=['GET', 'POST'])#ランキング画面に遷移
def ranking():
    if request.method == 'POST':
        room_id = request.form.get('roomid')  # フォームデータからルームIDを取得
        playername = request.form.get('playername')  # フォームデータからプレイヤー名を取得
    else:  # GETリクエストの場合（クエリパラメータから取得）
        room_id = request.args.get('room_id')
        playername = request.args.get('playername')

    # ランキングデータを渡してテンプレートをレンダリング
    return render_template(
        'ranking.html',
        room_id=room_id,
        playername=playername,
        death_order=death_order  # ランキングデータ
    )

if __name__ == '__main__':
    logging.info(" - Local: http://127.0.0.1:8080")
    socketio.run(app, host="0.0.0.0", port=8080, debug=False)  # ローカル開発用として使う場合
    #pass
