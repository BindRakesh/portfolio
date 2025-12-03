import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OfficeBuilder, CityBuilder } from './world.js';

// Setup Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205); // Deep night
scene.fog = new THREE.FogExp2(0x020205, 0.015);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
// Position camera to look at "My Desk" (approx Row 2, Col 5)
// Based on OfficeBuilder logic: x ≈ 2.5, z ≈ 2
camera.position.set(5, 6, 8); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(2.5, 1, 2); // Look at my desk
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.1; // Don't go below floor

// --- BUILD WORLD ---
const office = new OfficeBuilder(scene);
office.createFloor();
office.createWorkstations(); // Builds 50 desks

const city = new CityBuilder(scene);
city.createCity();
city.createMetroSystem();

// --- LIGHTING ---
const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

// Office Ceiling Lights (Grid)
const ceilingLight = new THREE.PointLight(0xffffff, 0.5);
ceilingLight.position.set(0, 7, 0);
scene.add(ceilingLight);

// --- INTERACTION LOGIC ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

window.addEventListener('click', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    
    // We only check against the "Interactive" objects list from OfficeBuilder
    const intersects = raycaster.intersectObjects(office.interactables);

    if (intersects.length > 0) {
        // Show HTML Overlay
        const overlay = document.getElementById('screen-overlay');
        const title = document.getElementById('overlay-title');
        const text = document.getElementById('overlay-text');

        overlay.classList.remove('hidden');
        title.innerText = "Rakesh's Workstation";
        text.innerHTML = `
            <h3>Full Stack Developer</h3>
            <p>Welcome to my desk. Here is what I work on:</p>
            <ul>
                <li>Scalable Web Architectures</li>
                <li>3D Interactive Experiences</li>
                <li>Backend Optimization</li>
            </ul>
        `;
    }
});

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    
    city.updateMetro(); // Move the train
    controls.update();
    renderer.render(scene, camera);
}

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
