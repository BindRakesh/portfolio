import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.count = 2000; // Number of dust motes
        
        // Geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.count * 3);
        const speeds = new Float32Array(this.count); // Random speed for each

        for (let i = 0; i < this.count; i++) {
            // Spread particles across the room (x: -30 to 30, y: 0 to 10, z: -20 to 20)
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = Math.random() * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
            speeds[i] = Math.random() * 0.02 + 0.005;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Material (Tiny glowing dots)
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        });

        this.points = new THREE.Points(geometry, material);
        this.scene.add(this.points);
        
        // Store speeds for animation
        this.speeds = speeds;
    }

    update() {
        const positions = this.points.geometry.attributes.position.array;

        for (let i = 0; i < this.count; i++) {
            // Float upwards slowly
            positions[i * 3 + 1] += this.speeds[i];

            // Reset if they hit the ceiling (y=10)
            if (positions[i * 3 + 1] > 10) {
                positions[i * 3 + 1] = 0;
                positions[i * 3] = (Math.random() - 0.5) * 60; // Respawn random X
                positions[i * 3 + 2] = (Math.random() - 0.5) * 40; // Respawn random Z
            }
        }

        // Flag geometry for update
        this.points.geometry.attributes.position.needsUpdate = true;
    }
}