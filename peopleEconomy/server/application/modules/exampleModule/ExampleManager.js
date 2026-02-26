const Example = require("./Example");
const BaseManager = require('../BaseManager');

class ExampleManager extends BaseManager {
    constructor(mediator, db) {
        super(mediator, db);
    }
    
    check(token) {
        console.log('пример манагера!');
    }

}

module.exports = ExampleManager;