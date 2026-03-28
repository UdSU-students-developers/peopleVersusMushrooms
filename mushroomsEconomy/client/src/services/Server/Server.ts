import { io, Socket } from "socket.io-client";
import CONFIG from '../../config';
import Mediator from '../Mediator/Mediator';
import { 
    TMessages, 
    TResponse, 
    TScene, 
    TUser, 
    TError, 
    TMessage 
} from "../Server/types";
import md5 from 'md5';

const { HOST } = CONFIG;

interface ServerToClientEvents {
    [key: string]: (response: any) => void;
}

interface ClientToServerEvents {
    [key: string]: (payload: any, callback?: (response: any) => void) => void;
}

class Server {
    private mediator: Mediator;
    private chatInterval: NodeJS.Timer | null = null;
    private socket: Socket<ServerToClientEvents, ClientToServerEvents>;
    private showErrorCb: (error: TError) => void = () => { };

    constructor(mediator: Mediator) {
        this.mediator = mediator;

        this.socket = io(HOST);

        this.setupSocketListeners();
    }

    private setupSocketListeners(): void {
        this.socket.on("connect", () => {
            console.log('connect');

            const { SOCKET } = CONFIG

            this.socket.on(SOCKET.REGISTRATION, (data: TResponse<TUser>) => this.handleRegistration(data));
            this.socket.on(SOCKET.LOGIN, (data: TResponse<TUser>) => this.handleLogin(data));
            this.socket.on(SOCKET.LOGOUT, (data: TResponse<null>) => this.handleLogout(data));
            this.socket.on(SOCKET.MESSAGE, (data: TResponse<{ message: string }>) => this.handleSendMessage(data));
            this.socket.on(SOCKET.MESSAGES, (data: TResponse<{ messages: TMessages }>) => this.handleGetMessage(data));
            this.socket.on(SOCKET.NEW_MESSAGE, (data: TResponse<TMessage>) => this.handleNewMessage(data));
            this.socket.on(SOCKET.START_GAME, (data: TResponse<TScene>) => this.handleStartGame(data));
            this.socket.on(SOCKET.UPDATE_SCENE, (data: TResponse<TScene>) => this.handleUpdateScene(data));
        });
    }

    private checkError(response: TResponse<any>): boolean {
        if (response && response.error) {
            const { SHOW_ERROR } = this.mediator.getEventTypes();
            this.mediator.call(SHOW_ERROR, response.error);
            return true;
        }
        return false;
    }

    private request(event: string, payload: object): Promise<TResponse<any> | null> {
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                const timeoutError: TError = { code: 500, text: 'Request timeout' };

                const errorResponse: TResponse<any> = {
                    result: 'error',
                    error: timeoutError
                };

                this.checkError(errorResponse);
                resolve(null);
            }, 5000);

            this.socket.emit(event, payload, (response: TResponse<any>) => {
                clearTimeout(timer);
                this.checkError(response);
                resolve(response);
            });
        });
    }


    public sendMessage(message: string): void {
        const { GET_STORE } = this.mediator.getTriggerTypes();
        const user = this.mediator.get<{ name: string; token: string } | null>(GET_STORE, 'user');

        if (user?.name) {
            const payload = { author: user.name, message: message };
            this.socket.emit(CONFIG.SOCKET.MESSAGE, payload);
        }
    }

    public getMessages(): void {
        this.socket.emit(CONFIG.SOCKET.MESSAGES, {});
    }

    public register(name: string, password: string) {
        const passwordHash = md5(`${name}${password}`);
        const payload = { name, passwordHash };
        
        this.socket.emit(CONFIG.SOCKET.REGISTRATION, payload);
        return true;
    }

    public login(name: string, password: string): void {
        const passwordHash = md5(`${name}${password}`);
        const payload = { name, passwordHash };
        this.socket.emit(CONFIG.SOCKET.LOGIN, payload);
    }

    public logout(name: string, password: string): void {
        const payload = { name, password };
        this.socket.emit(CONFIG.SOCKET.LOGOUT, payload);
    }


    private handleRegistration(response: TResponse<TUser>): void {
        if (this.checkError(response)) return;

        if (response.data) {
            const { SET_STORE } = this.mediator.getTriggerTypes();
            const { REGISTRATION } = this.mediator.getEventTypes();
            
            this.mediator.get(SET_STORE, {
                name: 'user',
                value: {
                    name: response.data.name,
                    token: response.data.token,
                    guid: response.data.guid,
                }
            });

            this.mediator.call(REGISTRATION);
        }
    }

    private handleLogin(response: any) {
        if (response?.result === 'ok' && response.data) {
            const { name, token, guid } = response.data;
            const { SET_STORE } = this.mediator.getTriggerTypes();
            const { LOGIN } = this.mediator.getEventTypes();

            this.mediator.get(SET_STORE, {
                name: 'user',
                value: { name, token, guid }
            });

            this.mediator.call(LOGIN);
        }
    }

    private handleLogout(response: TResponse<null>): void {
        if (response.data) { 
            const { CLEAR_STORE } = this.mediator.getTriggerTypes();
            this.mediator.get(CLEAR_STORE, 'user');
        }
    }

    private handleSendMessage(response: TResponse<{ message: string }>): void {
        if (this.checkError(response)) return;

        if (response.data) {
            const { MESSAGE_SEND } = this.mediator.getEventTypes();
            this.mediator.call(MESSAGE_SEND, response.data.message);
        }
    }

    private handleGetMessage(response: TResponse<{ messages: TMessages }>): void {
        if (this.checkError(response)) return;

        if (response.data) {
            const { SET_STORE } = this.mediator.getTriggerTypes();
            const { MESSAGE_LOADED } = this.mediator.getEventTypes();

            const messages = response.data.messages;

            this.mediator.get(SET_STORE, {
                name: 'messages',
                value: messages
            });

            this.mediator.call(MESSAGE_LOADED, messages);
        }
    }

    private handleNewMessage(response: TResponse<TMessage>): void {
        if (this.checkError(response)) return;

        if (response.data) {
            const { SET_STORE, GET_STORE } = this.mediator.getTriggerTypes();
            const { NEW_MESSAGE } = this.mediator.getEventTypes();

            const currentMessages = this.mediator.get<TMessages>(GET_STORE, 'messages');

            const updatedMessages = Array.isArray(currentMessages) 
                ? [...currentMessages, response.data] 
                : [response.data];

            this.mediator.get(SET_STORE, {
                name: 'messages',
                value: updatedMessages
            });

            this.mediator.call(NEW_MESSAGE, response.data);
        }
    }

    handleStartGame(data: TResponse<TScene>) {
        const { START_GAME } = this.mediator.getEventTypes();

        if (this.checkError(data)) return;

        this.mediator.call(START_GAME, data.data);
        return
    }

    handleUpdateScene(data: TResponse<TScene>) {
        const { UPDATE_SCENE } = this.mediator.getEventTypes();
        if (this.checkError(data)) return;
        this.mediator.call(UPDATE_SCENE, data.data);
        return;
    }

}

export default Server;
