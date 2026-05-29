class Entity {
    constructor({ guid, x, y, easystar, callbacks = {}, type = null, hp = null, visibility = null}) {
        this.x = x;
        this.y = y;
        this.guid = guid;
        this.callbacks = callbacks;
        this.type = type;
        this.hp = hp;
        this.visibility = visibility;

        this.easystar = easystar;
    }

    getForMap() {
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            guid: this.guid,
            visibility: this.visibility
        };
    }

    get() {
        return {
            ...this.getForMap(),
            hp: this.hp
        }
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        return this.hp === 0;
    }
}

module.exports = Entity;