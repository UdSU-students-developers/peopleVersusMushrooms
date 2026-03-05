const EasyStar = require('easystarjs');

class Unit {
    constructor(db, easystar) {
        this.db = db;
        this.easystar = easystar;

        this.id = null;
        this.x = 0;
        this.y = 0;
        
        this.target = null;
        this.currentPath = [];
    }

    init({ id, x, y }) {
        this.id = id;
        this.x = x;
        this.y = y;
    }

    async save() {
        if (!this.id) return;
        try {
            await this.db.orm.update(
                'units', 
                ['x', 'y'], 
                [this.x, this.y], 
                { id: this.id }
            );
            console.log(`Юнит ${this.id} сохранён (${this.x}, ${this.y})`);
        } catch (err) {
            console.error('ошибка сохранения юнита:', err);
        }
    }

    goTo(targetX, targetY, matrix) {
        console.log(`юнит ${this.id} двигается (${targetX}, ${targetY})`);
        this.target = { x: targetX, y: targetY };
        this.calculatePath(matrix);
    }

    calculatePath(matrix) {
        if (!this.target) return;

        this.easystar.setGrid(matrix);
        this.easystar.setAcceptableTiles([0]);
        
        this.easystar.findPath(this.x, this.y, this.target.x, this.target.y, (path) => {
            if (path === null) {
                console.log("путь не найден");
                this.currentPath = [];
                return;
            }
            this.currentPath = path;
        });
        
        this.easystar.calculate();
    }

    async makeStep(matrix) {
        if (!this.currentPath || this.currentPath.length <= 1) {
            if (this.target && (this.x !== this.target.x || this.y !== this.target.y)) {
                this.calculatePath(matrix);
            }
            return;
        }

        const nextStep = this.currentPath[1];

        if (matrix[nextStep.y][nextStep.x] !== 0) {
            console.log("путь заблокирован, пересчёт");
            this.calculatePath(matrix);
            return;
        }

        this.x = nextStep.x;
        this.y = nextStep.y;

        await this.save();

        this.currentPath.shift();

        if (this.target) {
            this.calculatePath(matrix);
        }
    }
}

module.exports = Unit;
