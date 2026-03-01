const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const CONFIG = require('../../../config.js');
const ORM = require('./ORM.js');

class DB {
    constructor() {
        this.db = null;
        this.orm = null;
    }

    // ============ INITIALIZE DB ============
    async initialize() {
        this.db = await open({
            filename: CONFIG.SQLITE_PATH,
            driver: sqlite3.Database,
            mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
        });
        
        await this.db.run('PRAGMA foreign_keys = ON');

        this.orm = new ORM(this);
    }

    // ============ BASE METHODS ============
    async execute(sql, params = []) {
        return await this.db.run(sql, params);
    }

    async query(sql, params = []) {
        return await this.db.get(sql, params);
    }

    async queryAll(sql, params = []) {
        return await this.db.all(sql, params);
    }

    // ============ TEST METHODS ============
    async getUserById(userId) {
        return await this.orm.get('users', { id: userId }, 'name');
    }

    // ============ TRANSACTION METHODS ============
    async beginTransaction() {
        await this.db.run('BEGIN TRANSACTION');
        return this.db;
    }

    async commit(db) {
        await db.run('COMMIT');
    }

    async rollback(db) {
        await db.run('ROLLBACK');
    }

}

module.exports = DB;