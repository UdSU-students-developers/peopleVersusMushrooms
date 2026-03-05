const md5 = require('md5');

class Mushroom {
    constructor(db) {
        this.db = db;

        this.x;
        this.y;
    }

    get() {
        return {
            x: this.x,
            y: this.y,
        }
    }

    getSelf(){
        return {
            ...this.get(),
        }
    }

    init({x, y}) {
        this.x = x;
        this.y = y;
    }
}

module.exports = Mushroom;