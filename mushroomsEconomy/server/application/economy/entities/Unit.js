import CONFIG from "../../../config";

class Unit {
    constructor({ x, y, guid, map, easystar }) {
        this.x = x;
        this.y = y;
        this.guid = guid;
        this.easystar = easystar;
        this.map = map;
        //Переменные которые обновятся в дочерних классах
        this.hp = 1;
        this.speed = 1;

    }

    get() {
        return {
            x: this.x,
            y: this.y,
            hp: this.hp,
            guid: this.guid
        }
    }

    findPath(targetX, targetY) {
        let attempts = 0;
        const maxAttempts = CONFIG.ECONOMY.MAX_ATTEMPTS;

        return new Promise((resolve) => {
            const attemptFindPath = () => {
                attempts++;

                this.easystar.findPath(this.x, this.y, targetX, targetY, (path) => {
                    if (path) {
                        resolve(path);
                    } else if (attempts < maxAttempts) {
                        setTimeout(() => {
                            attemptFindPath();
                        }, 1000);
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
        const path = await this.findPath(targetX, targetY);

        if (!path) return false;

        for (const point of path.slice(1)) {
            this.x = point.x;
            this.y = point.y;
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return true;
    }
}

module.exports = Unit;