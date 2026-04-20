const Unit = require("../Unit")
const CONFIG = require("../../../../../config");

const { HP, SPEED, WANDER_RADIUS } = CONFIG.ECONOMY.LARVA

class Larva extends Unit {
    constructor(options) {
        super(options);

        this.homeX = options.homeX || options.x;
        this.homeY = options.homeY || options.y;

        this.hp = HP;
        this.speed = SPEED;
        this.growthScale = 0;
        this.wanderRadius = WANDER_RADIUS;
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