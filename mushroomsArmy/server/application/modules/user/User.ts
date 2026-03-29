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
    token_expiration?: string;
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
    private token_expiration?: string;

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
        this.token_expiration = undefined;
    }

    static restoreFromData({db, common, socketId }:UserConstructorOptions, userData: User): User {
        const user = new User({db, common, socketId });
        
        user.id = userData.id;
        user.guid = userData.guid;
        user.name = userData.name;
        user.passwordHash = userData.passwordHash;
        user.token = userData.token;
        user.token_expiration = userData.token_expiration;

        return user;
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
            token: this.token,
            token_expiration: this.token_expiration
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
            const newToken = this.generateToken();

            if (userData.id) {
                await this.db.updateToken(userData.id, newToken);
            }
            
            this.id = userData.id;
            this.guid = userData.guid;
            this.name = userData.name;
            this.passwordHash = userData.password_hash;
            this.token = newToken;
            this.token_expiration = userData.token_expiration;

            return this;
        }

        return null;
    }

    logout(): void {
         if (this.id){
            this.db.invalidateToken(this.id);
        }
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

             if(this.id){
                await this.db.updateToken(this.id, token);
            }
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
