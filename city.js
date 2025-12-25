import * as THREE from 'three';

export class TrafficSystem {
    constructor(scene) { this.scene = scene; this.cars = []; this.speed = 15.0; this.createLane(-60, 0xffffff, 1); this.createLane(-70, 0xff0000, -1); }
    createLane(zPos, color, direction) {
        const carGeo = new THREE.BoxGeometry(2, 0.5, 0.5); const carMat = new THREE.MeshBasicMaterial({ color: color }); 
        for(let i=0; i<15; i++) {
            const car = new THREE.Mesh(carGeo, carMat);
            const xStart = (Math.random() * 400) - 200; const yStart = (Math.random() * 20) - 10;
            car.position.set(xStart, yStart, zPos); this.scene.add(car);
            this.cars.push({ mesh: car, dir: direction, speed: (Math.random() * 0.5 + 0.5) * this.speed });
        }
    }
    update(dt) {
        for(let c of this.cars) {
            c.mesh.position.x += c.speed * c.dir * dt;
            if (c.mesh.position.x > 250) c.mesh.position.x = -250;
            if (c.mesh.position.x < -250) c.mesh.position.x = 250;
        }
    }
}

export class CityBuilder {
    constructor(scene) { this.scene = scene; this.metroGroup = new THREE.Group(); }
    createCity() {
        const cityGroup = new THREE.Group(); const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
        for(let i=0; i<80; i++) {
            const h = Math.random() * 50 + 20; const w = Math.random() * 10 + 5; const col = Math.random() > 0.5 ? 0x8899aa : 0x667788;
            const building = new THREE.Mesh(buildingGeo, new THREE.MeshStandardMaterial({ color: col }));
            building.scale.set(w, h, w); building.position.set((Math.random() - 0.5) * 300, h/2 - 60, -70 - (Math.random() * 100));
            cityGroup.add(building);
        }
        this.scene.add(cityGroup);
    }
    createMetroSystem() {
        const trackZ = -50; const concMat = new THREE.MeshStandardMaterial({ color: 0x999999 }); const railBed = new THREE.Mesh(new THREE.BoxGeometry(500, 2, 8), concMat); railBed.position.set(0, 0, trackZ); this.scene.add(railBed);
        const trainMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        for(let i=0; i<4; i++) {
            const car = new THREE.Mesh(new THREE.BoxGeometry(10, 3.5, 2.5), trainMat);
            car.position.set(i * 11, 2.5, 0); this.metroGroup.add(car);
        }
        this.metroGroup.position.set(100, 0, trackZ); this.scene.add(this.metroGroup);
    }
    updateMetro() { this.metroGroup.position.x -= 0.8; if(this.metroGroup.position.x < -250) this.metroGroup.position.x = 250; }
}