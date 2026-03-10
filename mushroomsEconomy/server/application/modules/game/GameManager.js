const EasyStar = require('easystarjs');
const BaseManager = require("../BaseManager");
const Economy = require('../../economy/Economy');

class GameManager extends BaseManager {
    constructor(options) {
        super(options);

        this.economies = {};
    }

}

module.exports = GameManager;