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
declare class User {
    private db;
    private common;
    private socketId;
    private id?;
    private guid?;
    private name?;
    private passwordHash?;
    private token?;
    constructor({ db, common, socketId }: UserConstructorOptions);
    get(): Promise<{
        name?: string;
        guid?: string;
    }>;
    getSelf(): UserData & {
        db: DB;
        common: Common;
        socketId: string;
    };
    isLogin(): boolean;
    login(name: string, password: string): Promise<User | null>;
    logout(): void;
    registration(name: string, password: string): Promise<User>;
    private hashPassword;
    private generateToken;
}
export default User;
