import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import GUI from 'lil-gui'; // <--- NEW IMPORT

const SCALES = { car: 0.0017 };

export class RCCar {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physics = physicsWorld;
        this.mesh = new THREE.Group();
        this.scene.add(this.mesh);
        
        // --- PHYSICS ---
        const width = 0.2;
        const height = 0.15; 
        const length = 0.45;
        
        const shape = new CANNON.Box(new CANNON.Vec3(width, height, length)); 
        this.body = new CANNON.Body({ mass: 100, material: this.physics.carMat });
        this.body.addShape(shape);
        this.body.position.set(0, 2, 19); 
        this.body.linearDamping = 0.9; 
        this.body.angularDamping = 0.99;
        this.body.fixedRotation = true; 
        this.body.allowSleep = false; 
        this.physics.world.addBody(this.body);

        this.bodyGroup = new THREE.Group();
        this.mesh.add(this.bodyGroup);

        // --- LIGHT CLUSTERS ---
        this.redLights = [];    
        this.yellowLights = []; 
        this.lightGroups = []; // Store groups to move them with GUI

        // 1. SEPARATE CONFIGURATIONS (Adjust these manually in GUI)
        this.leftConfig = {
            x: -0.069,  // Negative for Left
            y: 0.029,
            z: 0.276,
            rotY: -0.398, // Negative rotation for Left
            scale: 1.0
        };

        this.rightConfig = {
            x: 0.1365,   // Positive for Right
            y: 0.0315,
            z: 0.276,
            rotY: 0.464,  // Positive rotation for Right
            scale: 0.9345
        };

        // Initial "Guess" Positions
        this.lightConfig = {
            x: 0.12,    // Width (Left/Right)
            y: 0.125,   // Height (Up/Down)
            z: 0.32,    // Depth (Forward/Back)
            rotY: 0.2,  // Curvature (Wrap around bumper)
            scale: 1.0  // Size of the Y shape
        };

        const createYLight = (isLeft) => {
            const group = new THREE.Group();
            
            // Pick the specific config for this side
            const cfg = isLeft ? this.leftConfig : this.rightConfig;

            // Apply positions directly (No automatic mirroring anymore)
            group.position.set(cfg.x, cfg.y, cfg.z);
            group.rotation.y = cfg.rotY;
            group.scale.setScalar(cfg.scale);

            // Materials
            const matRed = new THREE.MeshBasicMaterial({ color: 0x550000 });
            const matYellow = new THREE.MeshBasicMaterial({ color: 0x333300 });

            // Orientation Logic (Keep the shape logic we fixed)
            // Left = Scale 1 (<), Right = Scale -1 (>)
            const flipScale = isLeft ? 1 : -1; 

            // 1. Outer Blade
            const blade1 = this.createBladeMesh(matRed);
            blade1.position.x = isLeft ? -0.03 : 0.03;
            blade1.scale.x = flipScale;
            group.add(blade1);
            this.redLights.push(blade1);

            // 2. Middle Blade
            const blade2 = this.createBladeMesh(matRed);
            blade2.position.x = isLeft ? -0.015 : 0.015;
            blade2.scale.x = flipScale;
            group.add(blade2);
            this.redLights.push(blade2);

            // 3. Inner Blade
            const blade3 = this.createBladeMesh(matYellow);
            blade3.position.x = 0;
            blade3.scale.x = flipScale;
            group.add(blade3);
            this.yellowLights.push(blade3);

            this.bodyGroup.add(group);
            // Store reference to config so we can update it later
            this.lightGroups.push({ group, isLeft, config: cfg });
        };

        createYLight(true);  // Left
        createYLight(false); // Right

        // Load Model
        const loader = new GLTFLoader();
        loader.load('./car.glb', (gltf) => {
            const model = gltf.scene; 
            model.scale.set(SCALES.car, SCALES.car, SCALES.car); 
            model.rotation.y = Math.PI; 
            model.position.z = -0.15; 
            model.position.y = -0.1; 
            this.bodyGroup.add(model);
            
            const beam = new THREE.SpotLight(0xffffff, 5, 10, 0.6, 0.5, 1);
            beam.position.set(0, 0.5, -0.8);
            beam.target.position.set(0, 0, -5);
            this.mesh.add(beam);
            this.mesh.add(beam.target);
        }, undefined, (e) => console.error(e));
        
        this.speed = 0;
        this.steering = 0;
        this.actualSpeed = 0;
    }

    createBladeMesh(mat) {
        const g = new THREE.Group();
        
        // 1. THE STEM (Longer Tail)
        // Width 0.022 (Longer). 
        // Position x = -0.006 ensures it overlaps correctly with the "V" part.
        const stem = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.004, 0.01), mat);
        stem.position.set(-0.006, 0, 0); 
        
        // 2. THE V-SHAPE (Upper & Lower)
        // We keep these at x = 0.005 so they connect to the end of the stem
        const upper = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.01), mat);
        upper.position.set(0.005, 0.006, 0);
        upper.rotation.z = 0.5; // Angled up

        const lower = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.01), mat);
        lower.position.set(0.005, -0.006, 0);
        lower.rotation.z = -0.5; // Angled down

        g.add(stem, upper, lower);
        return g;
    }

    update(keys) {
        const maxSpeed = 15;
        const maxReverse = 6;
        const turnSpeed = 2.5; 

        // Wake physics if any key is pressed
        if (keys['w'] || keys['s'] || keys['space'] || keys['ArrowUp'] || keys['ArrowDown']) {
            this.body.wakeUp();
        }

        let targetSpeed = 0;
        let acceleration = 0.05; 

        const isBraking = keys.space;
        const isReversing = keys['s'] || keys['ArrowDown'];

        // --- COLOR LOGIC (FIXED) ---
        const setMat = (mesh, hex) => {
            mesh.children.forEach(part => part.material.color.setHex(hex));
        };

        // 1. RED LIGHTS (Brake OR Reverse = Bright)
        if (isBraking || isReversing) {
            this.redLights.forEach(l => setMat(l, 0xff0000)); // Bright Red
        } else {
            this.redLights.forEach(l => setMat(l, 0x550000)); // Dim Red
        }

        // 2. YELLOW LIGHTS (Reverse Only = Blink)
        if (isReversing) {
            const blink = Math.floor(Date.now() / 300) % 2 === 0;
            const col = blink ? 0xffff00 : 0x333300; 
            this.yellowLights.forEach(l => setMat(l, col));
        } else {
            this.yellowLights.forEach(l => setMat(l, 0x333300)); // Off
        }
        // ---------------------------

        // Drive Logic
        if (keys.space) {
            targetSpeed = 0;
            acceleration = 0.2; 
        } else {
            if(keys['w'] || keys['ArrowUp']) targetSpeed = -maxSpeed; 
            if(keys['s'] || keys['ArrowDown']) targetSpeed = maxReverse; 
        }

        this.actualSpeed = THREE.MathUtils.lerp(this.actualSpeed, targetSpeed, acceleration);

        if(Math.abs(this.actualSpeed) > 0.1) {
            const invert = (this.actualSpeed > 0) ? -1 : 1; 
            if(keys['a'] || keys['ArrowLeft']) this.steering += turnSpeed * 0.016 * invert;
            if(keys['d'] || keys['ArrowRight']) this.steering -= turnSpeed * 0.016 * invert;
        }

        this.body.velocity.x = this.actualSpeed * Math.sin(this.steering);
        this.body.velocity.z = this.actualSpeed * Math.cos(this.steering);

        this.mesh.position.copy(this.body.position);
        this.mesh.rotation.y = this.steering;
        this.speed = Math.abs(this.actualSpeed);

        let steerInput = 0; if(keys['a']) steerInput = 1; if(keys['d']) steerInput = -1;
        this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, steerInput * -0.2, 0.1);
        
        let pitchTarget = 0;
        if(keys.space) pitchTarget = 0.1; 
        else if(targetSpeed < 0) pitchTarget = -0.05; 
        
        this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, pitchTarget, 0.1);
    }
    
}