import CONFIG from '../../config';
import Mediator from '../Mediator/Mediator';
import { TUser } from "./types";


const { MEDIATOR } = CONFIG;
const { TRIGGERS } = MEDIATOR;
const HOST = CONFIG.SERVER_URL;

class Server {
    HOST = HOST;
    mediator: Mediator;
    chatInterval: NodeJS.Timer | null = null;
    showErrorCb: (text: string) => void = function () { };

    constructor(mediator: Mediator) {
        this.mediator = mediator;
    }

    private async request<T>(
        method: string,
        params: { [key: string]: string } = {},
        queryParams: { [key: string]: string } = {},
        options?: { passThroughAnswerErrors?: boolean }
    ): Promise<T | null> {
        try {
            const token = this.mediator.get(TRIGGERS.GET_STORE, 'token');
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

            if (body?.result === 'error') {
                if (options?.passThroughAnswerErrors) {
                    return body as T;
                }
                this.setError(body.error);
                console.error("Server error:", body.error);
                return null;
            }
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
        this.mediator.get(TRIGGERS.SET_STORE, { name: 'token', value: user.token });
        this.mediator.get(TRIGGERS.SET_STORE, { name: 'user', value: { token: user.token, name, id: user.id } });


        return true;
    }

    async createUnit(guid: string, x: number, y: number, type: string): Promise<
        | { result: 'ok'; data: unknown }
        | { result: 'error'; error: string; code?: number }
        | null
    > {
        return this.request(
            'unit/create',
            { guid, x: String(x), y: String(y) },
            { type },
            { passThroughAnswerErrors: true }
        );
    }
}

export default Server;