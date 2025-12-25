import * as THREE from 'three';

// --- CONFIGURATION ---
export const SCALES = {
    chair: 2.7, 
    plant: 0.009,
    car: 0.0009
};

// --- TEXTURE GENERATOR ---
function createTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (type === 'carpet') {
        ctx.fillStyle = '#445566'; ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#3a4a5a'; 
        for(let i=0; i<5000; i++) ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    } else if (type === 'wood') {
        ctx.fillStyle = '#e0e0e0'; ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 2;
        for(let i=0; i<20; i++) {
            ctx.beginPath(); ctx.moveTo(0, i*25); 
            ctx.bezierCurveTo(150, i*25+20, 350, i*25-20, 512, i*25); ctx.stroke();
        }
    } else if (type === 'ceiling') {
        ctx.fillStyle = '#eeeeee'; ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = '#dddddd'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, 512, 512);
        ctx.fillStyle = '#f9f9f9'; ctx.fillRect(5, 5, 502, 502);
    } else if (type === 'parking') {
        // Glowing Ring logic moved here or handled in ZoneSystem
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; 
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

// --- TEXTURES ---
export const texCarpet = createTexture('carpet'); texCarpet.repeat.set(15, 15);
export const texWood = createTexture('wood');
export const texCeiling = createTexture('ceiling'); texCeiling.repeat.set(10, 10);

// --- MATERIALS ---
export const matWall = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.8 });
export const matConcrete = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 1.0 });
export const matCarpet = new THREE.MeshStandardMaterial({ map: texCarpet, roughness: 1 });
export const matGlass = new THREE.MeshPhysicalMaterial({ color: 0xaaccff, transmission: 0.95, opacity: 0.1, transparent: true, roughness: 0.05, side: THREE.DoubleSide });
export const matChrome = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.2 });
export const matBlackMetal = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.4 });
export const matScanner = new THREE.MeshStandardMaterial({ color: 0x111111 });
export const matScannerLight = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); 
export const matCeiling = new THREE.MeshStandardMaterial({ map: texCeiling });
export const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
export const matScreenBlack = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2 });
export const matScreenGlow = new THREE.MeshBasicMaterial({ color: 0x00aaff });
export const matKeys = new THREE.MeshStandardMaterial({ color: 0x222222 });