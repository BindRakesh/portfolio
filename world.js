import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- CONFIGURATION ---
const SCALES = {
    chair: 1.0,   
    plant: 0.009,
    car: 0.15
};

// --- SHARED MATERIALS ---
const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
const matCarpet = new THREE.MeshStandardMaterial({ color: 0x667788, roughness: 1 });
const matGlass = new THREE.MeshPhysicalMaterial({ color: 0x88ccff, transmission: 0.9, opacity: 0.2, transparent: true, roughness: 0, side: THREE.DoubleSide });
const matDuct = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.2 });
const matPipe = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.3, roughness: 0.4 });
const matPot = new THREE.MeshStandardMaterial({ color: 0xffffff });
const matLeaf = new THREE.MeshStandardMaterial({ color: 0x22aa22 });

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

        // Drawer
        const drawerUnit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.45, 2.0), matWhiteDesk);
        drawerUnit.position.set(1.4, 0.725, 0);
        deskGroup.add(drawerUnit);

        // Partition
        const part = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.6, 0.05), new THREE.MeshStandardMaterial({color: 0x335577}));
        part.position.set(0, 1.8, -1.05);
        deskGroup.add(part);

        // Monitor
        const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 0.05), matScreenBlack);
        monitor.position.set(0, 2.1, -0.6);
        const displayGeo = new THREE.PlaneGeometry(1.7, 0.9);
        const displayMat = isInteractable ? matScreenGlow : matScreenBlack;
        const display = new THREE.Mesh(displayGeo, displayMat);
        display.position.set(0, 0, 0.03); 
        if(isInteractable) { display.name = "HeroMonitor"; this.interactableScreen = display; }
        monitor.add(display);
        deskGroup.add(monitor);

        return deskGroup;
    }
}

// --- EXPORTED BUILDERS ---

export class OfficeBuilder {
    constructor(scene) {
        this.scene = scene;
        this.interactables = [];
        this.colliders = [];
        this.loader = new GLTFLoader();
        this.baseDesk = new ModernDesk();
        
        this.loadModels();
    }

    loadModels() {
        // --- LOAD CHAIR ---
        this.loader.load('./chair.glb', (gltf) => {
            console.log("CHAIR LOADED!"); 
            const model = gltf.scene;
            model.scale.set(SCALES.chair, SCALES.chair, SCALES.chair);
            model.traverse(c => { if(c.isMesh) c.castShadow = true; });

            // Find all anchors and replace the Pink Box with the Chair
            this.scene.traverse(obj => {
                if(obj.name === "ChairAnchor") {
                    obj.clear(); // Remove the pink box
                    obj.add(model.clone()); // Add the chair
                }
            });
        }, 
        undefined, 
        (error) => {
            console.error("FAILED TO LOAD CHAIR:", error);
            // If it fails, turn the Pink Box RED
            this.scene.traverse(obj => {
                if(obj.name === "ChairAnchor") {
                    obj.children[0].material.color.set(0xff0000); // Red = Error
                }
            });
        });

        // --- LOAD PLANT ---
        this.loader.load('./plant.glb', (gltf) => {
            const model = gltf.scene;
            model.scale.set(SCALES.plant, SCALES.plant, SCALES.plant);
            this.scene.traverse(obj => {
                if(obj.name === "PlantAnchor") {
                    const plantClone = model.clone();
                    obj.add(plantClone);
                }
            });
        });
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
        // Back Wall
        const backTop = new THREE.Mesh(new THREE.BoxGeometry(80, 3, 1), matWhite); backTop.position.set(0, 8.5, -20.5);
        const backBot = new THREE.Mesh(new THREE.BoxGeometry(80, 2, 1), matWhite); backBot.position.set(0, 1, -20.5);
        this.scene.add(backTop, backBot);
        const backGlass = new THREE.Mesh(new THREE.PlaneGeometry(80, 5.5), matGlass); backGlass.position.set(0, 4.75, -20);
        this.scene.add(backGlass);
        this.colliders.push(backBot);

        // Side Walls
        const leftTop = new THREE.Mesh(new THREE.BoxGeometry(60, 3, 1), matWhite); leftTop.rotation.y = Math.PI/2; leftTop.position.set(-30.5, 8.5, 0);
        const leftBot = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 1), matWhite); leftBot.rotation.y = Math.PI/2; leftBot.position.set(-30.5, 1, 0);
        this.scene.add(leftTop, leftBot);
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 60), matWhite); rightWall.position.set(30, 5, 0);
        this.scene.add(rightWall);
    }

    createCeilingDetails() {
        const mainDuct = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 80, 32), matDuct);
        mainDuct.rotation.z = Math.PI / 2;
        mainDuct.position.set(0, 9, 0);
        this.scene.add(mainDuct);
    }

    createLayout() {
        this.buildBlock(4, 3, -20, -15, false, "left");
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
                const isMine = (side === "left" && r === 0 && c === 1);
                this.placeWorkstation(cx, cz, isMine);
            }
        }
    }

    createPillar(x, z) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 2), matWhite);
        pillar.position.set(x, 5, z);
        this.scene.add(pillar);
        
        const plantAnchor = new THREE.Group();
        plantAnchor.position.set(x - 1.5, 0, z);
        plantAnchor.name = "PlantAnchor";
        this.scene.add(plantAnchor);
    }

    placeWorkstation(x, z, isInteractable) {
        const stationGroup = new THREE.Group();
        stationGroup.position.set(x, 0, z);

        const deskObj = new ModernDesk(); 
        const deskMesh = deskObj.build(isInteractable);
        stationGroup.add(deskMesh);

        if (deskObj.interactableScreen) {
            this.interactables.push(deskObj.interactableScreen);
        }

        // --- DEBUG: PINK BOX PLACEHOLDER ---
        const chairAnchor = new THREE.Group();
        chairAnchor.position.set(0, 0, 1.2);
        chairAnchor.name = "ChairAnchor"; 
        
        // The Pink Box (Visible immediately)
        const debugBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5), 
            new THREE.MeshBasicMaterial({ color: 0xff00ff }) // PINK
        );
        debugBox.position.y = 0.5;
        chairAnchor.add(debugBox);
        
        stationGroup.add(chairAnchor);

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
        this.mesh.position.set(-15, 0.4, -5); 
        this.scene.add(this.mesh);
        this.loadCar();
    }

    loadCar() {
        const loader = new GLTFLoader();
        loader.load('./car.glb', (gltf) => {
            const model = gltf.scene;
            model.scale.set(SCALES.car, SCALES.car, SCALES.car);
            model.rotation.y = Math.PI; 
            this.mesh.add(model);
        });
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
            building.position.set((Math.random() - 0.5) * 250, h/2 - 40, -60 - (Math.random() * 100));
            cityGroup.add(building);
        }
        this.scene.add(cityGroup);
    }
    createMetroSystem() {
        const trackZ = -45;
        const concMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
        const railBed = new THREE.Mesh(new THREE.BoxGeometry(400, 2, 8), concMat);
        railBed.position.set(0, 0, trackZ);
        this.scene.add(railBed);
        
        const trainMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        for(let i=0; i<4; i++) {
            const car = new THREE.Mesh(new THREE.BoxGeometry(10, 3.5, 2.5), trainMat);
            car.position.set(i * 11, 2.5, 0);
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
