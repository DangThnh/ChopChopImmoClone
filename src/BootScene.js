class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.load.setPath('assets/images/');
        this.load.image('bg', 'bg.png');
        this.load.image('tree', 'tree.png');
        this.load.image('character', 'character.png');
    }

    create() {
        this.scene.start('GameScene');
    }
}