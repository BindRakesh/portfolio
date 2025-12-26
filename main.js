import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import GUI from 'lil-gui';

// --- MODULE IMPORTS ---
import { PhysicsWorld } from './physics.js';
import { AudioSystem } from './audio.js';
import { RCCar } from './car.js';
import { OfficeBuilder } from './office.js';
import { CityBuilder, TrafficSystem } from './city.js';
import { ZoneSystem } from './zones.js';
import { PropSystem } from './props.js';
import { ParticleSystem } from './particles.js';
import { SkySystem } from './world.js';

const resetUI = document.getElementById('reset-zone-ui');
const resetBtn = document.getElementById('btn-reset-boxes'); // <--- Define it here
let inResetZone = false;

// Old Zone (Far away)
// const RESET_ZONE = { xMin: 5, xMax: 15, zMin: 5, zMax: 15 }; 

// New Zone (Right where car spawns at start)
const RESET_ZONE = { xMin: -10, xMax: 10, zMin: 20, zMax: 30 };

let activeZone = null; // <--- Global variable to track where the car is

// --- GAME STATE ---
let gameStarted = false;
let lastZone = null;     // NEW: Tracks the previous frame's zone
let uiBlocked = false;
let idleTimer = 0;

// --- LOADING MANAGER ---
const manager = new THREE.LoadingManager();
const speedEl = document.getElementById('speed-value');


if(resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (props && props.reset) props.reset();
        resetBtn.blur(); // Remove focus so 'Enter' doesn't trigger it again
    });
}

manager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const el = document.getElementById('loading-status');
    if (el) {
        const percent = Math.floor((itemsLoaded / itemsTotal) * 100);
        el.innerText = percent + "%";
    }
};

manager.onLoad = () => {
    console.log("All assets loaded.");
    const loader = document.getElementById('loader-container');
    if (loader) {
        loader.classList.add('fade-out');
        // Remove from DOM after animation
        setTimeout(() => { 
            loader.style.display = 'none'; 
        }, 1000);
    }
    
    // Reveal Start Screen
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.classList.remove('hidden');
    }
};

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 
scene.fog = new THREE.FogExp2(0x87CEEB, 0.005); 



const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
// Start high up for the intro view
camera.position.set(0, 60, 0); 
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5; 
document.body.appendChild(renderer.domElement);

// --- POST PROCESSING (BLOOM) ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 
    1.5, 0.4, 0.85
);
bloomPass.threshold = 1.8;
bloomPass.strength = 0.6;
bloomPass.radius = 0.2;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// --- ORBIT CONTROLS (Mainly for debug, overridden by game loop) ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.1;
controls.minDistance = 0.5;
controls.maxDistance = 50;

// --- INITIALIZE WORLD ---
const physics = new PhysicsWorld();
const audio = new AudioSystem(camera); 

// Pass manager and audio to builders
const office = new OfficeBuilder(scene, physics, manager, audio); 
const city = new CityBuilder(scene); 
city.createCity(); 
city.createMetroSystem();

const traffic = new TrafficSystem(scene);
const zones = new ZoneSystem(scene); 
const sky = new SkySystem(scene);
const car = new RCCar(scene, physics); 
const props = new PropSystem(scene, physics, audio);
const particles = new ParticleSystem(scene);

// --- LIGHTING ---
const ambient = new THREE.AmbientLight(0xffffff, 1.5); 
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff5e6, 2.5); 
sun.position.set(-30, 50, -30); 
sun.castShadow = true; 
sun.shadow.mapSize.width = 2048; 
sun.shadow.mapSize.height = 2048; 
scene.add(sun);

const hemi = new THREE.HemisphereLight(0xeff6ff, 0x111111, 1.0); 
scene.add(hemi);

// --- START GAME LOGIC ---
function startGame() {
    if (gameStarted) return;

    const screen = document.getElementById('start-screen');
    if (screen) screen.classList.add('hidden');
    
    const uiLayer = document.getElementById('ui-layer');
    if (uiLayer) uiLayer.style.display = 'block';
    
    // Init Audio (Must be done after user interaction)
    audio.init(); 
    audio.playStartSound();
    gameStarted = true;
}

// Bind Button
const startBtn = document.getElementById('start-btn');
if (startBtn) {
    startBtn.addEventListener('click', startGame);
}

// --- INPUT HANDLING ---
const keys = { w: false, a: false, s: false, d: false, space: false };

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
    if (e.key === 'ArrowUp') keys.w = true;
    if (e.key === 'ArrowDown') keys.s = true;
    if (e.key === 'ArrowLeft') keys.a = true;
    if (e.key === 'ArrowRight') keys.d = true;
    if(e.code === 'Space') keys.space = true;
    if (e.key === 'Escape') {
        uiBlocked = true; // Block popups
        updateUI(null);   // Close immediately
    }

    // Reset Car Position
    if (e.key.toLowerCase() === 'r') {
        car.body.position.set(0, 2, 25); 
        car.body.velocity.set(0, 0, 0); 
        car.body.angularVelocity.set(0, 0, 0); 
        car.body.quaternion.set(0, 0, 0, 1);
    }

    if (e.key === 'Enter' && inResetZone) {
        if (props && props.reset) props.reset();
    }

    if (e.key === 'Enter' && activeZone === 'reset') {
        if (props && props.reset) {
            props.reset();
            // Optional: Blur focus to prevent double-firing if button is selected
            if (document.activeElement) document.activeElement.blur();
        }
    }

    // Start on Enter
    if (e.key === 'Enter') {
        startGame();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
    if (e.key === 'ArrowUp') keys.w = false;
    if (e.key === 'ArrowDown') keys.s = false;
    if (e.key === 'ArrowLeft') keys.a = false;
    if (e.key === 'ArrowRight') keys.d = false;
    if(e.code === 'Space') keys.space = false; // <--- NEW
});

// --- MOBILE JOYSTICK ---
if (window.nipplejs) {
    const joystickManager = nipplejs.create({
        zone: document.getElementById('joystick-zone'),
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white'
    });

    joystickManager.on('move', (evt, data) => {
        // Reset keys
        keys.w = keys.s = keys.a = keys.d = false;
        
        if (data.force > 0.1) {
            const angle = data.angle.degree;
            // Forward
            if (angle > 45 && angle < 135) keys.w = true;
            // Backward
            else if (angle > 225 && angle < 315) keys.s = true;
            // Right
            if (angle < 90 || angle > 270) keys.d = true; 
            // Left
            if (angle > 90 && angle < 270) keys.a = true;
        }
    });

    joystickManager.on('end', () => {
        keys.w = keys.s = keys.a = keys.d = false;
    });
}

// --- UI UPDATE LOGIC ---
const ui = document.getElementById('screen-overlay');
const uiTitle = document.getElementById('overlay-title');
const uiText = document.getElementById('overlay-text');

function updateUI(activeZone) {
    if (activeZone) {
        ui.classList.add('visible');
        
        let title = ""; 
        let content = "";
        
        // 1. Existing Zones
        if (activeZone === 'about') {
            title = "About Me";
            content = `
                <div style="display:flex; gap:20px; align-items:center;">
                    <div style="flex:1;">
                        <p style="font-size:1.1rem; color:#fff;">AEM Developer & Tech Enthusiast.</p>
                        <p>Currently working as an <strong>Adobe Experience Manager (AEM) Developer</strong>.</p>
                        <p style="margin-top: 10px;">I am passionate about <strong>learning new technologies</strong> and constantly expanding my skills to build better digital experiences.</p>
                    </div>
                </div>
            `;
        } 
        else if (activeZone === 'projects') {
            title = "Selected Works";
            content = `
                <div class="project-grid">
                    <div class="project-card" onclick="window.open('https://github.com')">
                        <div class="card-title">🚗 3D Portfolio</div>
                        <div class="card-desc">An interactive driving experience.</div>
                        <div class="card-tags"><span class="tag">WebGL</span></div>
                    </div>
                   <div class="project-card" onclick="window.open('https://urj-actions.netlify.app/', '_blank')">
                        <div class="card-title">🔗 Redirect Checker</div>
                        <div class="card-desc">Analyze URL hops and status codes. id:basic_user pass:password123</div>
                        <div class="card-tags"><span class="tag">Tool</span><span class="tag">Netlify</span></div>
                    </div>
                    <div class="project-card" onclick="window.open('https://rksxo-portfolio.netlify.app/')">
                        <div class="card-title">💼 Portfolio site</div>
                        <div class="card-desc">Portfolio website using html,js, css.</div>
                        <div class="card-tags"><span class="tag">html</span><span class="tag">js</span><span class="tag">css</span></div>
                    </div>
                </div>
            `;
        } 
        else if (activeZone === 'contact') {
            title = "Contact";
            content = `<div style="display:flex; flex-direction:column; gap:15px;">
                    
                    <div class="contact-row clickable" onclick="window.open('https://github.com/BindRakesh/', '_blank')" style="cursor:pointer; display:flex; align-items:center; gap:15px; padding:10px; background:rgba(255,255,255,0.05); border-radius:8px;">
                        <div style="font-size:2rem;">🐙</div>
                        <div>
                            <div style="font-size:0.8rem; color:#64748b; font-weight:bold;">GITHUB</div>
                            <div style="color:#fff;">@BindRakesh</div>
                        </div>
                    </div>

                    <div class="contact-row clickable" onclick="window.open('https://www.linkedin.com/in/rakesh-bind/', '_blank')" style="cursor:pointer; display:flex; align-items:center; gap:15px; padding:10px; background:rgba(255,255,255,0.05); border-radius:8px;">
                        <div style="font-size:2rem;">💼</div>
                        <div>
                            <div style="font-size:0.8rem; color:#64748b; font-weight:bold;">LINKEDIN</div>
                            <div style="color:#fff;">/in/rakesh-bind</div>
                        </div>
                    </div>

                    <div class="contact-row clickable" onclick="window.open('https://twitter.com/bindrks', '_blank')" style="cursor:pointer; display:flex; align-items:center; gap:15px; padding:10px; background:rgba(255,255,255,0.05); border-radius:8px;">
                        <div style="font-size:2rem;">🐦</div>
                        <div>
                            <div style="font-size:0.8rem; color:#64748b; font-weight:bold;">TWITTER</div>
                            <div style="color:#fff;">@bindrks</div>
                        </div>
                    </div>

                </div>
            `;
        }
        // 2. --- NEW RESET ZONE ---
        else if (activeZone === 'reset') {
            title = "Warehouse Control";
            content = `
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">📦</div>
                    <p style="margin-bottom: 15px;">Physics objects cluttering the floor?</p>
                    <p style="color: #aaa; font-size: 0.9rem;">Press <strong style="color:white">ENTER</strong> or click below</p>
                    
                    <button id="ui-reset-btn" style="
                        background: #00ffcc; 
                        color: #000; 
                        border: none; 
                        padding: 10px 20px; 
                        font-weight: bold; 
                        cursor: pointer; 
                        margin-top: 15px;
                        border-radius: 4px;
                    ">RESET BOXES</button>
                </div>
            `;
        }

        // 3. Render and Attach Listeners
        if (uiTitle.innerText !== title) {
            uiTitle.innerText = title;
            uiText.innerHTML = content;

            // IMPORTANT: Attach the click listener dynamically
            if (activeZone === 'reset') {
                setTimeout(() => {
                    const btn = document.getElementById('ui-reset-btn');
                    if (btn) btn.onclick = () => {
                        if (props && props.reset) props.reset();
                    };
                }, 0);
            }
        }
    } else {
        ui.classList.remove('visible');
    }
}

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();
const targetCamPos = new THREE.Vector3();
const targetCamLook = new THREE.Vector3();

// Mouse parallax variables
let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) / window.innerWidth;
    mouseY = (e.clientY - window.innerHeight / 2) / window.innerHeight;
});

function animate() {
    requestAnimationFrame(animate);
    
    // 1. Time Management
    let dt = clock.getDelta();
    dt = Math.min(dt, 0.1); // Cap delta to prevent physics explosions on tab switch
    
    // 2. Physics & World Updates
    physics.update(dt);
    city.updateMetro();
    traffic.update(dt);
    props.update();

    if(sky) sky.update();
    
    // 3. Particles (Check existence first)
    if (particles && particles.update) {
        particles.update();
    }
    
   // 4. Car & Audio
car.update(keys);

// --- NEW ENGINE IDLE LOGIC ---
// Check if car is effectively stopped AND no keys are being pressed
if (car.speed < 0.5 && !keys.w && !keys.s && !keys.space && !keys.ArrowUp && !keys.ArrowDown) {
    idleTimer += dt; // Count up seconds
} else {
    idleTimer = 0;   // Reset timer if moving or inputs detected
}

// Engine is "Active" only if we haven't idled for 3+ seconds
const isEngineActive = idleTimer < 3.0;

// Pass this new status to audio
audio.update(car.speed, car.steering, isEngineActive);

    // --- NEW: UPDATE SPEEDOMETER ---
    if(speedEl) {
        // car.speed is roughly m/s. 
        // Multiply by 12 to make it look like "Sports Car" speeds (0-150)
        const displaySpeed = Math.floor(car.speed * 12); 
        speedEl.innerText = displaySpeed;
    }
    
    // 5. Office Interactions (Door, Screens)
    if (office && office.update) {
        office.update(car.mesh.position, clock.elapsedTime);
    }

    // 6. UI Logic
    

    if (props && zones) {
        const isMessy = props.isPyramidDisturbed();
        
        // Only show Red Zone if boxes are messy
        zones.setResetZoneVisible(isMessy);
        
        // If boxes suddenly reset (clean), hide the UI immediately
        if (!isMessy && ui.classList.contains('visible') && uiTitle.innerText === "Warehouse Control") {
            updateUI(null); // Force close UI
        }
    }

    // const activeZone = zones.check(car.mesh.position);
    activeZone = zones.check(car.mesh.position);
    const currentZone = zones.check(car.mesh.position);
    // 1. If we moved to a new zone (or left one), reset the block
    if (currentZone !== lastZone) {
        uiBlocked = false;
        lastZone = currentZone;
    }

    // 2. Only set activeZone if user hasn't blocked it
    if (currentZone && !uiBlocked) {
        activeZone = currentZone;
    } else {
        activeZone = null;
    }
    updateUI(activeZone);

    // --- RESET ZONE LOGIC ---
    const cx = car.mesh.position.x;
    const cz = car.mesh.position.z;

    // Check if car is inside the rectangle defined above
    const isInside = (cx >= RESET_ZONE.xMin && cx <= RESET_ZONE.xMax && 
                      cz >= RESET_ZONE.zMin && cz <= RESET_ZONE.zMax);

    if (isInside) {
        if (!inResetZone) {
            resetUI.style.display = 'block'; // Show Prompt
            inResetZone = true;
        }
    } else {
        if (inResetZone) {
            resetUI.style.display = 'none'; // Hide Prompt
            inResetZone = false;
        }
    }

   // 7. Camera Logic
    if (!gameStarted) {
        // IDLE CAM: Slow rotation above roof
        const t = Date.now() * 0.0002;
        camera.position.x = Math.sin(t) * 40;
        camera.position.z = Math.cos(t) * 40;
        camera.lookAt(0, 0, 0);
    } else {
        // GAME CAMS
        let offset;

        switch (cameraState.view) {
            case 'Third Person':
                // Standard chasing camera
                offset = new THREE.Vector3(0, 1.5, 3.5);
                offset.applyMatrix4(car.mesh.matrixWorld);

                // Add subtle mouse sway
                offset.x += mouseX * 2;
                offset.y -= mouseY * 1;

                targetCamPos.copy(offset);
                targetCamLook.copy(car.mesh.position);
                targetCamLook.y += 0.5; 
                
                // Zoom out if reading UI
                if (activeZone) {
                    targetCamPos.y += 4;
                    targetCamPos.z += 4;
                }

                camera.position.lerp(targetCamPos, 5.0 * dt);
                camera.lookAt(targetCamLook);
                break;

            case 'Top Down':
                // High up, looking straight down
                targetCamPos.set(car.mesh.position.x, 40, car.mesh.position.z);
                camera.position.lerp(targetCamPos, 5.0 * dt);
                camera.lookAt(car.mesh.position);
                break;

            case 'Driver':
                // Inside the car hood
                offset = new THREE.Vector3(0, 0.8, 0.2); 
                offset.applyMatrix4(car.mesh.matrixWorld);
                
                camera.position.copy(offset);
                
                // Look far ahead relative to car orientation
                targetCamLook.set(0, 0.5, 20); // Look 20 units forward
                targetCamLook.applyMatrix4(car.mesh.matrixWorld);
                camera.lookAt(targetCamLook);
                break;

            case 'Orbit':
                // Manual control with mouse
                controls.target.copy(car.mesh.position);
                controls.update();
                break;
        }
    }

    // 8. Render
    composer.render();
}

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

const cameraState = {
    view: 'Third Person'
};

const gui = new GUI({ title: '🎥 Camera Settings' });
gui.add(cameraState, 'view', ['Third Person', 'Top Down', 'Driver', 'Orbit'])
   .onChange((value) => {
       // Reset controls when switching modes
       controls.enabled = (value === 'Orbit');
   });


// Start Loop
animate();
