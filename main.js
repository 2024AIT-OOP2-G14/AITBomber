"use strict";

let gKey = new Uint8Array( 0x100 );
let gTimer;

//1マスの大きさ(縦横共通)
const squareSize = 16 * 2

//縦横ブロック数
const wblock=15;
const hblock=13;

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
//爆弾情報
const bomb = document.createElement('img');
//爆風情報
const blast = document.createElement('img');

//プレイヤー番号
let myN = 0;

//プレイヤー番号により開始位置を変え、プレイヤークラスを定義(0:左上, 1:右上, 2:左下, 3:右下)
switch (myN) {
    case 0:
        var me = new Player(myN,squareSize,squareSize);
        break;
    case 1:
        var me = new Player(myN,WIDTH-2*squareSize,squareSize);
        break;
    case 2:
        var me = new Player(myN,squareSize,HEIGHT-2*squareSize);
        break;
    case 3:
        var me = new Player(myN,WIDTH-2*squareSize,HEIGHT-2*squareSize);
        break;
}

let rWidth = squareSize;         // 任意の数を入れることで、プレイヤーの大きさが決定される
let rHeight;

//プレイヤー画像のスケーリングと読み込み
user.onload = function() {
    let orgWidth  = user.width;     // 元画像の横幅を保存
    let orgHeight = user.height;    // 元画像の高さを保存
    rHeight = orgHeight * (rWidth / orgWidth);  // rWidthに対して同じ比で高さも決定する。
    user.style.position = "absolute";   //画面左上を(0,0)とした絶対位置でプレイヤーを配置するという状態
};

//プレイヤーの画像
user.src = "image/hito.png";

//壁画像
kabe.src = "image/kabe.png";

//爆弾画像
bomb.src = "image/bomb.png";

//爆風画像
blast.src = "image/blast.png";

//マップ生成
var map = new Map(wblock,hblock);

function onPaint ()
{
    //frameParSecond管理（60fps）

    //初回は実時間をgTimerに送る
    if( !gTimer ) {
        gTimer = performance.now();
    }
    //16.67ミリ秒たったら画面を更新することで、60fpsよりフレームレートが高い環境でも約60fpsで動く(16.67ms/f = 1/1.667f/s = 59.9988002f/s ≒ 60f/s)
    if( gTimer + 16.67 < performance.now() ) {
        gTimer += 16.67;

        //各キーが押し込まれたら、プレイヤーの座標が毎フレーム更新される
        //斜め移動をしながら壁にぶつかった時、壁沿いに動けるように、上下左右それぞれで壁判定を行う
        if(me.operable) {
            me.gX -= gKey[65] * me.gS;    //g[65]=1（aキーが押し込まれた）
            if (map.isInsideWall(me.gX,me.gY,map.bombermap)){me.gX += gKey[65] * me.gS} //ダメならもどす

            me.gX += gKey[68] * me.gS;
            if (map.isInsideWall(me.gX,me.gY,map.bombermap)){me.gX -= gKey[68] * me.gS}

            me.gY -= gKey[87] * me.gS;
            if (map.isInsideWall(me.gX,me.gY,map.bombermap)){me.gY += gKey[87] * me.gS}

            me.gY += gKey[83] * me.gS;
            if (map.isInsideWall(me.gX,me.gY,map.bombermap)){me.gY -= gKey[83] * me.gS}
            
            //スペースキーが押し込まれたらボムを置く
            console.log(spaceTime)
            if(spaceTime>0){
                spaceTime--;
            }

            if(gKey[32]==1 && spaceTime==0) {
                me.setBomb();
                spaceTime = spaceKeyRecharge;
            }
        }
        
        //タイマー進める
        me.bTimer();

        draw();
    }
    requestAnimationFrame( onPaint );
}

//描画
function draw()
{
    let g = document.getElementById("main").getContext("2d");

    //大外の灰色壁描画
    g.fillStyle = "#696969";
    g.fillRect( 0, 0, WIDTH, HEIGHT);

    //緑色地面描画
    g.fillStyle = "#006400";
    g.fillRect( squareSize, squareSize, WIDTH-2*squareSize, HEIGHT-2*squareSize);

    //壁or爆弾の描画
    for(var i=0; i<hblock; i++){
        for(var j=0; j<wblock; j++){
            if(map.bombermap[i][j]==1){
                g.drawImage(kabe, j*squareSize, i*squareSize, squareSize, squareSize)
            }else if(me.existBomb(i,j)){
                g.drawImage(bomb, j*squareSize, i*squareSize, squareSize, squareSize)
            }
        }
    }

    //爆発の描画
    for(var i=0; i<me.bLimit;i++) {
        if(me.blastYX[i].length != 0) {
            g.drawImage(blast, me.blastYX[i][1]*squareSize, me.blastYX[i][0]*squareSize, squareSize, squareSize)
            //ボムの爆風の長さの限り上下左右に爆風が伸びてゆく（）
            //上
            for(var r=1; r<=me.bRange; r++) {
                if(map.bombermap[me.blastYX[i][0]][me.blastYX[i][1]-r] == 0) {
                    g.drawImage(blast, (me.blastYX[i][1]-r)*squareSize, me.blastYX[i][0]*squareSize, squareSize, squareSize)
                }else {
                    break;
                }
            }
            for(var r=1; r<=me.bRange; r++) {
                //下
                if(map.bombermap[me.blastYX[i][0]][me.blastYX[i][1]+r] == 0) {
                    g.drawImage(blast, (me.blastYX[i][1]+r)*squareSize, me.blastYX[i][0]*squareSize, squareSize, squareSize)
                }else {
                    break;
                }
            }
            for(var r=1; r<=me.bRange; r++) {
                //左
                if(map.bombermap[me.blastYX[i][0]-r][me.blastYX[i][1]] == 0) {
                    g.drawImage(blast, me.blastYX[i][1]*squareSize, (me.blastYX[i][0]-r)*squareSize, squareSize, squareSize)
                }else {
                    break;
                }
            }
            for(var r=1; r<=me.bRange; r++) {
                //右
                if(map.bombermap[me.blastYX[i][0]+r][me.blastYX[i][1]] == 0) {
                    g.drawImage(blast, me.blastYX[i][1]*squareSize, (me.blastYX[i][0]+r)*squareSize, squareSize, squareSize)
                }else {
                    break;
                }
            }
        }
    }

    //プレイヤー描画
    if(me.visible) {
        user.style.left = me.gX;
        user.style.top = me.gY;
        g.drawImage(user, me.gX, me.gY, rWidth, rHeight);
    }
    
}

window.onkeydown = function(ev)
{
    gKey[ev.keyCode] = 1;
}

window.onkeyup = function(ev)
{
    gKey[ ev.keyCode ] = 0;
}


window.onload = function()
{
    requestAnimationFrame( onPaint );
}