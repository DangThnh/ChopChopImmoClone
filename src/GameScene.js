class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        if (this.textures.exists('bg')) {
            this.add.image(270, 480, 'bg').setDisplaySize(540, 960).setDepth(0);
        }

        // =======================================================
        // 1. DATABASE: DỮ LIỆU NGƯỜI CHƠI (CORE STATE)
        // =======================================================
        this.player = {
            level: 1,
            exp: 0,
            gold: 200, 
            treeLevel: 1, 
            combatPower: 100,
            energy: 50,      
            maxEnergy: 50,   
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

        this.equipmentTypes = ['weapon', 'hat', 'clothes', 'belt', 'shoes', 'ring', 'bracelet', 'necklace', 'jade', 'amulet', 'mirror', 'seal'];
        this.slotAbbreviations = {
            weapon: 'WP', hat: 'HT', clothes: 'CL', belt: 'BT',
            shoes: 'SH', ring: 'RG', bracelet: 'BR', necklace: 'NL',
            jade: 'JD', amulet: 'AM', mirror: 'MR', seal: 'SL'
        };

        this.rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
        this.rarityNames = { common: 'Thường', uncommon: 'Ưu Tú', rare: 'Hiếm', epic: 'Ưu Việt', legendary: 'Huyền Thoại', mythic: 'Thần Thoại' };
        this.rarityColors = { common: '#ffffff', uncommon: '#4caf50', rare: '#2196f3', epic: '#9c27b0', legendary: '#ff9800', mythic: '#f44336' };

        // BẢNG TỶ LỆ GACHA MỐC CHUẨN
        this.treeDropRates = {
            1:  { common: 0.80, uncommon: 0.20, rare: 0.00, epic: 0.00, legendary: 0.00, mythic: 0.00 },
            5:  { common: 0.40, uncommon: 0.40, rare: 0.15, epic: 0.05, legendary: 0.00, mythic: 0.00 },
            10: { common: 0.10, uncommon: 0.30, rare: 0.35, epic: 0.20, legendary: 0.04, mythic: 0.01 }
        };

        this.isChopping = false;
        this.isPopupOpen = false;
        this.hudSlots = {};

        this.treeUpgradeCosts = [0, 100, 300, 800, 2000, 5000, 12000, 25000, 50000, 100000, 9999999];

        this.createGameUI();
        this.createEquipmentSlotsHUD(); 
        this.recalculateCombatPower();
        this.updateResourceHUD(); 

        this.time.addEvent({
            delay: 12000,
            callback: () => {
                if (this.player.energy < this.player.maxEnergy) {
                    this.player.energy++;
                    this.updateEnergyBarVisual();
                }
            },
            loop: true
        });
    }

    createGameUI() {
        // UI Lực Chiến
        this.cpText = this.add.text(270, 80, `LỰC CHIẾN: ${this.player.combatPower}`, { 
            font: 'bold 32px Arial', fill: '#ffeb3b', stroke: '#000', strokeThickness: 5 
        }).setOrigin(0.5).setDepth(10);

        // UI HUD Tài nguyên
        this.hudText = this.add.text(100, 30, `Đạo Hữu - Cấp: 1 | Exp: 0% | Linh Thạch: 0`, {
            font: 'bold 14px Arial', fill: '#ffffff', stroke: '#000', strokeThickness: 3
        }).setOrigin(0, 0.5).setDepth(10);

        // UI Cấp Cây Thần
        this.treeLevelText = this.add.text(270, 150, `Cây Thần Cấp: ${this.player.treeLevel}`, { 
            font: 'bold 18px Arial', fill: '#ffffff', stroke: '#000', strokeThickness: 3 
        }).setOrigin(0.5).setDepth(10);

        // Nút nâng cấp cây
        this.upgradeTreeBtn = this.add.rectangle(270, 740, 200, 45, 0x8b5a2b).setStrokeStyle(2, 0xffeb3b).setInteractive({ useHandCursor: true }).setDepth(10);
        this.upgradeCostText = this.add.text(270, 740, `Nâng Cây: 100 💎`, { font: 'bold 16px Arial', fill: '#ffffff' }).setOrigin(0.5).setDepth(11);
        this.upgradeTreeBtn.on('pointerdown', () => this.upgradeTree());

        // Cây Thần và Nhân vật
        this.sacredTree = this.add.sprite(270, 380, 'tree').setDepth(5);
        this.sacredTree.setScale(0.75); 
        this.sacredTree.setInteractive({ useHandCursor: true });
        this.character = this.add.sprite(250, 620, 'character').setDepth(6); 
        this.character.setScale(0.75);

        this.sacredTree.on('pointerdown', this.chopTree, this);

        // Cột năng lượng
        this.energyBarBg = this.add.rectangle(510, 380, 16, 260, 0x333333).setStrokeStyle(2, 0xffffff).setDepth(10);
        this.energyBarFill = this.add.rectangle(510, 510, 16, 260, 0x4caf50).setDepth(11); 
        
        this.buyEnergyBtn = this.add.rectangle(510, 220, 35, 35, 0xff9800).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true }).setDepth(10);
        this.add.text(510, 220, '+⚡', { font: 'bold 16px Arial', fill: '#fff' }).setOrigin(0.5).setDepth(11);
        this.buyEnergyBtn.on('pointerdown', () => this.showBuyEnergyPopup());

        this.updateEnergyBarVisual();
    }

    updateEnergyBarVisual() {
        let ratio = this.player.energy / this.player.maxEnergy;
        this.energyBarFill.height = 260 * ratio;
        this.energyBarFill.y = 380 + (130 * (1 - ratio)); 
    }

 createEquipmentSlotsHUD() {
        let startX = 65; let stepX = 68;
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

        let boxY = y - 110; 
        let panel = this.add.rectangle(x, boxY, 180, 140, 0x111111, 0.95).setStrokeStyle(2, 0x8b5a2b);
        
        let contentText = "";
        if (item) {
            contentText = `${item.type.toUpperCase()} (Lv.${item.level})\n` +
                          `Phẩm: ${this.rarityNames[item.rarity]}\n` +
                          `Công: +${item.atk}\n` +
                          `Máu: +${item.hp}\n` +
                          `${item.specialStat ? item.specialStat.toUpperCase() + ': +' + item.specialValue + '%' : ''}`;
        } else {
            contentText = `${type.toUpperCase()}\n\n(Chưa Trang Bị)`;
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
    getDropRatesByTreeLevel(level) {
        if (level >= 10) return this.treeDropRates[10];
        if (level >= 5) return this.treeDropRates[5];
        return this.treeDropRates[1]; // Trả về tỷ lệ cấp 1 cho các cấp 2, 3, 4
    }

    generateRandomDrop() {
        // --- SỬA LỖI TRUY XUẤT: Gọi hàm làm tròn tỷ lệ an toàn ---
        let rates = this.getDropRatesByTreeLevel(this.player.treeLevel);
        
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
        let newStatsText = `Công: +${newItem.atk}\n\nMáu: +${newItem.hp}\n\n${newItem.specialStat ? newItem.specialStat.toUpperCase() + ': +' + newItem.specialValue + '%' : '(Không có)'}`;
        let newPanel = this.add.text(70, 360, newStatsText, { font: '15px Arial', fill: '#ffffff', lineSpacing: 4 });
        
        // Thay thế Placeholder đen bằng ảnh PNG thật của món đồ mới!
        let keyNew = `item_${newItem.type}_${newItem.rarity}`;
        let newItemSprite = this.add.image(130, 300, keyNew).setDisplaySize(50, 50).setDepth(101);

        let diffAtkText = this.add.text(165, 377, atkDiffText, { font: 'bold 15px Arial', fill: atkDiffColor });
        let diffHpText = this.add.text(165, 415, hpDiffText, { font: 'bold 15px Arial', fill: hpDiffColor });
        popup.add([newPanel, diffAtkText, diffHpText, newItemSprite]);

        // --- PANEL PHẢI: HIỂN THỊ ẢNH MÓN ĐANG MẶC ---
        let oldStatsText = currentItem ? 
            `Công: +${currentItem.atk}\n\nMáu: +${currentItem.hp}\n\n${currentItem.specialStat ? currentItem.specialStat.toUpperCase() + ': +' + currentItem.specialValue + '%' : '(Không có)'}` 
            : `\n(Ô Trống)`;
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
        });

        // NÚT BÁN
        let sellBtn = this.add.rectangle(370, 590, 150, 45, 0xf44336).setInteractive({ useHandCursor: true });
        let sellText = this.add.text(370, 590, 'BÁN', { font: 'bold 18px Arial', fill: '#ffffff' }).setOrigin(0.5);
        sellBtn.on('pointerdown', () => {
            let coinGained = (this.rarities.indexOf(newItem.rarity) + 1) * 10;
            let expGained = 15; 
            this.player.gold += coinGained;
            this.gainExp(expGained);
            this.isPopupOpen = false; 
            popup.destroy();
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

        let qtyText = this.add.text(270, 440, `Số lượng: ${buyQuantity} Gói (⚡50)`, { font: 'bold 18px Arial', fill: '#ffffff' }).setOrigin(0.5);
        let priceText = this.add.text(270, 480, `Giá: 500 Linh Thạch 💎`, { font: '16px Arial', fill: '#aaaaaa' }).setOrigin(0.5);
        popup.add([qtyText, priceText]);

        const updatePopupText = () => {
            qtyText.setText(`Số lượng: ${buyQuantity} Gói (⚡${buyQuantity * 50})`);
            priceText.setText(`Giá: ${buyQuantity * 500} Linh Thạch 💎`);
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
            let totalCost = buyQuantity * 500;
            if (this.player.gold < totalCost) {
                this.showFloatingText(270, 480, "THIẾU LINH THẠCH!", "#ff3333");
            } else {
                this.player.gold -= totalCost;
                this.player.energy += buyQuantity * 50; 
                this.updateEnergyBarVisual();
                this.updateResourceHUD();
                this.isPopupOpen = false;
                popup.destroy();
                this.showFloatingText(270, 380, `Mua Thành Công ${buyQuantity * 50} Thể Lực!`, '#4caf50');
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
}