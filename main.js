import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OfficeBuilder, CityBuilder } from './world.js';

// --- SCENE & ATMOSPHERE ---
const scene = new THREE.Scene();
// Changed to a Twilight Blue (Evening but bright)
scene.background = new THREE.Color(0x1a1a2e); 
// Lighter fog to show city depth
scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015);

// --- CAMERA ---
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
// Position camera to look at "Your Desk"
camera.position.set(2, 4, 6); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
// Enable proper lighting calculation
renderer.useLegacyLights = false; 
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// --- CONTROLS (RESTRICTED) ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0); 
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.1; // Don't go below floor
// RESTRICTION: Keep user inside the office
controls.minDistance = 2;  // Can't zoom inside the monitor
controls.maxDistance = 15; // Can't zoom out through the walls

// --- BUILD WORLD ---
const office = new OfficeBuilder(scene);
office.createFloor();
office.createWallsAndWindows(); // Updated function for Left + Back windows
office.createCeilingLights();   // New bright tube lights
office.createWorkstations();    // Updated layout (3x5 and 4x6)

const city = new CityBuilder(scene);
city.createCity();
city.createMetroSystem();

// --- LIGHTING (BRIGHTER) ---
// 1. General brightness (Ambience)
const ambient = new THREE.AmbientLight(0xffffff, 0.7); 
scene.add(ambient);

// 2. Sunlight from outside (Evening Sun)
const sunLight = new THREE.DirectionalLight(0xffaa88, 1.5);
sunLight.position.set(-50, 20, -50);
sunLight.castShadow = true;
scene.add(sunLight);

// --- INTERACTION LOGIC ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

window.addEventListener('click', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(office.interactables);

    if (intersects.length > 0) {
        const overlay = document.getElementById('screen-overlay');
        const title = document.getElementById('overlay-title');
        const text = document.getElementById('overlay-text');

        overlay.classList.remove('hidden');
        title.innerText = "System Access Granted";
        text.innerHTML = `
            <h3>Rakesh | Engineer</h3>
            <p><strong>Project:</strong> Portfolio V1</p>
            <p><strong>Status:</strong> Building 3D Environments</p>
            <hr/>
            <p>Click 'Close System' to return to view.</p>
        `;
    }
});

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    city.updateMetro(); 
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
