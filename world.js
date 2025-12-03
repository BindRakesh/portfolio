import * as THREE from 'three';

// --- MATERIALS ---
const matMetal = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.2, metalness: 0.8 });
const matBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
const matDesk = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 }); // White modern desks
const matScreenOff = new THREE.MeshStandardMaterial({ color: 0x111111 });
const matScreenOn = new THREE.MeshBasicMaterial({ color: 0x00ffcc }); // Your glowing screen
const matGlass = new THREE.MeshPhysicalMaterial({ 
    color: 0x88ccff, transmission: 0.9, opacity: 0.3, transparent: true, roughness: 0 
});
const matConcrete = new THREE.MeshStandardMaterial({ color: 0x333333 });

export class OfficeBuilder {
    constructor(scene) {
        this.scene = scene;
        this.interactables = [];
    }

    createFloor() {
        // Large carpeted floor for 50 people
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1 }));
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Ceiling
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 8;
        this.scene.add(ceiling);

        // The Big Glass Window Wall (Looking at city)
        // We create a frame
        const frameGeo = new THREE.BoxGeometry(60, 8, 0.5);
        // Cut out logic is complex, so we just add glass panels
        const glassWall = new THREE.Mesh(new THREE.PlaneGeometry(60, 8), matGlass);
        glassWall.position.set(0, 4, -20);
        this.scene.add(glassWall);
    }

    createWorkstations() {
        // We need 5 rows of 10 desks
        const rows = 5;
        const cols = 10;
        const startX = -25;
        const startZ = -10;
        const spacingX = 5.5;
        const spacingZ = 6;

        // "My" Desk coordinates (e.g., Row 2, Col 5)
        const myRow = 2; 
        const myCol = 5;

        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                const x = startX + (c * spacingX);
                const z = startZ + (r * spacingZ);
                
                const isMine = (r === myRow && c === myCol);
                this.buildSingleDesk(x, z, isMine);
            }
        }
    }

    buildSingleDesk(x, z, isInteractable) {
        const deskGroup = new THREE.Group();
        deskGroup.position.set(x, 0, z);

        // 1. The Table
        const table = new THREE.Mesh(new THREE.BoxGeometry(5, 0.1, 2.5), matDesk);
        table.position.y = 1.5;
        table.castShadow = true;
        
        // Legs
        const legGeo = new THREE.BoxGeometry(0.1, 1.5, 2.4);
        const legL = new THREE.Mesh(legGeo, matMetal); legL.position.set(-2.4, 0.75, 0);
        const legR = new THREE.Mesh(legGeo, matMetal); legR.position.set(2.4, 0.75, 0);

        // 2. Partition (Cubicle Wall)
        const partition = new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 0.05), new THREE.MeshStandardMaterial({color: 0x336699}));
        partition.position.set(0, 1.9, -1.25);

        // 3. Monitor
        const monStand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5), matBlack);
        monStand.position.set(0, 1.75, -0.8);
        const monScreen = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.05), isInteractable ? matBlack : matBlack);
        monScreen.position.set(0, 2.1, -0.8);
        
        // If it's MY desk, add the glowing interactive screen
        if (isInteractable) {
            const glowScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.8), matScreenOn);
            glowScreen.position.set(0, 0, 0.03); // Slightly in front of monitor
            glowScreen.name = "HeroMonitor"; // Tag for Raycaster
            monScreen.add(glowScreen);
            
            // Add a Spotlight over my desk to highlight it
            const spot = new THREE.SpotLight(0xffaa00, 10);
            spot.position.set(0, 5, 0);
            spot.target = table;
            spot.angle = 0.5;
            deskGroup.add(spot);
            
            // Push to interactables array
            this.interactables.push(glowScreen);
        }

        // 4. Chair (Simplified High-Poly look)
        const chairGroup = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), new THREE.MeshStandardMaterial({color: 0x111111}));
        const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.1), new THREE.MeshStandardMaterial({color: 0x111111}));
        back.position.set(0, 0.8, 0.6);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.1), matMetal);
        base.position.set(0, -0.8, 0);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8), matMetal);
        stem.position.set(0, -0.4, 0);

        chairGroup.add(seat, back, base, stem);
        chairGroup.position.set(0, 1, 1.5);
        if(!isInteractable) chairGroup.rotation.y = (Math.random() - 0.5); // Randomize other chairs rotation
        
        deskGroup.add(table, legL, legR, partition, monStand, monScreen, chairGroup);
        this.scene.add(deskGroup);
    }
}

export class CityBuilder {
    constructor(scene) {
        this.scene = scene;
        this.metroGroup = new THREE.Group();
    }

    createCity() {
        // Distant Buildings
        const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
        const cityGroup = new THREE.Group();
        
        for(let i=0; i<60; i++) {
            const h = Math.random() * 20 + 10;
            const w = Math.random() * 5 + 3;
            const building = new THREE.Mesh(buildingGeo, new THREE.MeshStandardMaterial({ color: 0x050505 }));
            building.scale.set(w, h, w);
            building.position.set(
                (Math.random() - 0.5) * 150,
                h/2 - 20, // Lower them so we look slightly down or straight at them
                -40 - (Math.random() * 50)
            );
            
            // Random windows
            if(Math.random() > 0.3) {
                const winGeo = new THREE.PlaneGeometry(0.2, 0.2);
                const winMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
                for(let w=0; w<10; w++) {
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
        // 1. The Track (Elevated Concrete)
        const trackY = 0; 
        const trackZ = -30;
        
        // Pillars
        const pillarGeo = new THREE.CylinderGeometry(1, 1, 30);
        for(let x = -80; x <= 80; x+=20) {
            const pillar = new THREE.Mesh(pillarGeo, matConcrete);
            pillar.position.set(x, -15, trackZ);
            this.scene.add(pillar);
        }

        // The Platform/Rail Bed
        const railBed = new THREE.Mesh(new THREE.BoxGeometry(200, 2, 6), matConcrete);
        railBed.position.set(0, trackY, trackZ);
        this.scene.add(railBed);

        // 2. The Train (Detailed)
        // Head
        const trainMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6 });
        const carGeo = new THREE.BoxGeometry(8, 2.5, 2.2);
        
        // Create 3 carriages
        for(let i=0; i<3; i++) {
            const car = new THREE.Mesh(carGeo, trainMat);
            car.position.set(i * 8.5, 1.5, 0); // Spaced out
            
            // Windows (Glowing strip)
            const winStrip = new THREE.Mesh(new THREE.PlaneGeometry(7, 0.8), new THREE.MeshBasicMaterial({ color: 0xffeeaa }));
            winStrip.position.set(0, 0.2, 1.11);
            car.add(winStrip);

            this.metroGroup.add(car);
        }

        // Headlight
        const light = new THREE.PointLight(0xffffff, 2, 20);
        light.position.set(-4, 1.5, 0);
        this.metroGroup.add(light);

        this.metroGroup.position.set(50, trackY + 0.5, trackZ);
        this.scene.add(this.metroGroup);
    }

    updateMetro() {
        // Move Train
        this.metroGroup.position.x -= 0.3; // Speed
        if(this.metroGroup.position.x < -100) {
            this.metroGroup.position.x = 100; // Reset
        }
    }
}
