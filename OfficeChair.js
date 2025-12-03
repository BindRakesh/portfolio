import * as THREE from 'three';

const matBlackPlastic = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
const matFabric = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1.0 });
const matChrome = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.1 });

export class OfficeChair {
    constructor() {
        this.mesh = new THREE.Group();
        this.build();
        // SCALING UP: Made chair 30% larger to fit the desk better
        this.mesh.scale.set(1.3, 1.3, 1.3);
    }

    build() {
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
        const armL = new THREE.Mesh(arm
