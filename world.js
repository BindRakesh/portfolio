import * as THREE from 'three';

// --- MATERIALS ---
const matMetal = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.3, metalness: 0.8 });
const matBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }); // White Walls/Pillar
const matCarpet = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1 }); // Dark Grey Carpet
const matDesk = new THREE.MeshStandardMaterial({ color: 0xffffff }); 
const matScreenOn = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
const matGlass = new THREE.MeshPhysicalMaterial({ 
    color: 0x88ccff, transmission: 0.9, opacity: 0.2, transparent: true, roughness: 0, side: THREE.DoubleSide 
});
// Industrial Ceiling Mats
const matDuct = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.2 });
const matPipe = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.3, roughness: 0.4 });
// Plant Mats
const matPot = new THREE.MeshStandardMaterial({ color: 0xdddddd });
const matLeaf = new THREE.MeshStandardMaterial({ color: 0x228822 });

export class OfficeBuilder {
    constructor(scene) {
        this.scene = scene;
        this.interactables = [];
    }

    createFloor() {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), matCarpet);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), matWhite);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 10;
        this.scene.add(ceiling);
    }

    createWallsAndWindows() {
        // Shifted glass slightly inward to prevent "Z-fighting" overlapping
        // Back Wall
        const backTop = new THREE.Mesh(new THREE.BoxGeometry(80, 3, 1), matWhite); backTop.position.set(0, 8.5, -20.5);
        const backBot = new THREE.Mesh(new THREE.BoxGeometry(80, 2, 1), matWhite); backBot.position.set(0, 1, -20.5);
        this.scene.add(backTop, backBot);
        
        const backGlass = new THREE.Mesh(new THREE.PlaneGeometry(80, 5.5), matGlass);
        backGlass.position.set(0, 4.75, -20); // Slightly in front of wall
        this.scene.add(backGlass);

        // Left Wall
        const leftTop = new THREE.Mesh(new THREE.BoxGeometry(60, 3, 1), matWhite); 
        leftTop.rotation.y = Math.PI/2; leftTop.position.set(-30.5, 8.5, 0);
        const leftBot = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 1), matWhite); 
        leftBot.rotation.y = Math.PI/2; leftBot.position.set(-30.5, 1, 0);
        this.scene.add(leftTop, leftBot);

        const leftGlass = new THREE.Mesh(new THREE.PlaneGeometry(60, 5.5), matGlass);
        leftGlass.rotation.y = Math.PI/2;
        leftGlass.position.set(-30, 4.75, 0);
        this.scene.add(leftGlass);

        // Right Wall (Solid White)
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 60), matWhite);
        rightWall.position.set(30, 5, 0);
        this.scene.add(rightWall);
    }

    createCeilingDetails() {
        // 1. Large Silver AC Duct (Running Left to Right)
        const mainDuct = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 80, 32), matDuct);
        mainDuct.rotation.z = Math.PI / 2;
        mainDuct.position.set(0, 9, 0);
        this.scene.add(mainDuct);

        // 2. Red Fire Pipes (Running Front to Back)
        const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 60), matPipe);
        pipe1.rotation.x = Math.PI / 2;
        pipe1.position.set(-10, 9.5, 0);
        this.scene.add(pipe1);

        const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 60), matPipe);
        pipe2.rotation.x = Math.PI / 2;
        pipe2.position.set(10, 9.5, 0);
        this.scene.add(pipe2);
    }

    createLayout() {
        // --- SECTION A: Left Side (User Area) ---
        // 3 desks wide x 2 rows
        // Position: Left side of room (-15 x)
        this.buildBlock(2, 3, -20, -10, false, "left");

        // --- SECTION B: Meeting Area ---
        // Behind the user's desk area (towards positive Z)
        this.createMeetingArea(-20, 5);

        // --- SECTION C: Right Side (General Staff) ---
        // 4 rows x 6 cols
        // Position: Right side of room (+10 x)
        // Includes Pillar Logic
        this.buildBlock(4, 6, 5, -12, true, "right");
    }

    createMeetingArea(x, z) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        // 1. Large Table
        const table = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 3), new THREE.MeshStandardMaterial({color: 0x3d3d3d}));
        table.position.y = 1.2;
        
        // Legs
        const legGeo = new THREE.BoxGeometry(0.2, 1.2, 2.5);
        const leg1 = new THREE.Mesh(legGeo, matMetal); leg1.position.set(-2, 0.6, 0);
        const leg2 = new THREE.Mesh(legGeo, matMetal); leg2.position.set(2, 0.6, 0);
        group.add(table, leg1, leg2);

        // 2. Stylish Sofas (Visual blocks)
        const sofaGeo = new THREE.BoxGeometry(1.5, 1, 1.5);
        const sofaMat = new THREE.MeshStandardMaterial({color: 0xaa5533}); // Burnt orange stylish color
        
        const pos = [[-4, 0], [4, 0], [0, 2.5], [0, -2.5]]; // Positions around table
        pos.forEach(p => {
            const sofa = new THREE.Mesh(sofaGeo, sofaMat);
            sofa.position.set(p[0], 0.5, p[1]);
            group.add(sofa);
        });

        // 3. Wall with 2 TV Screens
        const tvWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 8), matWhite);
        tvWall.position.set(-6, 2.5, 0);
        
        const screenGeo = new THREE.PlaneGeometry(3, 1.8);
        const screenMat = new THREE.MeshBasicMaterial({color: 0x000000});
        
        const tv1 = new THREE.Mesh(screenGeo, screenMat); tv1.position.set(0.15, 0.5, -1.5); tv1.rotation.y = Math.PI/2;
        const tv2 = new THREE.Mesh(screenGeo, screenMat); tv2.position.set(0.15, 0.5, 1.5); tv2.rotation.y = Math.PI/2;
        
        tvWall.add(tv1, tv2);
        group.add(tvWall);

        this.scene.add(group);
    }

    buildBlock(rows, cols, startX, startZ, hasPillar, side) {
        const spacingX = 5;
        const spacingZ = 5;

        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                const cx = startX + (c * spacingX);
                const cz = startZ + (r * spacingZ);

                // PILLAR LOGIC:
                // Only for Right Side, Row 2, Col 0 (Next to passage)
                if (hasPillar && r === 2 && c === 0) {
                    this.createPillar(cx, cz);
                    continue; 
                }

                // Make "My Desk" interactive
                // Assume my desk is Left Side, Row 0, Col 1
                const isMine = (side === "left" && r === 0 && c === 1);
                
                this.buildSingleDesk(cx, cz, isMine);
            }
        }
    }

    createPillar(x, z) {
        // White Pillar
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 2), matWhite);
        pillar.position.set(x, 5, z);
        this.scene.add(pillar);

        // Plant Pot near pillar
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.6), matPot);
        pot.position.set(x + 1.5, 0.3, z + 0.5);
        
        // Simple Plant (Sphere for bush)
        const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), matLeaf);
        plant.position.set(0, 0.6, 0);
        pot.add(plant);
        
        this.scene.add(pot);
    }

    buildSingleDesk(x, z, isInteractable) {
        const deskGroup = new THREE.Group();
        deskGroup.position.set(x, 0, z);

        // Table
        const table = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 2.2), matDesk);
        table.position.y = 1.5;
        table.castShadow = true;
        
        const legGeo = new THREE.BoxGeometry(0.1, 1.5, 2);
        const legL = new THREE.Mesh(legGeo, matMetal); legL.position.set(-2.1, 0.75, 0);
        const legR = new THREE.Mesh(legGeo, matMetal); legR.position.set(2.1, 0.75, 0);

        // Partition
        const partition = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.6, 0.05), new THREE.MeshStandardMaterial({color: 0x336699}));
        partition.position.set(0, 1.8, -1);

        // Monitor
        const monScreen = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 0.05), matBlack);
        monScreen.position.set(0, 2.0, -0.7);
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5), matBlack);
        stand.position.set(0, 1.7, -0.7);

        if (isInteractable) {
            const glowScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), matScreenOn);
            glowScreen.position.set(0, 0, 0.03);
            glowScreen.name = "HeroMonitor"; 
            monScreen.add(glowScreen);
            this.interactables.push(glowScreen);
            
            // Highlight my desk area
            const spot = new THREE.SpotLight(0xffffff, 10);
            spot.position.set(0, 6, 0);
            spot.target = table;
            deskGroup.add(spot);
        }

        // Chair
        const chairGroup = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1), matBlack);
        const back = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.1), matBlack);
        back.position.set(0, 0.6, 0.5);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8), matMetal);
        stem.position.set(0, -0.4, 0);

        chairGroup.add(seat, back, stem);
        chairGroup.position.set(0, 1, 1.2);
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
        const cityGroup = new THREE.Group();
        const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
        
        for(let i=0; i<80; i++) {
            const h = Math.random() * 40 + 10;
            const w = Math.random() * 10 + 5;
            const building = new THREE.Mesh(buildingGeo, new THREE.MeshStandardMaterial({ color: 0x1a1a2e }));
            building.scale.set(w, h, w);
            
            // Pushed Back to z = -50 or less to avoid intersecting window
            building.position.set(
                (Math.random() - 0.5) * 250,
                h/2 - 40, 
                -50 - (Math.random() * 100) // Changed from -40 to -50 start
            );
            
            if(Math.random() > 0.3) {
                const winGeo = new THREE.PlaneGeometry(0.3, 0.3);
                const winMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
                for(let k=0; k<10; k++) {
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
        const trackZ = -45; // Moved back
        
        const pillarGeo = new THREE.CylinderGeometry(2, 2, 50);
        const concMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        for(let x = -150; x <= 150; x+=30) {
            const pillar = new THREE.Mesh(pillarGeo, concMat);
            pillar.position.set(x, -25, trackZ);
            this.scene.add(pillar);
        }

        const railBed = new THREE.Mesh(new THREE.BoxGeometry(400, 2, 8), concMat);
        railBed.position.set(0, 0, trackZ);
        this.scene.add(railBed);

        const trainMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8 });
        for(let i=0; i<4; i++) {
            const car = new THREE.Mesh(new THREE.BoxGeometry(10, 3.5, 2.5), trainMat);
            car.position.set(i * 11, 2.5, 0);
            
            const winStrip = new THREE.Mesh(new THREE.PlaneGeometry(9, 1), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
            winStrip.position.set(0, 0.5, 1.26);
            car.add(winStrip);

            this.metroGroup.add(car);
        }
        
        this.metroGroup.position.set(100, 0, trackZ);
        this.scene.add(this.metroGroup);
    }

    updateMetro() {
        this.metroGroup.position.x -= 0.8;
        if(this.metroGroup.position.x < -200) {
            this.metroGroup.position.x = 200;
        }
    }
}
