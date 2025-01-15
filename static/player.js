class Player{
    bombLimiter = 180   //爆弾が爆発するまでのフレーム数（180で3秒）
    blastLimiter = 30   //爆風の持続フレーム数

    name = 'hogehoge';

    gN;
    gX;
    gY;
    gS = 3;     //プレイヤーの初期スピード、この数が座標にそのまま毎フレーム足されていく

    operable = 1;   //生きているか（0: 死, 1: 生）

    bLimit = 3; //爆弾を置ける最大数
    bCount = 0; //爆弾を置いている数

    bRange = 2; //爆風の長さ

    bYX = [[],[],[],[],[],[],[],[],[],[]];  //爆弾一つ一つの座標を記録（最大10）
    bTime = [0,0,0,0,0,0,0,0,0,0];    //爆弾一つ一つの時間を管理する
    nextBombID = 0;     //次の爆弾のID

    blastYX = [[],[],[],[],[],[],[],[],[],[]];  //爆風一つ一つの座標を記録
    blastTime = [0,0,0,0,0,0,0,0,0,0];
    blastRange = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]; //各爆風の実際に描画する縦横の距離

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
            //ボムが置かれた座標の値を３にする
            map.bombermap[this.bYX[this.nextBombID][0]][this.bYX[this.nextBombID][1]]=3
            gTimer += 16.67;
            if(this.nextBombID+1 == this.bLimit) {
                this.nextBombID = 0;
            }else{
                this.nextBombID++;
            }
        }
    }

    //爆弾・爆風のタイマー管理
    bTimer(m) {
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

    //実際の爆風の距離を計算
    explotionRange (i){
        //左
        for(var r=1; r<=this.bRange; r++) {
            this.blastRange[i][0] ++
            if(map.bombermap[this.blastYX[i][0]][this.blastYX[i][1]-r] != 0) {
                break
            }
        }
        //右
        for(var r=1; r<=this.bRange; r++) {
            this.blastRange[i][1] ++
            if(map.bombermap[this.blastYX[i][0]][this.blastYX[i][1]+r] != 0) {
                break
            }
        }
        //上
        for(var r=1; r<=this.bRange; r++) {
            this.blastRange[i][2] ++
            if(map.bombermap[this.blastYX[i][0]-r][this.blastYX[i][1]] != 0) {
                break
            }
        }
        //下
        for(var r=1; r<=this.bRange; r++) {
            this.blastRange[i][3] ++
            if(map.bombermap[this.blastYX[i][0]+r][this.blastYX[i][1]] != 0) {
                break
            }
        }
    }

}