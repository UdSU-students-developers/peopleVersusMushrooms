const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const CONFIG = require('../../../config.js');
const ORM = require('./ORM.js');

class DB {
    constructor() {
        this.db = null;
        this.orm = null;
        (async () => {
            this.db = await open({
                filename: CONFIG.SQLITE_PATH,
                driver: sqlite3.Database,
                mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
            });
            
            await this.db.run('PRAGMA foreign_keys = ON');
    
            this.orm = new ORM(this);    
        })();
    }

    // ============ BASE METHODS ============
    execute(sql, params = []) {
        return this.db.run(sql, params);
    }

    query(sql, params = []) {
        return this.db.get(sql, params);
    }

    queryAll(sql, params = []) {
        return this.db.all(sql, params);
    }

    // ============ TEST METHODS ============
    getUserById(userId) {
        return this.orm.get('users', { id: userId }, 'name');
    }
}

module.exports = DB;