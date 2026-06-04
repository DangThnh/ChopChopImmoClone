const config = {
    type: Phaser.AUTO,
    width: 540,
    height: 960,
    backgroundColor: '#f4f1ea', // Màu nền theo GDD
    parent: 'game-container',
    scene: [BootScene, GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};
const game = new Phaser.Game(config);