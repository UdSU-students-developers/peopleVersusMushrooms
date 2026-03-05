const BaseManager = require("../BaseManager");
const Mushroom = require("./Mushroom");
const Unit = require("./Unit");

class GameManager extends BaseManager {
    constructor(mediator, db, answer, easystar) {
        super(mediator, db);

        this.units = [];
        this.mushrooms = [];
        this.answer = answer;
        this.easystar = easystar;

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
            if (unit && unit !== -1) {
                unitsList.push({
                    id: id,
                    x: unit.x,
                    y: unit.y
                });
            }
        });

        return this.answer.good(unitsList);
    }

    createUnit(unitData) {
        const unit = new Unit(this.db, this.easystar);

        unit.init({
            id: unit.id, 
            x: unitData.x, 
            y: unitData.y
        });

        this.units.push(unit);

        return this.answer.good({
            id: unit.id,
            x: unit.x,
            y: unit.y
        });
    }

    updateUnit(id, unitData) {
        const numberId = parseInt(id);

        if (!this.units[numberId] || this.units[numberId] === -1) {
            return this.answer.bad(14);
        }

        const unit = this.units[numberId];
        
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

        if (!this.units[numberId] || this.units[numberId] === -1) {
            return this.answer.bad(14);
        }

        this.units[numberId] = -1;

        return this.answer.good(`Unit deleted: ${numberId}`);
    }

    getAllMushrooms() {
        const mushroomsList = [];

        this.mushrooms.forEach((mushroom, id) => {
            if (mushroom && mushroom !== -1) {
                mushroomsList.push({
                    id: id,
                    x: mushroom.x,
                    y: mushroom.y
                });
            }
        });

        return this.answer.good(mushroomsList);
    }

    createMushroom(mushroomData) {
        const mushroom = new Mushroom(this.db);
        mushroom.init(mushroomData);

        const mushroomId = this.nextMushroomId++;
        this.mushrooms.push(mushroom);

        return this.answer.good({
            id: mushroomId,
            x: mushroom.x,
            y: mushroom.y
        });
    }

    updateMushroom(id, mushroomData) {
        const numberId = parseInt(id);

        if (!this.mushrooms[numberId] || this.mushrooms[numberId] === -1) {
            return this.answer.bad(12);
        }

        const mushroom = this.mushrooms[numberId];
        mushroom.init(mushroomData);

        return this.answer.good({
            id: numberId,
            x: mushroom.x,
            y: mushroom.y
        });
    }

    deleteMushroom(id) {
        const numberId = parseInt(id);

        if (!this.mushrooms[numberId] || this.mushrooms[numberId] === -1) {
            return this.answer.bad(12);
        }

        this.mushrooms[numberId] = -1;

        return this.answer.good(`Mushroom deleted: ${numberId}`);
    }
}

module.exports = GameManager;
