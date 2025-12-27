import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- CONFIGURATION ---
const SCALES = { chair: 2.7, plant: 0.009, car: 0.0009 };

// --- TEXTURE GENERATOR ---
function createTexture(type, label = "") {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512; const ctx = canvas.getContext('2d');
    if (type === 'carpet') { ctx.fillStyle = '#445566'; ctx.fillRect(0,0,512,512); ctx.fillStyle = '#3a4a5a'; for(let i=0;i<5000;i++) ctx.fillRect(Math.random()*512,Math.random()*512,2,2); }
    else if (type === 'wood') { ctx.fillStyle = '#e0e0e0'; ctx.fillRect(0,0,512,512); ctx.strokeStyle = '#cccccc'; ctx.lineWidth=2; for(let i=0;i<20;i++){ ctx.beginPath();ctx.moveTo(0,i*25);ctx.bezierCurveTo(150,i*25+20,350,i*25-20,512,i*25);ctx.stroke();} }
    else if (type === 'ceiling') { ctx.fillStyle = '#eeeeee'; ctx.fillRect(0,0,512,512); ctx.strokeStyle = '#dddddd'; ctx.lineWidth=4; ctx.strokeRect(0,0,512,512); ctx.fillStyle = '#f9f9f9'; ctx.fillRect(5,5,502,502); }
    else if (type === 'zone') { ctx.strokeStyle = '#00ffff'; ctx.lineWidth=20; ctx.beginPath(); ctx.arc(256,256,240,0,Math.PI*2); ctx.stroke(); const g=ctx.createRadialGradient(256,256,100,256,256,256);g.addColorStop(0,'rgba(0,255,255,0.5)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fill();ctx.fillStyle='#ffffff';ctx.font='bold 60px Arial';ctx.textAlign='center';ctx.fillText("PARKING",256,200);ctx.fillStyle='#00ffff';ctx.font='bold 80px Arial';ctx.fillText(label,256,300); }
    const t = new THREE.CanvasTexture(canvas); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}
const texCarpet = createTexture('carpet'); texCarpet.repeat.set(15,15);
const texWood = createTexture('wood');
const texCeiling = createTexture('ceiling'); texCeiling.repeat.set(10,10);

// --- MATERIALS ---
const matWall = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.8 });
const matConcrete = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 1.0 });
const matCarpet = new THREE.MeshStandardMaterial({ map: texCarpet, roughness: 1 });
const matGlass = new THREE.MeshPhysicalMaterial({ color: 0xaaccff, transmission: 0.95, opacity: 0.1, transparent: true, roughness: 0.05, side: THREE.DoubleSide });
const matChrome = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.2 });
const matBlackMetal = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.4 });
const matScanner = new THREE.MeshStandardMaterial({ color: 0x111111 });
const matScannerLight = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); 
const matCeiling = new THREE.MeshStandardMaterial({ map: texCeiling });
const matWood = new THREE.MeshStandardMaterial({ map: texWood, roughness: 0.3 });
const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
const matScreenBlack = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2 });
const matScreenGlow = new THREE.MeshBasicMaterial({ color: 0x00aaff });
const matKeys = new THREE.MeshStandardMaterial({ color: 0x222222 });

// --- PHYSICS WORLD ---
export class PhysicsWorld {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); 
        const groundMat = new CANNON.Material();
        const carMat = new CANNON.Material();
        // Slick floor, no bounce
        const contactMat = new CANNON.ContactMaterial(groundMat, carMat, { friction: 0.0, restitution: 0.0 });
        this.world.addContactMaterial(contactMat);
        this.groundMat = groundMat;
        this.carMat = carMat;
    }
    update(dt) { this.world.step(1/60, dt, 3); }
}

// --- AUDIO SYSTEM ---
export class AudioSystem {
    constructor(camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        this.ctx = this.listener.context;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.2; 
        this.masterGain.connect(this.ctx.destination);

        // Rumble Oscillator
        this.osc = this.ctx.createOscillator();
        this.osc.type = 'sawtooth';
        this.osc.frequency.value = 40; 
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 120;

        this.osc.connect(this.filter);
        this.filter.connect(this.masterGain);
        this.isStarted = false;
    }

    init() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (!this.isStarted) { this.osc.start(); this.isStarted = true; }
    }

    update(speed) {
        if (!this.isStarted) return;
        const s = Math.abs(speed);
        // Pitch rises with speed
        this.osc.frequency.setTargetAtTime(40 + (s * 15), this.ctx.currentTime, 0.1);
        this.filter.frequency.setTargetAtTime(120 + (s * 60), this.ctx.currentTime, 0.1);
    }
}

// --- MODERN DESK ---
class ModernDesk {
    constructor() { this.group = new THREE.Group(); this.interactableScreen = null; }
    build(isInteractable) {
        const deskGroup = new THREE.Group();
        const top = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.08, 2.2), matWood); top.position.y = 1.5; top.castShadow = true; deskGroup.add(top);
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 2.0), matBlackMetal); legL.position.set(-2.15, 0.75, 0); deskGroup.add(legL);
        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 2.0), matBlackMetal); legR.position.set(2.15, 0.75, 0); deskGroup.add(legR);
        const drawer = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.45, 2.0), matWhite); drawer.position.set(1.4, 0.725, 0); deskGroup.add(drawer);
        const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 0.05), matScreenBlack); monitor.position.set(0, 2.1, -0.6);
        const display = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.9), isInteractable ? matScreenGlow : matScreenBlack); display.position.set(0, 0, 0.03); 
        if(isInteractable) { display.name = "HeroMonitor"; this.interactableScreen = display; }
        monitor.add(display); deskGroup.add(monitor);
        const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.3), matKeys); keyboard.position.set(0, 1.55, 0.2); deskGroup.add(keyboard);
        return deskGroup;
    }
}

// --- OFFICE BUILDER ---
export class OfficeBuilder {
    constructor(scene, physicsWorld, manager) {
        this.scene = scene; this.physics = physicsWorld; this.interactables = []; this.loader = new GLTFLoader(manager); this.loadModels();
    }
    loadModels() {
        this.loader.load('./chair.glb', (gltf) => {
            const model = gltf.scene; model.scale.set(SCALES.chair, SCALES.chair, SCALES.chair); model.rotation.y = Math.PI; model.traverse(c => { if(c.isMesh) c.castShadow = true; });
            this.scene.traverse(obj => { if(obj.name === "ChairAnchor") { obj.clear(); obj.add(model.clone()); } });
        });
        this.loader.load('./plant.glb', (gltf) => {
            const model = gltf.scene; model.scale.set(SCALES.plant, SCALES.plant, SCALES.plant); model.traverse(c => { if(c.isMesh) c.castShadow = true; });
            this.scene.traverse(obj => { if(obj.name === "PlantAnchor") { obj.add(model.clone()); } });
        });
    }
    addStaticBody(x, y, z, w, h, d) {
        const body = new CANNON.Body({ mass: 0, material: this.physics.groundMat });
        body.addShape(new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2))); body.position.set(x, y, z); this.physics.world.addBody(body);
    }
    createFloor() {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), matCarpet); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; this.scene.add(floor);
        const body = new CANNON.Body({ mass: 0, material: this.physics.groundMat }); body.addShape(new CANNON.Plane()); body.quaternion.setFromEuler(-Math.PI / 2, 0, 0); this.physics.world.addBody(body);
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), matCeiling); ceiling.rotation.x = Math.PI / 2; ceiling.position.y = 10; this.scene.add(ceiling);
    }
    createWallsAndWindows() {
        const backTop = new THREE.Mesh(new THREE.BoxGeometry(60, 3, 1), matWall); backTop.position.set(0, 8.5, -20.5); this.scene.add(backTop);
        const backBot = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 1), matWall); backBot.position.set(0, 1, -20.5); this.scene.add(backBot); this.addStaticBody(0, 1, -20.5, 60, 2, 1);
        const backGlass = new THREE.Mesh(new THREE.PlaneGeometry(60, 5.5), matGlass); backGlass.position.set(0, 4.75, -20); this.scene.add(backGlass); this.addStaticBody(0, 4.75, -20, 60, 5.5, 0.1);

        const leftSolid = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 1), matWall); leftSolid.rotation.y = Math.PI/2; leftSolid.position.set(-30.5, 5, 15); this.scene.add(leftSolid); this.addStaticBody(-30.5, 5, 15, 1, 10, 10);
        const leftWinTop = new THREE.Mesh(new THREE.BoxGeometry(30, 3, 1), matWall); leftWinTop.rotation.y = Math.PI/2; leftWinTop.position.set(-30.5, 8.5, -5); this.scene.add(leftWinTop);
        const leftWinBot = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 1), matWall); leftWinBot.rotation.y = Math.PI/2; leftWinBot.position.set(-30.5, 1, -5); this.scene.add(leftWinBot); this.addStaticBody(-30.5, 1, -5, 1, 2, 30);
        const leftGlass = new THREE.Mesh(new THREE.PlaneGeometry(30, 5.5), matGlass); leftGlass.rotation.y = Math.PI/2; leftGlass.position.set(-30, 4.75, -5); this.scene.add(leftGlass); this.addStaticBody(-30.5, 4.75, -5, 0.1, 5.5, 30);

        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 40), matWall); rightWall.position.set(30.5, 5, 0); this.scene.add(rightWall); this.addStaticBody(30.5, 5, 0, 1, 10, 40);

        const frontL = new THREE.Mesh(new THREE.BoxGeometry(29, 10, 1), matWall); frontL.position.set(-15.5, 5, 20.5); this.scene.add(frontL); this.addStaticBody(-15.5, 5, 20.5, 29, 10, 1);
        const frontR = new THREE.Mesh(new THREE.BoxGeometry(29, 10, 1), matWall); frontR.position.set(15.5, 5, 20.5); this.scene.add(frontR); this.addStaticBody(15.5, 5, 20.5, 29, 10, 1);

        const doorW = 1.5; const doorH = 3.0; const headerH = 10 - doorH;
        const header = new THREE.Mesh(new THREE.BoxGeometry(2, headerH, 1), matWall); header.position.set(0, doorH + (headerH/2), 20.5); this.scene.add(header);
        const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.1), matGlass); door.position.set(0, doorH/2, 20.5); this.scene.add(door); this.addStaticBody(0, doorH/2, 20.5, doorW, doorH, 0.1);
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8), matChrome); handle.position.set(0.6, 1.4, 20.6); this.scene.add(handle);

        const scannerGroup = new THREE.Group(); scannerGroup.position.set(1.5, 1.4, 20.6); 
        const scanBox = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.05), matScanner); const fingerPad = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 32), matScannerLight); fingerPad.rotation.x = Math.PI/2; fingerPad.position.set(0, -0.1, 0); scannerGroup.add(scanBox, fingerPad); this.scene.add(scannerGroup);
    }

    createCeilingDetails() {
        const ductGeo = new THREE.CylinderGeometry(1, 1, 60, 32); const mainDuct = new THREE.Mesh(ductGeo, matChrome); mainDuct.rotation.z = Math.PI / 2; mainDuct.position.set(0, 9, 0); this.scene.add(mainDuct);
        for(let x=-30; x<30; x+=15) { const vent = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 2), matBlackMetal); vent.position.set(x, 8.2, 0); this.scene.add(vent); }
    }

    createLayout() { this.buildBlock(4, 3, -20, -15, false, "left"); this.buildBlock(4, 5, 5, -15, true, "right"); }
    buildBlock(rows, cols, startX, startZ, hasPillar, side) {
        const spacingX = 5; const spacingZ = 5;
        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                const cx = startX + (c * spacingX); const cz = startZ + (r * spacingZ);
                if (hasPillar && r === 2 && c === 0) { this.createPillar(cx, cz); continue; }
                const isMine = (side === "left" && r === 0 && c === 1); this.placeWorkstation(cx, cz, isMine);
            }
        }
    }
    createPillar(x, z) { const pillar = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 2), matConcrete); pillar.position.set(x, 5, z); this.scene.add(pillar); this.addStaticBody(x, 5, z, 2, 10, 2); const plantAnchor = new THREE.Group(); plantAnchor.position.set(x - 1.5, 0, z); plantAnchor.name = "PlantAnchor"; this.scene.add(plantAnchor); }
    placeWorkstation(x, z, isInteractable) {
        const stationGroup = new THREE.Group(); stationGroup.position.set(x, 0, z);
        const deskObj = new ModernDesk(); const deskMesh = deskObj.build(isInteractable); stationGroup.add(deskMesh);
        if (deskObj.interactableScreen) this.interactables.push(deskObj.interactableScreen);
        const chairAnchor = new THREE.Group(); chairAnchor.position.set(0, 0, 1.2); chairAnchor.name = "ChairAnchor"; stationGroup.add(chairAnchor);
        this.scene.add(stationGroup); this.addStaticBody(x, 1, z, 4.5, 2, 2.2);
    }
}

// --- ZONE SYSTEM ---
export class ZoneSystem {
    constructor(scene) { this.scene = scene; this.zones = []; this.createZone(0, 15, "CONTACT", "contact"); this.createZone(-10, 5, "ABOUT", "about"); this.createZone(10, 5, "PROJECTS", "projects"); }
    createZone(x, z, label, type) {
        const texture = createTexture('zone', label); const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.8, depthWrite: false, fog: false }));
        mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, 0.05, z); this.scene.add(mesh); this.zones.push({ position: new THREE.Vector3(x, 0, z), radius: 2.0, type: type });
    }
    check(carPosition) { for(let zone of this.zones) { if(carPosition.distanceTo(zone.position) < zone.radius) return zone.type; } return null; }
}

// --- PHYSICS CAR (FIXED CONTROLS) ---
export class RCCar {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physics = physicsWorld;
        this.mesh = new THREE.Group();
        this.scene.add(this.mesh);
        
        // Physics Body
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.25, 1)); 
        this.body = new CANNON.Body({ mass: 100, material: this.physics.carMat });
        this.body.addShape(shape);
        this.body.position.set(0, 2, 5);
        this.body.linearDamping = 0.9; 
        this.body.angularDamping = 0.99;
        this.body.fixedRotation = true; 
        this.physics.world.addBody(this.body);

        this.bodyGroup = new THREE.Group();
        this.mesh.add(this.bodyGroup);
        
        const loader = new GLTFLoader();
        loader.load('./car.glb', (gltf) => {
            const model = gltf.scene; 
            model.scale.set(SCALES.car, SCALES.car, SCALES.car); 
            // FIX: If car was facing wrong way, we rotate the model inside the group
            model.rotation.y = Math.PI; 
            this.bodyGroup.add(model);
            
            // Lights
            const beam = new THREE.SpotLight(0xffffff, 5, 10, 0.6, 0.5, 1);
            beam.position.set(0, 0.5, -0.8);
            beam.target.position.set(0, 0, -5);
            this.mesh.add(beam);
            this.mesh.add(beam.target);
        });
        
        this.speed = 0;
        this.steering = 0;
    }

    update(keys) {
        const maxSpeed = 15;
        const turnSpeed = 3.0; // Faster turning

        // 1. Calculate Target Speed
        let targetSpeed = 0;
        // FIX: Inverted Logic here to match Model Direction
        if(keys['w'] || keys['ArrowUp']) targetSpeed = -maxSpeed; // Go Negative Z (Forward)
        if(keys['s'] || keys['ArrowDown']) targetSpeed = maxSpeed;  // Go Positive Z (Backward)

        // 2. Turn Logic (Standard Car Steering)
        // Only turn if the car is actually moving
        if(Math.abs(this.body.velocity.z) > 0.1 || Math.abs(this.body.velocity.x) > 0.1) {
            const isReversing = (keys['s'] || keys['ArrowDown']);
            const invert = isReversing ? -1 : 1;
           // Apply invert multiplier to steering
            if(keys['a'] || keys['ArrowLeft']) this.steering += turnSpeed * 0.016 * invert;
            if(keys['d'] || keys['ArrowRight']) this.steering -= turnSpeed * 0.016 * invert;
        }

        // 3. Apply Velocity
        const forwardX = Math.sin(this.steering);
        const forwardZ = Math.cos(this.steering);
        
        const currentSpeed = Math.sqrt(this.body.velocity.x**2 + this.body.velocity.z**2);
        const lerpSpeed = THREE.MathUtils.lerp(currentSpeed, Math.abs(targetSpeed), 0.05);
        
        // Direction Multiplier (Forward = -1, Reverse = 1)
        const dir = targetSpeed > 0 ? 1 : -1; 
        
        if (Math.abs(targetSpeed) > 0.1) {
            this.body.velocity.x = forwardX * lerpSpeed * dir;
            this.body.velocity.z = forwardZ * lerpSpeed * dir;
        } else {
            // Decelerate naturally when no key pressed
            this.body.velocity.x *= 0.95;
            this.body.velocity.z *= 0.95;
        }

        // Sync Visuals
        this.mesh.position.copy(this.body.position);
        this.mesh.rotation.y = this.steering;
        this.speed = this.body.velocity.length();

        // 4. Visual Tilt (Juice)
        let steerInput = 0; 
        if(keys['a']) steerInput = 1; 
        if(keys['d']) steerInput = -1;
        
        // Lean into turn
        this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, steerInput * -0.2, 0.1);
        
        // Pitch (Accelerate/Brake)
        // Invert pitch logic because we inverted speed direction
        const targetPitch = (keys['w'] ? -0.05 : 0) + (keys['s'] ? 0.05 : 0);
        this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, targetPitch, 0.1);
    }
}

// --- TRAFFIC SYSTEM (VISUALS) ---
export class TrafficSystem {
    constructor(scene) { this.scene = scene; this.cars = []; this.speed = 15.0; this.createLane(-60, 0xffffff, 1); this.createLane(-70, 0xff0000, -1); }
    createLane(zPos, color, direction) {
        const carGeo = new THREE.BoxGeometry(2, 0.5, 0.5); const carMat = new THREE.MeshBasicMaterial({ color: color }); 
        for(let i=0; i<15; i++) {
            const car = new THREE.Mesh(carGeo, carMat);
            const xStart = (Math.random() * 400) - 200; const yStart = (Math.random() * 20) - 10;
            car.position.set(xStart, yStart, zPos); this.scene.add(car);
            this.cars.push({ mesh: car, dir: direction, speed: (Math.random() * 0.5 + 0.5) * this.speed });
        }
    }
    update(dt) {
        for(let c of this.cars) {
            c.mesh.position.x += c.speed * c.dir * dt;
            if (c.mesh.position.x > 250) c.mesh.position.x = -250;
            if (c.mesh.position.x < -250) c.mesh.position.x = 250;
        }
    }
}

// --- CITY BUILDER (BACKGROUND) ---
export class CityBuilder {
    constructor(scene) {
        this.scene = scene;
        this.metroGroup = new THREE.Group();
    }
    createCity() {
        const cityGroup = new THREE.Group();
        const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
        for(let i=0; i<80; i++) {
            const h = Math.random() * 50 + 20; 
            const w = Math.random() * 10 + 5;
            const col = Math.random() > 0.5 ? 0x8899aa : 0x667788;
            const building = new THREE.Mesh(buildingGeo, new THREE.MeshStandardMaterial({ color: col }));
            building.scale.set(w, h, w);
            building.position.set((Math.random() - 0.5) * 300, h/2 - 60, -70 - (Math.random() * 100));
            cityGroup.add(building);
        }
        this.scene.add(cityGroup);
    }
    createMetroSystem() {
        const trackZ = -50;
        const concMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
        const railBed = new THREE.Mesh(new THREE.BoxGeometry(500, 2, 8), concMat);
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
        if(this.metroGroup.position.x < -250) this.metroGroup.position.x = 250;
    }
}

// --- SKY SYSTEM (NEW) ---
export class SkySystem {
    constructor(scene) {
        this.scene = scene;
        this.clouds = [];
        this.createClouds();
    }
    createClouds() {
        // Low-poly cloud shape (Dodecahedron)
        const cloudGeo = new THREE.DodecahedronGeometry(1, 0);
        const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });

        for(let i=0; i<25; i++) {
            const group = new THREE.Group();
            
            // Create scattered clumps of puffs
            const puffs = Math.floor(Math.random() * 3) + 3; 
            for(let j=0; j<puffs; j++) {
                const mesh = new THREE.Mesh(cloudGeo, cloudMat);
                mesh.position.set(
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 3
                );
                // Randomize puff sizes
                mesh.scale.setScalar(Math.random() * 2 + 1);
                mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
                group.add(mesh);
            }
            
            // Scatter across the sky (High up)
            group.position.set(
                (Math.random() - 0.5) * 400, // Wide X spread
                Math.random() * 30 + 40,     // Height between 40 and 70
                (Math.random() - 0.5) * 300  // Depth spread
            );
            
            this.scene.add(group);
            // Random speed for parallax effect
            this.clouds.push({ mesh: group, speed: Math.random() * 0.05 + 0.02 });
        }
    }
    update() {
        for(let c of this.clouds) {
            c.mesh.position.x -= c.speed;
            // Loop clouds around
            if(c.mesh.position.x < -250) c.mesh.position.x = 250;
        }
    }
}
