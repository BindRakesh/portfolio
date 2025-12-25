import * as THREE from 'three';

// --- PALETTE ---
const COLORS = {
    wall: 0xeeeeee, floor: 0x222222, wood: 0x5d4037, metal: 0x1a1a1a,
    accent: 0xff6b6b, glass: 0xaaccff, emit: 0xffffff
};

export function createTexture(type) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512; 
    const ctx = canvas.getContext('2d');

    if (type === 'carpet') {
        // DESIGN: Modern Commercial Carpet Tiles (Grey/Blue tint)
        ctx.fillStyle = '#2c3e50'; ctx.fillRect(0,0,512,512); 
        
        // Noise Texture (Subtle)
        for(let i=0; i<15000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#34495e' : '#22303f';
            const x = Math.random()*512; const y = Math.random()*512;
            const w = Math.random()*3;
            ctx.fillRect(x,y,w,w); 
        }

        // Tile Pattern (Thin, faint lines for a premium look)
        ctx.strokeStyle = '#3e5871'; ctx.lineWidth = 1;
        ctx.beginPath();
        // 4x4 Grid
        for(let i=0; i<=512; i+=128) { 
            ctx.moveTo(i,0); ctx.lineTo(i,512); 
            ctx.moveTo(0,i); ctx.lineTo(512,i); 
        }
        ctx.stroke();
        
    } else if (type === 'wood') {
        ctx.fillStyle = '#5d4037'; ctx.fillRect(0,0,512,512); 
        ctx.strokeStyle = '#4e342e'; ctx.lineWidth=2; 
        for(let i=0;i<20;i++){ ctx.beginPath();ctx.moveTo(0,i*25);ctx.bezierCurveTo(150,i*25+20, 350,i*25-20, 512,i*25);ctx.stroke();}
    }
    else if (type === 'zone') {
        ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth=10; ctx.beginPath(); ctx.arc(256,256,230,0,Math.PI*2); ctx.stroke();
        const g=ctx.createRadialGradient(256,256,100,256,256,256); g.addColorStop(0,'rgba(255, 107, 107, 0.2)'); g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.fill();
        ctx.fillStyle='#ffffff'; ctx.font='bold 40px Arial'; ctx.textAlign='center'; ctx.fillText("ZONE",256,220);
    }
    
    const t = new THREE.CanvasTexture(canvas); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}

const texCarpet = createTexture('carpet'); texCarpet.repeat.set(8,8);
const texWood = createTexture('wood');

export const matWall = new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.9 });
export const matCarpet = new THREE.MeshStandardMaterial({ map: texCarpet, roughness: 0.8, metalness: 0.1 });
export const matWood = new THREE.MeshStandardMaterial({ map: texWood, roughness: 0.3 });
export const matBlackMetal = new THREE.MeshStandardMaterial({ color: COLORS.metal, roughness: 0.4 });
export const matChrome = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.9 });
export const matGlass = new THREE.MeshPhysicalMaterial({ color: COLORS.glass, transmission: 0.95, opacity: 0.3, transparent: true, roughness: 0.0 });
export const matScreenGlow = new THREE.MeshBasicMaterial({ color: 0x4fc3f7 }); 
export const matScreenBlack = new THREE.MeshStandardMaterial({ color: 0x111111 });
export const matKeys = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
export const matCeiling = new THREE.MeshStandardMaterial({ color: 0xdddddd }); 
export const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
export const matScanner = new THREE.MeshStandardMaterial({ color: 0x111111 });
export const matScannerLight = new THREE.MeshBasicMaterial({ color: 0x00ff00 });