class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // =======================================================
        // 1. THIẾT LẬP GIAO DIỆN THANH LOADING
        // =======================================================
        let width = this.cameras.main.width;   // Chiều rộng màn hình (540)
        let height = this.cameras.main.height; // Chiều cao màn hình (960)

        // Tạo khung viền (Màu xám tối)
        let progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        // Tạo thanh nạp (Màu xanh lá)
        let progressBar = this.add.graphics();

        // Chữ "Loading..."
        let loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            font: 'bold 20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // Chữ hiển thị phần trăm (VD: 50%)
        let percentText = this.add.text(width / 2, height / 2, '0%', {
            font: 'bold 18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // Chữ hiển thị tên file đang tải (Cho có vẻ nguy hiểm và chuyên nghiệp)
        let assetText = this.add.text(width / 2, height / 2 + 50, '', {
            font: '14px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5, 0.5);

        // =======================================================
        // 2. LẮNG NGHE SỰ KIỆN TẢI CỦA PHASER
        // =======================================================
        
        // Cập nhật độ dài thanh xanh và % mỗi khi tải xong 1 file
        this.load.on('progress', function (value) {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0x4caf50, 1); // Màu xanh lá giống thanh máu/năng lượng của bạn
            // Vẽ thanh xanh dài dần ra (max width = 300)
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        // Cập nhật tên file đang được tải
        this.load.on('fileprogress', function (file) {
            assetText.setText('Đang tải tài nguyên: ' + file.key);
        });

        // Xóa các thanh hiển thị khi tải xong 100%
        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
        });

        // =======================================================
        // 3. TIẾN HÀNH TẢI TÀI NGUYÊN (NHƯ CŨ)
        // =======================================================
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

        // --- 10 ÂM THANH MỚI THÊM VÀO ĐÂY ---
        this.load.audio('bgm_main', 'bgm_main.mp3');
        this.load.audio('bgm_battle', 'bgm_battle.mp3');
        
        this.load.audio('battle_start', 'battle_start.mp3');
        this.load.audio('hit_normal', 'hit_normal.mp3');
        this.load.audio('hit_crit', 'hit_crit.mp3');
        this.load.audio('dodge', 'dodge.mp3');
        this.load.audio('heal', 'heal.mp3');
        this.load.audio('stun', 'stun.mp3');
        
        this.load.audio('win', 'win.mp3');
        this.load.audio('lose', 'lose.mp3');
        
        // =======================================================
        // VÒNG LẶP TỰ ĐỘNG TẢI 72 TRANG BỊ
        // =======================================================
        const equipmentTypes = ['weapon', 'hat', 'clothes', 'belt', 'shoes', 'ring', 'bracelet', 'necklace', 'jade', 'amulet', 'mirror', 'seal'];
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

        this.load.setPath('assets/images/items/');
        equipmentTypes.forEach(type => {
            rarities.forEach(rarity => {
                let key = `item_${type}_${rarity}`;
                this.load.image(key, `${key}.png`); 
            });
        });
    }

    create() {
        // Sau khi màn hình Loading chạy xong 100%, nhảy sang GameScene
        this.scene.start('GameScene');
    }
}