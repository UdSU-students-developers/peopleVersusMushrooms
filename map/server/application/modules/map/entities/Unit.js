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

    getRange(range) {
        return {
            x: [this.x - range, this.x + range],
            y: [this.y - range, this.y + range],
        };
    }

    getVisibleRange() {
        return this.getRange(this.visibility);
    }

    getVisibleSoursesRange() {
        return this.getRange(this.soursesVisibility);
    }
}

module.exports = Unit;