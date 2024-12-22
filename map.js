const Map=class{
    constructor(WIDTH,HEIGHT){
        //thisの設定、プロパティの初期化
        this.WIDTH = WIDTH;
        this.HEIGHT = HEIGHT;
    }
    getbombmap(){
        var bombermap = [];
        for(var i=0; i<this.HEIGHT; i++){
            bombermap[i]=[];
            for(var j=0; j<this.WIDTH; j++){
                if(i*j==0||i==this.HEIGHT-1||j==this.WIDTH-1||(i%2==0&&j%2==0)){
                    bombermap[i][j] = 1;
                }else{
                    bombermap[i][j] = 0;
                }
            }
        }
        return bombermap;
    }
}