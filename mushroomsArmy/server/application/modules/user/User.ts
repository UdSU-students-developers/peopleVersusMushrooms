import md5 from 'md5';
import DB from '../db/DB';
import Common from '../common/Common';

interface UserConstructorOptions {
    db: DB;
    common: Common;
    socketId: string;
}

interface UserData {
    id?: number;
    guid?: string;
    name?: string;
    passwordHash?: string;
    token?: string;
}

class User {
    private db: DB;
    private common: Common;
    private socketId: string;
    // from DB
    private id?: number;
    private guid?: string;
    private name?: string;
    private passwordHash?: string;
    private token?: string;

    constructor({ db, common, socketId }: UserConstructorOptions) {
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

    async get(): Promise<{ name?: string; guid?: string }> {
        return {
            name: this.name,
            guid: this.guid
        };
    }

    getSelf(): UserData & { db: DB; common: Common; socketId: string } {
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

    isLogin(): boolean {
        return !!(this.socketId && this.token);
    }

    async login(name: string, password: string): Promise<User | null> {
        const userData = await this.db.getUserByName(name);
        if (!userData) return null;

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

    logout(): void {
        this.token = undefined;
    }

    async registration(name: string, password: string): Promise<User> {
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

    private hashPassword(password: string): string {
        return md5(password);
    }

    private generateToken(): string {
        return md5(Date.now() + Math.random().toString());
    }
}

export default User;