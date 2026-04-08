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

    // ============ USER METHODS ============
    getUserByGuid(guid) {
        return this.orm.get('users', { guid });
    }

    getUserByLogin(login) {
        return this.orm.get('users', { login });
    }

    getUserByToken(token) {
        return this.orm.get('users', { token });
    }

    updateToken(userGuid, token) {
        return this.orm.update('users', { guid: userGuid }, { token });
    }

    createUser(login, passwordHash, guid, token) {
        return this.orm.insert('users', {
            login,
            password: passwordHash,
            guid,
            token,
        });
    }

    clearToken(userGuid) {
        return this.orm.update('users', { guid: userGuid }, { token: null });
    }
}

module.exports = DB;