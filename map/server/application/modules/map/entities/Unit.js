const Entity = require("./Entity");

class Unit extends Entity {
    constructor({ x, y, type, guid, role, visibility = 1, soursesVisibility = null, hp }) {
        super({ x, y, type });
        this.guid = guid;
        this.role = role;
        this.visibility = visibility;
        this.soursesVisibility = soursesVisibility;
        this.hp = Number.isFinite(Number(hp)) ? Number(hp) : null;
    }

    get() {
        return {
            ...super.get(),
            guid: this.guid,
            role: this.role,
            ...(this.hp !== null ? { hp: this.hp } : {}),
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