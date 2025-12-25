import * as THREE from 'three';

export class ZoneSystem {
    constructor(scene) {
        this.scene = scene;
        this.zones = [];
        this.resetMesh = null; 
        
        // --- COLORS ---
        // We use two colors to create depth
        this.coreColor = 0xffaa00; // Deep Orange
        this.glowColor = 0xffdd44; // Bright Yellow-Orange

        // --- MATERIALS ---
        // 1. Solid Hologram (The main shape)
        this.solidMat = new THREE.MeshBasicMaterial({ 
            color: this.coreColor,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending, // Glow effect
            depthWrite: false
        });

        // 2. Wireframe Overlay (To give edges definition)
        this.lineMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });

        // --- CREATE ZONES ---
        this.createHologram("about", -4, -3);    // Atom
        this.createHologram("projects", -4, 3);  // Tech Stack
        this.createHologram("contact", -4, 9);   // Beacon

        // --- RESET ZONE ---
        this.createResetZone(0, 3.5); 
    }

    createHologram(type, x, z) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        const spinner = new THREE.Group();
        spinner.position.y = 1.0; // Base float height

        if (type === "about") {
            // --- THE ATOM (Core + Orbits) ---
            
            // 1. Core (Icosahedron)
            const coreGeo = new THREE.IcosahedronGeometry(0.5, 0);
            const core = new THREE.Mesh(coreGeo, this.solidMat);
            const coreLines = new THREE.LineSegments(new THREE.WireframeGeometry(coreGeo), this.lineMat);
            core.add(coreLines);
            spinner.add(core);

            // 2. Orbit Rings (Torus)
            const ringGeo = new THREE.TorusGeometry(0.8, 0.02, 16, 64);
            
            const ring1 = new THREE.Mesh(ringGeo, this.solidMat);
            ring1.rotation.x = Math.PI / 1.5; // Tilted
            
            const ring2 = new THREE.Mesh(ringGeo, this.solidMat);
            ring2.rotation.x = -Math.PI / 1.5; // Tilted opposite
            
            spinner.add(ring1);
            spinner.add(ring2);
            
            // Save refs for animation
            spinner.userData = { type: 'atom', rings: [ring1, ring2] };
        } 
        else if (type === "projects") {
            // --- THE TECH STACK (3 Floating Cubes) ---
            
            const boxGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
            
            // Bottom Cube
            const b1 = new THREE.Mesh(boxGeo, this.solidMat);
            b1.position.y = -0.6;
            b1.add(new THREE.LineSegments(new THREE.WireframeGeometry(boxGeo), this.lineMat));
            
            // Middle Cube
            const b2 = new THREE.Mesh(boxGeo, this.solidMat);
            b2.position.y = 0;
            b2.add(new THREE.LineSegments(new THREE.WireframeGeometry(boxGeo), this.lineMat));
            
            // Top Cube
            const b3 = new THREE.Mesh(boxGeo, this.solidMat);
            b3.position.y = 0.6;
            b3.add(new THREE.LineSegments(new THREE.WireframeGeometry(boxGeo), this.lineMat));

            spinner.add(b1, b2, b3);
            spinner.userData = { type: 'stack', cubes: [b1, b2, b3] };
        } 
        else if (type === "contact") {
            // --- THE BEACON (Sphere + Radiating Rings) ---
            
            // Central Sphere
            const sphereGeo = new THREE.SphereGeometry(0.4, 16, 16);
            const ball = new THREE.Mesh(sphereGeo, this.solidMat);
            ball.add(new THREE.LineSegments(new THREE.WireframeGeometry(sphereGeo), this.lineMat));
            spinner.add(ball);

            // Outer Rings (Flat discs that will pulse)
            const d1 = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.7, 32), this.solidMat);
            d1.rotation.x = -Math.PI / 2;
            
            const d2 = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 32), this.solidMat);
            d2.rotation.x = -Math.PI / 2;

            spinner.add(d1, d2);
            spinner.userData = { type: 'beacon', discs: [d1, d2] };
        }

        group.add(spinner);

        // --- FLOOR ANCHOR (Base Ring) ---
        const anchorGeo = new THREE.RingGeometry(1.5, 1.7, 32);
        const anchor = new THREE.Mesh(anchorGeo, this.solidMat);
        anchor.rotation.x = -Math.PI / 2;
        anchor.position.y = 0.05;
        group.add(anchor);

        this.scene.add(group);
        
        this.zones.push({ 
            position: new THREE.Vector3(x, 0, z), 
            radius: 2.2, 
            type: type, 
            group: group,
            spinner: spinner,
            timeOffset: Math.random() * 100 
        });
    }

    createResetZone(x, z) {
        const mat = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, transparent: true, opacity: 0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
        });
        const mesh = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.7, 32), mat);
        mesh.rotation.x = -Math.PI / 2; 
        mesh.position.set(x, 0.05, z);
        this.scene.add(mesh);
        this.resetMesh = mesh;
        mesh.visible = false; 
        this.zones.push({ position: new THREE.Vector3(x, 0, z), radius: 2.0, type: 'reset', mesh: mesh });
    }

    setResetZoneVisible(visible) {
        if (this.resetMesh) this.resetMesh.visible = visible;
    }

    update(time) {
        this.zones.forEach(zone => {
            // Pulse Reset Zone
            if (zone.mesh && zone.mesh.visible) {
                zone.mesh.material.opacity = 0.5 + Math.sin(time * 6) * 0.4;
            }

            // Animate Holograms
            if (zone.spinner) {
                const data = zone.spinner.userData;

                // GLOBAL BOBBING (Levitation)
                const bob = Math.sin(time * 2 + zone.timeOffset) * 0.1;
                zone.spinner.position.y = 1.3 + bob;

                if (data.type === 'atom') {
                    // 1. Rotate Core
                    zone.spinner.children[0].rotation.y = time;
                    zone.spinner.children[0].rotation.z = time * 0.5;
                    // 2. Rotate Rings (Opposite directions)
                    data.rings[0].rotation.y = time * 1.5;
                    data.rings[1].rotation.y = time * -1.5;
                } 
                else if (data.type === 'stack') {
                    // Rotate Cubes in alternating directions
                    data.cubes[0].rotation.y = time;       // Bottom
                    data.cubes[1].rotation.y = -time * 1.2; // Middle
                    data.cubes[2].rotation.y = time;       // Top
                    
                    // Slight vertical expansion (breathing stack)
                    const expand = Math.sin(time * 3) * 0.05;
                    data.cubes[0].position.y = -0.6 - expand;
                    data.cubes[2].position.y = 0.6 + expand;
                } 
                else if (data.type === 'beacon') {
                    // Spin the ball
                    zone.spinner.children[0].rotation.y = time;
                    
                    // Pulse the rings (Scale Up and Fade)
                    const s1 = (time * 0.5) % 1; // 0 to 1 loop
                    const s2 = ((time * 0.5) + 0.5) % 1; // Offset loop
                    
                    // Ring 1
                    data.discs[0].scale.setScalar(1 + s1 * 0.5); // Scale 1.0 to 1.5
                    data.discs[0].material.opacity = 1.0 - s1;   // Fade out
                    
                    // Ring 2
                    data.discs[1].scale.setScalar(1 + s2 * 0.5);
                    // Use a separate material clone for independent fading if needed, 
                    // but for simplicity here they share opacity which might pulse.
                    // Ideally, give them unique mats for independent fading.
                }
            }
        });
    }

    check(carPosition) {
        for(let zone of this.zones) {
            const isActive = (zone.mesh && zone.mesh.visible) || zone.group;
            if (isActive && carPosition.distanceTo(zone.position) < zone.radius) {
                return zone.type;
            }
        }
        return null;
    }
}