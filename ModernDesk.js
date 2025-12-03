import * as THREE from 'three';

const matWhiteDesk = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
const matDarkMetal = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
const matScreenBlack = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2 });
const matScreenGlow = new THREE.MeshBasicMaterial({ color: 0x00aaff });
const matKeys = new THREE.MeshStandardMaterial({ color: 0x222222 });

export class ModernDesk {
    constructor() {
        this.group = new THREE.Group();
        this.interactableScreen = null; 
    }

    build(isInteractable) {
        const deskGroup = new THREE.Group();

        // 1. Table Top
        const top = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.08, 2.2), matWhiteDesk);
        top.position.y = 1.5;
        top.castShadow = true;
        deskGroup.add(top);

        // 2. Legs
        const legGeo = new THREE.BoxGeometry(0.1, 1.5, 2.0);
        const legL = new THREE.Mesh(legGeo, matDarkMetal); legL.position.set(-2.15, 0.75, 0);
        const legR = new THREE.Mesh(legGeo, matDarkMetal); legR.position.set(2.15, 0.75, 0);
        deskGroup.add(legL, legR);

        // 3. FULL HEIGHT Storage Unit
        // Height = 1.45 (touches floor and underside of desk)
        // Y Position = 1.45 / 2 = 0.725
        const drawerUnit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.45, 2.0), matWhiteDesk);
        drawerUnit.position.set(1.4, 0.725, 0);
        
        // Handles
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.05), matDarkMetal);
        handle.position.set(0, 0.4, 1.0);
        const handle2 = handle.clone(); handle2.position.set(0, 0.0, 1.0);
        const handle3 = handle.clone(); handle3.position.set(0, -0.4, 1.0);
        drawerUnit.add(handle, handle2, handle3);
        deskGroup.add(drawerUnit);

        // 4. Partition
        const part = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.6, 0.05), new THREE.MeshStandardMaterial({color: 0x335577}));
        part.position.set(0, 1.8, -1.05);
        deskGroup.add(part);

        // 5. Tech Setup
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
