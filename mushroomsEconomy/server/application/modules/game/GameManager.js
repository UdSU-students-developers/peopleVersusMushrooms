const BaseManager = require("../BaseManager");
const Economy = require('../../economy/Economy');

class GameManager extends BaseManager {
    constructor(options) {
        super(options);

        this.economies = {};
        this.createEconomy({ guid: "123123123" });
    }

    createEconomy({ guid, map = null }) {
        if (this.economies[guid]) {
            return this.economies[guid];
        }

        this.economies[guid] = new Economy({
            db: this.db,
            common: this.common,
            callbacks: {},
            map,
            guid,
        });

        return this.economies[guid];
    }

}

module.exports = GameManager;