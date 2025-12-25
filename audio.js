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

        // --- IDLE ENGINE (Procedural Rumble) ---
        this.osc = this.ctx.createOscillator();
        this.osc.type = 'sawtooth';
        this.osc.frequency.value = 40; 
        
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 120;

        this.osc.connect(this.filter);
        this.filter.connect(this.masterGain);
        
        // --- START SOUND (MP3) ---
        // Ensure you have 'car-engine-roaring.mp3' in your folder!
        this.startSound = new Audio('./car-engine-roaring.mp3');
        this.startSound.volume = 0.5; // Adjust volume if needed
        
        this.isStarted = false;
    }

    init() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        // Only start the procedural idle loop if it hasn't started yet
        if (!this.isStarted) { 
            this.osc.start(); 
            this.isStarted = true; 
        }
    }

  playStartSound() {
        this.init();
        
        // --- FIX: Record the start time so the update loop knows when to take over ---
        this.startTime = this.ctx.currentTime; 

        // Play the MP3
        this.startSound.currentTime = 0;
        this.startSound.play().catch(e => console.warn("Audio play failed:", e));

        const t = this.ctx.currentTime;
        
        // Start silent (idle engine)
        this.masterGain.gain.setValueAtTime(0, t);
        
        // Wait 1.5s, then fade in the idle rumble over 1 second
        this.masterGain.gain.linearRampToValueAtTime(0.02, t + 2.5); 
    }

   // Update signature to match main.js: update(speed, steering, isEngineActive)
    update(speed, steering, isEngineActive = true) {
        if (!this.isStarted) return;
        
        const s = Math.abs(speed);
        const t = this.ctx.currentTime;

        // 1. PITCH (Restored your exact original logic)
        // Responsive pitch change (0.1s time constant)
        const targetFreq = 40 + (s * 10);
        this.osc.frequency.setTargetAtTime(targetFreq, t, 0.1);
        this.filter.frequency.setTargetAtTime(120 + (s * 50), t, 0.1);

        // 2. VOLUME LOGIC
        // Base volume math from your original code
        let targetVol = 0.02 + Math.min(s * 0.03, 0.3); 
        
        // --- AUTO-STOP OVERRIDE ---
        if (!isEngineActive) {
            targetVol = 0; 
        }

        // 3. APPLY VOLUME (Restored to 0.1 for "Snappy" response)
        // We check startTime to ensure we don't kill the startup roar
        if (this.startTime && t > this.startTime + 2.5) {
             // Reverted from 0.2 back to 0.1 so it reacts instantly to speed
             this.masterGain.gain.setTargetAtTime(targetVol, t, 0.1);
        }
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