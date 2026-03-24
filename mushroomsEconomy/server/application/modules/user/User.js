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
            guid: this.guid,
            name: this.name,
            token: this.token
        }
    }

    async fillData(data) {
        this.id = data.id;
		this.guid = data.guid;
		this.name = data.name;
		this.passwordHash = data.passwordHash;
		// update token
		const token = this.generateToken();
		await this.db.updateToken(data.id, token);
		this.token = token;
    }

    isLogin() {
        return this.socketId && this.token;
    }
    
    generateToken() {
        return md5(Date.now() + Math.random().toString());
    }

    async login(name, passwordHash) {
        const userData = await this.db.getUserByName(name);
        if (!userData) return false;

        if (userData.passwordHash === passwordHash) {
            await this.fillData(userData);
            return true;
        }

        return false;
    }
    
    async logout() {
        this.token = null;
        await this.db.updateToken(this.id, null);
    }

    async registration(name, passwordHash) {
        if (await this.db.getUserByName(name)) {
            return false
        }

        const guid = this.common.guid();
        await this.db.registration(name, guid, passwordHash);
        
        return await this.login(name, passwordHash);
    }
}

module.exports = User;