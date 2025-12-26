import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as Mats from './materials.js';
import { OfficeChair } from './OfficeChair.js';

// CONFIGURATION: Adjust size here if it's still too small/big
const SCALES = { chair: 2.7, plant: 0.009 };

// --- ENHANCED DESK CLASS ---
class ModernDesk {
    constructor() { 
        this.group = new THREE.Group(); 
        this.heroScreen = null; 
    }

    build(isInteractable, isHero) {
        const deskGroup = new THREE.Group();
        
        // 1. Table Top
        const top = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.08, 2.2), Mats.matWood); 
        top.position.y = 1.5; top.castShadow = true; deskGroup.add(top);
        
        // 2. Legs
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 2.0), Mats.matBlackMetal); legL.position.set(-2.15, 0.75, 0); deskGroup.add(legL);
        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 2.0), Mats.matBlackMetal); legR.position.set(2.15, 0.75, 0); deskGroup.add(legR);
        
        // 3. Monitor
        const monitorGroup = new THREE.Group();
        monitorGroup.position.set(0, 2.1, -0.6);
        const monitorStand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6), Mats.matBlackMetal);
        monitorStand.position.y = -0.3; monitorGroup.add(monitorStand);
        const monitorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.05), Mats.matScreenBlack);
        
        let screenMat = Mats.matScreenBlack;
        if(isInteractable) screenMat = Mats.matScreenGlow;
        if(isHero) screenMat = new THREE.MeshBasicMaterial({ color: 0xff3333 }); 

        const display = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.9), screenMat); 
        display.position.set(0, 0, 0.03); 
        if(isHero) this.heroScreen = display;
        
        monitorFrame.add(display); monitorGroup.add(monitorFrame); deskGroup.add(monitorGroup);
        
        // 4. Props
        const laptop = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.5), Mats.matChrome);
        laptop.position.set(1.2, 1.55, 0.3); laptop.rotation.y = -0.3; deskGroup.add(laptop);
        const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15), Mats.matWhite);
        mug.position.set(-1.2, 1.58, 0.4); deskGroup.add(mug);
        const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.3), Mats.matKeys); 
        keyboard.position.set(0, 1.55, 0.3); deskGroup.add(keyboard);

        return deskGroup;
    }
}

export class OfficeBuilder {
    constructor(scene, physicsWorld, manager, audio) {
        this.scene = scene;
        this.physics = physicsWorld;
        this.audio = audio;
        this.interactables = [];
        this.loader = new GLTFLoader(manager); 
        
        this.doorState = { mesh: null, body: null }; 
        this.lifts = [];
        this.heroScreen = null;

        this.createFloor();
        this.createWallsAndWindows(); 
        this.createPassage();        
        this.createCeilingDetails();
        this.createLights();         
        this.createLayout();         
        this.loadModels();           
    }

    // --- ANIMATION LOOP ---
    update(carPos, time) {
        // 1. Automatic Door
        if(this.doorState.mesh && this.doorState.body) {
            const dist = carPos.distanceTo(new THREE.Vector3(0, 0, 20.5));
            const targetX = (dist < 8) ? 2.5 : 0; 
            this.doorState.mesh.position.x = THREE.MathUtils.lerp(this.doorState.mesh.position.x, targetX, 0.1);
            this.doorState.body.position.x = this.doorState.mesh.position.x;
        }

        // 2. Hero Screen Pulse
        if(this.heroScreen) {
            const pulse = (Math.sin(time * 3) * 0.5 + 0.5); 
            this.heroScreen.material.color.setHSL(0.55, 1.0, 0.3 + (pulse * 0.4)); 
        }

        // 3. Elevators
        if(this.lifts.length > 0) {
            for(const lift of this.lifts) {
                const dist = carPos.distanceTo(lift.triggerPos);
                const open = dist < 4; 
                const targetOffset = open ? 1.4 : 0.8;
                lift.doorL.position.z = THREE.MathUtils.lerp(lift.doorL.position.z, lift.baseZ - targetOffset, 0.05);
                lift.doorR.position.z = THREE.MathUtils.lerp(lift.doorR.position.z, lift.baseZ + targetOffset, 0.05);
            }
        }
    }

    // --- BUILDERS ---
    addStaticBody(x, y, z, w, h, d, isWall=false) {
        const body = new CANNON.Body({ mass: 0, material: this.physics.groundMat });
        body.addShape(new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2))); 
        body.position.set(x, y, z); 
        this.physics.world.addBody(body);
        
        if(isWall && this.audio) {
            body.addEventListener("collide", (e) => {
                const impact = e.contact.getImpactVelocityAlongNormal();
                if(Math.abs(impact) > 2) this.audio.playImpact(impact);
            });
        }
        return body;
    }

    createFloor() {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), Mats.matCarpet); 
        floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; this.scene.add(floor);
        const body = new CANNON.Body({ mass: 0, material: this.physics.groundMat }); 
        body.addShape(new CANNON.Plane()); body.quaternion.setFromEuler(-Math.PI / 2, 0, 0); 
        this.physics.world.addBody(body);
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), Mats.matCeiling); 
        ceiling.rotation.x = Math.PI / 2; ceiling.position.y = 10; this.scene.add(ceiling);
    }

    createPassage() {
        // Hallway Floor
        const hallFloor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), Mats.matWood);
        hallFloor.rotation.x = -Math.PI / 2; 
        hallFloor.position.set(0, 0.01, 30); 
        this.scene.add(hallFloor);

        // --- LEFT SIDE (Coffee & Window) ---
        const wallL_Bot = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 20), Mats.matWall); 
        wallL_Bot.position.set(-10, 1, 30); 
        this.scene.add(wallL_Bot);
        const wallL_Glass = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), Mats.matGlass);
        wallL_Glass.rotation.y = Math.PI / 2;
        wallL_Glass.position.set(-10, 6, 30); 
        this.scene.add(wallL_Glass);
        this.addStaticBody(-10, 5, 30, 1, 10, 20, true);

        // --- RIGHT SIDE (Lifts) ---
        const wallR = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 20), Mats.matWall); 
        wallR.position.set(10, 5, 30); 
        this.scene.add(wallR);
        this.addStaticBody(10, 5, 30, 1, 10, 20, true);

        // --- BACK WALL ---
        const wallBack = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 1), Mats.matWall);
        wallBack.position.set(0, 5, 40.5); 
        this.scene.add(wallBack);
        this.addStaticBody(0, 5, 40.5, 20, 10, 1, true);

        const bannerLoader = new THREE.TextureLoader(this.loader.manager);
        const bannerTex = bannerLoader.load('https://picsum.photos/seed/office/1024/512'); 
        const bannerGeo = new THREE.PlaneGeometry(12, 6);
        const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex });
        const banner = new THREE.Mesh(bannerGeo, bannerMat);
        banner.position.set(0, 5, 39.79); 
        banner.rotation.y = Math.PI; 
        this.scene.add(banner);

        const frameGeo = new THREE.BoxGeometry(12.5, 6.5, 0.2);
        const frame = new THREE.Mesh(frameGeo, Mats.matBlackMetal);
        frame.position.set(0, 5, 39.9); 
        this.scene.add(frame);

        // --- LIFTS ---
        const createLift = (x, z) => {
            const frame = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8, 4), Mats.matBlackMetal); frame.position.set(x, 4, z); this.scene.add(frame);
            const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 7, 1.5), Mats.matChrome); doorL.position.set(x - 0.2, 3.5, z - 0.8); this.scene.add(doorL);
            const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 7, 1.5), Mats.matChrome); doorR.position.set(x - 0.2, 3.5, z + 0.8); this.scene.add(doorR);
            this.lifts.push({ doorL, doorR, baseZ: z, triggerPos: new THREE.Vector3(x - 2, 0, z) });
        };
        createLift(9.4, 25); createLift(9.4, 35);

        // --- COFFEE MACHINE ---
        const coffeeGroup = new THREE.Group(); coffeeGroup.position.set(-9, 0, 28);
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 1.5), Mats.matBlackMetal); base.position.y = 1.5;
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), Mats.matScreenGlow); screen.position.set(0.76, 2.5, 0); screen.rotation.y = Math.PI/2;
        coffeeGroup.add(base, screen); this.scene.add(coffeeGroup);
        this.addStaticBody(-9, 1.5, 28, 1.5, 3, 1.5, true);
    }

    createWallsAndWindows() {
        // Walls
        const backTop = new THREE.Mesh(new THREE.BoxGeometry(60, 3, 1), Mats.matWall); backTop.position.set(0, 8.5, -20.5); this.scene.add(backTop);
        const backBot = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 1), Mats.matWall); backBot.position.set(0, 1, -20.5); this.scene.add(backBot); this.addStaticBody(0, 1, -20.5, 60, 2, 1, true);
        const backGlass = new THREE.Mesh(new THREE.PlaneGeometry(60, 5.5), Mats.matGlass); backGlass.position.set(0, 4.75, -20); this.scene.add(backGlass); this.addStaticBody(0, 4.75, -20, 60, 5.5, 0.1, true);
        
        // Right Wall
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 40), Mats.matWall); rightWall.position.set(30.5, 5, 0); this.scene.add(rightWall); this.addStaticBody(30.5, 5, 0, 1, 10, 40, true);
        
        // Left Window
        const leftWinBot = new THREE.Mesh(new THREE.BoxGeometry(41, 2, 1), Mats.matWall); 
        leftWinBot.rotation.y = Math.PI/2; 
        leftWinBot.position.set(-30.5, 1, 0); 
        this.scene.add(leftWinBot); 
        this.addStaticBody(-30.5, 1, 0, 1, 2, 41, true);

        const leftGlass = new THREE.Mesh(new THREE.PlaneGeometry(41, 5.5), Mats.matGlass); 
        leftGlass.rotation.y = Math.PI/2; 
        leftGlass.position.set(-30, 4.75, 0); 
        this.scene.add(leftGlass); 
        this.addStaticBody(-30.5, 4.75, 0, 1.0, 5.5, 41, true);

        // Front Walls
        const frontL = new THREE.Mesh(new THREE.BoxGeometry(29, 10, 1), Mats.matWall); frontL.position.set(-15.5, 5, 20.5); this.scene.add(frontL); this.addStaticBody(-15.5, 5, 20.5, 29, 10, 1, true);
        const frontR = new THREE.Mesh(new THREE.BoxGeometry(29, 10, 1), Mats.matWall); frontR.position.set(15.5, 5, 20.5); this.scene.add(frontR); this.addStaticBody(15.5, 5, 20.5, 29, 10, 1, true);
        
        // Header
        const header = new THREE.Mesh(new THREE.BoxGeometry(2, 7, 1), Mats.matWall); 
        header.position.set(0, 6.5, 20.5); 
        this.scene.add(header);

        // 1. Automatic Glass Door
        const doorGeo = new THREE.BoxGeometry(2.0, 3.0, 0.2);
        const doorMesh = new THREE.Mesh(doorGeo, Mats.matGlass);
        doorMesh.position.set(0, 1.5, 20.5);
        this.scene.add(doorMesh);

        // 2. Door Physics
        const doorBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, material: this.physics.groundMat });
        doorBody.addShape(new CANNON.Box(new CANNON.Vec3(1.0, 1.5, 0.1)));
        doorBody.position.set(0, 1.5, 20.5);
        this.physics.world.addBody(doorBody);
        this.doorState = { mesh: doorMesh, body: doorBody };

        // 3. Handle
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8), Mats.matChrome);
        handle.position.set(0.6, 0, 0.15); 
        doorMesh.add(handle);

        // 4. Scanner
        const scannerGroup = new THREE.Group(); 
        scannerGroup.position.set(1.5, 1.4, 20.6); 
        const scanBox = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.05), Mats.matScanner); 
        const fingerPad = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 32), Mats.matScannerLight); 
        fingerPad.rotation.x = Math.PI/2; 
        fingerPad.position.set(0, -0.1, 0); 
        scannerGroup.add(scanBox, fingerPad); 
        this.scene.add(scannerGroup);
    }

    createCeilingDetails() {
        const ductGeo = new THREE.CylinderGeometry(1, 1, 60, 32); const mainDuct = new THREE.Mesh(ductGeo, Mats.matChrome); mainDuct.rotation.z = Math.PI / 2; mainDuct.position.set(0, 9, 0); this.scene.add(mainDuct);
        for(let x=-30; x<30; x+=15) { const vent = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 2), Mats.matBlackMetal); vent.position.set(x, 8.2, 0); this.scene.add(vent); }
    }

    createLights() {
        const tubeGeo = new THREE.BoxGeometry(3.5, 0.1, 0.1); const tubeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const wireGeo = new THREE.BoxGeometry(0.02, 1.5, 0.02); const wireMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const createFixture = (x, z) => {
            const group = new THREE.Group();
            const tube = new THREE.Mesh(tubeGeo, tubeMat); tube.position.y = 0; group.add(tube);
            const wireL = new THREE.Mesh(wireGeo, wireMat); wireL.position.set(-1.5, 0.75, 0); group.add(wireL);
            const wireR = new THREE.Mesh(wireGeo, wireMat); wireR.position.set(1.5, 0.75, 0); group.add(wireR);
            group.position.set(x, 8.5, z); this.scene.add(group);
        };
        for (let z = -15; z <= 5; z += 5) { createFixture(-25, z); createFixture(-15, z); }
        for (let z = -15; z <= 5; z += 5) { createFixture(10, z); createFixture(20, z); }
        for (let z = -15; z <= 10; z += 8) { createFixture(0, z); }
    }

    createLayout() { this.buildBlock(4, 3, -20, -15, false, "left"); this.buildBlock(4, 5, 5, -15, true, "right"); }
    
    buildBlock(rows, cols, startX, startZ, hasPillar, side) {
        const spacingX = 5; const spacingZ = 5;
        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                const cx = startX + (c * spacingX); const cz = startZ + (r * spacingZ);
                if (hasPillar && r === 2 && c === 0) { this.createPillar(cx, cz); continue; }
                const isHero = (side === "left" && r === 1 && c === 0);
                this.placeWorkstation(cx, cz, isHero, isHero);
            }
        }
    }

    createPillar(x, z) { const pillar = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 2), Mats.matConcrete); pillar.position.set(x, 5, z); this.scene.add(pillar); this.addStaticBody(x, 5, z, 2, 10, 2, true); const plantAnchor = new THREE.Group(); plantAnchor.position.set(x - 1.5, 0, z); plantAnchor.name = "PlantAnchor"; this.scene.add(plantAnchor); }
    
    placeWorkstation(x, z, isInteractable, isHero) {
        const stationGroup = new THREE.Group(); stationGroup.position.set(x, 0, z);
        const deskObj = new ModernDesk(); 
        const deskMesh = deskObj.build(isInteractable, isHero);
        if(isHero) this.heroScreen = deskObj.heroScreen;
        stationGroup.add(deskMesh);
        const chairAnchor = new THREE.Group(); chairAnchor.position.set(0, 0, 1.2); chairAnchor.name = "ChairAnchor"; stationGroup.add(chairAnchor);
        this.scene.add(stationGroup);
        this.addStaticBody(x, 1, z, 3.5, 2, 1.5, true); 
    }

    loadModels() {
        this.scene.traverse(obj => { 
            if(obj.name === "ChairAnchor") { 
                obj.clear(); 
                const chair = new OfficeChair(this.loader.manager); 
                chair.mesh.rotation.y = Math.PI; 
                
                // FIX: SCALE APPLIED HERE (2.7)
                const s = SCALES.chair; 
                chair.mesh.scale.set(s, s, s);

                obj.add(chair.mesh); 
            } 
        });
        
        this.loader.load('./plant.glb', (gltf) => {
            const model = gltf.scene; model.scale.set(SCALES.plant, SCALES.plant, SCALES.plant); model.traverse(c => { if(c.isMesh) c.castShadow = true; });
            this.scene.traverse(obj => { if(obj.name === "PlantAnchor") { obj.add(model.clone()); } });
        }, undefined, () => console.warn("Plant missing"));
    }
}
