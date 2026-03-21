const md5 = require('md5');

class User {
    constructor({ db, common, socketId }) {
        this.db = db;
        this.common = common;
        this.socketId = socketId;
        // from DB
        this.id;
        this.guid;
        this.name;
        this.passwordHash;
        this.token;
    }

    async get() {
        return {
            name: this.name,
            guid: this.guid
        }
    }

    getSelf() {
        return {
            db: this.db,
            common: this.common,
            socketId: this.socketId = socketId,
            id: this.id,
            guid: this.guid,
            name: this.name,
            passwordHash: this.passwordHash,
            token: this.token
        }
    }

    isLogin() {
        return this.socketId && this.token;
    }

    async login(name, password) {
        const userData = await this.db.getUserByName(name);
        if (!userData) return null;

        const passwordHash = this.hashPassword(password);

        if (userData.password === passwordHash) {
            this.id = userData.id;
            this.guid = userData.guid;
            this.name = userData.name;
            this.passwordHash = userData.passwordHash;
            this.token = userData.token;

            return this;
        }

        return null;
    }
    
    logout() {
        this.token = null;
    }

    async registration(name, password) {
        const passwordHash = this.hashPassword(password);
        const token = this.generateToken();
        const guid = this.common.guid();

        const userData = await this.db.registration(name, guid, passwordHash, token);

        if (userData) {
            this.id = userData.id;
            this.guid = userData.guid;
            this.name = userData.name;
            this.passwordHash = userData.passwordHash;
            this.token = userData.token;
        }

        return this;
    }

    hashPassword(password) {
        return md5(password);
    }
    
    generateToken() {
        return md5(Date.now() + Math.random().toString());
    }
}

module.exports = User;