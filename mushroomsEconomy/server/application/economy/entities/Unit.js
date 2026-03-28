class Unit {
    constructor({ x, y, guid, map, easystar }) {
        this.x = x;
        this.y = y;
        this.guid = guid;
        this.easystar = easystar;
        this.map = map;           // динамическая карта (обновляется извне)
        this.hp = 1;
        this.speed = 1;
        this.isMoving = false;
    }

    get() {
        return {
            x: this.x,
            y: this.y,
            hp: this.hp,
            guid: this.guid
        };
    }

    findPath(targetX, targetY) {
        let attempts = 0;
        const maxAttempts = CONFIG.ECONOMY.MAX_ATTEMPTS;

        return new Promise((resolve) => {
            const attemptFindPath = () => {
                attempts++;
                if (this.easystar.setGrid) this.easystar.setGrid(this.map);
                this.easystar.findPath(this.x, this.y, targetX, targetY, (path) => {
                    if (path) {
                        resolve(path);
                    } else if (attempts < maxAttempts) {
                        setTimeout(() => attemptFindPath(), 1000);
                    } else {
                        resolve(null);
                    }
                });
                this.easystar.calculate();
            };
            attemptFindPath();
        });
    }

    async moveTo(targetX, targetY) {
        if (this.isMoving) return false;
        this.isMoving = true;

        const stepDelay = 100 / this.speed;

        while (true) {
            if (this.x === targetX && this.y === targetY) break;

            const path = await this.findPath(targetX, targetY);
            if (!path || path.length < 2) break;

            const nextStep = path[1];
            if (this.map[nextStep.y][nextStep.x] !== 0) break;

            this.x = nextStep.x;
            this.y = nextStep.y;

            await new Promise(resolve => setTimeout(resolve, stepDelay));
        }

        this.isMoving = false;
        return true;
    }
}

module.exports = Unit;