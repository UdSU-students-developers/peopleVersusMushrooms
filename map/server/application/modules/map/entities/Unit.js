const Entity = require("./Entity");

class Unit extends Entity {
    constructor({ x, y, type, guid, role, visibility = 1, soursesVisibility = null }) {
        super({ x, y, type });
        this.guid = guid;
        this.role = role;
        this.visibility = visibility;
        this.soursesVisibility = soursesVisibility;
    }

    get() {
        return {
            ...super.get(),
            guid: this.guid,
            role: this.role
        };
    }
    
    getSelf() {
        return {
            ...this.get(),
            visibility: this.visibility,
        };
    }

    getVisibleRange() {
        return {
            x: [this.x - this.visibility, this.x + this.visibility],
            y: [this.y - this.visibility, this.y + this.visibility],
        }
    }
}

module.exports = Unit;