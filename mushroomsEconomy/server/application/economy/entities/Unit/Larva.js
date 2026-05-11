const Unit = require("./Unit")
const CONFIG = require("../../../../config");

const { HP, SPEED, WANDER_RADIUS, TYPE, VISIBILITY } = CONFIG.ECONOMY.LARVA

class Larva extends Unit {
    constructor(options) {
        super({
            ...options,
            type: TYPE,
            visibility: VISIBILITY
        });

        this.homeX = options.homeX || options.x;
        this.homeY = options.homeY || options.y;

        this.hp = HP;
        this.speed = SPEED;
        this.growthScale = 0;
        this.wanderRadius = WANDER_RADIUS;
    }

    get() {
        return {
            ...super.get(),
            hp: this.hp,
            speed: this.speed,
            growthScale: this.growthScale
        };
    }

    update() {
        if (this.path.length > 0) {
            this.calculatePath();
            this.move();
        } else {
            this.goingAroundIncubator();
        }
    }

    goingAroundIncubator() {
        const map = this.map;
        if (!map) return;

        const rows = map.length;
        const cols = map[0]?.length ?? 0;

        if (map[0]?.[0] === null) return;

        let targetX, targetY;
        let attempts = 0;

        do {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(Math.random()) * this.wanderRadius;
            targetX = Math.round(this.homeX + Math.cos(angle) * radius);
            targetY = Math.round(this.homeY + Math.sin(angle) * radius);
            attempts++;
        } while (
            attempts < 10 && (
                targetX < 0 || targetX >= cols ||
                targetY < 0 || targetY >= rows ||
                map[targetY][targetX] !== 0
            )
        );

        if (attempts >= 10) return;

        this.setTarget(targetX, targetY);
        this.calculatePath();
    }
}

module.exports = Larva;