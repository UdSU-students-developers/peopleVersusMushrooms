import { io, Socket } from "socket.io-client";
import CONFIG from '../../config';
import Mediator from '../Mediator/Mediator';
import { TMessages, TResponse, TScene, TUser } from "../Server/types";
import { TError } from "../Server/types";

const { HOST } = CONFIG;

//СДЕЛАТЬ ТИПЫ НОРМАЛЬНЫМИ ВЕЗДЕ

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

        this.socket.on(CONFIG.SOCKET.MESSAGE, (data) => this.handleSendMessage(data));
        this.socket.on(CONFIG.SOCKET.MESSAGES, (data) => this.handleGetMessage(data));
        this.socket.on(CONFIG.SOCKET.NEW_MESSAGE, (data) => this.handleNewMessage(data));
        this.socket.on(CONFIG.SOCKET.GET_SCENE, (data) => this.handleGetScene(data));
    }

    sendMessage(message: string): void {
        const { GET_STORE } = this.mediator.getTriggerTypes();
        const user = this.mediator.get<{ name: string; token: string } | null>(GET_STORE, 'user');

        if (user?.name) {
            this.socket.emit(CONFIG.SOCKET.MESSAGE, { author: user.name, message: message });
        }
    }

    getMessages() {
        this.socket.emit(CONFIG.SOCKET.MESSAGES);
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

                const { SHOW_ERROR } = this.mediator.getEventTypes();
                this.mediator.call(SHOW_ERROR, body.error)
                return null;
            }
            return body as T;
        } catch (e) {
            console.log("Request exception:", e);
            const { SHOW_ERROR } = this.mediator.getEventTypes();
            this.mediator.call(SHOW_ERROR, {
                code: 9000,
                text: 'Unknown error',
            });
            return null;
        }
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
            const { SHOW_ERROR } = this.mediator.getEventTypes();
            this.mediator.call(SHOW_ERROR, response.error);
        }
    }

    private handleLogin(response: any) {
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
            const { SHOW_ERROR } = this.mediator.getEventTypes();
            this.mediator.call(SHOW_ERROR, response.error);
        }
    }

    private handleLogout(response: any) {
        if (response.data) {
            const { CLEAR_STORE } = this.mediator.getTriggerTypes();
            this.mediator.get(CLEAR_STORE, 'user');
        }
    }

    private handleSendMessage(response: any) {
        if (response?.result === 'ok' && response.data) {
            const { MESSAGE_SEND } = this.mediator.getEventTypes();
            this.mediator.call(MESSAGE_SEND, response.data.message);
        } else {
            const { SHOW_ERROR } = this.mediator.getEventTypes();
            this.mediator.call(SHOW_ERROR, response.error)
        }
    }

    private handleGetMessage(response: any) {
        if (response?.result === 'ok' && response.data) {
            const { SET_STORE } = this.mediator.getTriggerTypes();
            const { MESSAGE_LOADED } = this.mediator.getEventTypes();

            const messages = response.data.messages;

            this.mediator.get(SET_STORE, {
                name: 'messages',
                value: messages
            });

            this.mediator.call(MESSAGE_LOADED, messages);
        } else {
            const { SHOW_ERROR } = this.mediator.getEventTypes();
            this.mediator.call(SHOW_ERROR, response.error)
        }
    }

    private handleNewMessage(response: any) {
        if (response?.result === 'ok' && response.data) {
            const { SET_STORE, GET_STORE } = this.mediator.getTriggerTypes();
            const { NEW_MESSAGE } = this.mediator.getEventTypes();

            const currentMessages = this.mediator.get(GET_STORE, 'messages');
            
            let updatedMessage;
            if (Array.isArray(currentMessages)) {
                updatedMessage = [...currentMessages, response.data];
            } else {
                updatedMessage = [response.data];
            }

            this.mediator.get(SET_STORE, {
                name: 'messages',
                value: response.data
            });

            this.mediator.call(NEW_MESSAGE, response.data);
        } else {
            const { SHOW_ERROR } = this.mediator.getEventTypes();
            this.mediator.call(SHOW_ERROR, response.error)

        }
    }

    getScene(guid: string) {
        const { GET_SCENE } = CONFIG.SOCKET;
        this.socket.emit(GET_SCENE, { guid: guid });
    }

    handleGetScene(response: TResponse<TScene>): TScene | null {
        console.log(response);
        if (response?.result === 'ok' && response.data) {
            return {
                guid: response.data.guid,
                mushrooms: response.data.mushrooms,
                map: response.data.map
            }
        }
        else {
            const { SHOW_ERROR } = this.mediator.getEventTypes();
            this.mediator.call(SHOW_ERROR, response.error);
            return null
        }
    }
}

export default Server;
