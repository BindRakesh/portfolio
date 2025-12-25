import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class PropSystem {
    constructor(scene, physics, audio) {
        this.scene = scene;
        this.physics = physics;
        this.audio = audio; // Ensure audio system is saved
        this.props = []; 
        this.createProps();
        
    }

    // Check if the pyramid is messed up
    isPyramidDisturbed() {
        let maxDist = 0;
        
        for (let prop of this.props) {
            const dist = prop.body.position.distanceTo(prop.initialPos);
            if (dist > maxDist) maxDist = dist;
            
            // FIX: Increased threshold to 1.0 meter
            // A box must move 1 full meter to trigger the reset zone
            if (dist > 1.0) {
                return true;
            }
        }
        
        // Optional Debug: Uncomment this to see how much they move
        // console.log("Max Box Movement:", maxDist);
        
        return false; 
    }

    createProps() {
        // PYRAMID CONFIG (Centered at 0,0)
        const boxSize = 0.5;
        const startX = 0;  
        const startZ = 0; 
        const startY = 0.5; 

        // Layer 1 (Base: 3x3)
        this.createLayer(3, startX, startY, startZ, boxSize);

        // Layer 2 (Middle: 2x2)
        this.createLayer(2, startX, startY + boxSize, startZ, boxSize);

        // Layer 3 (Top: 1x1)
        this.createLayer(1, startX, startY + (boxSize * 2), startZ, boxSize);
    }

   createLayer(rows, startX, y, startZ, size) {
        const offset = (3 - rows) * (size / 2); 
        const centerAdjust = (3 * size) / 2;

        for (let x = 0; x < rows; x++) {
            for (let z = 0; z < rows; z++) {
                this.createBox(
                    startX + offset + (x * size) - centerAdjust, 
                    
                    // FIX: Add a tiny gap (y + 0.05) to stop physics jitter
                    y + 0.05, 
                    
                    startZ + offset + (z * size) - centerAdjust
                );
            }
        }
    }

    createBox(x, y, z) {
        const size = 0.5;
        
        // Visual
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(size, size, size),
            new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        // Physics
        const shape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
        const body = new CANNON.Body({ mass: 2 }); 
        body.addShape(shape);
        body.position.set(x, y, z);
        this.physics.world.addBody(body);

        // --- FIX 1: RESTORE HIT SOUND ---
        body.addEventListener('collide', (e) => {
            // Get impact force
            const velocity = e.contact.getImpactVelocityAlongNormal();
            // Only play if hit is hard enough (> 1.0)
            if (Math.abs(velocity) > 1.0) {
                this.audio.playImpact(Math.abs(velocity));
            }
        });

        this.props.push({
            mesh: mesh,
            body: body,
            initialPos: new CANNON.Vec3(x, y, z),
            initialQuat: new CANNON.Quaternion(0, 0, 0, 1)
        });
    }

    update() {
        this.props.forEach(prop => {
            prop.mesh.position.copy(prop.body.position);
            prop.mesh.quaternion.copy(prop.body.quaternion);
        });
    }

    reset() {
        console.log("Resetting Pyramid...");
        this.props.forEach(prop => {
            prop.body.position.copy(prop.initialPos);
            prop.body.quaternion.copy(prop.initialQuat);
            prop.body.velocity.set(0, 0, 0);
            prop.body.angularVelocity.set(0, 0, 0);
            prop.mesh.position.copy(prop.body.position);
            prop.mesh.quaternion.copy(prop.body.quaternion);
            prop.body.wakeUp();
        });
        
        // FIX: If you passed 'zones' to PropSystem, you could hide it here directly,
        // but the main loop handles it automatically if isPyramidDisturbed returns false.
    }
}