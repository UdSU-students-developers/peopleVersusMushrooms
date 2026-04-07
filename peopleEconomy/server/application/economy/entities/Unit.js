class Unit {
    constructor({ guid, x, y, easystar }) {
        this.guid = guid;
        this.x = x;
        this.y = y;
        this.easystar = easystar;      
        this.hp = 1;
        this.speed = 1;
    }

    get() {
        return {
            guid: this.guid,
            x: this.x,
            y: this.y,
            hp: this.hp,   
        };
    }

    //передвижение
    moveTo(newX, newY) {

    }
    
    
}

module.exports = Unit;