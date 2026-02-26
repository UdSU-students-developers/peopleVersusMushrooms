const sqlite3 = require('sqlite3').verbose();
const ORM = require('./ORM');

// Тут используется sqlite3, но вы можете сменить её на другую (лучше так и сделать). Трусов упомянал postgreSQL, поэтому если будете менять, ставьте её

class DB {
    constructor({ DATABASE }) {
        this.db = new sqlite3.Database(`${__dirname}/${DATABASE.NAME}`);
        this.orm = new ORM(this.db);
    }


    destructor() {
        this.db.close();
    }
}

module.exports = DB;