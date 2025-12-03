import * as THREE from 'three';

// --- MATERIALS ---
const matMetal = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.3, metalness: 0.8 });
const matBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
// CHANGED: Lighter Grey-Blue Carpet so it is visible against the dark background
const matCarpet = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 1 }); 
const matDesk = new THREE.MeshStandardMaterial({ color: 0xffffff }); 
const matScreenOn = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
const matGlass = new THREE.MeshPhysicalMaterial({ 
    color: 0x88ccff, transmission: 0.9, opacity: 0.2, transparent: true, roughness: 0, side: THREE.DoubleSide 
});
const matDuct = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.2 });
const matPipe = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.3, roughness: 0.4 });
const matPot = new THREE.MeshStandardMaterial({ color: 0xdddddd });
const matLeaf = new THREE.MeshStandardMaterial({ color: 0x228822 });

// Car Materials
const matCarBody = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.6, roughness: 0.2 });
const matWheel = new THREE.MeshStandardMaterial({ color: 0x111111 });
const matHeadlight = new THREE.MeshBasicMaterial({ color: 0xffffff });

export class OfficeBuilder {
    constructor(scene) {
        this.scene = scene;
        this.interactables = [];
        this.colliders = []; 
    }

    createFloor() {
        // Floor Mat (Carpet)
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), matCarpet);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Ceiling
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), matWhite);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 10;
        this.scene.add(ceiling);
    }

    createWallsAndWindows() {
        // Back Wall
        const backTop = new THREE.Mesh(new THREE.BoxGeometry(80, 3, 1), matWhite); backTop.position.set(0, 8.5, -20.5);
        const backBot = new THREE.Mesh(new THREE.BoxGeometry(80, 2, 1), matWhite); backBot.position.set(0, 1, -20.5);
        this.scene.add(backTop, backBot);
        const backGlass = new THREE.Mesh(new THREE.PlaneGeometry(80, 5.5), matGlass);
        backGlass.position.set(0, 4.75, -20);
        this.scene.add(backGlass);
        this.colliders.push(backBot);

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
        this.colliders.push(leftBot);

        // Right Wall
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 60), matWhite);
        rightWall.position.set(30, 5, 0);
        this.scene.add(rightWall);
        this.colliders.push(rightWall);
    }

    createCeilingDetails() {
        const mainDuct = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 80, 32), matDuct);
        mainDuct.rotation.z = Math.PI / 2;
        mainDuct.position.set(0, 9, 0);
        this.scene.add(mainDuct);

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
        // --- SECTION A: Left Side (User + Team) ---
        // 3 desks wide x 4 rows deep
        // Changed Z start to -15 so there are rows behind you
        // Start X at -20
        this.buildBlock(4, 3, -20, -10, false, "left");

        // --- SECTION B: Right Side (General Staff) ---
        // Moved closer to center (Start X = 2 instead of 5) to close the gap
        // 4 rows x 5 cols
        this.buildBlock(4, 5, 2, -10, true, "right");
    }

    buildBlock(rows, cols, startX, startZ, hasPillar, side) {
        const spacingX = 5;
        const spacingZ = 5;

        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                const cx = startX + (c * spacingX);
                const cz = startZ + (r * spacingZ);

                // PILLAR LOGIC: Right side, Row 2, Col 0 (Next to passage)
                if (hasPillar && r === 2 && c === 0) {
                    this.createPillar(cx, cz);
                    continue; 
                }

                // Make "My Desk" interactive
                // User is on Left Side, Row 0 (Front), Col 1 (Middle of the 3)
                const isMine = (side === "left" && r === 0 && c === 1);
                
                this.buildSingleDesk(cx, cz, isMine);
            }
        }
    }

    createPillar(x, z) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 2), matWhite);
        pillar.position.set(x, 5, z);
        this.scene.add(pillar);
        this.colliders.push(pillar);

        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.6), matPot);
        pot.position.set(x + 1.5, 0.3, z + 0.5);
        const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), matLeaf);
        plant.position.set(0, 0.6, 0);
        pot.add(plant);
        this.scene.add(pot);
        this.colliders.push(pot);
    }

    buildSingleDesk(x, z, isInteractable) {
        const deskGroup = new THREE.Group();
        deskGroup.position.set(x, 0, z);

        const table = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 2.2), matDesk);
        table.position.y = 1.5;
        table.castShadow = true;
        
        const legGeo = new THREE.BoxGeometry(0.1, 1.5, 2);
        const legL = new THREE.Mesh(legGeo, matMetal); legL.position.set(-2.1, 0.75, 0);
        const legR = new THREE.Mesh(legGeo, matMetal); legR.position.set(2.1, 0.75, 0);
        
        const collider = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2, 2.2), new THREE.MeshBasicMaterial({visible: false}));
        collider.position.set(x, 1, z);
        this.scene.add(collider);
        this.colliders.push(collider);

        const partition = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.6, 0.05), new THREE.MeshStandardMaterial({color: 0x336699}));
        partition.position.set(0, 1.8, -1);

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
            
            const spot = new THREE.SpotLight(0xffffff, 10);
            spot.position.set(0, 6, 0);
            spot.target = table;
            deskGroup.add(spot);
        }

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

export class RCCar {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.speed = 0;
        this.steering = 0;
        this.maxSpeed = 0.4;
        this.friction = 0.96;
        this.acceleration = 0.02;

        this.createCarMesh();
        
        // Start position near user desk
        this.mesh.position.set(-15, 0.4, -5); 
        this.scene.add(this.mesh);
    }

    createCarMesh() {
        const body = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1.8), matCarBody);
        body.castShadow = true;
        this.mesh.add(body);

        const roof = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 1), matCarBody);
        roof.position.y = 0.45;
        this.mesh.add(roof);

        const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.2);
        wheelGeo.rotateZ(Math.PI/2);
        const pos = [[-0.55, 0.6], [0.55, 0.6], [-0.55, -0.6], [0.55, -0.6]];
        pos.forEach(p => {
            const w = new THREE.Mesh(wheelGeo, matWheel);
            w.position.set(p[0], -0.1, p[1]);
            this.mesh.add(w);
        });

        const hl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), matHeadlight);
        hl.position.set(-0.3, 0.0, -0.91); 
        hl.rotation.y = Math.PI; 
        const hr = hl.clone(); hr.position.set(0.3, 0.0, -0.91);
        this.mesh.add(hl, hr);
        
        const beam = new THREE.SpotLight(0xffffff, 5, 10, 0.6, 0.5, 1);
        beam.position.set(0, 0.5, -0.8);
        beam.target.position.set(0, 0, -5);
        this.mesh.add(beam);
        this.mesh.add(beam.target);
    }

    update(keys) {
        if(keys['w'] || keys['ArrowUp']) this.speed -= this.acceleration;
        if(keys['s'] || keys['ArrowDown']) this.speed += this.acceleration;
        
        if(Math.abs(this.speed) > 0.001) {
            if(keys['a'] || keys['ArrowLeft']) this.steering += 0.05;
            if(keys['d'] || keys['ArrowRight']) this.steering -= 0.05;
        }

        this.speed *= this.friction;
        this.steering *= 0.9; 
        this.speed = Math.max(Math.min(this.speed, this.maxSpeed), -this.maxSpeed);

        this.mesh.translateX(this.steering * this.speed * 2); 
        this.mesh.translateZ(this.speed);
        this.mesh.rotation.y += this.steering * (this.speed * 3); 
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
            building.position.set(
                (Math.random() - 0.5) * 250, h/2 - 40, -60 - (Math.random() * 100)
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
        const trackZ = -45;
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
        if(this.metroGroup.position.x < -200) this.metroGroup.position.x = 200;
    }
}
