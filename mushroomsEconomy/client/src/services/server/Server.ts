import CONFIG from '../../config';
import Store from "../Store/Store";
import { TUser } from "./types";

const HOST = CONFIG.HOST;

class Server {
    HOST = HOST;
    store: Store;
    chatInterval: NodeJS.Timer | null = null;
    showErrorCb: (text: string) => void = function() {};

    constructor(store: Store) {
        this.store = store;
    }

    private async request<T>(
        method: string,
        params: { [key: string]: string } = {},
        queryParams: { [key: string]: string } = {}
    ): Promise<T | null> {
        try {
            const token = this.store.getToken();
            let url = `${this.HOST}/${method}`;
            const paramValues = Object.values(params);
            if (paramValues.length > 0) {
                url += "/" + paramValues.join("/");
            }
            const queryParts: string[] = [];
            if (token) {
                queryParts.push("token=" + token);
            }
            for (const key in queryParams) {
                queryParts.push(key + "=" + queryParams[key]);
            }
            if (queryParts.length > 0) {
                url += "?" + queryParts.join("&");
            }

            console.log("Request URL:", url);
            const response = await fetch(url);
            const body = await response.json();

            if (body && body.error) {
                this.setError(body.error);
                console.error("Server error:", body.error);
                return null;
            }
            return body as T;
        } catch (e) {
            console.log("Request exception:", e);
            this.setError("Unknown error");
            return null;
        }
    }

    private setError(text: string): void {
        this.showErrorCb(text);
    }

    showError(cb: (text: string) => void) {
        this.showErrorCb = cb;
    }

    async register(username: string, password: string): Promise<boolean> { //Функцию выпилить! Она для примера
        const user = await this.request<TUser & { username?: string; name?: string; id?: number }>("reg", { username, password });
        if (!user) return false;
        const name = user.username ? user.username : user.name;
        this.store.setUser({ token: user.token, name: name, id: user.id });
        return true;
    }
}

export default Server;