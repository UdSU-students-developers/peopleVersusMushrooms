const Unit = require("./Unit")
const CONFIG = require("../../../../config");

class Larva extends Unit {
    constructor(options) {
        super(options);

        this.homeX = options.homeX || options.x;
        this.homeY = options.homeY || options.y;

        this.hp = options.params.hp;
        this.speed = options.params.speed;
        this.growthScale = 0;
        this.wanderRadius = options.params.wander_radius;
    }

    update() {
        if (this.pathRequested) return;

        if (this.isMoving) {
            this.moveOneStep();
        } else {
            this.goingAroundIncubator();
        }
    }

    goingAroundIncubator() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random()) * this.wanderRadius;
        
        const targetX = Math.round(this.homeX + Math.cos(angle) * radius);
        const targetY = Math.round(this.homeY + Math.sin(angle) * radius);

        this.calcPath({ x: targetX, y: targetY });
    }
}

module.exports = Larva;