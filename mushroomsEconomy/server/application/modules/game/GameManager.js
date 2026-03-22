const BaseManager = require("../BaseManager");
const CONFIG = require("../../../config");
const Economy = require('../../economy/Economy');

const { GET_MAP } = CONFIG.SOCKET;

function getMap() {
    return [0, 0, 0];
}

class GameManager extends BaseManager {
    constructor(options) {
        super(options);

        if (!this.io) return;

        this.io.on('connection', (socket) => {
            socket.on(GET_MAP, () => socket.emit(GET_MAP, getMap()));
        });

        this.economies = {};
        this.createEconomy();
    }

    createEconomy({ map } = {}) {
        const guid = this.common.guid();
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
