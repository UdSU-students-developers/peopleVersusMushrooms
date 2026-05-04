const Unit = require("./Unit")
class Larva extends Unit {
    constructor(options) {
        super(options);

        this.homeX = options.homeX || options.x;
        this.homeY = options.homeY || options.y;

        this.options = options.options;

        this.hp = this.options.hp;
        this.speed = this.options.speed;
        this.growthScale = 0;
        this.wanderRadius = this.options.warder_radius;


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