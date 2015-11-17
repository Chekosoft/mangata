'use strict';

var gridSize = 25;
var gridCellSize;
var platforms;
var disappeared;
var candies;
var playa;
var cursors;
var ratio = 1/30;
var twiceratio = 1/15;
var contactBody = null;
var overlappedBody = null;
var playerCollisionGroup, platformCollisionGroup, platformDisappearedGroup;
var circleAsset, circleSprite;

var styles = [
    {
        'platform': {
            'color': ['#a6aaad', '#e0b872', '#a3a4a6', '#d9bec3'],
            'border': 'fill'
        },
        'player': {
            'color': '#fff',
            'border': '#000'
        },
        'background': '#e2e1dc'
    }
];

var game = new Phaser.Game(
    700, 700, Phaser.AUTO, document.getElementById('mangata'), {
        create: function() {
            game.physics.startSystem(Phaser.Physics.P2JS);
            game.physics.p2.setImpactEvents(true);
            cursors = game.input.keyboard.createCursorKeys();
            GenerateGrid();
        },

        update: function() {

            if(contactBody) {
                if(contactBody.body.collidesWith.length > 0) {
                    contactBody.alpha -= (ratio * (5 - contactBody.platform_size));
                    if(contactBody.alpha <= 0) {
                        contactBody.alpha = 0;
                        platforms.removeChild(contactBody);
                        disappeared.add(contactBody);
                        contactBody.body.setCollisionGroup(platformDisappearedGroup);
                        contactBody.body.updateCollisionMask();
                        contactBody = null;
                    }
                } else {
                    contactBody.alpha += (ratio * (5 - contactBody.platform_size));
                    if(contactBody.alpha >= 1) {
                        contactBody.alpha = 1;
                    }
                }
            }


            for(var i = 0; i < disappeared.children.length; i++) {
                var body = disappeared.children[i];
                if(body == overlappedBody) continue;
                body.alpha += twiceratio;
                if(body.alpha >= 1) {
                    body.alpha = 1;
                    disappeared.removeChild(body);
                    platforms.add(body);
                    body.body.setCollisionGroup(platformCollisionGroup);
                    body.body.updateCollisionMask();
                }
            }


            if(cursors.left.isDown) {
                playa.body.velocity.x = -200;
            } else if(cursors.right.isDown) {
                playa.body.velocity.x = 200;
            } else {
                playa.body.velocity.x = 0;
            }

            if(cursors.up.isDown) {
                playa.body.velocity.y = -500;
            }

            if(playa.position.y > game.height) {
                game.state.restart(true, true);
            }

            if(playa.position.x < -1*playa.width || playa.position.x > game.width) {
                playa.position.x = 13*gridCellSize;
                playa.position.y = 7*gridCellSize;
            }
        }
    }
);


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
    gridCellSize = game.width / gridSize;
    var gridStyle = game.rnd.pick(styles);

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

    circleAsset = game.add.bitmapData(400, 400);
    circleAsset.ctx.fillStyle = '#888888';
    circleAsset.ctx.arc(200, 200, 200, 0, Math.PI*2);
    circleAsset.ctx.fill();
    circleAsset.ctx.closePath();
    circleSprite = game.add.sprite(200, 150, circleAsset);

    platforms = game.add.group();
    disappeared = game.add.group();
    platforms.enableBody = true;
    platforms.physicsBodyType = Phaser.Physics.P2JS;
    disappeared.enableBody = true;
    disappeared.physicsBodyType = Phaser.Physics.P2JS;


    playerCollisionGroup = game.physics.p2.createCollisionGroup();
    platformCollisionGroup = game.physics.p2.createCollisionGroup();
    platformDisappearedGroup = game.physics.p2.createCollisionGroup();

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
                var platform = platforms.create(horizontalPosition, verticalPosition, platformAsset);
                var rotation = Math.PI * game.rnd.pick([-0.25, 0, 0.25])
                platform.body.immovable = true;
                platform.rotation = rotation;
                platform.body.rotation = rotation;
                platform.body.kinematic = false;
                platform.body.dynamic = false;
                platform.body.setCollisionGroup(platformCollisionGroup);
                platform.body.collides(playerCollisionGroup);
                platform.platform_size = platformSize;
                if(platforms.children.length == totalElements) break;
            }
            if(platforms.children.length == totalElements) break;
        }
        if(platforms.children.length == totalElements) break;
    }


    // Creamos al jugador.
    if(playa != null){
        playa.destroy(true);
    }
    playa = game.add.sprite(13*gridCellSize, 7*gridCellSize, playerAsset);
    game.physics.p2.enable(playa, false);
    playa.body.checkWorldBounds = true;
    playa.body.setCollisionGroup(playerCollisionGroup);
    playa.body.collides(platformCollisionGroup, function(playar, collided) {
        contactBody = collided.sprite;
    }, this);
    playa.body.collides(platformDisappearedGroup, function(playar, collided){
        overlappedBody = collided.sprite;
    }, this);

    //Creamos los "dulcecitos"

    candies = game.add.group();
    candies.enableBody = true;

    game.physics.p2.gravity.y = 500;
    game.physics.p2.updateBoundsCollisionGroup();
};
