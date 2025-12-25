import * as CANNON from 'cannon-es';

export class PhysicsWorld {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); 
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.allowSleep = true; 

        const groundMat = new CANNON.Material();
        const carMat = new CANNON.Material();
        const boxMat = new CANNON.Material();
        
        // Car vs Ground (No friction needed for Arcade physics)
const carGroundContact = new CANNON.ContactMaterial(groundMat, carMat, { 
            friction: 0.0, 
            restitution: 0.0 
        });
        // Box vs Ground (High friction = stable stack)
        const boxGroundContact = new CANNON.ContactMaterial(groundMat, boxMat, { friction: 0.8, restitution: 0.0 });

        // Car vs Box (ZERO friction = No sticking)
        const carBoxContact = new CANNON.ContactMaterial(carMat, boxMat, {
            friction: 0.5, // SLIPPERY
            restitution: 0.2 // BOUNCY
        });

        // Box vs Box
        const boxBoxContact = new CANNON.ContactMaterial(boxMat, boxMat, { friction: 0.5, restitution: 0.1 });
        
        this.world.addContactMaterial(carGroundContact);
        this.world.addContactMaterial(boxGroundContact);
        this.world.addContactMaterial(carBoxContact);
        this.world.addContactMaterial(boxBoxContact);

        this.groundMat = groundMat;
        this.carMat = carMat;
        this.boxMat = boxMat;
    }
    update(dt) { 
        this.world.step(1/60, dt, 3); 
    }
}