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
    TLobbies,
    TLobby,
    TLobbyServer,
    TRelief
} from "../Server/types";
import md5 from 'md5';

const { HOST } = CONFIG;

class Server {
    private mediator: Mediator;
    private socket: Socket;

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
            this.socket.on(SOCKET.CREATE_LOBBY, (data: TResponse<TLobbyServer>) => this.handleCreateLobby(data));
            this.socket.on(SOCKET.LOBBIES_LIST_UPDATED, (data: TResponse<TLobbies>) => this.handleLobbiesListUpdated(data));
            this.socket.on(SOCKET.LOBBY_UPDATED, (data: TResponse<TLobbyServer>) => this.handleLobbyUpdated(data));
            this.socket.on(SOCKET.JOIN_TO_LOBBY, (data: TResponse<TLobbyServer>) => this.handleJoinToLobby(data));
            this.socket.on(SOCKET.LEAVE_LOBBY, (data: TResponse<TLobbies>) => this.handleLeaveLobby(data));
            this.socket.on(SOCKET.SET_READY, (data: TResponse<any>) => this.handleSetReady(data));
            this.socket.on(SOCKET.DROP_FROM_LOBBY, (data: TResponse<TLobbies>) => this.handleDropFromLobby(data));
            this.socket.on(SOCKET.RELIEF_LOADED, (data: TResponse<TRelief>) => this.handleReliefLoaded(data));
        });
    }

    private getCredentials(): { guid: string; token: string } | null {
        const { GET_STORE } = this.mediator.getTriggerTypes();
        const user = this.mediator.get<{ name: string; token: string; guid: string } | null>(GET_STORE, 'user');
        if (!user ||
            user?.token ||
            user?.guid
        ) return null;
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

    public createLobby(lobbyName: string): void {
        this.request(CONFIG.SOCKET.CREATE_LOBBY, { lobbyName });
    }

    public getLobbies(): void {
        this.request(CONFIG.SOCKET.GET_LOBBIES);
    }

    public joinToLobby(lobbyGuid: string): void {
        this.request(CONFIG.SOCKET.JOIN_TO_LOBBY, { lobbyGuid });
    }

    public leaveLobby(): void {
        this.request(CONFIG.SOCKET.LEAVE_LOBBY);
    }

    public setReady(): void {
        this.request(CONFIG.SOCKET.SET_READY);
    }

    public startGame(): void {
        this.request(CONFIG.SOCKET.START_GAME);
    }

    public dropFromLobby(targetGuid: string): void {
        this.request(CONFIG.SOCKET.DROP_FROM_LOBBY, { targetGuid });
    }

    // ─── Response handlers ───────────────────────────────────────────────────────

// ─── Response handlers ───────────────────────────────────────────────────────
    private handle<T>(
        response: TResponse<T>, 
        cb: (data: T) => void
    ): void {
        if (this.checkError(response)) return;
        if (response.data) {
            cb(response.data);
        }
    }

    private handleRegistration(response: TResponse<TUser>): void {
        this.handle<TUser>(response, (data) => {
            const { SET_STORE } = this.mediator.getTriggerTypes();
            const { REGISTRATION } = this.mediator.getEventTypes();

            this.mediator.get(SET_STORE, {
                name: 'user',
                value: {
                    name: data.name,
                    token: data.token,
                    guid: data.guid,
                }
            });

            this.mediator.call(REGISTRATION);
        });
    }

    private handleLogin(response: TResponse<TUser>): void {
        this.handle<TUser>(response, (data) => {
            const { name, token, guid } = data;
            const { SET_STORE } = this.mediator.getTriggerTypes();
            const { LOGIN } = this.mediator.getEventTypes();

            this.mediator.get(SET_STORE, { name: 'user', value: { name, token, guid } });
            this.mediator.call(LOGIN);
        });
    }

    private handleLogout(response: TResponse<null>): void {
        this.handle<null>(response, () => {
            const { CLEAR_STORE } = this.mediator.getTriggerTypes();
            this.mediator.get(CLEAR_STORE, 'user');
        });
    }

    private handleSendMessage(response: TResponse<{ message: string }>): void {
        this.handle<{ message: string }>(response, (data) => {
            const { MESSAGE_SEND } = this.mediator.getEventTypes();
            this.mediator.call(MESSAGE_SEND, data.message);
        });
    }

    private handleGetMessage(response: TResponse<{ messages: TMessages }>): void {
        this.handle<{ messages: TMessages }>(response, (data) => {
            const { SET_STORE } = this.mediator.getTriggerTypes();
            const { MESSAGE_LOADED } = this.mediator.getEventTypes();
            const messages = data.messages;

            this.mediator.get(SET_STORE, { name: 'messages', value: messages });
            this.mediator.call(MESSAGE_LOADED, messages);
        });
    }

    private handleNewMessage(response: TResponse<TMessage>): void {
        this.handle<TMessage>(response, (data) => {
            const { SET_STORE, GET_STORE } = this.mediator.getTriggerTypes();
            const { NEW_MESSAGE } = this.mediator.getEventTypes();

            const currentMessages = this.mediator.get<TMessages>(GET_STORE, 'messages');
            const updatedMessages = Array.isArray(currentMessages)
                ? [...currentMessages, data]
                : [data];

            this.mediator.get(SET_STORE, { name: 'messages', value: updatedMessages });
            this.mediator.call(NEW_MESSAGE, data);
        });
    }

    private handleStartGame(response: TResponse<TScene>): void {
        this.handle<TScene>(response, (data) => {
            const { START_GAME } = this.mediator.getEventTypes();
            this.mediator.call(START_GAME, data);
        });
    }

    private handleUpdateScene(response: TResponse<TScene>): void {
        this.handle<TScene>(response, (data) => {
            const { UPDATE_SCENE } = this.mediator.getEventTypes();
            this.mediator.call(UPDATE_SCENE, data);
        });
    }

    private handleLobbyUpdated(response: TResponse<TLobbyServer>): void {
        this.handle<TLobbyServer>(response, (data) => {
            const { LOBBY_UPDATED } = this.mediator.getEventTypes();
            this.mediator.call(LOBBY_UPDATED, [data]);
        });
    }

    private handleCreateLobby(response: TResponse<TLobbyServer>): void {
        this.handle<TLobbyServer>(response, (data) => {
            const { LOBBY_UPDATED } = this.mediator.getEventTypes();
            this.mediator.call(LOBBY_UPDATED, [data]);
        });
    }

    private handleLobbiesListUpdated(response: TResponse<TLobbies>): void {
        this.handle<TLobbies>(response, (data) => {
            const { LOBBIES_LIST_UPDATED } = this.mediator.getEventTypes();
            this.mediator.call(LOBBIES_LIST_UPDATED, data);
        });
    }

    private handleJoinToLobby(response: TResponse<TLobbyServer>): void {
        this.handle<TLobbyServer>(response, (data) => {
            const { LOBBY_UPDATED } = this.mediator.getEventTypes();
            this.mediator.call(LOBBY_UPDATED, [data]);
        });
    }

    private handleLeaveLobby(response: TResponse<TLobbies>): void {
        this.handle<TLobbies>(response, () => {
            const { LOBBY_UPDATED } = this.mediator.getEventTypes();
            this.mediator.call(LOBBY_UPDATED, null);
        });
    }

    private handleSetReady(response: TResponse<any>): void {
        this.handle<any>(response, () => {
            console.log("Готов");
        });
    }

    private handleDropFromLobby(response: TResponse<TLobbies>): void {
        this.handle<TLobbies>(response, (data) => {
            const { LOBBY_UPDATED } = this.mediator.getEventTypes();
            this.mediator.call(LOBBY_UPDATED, data);
        });
    }

    private handleReliefLoaded(response: TResponse<TRelief>): void {
        this.handle<TRelief>(response, (data) => {
            const { RELIEF_LOADED } = this.mediator.getEventTypes();
            this.mediator.call(RELIEF_LOADED, data);
        });
    }
}

export default Server;