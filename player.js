class Player{
    bombLimiter = 180   //爆弾が爆発するまでのフレーム数（180で3秒）
    blastLimiter = 30   //爆風の持続フレーム数

    gN;
    gX;
    gY;
    gS = 3;     //プレイヤーの初期スピード、この数が座標にそのまま毎フレーム足されていく

    operable = 1;   //操作できるか
    visible = 1;    //見えるか

    bLimit = 1; //爆弾を置ける最大数
    bCount = 0; //爆弾を置いている数

    bRange = 1; //爆風の長さ

    bYX = [[],[],[],[],[],[],[],[],[],[]];  //爆弾一つ一つの座標を記録（最大10）
    bTime = [0,0,0,0,0,0,0,0,0,0];    //爆弾一つ一つの時間を管理する
    nextBombID = 0;     //次の爆弾のID

    blastYX = [[],[],[],[],[],[],[],[],[],[]];  //爆風一つ一つの座標を記録
    blastTime = [0,0,0,0,0,0,0,0,0,0];

    constructor(gn,gx,gy){
        this.gN = gn;
        this.gX = gx;
        this.gY = gy;
    }

    setBomb() {
        if(!this.existBomb(Math.round(this.gY/squareSize),Math.round(this.gX/squareSize)) && this.bYX[this.nextBombID].length == 0 && this.bCount < this.bLimit) {
            //nextBombIDのbYXに、自機から一番近いマスを保存
            this.bYX[this.nextBombID] = [Math.round(this.gY/squareSize),Math.round(this.gX/squareSize)];
            this.bTime[this.nextBombID] = this.bombLimiter;
            this.bCount ++;

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

                    this.bYX[i] = [];
                    this.blastYX[i] = [y,x];
                    this.blastTime[i] = this.blastLimiter;
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

}