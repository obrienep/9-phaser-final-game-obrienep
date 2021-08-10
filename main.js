var config = {
    type: Phaser.WebGL,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 500},
            debug: true
        }
    },
    scene: {
        key: 'main',
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var rope;
var map;
var player, scorpion;
var cursors;
var groundLayer, coinLayer, backgroundLayer, ladderLayer, holeLayer;
var text;
var score = 0;
var onLadder = false;
var stepLimit = 100;
var direction = 1;

function preload() {
    // map made with Tiled in JSON format
    this.load.tilemapTiledJSON('map', 'assets/map.json');
    // tiles in spritesheet 
    this.load.spritesheet('pitfalltiles', 'assets/pitfalltiles.png', {frameWidth: 70, frameHeight: 70});
    // simple coin image
    this.load.image('coin', 'assets/goldbar.png');

    this.load.image('laddertile', 'assets/laddertile.png');
    // player animations
    this.load.atlas('player', 'assets/playertest.png', 'assets/player.json');
    this.load.image('background', 'assets/background.png');
    this.load.spritesheet('scorpion', 'assets/scorpion.png', {frameWidth: 70, frameHeight: 70});
}

function create() {
    // load the map 
    map = this.make.tilemap({key: 'map'});

    // tiles for the ground layer
    //var groundTiles = map.addTilesetImage('tiles');
    this.add.image(400, 300, 'background');
    this.add.image(1200, 300, 'background');
    this.add.image(2000, 300, 'background');
    var groundTiles = map.addTilesetImage('pitfalltiles');
    // create the ground layer
    groundLayer = map.createDynamicLayer('World', groundTiles, 0, 0);
    // the player will collide with this layer
    groundLayer.setCollisionByExclusion([-1]);

    // coin image used as tileset
    var coinTiles = map.addTilesetImage('coin');
    // add coins as tiles
    coinLayer = map.createDynamicLayer('Coins', coinTiles, 0, 0);

    var backgroundTiles = groundTiles;
    backgroundLayer = map.createDynamicLayer('Background', backgroundTiles, 0, 0);

    var LadderTiles = map.addTilesetImage('laddertile');
    ladderLayer = map.createDynamicLayer('Ladder', LadderTiles, 0, 0);
    holeLayer = map.createDynamicLayer('HoleLayer', groundTiles, 0, 0);

    // set the boundaries of our game world
    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;


    // create the player sprite    
    player = this.physics.add.sprite(10, 200, 'player');
    player.setBounce(0); // our player will bounce from items
    player.setCollideWorldBounds(true); // don't go out of the map    
    
    // small fix to our player images, we resize the physics body object slightly
    player.body.setSize(player.width, player.height-8);
    player.setScale(.8);
    
    // player will collide with the level tiles 
    this.physics.add.collider(groundLayer, player);

    coinLayer.setTileIndexCallback(1, collectCoin, this);
    // when the player overlaps with a tile with index 1
    // will be called    
    this.physics.add.overlap(player, coinLayer);

    ladderLayer.setTileIndexCallback(19, ladderClimb, this);

    this.physics.add.overlap(player, ladderLayer);

    scorpion = this.physics.add.sprite(100, 200, 'scorpion');
    scorpion.setBounce(0);
    scorpion.setCollideWorldBounds(true);
    scorpion.setScale(.7);
    scorpion.stepLimit = 0;
    this.physics.add.overlap(player, scorpion, killPlayer);
    this.physics.add.collider(groundLayer, scorpion);


    // player walk animation
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNames('player', {prefix: 'p1_walk', start: 1, end: 6, zeroPad: 2}),
        frameRate: 15,
        repeat: -1
    });
    // idle with only one frame, so repeat is not neaded
    this.anims.create({
        key: 'idle',
        frames: [{key: 'player', frame: 'p1_stand'}],
        frameRate: 10,
    });
    this.anims.create({
        key: 'climb',
        frames: this.anims.generateFrameNames('player', {prefix: 'p1_walk', start: 7, end: 8, zeroPad: 2}),
        frameRate: 10,
        repeat: -1,
    });
    this.anims.create({
        key: 'jump',
        frames: this.anims.generateFrameNames('player', {prefix: 'p1_walk', start: 9, end: 10, zeroPad: 2}),
        frameRate: 1,
        repeat: -1,
    });
    this.anims.create({
        key:'scorpionwalk',
        frames: this.anims.generateFrameNames('scorpion', {prefix: 'sprite', start:1, end: 2, zeroPad: 2}),
        frameRate: 5,
        repeat: -1,
    });


    cursors = this.input.keyboard.createCursorKeys();

    // set bounds so the camera won't go outside the game world
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // make the camera follow the player
    this.cameras.main.startFollow(player);

    // set background color, so the sky is not black    
    this.cameras.main.setBackgroundColor('#ccccff');

    // this text will show the score
    text = this.add.text(20, 570, '0', {
        fontSize: '20px',
        fill: '#ffffff'
    });
    // fix the text to the camera
    text.setScrollFactor(0);


}

// this function will be called when the player touches a coin
function collectCoin(sprite, tile) {
    coinLayer.removeTileAt(tile.x, tile.y); // remove the tile/coin
    score++; // add 10 points to the score
    text.setText(score); // set the text to show the current score
    return false;
}

function ladderClimb(sprite, tile) {
    if (cursors.up.isDown)
    {
        player.body.setVelocityY(-150)
        player.anims.play('climb', true);
        onLadder = true;
    } else {
        onLadder = false;
        player.setVelocityX(-200);
    }
    return false;
}

function killPlayer(sprite, tile) {
    //coinLayer.removeTileAt(tile.x, tile.y); // remove the tile/coin
    score++; // add 10 points to the score
    text.setText(score); // set the text to show the current score
    return false;
}

function update(time, delta) {
    
    if (cursors.left.isDown && (onLadder == false))
    {
        player.body.setVelocityX(-200);
        //player.anims.play('walk', true); // walk left
        player.flipX = true; // flip the sprite to the left
        if (player.body.onFloor()) {
            player.anims.play('walk', true);
        }
    }
    else if (cursors.right.isDown && (onLadder == false))
    {
        player.body.setVelocityX(200);
        player.flipX = false; // use the original sprite looking to the right
        if (player.body.onFloor()) {
            player.anims.play('walk', true);
        }

    } else if (!cursors.up.isDown) {
        player.body.setVelocityX(0);
        player.anims.play('idle', true);
    }
    // jump 
    if (cursors.up.isDown && player.body.onFloor())
    {
        player.body.setVelocityY(-325);        
    }

    if (player.body.onFloor()) {
        onLadder = false;
    }

    if(!player.body.onFloor() && onLadder == false) {
        player.anims.play('jump', true);
    }

    if (scorpion.stepLimit < 100) {
        scorpion.body.velocity.x = 3 * direction;
        scorpion.stepLimit++;
        
    } else {
        direction = direction * -1;
        scorpion.stepLimit = 0;
        scorpion.flipX = !scorpion.flipX;
    }



}