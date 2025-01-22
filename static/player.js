const bYutori = 0.9

class Player{
    bombLimiter = 180   //爆弾が爆発するまでのフレーム数（180で3秒）
    blastLimiter = 30   //爆風の持続フレーム数

    name;
   
    gN;
    gX;
    gY;
    gS = 3;     //プレイヤーの初期スピード、この数が座標にそのまま毎フレーム足されていく

    operable = 1;   //生きているか（0: 死, 1: 生）

    bLimit = 1; //爆弾を置ける最大数
    bCount = 0; //爆弾を置いている数

    bRange = 1; //爆風の長さ

    bYX = [[],[],[],[],[],[],[],[],[],[]];  //爆弾一つ一つの座標を記録（最大10）
    bTime = [0,0,0,0,0,0,0,0,0,0];    //爆弾一つ一つの時間を管理する
    nextBombID = 0;     //次の爆弾のID

    blastYX = [[],[],[],[],[],[],[],[],[],[]];  //爆風一つ一つの座標を記録
    blastTime = [0,0,0,0,0,0,0,0,0,0];
    blastRange = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]; //各爆風の実際に描画する縦横の距離

    // URLのクエリパラメータからroom_idを取得
    params = new URLSearchParams(window.location.search);
    roomId = params.get('room_id');

    // コンストラクタにplayername, gN, gX, gYを追加
    constructor(playername = 'hogehoge', gn, gx, gy) {
        this.name = playername;  // 名前を設定（デフォルト値）
        this.gN = gn;  // プレイヤー番号
        this.gX = gx;  // x座標
        this.gY = gy;  // y座標
    }


    setBomb() {
        if(!this.existBomb(Math.round(this.gY/squareSize),Math.round(this.gX/squareSize)) && this.bYX[this.nextBombID].length == 0 && this.bCount < this.bLimit) {
            //nextBombIDのbYXに、自機から一番近いマスを保存
            this.bYX[this.nextBombID] = [Math.round(this.gY/squareSize),Math.round(this.gX/squareSize)];
            this.bTime[this.nextBombID] = this.bombLimiter;
            this.bCount ++;
            //ボムが置かれた座標の値を３にする
            map.bombermap[this.bYX[this.nextBombID][0]][this.bYX[this.nextBombID][1]]=3
            socket.emit('changes_map', {
                cy: this.bYX[this.nextBombID][0], // 変更したマスの y 座標
                cx: this.bYX[this.nextBombID][1], // 変更したマスの x 座標
                mapData: 3 // そのマスの新しい値
            });

            gTimer += 16.67;
            if(this.nextBombID+1 == this.bLimit) {
                this.nextBombID = 0;
            }else{
                this.nextBombID++;
            }
        }
    }

    //爆弾・爆風のタイマー管理
    bTimer() {
        //置いている爆弾を探索し、その爆弾のタイマーを一律で減らしていく
        for(var i=0; i<this.bLimit;i++) {
            //爆弾が存在するならその爆弾のタイマーを減らす
            if(this.bYX[i].length != 0) {
                this.bTime[i] --;
                //タイマーが0を回ったら、爆発させる。
                if(this.bTime[i] < 0) {
                    this.bCount --;
                    this.bTime[i] = 0

                    let y = this.bYX[i][0]
                    let x = this.bYX[i][1]
                    //タイマーが0を回ったら当たり判定を消す
                    map.bombermap[y][x]=0
                    socket.emit('changes_map', {
                        cy: y, // 変更したマスの y 座標
                        cx: x, // 変更したマスの x 座標
                        mapData: 0, // そのマスの新しい値
                        room_id: roomId //ルームid
                    });

                    this.bYX[i] = [];
                    this.blastYX[i] = [y,x];
                    this.blastTime[i] = this.blastLimiter;

                    //この段階で実際の爆風の距離を確定させる
                    this.explotionRange(i)
                }
            }
        }    
        //置いている爆風を探索し、その爆弾のタイマーを一律で減らしていく
        for(var i=0; i<this.bLimit;i++) {
            //爆弾が存在するならその爆弾のタイマーを減らす
            if(this.blastYX[i].length != 0) {
                this.blastTime[i] --;
                //タイマーが0を回ったら、爆発させる。
                if(this.blastTime[i] < 0) {
                    this.blastTime[i] = 0
                    this.blastYX[i] = [];
                    this.blastRange[i] = [0,0,0,0];
                }
            }
        }    
    }

    //爆弾がその座標に存在するか
    existBomb(y,x) {
        for(var i=0; i<this.bLimit;i++) {
            if(this.bYX[i][0] == y && this.bYX[i][1] == x) {
                return true
            }    
        }
        return false
    }

    //その座標のプレーヤーが爆弾を踏んでいるか
    stepOnBomb(nIB) {

        for(var k=0; k<2; k++) {
            if(nIB[k].length == 0) {
                for(var i=0; i<this.bLimit;i++) {
                    if(this.bYX[i][0]-bYutori < this.gY/squareSize && this.gY/squareSize < this.bYX[i][0]+bYutori && this.bYX[i][1]-bYutori < this.gX/squareSize && this.gX/squareSize < this.bYX[i][1]+bYutori) {
                        if((nIB[0].length == 0 && nIB[1].length == 0) || !(JSON.stringify(nIB[0]) == JSON.stringify(this.bYX[i]) || JSON.stringify(nIB[1]) == JSON.stringify(this.bYX[i]))) {
                            nIB[k] = this.bYX[i]
                        }
                    }    
                }
            }else {
                if(!(nIB[k][0]-bYutori < this.gY/squareSize && this.gY/squareSize < nIB[k][0]+bYutori && nIB[k][1]-bYutori < this.gX/squareSize && this.gX/squareSize < nIB[k][1]+bYutori)) {
                    nIB[k] = []
                }
            }

        }
        return nIB
    }


    //実際の爆風の距離を計算
    explotionRange (i){
        //左
        for(var r=1; r<=this.bRange; r++) {
            this.blastRange[i][0] ++
            if(map.bombermap[this.blastYX[i][0]][this.blastYX[i][1]-r] == 1 || map.bombermap[this.blastYX[i][0]][this.blastYX[i][1]-r] == 2 || map.bombermap[this.blastYX[i][0]][this.blastYX[i][1]-r] == 4) {
                break
            }
        }
        //右
        for(var r=1; r<=this.bRange; r++) {
            this.blastRange[i][1] ++
            if(map.bombermap[this.blastYX[i][0]][this.blastYX[i][1]+r] == 1 || map.bombermap[this.blastYX[i][0]][this.blastYX[i][1]+r] == 2 || map.bombermap[this.blastYX[i][0]][this.blastYX[i][1]+r] == 4) {
                break
            }
        }
        //上
        for(var r=1; r<=this.bRange; r++) {
            this.blastRange[i][2] ++
            if(map.bombermap[this.blastYX[i][0]-r][this.blastYX[i][1]] == 1 || map.bombermap[this.blastYX[i][0]-r][this.blastYX[i][1]] == 2 || map.bombermap[this.blastYX[i][0]-r][this.blastYX[i][1]] == 4) {
                break
            }
        }
        //下
        for(var r=1; r<=this.bRange; r++) {
            this.blastRange[i][3] ++
            if(map.bombermap[this.blastYX[i][0]+r][this.blastYX[i][1]] == 1 || map.bombermap[this.blastYX[i][0]+r][this.blastYX[i][1]] == 2 || map.bombermap[this.blastYX[i][0]+r][this.blastYX[i][1]] == 4) {
                break
            }
        }
    }



}