import * as THREE from 'three';

// --- SHARED MATERIALS ---
const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
const matCarpet = new THREE.MeshStandardMaterial({ color: 0x667788, roughness: 1 }); // Blue-Grey Day Carpet
const matGlass = new THREE.MeshPhysicalMaterial({ 
    color: 0x88ccff, transmission: 0.9, opacity: 0.2, transparent: true, roughness: 0, side: THREE.DoubleSide 
});
const matDuct = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.2 });
const matPipe = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.3, roughness: 0.4 });
const matPot = new THREE.MeshStandardMaterial({ color: 0xffffff });
const matLeaf = new THREE.MeshStandardMaterial({ color: 0x22aa22 });

// --- INTERNAL CLASS: OFFICE CHAIR ---
class OfficeChair {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
        this.mesh.scale.set(1.3, 1.3, 1.3); // Scale up
    }

    build() {
        const matBlackPlastic = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
        const matFabric = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1.0 });
        const matChrome = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.1 });

        const baseGroup = new THREE.Group();
        const legGeo = new THREE.BoxGeometry(0.1, 0.05, 0.7);
        for(let i=0; i<5; i++) {
            const leg = new THREE.Mesh(legGeo, matChrome);
            leg.rotation.y = (i / 5) * Math.PI * 2;
            leg.position.y = 0.1;
            leg.translateZ(0.35);
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05), matBlackPlastic);
            wheel.rotation.z = Math.PI/2;
            wheel.position.set(0, -0.05, 0.3);
            leg.add(wheel);
            baseGroup.add(leg);
        }
        this.mesh.add(baseGroup);

        const lift = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6), matChrome);
        lift.position.y = 0.4;
        this.mesh.add(lift);

        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), matFabric);
        seat.position.y = 0.7;
        this.mesh.add(seat);

        const backGroup = new THREE.Group();
        backGroup.position.set(0, 0.9, 0.3);
        const spine = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.05), matBlackPlastic);
        spine.rotation.x = -0.1; 
        const meshBack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.02), matFabric);
        meshBack.position.z = 0.05;
        meshBack.rotation.x = -0.1;
        const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.05), matFabric);
        headrest.position.set(0, 0.5, 0.05);
        headrest.rotation.x = -0.1;
        backGroup.add(spine, meshBack, headrest);
        this.mesh.add(backGroup);

        const armGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4);
        const armL = new THREE.Mesh(armGeo, matBlackPlastic);
        armL.position.set(-0.35, 0.9, 0);
        const armPad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.4), matBlackPlastic);
        armPad.position.y = 0.2;
        armL.add(armPad);
        const armR = armL.clone();
        armR.position.set(0.35, 0.9, 0);
        this.mesh.add(armL, armR);
    }

    getMesh() { return this.mesh.clone(); }
}

// --- INTERNAL CLASS: MODERN DESK ---
class ModernDesk {
    constructor() {
        this.group = new THREE.Group();
        this.interactableScreen = null; 
    }

    build(isInteractable) {
        const matWhiteDesk = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
        const matDarkMetal = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
        const matScreenBlack = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2 });
        const matScreenGlow = new THREE.MeshBasicMaterial({ color: 0x00aaff });
        const matKeys = new THREE.MeshStandardMaterial({ color: 0x222222 });

        const deskGroup = new THREE.Group();

        // Table Top
        const top = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.08, 2.2), matWhiteDesk);
        top.position.y = 1.5;
        top.castShadow = true;
        deskGroup.add(top);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.1, 1.5, 2.0);
        const legL = new THREE.Mesh(legGeo, matDarkMetal); legL.position.set(-2.15, 0.75, 0);
        const legR = new THREE.Mesh(legGeo, matDarkMetal); legR.position.set(2.15, 0.75, 0);
        deskGroup.add(legL, legR);

        // FULL HEIGHT Drawer Unit (Touched floor)
        const drawerUnit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.45, 2.0), matWhiteDesk);
        drawerUnit.position.set(1.4, 0.725, 0);
        
        // Handles
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.05), matDarkMetal);
        handle.position.set(0, 0.4, 1.0);
        const handle2 = handle.clone(); handle2.position.set(0, 0.0, 1.0);
        const handle3 = handle.clone(); handle3.position.set(0, -0.4, 1.0);
        drawerUnit.add(handle, handle2, handle3);
        deskGroup.add(drawerUnit);

        // Partition
        const part = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.6, 0.05), new THREE.MeshStandardMaterial({color: 0x335577}));
        part.position.set(0, 1.8, -1.05);
        deskGroup.add(part);

        // Monitor & Stand
        const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.4), matDarkMetal);
        standBase.position.set(0, 1.55, -0.5);
        const standNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4), matDarkMetal);
        standNeck.position.set(0, 1.75, -0.6);
        deskGroup.add(standBase, standNeck);

        const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 0.05), matScreenBlack);
        monitor.position.set(0, 2.1, -0.6);
        const displayGeo = new THREE.PlaneGeometry(1.7, 0.9);
        const displayMat = isInteractable ? matScreenGlow : matScreenBlack;
        const display = new THREE.Mesh(displayGeo, displayMat);
        display.position.set(0, 0, 0.03); 
        
        if(isInteractable) {
            display.name = "HeroMonitor"; 
            this.interactableScreen = display;
        }
        monitor.add(display);
        deskGroup.add(monitor);

        // Keyboard/Mouse
        const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.3), matKeys);
        keyboard.position.set(0, 1.55, 0.2);
        const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.15), matKeys);
        mouse.position.set(0.6, 1.55, 0.2);
        deskGroup.add(keyboard, mouse);

        const pad = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.6), new THREE.MeshStandardMaterial({color: 0x111111}));
        pad.rotation.x = -Math.PI/2;
        pad.position.set(0, 1.545, 0.2);
        deskGroup.add(pad);

        return deskGroup;
    }
}

// --- EXPORTED BUILDERS ---

export class OfficeBuilder {
    constructor(scene) {
        this.scene = scene;
        this.interactables = [];
        this.colliders = [];
        this.baseChair = new OfficeChair();
        this.baseDesk = new ModernDesk();
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
        // Back Wall (Metro Side)
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

        // Front Wall (Glass Door)
        const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(35, 10, 1), matWhite); 
        frontWallL.position.set(-20, 5, 15);
        const frontWallR = new THREE.Mesh(new THREE.BoxGeometry(35, 10, 1), matWhite); 
        frontWallR.position.set(20, 5, 15);
        const frontWallTop = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 1), matWhite);
        frontWallTop.position.set(0, 8.5, 15);
        this.scene.add(frontWallL, frontWallR, frontWallTop);
        this.colliders.push(frontWallL, frontWallR);

        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 0.5), new THREE.MeshStandardMaterial({color: 0x333333}));
        doorFrame.position.set(0, 3.5, 15);
        const doorGlass = new THREE.Mesh(new THREE.PlaneGeometry(4, 6.5), matGlass);
        doorGlass.position.set(-2.1, 3.5, 15.3); 
        const doorGlass2 = new THREE.Mesh(new THREE.PlaneGeometry(4, 6.5), matGlass);
        doorGlass2.position.set(2.1, 3.5, 15.3);
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1), new THREE.MeshStandardMaterial({color: 0xeeeeee}));
        handle.position.set(-0.5, 3.5, 15.4);
        const handle2 = handle.clone();
        handle2.position.set(0.5, 3.5, 15.4);
        this.scene.add(doorFrame, doorGlass, doorGlass2, handle, handle2);
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
        // Left Side: 4 rows x 3 cols
        this.buildBlock(4, 3, -20, -15, false, "left");
        // Right Side: 4 rows x 4 cols
        this.buildBlock(4, 4, 5, -15, true, "right");
    }

    buildBlock(rows, cols, startX, startZ, hasPillar, side) {
        const spacingX = 5;
        const spacingZ = 5;

        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                const cx = startX + (c * spacingX);
                const cz = startZ + (r * spacingZ);

                if (hasPillar && r === 2 && c === 0) {
                    this.createPillar(cx, cz);
                    continue; 
                }

                // My Desk: Left side, Row 0, Col 1
                const isMine = (side === "left" && r === 0 && c === 1);
                this.placeWorkstation(cx, cz, isMine);
            }
        }
    }

    createPillar(x, z) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 2), matWhite);
        pillar.position.set(x, 5, z);
        this.scene.add(pillar);
        this.colliders.push(pillar);

        // Detailed Pot (Lathe)
        const points = [];
        for ( let i = 0; i < 10; i ++ ) {
            points.push( new THREE.Vector2( Math.sin( i * 0.2 ) * 0.3 + 0.2, ( i - 5 ) * 0.1 ) );
        }
        const potGeo = new THREE.LatheGeometry( points, 20 );
        const pot = new THREE.Mesh( potGeo, matPot );
        pot.position.set(x - 1.5, 0.5, z); // Other side
        pot.scale.set(1.5, 1.5, 1.5);
        
        const plantGroup = new THREE.Group();
        const leafGeo = new THREE.DodecahedronGeometry(0.3);
        for(let i=0; i<8; i++) {
            const leaf = new THREE.Mesh(leafGeo, matLeaf);
            leaf.position.set(Math.random()*0.4-0.2, 0.3 + Math.random()*0.3, Math.random()*0.4-0.2);
            plantGroup.add(leaf);
        }
        pot.add(plantGroup);
        
        this.scene.add(pot);
        this.colliders.push(pot);
    }

    placeWorkstation(x, z, isInteractable) {
        const stationGroup = new THREE.Group();
        stationGroup.position.set(x, 0, z);

        const deskObj = new ModernDesk(); 
        const deskMesh = deskObj.build(isInteractable);
        stationGroup.add(deskMesh);

        if (deskObj.interactableScreen) {
            this.interactables.push(deskObj.interactableScreen);
            const spot = new THREE.SpotLight(0xffffff, 8);
            spot.position.set(0, 6, 0);
            spot.target = deskMesh;
            spot.angle = 0.5;
            spot.penumbra = 0.5;
            stationGroup.add(spot);
            stationGroup.add(spot.target);
        }

        const chairMesh = this.baseChair.getMesh();
        chairMesh.position.set(0, 0, 1.2);
        if(!isInteractable) {
            chairMesh.rotation.y = (Math.random() - 0.5) * 1.0; 
            chairMesh.position.z = 1.0 + Math.random() * 0.4;
        }
        stationGroup.add(chairMesh);

        // Collider
        const collider = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2, 2.2), new THREE.MeshBasicMaterial({visible: false}));
        collider.position.set(x, 1, z);
        this.scene.add(collider);
        this.colliders.push(collider);

        this.scene.add(stationGroup);
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
        this.mesh.position.set(-15, 0.4, -5); 
        this.scene.add(this.mesh);
    }

    createCarMesh() {
        const matCarBody = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.6, roughness: 0.2 });
        const matWheel = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const matHeadlight = new THREE.MeshBasicMaterial({ color: 0xffffff });

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
            const building = new THREE.Mesh(buildingGeo, new THREE.MeshStandardMaterial({ color: 0x8899aa }));
            building.scale.set(w, h, w);
            building.position.set(
                (Math.random() - 0.5) * 250, h/2 - 40, -60 - (Math.random() * 100)
            );
            if(Math.random() > 0.3) {
                const winGeo = new THREE.PlaneGeometry(0.3, 0.3);
                const winMat = new THREE.MeshBasicMaterial({ color: 0xaaccff });
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
        const concMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
        for(let x = -150; x <= 150; x+=30) {
            const pillar = new THREE.Mesh(pillarGeo, concMat);
            pillar.position.set(x, -25, trackZ);
            this.scene.add(pillar);
        }
        const railBed = new THREE.Mesh(new THREE.BoxGeometry(400, 2, 8), concMat);
        railBed.position.set(0, 0, trackZ);
        this.scene.add(railBed);
        const trainMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.8 });
        for(let i=0; i<4; i++) {
            const car = new THREE.Mesh(new THREE.BoxGeometry(10, 3.5, 2.5), trainMat);
            car.position.set(i * 11, 2.5, 0);
            const winStrip = new THREE.Mesh(new THREE.PlaneGeometry(9, 1), new THREE.MeshBasicMaterial({ color: 0x333333 }));
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
