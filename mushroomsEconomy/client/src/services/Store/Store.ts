import { TUser } from "../Server/types";

const TOKEN = 'token';

class Store {
    private token: string | null;
    private user: TUser | null;

    constructor() {
        this.token = null;
        this.user = null;
    }
    
    setToken(token: string): void {
        this.token = token;
    }

    getToken(): string | null {
        return this.token;
    }

    setUser(user: TUser): void {
        this.user = user;
        this.token = user.token;
    }

    getUser(): TUser | null {
        return this.user;
    }

    clearUser(): void {
        this.user = null;
    }
}

export default Store;