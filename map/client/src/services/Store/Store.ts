import { TUser } from "../server/types";

const TOKEN = 'token';

class Store {
    user: TUser | null = null;

    getToken(): string | null {
        return localStorage.getItem(TOKEN);
    }
}

export default Store;