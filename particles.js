import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        
        // --- SYSTEM 1: AMBIENT DUST (Restored & Balanced) ---
        this.dustCount = 200; // Balanced count (Not 2000, not 80)
        
        const dustGeo = new THREE.BufferGeometry();
        const dustPos = new Float32Array(this.dustCount * 3);
        this.dustSpeeds = new Float32Array(this.dustCount); // Restored speed array

        for (let i = 0; i < this.dustCount; i++) {
            // Spread wide
            dustPos[i * 3] = (Math.random() - 0.5) * 80;
            dustPos[i * 3 + 1] = Math.random() * 10; 
            dustPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
            
            // Random upward speed for each particle
            this.dustSpeeds[i] = Math.random() * 0.02 + 0.005; 
        }
        
        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
        
        const dustMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1, // Small but visible
            transparent: true,
            opacity: 0.2, // Subtle visibility
            sizeAttenuation: true,
            depthWrite: false, 
            blending: THREE.AdditiveBlending 
        });
        
        this.dustPoints = new THREE.Points(dustGeo, dustMat);
        this.scene.add(this.dustPoints);

        // --- SYSTEM 2: TIRE SMOKE ---
        this.smokeParticles = [];
        
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); 
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)'); 
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        this.smokeMaterial = new THREE.SpriteMaterial({ 
            map: texture, 
            color: 0xeeeeee, 
            transparent: true, 
            opacity: 0.3, // Slightly more visible than 0.2
            depthWrite: false 
        });
    }

    emitSmoke(position) {
        const sprite = new THREE.Sprite(this.smokeMaterial.clone()); 
        
        sprite.position.copy(position);
        sprite.position.x += (Math.random() - 0.5) * 0.3; // Tighter spread
        sprite.position.z += (Math.random() - 0.5) * 0.3;
        sprite.position.y += 0.1; 
        
        const scale = Math.random() * 0.3 + 0.2;
        sprite.scale.set(scale, scale, scale);
        
        this.scene.add(sprite);
        
        this.smokeParticles.push({
            mesh: sprite,
            life: 0.8, // Lasts a bit longer than 0.6
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.1, 
                Math.random() * 0.3 + 0.1,   
                (Math.random() - 0.5) * 0.1  
            )
        });
    }

    update(dt = 0.016) {
        // 1. UPDATE DUST (Your Original Logic Restored)
        const positions = this.dustPoints.geometry.attributes.position.array;
        
        for (let i = 0; i < this.dustCount; i++) {
            // Move up by individual speed
            positions[i * 3 + 1] += this.dustSpeeds[i]; 
            
            // Reset if hits ceiling (Y > 10)
            if (positions[i * 3 + 1] > 10) {
                positions[i * 3 + 1] = 0;
                positions[i * 3] = (Math.random() - 0.5) * 80; // Respawn X
                positions[i * 3 + 2] = (Math.random() - 0.5) * 60; // Respawn Z
            }
        }
        this.dustPoints.geometry.attributes.position.needsUpdate = true;

        // 2. UPDATE SMOKE
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.life -= dt;
            
            p.mesh.position.addScaledVector(p.velocity, dt);
            p.mesh.scale.multiplyScalar(1.03); 
            p.mesh.material.rotation += dt; 
            
            // Fade out
            p.mesh.material.opacity = p.life * 0.4;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.material.dispose(); 
                this.smokeParticles.splice(i, 1);
            }
        }
    }
}
