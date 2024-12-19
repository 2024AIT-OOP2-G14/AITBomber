"use strict";

let gKey = new Uint8Array( 0x100 );
let gTimer;

//1マスの大きさ(縦横共通)
const squareSize = 16 * 2

//画面サイズ
const WIDTH = squareSize * 15;  
const HEIGHT = squareSize * 13;

//プレイヤー情報
const user = document.createElement('img');

//プレイヤー番号
let gN = 0;

//プレイヤーのスピード、この数が座標にそのまま毎フレーム足されていく
const gSpeed = 3;

//プレイヤー座標
let gx;
let gy;
//プレイヤー番号により開始位置を変える(0:左上, 1:右上, 2:左下, 3:右下)
switch (gN) {
    case 0:
        gx = squareSize;
        gy = squareSize;
        break;
    case 1:
        gx = WIDTH-2*squareSize;
        gy = squareSize;
        break;
    case 2:
        gx = squareSize;
        gy = HEIGHT-2*squareSize;
        break;
    case 3:
        gx = WIDTH-2*squareSize;
        gy = HEIGHT-2*squareSize;
        break;
}

//プレイヤーの画像
user.src = "image/hito.png";

//プレイヤーの大きさを決める
let orgWidth  = user.width;     // 元画像の横幅を保存
let orgHeight = user.height;    // 元画像の高さを保存
let rWidth = squareSize         // 任意の数を入れることで、プレイヤーの大きさが決定される
let rHeight = orgHeight * (rWidth / orgWidth);  // rWidthに対して同じ比で高さも決定する。
user.style.position = "absolute";   //画面左上を(0,0)とした絶対位置でプレイヤーを配置するという状態

let operable = 1;   //操作できるか
let visible = 1;    //見えるか

function onPaint ()
{
    //frameParSecond管理（だいたい60fpsくらいになるはず）
    if( !gTimer ) {
        gTimer = performance.now();
    }
    if( gTimer + 16.67 < performance.now() ) {
        gTimer += 16.67;

        //各キーが押し込まれたら、プレイヤーの座標が毎フレーム更新される
        if(operable) {
            gx -= gKey[65] * gSpeed;
            gx += gKey[68] * gSpeed;
            gy -= gKey[87] * gSpeed;
            gy += gKey[83] * gSpeed;
        }
    }


//画面端の壁判定
    if(gx < squareSize) {
        gx += gSpeed;
    }
    if(gx > WIDTH - 2*squareSize) {
        gx -= gSpeed;
    }
    if(gy < squareSize ) {
        gy += gSpeed;
    }
    if(gy > HEIGHT - 2*squareSize) {
        gy -= gSpeed;
    }

    draw();
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


    //プレイヤー描画
    if(visible) {

        user.style.left = gx;
        user.style.top = gy;
        g.drawImage(user, gx, gy, rWidth, rHeight);
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