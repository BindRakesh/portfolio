import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class OfficeChair {
    constructor(loadingManager) {
        this.mesh = new THREE.Group();
        
        // FIX: Use the passed loadingManager so the loading screen tracks this download
        const loader = new GLTFLoader(loadingManager);

        loader.load('./chair.glb', (gltf) => {
            const model = gltf.scene;
            
            // Enable shadows for the model parts
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.mesh.add(model);
        }, undefined, (error) => {
            console.error('An error happened loading the chair:', error);
        });
    }
}
