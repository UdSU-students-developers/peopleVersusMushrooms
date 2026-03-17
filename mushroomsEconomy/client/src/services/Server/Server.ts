import { io, Socket } from "socket.io-client";
import CONFIG from '../../config';
import Mediator from '../Mediator/Mediator';
import { TResponse, TUser } from "../Server/types";
import { TError } from "../Server/types";

const { HOST } = CONFIG;

class Server {
    mediator: Mediator;
    chatInterval: NodeJS.Timer | null = null;
    socket: Socket;
    showErrorCb: (error: TError) => void = () => { };

    constructor(mediator: Mediator) {
        this.mediator = mediator;
        this.socket = io(HOST);

        this.socket.on("connect", () => {
            console.log('connect');
        });

        this.socket.on(CONFIG.SOCKET.REGISTRATION, (data) => this.handleRegistration(data));
        this.socket.on(CONFIG.SOCKET.LOGIN, (data) => this.handleLogin(data));
        this.socket.on(CONFIG.SOCKET.LOGOUT, (data) => this.handleLogout(data));
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
            const { GET_STORE } = this.mediator.getTriggerTypes();
            const token = this.mediator.get(GET_STORE, 'token');
            
            let url = `${HOST}/${method}`;
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

            const response = await fetch(url);
            const body = await response.json();

            if (body && body.error) {
                this.setError(body.error);
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

    async register(name: string, password: string): Promise<boolean> {
        this.socket.emit(CONFIG.SOCKET.REGISTRATION, { name, password });
        return true;
    }

    login(name: string, password: string): void {
        this.socket.emit(CONFIG.SOCKET.LOGIN, { name, password });
    }

    async logout(name: string, password: string): Promise<boolean> {
        this.socket.emit(CONFIG.SOCKET.LOGOUT, { name, password });
        return true;
    }

    private handleRegistration(response: any) {
        console.log('Registration response: ', response);

        if (response) {
            const { SET_STORE } = this.mediator.getTriggerTypes();
            this.mediator.get(SET_STORE, {
                name: 'user',
                value: {
                    name: response.data.name,
                    token: response.data.token
                }
            });
        } else {
            this.setError(response.error);
        }
    }

    private handleLogin(response: any) {
        console.log('Login response: ', response);

        if (response?.result === 'ok' && response.data) {
            const { name, token } = response.data;
            const { SET_STORE } = this.mediator.getTriggerTypes();
            const { LOGIN } = this.mediator.getEventTypes();
            
            this.mediator.get(SET_STORE, {
                name: 'user',
                value: { name, token }
            });
            
            this.mediator.call(LOGIN); 
        } else {
            this.setError({code: 11, text: "Ошибка авторизации"});
        }
    }

    private handleLogout(response: any) {
        if (response) {
            const { CLEAR_STORE } = this.mediator.getTriggerTypes();
            this.mediator.get(CLEAR_STORE, 'user');
        }
    }
}

export default Server;
