class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.load.setPath('assets/images/');
        this.load.image('bg', 'bg.png');
        this.load.image('bg_battle', 'bg_battle.png');
        this.load.image('tree', 'tree.png');
        this.load.image('character', 'character.png');

        this.load.image('monster_1', 'monster_1.png');
        this.load.image('monster_2', 'monster_2.png');
        this.load.image('monster_3', 'monster_3.png');

            this.load.setPath('assets/audio/');
        this.load.audio('sfx_chop', 'chop.mp3');
        this.load.audio('sfx_drop', 'drop.mp3');
        this.load.audio('sfx_equip', 'equip.mp3');
        this.load.audio('sfx_sell', 'sell.mp3');
        
          // =======================================================
        // VÒNG LẶP TỰ ĐỘNG TẢI 72 TRANG BỊ CHỈ TRONG 8 DÒNG CODE!
        // =======================================================
        const equipmentTypes = ['weapon', 'hat', 'clothes', 'belt', 'shoes', 'ring', 'bracelet', 'necklace', 'jade', 'amulet', 'mirror', 'seal'];
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

        this.load.setPath('assets/images/items/'); // Trỏ đường dẫn vào thư mục items
        equipmentTypes.forEach(type => {
            rarities.forEach(rarity => {
                let key = `item_${type}_${rarity}`;
                this.load.image(key, `${key}.png`); // Tự động nạp: item_weapon_common.png, ...
            });
        });

    }

    create() {
        this.scene.start('GameScene');
    }
}