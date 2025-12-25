import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { 
    SCALES, matDeskSurface, matWhite, matBlackMetal, 
    matScreenBlack, matScreenGlow, matKeys, texWood
} from './assets.js';

// --- MODERN DESK ---
export class ModernDesk {
    constructor() { this.group = new THREE.Group(); this.interactableScreen = null; }
    build(isInteractable) {
        // Local material definition for wood since it needs the texture
        const matWood = new THREE.MeshStandardMaterial({ map: texWood, roughness: 0.3 });
        const deskGroup = new THREE.Group();

        const top = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.08, 2.2), matWood);
        top.position.y = 1.5; top.castShadow = true; deskGroup.add(top);

        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 2.0), matBlackMetal); legL.position.set(-2.15, 0.75, 0); deskGroup.add(legL);
        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 2.0), matBlackMetal); legR.position.set(2.15, 0.75, 0); deskGroup.add(legR);

        const drawer = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.45, 2.0), matWhite); drawer.position.set(1.4, 0.725, 0); deskGroup.add(drawer);

        const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 0.05), matScreenBlack);
        monitor.position.set(0, 2.1, -0.6);
        const display = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.9), isInteractable ? matScreenGlow : matScreenBlack);
        display.position.set(0, 0, 0.03); 
        if(isInteractable) { display.name = "HeroMonitor"; this.interactableScreen = display; }
        monitor.add(display);
        deskGroup.add(monitor);

        const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.3), matKeys);
        keyboard.position.set(0, 1.55, 0.2); deskGroup.add(keyboard);

        return deskGroup;
    }
}

// --- PHYSICS CAR ---
export class RCCar {
    constructor(scene, colliders) {
        this.scene = scene;
        this.colliders = colliders; 
        this.mesh = new THREE.Group();
        this.speed = 0; this.steering = 0; this.maxSpeed = 0.4; this.friction = 0.96; this.acceleration = 0.02;
        this.mesh.position.set(0, 0.2, 5); this.scene.add(this.mesh);
        this.loadCar();
        this.carBox = new THREE.Box3(); this.tempBox = new THREE.Box3();
    }

    loadCar() {
        const loader = new GLTFLoader();
        loader.load('./car.glb', (gltf) => {
            const model = gltf.scene; model.scale.set(SCALES.car, SCALES.car, SCALES.car); model.rotation.y = Math.PI; 
            this.mesh.add(model);
            const beam = new THREE.SpotLight(0xffffff, 5, 10, 0.6, 0.5, 1); beam.position.set(0, 0.5, -0.8); beam.target.position.set(0, 0, -5);
            this.mesh.add(beam); this.mesh.add(beam.target);
        });
    }

    update(keys) {
        if(keys['w'] || keys['ArrowUp']) this.speed -= this.acceleration;
        if(keys['s'] || keys['ArrowDown']) this.speed += this.acceleration;
        if(Math.abs(this.speed) > 0.001) {
            const turn = (keys['a'] || keys['ArrowLeft']) ? 1 : (keys['d'] || keys['ArrowRight']) ? -1 : 0;
            const dir = this.speed > 0 ? 1 : -1;
            this.steering = turn * 0.04 * dir; 
        } else { this.steering = 0; }

        this.speed *= this.friction;
        this.speed = Math.max(Math.min(this.speed, this.maxSpeed), -this.maxSpeed);

        const nextPos = this.mesh.position.clone();
        nextPos.x += Math.sin(this.mesh.rotation.y + this.steering) * this.speed * 2; 
        nextPos.z += Math.cos(this.mesh.rotation.y + this.steering) * this.speed * 2;
        this.carBox.setFromCenterAndSize(nextPos, new THREE.Vector3(0.6, 0.5, 1.2));

        let collision = false;
        for(let obj of this.colliders) {
            this.tempBox.setFromObject(obj);
            if(this.carBox.intersectsBox(this.tempBox)) { collision = true; break; }
        }

        if(!collision) {
            this.mesh.translateX(this.steering * this.speed * 2); this.mesh.translateZ(this.speed); this.mesh.rotation.y += this.steering * (this.speed * 3); 
        } else { this.speed *= -0.5; }
    }
}

// --- ZONE SYSTEM ---
export class ZoneSystem {
    constructor(scene) {
        this.scene = scene;
        this.zones = [];
        this.createZone(0, 15, "CONTACT", "contact");
        this.createZone(-10, 5, "ABOUT", "about");
        this.createZone(10, 5, "PROJECTS", "projects");
    }

    createZoneTexture(label) {
        const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 20; ctx.beginPath(); ctx.arc(256, 256, 240, 0, Math.PI*2); ctx.stroke();
        const grad = ctx.createRadialGradient(256, 256, 100, 256, 256, 256); grad.addColorStop(0, 'rgba(0, 255, 255, 0.5)'); grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad; ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 60px Arial'; ctx.textAlign = 'center'; ctx.fillText("PARKING", 256, 200);
        ctx.fillStyle = '#00ffff'; ctx.font = 'bold 80px Arial'; ctx.fillText(label, 256, 300);
        return new THREE.CanvasTexture(canvas);
    }

    createZone(x, z, label, type) {
        const texture = this.createZoneTexture(label);
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.8, depthWrite: false }));
        mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, 0.05, z);
        this.scene.add(mesh);
        this.zones.push({ position: new THREE.Vector3(x, 0, z), radius: 2.0, type: type });
    }

    check(carPosition) {
        for(let zone of this.zones) {
            if(carPosition.distanceTo(zone.position) < zone.radius) return zone.type;
        }
        return null;
    }
}