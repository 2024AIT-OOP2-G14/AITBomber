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

    constructor(WIDTH,HEIGHT){
        //thisの設定、プロパティの初期化
        this.WIDTH = WIDTH;
        this.HEIGHT = HEIGHT;
    }

    //壊れる壁を生成
    GenerateBreakWall(){
        //分母、分子（好きに変えていいよ）
        const den=5,div=2
        //壁内側探索
        for(var i=1; i<hblock; i++){
            for(var j=1; j<wblock; j++){
                //四方の角だけ生成しないようにする（複数プレイヤー置けるようになったら条件変えてもいいかも）
                if((!(i==1&&(j==1||j==2||j==wblock-3||j==wblock-2)))&&(!(i==2&&(j==1||j==wblock-2)))&&(!(i==hblock-3&&(j==1||j==wblock-2)))&&(!(i==hblock-2&&((j==1||j==2||j==wblock-3||j==wblock-2))))){
                    //何もないところにden分のdivの確率で壁を生成する
                    if(this.bombermap[i][j]==0){
                    if(Math.random()*den<=div){
                        this.bombermap[i][j]=2
                    }
                    }
                }
            }
        }     
    }

    //(x,y)の座標が壁の中にあるか判定（boolean）
    isInsideWall(x,y,nowisIW) {
        let isIW = false
        //壁全探索
        for(var i=0; i<hblock; i++){
            for(var j=0; j<wblock; j++){
                if(this.bombermap[i][j]>=1){
                    //ある一つの壁の内側に、与えられた(x,y)が入っているか(0.9ではなく1にしてしまうと1pxの誤差で道に入れないので、ゆとりを持たせるために0.9にしている。)
                    if((j-0.9)*(squareSize) < x && x < (j+0.9)*squareSize && (i-0.9)*squareSize < y && y < (i+0.9)*squareSize) {
                        //今埋まっているかつ次いる埋まっている場所が爆弾ならば壁がない判定にする
                        if(!(nowisIW&&(this.bombermap[i][j]==3))){
                            isIW = true
                        }                        
                    }
                }
            }
        }
        return isIW
    }
}