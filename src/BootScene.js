class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.load.setPath('assets/images/');
        this.load.image('bg', 'bg.png');
        this.load.image('tree', 'tree.png');
        this.load.image('character', 'character.png');

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