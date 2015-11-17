'use strict';

var gridSize = 25, gridCellSize, gridStyle;
var platforms, disappeared, candies;
var platform_physics_group, player_collision_group, player_recovery_group;
var player, platforms_in_contact = [], recovering_platforms = [];
var disappear_ratio = 1/30, reappear_ratio = 1/15;
var game, cursors;

//FIXME: Colocar ésto en algun lado.

/*
circleAsset = game.add.bitmapData(400, 400);
circleAsset.ctx.fillStyle = '#888888';
circleAsset.ctx.arc(200, 200, 200, 0, Math.PI*2);
circleAsset.ctx.fill();
circleAsset.ctx.closePath();
circleSprite = game.add.sprite(200, 150, circleAsset);
*/

var styles = [
    {
        'platform': {
            'color': ['#a6aaad', '#e0b872', '#a3a4a6', '#d9bec3'],
            'border': 'fill'
        },
        'player': {
            'color': '#ffffff',
            'border': '#000000'
        },
        'background': '#e2e1dc'
    }
];

var CreateGridAsset = function(width, height, borderColor, fillColor) {
    if(Array.isArray(fillColor)) fillColor = game.rnd.pick(fillColor);
    var assetName = game.rnd.uuid();
    var asset = game.add.bitmapData(width, height);
    asset.ctx.beginPath();
    asset.ctx.fillStyle = fillColor;
    if(borderColor !== 'fill') {
        asset.ctx.lineWidth = game.rnd.integerInRange(5, 10);
        asset.ctx.strokeStyle = borderColor;
    }
    asset.ctx.fillRect(0, 0, width, height);
    if(borderColor !== 'fill') asset.ctx.strokeRect(0, 0, width, height);
    asset.ctx.closePath();
    asset.generateTexture(assetName);
    return assetName;
};

var GenerateGrid = function() {
    //Definir estilo de mapa.

    game.stage.backgroundColor = gridStyle['background'];
    document.body.style.backgroundColor = gridStyle['background'];
    var maxPlatformWidth = 5,
        minPlatformWidth = 1,
        totalElements = game.rnd.integerInRange(15, 20),
        playerRandomSize = game.rnd.integerInRange(-5, 5),
        playerAsset = CreateGridAsset(gridCellSize + playerRandomSize,
            gridCellSize + playerRandomSize,
            gridStyle['player']['border'], gridStyle['player']['color']);

    var columns = 4, rows = 4;

    //Definir posicion de plataformas.


    platforms = game.add.group();
    disappeared = game.add.group();
    platforms.enableBody = true;
    platforms.physicsBodyType = Phaser.Physics.P2JS;

    for(var i = 0; i < columns; i++) {
        for(var j = 0; j < rows; j++) {
            var elementsOnDivision = game.rnd.integerInRange(0, 2);
            for (var k = 0; k < elementsOnDivision; k++) {
                var platformSize = game.rnd.integerInRange(1, 4);
                var horizontalPosition = ((5 * i) + 6 - platformSize) * gridCellSize;
                var verticalPosition = ((5 * j) + 1 + game.rnd.integerInRange(0, 5)) * gridCellSize;
                var platformAsset = CreateGridAsset(platformSize * gridCellSize
                    , gridCellSize * game.rnd.integerInRange(1, 3),
                    gridStyle['platform']['border'], gridStyle['platform']['color']);
                var rotation = Math.PI * game.rnd.pick([-0.25, 0, 0.25])
                var platform = platforms.create(horizontalPosition, verticalPosition, platformAsset);
                platform.anchor.x = 0.5;
                platform.anchor.y = 0.5;
                platform.body.immovable = true;
                platform.rotation = rotation;
                platform.body.rotation = rotation;
                platform.body.kinematic = false;
                platform.body.dynamic = false;
                platform.body.setCollisionGroup(platform_physics_group);
                platform.body.collides(player_collision_group);
                platform.platform_size = platformSize;
                if(platforms.children.length == totalElements) break;
            }
            if(platforms.children.length == totalElements) break;
        }
        if(platforms.children.length == totalElements) break;
    }

    //Creamos los "dulcecitos"
};

var CreatePlayer = function() {

    var playerRandomSize = game.rnd.integerInRange(-5, 5);
    var playerAsset = CreateGridAsset(gridCellSize + playerRandomSize,
        gridCellSize + playerRandomSize,
        gridStyle['player']['border'], gridStyle['player']['color']);

    player = game.add.sprite(13*gridCellSize, 7*gridCellSize, playerAsset);
    game.physics.p2.enable(player, false);
    player.can_jump = false;
    player.body.collideWorldBounds = false;
    player.body.setCollisionGroup(player_collision_group);
    player.body.collides(platform_physics_group, function(player, collided) {

    }, this);
    player.body.onBeginContact.add(function (collided) {
        console.log('player beginContact');
        if(platforms_in_contact.indexOf(collided.sprite) == -1)
            platforms_in_contact.push(collided.sprite);
        player.can_jump = true;
        console.log('platforms_in_contact', platforms_in_contact);
    });
    player.body.onEndContact.add(function (collided) {
        var elementIdx = platforms_in_contact.indexOf(collided.sprite);
        if(elementIdx > -1){
            var recovered_elements = platforms_in_contact.splice(elementIdx, 1);
            recovering_platforms.push(recovered_elements[0]);
        }
        player.can_jump = false;
        console.log(recovering_platforms);
    });

};

var CreateGame = function() {
    gridCellSize = game.width / gridSize;
    gridStyle = styles[0];
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.setImpactEvents(true);
    game.physics.p2.gravity.y = 500;
    cursors = game.input.keyboard.createCursorKeys();
    player_collision_group = game.physics.p2.createCollisionGroup();
    player_recovery_group = game.physics.p2.createCollisionGroup();
    platform_physics_group = game.physics.p2.createCollisionGroup();
    CreatePlayer();
    GenerateGrid();
    game.physics.p2.updateBoundsCollisionGroup();
};

game = new Phaser.Game(
    700, 700, Phaser.AUTO, document.getElementById('mangata'), {
        create: CreateGame,
        update: function() {

            for(var i = 0, cnt = platforms_in_contact.length; i < cnt; i++) {
                var plat = platforms_in_contact[i];
                if(plat.alpha > 0)
                    plat.alpha -= (disappear_ratio * (5 - plat.platform_size));
                else {
                    plat.alpha = 0;
                    plat.body.setCollisionGroup(player_recovery_group);
                }
            }

            for(var i = 0, cnt = recovering_platforms.length; i < cnt; i++) {
                var plat = recovering_platforms[i];
                if(plat.alpha < 1) {
                    if(!plat.getBounds().contains(player.x, player.y)){
                        plat.alpha += (reappear_ratio * (5 - plat.platform_size));
                    }
                } else {
                    plat.alpha = 1;
                    recovering_platforms.splice(i, 1);
                    cnt = recovering_platforms.length;
                    plat.body.setCollisionGroup(platform_physics_group);
                    i--;
                }
            }

            if(cursors.left.isDown) {
                player.body.velocity.x = -200;
            } else if(cursors.right.isDown) {
                player.body.velocity.x = 200;
            } else {
                player.body.velocity.x = 0;
            }

            if(cursors.up.isDown && player.can_jump == true) {
                player.body.velocity.y = -500;
            }

            if(player.position.y > game.height) {
                game.state.restart(true, true);
            }

            if(player.position.x < -1*player.width || player.position.x > game.width) {
                player.position.x = 13*gridCellSize;
                player.position.y = 7*gridCellSize;
            }
        }
    }
);
