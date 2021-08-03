class Scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame")
    }

    preload() {
        this.load.image('food', "assets/images/food.png");
        this.load.image('body', "assets/images/body.png");
    }

    create() {
        this.add.text(20, 20, "Loading game...");
        this.scene.start("playGame");
    }

}