const EasyStar = require('easystarjs');
const BaseManager = require("../BaseManager");
const Mushroom = require("./Mushroom");
const Unit = require("./Unit");

class GameManager extends BaseManager {
    constructor(options) {
        const { mediator, db, answer, io } = options;
        super({ mediator, db, io });

        this.easystar = new EasyStar.js();
        this.units = new Map();
        this.mushrooms = [];
        this.answer = answer;

        this.nextMushroomId = 1;

        this.matrix = [];
    }

    setMatrix(newMatrix) {
        if (!Array.isArray(newMatrix)) {
            return this.answer.bad(14);
        }

        console.log("Old matrix: ", this.matrix);

        this.matrix = newMatrix;

        console.log("New matrix: ", newMatrix);

        return this.answer.good(newMatrix);
    }

    getAllUnits() {
        return this.answer.good(this.units);
    }

    createUnit(unitData) {
        const unit = new Unit(this.db, this.easystar);

        unit.init({
            id: unitData.id, 
            x: unitData.x, 
            y: unitData.y
        });

        this.units.set(unitData.id, unit);

        return this.answer.good(unit);
    }

    updateUnit(id, unitData) {
        const numberId = parseInt(id);

        if (!this.units.has(numberId)) {
            return this.answer.bad(14);
        }

        const unit = this.units.get(numberId);
        
        unit.init({
            id: numberId, 
            x: unitData.x, 
            y: unitData.y
        });

        return this.answer.good(unit);
    }

    deleteUnit(id) {
        const numberId = parseInt(id);

        if (!this.units.has(numberId)) {
            return this.answer.bad(14);
        }

        this.units.delete(numberId);

        return this.answer.good(`Unit deleted: ${numberId}`);
    }

    getAllMushrooms() {
        return this.answer.good(this.mushrooms);
    }

    createMushroom(mushroomData) {
        const mushroom = new Mushroom(this.db);
        mushroom.init(mushroomData);

        const mushroomId = this.nextMushroomId++;
        this.mushrooms.push(mushroom);

        return this.answer.good(mushroom);
    }

    updateMushroom(id, mushroomData) {
        const numberId = parseInt(id);

        if (!this.mushrooms[numberId]) {
            return this.answer.bad(12);
        }

        const mushroom = this.mushrooms[numberId];
        mushroom.init(mushroomData);

        return this.answer.good(mushroom);
    }

    deleteMushroom(id) {
        const numberId = parseInt(id);

        if (!this.mushrooms[numberId]) {
            return this.answer.bad(12);
        }

        this.mushrooms.splice(numberId, 1);

        return this.answer.good(`Mushroom deleted: ${numberId}`);
    }
}

module.exports = GameManager;