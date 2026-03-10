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
        if (!this.id) return null;

        const userData = await this.db.getUserById(this.id);
        if (userData) {
            this.id = userData.id;
            this.guid = userData.guid;
            this.name = userData.name;
            this.passwordHash = userData.passwordHash;
            this.token = userData.token;
        }

        return this;
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
            tokem: this.token
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

        const userData = await this.db.registration(name, passwordHash, token);

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
        return crypto('sha256').update(password).digest('hex');
    }
    
    generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }
}

module.exports = User;