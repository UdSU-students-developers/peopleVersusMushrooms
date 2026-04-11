import { io, Socket } from "socket.io-client";
import CONFIG from '../../config';
import Mediator from '../Mediator/Mediator';
import { 
    TMessages, 
    TResponse, 
    TScene, 
    TUser, 
    TError, 
    TMessage, 
    TLobbies
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
    private socket: Socket<ServerToClientEvents, ClientToServerEvents>;

    constructor(mediator: Mediator) {
        this.mediator = mediator;
        this.socket = io(HOST);
        this.setupSocketListeners();
    }

    private setupSocketListeners(): void {
        this.socket.on("connect", () => {
            console.log('connect');

            const { SOCKET } = CONFIG;

            this.socket.on(SOCKET.REGISTRATION, (data: TResponse<TUser>) => this.handleRegistration(data));
            this.socket.on(SOCKET.LOGIN, (data: TResponse<TUser>) => this.handleLogin(data));
            this.socket.on(SOCKET.LOGOUT, (data: TResponse<null>) => this.handleLogout(data));
            this.socket.on(SOCKET.MESSAGE, (data: TResponse<{ message: string }>) => this.handleSendMessage(data));
            this.socket.on(SOCKET.MESSAGES, (data: TResponse<{ messages: TMessages }>) => this.handleGetMessage(data));
            this.socket.on(SOCKET.NEW_MESSAGE, (data: TResponse<TMessage>) => this.handleNewMessage(data));
            this.socket.on(SOCKET.START_GAME, (data: TResponse<TScene>) => this.handleStartGame(data));
            this.socket.on(SOCKET.UPDATE_SCENE, (data: TResponse<TScene>) => this.handleUpdateScene(data));
            this.socket.on(SOCKET.LOBBY_UPDATED, (data: TResponse<any>) => this.handleLobbyUpdated(data));
        });
    }

    private getCredentials(): { guid: string; token: string } | null {
        const { GET_STORE } = this.mediator.getTriggerTypes();
        const user = this.mediator.get<{ name: string; token: string; guid: string } | null>(GET_STORE, 'user');

        if (!user?.token || !user?.guid) return null;

        return { guid: user.guid, token: user.token };
    }

    private checkError(response: TResponse<any>): boolean {
        if (response?.error) {
            const { SHOW_ERROR } = this.mediator.getEventTypes();
            this.mediator.call(SHOW_ERROR, response.error);
            return true;
        }
        return false;
    }

    private request(event: string, payload: object = {}): void {
        const credentials = this.getCredentials();
        const fullPayload = credentials ? { ...payload, ...credentials } : payload;
        this.socket.emit(event, fullPayload);
    }

    // ─── Public ──────────────────────────────────────────────────────────────

    public register(name: string, password: string): void {
        const passwordHash = md5(`${name}${password}`);
        this.request(CONFIG.SOCKET.REGISTRATION, { name, passwordHash });
    }

    public login(name: string, password: string): void {
        const passwordHash = md5(`${name}${password}`);
        this.request(CONFIG.SOCKET.LOGIN, { name, passwordHash });
    }

    public logout(name: string, password: string): void {
        this.request(CONFIG.SOCKET.LOGOUT, { name, password });
    }

    public sendMessage(message: string): void {
        const { GET_STORE } = this.mediator.getTriggerTypes();
        const user = this.mediator.get<{ name: string } | null>(GET_STORE, 'user');

        if (user?.name) {
            this.request(CONFIG.SOCKET.MESSAGE, { author: user.name, message });
        }
    }

    public getMessages(): void {
        this.request(CONFIG.SOCKET.MESSAGES);
    }

    public createLobby(): void {
        this.request(CONFIG.SOCKET.CREATE_LOBBY);
    }

    public joinToLobby(lobbyGuid: string): void {
        this.request(CONFIG.SOCKET.JOIN_TO_LOBBY, { lobbyGuid });
    }

    // ─── Response handlers ───────────────────────────────────────────────────────

    private handleRegistration(response: TResponse<TUser>): void {
        if (this.checkError(response)) return;

        if (response.data) {
            const { SET_STORE } = this.mediator.getTriggerTypes();
            const { REGISTRATION } = this.mediator.getEventTypes();

            this.mediator.get(SET_STORE, {
                name: 'user',
                value: {
                    name:  response.data.name,
                    token: response.data.token,
                    guid:  response.data.guid,
                }
            });

            this.mediator.call(REGISTRATION);
        }
    }

    private handleLogin(response: TResponse<TUser>): void {
        if (this.checkError(response)) return;

        if (response.data) {
            const { name, token, guid } = response.data;
            const { SET_STORE } = this.mediator.getTriggerTypes();
            const { LOGIN } = this.mediator.getEventTypes();

            this.mediator.get(SET_STORE, { name: 'user', value: { name, token, guid } });
            this.mediator.call(LOGIN);
        }
    }

    private handleLogout(response: TResponse<null>): void {
        if (this.checkError(response)) return;

        if (response.data !== undefined) {
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

            this.mediator.get(SET_STORE, { name: 'messages', value: messages });
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

            this.mediator.get(SET_STORE, { name: 'messages', value: updatedMessages });
            this.mediator.call(NEW_MESSAGE, response.data);
        }
    }

    private handleStartGame(response: TResponse<TScene>): void {
        if (this.checkError(response)) return;
        const { START_GAME } = this.mediator.getEventTypes();
        this.mediator.call(START_GAME, response.data);
    }

    private handleUpdateScene(response: TResponse<TScene>): void {
        if (this.checkError(response)) return;
        const { UPDATE_SCENE } = this.mediator.getEventTypes();
        this.mediator.call(UPDATE_SCENE, response.data);
    }

    private handleLobbyUpdated(response: TResponse<TLobbies>): void {
        if (this.checkError(response)) return;
        const { LOBBY_UPDATED } = this.mediator.getEventTypes();
        this.mediator.call(LOBBY_UPDATED, response.data);
    }
}

export default Server;