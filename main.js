import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OfficeBuilder, CityBuilder, RCCar } from './world.js';

// --- SCENE ---
const scene = new THREE.Scene();
// 1. SKY BLUE (Daylight)
scene.background = new THREE.Color(0x87CEEB); 
scene.fog = new THREE.FogExp2(0x87CEEB, 0.008); 

// --- CAMERA ---
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);

// 2. MY DESK VIEW 
// Desk is roughly at (-15, 0, -15). We position camera slightly behind/above it.
camera.position.set(-15, 1.6, -11); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- CONTROLS ---
const controls = new OrbitControls(camera, renderer.domElement);
// Target the desk
controls.target.set(-15, 1.4, -15);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.1;
controls.minDistance = 0.5;
controls.maxDistance = 50;

// --- BUILD WORLD ---
const office = new OfficeBuilder(scene);
office.createFloor();
office.createWallsAndWindows();
office.createCeilingDetails();
office.createLayout();

const city = new CityBuilder(scene);
city.createCity();
city.createMetroSystem();

const car = new RCCar(scene);

// --- LIGHTING ---
const ambient = new THREE.AmbientLight(0xffffff, 1.0); // Bright day ambient
scene.add(ambient);

// Sunlight
const sunLight = new THREE.DirectionalLight(0xffffee, 2.5);
sunLight.position.set(-50, 80, -20);
sunLight.castShadow = true;
scene.add(sunLight);

// Bounce light
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
scene.add(hemiLight);

// --- INPUT LOGIC ---
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Interaction
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

window.addEventListener('click', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(office.interactables);

    if (intersects.length > 0) {
        const overlay = document.getElementById('screen-overlay');
        if(overlay) {
            overlay.classList.remove('hidden');
            const title = document.getElementById('overlay-title');
            const text = document.getElementById('overlay-text');
            if(title) title.innerText = "Workstation Access";
            if(text) text.innerHTML = `
                <h3>Rakesh | Engineer</h3>
                <p><strong>System Status:</strong> Online</p>
                <p>Welcome to my desk. Use W/A/S/D to drive the car!</p>
            `;
        }
    }
});

// --- ANIMATION ---
function animate() {
    requestAnimationFrame(animate);
    
    city.updateMetro();
    car.update(keys);
    controls.update();

    // Camera follow logic for Car
    if(Math.abs(car.speed) > 0.01) {
        controls.enabled = false;
        const relativeOffset = new THREE.Vector3(0, 3, 6);
        const cameraOffset = relativeOffset.applyMatrix4(car.mesh.matrixWorld);
        camera.position.lerp(cameraOffset, 0.1);
        camera.lookAt(car.mesh.position);
    } else {
        controls.enabled = true;
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
