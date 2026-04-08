import sqlite3 from 'sqlite3';
import ORM from './ORM';

type TDatabaseConfig = {
    NAME: string;
};

type TDbUser = {
    id?: number;
    name: string;
    guid: string;
    password_hash: string;
    token?: string;
    token_expiration?: string;
    created_at?: string;
};

// Тут используется sqlite3, но вы можете сменить её на другую (лучше так и сделать). Трусов упомянул postgreSQL, поэтому если будете менять, ставьте её

class DB {
    private db: sqlite3.Database;
    private orm: ORM;

    constructor({ DATABASE }: { DATABASE: TDatabaseConfig }) {
        this.db = new sqlite3.Database(`${__dirname}/${DATABASE.NAME}`);
        this.orm = new ORM(this.db);
        this.initTables();
    }

    async initTables(): Promise<void> {
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                guid TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                token TEXT UNIQUE,
                token_expiration DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        return new Promise((resolve) => {
            this.db.run(createUsersTable, function(err) {
                if (err) {
                    console.error('Error creating users table:', err);
                } else {
                    console.log('Users table initialized');
                }
                resolve();
            });
        });
    }

    async getUserByName(name: string): Promise<TDbUser | null> {
        return await this.orm.get('users', { name });
    }

    async getUserByToken(token: string): Promise<TDbUser | null> {
        return await this.orm.get('users', { token });
    }

    async registration(name: string, guid: string, passwordHash: string, token: string): Promise<any> {
        return await this.orm.insert('users', ['name', 'guid', 'password_hash', 'token'], [name, guid, passwordHash, token]);
    }

    async updateToken(id: number, token: string, expiresInMinutes: number = 1440): Promise<any> {
        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + expiresInMinutes);
        const tokenExpiration = expirationDate.toISOString();
        
        return await this.orm.update('users', ['token', 'token_expiration'], [token, tokenExpiration], { id });
    }

    async invalidateToken(id: number): Promise<any>{
        return await this.orm.update('users', ['token', 'token_expiration'], [null, null], { id });
    }

    async getUserByValidToken(token: string): Promise<TDbUser | null> {
        const user = await this.getUserByToken(token);
        
        if (user && user.token_expiration) {
  
            const currentTime = new Date();
            const expirationTime = new Date(user.token_expiration);
            
            if (expirationTime > currentTime) {
                return user;
            }
            
        }
        return null;
    }

    destructor(): void {
        this.db.close();
    }
}

export default DB;
