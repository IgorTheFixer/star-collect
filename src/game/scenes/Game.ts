import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    player: Phaser.Physics.Arcade.Sprite
    cursors: any
    stars: Phaser.Physics.Arcade.Group
    bombs: Phaser.Physics.Arcade.Group;
    scoreText: Phaser.GameObjects.Text;
    platforms: Phaser.Physics.Arcade.StaticGroup;

    score = 0;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        this.gameText = this.add.text(512, 384, 'Make something fun!\nand share it with us:\nsupport@phaser.io', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Create platforms
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        this.platforms.create(600, 400, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');

        // Create player
        this.player = this.physics.add.sprite(100, 450, 'dude');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        //Create animations
        this.anims.create({
          key: 'left',
          frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
          frameRate: 10,
          repeat: -1
          });

        this.anims.create({
          key: 'turn',
          frames: [ { key: 'dude', frame: 4 } ],
          frameRate: 20
        });

        this.anims.create({
          key: 'right',
          frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
          frameRate: 10,
          repeat: -1
        });

          this.cursors = this.input?.keyboard?.createCursorKeys();

          //Create stars
          this.stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
          });

          this.stars.children.iterate((child) => {
            (child as Phaser.Physics.Arcade.Sprite).setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            return true
          })

          // Create score text
          this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', color: '#000' });

          // Create bombs group
          this.bombs = this.physics.add.group();

          // --- Add all colliders ---
          this.physics.add.collider(this.stars, this.platforms);
          this.physics.add.collider(this.player, this.platforms);
          this.physics.add.collider(this.bombs, this.platforms);

          // --- Add overlaps, calling class methods ---
          this.physics.add.overlap(this.player, this.stars, this.collectStar, undefined, this);
          this.physics.add.collider(this.player, this.bombs, this.hitBomb, undefined, this);


        EventBus.emit('current-scene-ready', this);
        
    }

    update()
    {

      if (this.cursors.left.isDown)
      {
          this.player.setVelocityX(-160);
          this.player.anims.play('left', true);
      }
      else if (this.cursors.right.isDown)
      {
          this.player.setVelocityX(160);
          this.player.anims.play('right', true);
      }
      else
      {
          this.player.setVelocityX(0);
          this.player.anims.play('turn');
      }

      if (this.cursors.up.isDown && this.player?.body?.touching.down)
      {
          this.player.setVelocityY(-330);
      }
    }

    private collectStar (player: any, star: any)
    {
        // Cast star to a physics sprite to disable it
        (star as Phaser.Physics.Arcade.Sprite).disableBody(true, true);

        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        if (this.stars.countActive(true) === 0)
        {
            this.stars.children.iterate((child) => {
                const starChild = child as Phaser.Physics.Arcade.Sprite;
                starChild.enableBody(true, starChild.x, 0, true, true);
                return true
            });

            const x = (this.player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

            const bomb = this.bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        }
    }

    private hitBomb(player: any, bomb: any)
    {
      this.physics.pause();

      this.player.setTint(0xff0000);

      this.player.anims.play('turn');

      this.changeScene()
    }
    

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
