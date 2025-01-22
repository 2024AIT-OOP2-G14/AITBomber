class Map{
    //フィールドとしてもっておく
    bombermap = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ]

    itemmap = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ]

    constructor(WIDTH,HEIGHT){
        //thisの設定、プロパティの初期化
        this.WIDTH = WIDTH;
        this.HEIGHT = HEIGHT;
    }

    //壊れる壁を生成
    GenerateBreakWall(){
        //分母、分子（好きに変えていいよ）
        const den=5,div=1
        //壁内側探索
        for(var i=1; i<hblock; i++){
            for(var j=1; j<wblock; j++){
                //四方の角だけ生成しないようにする（複数プレイヤー置けるようになったら条件変えてもいいかも）
                if((!(i==1&&(j==1||j==2||j==wblock-3||j==wblock-2)))&&(!(i==2&&(j==1||j==wblock-2)))&&(!(i==hblock-3&&(j==1||j==wblock-2)))&&(!(i==hblock-2&&((j==1||j==2||j==wblock-3||j==wblock-2))))){
                    //何もないところにden分のdivの確率で壁を生成する
                    if(this.bombermap[i][j]==0){
                    if(Math.random()*den<=div){
                        this.bombermap[i][j] = 2
                    }
                    }
                }
            }
        }
    }

    //アイテムが入った壁を生成
    iteminWall(){
        //分母、分子（好きに変えていいよ）
        const den=5,div=3
        //壁内側探索
        for(var i=1; i<hblock; i++){
            for(var j=1; j<wblock; j++){
                //四方の角だけ生成しないようにする（複数プレイヤー置けるようになったら条件変えてもいいかも）
                if((!(i==1&&(j==1||j==2||j==wblock-3||j==wblock-2)))&&(!(i==2&&(j==1||j==wblock-2)))&&(!(i==hblock-3&&(j==1||j==wblock-2)))&&(!(i==hblock-2&&((j==1||j==2||j==wblock-3||j==wblock-2))))){
                    //何もないところにden分のdivの確率で壁を生成する
                    if(this.bombermap[i][j]==0){
                    if(Math.random()*den<=div){
                        this.bombermap[i][j]=4
                        this.itemmap[i][j] = getRandomInteger(5,8);
                        console.log(this.itemmap[i][j])
                    }
                    }
                }
            }
        }     
    }

    //(x,y)の座標が壁の中にあるか判定（boolean）
    isInsideWall(x,y,nowisIB) {
        let iTW = false
        //壁全探索
        for(var i=0; i<hblock; i++){
            for(var j=0; j<wblock; j++){
                if(this.bombermap[i][j]>=1&&this.bombermap[i][j]<=4){
                    //ある一つの壁の内側に、与えられた(x,y)が入っているか(0.9ではなく1にしてしまうと1pxの誤差で道に入れないので、ゆとりを持たせるために0.9にしている。)
                    if((j-bYutori)*(squareSize) < x && x < (j+bYutori)*squareSize && (i-bYutori)*squareSize < y && y < (i+bYutori)*squareSize) {

                        //壁なら
                        if(this.bombermap[i][j] == 1 || this.bombermap[i][j] == 2 || this.bombermap[i][j] == 4) {
                            //console.log("wall")
                            iTW = true
                        }
                        

                        //移動前の座標以外の爆弾は壁とみなす（踏んでる爆弾があり、かつその爆弾以外を踏もうとしてるなら、それは壁）
                        for(var k=0; k<2; k++) {
                            if( !(nowisIB[0].length != 0 && nowisIB[1].length != 0) && nowisIB[k].length != 0 && !(i == nowisIB[k][0] &&  j == nowisIB[k][1] ) && this.bombermap[i][j] == 3) {
                                //console.log("inBomb")
                                iTW = true
                            }
                        }
                        if((nowisIB[0].length == 0 && nowisIB[1].length == 0 ) && this.bombermap[i][j] == 3) {
                            //console.log("outBomb")
                            iTW = true
                        }
                    }
                }
            }
        }
        return iTW
    }
}