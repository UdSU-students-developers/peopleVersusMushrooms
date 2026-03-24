"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const md5_1 = __importDefault(require("md5"));
class User {
    constructor({ db, common, socketId }) {
        this.db = db;
        this.common = common;
        this.socketId = socketId;
        // from DB
        this.id = undefined;
        this.guid = undefined;
        this.name = undefined;
        this.passwordHash = undefined;
        this.token = undefined;
    }
    async get() {
        return {
            name: this.name,
            guid: this.guid
        };
    }
    getSelf() {
        return {
            db: this.db,
            common: this.common,
            socketId: this.socketId,
            id: this.id,
            guid: this.guid,
            name: this.name,
            passwordHash: this.passwordHash,
            token: this.token
        };
    }
    isLogin() {
        return !!(this.socketId && this.token);
    }
    async login(name, password) {
        const userData = await this.db.getUserByName(name);
        if (!userData)
            return null;
        const passwordHash = this.hashPassword(password);
        if (userData.password_hash === passwordHash) {
            this.id = userData.id;
            this.guid = userData.guid;
            this.name = userData.name;
            this.passwordHash = userData.password_hash;
            this.token = userData.token;
            return this;
        }
        return null;
    }
    logout() {
        this.token = undefined;
    }
    async registration(name, password) {
        const passwordHash = this.hashPassword(password);
        const token = this.generateToken();
        const guid = this.common.guid();
        const result = await this.db.registration(name, guid, passwordHash, token);
        if (result) {
            this.id = result.id;
            this.guid = guid;
            this.name = name;
            this.passwordHash = passwordHash;
            this.token = token;
        }
        return this;
    }
    hashPassword(password) {
        return (0, md5_1.default)(password);
    }
    generateToken() {
        return (0, md5_1.default)(Date.now() + Math.random().toString());
    }
}
exports.default = User;
//# sourceMappingURL=User.js.map