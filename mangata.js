var playar;
var platforms;
var destroyed;
var centralPlatform;
var ratio = 1/20;
var twiceratio = 1/10;
var collectables;
var collected;
var cursors, restart_button;

var game = new Phaser.Game(800, 600, Phaser.AUTO, document.getElementById('mangata'), {
    preload: function() {
        var tileData = game.add.bitmapData(20, 20);
        tileData.ctx.beginPath();
        tileData.ctx.rect(0, 0, 20, 20);
        tileData.ctx.fillStyle = '#FFFFFF';
        tileData.ctx.fill();
        tileData.ctx.closePath();
        tileData.generateTexture('tile');

        var playarData = game.add.bitmapData(40, 40);
        playarData.ctx.beginPath();
        playarData.ctx.rect(0, 0, 40, 40);
        playarData.ctx.fillStyle = '#938CC5';
        playarData.ctx.strokeStyle = '#FFF';
        playarData.ctx.lineWidth = 5;
        playarData.ctx.fill();
        playarData.ctx.stroke();
        tileData.ctx.closePath();
        playarData.generateTexture('playar');

        var colData = game.add.bitmapData(5, 5);
        colData.ctx.beginPath();
        colData.ctx.rect(0, 0, 5, 5);
        colData.ctx.fillStyle = '#767210';
        colData.ctx.fill();
        colData.ctx.closePath();
        colData.generateTexture('colTile');

        game.time.advancedTiming = true;
    },

    createMap: function() {
        var worldCenter = { x: game.world.centerX , y: game.world.centerY };

        var tile = platforms.create(worldCenter.x, worldCenter.y, 'tile');
        tile.body.immovable = true;

        playar = game.add.sprite(worldCenter.x, worldCenter.y, 'playar');
        playar.position.y -= playar.height + 15;
        game.physics.arcade.enable(playar);
        playar.body.bounce.y = 0.25;
        playar.body.gravity.y = 400;
        playar.body.maxVelocity.x = 400;
        playar.body.friction.x = 10000;
        playar.checkWorldBounds = true;

        playar.events.onOutOfBounds.add(function() {
            playar.position.x = worldCenter.x;
            playar.position.y = worldCenter.y - 30;
            playar.body.velocity.x = 0;
        }, this);

        for(var i = 0; i < 10; i++) {
            var nextPosition = {
                x: worldCenter.x,
                y: worldCenter.y
            };

            switch(i%4) {
                case 0:
                    nextPosition.x += (game.rnd.between(60, 200));
                    nextPosition.y += (game.rnd.between(60, 200));
                    break;
                case 1:
                    nextPosition.x -= (game.rnd.between(60, 200));
                    nextPosition.y -= (game.rnd.between(60, 200));
                    break;
                case 2:
                    nextPosition.x += (game.rnd.between(60, 200));
                    nextPosition.y -= (game.rnd.between(60, 200));
                    break;
                case 3:
                    nextPosition.x -= (game.rnd.between(60, 200));
                    nextPosition.y += (game.rnd.between(60, 200));
                    break;
            }

            tile = platforms.create(
                nextPosition.x, nextPosition.y,
                'tile');

            var collectable = collectables.create(
                nextPosition.x + 10, nextPosition.y - 45,
                'colTile');

            tile.body.immovable = true;
            tile.alpha = 1;
        }
    },

    reload: function() {
        platforms.removeAll(true);
        destroyedTiles.removeAll(true);
        collectables.removeAll(true);
        collected.removeAll(true);
        playar.destroy();
        playar = null;


        this.createMap();
    },

    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        platforms = game.add.group();
        destroyedTiles = game.add.group();
        collectables = game.add.group();
        collected = game.add.group();
        game.stage.backgroundColor = '#050314';

        platforms.enableBody = true;
        collectables.enableBody = true;
        collected.enableBody = true;
        cursors = game.input.keyboard.createCursorKeys();
        restart_button = game.input.keyboard.addKey(Phaser.KeyCode.R);

        this.createMap();
    },

    update: function() {
        var collisioned;
        var overlapped;
        var collectible;
        playar.body.velocity.x = 0;

        game.debug.text('Items coleccionados: ' + collected.children.length,
        50, 50, '#FFF', '16px Droid Sans');
        game.debug.text('FPS:' + game.time.fps, 50, 65, '#FFF', '16px Droid Sans');

        var collide = game.physics.arcade.collide(playar, platforms.children,
             null, function(s1, s2) {
                 collisioned = s2;
                 return true;
             });

        var overlap = game.physics.arcade.overlap(playar, destroyedTiles.children,
            null, function(s1, s2) {
                overlapped = s2;
                return true;
            });

        var collectableOverlap = game.physics.arcade.overlap(playar,
            collectables.children, null, function(s1, s2){
                collectible = s2;
                return true;
            }
        );

        if(collectableOverlap) {
            collectables.removeChild(collectible);
            collectible.visible = false;
            collected.add(collectible);
        }

        for(var i = 0, chld = platforms.children.length; i < chld; i++) {
            var element = platforms.children[i];
            if(element.alpha <= 1 && collisioned !== element) {
                element.alpha += ratio;
                if(element.alpha > 1) element.alpha = 1;
            }
        }

        for(var i = 0, chld = destroyedTiles.children.length; i < chld; i++) {
            var element = destroyedTiles.children[i];
            if(element !== undefined && element.alpha >= 0 && overlapped !== element) {
                element.alpha += twiceratio;
                if(element.alpha > 1) {
                    element.alpha = 1;
                    destroyedTiles.removeChild(element);
                    platforms.add(element);
                }
            } else {
                if(element !== undefined){
                    element.alpha = 0;
                }
            }
        }

        if(collide && collisioned) {
            collisioned.alpha -= ratio;
            if(collisioned.alpha <= 0) {
                collisioned.alpha = 0;
                platforms.removeChild(collisioned);
                destroyedTiles.add(collisioned);
            }
        }

        if(cursors.left.isDown) {
            playar.body.velocity.x = -200;
        } else if(cursors.right.isDown) {
            playar.body.velocity.x = 200;
        } else {
            playar.body.velocity.x = 0;
        }

        if(cursors.up.isDown && playar.body.touching.down) {
            playar.body.velocity.y = -350;
        }

        if(restart_button.upDuration(Phaser.Keyboard.R, 500)) {
            this.reload();
        }

        if(collectables.children.length == 0) {
            this.reload();
        }
    }
});
