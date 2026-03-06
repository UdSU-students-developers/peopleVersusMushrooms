class User {
    constructor(db, common) {
        this.db = db;
        this.common = common;

        this.id = null;
        this.login = null;
        this.nickname = null;
        this.guid = null;
        this.token = null;
    }

    get() {
        return {
            guid: this.guid,
            nickname:this.nickname,
        }
    }

    getSelf() {
        return {
            guid: this.guid,
            nickname: this.nickname,
            token: this.token,
        }
    }

    _fillData(userData, token) {
        this.id = userData.id;
        this.login = userData.login;
        this.nickname = userData.nickname;
        this.guid = userData.guid;
        this.token = token;
    }

    async loginUser(login, passwordHash) {
        //проверка на пользака
        const userData = await this.db.getUserByLogin(login);
        if (!userData) {
            return {error: 1002};
        }
        //проверка на пароль
        if (passwordHash !== userData.password) {
            return {error: 1002};
        }

        const token = this.common.md5(`${Math.random()}`);

        await this.db.updateToken(userData.guid, token);
        this._fillData(userData, token);
        return true;
    }

     async registration(login, passwordHash, nickname) {
        //проверка, существует ли уже пользак
        const user = await this.db.getUserByLogin(login);
        if (user) {
            return { error: 1003 }; 
        }

        const guid = this.common.guid();
        const token = this.common.md5(`${Math.random()}`); 

        //создаем пользака
        await this.db.createUser(login, passwordHash, nickname, guid, token);

        const userData = await this.db.getUserByGuid(guid);
        this._fillData(userData, token);
        
        return true;
    }

    async logout(token) {
        //проверка на пользака
        if (this.token !== token) {
            return { error: 1001 };
        }

        await this.db.clearToken(this.guid);
        this.id = null;
        this.login = null;
        this.nickname = null;
        this.guid = null;
        this.token = null;
        
        return true;
    }
}

module.exports = User;