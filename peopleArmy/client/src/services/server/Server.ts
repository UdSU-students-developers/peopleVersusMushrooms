import CONFIG from '../../config';
import Store from "../Store/Store";
import SocketService from "../SocketService";
import { TUser } from "./types";

const HOST = CONFIG.SERVER_URL;

class Server {
    HOST = HOST;
    store: Store;
    chatInterval: NodeJS.Timer | null = null;
    showErrorCb: (text: string) => void = function() {};

    constructor(store: Store) {
        this.store = store;
    }

    async register(username: string, password: string): Promise<void> {
        SocketService.emit('REGISTRATION', { username, password });
    }

    onRegistration(callback: (data: { result: string, user?: TUser }) => void) {
        SocketService.on('REGISTRATION', callback);
    }

    offRegistration(callback: (data: { result: string, user?: TUser }) => void) {
        SocketService.off('REGISTRATION', callback);
    }

    async login(username: string, password: string): Promise<void> {
        SocketService.emit('LOGIN', { username, password });
    }

    onLogin(callback: (data: { result: string, user?: TUser }) => void) {
        SocketService.on('LOGIN', callback);
    }

    offLogin(callback: (data: { result: string, user?: TUser }) => void) {
        SocketService.off('LOGIN', callback);
    }

    async logout(): Promise<void> {
        const token = this.store.getToken();
        SocketService.emit('LOGOUT', { token });
    }

    onLogout(callback: (data: { result: string }) => void) {
        SocketService.on('LOGOUT', callback);
    }

    offLogout(callback: (data: { result: string }) => void) {
        SocketService.off('LOGOUT', callback);
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
}

export default Server;