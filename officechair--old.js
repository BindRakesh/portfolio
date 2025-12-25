import * as THREE from 'three';

// Local materials for the procedural chair
const matBlackPlastic = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
const matFabric = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1.0 });
const matChrome = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.1 });

export class OfficeChair {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
        // SCALING UP: Made chair 30% larger to fit the desk better
        this.mesh.scale.set(1.3, 1.3, 1.3);
        // Cast shadows for all parts
        this.mesh.traverse(c => {
            if (c.isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;
            }
        });
    }

    build() {
        // 1. Base (Star Legs)
        const baseGroup = new THREE.Group();
        const legGeo = new THREE.BoxGeometry(0.1, 0.05, 0.7);
        
        for(let i=0; i<5; i++) {
            const leg = new THREE.Mesh(legGeo, matChrome);
            leg.rotation.y = (i / 5) * Math.PI * 2;
            leg.position.y = 0.1;
            leg.translateZ(0.35); // Move out from center
            
            // Wheels
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05), matBlackPlastic);
            wheel.rotation.z = Math.PI/2;
            wheel.position.set(0, -0.05, 0.3); // End of leg
            
            leg.add(wheel);
            baseGroup.add(leg);
        }
        this.mesh.add(baseGroup);

        // 2. Gas Lift
        const lift = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6), matChrome);
        lift.position.y = 0.4;
        this.mesh.add(lift);

        // 3. Seat
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), matFabric);
        seat.position.y = 0.7;
        this.mesh.add(seat);

        // 4. Backrest
        const backGroup = new THREE.Group();
        backGroup.position.set(0, 0.9, 0.3); // Attached to back of seat
        
        // Spine connecting seat to back
        const spine = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.05), matBlackPlastic);
        spine.rotation.x = -0.1; // Slight recline
        
        // Main Back Panel
        const meshBack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.02), matFabric);
        meshBack.position.z = 0.05;
        meshBack.rotation.x = -0.1;
        
        // Headrest
        const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.05), matFabric);
        headrest.position.set(0, 0.5, 0.05);
        headrest.rotation.x = -0.1;
        
        backGroup.add(spine, meshBack, headrest);
        this.mesh.add(backGroup);

        // 5. Armrests (The missing part)
        const armVerticalGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3);
        const armRestGeo = new THREE.BoxGeometry(0.08, 0.05, 0.4);

        // Left Arm
        const armLGroup = new THREE.Group();
        armLGroup.position.set(-0.35, 0.7, 0); // Side of seat
        
        const armLVert = new THREE.Mesh(armVerticalGeo, matBlackPlastic);
        armLVert.position.y = 0.15;
        
        const armLPad = new THREE.Mesh(armRestGeo, matBlackPlastic);
        armLPad.position.set(0, 0.3, 0);
        
        armLGroup.add(armLVert, armLPad);
        this.mesh.add(armLGroup);

        // Right Arm
        const armRGroup = new THREE.Group();
        armRGroup.position.set(0.35, 0.7, 0); // Side of seat
        
        const armRVert = new THREE.Mesh(armVerticalGeo, matBlackPlastic);
        armRVert.position.y = 0.15;
        
        const armRPad = new THREE.Mesh(armRestGeo, matBlackPlastic);
        armRPad.position.set(0, 0.3, 0);
        
        armRGroup.add(armRVert, armRPad);
        this.mesh.add(armRGroup);
    }
}
