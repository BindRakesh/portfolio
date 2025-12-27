import * as THREE from 'three';

export class AudioSystem {
    constructor(camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        this.ctx = this.listener.context;
        
        // --- MASTER VOLUME ---
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0; 
        this.masterGain.connect(this.ctx.destination);

        // --- 1. ENGINE (Procedural Rumble) ---
        // Keeps your existing Sawtooth logic
        this.osc = this.ctx.createOscillator();
        this.osc.type = 'sawtooth';
        this.osc.frequency.value = 40; 
        
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 120;

        this.osc.connect(this.filter);
        this.filter.connect(this.masterGain);
        
        // --- 2. START SOUND (MP3) ---
        this.startSound = new Audio('./car-engine-roaring.mp3');
        this.startSound.volume = 0.5; 
        
        // --- 3. DRIFT SCREECH (FM Synthesis) ---
        // This creates a complex, "tearing" sound instead of a simple beep
        
        // A. The Carrier (The main "Squeal" pitch)
        this.driftCarrier = this.ctx.createOscillator();
        this.driftCarrier.type = 'triangle'; // Sine is smooth, good base for squeals
        this.driftCarrier.frequency.value = 800; // High pitch

        // B. The Modulator (The "Roughness")
        // This shakes the carrier frequency fast to simulate friction
        this.driftMod = this.ctx.createOscillator();
        this.driftMod.type = 'sawtooth'; // Rough shape
        this.driftMod.frequency.value = 60; // Rumble speed

        // C. Modulation Depth (How intense the friction is)
        this.modGain = this.ctx.createGain();
        this.modGain.gain.value = 420; // High value = harsher sound

        // Connect: Modulator -> Gain -> Carrier Frequency
        this.driftMod.connect(this.modGain);
        this.modGain.connect(this.driftCarrier.frequency);

        // D. Output Volume
        this.driftGain = this.ctx.createGain();
        this.driftGain.gain.value = 0;

        this.driftCarrier.connect(this.driftGain);
        this.driftGain.connect(this.masterGain);

        this.isStarted = false;
    }

    init() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        if (!this.isStarted) { 
            this.osc.start(); 
            
            // Start FM Synth
            this.driftCarrier.start();
            this.driftMod.start();
            
            this.isStarted = true; 
        }
    }

    playStartSound() {
        this.init();
        this.startTime = this.ctx.currentTime; 

        this.startSound.currentTime = 0;
        this.startSound.play().catch(e => console.warn("Audio play failed:", e));

        const t = this.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(0, t);
        this.masterGain.gain.linearRampToValueAtTime(0.02, t + 2.5); 
    }

    update(speed, steering, isEngineActive = true, isDrifting = false) {
        if (!this.isStarted) return;
        
        const s = Math.abs(speed);
        const t = this.ctx.currentTime;

        // --- 1. ENGINE UPDATE ---
        const targetFreq = 40 + (s * 10);
        this.osc.frequency.setTargetAtTime(targetFreq, t, 0.1);
        this.filter.frequency.setTargetAtTime(120 + (s * 50), t, 0.1);

        let targetVol = 0.02 + Math.min(s * 0.03, 0.3); 
        if (!isEngineActive) targetVol = 0; 

        if (this.startTime && t > this.startTime + 2.5) {
             this.masterGain.gain.setTargetAtTime(targetVol, t, 0.1);
        }

        // --- 3. DRIFT UPDATE (FM Tuning) ---
        
        // Volume: Only audible if drifting fast
        const driftVol = (isDrifting && s > 5) ? Math.min(0.2, s * 0.02) : 0;
        this.driftGain.gain.setTargetAtTime(driftVol, t, 0.1);
        
        // Pitch: Squeal gets higher and more "desperate" with speed
        // 800Hz base + speed adjustment
        this.driftCarrier.frequency.setTargetAtTime(800 + (s * 40), t, 0.1);
        
        // Roughness: As you go faster, the friction vibration speeds up
        this.driftMod.frequency.setTargetAtTime(60 + (s * 5), t, 0.1);
        
        // Intensity: Higher speed = harsher tone
        this.modGain.gain.setTargetAtTime(300 + (s * 50), t, 0.1);
    }

    playImpact(velocity) {
        if (!this.isStarted || velocity < 2.0) return; 
        const t = this.ctx.currentTime;
        const vol = Math.min(velocity / 20, 0.8); 

        // Noise Burst
        const bufferSize = this.ctx.sampleRate * 0.1; 
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * vol;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 800;
        
        noise.connect(noiseFilter);
        noiseFilter.connect(this.masterGain); 
        noise.start(t);

        // Low Thud
        const thud = this.ctx.createOscillator();
        thud.type = 'triangle';
        thud.frequency.setValueAtTime(100, t);
        thud.frequency.exponentialRampToValueAtTime(20, t + 0.2); 
        
        const thudGain = this.ctx.createGain();
        thudGain.gain.setValueAtTime(vol, t);
        thudGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        thud.connect(thudGain);
        thudGain.connect(this.masterGain);
        thud.start(t);
        thud.stop(t + 0.2);
    }
}
