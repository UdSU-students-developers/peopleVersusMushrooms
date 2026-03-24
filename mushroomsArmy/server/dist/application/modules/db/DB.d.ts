interface DatabaseConfig {
    NAME: string;
}
interface User {
    id?: number;
    name: string;
    guid: string;
    password_hash: string;
    token?: string;
    created_at?: string;
}
declare class DB {
    private db;
    private orm;
    constructor({ DATABASE }: {
        DATABASE: DatabaseConfig;
    });
    initTables(): Promise<void>;
    getUserByName(name: string): Promise<User | null>;
    getUserByToken(token: string): Promise<User | null>;
    registration(name: string, guid: string, passwordHash: string, token: string): Promise<any>;
    updateToken(id: number, token: string): Promise<any>;
    destructor(): void;
}
export default DB;
