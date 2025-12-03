import * as THREE from 'three';

// --- MATERIALS ---
const matMetal = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.2, metalness: 0.8 });
const matBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
const matDesk = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Bright white desks
const matScreenOn = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
const matConcrete = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 }); // For Pillar
const matGlass = new THREE.MeshPhysicalMaterial({ 
    color: 0x88ccff, transmission: 0.9, opacity: 0.2, transparent: true, roughness: 0, side: THREE.DoubleSide 
});
const matTubeLight = new THREE.MeshBasicMaterial({ color: 0xffffff });

export class OfficeBuilder {
    constructor(scene) {
        this.scene = scene;
        this.interactables = [];
    }

    createFloor() {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 }));
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 10; // High ceiling
        this.scene.add(ceiling);
    }

    createWallsAndWindows() {
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
        
        // 1. BACK WALL (With Window)
        // Solid parts (Top/Bottom)
        const backTop = new THREE.Mesh(new THREE.BoxGeometry(80, 2, 1), wallMat); backTop.position.set(0, 9, -20);
        const backBot = new THREE.Mesh(new THREE.BoxGeometry(80, 2, 1), wallMat); backBot.position.set(0, 1, -20);
        this.scene.add(backTop, backBot);
        // Glass
        const backGlass = new THREE.Mesh(new THREE.PlaneGeometry(80, 6), matGlass);
        backGlass.position.set(0, 5, -20);
        this.scene.add(backGlass);

        // 2. LEFT WALL (With Window) - Rotated 90 deg
        const leftTop = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 1), wallMat); 
        leftTop.rotation.y = Math.PI/2; leftTop.position.set(-30, 9, 0);
        const leftBot = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 1), wallMat); 
        leftBot.rotation.y = Math.PI/2; leftBot.position.set(-30, 1, 0);
        this.scene.add(leftTop, leftBot);
        // Glass
        const leftGlass = new THREE.Mesh(new THREE.PlaneGeometry(60, 6), matGlass);
        leftGlass.rotation.y = Math.PI/2;
        leftGlass.position.set(-30, 5, 0);
        this.scene.add(leftGlass);

        // 3. RIGHT WALL (Solid)
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 60), wallMat);
        rightWall.position.set(30, 5, 0);
        this.scene.add(rightWall);
    }

    createCeilingLights() {
        // Create rows of Tube lights
        for(let z = -15; z < 20; z+=10) {
            for(let x = -20; x < 20; x+=10) {
                // The physical light fixture
                const tube = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 0.5), matTubeLight);
                tube.position.set(x, 9.9, z);
                this.scene.add(tube);
                
                // The Actual Light Emitter
                const light = new THREE.PointLight(0xffffff, 0.8, 15); // Decay distance 15
                light.position.set(x, 9, z);
                this.scene.add(light);
            }
        }
    }

    createWorkstations() {
        // Block 1: 3 rows x 5 cols (Left side)
        // Starting at x: -20, z: -5
        this.buildBlock(3, 5, -18, -5, false);

        // Block 2: 4 rows x 6 cols (Right side)
        // Leave a passage gap (X axis gap)
        // Starting at x: 5, z: -8
        // Includes the PILLAR logic
        this.buildBlock(4, 6, 12, -8, true);
    }

    buildBlock(rows, cols, startX, startZ, hasPillar) {
        const spacingX = 5.5;
        const spacingZ = 6;

        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                const x = startX + (c * spacingX);
                const z = startZ + (r * spacingZ);

                // Check if this spot should be a structural PILLAR (Floor 10 support)
                // We place it in the middle of the second block (row 2, col 2)
                if (hasPillar && r === 2 && c === 2) {
                    this.createPillar(x, z);
                    continue; // Skip creating a desk here
                }

                // Make one specific desk Interactive (e.g., Row 1, Col 2 of Block 1)
                const isMine = (!hasPillar && r === 1 && c === 2); 
                this.buildSingleDesk(x, z, isMine);
            }
        }
    }

    createPillar(x, z) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 10, 32), matConcrete);
        pillar.position.set(x, 5, z);
        this.scene.add(pillar);
        
        // Add a safety sign or poster on pillar
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
        sign.position.set(x, 2.5, z + 1.6);
        this.scene.add(sign);
    }

    buildSingleDesk(x, z, isInteractable) {
        const deskGroup = new THREE.Group();
        deskGroup.position.set(x, 0, z);

        // Table
        const table = new THREE.Mesh(new THREE.BoxGeometry(5, 0.1, 2.5), matDesk);
        table.position.y = 1.5;
        table.castShadow = true;
        
        // Legs
        const legGeo = new THREE.BoxGeometry(0.1, 1.5, 2.4);
        const legL = new THREE.Mesh(legGeo, matMetal); legL.position.set(-2.4, 0.75, 0);
        const legR = new THREE.Mesh(legGeo, matMetal); legR.position.set(2.4, 0.75, 0);

        // Partition
        const partition = new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 0.05), new THREE.MeshStandardMaterial({color: 0x336699}));
        partition.position.set(0, 1.9, -1.25);

        // Monitor & Tech
        const monScreen = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.05), matBlack);
        monScreen.position.set(0, 2.1, -0.8);
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5), matBlack);
        stand.position.set(0, 1.75, -0.8);

        if (isInteractable) {
            const glowScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.8), matScreenOn);
            glowScreen.position.set(0, 0, 0.03);
            glowScreen.name = "HeroMonitor"; 
            monScreen.add(glowScreen);
            
            // Highlight Light
            const spot = new THREE.SpotLight(0x00ffff, 5);
            spot.position.set(0, 5, 0);
            spot.target = table;
            deskGroup.add(spot);

            this.interactables.push(glowScreen);
        }

        // Chair
        const chairGroup = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), matBlack);
        const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.1), matBlack);
        back.position.set(0, 0.8, 0.6);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.1), matMetal);
        base.position.set(0, -0.8, 0);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8), matMetal);
        stem.position.set(0, -0.4, 0);

        chairGroup.add(seat, back, base, stem);
        chairGroup.position.set(0, 1, 1.5);
        if(!isInteractable) chairGroup.rotation.y = (Math.random() - 0.5);
        
        deskGroup.add(table, legL, legR, partition, monScreen, stand, chairGroup);
        this.scene.add(deskGroup);
    }
}

export class CityBuilder {
    constructor(scene) {
        this.scene = scene;
        this.metroGroup = new THREE.Group();
    }

    createCity() {
        // Increased city brightness for "Evening but visible"
        const cityGroup = new THREE.Group();
        const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
        
        for(let i=0; i<80; i++) {
            const h = Math.random() * 30 + 10;
            const w = Math.random() * 8 + 4;
            // Brighter building color
            const building = new THREE.Mesh(buildingGeo, new THREE.MeshStandardMaterial({ color: 0x222244 }));
            building.scale.set(w, h, w);
            building.position.set(
                (Math.random() - 0.5) * 200,
                h/2 - 30, 
                -40 - (Math.random() * 80)
            );
            
            // Lit Windows
            if(Math.random() > 0.2) {
                const winGeo = new THREE.PlaneGeometry(0.3, 0.3);
                const winMat = new THREE.MeshBasicMaterial({ color: 0xffddaa }); // Warm window light
                for(let k=0; k<15; k++) {
                    const win = new THREE.Mesh(winGeo, winMat);
                    win.position.set((Math.random()-0.5), (Math.random()-0.5), 0.51);
                    building.add(win);
                }
            }
            cityGroup.add(building);
        }
        this.scene.add(cityGroup);
    }

    createMetroSystem() {
        const trackZ = -35; 
        
        // Pillars
        const pillarGeo = new THREE.CylinderGeometry(2, 2, 40);
        const concMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        for(let x = -100; x <= 100; x+=25) {
            const pillar = new THREE.Mesh(pillarGeo, concMat);
            pillar.position.set(x, -20, trackZ);
            this.scene.add(pillar);
        }

        // Rail Bed
        const railBed = new THREE.Mesh(new THREE.BoxGeometry(300, 2, 8), concMat);
        railBed.position.set(0, 0, trackZ);
        this.scene.add(railBed);

        // Train
        const trainMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8 });
        for(let i=0; i<3; i++) {
            const car = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 2.5), trainMat);
            car.position.set(i * 11, 2, 0);
            
            // Glowing Window Strip
            const winStrip = new THREE.Mesh(new THREE.PlaneGeometry(9, 1), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
            winStrip.position.set(0, 0.5, 1.26);
            car.add(winStrip);

            this.metroGroup.add(car);
        }
        
        this.metroGroup.position.set(80, 0, trackZ);
        this.scene.add(this.metroGroup);
    }

    updateMetro() {
        this.metroGroup.position.x -= 0.5; // Faster train
        if(this.metroGroup.position.x < -150) {
            this.metroGroup.position.x = 150;
        }
    }
}
