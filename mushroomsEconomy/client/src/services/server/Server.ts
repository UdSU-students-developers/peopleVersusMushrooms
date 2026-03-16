import CONFIG from '../../config';

import Mediator from '../Mediator/Mediator';

import Store from "../Store/Store";
import { TError } from "./types";

import { io, Socket } from "socket.io-client";

const HOST = CONFIG.HOST;

type Tprops = {
    store: Store;
    mediator: Mediator;
}

class Server {
    HOST = HOST;
    store: Store;
    mediator: Mediator;
    chatInterval: NodeJS.Timer | null = null;
    socket: Socket;
    showErrorCb: (error: TError) => void = () => { };

    constructor(props: Tprops) {

        this.mediator = props.mediator;
        this.store = props.store;
        this.socket = io(HOST);

        this.socket.on("connect", () => {
            console.log('connect');
        });

        this.socket.on(CONFIG.SOCKET.REGISTRATION, (data) => this.handleRegistration(data));
        this.socket.on(CONFIG.SOCKET.LOGIN, (data) => this.handleLogin(data));
        this.socket.on(CONFIG.SOCKET.LOGOUT, (data) => this.handleLogout(data));

        this.mediator.set(
            CONFIG.MEDIATOR.TRIGGERS.MESSAGE,
            (data: { name: string; text: string }) => this.chatMessage(data.name, data.text)
        )

        this.mediator.set(
            CONFIG.MEDIATOR.TRIGGERS.MESSAGE,
            (data: { name: string; text: string }) => this.chatMessage(data.name, data.text)
        )
    }

    private chatMessage(name: string, text: string): void {
        this.socket.emit(CONFIG.SOCKET.MESSAGE, { name, text });
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
            this.setError({
                code: 9000,
                text: 'Unknown error',
            });
            return null;
        }
    }

    private setError(error: TError): void {
        this.showErrorCb(error);
    }

    showError(cb: (error: TError) => void) {
        this.showErrorCb = cb;
    }

    // async register(username: string, password: string): Promise<boolean> { //Функцию выпилить! Она для примера
    //     const user = await this.request<TUser & { username?: string; name?: string; id?: number }>("reg", { username, password });
    //     if (!user) return false;
    //     const name = user.username ? user.username : user.name;
    //     this.store.setUser({ token: user.token, name: name, id: user.id });
    //     return true;
    // }

    async register(name: string, password: string): Promise<boolean> {
        this.socket.emit(CONFIG.SOCKET.REGISTRATION, { name, password });
        return true;
    }

    async login(name: string, password: string): Promise<boolean> {
        this.socket.emit(CONFIG.SOCKET.LOGIN, { name, password });
        return true;
    }

    async logout(name: string, password: string): Promise<boolean> {
        this.socket.emit(CONFIG.SOCKET.LOGOUT, { name, password });
        return true;
    }

    private handleRegistration(response: any) {
        console.log('Registration response: ', response);

        if (!response.error) {
            this.store.setUser({
                name: response.data.name,
                token: response.data.token
            });
        } else {
            this.setError(response.error);
        }
    }

    private handleLogin(response: any) {
        console.log('Login response: ', response);

        if (!response.error) {
            this.store.setUser({
                name: response.data.name,
                token: response.data.token
            });
        } else {
            this.setError(response.error);
        }
    }

    private handleLogout(response: any) {
        if (response) {
            this.store.clearUser();
        }
    }
}

export default Server;