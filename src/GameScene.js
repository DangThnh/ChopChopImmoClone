class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        if (this.textures.exists('bg')) {
            this.add.image(270, 480, 'bg').setDisplaySize(540, 960).setDepth(0);
        }

        // =======================================================
        // 1. HỆ THỐNG LOAD GAME (AN TOÀN TUYỆT ĐỐI)
        // =======================================================
        let savedData = localStorage.getItem('idleChopChopSave');

        // Khởi tạo khung dữ liệu chuẩn ĐẦY ĐỦ nhất
        let defaultPlayerState = {
            level: 1,
            exp: 0,
            gold: 200, 
            treeLevel: 1, 
            combatPower: 100,
            energy: 50,      
            maxEnergy: 50,   
            pveStage: 1,
            equipment: {
                weapon: null, hat: null, clothes: null, belt: null,
                shoes: null, ring: null, bracelet: null, necklace: null,
                jade: null, amulet: null, mirror: null, seal: null
            },
            stats: {
                hp: 100, atk: 20, def: 10,
                crit: 0, combo: 0, counter: 0, stun: 0, dodge: 0, lifesteal: 0,
                k_crit: 0, k_combo: 0, k_counter: 0, k_stun: 0, k_dodge: 0, k_lifesteal: 0
            },
            activePet: { name: "Tiểu Long Quy", level: 1, atkBonusPercent: 10, specialStat: "stun", specialValue: 5.5 },
            spiritList: [
                { name: "Cửu Vĩ Linh Hồ", level: 1, resistStat: "k_crit", resistValue: 8.0 }, 
                { name: "Hắc Tề Thiên", level: 1, resistStat: "k_stun", resistValue: 4.5 }   
            ]
        };

        if (savedData) {
            try {
                let parsedData = JSON.parse(savedData);
                // Dùng Object.assign để hợp nhất: Dữ liệu tải về sẽ đè lên dữ liệu mặc định.
                // Nếu bản save cũ thiếu trường mới (ví dụ thiếu energy), nó sẽ lấy giá trị từ bản mặc định bù vào!
                this.player = Object.assign({}, defaultPlayerState, parsedData);
                console.log("🟢 [HỆ THỐNG]: Nạp thành công tiến trình cũ!");
            } catch (e) {
                console.error("🔴 [HỆ THỐNG]: Bản Save bị lỗi (Corrupted). Khởi tạo lại từ đầu!");
                this.player = defaultPlayerState;
            }
        } else {
            console.log("🟢 [HỆ THỐNG]: Không có bản Save cũ. Tạo nhân vật mới!");
            this.player = defaultPlayerState;
        }

        // =======================================================
        // 2. DICTIONARY & CONFIG
        // =======================================================
        this.equipmentTypes = ['weapon', 'hat', 'clothes', 'belt', 'shoes', 'ring', 'bracelet', 'necklace', 'jade', 'amulet', 'mirror', 'seal'];
        this.slotAbbreviations = {
            weapon: 'WP', hat: 'HT', clothes: 'CL', belt: 'BT',
            shoes: 'SH', ring: 'RG', bracelet: 'BR', necklace: 'NL',
            jade: 'JD', amulet: 'AM', mirror: 'MR', seal: 'SL'
        };

        this.rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
        this.rarityNames = { common: 'Thường', uncommon: 'Ưu Tú', rare: 'Hiếm', epic: 'Ưu Việt', legendary: 'Huyền Thoại', mythic: 'Thần Thoại' };
        this.rarityColors = { common: '#ffffff', uncommon: '#4caf50', rare: '#2196f3', epic: '#9c27b0', legendary: '#ff9800', mythic: '#f44336' };

         // --- THÊM TỪ ĐIỂN DỊCH THUẬT THUỘC TÍNH ẨN ---
        this.statNames = {
            crit: 'Bạo Kích',
            combo: 'Liên Kích',
            counter: 'Phản Kích',
            stun: 'Choáng',
            dodge: 'Né Tránh',
            lifesteal: 'Hút Máu'
        };

        this.treeDropRates = {
            1:  { common: 0.90, uncommon: 0.10, rare: 0.00, epic: 0.00, legendary: 0.00, mythic: 0.00 },
            2:  { common: 0.80, uncommon: 0.20, rare: 0.00, epic: 0.00, legendary: 0.00, mythic: 0.00 },
            3:  { common: 0.70, uncommon: 0.30, rare: 0.00, epic: 0.00, legendary: 0.00, mythic: 0.00 },
            4:  { common: 0.60, uncommon: 0.39, rare: 0.01, epic: 0.00, legendary: 0.00, mythic: 0.00 },
            5:  { common: 0.50, uncommon: 0.439, rare: 0.05, epic: 0.01, legendary: 0.001, mythic: 0.00 },
            6:  { common: 0.40, uncommon: 0.439, rare: 0.10, epic: 0.05, legendary: 0.011, mythic: 0.00 },
            7:  { common: 0.30, uncommon: 0.40, rare: 0.20, epic: 0.08, legendary: 0.02, mythic: 0.00 },
            8:  { common: 0.20, uncommon: 0.35, rare: 0.30, epic: 0.11, legendary: 0.04, mythic: 0.00 },
            9:  { common: 0.15, uncommon: 0.25, rare: 0.35, epic: 0.189, legendary: 0.06, mythic: 0.001 },
            10: { common: 0.10, uncommon: 0.20, rare: 0.35, epic: 0.24, legendary: 0.10, mythic: 0.01 } 
        };

        this.isChopping = false;
        this.isPopupOpen = false;
        this.hudSlots = {};

        this.treeUpgradeCosts = [0, 100, 400, 1200, 3500, 8000, 18000, 40000, 100000, 250000, 999999];

        // Khởi tạo Giao diện và Cập nhật chỉ số từ bản Save
        this.createGameUI();
        this.createEquipmentSlotsHUD(); 
        
        // --- CHÚ Ý: Bắt buộc phải vẽ lại Đồ hiển thị (Visual) sau khi Load file Save ---
        this.updateEquipmentSlotsVisual(); 
        
        this.recalculateCombatPower();
        this.updateResourceHUD(); 

        // =======================================================
        // 3. THIẾT LẬP CÁC BỘ ĐẾM THỜI GIAN (HỒI THỂ LỰC & AUTO-SAVE)
        // =======================================================
        
        // A. Đếm ngược hồi thể lực
        this.energyRegenCountdown = 6; 
        this.time.addEvent({
            delay: 1000, 
            callback: this.updateEnergyRegen,
            callbackScope: this,
            loop: true
        });

        // B. AUTO-SAVE MỖI 5 GIÂY (Giải pháp chống thất thoát dữ liệu 100%)
        this.time.addEvent({
            delay: 5000, 
            callback: this.saveGame,
            callbackScope: this,
            loop: true
        });
    }

    createGameUI() {
        this.cpText = this.add.text(270, 80, `LỰC CHIẾN: ${this.player.combatPower}`, { 
            font: 'bold 32px Arial', fill: '#ffeb3b', stroke: '#000', strokeThickness: 5 
        }).setOrigin(0.5).setDepth(10);

        this.hudText = this.add.text(100, 30, `Đạo Hữu - Cấp: ${this.player.level} | Exp: 0% | Linh Thạch: ${this.player.gold}`, {
            font: 'bold 14px Arial', fill: '#ffffff', stroke: '#000', strokeThickness: 3
        }).setOrigin(0, 0.5).setDepth(10);

        this.treeLevelText = this.add.text(270, 150, `Cây Thần Cấp: ${this.player.treeLevel}`, { 
            font: 'bold 18px Arial', fill: '#ffffff', stroke: '#000', strokeThickness: 3 
        }).setOrigin(0.5).setDepth(10);

        // HIỆN THỊ GIÁ TIỀN CHÍNH XÁC KHI VỪA LOAD GAME VÀO
        let initialUpgradeCostText = this.player.treeLevel >= 10 ? "MAX LEVEL" : `Nâng Cây: ${this.treeUpgradeCosts[this.player.treeLevel]} 💎`;
        
        this.upgradeTreeBtn = this.add.rectangle(270, 740, 200, 45, 0x8b5a2b).setStrokeStyle(2, 0xffeb3b).setInteractive({ useHandCursor: true }).setDepth(10);
        this.upgradeCostText = this.add.text(270, 740, initialUpgradeCostText, { font: 'bold 16px Arial', fill: '#ffffff' }).setOrigin(0.5).setDepth(11);
        this.upgradeTreeBtn.on('pointerdown', () => this.upgradeTree());

        this.sacredTree = this.add.sprite(270, 380, 'tree').setDepth(5);
        this.sacredTree.setScale(0.75); 
        this.sacredTree.setInteractive({ useHandCursor: true });
        this.character = this.add.sprite(250, 620, 'character').setDepth(6); 
        this.character.setScale(0.75);

        this.sacredTree.on('pointerdown', this.chopTree, this);

        this.energyBarBg = this.add.rectangle(510, 380, 16, 260, 0x333333).setStrokeStyle(2, 0xffffff).setDepth(10);
        this.energyBarFill = this.add.rectangle(510, 510, 16, 260, 0x4caf50).setOrigin(0.5, 1).setDepth(11); 
        
        this.buyEnergyBtn = this.add.rectangle(510, 220, 35, 35, 0xff9800).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true }).setDepth(10);
        this.add.text(510, 220, '+⚡', { font: 'bold 16px Arial', fill: '#fff' }).setOrigin(0.5).setDepth(11);
        this.buyEnergyBtn.on('pointerdown', () => this.showBuyEnergyPopup());

        this.energyTimerText = this.add.text(440, 300, 'Hồi sau:\n6s', {
            font: 'bold 12px Arial', fill: '#aaaaaa', align: 'center', lineSpacing: 4
        }).setOrigin(0.5).setDepth(10);

        this.updateEnergyBarVisual();

        this.createPvEButton();

        // Nút Avatar mở Bảng thông tin nhân vật
        this.avatarBtn = this.add.rectangle(55, 60, 60, 60, 0x8b5a2b).setStrokeStyle(3, 0xffffff).setInteractive({ useHandCursor: true }).setDepth(10);
        this.add.text(55, 60, 'AVATAR', { font: 'bold 10px Arial', fill: '#fff' }).setOrigin(0.5).setDepth(11);
        this.avatarBtn.on('pointerdown', () => this.showProfilePopup());
    }

   updateEnergyBarVisual() {
        let ratio = this.player.energy / this.player.maxEnergy;
        // Giới hạn tỉ lệ từ 0 đến 1 đề phòng lỗi âm hoặc vượt quá tối đa
        ratio = Phaser.Math.Clamp(ratio, 0, 1); 
        this.energyBarFill.scaleY = ratio; 
    }

 createEquipmentSlotsHUD() {
        let startX = 100; let stepX = 68;
        let row1Y = 810; let row2Y = 890; 

        this.equipmentTypes.forEach((type, index) => {
            let col = index % 6;
            let row = Math.floor(index / 6);
            let posX = startX + (col * stepX);
            let posY = row === 0 ? row1Y : row2Y;

            let box = this.add.rectangle(posX, posY, 60, 68, 0x222222).setStrokeStyle(2, 0x555555).setDepth(8).setInteractive({ useHandCursor: true });
            let itemIconPlaceholder = this.add.rectangle(posX, posY, 44, 52, 0x000000, 0.4).setDepth(9);

            // --- THÊM DÒNG NÀY: Tạo đối tượng ảnh ẩn để chờ hiển thị đồ mặc thực tế ---
            let itemIcon = this.add.image(posX, posY, '').setDepth(10).setVisible(false);

            box.on('pointerdown', () => this.showSlotTooltip(type, posX, posY));

            // Lưu trữ thêm itemIcon vào HUD
            this.hudSlots[type] = { box, itemIconPlaceholder, itemIcon };
        });
    }

    updateEquipmentSlotsVisual() {
        this.equipmentTypes.forEach(type => {
            let item = this.player.equipment[type];
            let slot = this.hudSlots[type];
            
            if (item) {
                let colorHex = Phaser.Display.Color.HexStringToColor(this.rarityColors[item.rarity]).color;
                slot.box.setStrokeStyle(3, colorHex);
                slot.itemIconPlaceholder.setVisible(false); // Ẩn ô đen trống đi
                
                // --- ĐÃ PHÁT SÁNG: Nạp ảnh thật, phóng to vừa vặn và hiện lên! ---
                let key = `item_${type}_${item.rarity}`;
                slot.itemIcon.setTexture(key).setDisplaySize(44, 52).setVisible(true);
            } else {
                slot.box.setStrokeStyle(2, 0x555555);
                slot.itemIconPlaceholder.setVisible(true); // Hiện ô đen trống
                slot.itemIcon.setVisible(false); // Ẩn ảnh thật đi
            }
        });
    }

   // Tooltip chi tiết ô đồ khi click
    showSlotTooltip(type, x, y) {
        if (this.isPopupOpen) return;
        this.isPopupOpen = true;

        let item = this.player.equipment[type];
        let tooltip = this.add.container(0, 0).setDepth(200);

        let closeMask = this.add.rectangle(270, 480, 540, 960, 0x000000, 0.1).setInteractive();
        closeMask.on('pointerdown', () => {
            this.isPopupOpen = false;
            tooltip.destroy();
        });

        // Đẩy Tooltip lùi lên trên 110px so với tọa độ của ô đồ
        let boxY = y - 110; 
        let panel = this.add.rectangle(x, boxY, 180, 140, 0x111111, 0.95).setStrokeStyle(2, 0x8b5a2b);
        
        // --- TỪ ĐIỂN DỊCH TÊN 12 LOẠI TRANG BỊ ---
        const typeNames = {
            weapon: 'Vũ Khí', headwear: 'Mũ', clothes: 'Áo', belt: 'Đai Lưng',
            shoes: 'Giày', ring: 'Nhẫn', bracelet: 'Vòng Tay', necklace: 'Dây Chuyền',
            jade: 'Ngọc Bội', amulet: 'Bùa Chú', mirror: 'Gương', seal: 'Ấn Chú'
        };

        let contentText = "";
        let translatedType = typeNames[type] || type.toUpperCase();

        if (item) {
            // SỬA: Đọc tên Tiếng Việt từ this.statNames cho dòng thuộc tính ẩn
            let specialText = item.specialStat ? `${this.statNames[item.specialStat]}: +${item.specialValue}%` : '';
            
            contentText = `${translatedType} (Lv.${item.level})\n` +
                          `Phẩm: ${this.rarityNames[item.rarity]}\n` +
                          `Công: +${item.atk}\n` +
                          `Máu: +${item.hp}\n` +
                          specialText;
        } else {
            contentText = `${translatedType}\n\n(Chưa Trang Bị)`;
        }

        let txt = this.add.text(x - 80, boxY - 60, contentText, { 
            font: '12px Arial', fill: '#ffffff', lineSpacing: 4 
        });

        tooltip.add([closeMask, panel, txt]);
    }

    updateResourceHUD() {
        let neededExp = this.player.level * 50;
        let expPercent = Math.floor((this.player.exp / neededExp) * 100);
        this.hudText.setText(`Đạo Hữu - Cấp: ${this.player.level} | Exp: ${expPercent}% | Linh Thạch: ${this.player.gold}`);
    }

    chopTree() {
        if (this.isChopping || this.isPopupOpen) return; 

            // --- SỬA LỖI: Khóa chặt cây ngay lập tức nếu hết năng lượng ---
        if (this.player.energy <= 0) {
            this.showFloatingText(270, 450, "HẾT THỂ LỰC! HÃY MUA THÊM!", "#ff3333");
            return;
        }

        this.player.energy--; 
        this.updateEnergyBarVisual(); 

        this.isChopping = true;

        this.tweens.add({
            targets: this.character,
            scaleX: 0.9,  
            scaleY: 0.63, 
            duration: 60,
            yoyo: true,
            repeat: 0,
            onComplete: () => {
                this.tweens.add({
                    targets: this.sacredTree,
                    angle: { from: -5, to: 5 },
                    duration: 40,
                    yoyo: true,
                    repeat: 3,
                    onComplete: () => {
                        this.sacredTree.angle = 0; 
                        this.isChopping = false;   
                        this.generateRandomDrop();
                    }
                });
            }
        });
    }

    // =======================================================
    // HÀM LÀM TRÒN TỶ LỆ RƠI ĐỒ THEO CẤP CÂY AN TOÀN (DDA CHUẨN)
    // =======================================================
    // getDropRatesByTreeLevel(level) {
    //     if (level >= 10) return this.treeDropRates[10];
    //     if (level >= 5) return this.treeDropRates[5];
    //     return this.treeDropRates[1]; // Trả về tỷ lệ cấp 1 cho các cấp 2, 3, 4
    // }

    generateRandomDrop() {
        // --- SỬA LỖI TRUY XUẤT: Gọi hàm làm tròn tỷ lệ an toàn ---
       // let rates = this.getDropRatesByTreeLevel(this.player.treeLevel);
        let rates = this.treeDropRates[this.player.treeLevel];

        let rand = Math.random();
        let selectedRarity = 'common';
        let cumulative = 0;

        for (let rarity of this.rarities) {
            cumulative += rates[rarity];
            if (rand <= cumulative) {
                selectedRarity = rarity;
                break;
            }
        }

        let randomType = this.equipmentTypes[Phaser.Math.Between(0, this.equipmentTypes.length - 1)];
        let multiplier = this.rarities.indexOf(selectedRarity) + 1;
        
        let itemLevel = Phaser.Math.Between(this.player.level - 1, this.player.level + 1);
        itemLevel = Math.max(1, itemLevel); 

        let newItem = {
            id: Phaser.Utils.String.UUID(),
            type: randomType,
            rarity: selectedRarity,
            level: itemLevel, 
            atk: Math.floor(10 * itemLevel * multiplier * 0.8),
            hp: Math.floor(50 * itemLevel * multiplier * 0.8),
            specialStat: null,
            specialValue: 0
        };

        if (multiplier >= 3) {
            const specialPool = ['crit', 'combo', 'counter', 'stun', 'dodge', 'lifesteal'];
            newItem.specialStat = specialPool[Phaser.Math.Between(0, specialPool.length - 1)];
            newItem.specialValue = parseFloat((Math.random() * multiplier * 1.5).toFixed(2));
        }

        this.showDropPopup(newItem);
    }

    showDropPopup(newItem) {
        this.isPopupOpen = true; 

        let currentItem = this.player.equipment[newItem.type];
        let popup = this.add.container(0, 0).setDepth(100);

        let bgMask = this.add.rectangle(270, 480, 540, 960, 0x000000, 0.6).setInteractive();
        let board = this.add.rectangle(270, 420, 460, 460, 0x1f2421).setStrokeStyle(4, 0x8b5a2b);
        popup.add([bgMask, board]);

        let rarityText = this.rarityNames[newItem.rarity].toUpperCase();
        let rarityColor = this.rarityColors[newItem.rarity];
        let title = this.add.text(270, 220, `NHẬN ĐỒ: ${newItem.type.toUpperCase()}\n(${rarityText} - Lv.${newItem.level})`, { 
            font: 'bold 22px Arial', fill: rarityColor, align: 'center'
        }).setOrigin(0.5);
        popup.add(title);

        let oldAtk = currentItem ? currentItem.atk : 0;
        let oldHp = currentItem ? currentItem.hp : 0;
        
        let atkDiff = newItem.atk - oldAtk;
        let hpDiff = newItem.hp - oldHp;

        let atkDiffText = atkDiff >= 0 ? ` (+${atkDiff} ⬆)` : ` (${atkDiff} ⬇)`;
        let atkDiffColor = atkDiff >= 0 ? '#4caf50' : '#f44336';
        let hpDiffText = hpDiff >= 0 ? ` (+${hpDiff} ⬆)` : ` (${hpDiff} ⬇)`;
        let hpDiffColor = hpDiff >= 0 ? '#4caf50' : '#f44336';

      // --- PANEL TRÁI: HIỂN THỊ ẢNH MÓN MỚI NHẬN ĐƯỢC ---
        let newSpecialText = newItem.specialStat ? `${this.statNames[newItem.specialStat]}: +${newItem.specialValue}%` : '(Không có)';
        let newStatsText = `Công: +${newItem.atk}\n\nMáu: +${newItem.hp}\n\n${newSpecialText}`;
        
        let newPanel = this.add.text(70, 360, newStatsText, { font: '15px Arial', fill: '#ffffff', lineSpacing: 4 });
        
        let keyNew = `item_${newItem.type}_${newItem.rarity}`;
        let newItemSprite = this.add.image(130, 300, keyNew).setDisplaySize(50, 50).setDepth(101);

        let diffAtkText = this.add.text(165, 377, atkDiffText, { font: 'bold 15px Arial', fill: atkDiffColor });
        let diffHpText = this.add.text(165, 415, hpDiffText, { font: 'bold 15px Arial', fill: hpDiffColor });
        popup.add([newPanel, diffAtkText, diffHpText, newItemSprite]);

        // --- PANEL PHẢI: HIỂN THỊ ẢNH MÓN ĐANG MẶC ---
        let oldStatsText = "";
        if (currentItem) {
            // SỬA: Đọc tên tiếng Việt từ this.statNames
            let oldSpecialText = currentItem.specialStat ? `${this.statNames[currentItem.specialStat]}: +${currentItem.specialValue}%` : '(Không có)';
            oldStatsText = `Công: +${currentItem.atk}\n\nMáu: +${currentItem.hp}\n\n${oldSpecialText}`;
        } else {
            oldStatsText = `\n(Ô Trống)`;
        }
        
        let oldPanel = this.add.text(290, 360, oldStatsText, { font: '15px Arial', fill: '#aaaaaa', lineSpacing: 4 });
       
        // Nếu đang mặc đồ, lôi ảnh cũ ra vẽ. Nếu trống thì vẽ ô đen xám
        if (currentItem) {
            let keyOld = `item_${currentItem.type}_${currentItem.rarity}`;
            let oldItemSprite = this.add.image(350, 300, keyOld).setDisplaySize(50, 50).setDepth(101);
            popup.add(oldItemSprite);
        } else {
            let oldItemPlaceholder = this.add.rectangle(350, 300, 50, 50, 0x000000, 0.4).setStrokeStyle(2, 0x555555);
            let oldItemLabel = this.add.text(350, 300, 'Trống', { font: '10px Arial', fill: '#888' }).setOrigin(0.5);
            popup.add([oldItemPlaceholder, oldItemLabel]);
        }
        popup.add(oldPanel);
        // NÚT TRANG BỊ
        let equipBtn = this.add.rectangle(170, 590, 150, 45, 0x4caf50).setInteractive({ useHandCursor: true });
        let equipText = this.add.text(170, 590, 'MẶC ĐỒ', { font: 'bold 18px Arial', fill: '#ffffff' }).setOrigin(0.5);
        equipBtn.on('pointerdown', () => {
            this.player.equipment[newItem.type] = newItem; 
            this.recalculateCombatPower();
            this.updateEquipmentSlotsVisual(); 
            this.isPopupOpen = false; 
            popup.destroy();

             this.saveGame();
        });

        // NÚT BÁN
         let sellBtn = this.add.rectangle(370, 590, 150, 45, 0xf44336).setInteractive({ useHandCursor: true });
        let sellText = this.add.text(370, 590, 'BÁN', { font: 'bold 18px Arial', fill: '#ffffff' }).setOrigin(0.5);
        sellBtn.on('pointerdown', () => {
            // --- BẢN ĐỒ GIÁ BÁN PHẨM CHẤT CHUẨN XÁC THEO YÊU CẦU CỦA CẬU ---
            const rarityPrices = {
                common: 10,
                uncommon: 20,
                rare: 40,       // Xanh dương: 40 Linh thạch
                epic: 80,       // Tím: 80 Linh thạch (gấp đôi xanh dương)
                legendary: 160, // Cam: 160 Linh thạch (gấp đôi tím)
                mythic: 320     // Đỏ: 320 Linh thạch (gấp đôi cam)
            };

            let coinGained = rarityPrices[newItem.rarity];
            let expGained = 15; 
            
            this.player.gold += coinGained;
            this.gainExp(expGained);
            this.isPopupOpen = false; 
            popup.destroy();

             this.saveGame();
        });

        popup.add([equipBtn, equipText, sellBtn, sellText]);
    }

   upgradeTree() {
        if (this.isPopupOpen) return;
        
        // Đoạn này lấy giá tiền từ mảng treeUpgradeCosts
        let currentCost = this.treeUpgradeCosts[this.player.treeLevel];
        
        if (this.player.treeLevel >= 10) {
            this.showFloatingText(270, 680, "CÂY THẦN ĐẠT CẤP TỐI ĐA (10)!", "#ffeb3b");
            return;
        }

        if (this.player.gold < currentCost) {
            this.showFloatingText(270, 680, `THIẾU LINH THẠCH! CẦN ${currentCost} 💎`, "#ff3333");
            return;
        }

        // Khấu trừ linh thạch và tăng cấp
        this.player.gold -= currentCost;
        this.player.treeLevel++;
        this.treeLevelText.setText(`Cây Thần Cấp: ${this.player.treeLevel}`);
        
        let nextCost = this.treeUpgradeCosts[this.player.treeLevel];
        let nextCostText = this.player.treeLevel >= 10 ? "MAX LEVEL" : `Nâng Cây: ${nextCost} 💎`;
        this.upgradeCostText.setText(nextCostText);

        this.showFloatingText(270, 380, `Cây Lên Cấp ${this.player.treeLevel}!`, '#ffeb3b');
        this.updateResourceHUD();

         this.saveGame();
    }

    // =======================================================
    // POPUP BẢNG THUỘC TÍNH CHI TIẾT NHÂN VẬT (PROFILE)
    // =======================================================
    showProfilePopup() {
        if (this.isPopupOpen) return;
        this.isPopupOpen = true;

        let popup = this.add.container(0, 0).setDepth(200);
        
        // Màn đen che nền
        let bgMask = this.add.rectangle(270, 480, 540, 960, 0x000000, 0.7).setInteractive();
        // Bảng khung chính
        let board = this.add.rectangle(270, 480, 460, 600, 0x1a1c1a).setStrokeStyle(4, 0xffeb3b);
        popup.add([bgMask, board]);

        let title = this.add.text(270, 220, "THÔNG TIN ĐẠO HỮU", { font: 'bold 24px Arial', fill: '#ffeb3b' }).setOrigin(0.5);
        popup.add(title);

        // KHU VỰC 1: Thuộc Tính Cơ Bản
        let basicText = `--- THUỘC TÍNH CƠ BẢN ---\n` +
                        `Cấp độ: ${this.player.level}\n` +
                        `Công (ATK): ${this.player.stats.atk}\n` +
                        `Thủ (DEF): ${this.player.stats.def}\n` +
                        `Máu (HP): ${this.player.stats.hp}`;
        let txtBasic = this.add.text(70, 270, basicText, { font: '14px Arial', fill: '#ffffff', lineSpacing: 4 });

        // KHU VỰC 2: Thuộc Tính Chiến Đấu 
        let spec = this.player.stats;
        let specialText = `--- THUỘC TÍNH ĐẶC BIỆT ---\n` +
                          `Bạo Kích: ${spec.crit.toFixed(1)}%\n` +
                          `Liên Kích: ${spec.combo.toFixed(1)}%\n` +
                          `Phản Kích: ${spec.counter.toFixed(1)}%\n` +
                          `Choáng: ${spec.stun.toFixed(1)}%\n` +
                          `Né Tránh: ${spec.dodge.toFixed(1)}%\n` +
                          `Hút Máu: ${spec.lifesteal.toFixed(1)}%`;
        let txtSpecial = this.add.text(70, 390, specialText, { font: '14px Arial', fill: '#4caf50', lineSpacing: 4 });

        // KHU VỰC 3: Thuộc Tính Kháng
        let resistText = `--- THUỘC TÍNH KHÁNG ---\n` +
                         `Kháng Bạo: ${spec.k_crit.toFixed(1)}%\n` +
                         `Kháng Liên Kích: ${spec.k_combo.toFixed(1)}%\n` +
                         `Kháng Phản: ${spec.k_counter.toFixed(1)}%\n` +
                         `Kháng Choáng: ${spec.k_stun.toFixed(1)}%\n` +
                         `Kháng Né Tránh: ${spec.k_dodge.toFixed(1)}%\n` +
                         `Kháng Hút Máu: ${spec.k_lifesteal.toFixed(1)}%`;
        let txtResist = this.add.text(270, 390, resistText, { font: '14px Arial', fill: '#f44336', lineSpacing: 4 });
        
        popup.add([txtBasic, txtSpecial, txtResist]);

        // Nút Đóng Popup
        let closeBtn = this.add.rectangle(270, 720, 150, 45, 0xe0e0e0).setInteractive({ useHandCursor: true });
        let closeText = this.add.text(270, 720, 'HỒI CUNG', { font: 'bold 16px Arial', fill: '#111' }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => {
            this.isPopupOpen = false;
            popup.destroy();
        });
        popup.add([closeBtn, closeText]);
    }

    showcreateEquipmentofilePopup() {
        if (this.isPopupOpen) return;
        this.isPopupOpen = true;

        let popup = this.add.container(0, 0).setDepth(200);
        let bgMask = this.add.rectangle(270, 480, 540, 960, 0x000000, 0.7).setInteractive();
        let board = this.add.rectangle(270, 480, 460, 600, 0x1a1c1a).setStrokeStyle(4, 0xffeb3b);
        popup.add([bgMask, board]);

        let title = this.add.text(270, 220, "THÔNG TIN ĐẠO HỮU", { font: 'bold 24px Arial', fill: '#ffeb3b' }).setOrigin(0.5);
        popup.add(title);

        let basicText = `--- THUỘC TÍNH CƠ BẢN ---\n` +
                        `Cấp độ: ${this.player.level}\n` +
                        `Công (ATK): ${this.player.stats.atk}\n` +
                        `Thủ (DEF): ${this.player.stats.def}\n` +
                        `Máu (HP): ${this.player.stats.hp}`;
        let txtBasic = this.add.text(70, 270, basicText, { font: '14px Arial', fill: '#ffffff', lineSpacing: 4 });

        let spec = this.player.stats;
        let specialText = `--- THUỘC TÍNH ĐẶC BIỆT ---\n` +
                          `Bạo Kích: ${spec.crit.toFixed(1)}%\n` +
                          `Liên Kích: ${spec.combo.toFixed(1)}%\n` +
                          `Phản Kích: ${spec.counter.toFixed(1)}%\n` +
                          `Choáng: ${spec.stun.toFixed(1)}%\n` +
                          `Né Tránh: ${spec.dodge.toFixed(1)}%\n` +
                          `Hút Máu: ${spec.lifesteal.toFixed(1)}%`;
        let txtSpecial = this.add.text(70, 390, specialText, { font: '14px Arial', fill: '#4caf50', lineSpacing: 4 });

        let resistText = `--- THUỘC TÍNH KHÁNG ---\n` +
                         `Kháng Bạo: ${spec.k_crit.toFixed(1)}%\n` +
                         `Kháng Liên Kích: ${spec.k_combo.toFixed(1)}%\n` +
                         `Kháng Phản: ${spec.k_counter.toFixed(1)}%\n` +
                         `Kháng Choáng: ${spec.k_stun.toFixed(1)}%\n` +
                         `Kháng Né Tránh: ${spec.k_dodge.toFixed(1)}%\n` +
                         `Kháng Hút Máu: ${spec.k_lifesteal.toFixed(1)}%`;
        let txtResist = this.add.text(270, 390, resistText, { font: '14px Arial', fill: '#f44336', lineSpacing: 4 });
        
        popup.add([txtBasic, txtSpecial, txtResist]);

        let closeBtn = this.add.rectangle(270, 720, 150, 45, 0xe0e0e0).setInteractive({ useHandCursor: true });
        let closeText = this.add.text(270, 720, 'HỒI CUNG', { font: 'bold 16px Arial', fill: '#111' }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => {
            this.isPopupOpen = false;
            popup.destroy();
        });
        popup.add([closeBtn, closeText]);
    }

    showBuyEnergyPopup() {
        if (this.isPopupOpen) return;
        this.isPopupOpen = true;

        let popup = this.add.container(0, 0).setDepth(200);
        let bgMask = this.add.rectangle(270, 480, 540, 960, 0x000000, 0.7).setInteractive();
        let board = this.add.rectangle(270, 480, 400, 300, 0x222222).setStrokeStyle(3, 0xff9800);
        popup.add([bgMask, board]);

        let title = this.add.text(270, 370, "TIỆM THỂ LỰC", { font: 'bold 22px Arial', fill: '#ff9800' }).setOrigin(0.5);
        popup.add(title);

        let buyQuantity = 1;

        let qtyText = this.add.text(270, 440, `Số lượng: ${buyQuantity} Gói (⚡25)`, { font: 'bold 18px Arial', fill: '#ffffff' }).setOrigin(0.5);
        let priceText = this.add.text(270, 480, `Giá: 250 Linh Thạch 💎`, { font: '16px Arial', fill: '#aaaaaa' }).setOrigin(0.5);
        popup.add([qtyText, priceText]);

        const updatePopupText = () => {
            qtyText.setText(`Số lượng: ${buyQuantity} Gói (⚡${buyQuantity * 25})`);
            priceText.setText(`Giá: ${buyQuantity * 250} Linh Thạch 💎`);
        };

        let btnMinus = this.add.rectangle(140, 440, 35, 35, 0x555555).setInteractive({ useHandCursor: true });
        let txtMinus = this.add.text(140, 440, '-', { font: 'bold 20px Arial', fill: '#fff' }).setOrigin(0.5);
        btnMinus.on('pointerdown', () => {
            if (buyQuantity > 1) {
                buyQuantity--;
                updatePopupText();
            }
        });

        let btnPlus = this.add.rectangle(400, 440, 35, 35, 0x555555).setInteractive({ useHandCursor: true });
        let txtPlus = this.add.text(400, 440, '+', { font: 'bold 20px Arial', fill: '#fff' }).setOrigin(0.5);
        btnPlus.on('pointerdown', () => {
            buyQuantity++;
            updatePopupText();
        });
        popup.add([btnMinus, txtMinus, btnPlus, txtPlus]);

        let confirmBtn = this.add.rectangle(180, 560, 120, 40, 0x4caf50).setInteractive({ useHandCursor: true });
        let confirmText = this.add.text(180, 560, 'XÁC NHẬN', { font: 'bold 16px Arial', fill: '#ffffff' }).setOrigin(0.5);
        confirmBtn.on('pointerdown', () => {
            let totalCost = buyQuantity * 250;
            if (this.player.gold < totalCost) {
                this.showFloatingText(270, 480, "THIẾU LINH THẠCH!", "#ff3333");
            } else {
                this.player.gold -= totalCost;
                this.player.energy += buyQuantity * 25; 
                this.updateEnergyBarVisual();
                this.updateResourceHUD();
                this.isPopupOpen = false;
                popup.destroy();
                this.showFloatingText(270, 380, `Mua Thành Công ${buyQuantity * 25} Thể Lực!`, '#4caf50');

                 this.saveGame();
            }
        });

        let cancelBtn = this.add.rectangle(360, 560, 120, 40, 0xf44336).setInteractive({ useHandCursor: true });
        let cancelText = this.add.text(360, 560, 'HỦY', { font: 'bold 16px Arial', fill: '#ffffff' }).setOrigin(0.5);
        cancelBtn.on('pointerdown', () => {
            this.isPopupOpen = false;
            popup.destroy();
        });
        popup.add([confirmBtn, confirmText, cancelBtn, cancelText]);
    }

    gainExp(amount) {
        this.player.exp += amount;
        let neededExp = this.player.level * 50; 
        
        if (this.player.exp >= neededExp) {
            this.player.exp -= neededExp;
            this.player.level++; 
            this.showFloatingText(250, 620, `LÊN CẤP ${this.player.level}!`, '#ffeb3b');
        }
        this.updateResourceHUD();
    }

    showFloatingText(x, y, text, color) {
        let fText = this.add.text(x, y, text, { 
            font: 'bold 20px Arial', fill: color, stroke: '#000', strokeThickness: 3 
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: fText,
            y: y - 80, 
            alpha: 0,  
            duration: 800,
            onComplete: () => fText.destroy() 
        });
    }

    recalculateCombatPower() {
        this.player.stats = {
            hp: 100 + this.player.level * 20, 
            atk: 20 + this.player.level * 5,  
            def: 10 + this.player.level * 3,  
            crit: 0, combo: 0, counter: 0, stun: 0, dodge: 0, lifesteal: 0,
            k_crit: 0, k_combo: 0, k_counter: 0, k_stun: 0, k_dodge: 0, k_lifesteal: 0
        };
       
        for (let type of this.equipmentTypes) {
            let item = this.player.equipment[type];
            if (item) {
                this.player.stats.atk += item.atk;
                this.player.stats.hp += item.hp;
                if (item.specialStat) {
                    this.player.stats[item.specialStat] += item.specialValue;
                }
            }
        }

        if (this.player.activePet) {
            this.player.stats.atk += this.player.stats.atk * (this.player.activePet.atkBonusPercent / 100);
            this.player.stats[this.player.activePet.specialStat] += this.player.activePet.specialValue;
        }

        this.player.spiritList.forEach(spirit => {
            this.player.stats[spirit.resistStat] += spirit.resistValue;
        });

        let totalSpecialCP = 0;
        const specialPool = ['crit', 'combo', 'counter', 'stun', 'dodge', 'lifesteal'];
        specialPool.forEach(stat => {
            totalSpecialCP += this.player.stats[stat] * 10;
        });

        this.player.combatPower = Math.floor(this.player.stats.atk * 5 + this.player.stats.hp * 1 + totalSpecialCP);
        this.cpText.setText(`LỰC CHIẾN: ${this.player.combatPower}`);
    }

    // --- THÊM HÀM ĐẾM NGƯỢC HỒI THỂ LỰC MỖI 1 GIÂY ---
    updateEnergyRegen() {
        // Nếu thể lực đã đầy thì hiển thị chữ Đầy và không đếm nữa
        if (this.player.energy >= this.player.maxEnergy) {
            this.energyTimerText.setText("Thể Lực\nĐầy");
            this.energyRegenCountdown = 6; // Reset bộ đếm chờ sẵn
            return;
        }

        this.energyRegenCountdown--;
        
        if (this.energyRegenCountdown <= 0) {
            this.energyRegenCountdown = 6; // Reset bộ đếm
            this.player.energy++;
            this.updateEnergyBarVisual();
            this.updateResourceHUD();
            this.showFloatingText(510, 480, "+1 ⚡", "#4caf50");
        }

        // Cập nhật chữ hiển thị giây đếm ngược
        this.energyTimerText.setText(`Hồi sau:\n${this.energyRegenCountdown}s`);
    }

    // =======================================================
    // HỆ THỐNG LƯU TRỮ VÀ TẢI DỮ LIỆU (LOCAL STORAGE)
    // =======================================================
    
    // =======================================================
    // GIAI ĐOẠN 4: HỆ THỐNG ĐẤU TRƯỜNG PVE (AUTO-BATTLE)
    // =======================================================

   // =======================================================
    // GIAI ĐOẠN 4 (NÂNG CẤP): HỆ THỐNG VƯỢT ẢI PVE CỰC HẠN
    // =======================================================

    createPvEButton() {
        // Vẽ nút Đánh Quái
        this.pveBtn = this.add.rectangle(270, 210, 150, 45, 0xd32f2f).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true }).setDepth(10);
        this.pveText = this.add.text(270, 210, `VƯỢT ẢI ${this.player.pveStage}`, { font: 'bold 16px Arial', fill: '#ffffff' }).setOrigin(0.5).setDepth(11);
        
        this.pveBtn.on('pointerdown', () => {
            if (this.isChopping || this.isPopupOpen) return;
            this.startPvEBattle();
        });
    }

 // THUẬT TOÁN TẠO QUÁI VẬT TĂNG TIẾN (SCALING MONSTER 2.0 - HARDCORE)
    generateMonsterData() {
        let stage = this.player.pveStage; 
        
        // 1. CÔNG THỨC MÁU & CÔNG TĂNG THEO LŨY THỪA (Exponential)
        // Stage 1 -> Multiplier ~1.3
        // Stage 20 -> Multiplier ~30
        // Stage 50 -> Multiplier ~120
        let baseMultiplier = 1 + (stage * 0.4);
        let expMultiplier = Math.pow(1.08, stage); // Tăng 8% sức mạnh mỗi ải cộng dồn
        
        let finalMultiplier = baseMultiplier * expMultiplier;

        // 2. TÊN QUÁI NGẪU NHIÊN CHẾ DIỄU
        let names = ["Huyết Tu La", "Độc Giác Yêu", "Bạch Cốt Tinh", "Hắc Phong Quái", "Cửu Mệnh Miêu", "Lục Nhĩ Hầu", "Ngưu Ma Vương"];
        let randomName = names[Phaser.Math.Between(0, names.length - 1)];

        // 3. THIẾT LẬP CHỈ SỐ CƠ BẢN CỰC ĐỘ
        let monsterData = {
            name: `${randomName} (Ải ${stage})`,
            level: stage,
            hp: Math.floor(600 * finalMultiplier),    // Máu trâu hơn
            maxHp: Math.floor(600 * finalMultiplier),
            atk: Math.floor(45 * finalMultiplier),    // Đánh đau hơn
            def: Math.floor(20 * finalMultiplier),
            
            // 4. CHỈ SỐ ẨN: KHÔNG THỂ BỊ KHINH THƯỜNG Ở ẢI CAO
            stats: {
                crit: 0, combo: 0, counter: 0, stun: 0, dodge: 0, lifesteal: 0,
                k_crit: 0, k_combo: 0, k_counter: 0, k_stun: 0, k_dodge: 0, k_lifesteal: 0
            }
        };

        // Từ Ải 5 trở đi, Quái bắt đầu có chỉ số ẩn ác liệt
        if (stage >= 5) {
            // Tối đa 60% cho một dòng để không bị bất tử
            let statPower = Math.min(60, stage * 1.5); 
            let resistPower = Math.min(60, stage * 2);

            monsterData.stats.crit = statPower;
            monsterData.stats.combo = statPower * 0.8;
            monsterData.stats.counter = statPower;
            monsterData.stats.stun = Math.min(40, stage * 0.8); // Giới hạn stun tối đa 40% để người chơi còn cơ hội
            monsterData.stats.dodge = statPower;
            monsterData.stats.lifesteal = statPower * 0.5;

            // Kháng cực kỳ trâu, ép người chơi phải cày dòng chỉ số thật cao mới xuyên thủng được
            monsterData.stats.k_crit = resistPower;
            monsterData.stats.k_combo = resistPower;
            monsterData.stats.k_counter = resistPower;
            monsterData.stats.k_stun = resistPower;
            monsterData.stats.k_dodge = resistPower;
            monsterData.stats.k_lifesteal = resistPower;
        }

        return monsterData;
    }

    startPvEBattle() {
        this.isPopupOpen = true; 

        this.battleContainer = this.add.container(0, 0).setDepth(300);
        
        // VẼ BACKGROUND CHIẾN ĐẤU (Che kín màn hình)
        let bgMask = this.add.rectangle(270, 480, 540, 960, 0x000000, 1).setInteractive();
        let bgBattle = this.add.image(270, 480, 'bg_battle').setDisplaySize(540, 960).setAlpha(0.6); // Hơi tối lại để nổi bật nhân vật
        let title = this.add.text(270, 150, `VƯỢT ẢI ${this.player.pveStage}`, { font: 'bold 36px Arial', fill: '#ff4444', stroke: '#fff', strokeThickness: 4 }).setOrigin(0.5);
        
        this.battleContainer.add([bgMask, bgBattle, title]);

        this.recalculateCombatPower(); 
        this.bPlayer = {
            hp: this.player.stats.hp, maxHp: this.player.stats.hp,
            atk: this.player.stats.atk, def: this.player.stats.def,
            stats: Object.assign({}, this.player.stats), 
            isStunned: false
        };
        this.bMonster = this.generateMonsterData();
        this.bMonster.isStunned = false;

        // VẼ NHÂN VẬT VÀ QUÁI (ĐÃ THU NHỎ LẠI THEO YÊU CẦU)
        // Nhân vật bên Trái (Thu nhỏ scale từ 1.2 xuống 0.8)
        this.bPlayerSprite = this.add.sprite(150, 620, 'character').setScale(-0.8, 0.8);
        this.pHealthBg = this.add.rectangle(150, 740, 120, 15, 0x555555);
        this.pHealthBar = this.add.rectangle(150, 740, 120, 15, 0x4caf50);
        this.pHealthText = this.add.text(150, 740, `${this.bPlayer.hp}/${this.bPlayer.maxHp}`, { font: 'bold 12px Arial', fill: '#fff' }).setOrigin(0.5);
        let pName = this.add.text(150, 760, "Đạo Hữu", { font: 'bold 14px Arial', fill: '#4caf50' }).setOrigin(0.5);
        
        // Quái vật Random bên Phải (Random từ monster_1 đến monster_3)
        let randMonsterImg = `monster_${Phaser.Math.Between(1, 3)}`;
        this.bMonsterSprite = this.add.sprite(390, 610, randMonsterImg).setScale(0.8);
        this.mHealthBg = this.add.rectangle(390, 740, 120, 15, 0x555555);
        this.mHealthBar = this.add.rectangle(390, 740, 120, 15, 0xff3333);
        this.mHealthText = this.add.text(390, 740, `${this.bMonster.hp}/${this.bMonster.maxHp}`, { font: 'bold 12px Arial', fill: '#fff' }).setOrigin(0.5);
        let mName = this.add.text(390, 760, this.bMonster.name, { font: 'bold 14px Arial', fill: '#ff3333' }).setOrigin(0.5);

        this.bLogText = this.add.text(270, 400, "Trận chiến bắt đầu...", { font: '16px Arial', fill: '#fff', align: 'center', lineSpacing: 5 }).setOrigin(0.5);

        this.battleContainer.add([this.bPlayerSprite, this.pHealthBg, this.pHealthBar, this.pHealthText, pName, 
                                  this.bMonsterSprite, this.mHealthBg, this.mHealthBar, this.mHealthText, mName, this.bLogText]);

        this.currentTurn = 1;
        this.battleTimer = this.time.addEvent({
            delay: 600, 
            callback: this.executeBattleTurn,
            callbackScope: this,
            loop: true
        });
    }

    executeBattleTurn() {
        let logs = [];

        // 1. LƯỢT CỦA PLAYER
        if (this.bPlayer.hp > 0 && !this.bPlayer.isStunned) {
            let dmg = Math.max(1, this.bPlayer.atk - this.bMonster.def);
            let dodgeChance = (this.bMonster.stats.dodge - this.bPlayer.stats.k_dodge) / 100;
            
            if (Math.random() < dodgeChance) {
                logs.push(`${this.bMonster.name} Né Tránh!`);
                this.showDamageText(this.bMonsterSprite, "NÉ TRÁNH", "#ffffff");
            } else {
                let critChance = (this.bPlayer.stats.crit - this.bMonster.stats.k_crit) / 100;
                if (Math.random() < critChance) {
                    dmg = Math.floor(dmg * 2);
                    logs.push(`Bạn chém BẠO KÍCH: ${dmg}`);
                    this.showDamageText(this.bMonsterSprite, `-${dmg} CRIT!`, "#ffeb3b");
                    this.bPlayerSprite.scaleX = 0.9; // Scale giật hình tương đối với gốc 0.8
                } else {
                    logs.push(`Bạn chém: ${dmg}`);
                    this.showDamageText(this.bMonsterSprite, `-${dmg}`, "#ff5722");
                }
                this.bMonster.hp -= dmg;

                let lsChance = (this.bPlayer.stats.lifesteal - this.bMonster.stats.k_lifesteal) / 100;
                if (Math.random() < lsChance) {
                    let heal = Math.floor(dmg * 0.3);
                    this.bPlayer.hp = Math.min(this.bPlayer.maxHp, this.bPlayer.hp + heal);
                    logs.push(`Hút máu: +${heal}`);
                    this.showDamageText(this.bPlayerSprite, `+${heal}`, "#4caf50");
                }

                let stunChance = (this.bPlayer.stats.stun - this.bMonster.stats.k_stun) / 100;
                if (Math.random() < stunChance) {
                    this.bMonster.isStunned = true;
                    logs.push(`${this.bMonster.name} bị CHOÁNG!`);
                    this.showDamageText(this.bMonsterSprite, "CHOÁNG!", "#2196f3");
                }
            }
            
            // Player vung vũ khí
            this.tweens.add({ targets: this.bPlayerSprite, x: 200, scaleX: -0.9, yoyo: true, duration: 150 });
        } else if (this.bPlayer.isStunned) {
            logs.push("Bạn đang bị Choáng!");
            this.bPlayer.isStunned = false; 
        }

        this.updateHealthBars();
        if (this.bMonster.hp <= 0) {
            this.endPvEBattle(true);
            return;
        }

        // 2. LƯỢT CỦA QUÁI VẬT
        if (!this.bMonster.isStunned) {
            let mDmg = Math.max(1, this.bMonster.atk - this.bPlayer.def);
            let pDodgeChance = (this.bPlayer.stats.dodge - this.bMonster.stats.k_dodge) / 100;

            if (Math.random() < pDodgeChance) {
                logs.push("Bạn Né Tránh thành công!");
                this.showDamageText(this.bPlayerSprite, "NÉ TRÁNH", "#ffffff");
            } else {
                let mCritChance = (this.bMonster.stats.crit - this.bPlayer.stats.k_crit) / 100;
                if (Math.random() < mCritChance) {
                    mDmg = Math.floor(mDmg * 1.5);
                    logs.push(`Quái cắn BẠO KÍCH: ${mDmg}`);
                    this.showDamageText(this.bPlayerSprite, `-${mDmg} CRIT!`, "#ffeb3b");
                } else {
                    logs.push(`Quái cắn: ${mDmg}`);
                    this.showDamageText(this.bPlayerSprite, `-${mDmg}`, "#ff3333");
                }
                this.bPlayer.hp -= mDmg;
            }
            
            // Quái vung móng vuốt
            this.tweens.add({ targets: this.bMonsterSprite, x: 340, yoyo: true, duration: 150 });
        } else {
            logs.push("Quái đang bị Choáng!");
            this.bMonster.isStunned = false;
        }

        this.updateHealthBars();
        this.bLogText.setText(`--- Hiệp ${this.currentTurn} ---\n` + logs.join('\n'));
        this.currentTurn++;

        if (this.bPlayer.hp <= 0) {
            this.endPvEBattle(false);
        }
    }

    updateHealthBars() {
        let pRatio = Phaser.Math.Clamp(this.bPlayer.hp / this.bPlayer.maxHp, 0, 1);
        this.tweens.add({ targets: this.pHealthBar, scaleX: pRatio, duration: 200, originX: 0 });
        this.pHealthText.setText(`${Math.max(0, this.bPlayer.hp)}/${this.bPlayer.maxHp}`);

        let mRatio = Phaser.Math.Clamp(this.bMonster.hp / this.bMonster.maxHp, 0, 1);
        this.tweens.add({ targets: this.mHealthBar, scaleX: mRatio, duration: 200, originX: 0 });
        this.mHealthText.setText(`${Math.max(0, this.bMonster.hp)}/${this.bMonster.maxHp}`);
    }

    showDamageText(targetSprite, text, color) {
        let dmgText = this.add.text(targetSprite.x, targetSprite.y - 50, text, { 
            font: 'bold 24px Arial', fill: color, stroke: '#000', strokeThickness: 4 
        }).setOrigin(0.5).setDepth(310);

        this.tweens.add({ targets: dmgText, y: targetSprite.y - 120, alpha: 0, duration: 1000, ease: 'Cubic.easeOut', onComplete: () => dmgText.destroy() });
    }

    endPvEBattle(isWin) {
        this.battleTimer.remove(); 

        let resultTitle = isWin ? "VƯỢT ẢI THÀNH CÔNG!" : "THẤT BẠI!";
        let resultColor = isWin ? "#4caf50" : "#f44336";
        
        let rewardText = "";
        if (isWin) {
            // Phần thưởng tăng tịnh tiến theo số Ải
            let goldReward = 50 * this.player.pveStage;
            let energyReward = 5 + Math.floor(this.player.pveStage / 2); // Quà năng lượng lớn dần
            
            this.player.gold += goldReward;
            this.player.energy += energyReward;
            rewardText = `Phần thưởng:\n+${goldReward} Linh Thạch 💎\n+${energyReward} Thể Lực ⚡`;
            
            // TĂNG ẢI LÊN 1 ĐỂ LẦN SAU ĐÁNH QUÁI MẠNH HƠN
            this.player.pveStage++;
            this.pveText.setText(`VƯỢT ẢI ${this.player.pveStage}`); // Cập nhật chữ trên Nút

            this.updateResourceHUD();
            this.updateEnergyBarVisual();
        } else {
            rewardText = "Lực chiến quá yếu!\nHãy về chặt cây Rèn đồ thêm!";
        }
        
        this.saveGame(); // LƯU GAME SAU KHI ĐÁNH XONG (Lưu lại chỉ số pveStage)

        let resultPanel = this.add.rectangle(270, 480, 350, 200, 0x111111, 0.95).setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(resultColor).color).setDepth(350);
        let rTitle = this.add.text(270, 420, resultTitle, { font: 'bold 28px Arial', fill: resultColor }).setOrigin(0.5).setDepth(351);
        let rReward = this.add.text(270, 470, rewardText, { font: '18px Arial', fill: '#fff', align: 'center', lineSpacing: 5 }).setOrigin(0.5).setDepth(351);
        
        let closeBtn = this.add.rectangle(270, 540, 120, 40, 0x555555).setInteractive({ useHandCursor: true }).setDepth(350);
        let closeText = this.add.text(270, 540, "TRỞ VỀ", { font: 'bold 16px Arial', fill: '#fff' }).setOrigin(0.5).setDepth(351);

        this.battleContainer.add([resultPanel, rTitle, rReward, closeBtn, closeText]);

        closeBtn.on('pointerdown', () => {
            this.battleContainer.destroy(); 
            this.isPopupOpen = false;       
        });
    }

   saveGame() {
        let saveData = JSON.stringify(this.player);
        localStorage.setItem('idleChopChopSave', saveData);
        console.log("💾 [HỆ THỐNG]: Đã Auto-save tiến trình game.");
    }
}