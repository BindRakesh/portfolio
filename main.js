import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OfficeBuilder, CityBuilder } from './world.js';

// --- SCENE & ATMOSPHERE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222233); // Brighter Evening Blue
scene.fog = new THREE.FogExp2(0x222233, 0.01); // Less dense fog for clarity

// --- CAMERA ---
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
// Position camera to look at the new layout
camera.position.set(-5, 6, 8); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.useLegacyLights = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2; // Increase overall brightness
document.body.appendChild(renderer.domElement);

// --- CONTROLS ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-5, 1, 0); // Focus on the User's desk area
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.1;
controls.minDistance = 2;
controls.maxDistance = 20;

// --- BUILD WORLD ---
const office = new OfficeBuilder(scene);
office.createFloor();
office.createWallsAndWindows(); 
office.createCeilingDetails(); // NEW: Ducts and Pipes
office.createLayout();         // NEW: Split layout with Meeting Area

const city = new CityBuilder(scene);
city.createCity();
city.createMetroSystem();

// --- LIGHTING (BRIGHTER) ---
// 1. Hemisphere Light (Simulates light bouncing off white walls)
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

// 2. Directional Sun (Evening warmth coming from window)
const sunLight = new THREE.DirectionalLight(0xffccaa, 1.5);
sunLight.position.set(-50, 20, -20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048; // Sharp shadows
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

// 3. General Ambient (Base brightness)
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

// --- INTERACTION ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

window.addEventListener('click', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(office.interactables);

    if (intersects.length > 0) {
        document.getElementById('screen-overlay').classList.remove('hidden');
        document.getElementById('overlay-title').innerText = "Rakesh's System";
        document.getElementById('overlay-text').innerHTML = `
            <h3>Full Stack Engineer</h3>
            <p><strong>Status:</strong> Coding 3D Worlds.</p>
            <p><strong>Skills:</strong> React, Three.js, Node.js</p>
        `;
    }
});

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
