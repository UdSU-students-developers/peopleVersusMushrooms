const BaseManager = require("../BaseManager");
const Mushroom = require("./Mushroom");
const Unit = require("./Unit");

class GameManager extends BaseManager {
    constructor(mediator, db, answer, easystar) {
        super(mediator, db);

        this.units = new Map();
        this.mushrooms = new Map();
        this.answer = answer;
        this.easystar = easystar;

        this.nextUnitId = 1;
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
        const unitsList = [];

        this.units.forEach((unit, id) => {
            unitsList.push({
                id: id,
                x: unit.x,
                y: unit.y
            });
        });

        return this.answer.good(unitsList);
    }

    createUnit(unitData) {
        const unit = new Unit(this.db, this.easystar);
        const unitId = this.nextUnitId++;

        unit.init({
            id: unitId, 
            x: unitData.x, 
            y: unitData.y
        });

        this.units.set(unitId, unit);

        return this.answer.good({
            id: unitId,
            x: unit.x,
            y: unit.y
        });
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

        return this.answer.good({
            id: numberId,
            x: unit.x,
            y: unit.y
        });
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
        const mushroomsList = [];

        this.mushrooms.forEach((mushroom, id) => {
            mushroomsList.push({
                id: id,
                x: mushroom.x,
                y: mushroom.y
            });
        });

        return this.answer.good(mushroomsList);
    }

    createMushroom(mushroomData) {
        const mushroom = new Mushroom(this.db);
        mushroom.init(mushroomData);

        const mushroomId = this.nextMushroomId++;
        this.mushrooms.set(mushroomId, mushroom);

        return this.answer.good({
            id: mushroomId,
            x: mushroom.x,
            y: mushroom.y
        });
    }

    updateMushroom(id, mushroomData) {
        const numberId = parseInt(id);

        if (!this.mushrooms.has(numberId)) {
            return this.answer.bad(12);
        }

        const mushroom = this.mushrooms.get(numberId);
        mushroom.init(mushroomData);

        return this.answer.good({
            id: numberId,
            x: mushroom.x,
            y: mushroom.y
        });
    }

    deleteMushroom(id) {
        const numberId = parseInt(id);

        if (!this.mushrooms.has(numberId)) {
            return this.answer.bad(12);
        }

        this.mushrooms.delete(numberId);

        return this.answer.good(`Mushroom deleted: ${numberId}`);
    }
}

module.exports = GameManager;
