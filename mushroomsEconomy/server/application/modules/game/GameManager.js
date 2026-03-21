const BaseManager = require("../BaseManager");
const Economy = require('../../economy/Economy');

class GameManager extends BaseManager {
    constructor(options) {
        super(options);

        if (!this.io) return;

        this.io.on('connection', (socket) => {

            socket.on(GET_MAP, (data) => this.socketGetMap(data, socket));

        });

        this.economies = {};
        this.createEconomy();
    }

    createEconomy({ map = null }) {
        guid = this.common.guid();
        this.economies[guid] = new Economy({
            db: this.db,
            common: this.common,
            callbacks: {},
            map,
            guid,
        });

        return this.economies[guid];
    }

    getMap() {
        //socket 
        //Дописать отправку карты
    }

}

module.exports = GameManager;