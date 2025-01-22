console.log(socket);  // window.socketとしてグローバルにアクセスできる（ソケットが動いているか確認用）
"use strict";

let gKey = new Uint8Array(0x100);
let gTimer;

//1マスの大きさ(縦横共通)
const squareSize = 16 * 2

//縦横ブロック数
const wblock = 15;
const hblock = 13;

//画面サイズ
const WIDTH = squareSize * wblock;
const HEIGHT = squareSize * hblock;

//スペースキーのクールタイム(frame)
let spaceKeyRecharge = 10
let spaceTime = 0;

//プレイヤー情報
const user = document.createElement('img');
//壁情報
const kabe = document.createElement('img');
//壊れる壁情報
const breakabe = document.createElement('img');
//アイテムが入った壁
const item_wall = document.createElement('img');
//アイテムの画像
const item_number1 = document.createElement('img');
const item_number2 = document.createElement('img');
const item_number3 = document.createElement('img');
const item_number4 = document.createElement('img');
//爆弾情報
const bomb = document.createElement('img');
//爆風情報
const blast = document.createElement('img');

 // URLのクエリパラメータからroom_idを取得
 const params = new URLSearchParams(window.location.search);
 const playerName = params.get('playername');
 const roomId = params.get('room_id');

//爆弾に埋まってるときその爆弾を記録
let nowisIB = [[],[]]
console.log(nowisIB)
//プレイヤー番号により開始位置を変え、プレイヤークラスを定義(0:左上, 1:右上, 2:左下, 3:右下)
let player = [];
// プレイヤー番号に応じて開始位置を変え、Player クラスを順番に定義
playersInRoom.forEach((playername, index) => {
    let x, y;

    // プレイヤー番号 (index) に応じて位置を変更
    switch (index) {
        case 0: // 左上
            x = squareSize;
            y = squareSize;
            break;
        case 1: // 右上
            x = WIDTH - 2 * squareSize;
            y = squareSize;
            break;
        case 2: // 左下
            x = squareSize;
            y = HEIGHT - 2 * squareSize;
            break;
        case 3: // 右下
            x = WIDTH - 2 * squareSize;
            y = HEIGHT - 2 * squareSize;
            break;
        default: // それ以外のプレイヤー（必要なら追加のロジックを入れる）
            x = squareSize;
            y = squareSize;
    }

    // プレイヤーインスタンスを作成し、player 配列に追加
    player.push(new Player(playername, index, x, y));
});
let rWidth = squareSize;         // 任意の数を入れることで、プレイヤーの大きさが決定される
let rHeight;

//プレイヤー画像のスケーリングと読み込み
user.onload = function () {
    let orgWidth = user.width;     // 元画像の横幅を保存
    let orgHeight = user.height;    // 元画像の高さを保存
    rHeight = orgHeight * (rWidth / orgWidth);  // rWidthに対して同じ比で高さも決定する。
    user.style.position = "absolute";   //画面左上を(0,0)とした絶対位置でプレイヤーを配置するという状態
};

//プレイヤーの画像
user.src = "../static/image/hito.png";

//壁画像
kabe.src = "../static/image/kabe.png";

//壊れる壁画像
breakabe.src = "../static/image/breakabe.png";
//アイテムが入った壁
item_wall.src = "../static/image/breakabe.png";

//アイテムの画像
item_number1.src = "../static/image/power_up.png";
item_number2.src = "../static/image/power_down.png";
item_number3.src = "../static/image/speed_up.png";
item_number4.src = "../static/image/speed_down.png";

//爆弾画像
bomb.src = "../static/image/bomb.png";

//爆風画像
blast.src = "../static/image/blast.png";

//マップ生成
var map = new Map(wblock, hblock);

socket.on('map_up',() => {
    if (myN === 0) {
        // ホストがマップ生成
        map.GenerateBreakWall();
        map.iteminWall();
        socket.emit('save_map',{ room_id: roomId,bombermap: map.bombermap});
    }
});
// マップの更新受信
socket.on('maploader', (bombermap) => {
    if (myN !== 0) {
        map.bombermap = bombermap;
    }
});

socket.on('connect', () => {
     if (roomId) {
         // プレイヤーをルームに参加させる
         socket.emit('join_room', { room_id: roomId });
     } else {
         console.error('room_id is not found in URL parameters');
     }

    socket.emit('connect_count', { room_id: roomId,countmyN: countmyN});
});


socket.on('mapchanger', (data) => {
    const { cy, cx, mapData } = data; // 受け取ったデータを展開
    map.bombermap[cy][cx] = mapData;  // マップを更新
});

socket.on('playerReceiver', (playerData) => {
    if (playerData.gN != myN) {
        player[playerData.gN].operable = playerData.operable;
        player[playerData.gN].gX = playerData.gX;
        player[playerData.gN].gY = playerData.gY;
        player[playerData.gN].blastYX = structuredClone(playerData.blastYX)
        player[playerData.gN].blastRange = structuredClone(playerData.blastRange)
    }
});


function onPaint() {
    //frameParSecond管理（60fps）

    //初回は実時間をgTimerに送る
    if (!gTimer) {
        gTimer = performance.now();
    }
    //16.67ミリ秒たったら画面を更新することで、60fpsよりフレームレートが高い環境でも約60fpsで動く(16.67ms/f = 1/1.667f/s = 59.9988002f/s ≒ 60f/s)
    if (gTimer + 16.67 < performance.now()) {


        //各キーが押し込まれたら、プレイヤーの座標が毎フレーム更新される
        //斜め移動をしながら壁にぶつかった時、壁沿いに動けるように、上下左右それぞれで壁判定を行う
        //60fpsよりフレームレートが低い環境では、時間関連のイベントが複数回行われるようにします。（60fpsで動かす想定なので、30fpsの環境では移動処理が二度行われます。）
        while (gTimer + 16.67 < performance.now()) {
            gTimer += 16.67;
            if (player[myN].operable) {

                nowisIB = player[myN].stepOnBomb(nowisIB) 

                player[myN].gX -= gKey[65] * player[myN].gS;    //g[65]=1（aキーが押し込まれた）
                if (gKey[65] && map.isInsideWall(player[myN].gX, player[myN].gY, nowisIB)) { player[myN].gX += gKey[65] * player[myN].gS } //ダメならもどす

                player[myN].gX += gKey[68] * player[myN].gS;
                if (gKey[68] && map.isInsideWall(player[myN].gX, player[myN].gY, nowisIB)) { player[myN].gX -= gKey[68] * player[myN].gS }

                player[myN].gY -= gKey[87] * player[myN].gS;
                if (gKey[87] && map.isInsideWall(player[myN].gX, player[myN].gY, nowisIB)) { player[myN].gY += gKey[87] * player[myN].gS }

                player[myN].gY += gKey[83] * player[myN].gS;
                if (gKey[83] && map.isInsideWall(player[myN].gX, player[myN].gY, nowisIB)) { player[myN].gY -= gKey[83] * player[myN].gS }
                //値を戻す
                //console.log(nowisIB[0])
                //console.log(nowisIB[1])
            }

            //タイマー進める
            player[myN].bTimer();
        }

        //スペースキーが押し込まれたらボムを置く
        if (spaceTime > 0) {
            spaceTime--;
        }

        if (player[myN].operable && gKey[32] == 1 && spaceTime == 0) {
            player[myN].setBomb();
            spaceTime = spaceKeyRecharge;
        }

        Position_item(myN);
        draw();
    }
    requestAnimationFrame(onPaint);
}

function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//描画
function draw() {
    let g = document.getElementById("main").getContext("2d");

    //緑色地面描画
    g.fillStyle = "#006400";
    g.fillRect(squareSize, squareSize, WIDTH - 2 * squareSize, HEIGHT - 2 * squareSize);

    //プレイヤー情報の送信
    socket.emit('send_player', player[myN],roomId);

    //壁or爆弾の描画
    for (var i = 0; i < hblock; i++) {
        for (var j = 0; j < wblock; j++) {
            if (map.bombermap[i][j] == 1) {
                g.drawImage(kabe, j * squareSize, i * squareSize, squareSize, squareSize)
            } else if (map.bombermap[i][j] == 2) {
                g.drawImage(breakabe, j * squareSize, i * squareSize, squareSize, squareSize)
            } else if (map.bombermap[i][j] == 3) {
                g.drawImage(bomb, j * squareSize, i * squareSize, squareSize, squareSize)
            } else if (map.bombermap[i][j] == 4) {
                g.drawImage(item_wall, j * squareSize, i * squareSize, squareSize, squareSize)
            } else if (map.bombermap[i][j] == 5) {
                g.drawImage(item_number1, j * squareSize, i * squareSize, squareSize, squareSize)
            } else if (map.bombermap[i][j] == 6) {
                g.drawImage(item_number2, j * squareSize, i * squareSize, squareSize, squareSize)
            } else if (map.bombermap[i][j] == 7) {
                g.drawImage(item_number3, j * squareSize, i * squareSize, squareSize, squareSize)
            } else if (map.bombermap[i][j] == 8) {
                g.drawImage(item_number4, j * squareSize, i * squareSize, squareSize, squareSize)
            }
        }
    }

    //爆発の描画
    for (var h = 0; h < countmyN; h++) {
        for (var i = 0; i < player[h].bLimit; i++) {
            if (player[h].blastYX[i].length != 0) {
                g.drawImage(blast, player[h].blastYX[i][1] * squareSize, player[h].blastYX[i][0] * squareSize, squareSize, squareSize)
                //死亡判定
                if (Math.round(player[myN].gY / squareSize) == player[h].blastYX[i][0] && Math.round(player[myN].gX / squareSize) == player[h].blastYX[i][1]) {
                    player[myN].operable = 0;
                }

                //ボムの爆風の長さの限り上下左右に爆風が伸びてゆく
                //左
                for (var r = 1; r <= player[h].blastRange[i][0]; r++) {
                    if (map.bombermap[player[h].blastYX[i][0]][player[h].blastYX[i][1] - r] == 0 || map.bombermap[player[h].blastYX[i][0]][player[h].blastYX[i][1] - r] == 3) {
                        g.drawImage(blast, (player[h].blastYX[i][1] - r) * squareSize, player[h].blastYX[i][0] * squareSize, squareSize, squareSize)
                        //死亡判定
                        if (Math.round(player[myN].gY / squareSize) == player[h].blastYX[i][0] && Math.round(player[myN].gX / squareSize) == player[h].blastYX[i][1] - r) {
                            player[myN].operable = 0;
                        }
                        //壊れる壁なら消す
                    } else if (map.bombermap[player[h].blastYX[i][0]][player[h].blastYX[i][1] - r] == 2) {
                        map.bombermap[player[h].blastYX[i][0]][player[h].blastYX[i][1] - r] = 0
                    } else if (map.bombermap[player[h].blastYX[i][0]][player[h].blastYX[i][1] - r] == 4) {
                        map.bombermap[player[h].blastYX[i][0]][player[h].blastYX[i][1] - r] = getRandomInteger(5,8);
                        //get_item(myN);
                    } else {
                        break
                    }
                }
                //右
                for (var r = 1; r <= player[h].blastRange[i][1]; r++) {
                    if (map.bombermap[player[h].blastYX[i][0]][player[h].blastYX[i][1] + r] == 0 || map.bombermap[player[h].blastYX[i][0]][player[h].blastYX[i][1] + r] == 3) {
                        g.drawImage(blast, (player[h].blastYX[i][1] + r) * squareSize, player[h].blastYX[i][0] * squareSize, squareSize, squareSize)
                        //死亡判定
                        if (Math.round(player[myN].gY / squareSize) == player[h].blastYX[i][0] && Math.round(player[myN].gX / squareSize) == player[h].blastYX[i][1] + r) {
                            player[myN].operable = 0;
                        }
                        //壊れる壁なら消す
                    } else if (map.bombermap[player[h].blastYX[i][0]][player[h].blastYX[i][1] + r] == 2) {
                        map.bombermap[player[h].blastYX[i][0]][player[h].blastYX[i][1] + r] = 0
                    }else if (map.bombermap[player[h].blastYX[i][0]][player[h].blastYX[i][1] + r] == 4) {
                            map.bombermap[player[h].blastYX[i][0]][player[h].blastYX[i][1] + r] = getRandomInteger(5,8);
                            //get_item(myN);
                    } else {
                        break
                    }
                }
                //上
                for (var r = 1; r <= player[h].blastRange[i][2]; r++) {
                    if (map.bombermap[player[h].blastYX[i][0] - r][player[h].blastYX[i][1]] == 0 || map.bombermap[player[h].blastYX[i][0] - r][player[h].blastYX[i][1]] == 3) {
                        g.drawImage(blast, player[h].blastYX[i][1] * squareSize, (player[h].blastYX[i][0] - r) * squareSize, squareSize, squareSize)
                        //死亡判定
                        if (Math.round(player[myN].gY / squareSize) == player[h].blastYX[i][0] - r && Math.round(player[myN].gX / squareSize) == player[h].blastYX[i][1]) {
                            player[myN].operable = 0;
                        }
                        //壊れる壁なら消す
                    } else if (map.bombermap[player[h].blastYX[i][0] - r][player[h].blastYX[i][1]] == 2) {
                        map.bombermap[player[h].blastYX[i][0] - r][player[h].blastYX[i][1]] = 0
                    }else if (map.bombermap[player[h].blastYX[i][0] - r][player[h].blastYX[i][1]] == 4) {
                        map.bombermap[player[h].blastYX[i][0] - r][player[h].blastYX[i][1]] = getRandomInteger(5,8);
                        //get_item(myN);
                    } else {
                        break
                    }
                }
                //下
                for (var r = 1; r <= player[h].blastRange[i][3]; r++) {
                    if (map.bombermap[player[h].blastYX[i][0] + r][player[h].blastYX[i][1]] == 0 || map.bombermap[player[h].blastYX[i][0] + r][player[h].blastYX[i][1]] == 3) {
                        g.drawImage(blast, player[h].blastYX[i][1] * squareSize, (player[h].blastYX[i][0] + r) * squareSize, squareSize, squareSize)
                        //死亡判定
                        if (Math.round(player[myN].gY / squareSize) == player[h].blastYX[i][0] + r && Math.round(player[myN].gX / squareSize) == player[h].blastYX[i][1]) {
                            player[myN].operable = 0;
                        }
                        //壊れる壁なら消す
                    } else if (map.bombermap[player[h].blastYX[i][0] + r][player[h].blastYX[i][1]] == 2) {
                        map.bombermap[player[h].blastYX[i][0] + r][player[h].blastYX[i][1]] = 0
                    }else if (map.bombermap[player[h].blastYX[i][0]+r][player[h].blastYX[i][1]] == 4) {
                        map.bombermap[player[h].blastYX[i][0]+r][player[h].blastYX[i][1]] = getRandomInteger(5,8);
                        //get_item(myN);
                    } else{
                        break
                    }
                }
            }
        }
    }

    const sendOperable = (operable) => {
        socket.emit('operable', {
            operable: operable,
            playername: playerName,
            room_id: roomId,
            countmyN: countmyN
        });

        if (!operable) {
            // プレイヤーが死亡した場合に死亡判定を送信
            socket.emit('player_death', { playername: playerName });
        }
    };

    sendOperable(player[myN].operable);  // myN の後に sendOperable を呼び出す

    //プレイヤー描画
    for (var i = 0; i < countmyN; i++) {
        if (player[i].operable) {
            user.style.left = player[i].gX;
            user.style.top = player[i].gY;

            g.drawImage(user, player[i].gX, player[i].gY, rWidth, rHeight);
            g.fillStyle = "#ffffff";
            g.textAlign = 'center';
            g.fillText(player[i].name, player[i].gX + squareSize / 2, player[i].gY);
        }
    }

}

socket.on('game_end', (data) => {
    // URLのクエリパラメータからplayernameを取得
    const params = new URLSearchParams(window.location.search);
    const playerName = params.get('playername'); // playernameを取得

    // 'game_end' から取得したデータ（ここではoperableN）をログに出力
    console.log(`operableN: ${data.operableN}`);

    // ranking.html に遷移（プレイヤーネームもクエリパラメータとして追加）
    location.href = `ranking.html?room_id=${data.room_id}&playername=${playerName}`;
});
window.onkeydown = function (ev) {
    gKey[ev.keyCode] = 1;
}

window.onkeyup = function (ev) {
    gKey[ev.keyCode] = 0;
}


window.onload = function () {
    requestAnimationFrame(onPaint);

}


//アイテム

function get_item(player_number, item_type) {
    if (item_type == 5) {
        if (player[player_number].bRange < 5) player[player_number].bRange+=1;
        console.log("Power Up!");
    } else if (item_type == 6) {
        if (player[player_number].bRange > 1) player[player_number].bRange-=1;
        console.log("Power Down!");
    } else if (item_type == 7) {
        if (player[player_number].gS < 10) player[player_number].gS+=1;
        console.log("something for 7");
    } else if (item_type == 8) {
        if (player[player_number].gS > 2) player[player_number].gS-=1;
        console.log("something for 8");
    }
}


// アイテムID一覧（例：5〜8がアイテム）
const Position_item_list = [5, 6, 7, 8];
// グローバルor関数スコープなど状況によって適宜定義
let items = [];

function Position_item(player_number) {
    const playerTileX = Math.round(player[player_number].gX / squareSize);
    const playerTileY = Math.round(player[player_number].gY / squareSize);

    // items = [] は残しても良いが、そもそもこの変数が必要なければ省略可
    items = [];

    // マップからアイテム座標一覧を収集
    for (let y = 0; y < hblock; y++) {
        for (let x = 0; x < wblock; x++) {
            if (map.bombermap[y][x] >= 5 && map.bombermap[y][x] <= 8) {
                items.push([y, x]);
            }
        }
    }

    for (let i = 0; i < items.length; i++) {
        let itemY = items[i][0];
        let itemX = items[i][1];

        if (playerTileX === itemX && playerTileY === itemY) {
            // タイル番号を取得
            let item_type = map.bombermap[itemY][itemX];
            // これを引数に渡して効果を発動
            get_item(player_number, item_type);

            // タイルを0(通路)に戻す
            map.bombermap[itemY][itemX] = 0;
        }
    }
}