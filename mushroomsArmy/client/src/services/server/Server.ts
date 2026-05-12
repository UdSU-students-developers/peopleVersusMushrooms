import { io, Socket } from "socket.io-client";
import md5 from 'md5';
import CONFIG from '../../config';
import Mediator from '../Mediator/Mediator';
import { ILobby, TArmyState, TResponse, TUser } from './types';
import { authStorage } from '../../utils/authStorage';

const { HOST, SOCKET } = CONFIG;
const {
    REGISTRATION,
    LOGIN,
    LOGOUT,

    CREATE_LOBBY,
    JOIN_TO_LOBBY,
    LEAVE_LOBBY,
    DROP_FROM_LOBBY,
    SET_READY,
    LOBBY_UPDATED,
    GET_LOBBYS,
    LOBBYS_LIST_UPDATED,
    START_GAME,

    LOBBY_START,
    GAME_STARTED,
    GAME_STATE,
    GAME_OVER
    
} = SOCKET;

class Server {
    mediator: Mediator;
    socket: Socket;

    constructor(mediator: Mediator) {
        this.mediator = mediator;
        this.socket = io(HOST);

        this.socket.on(CREATE_LOBBY, (data) => this.handleCreateLobby(data));
        this.socket.on(JOIN_TO_LOBBY, (data) => this.handleJoinToLobby(data));
        this.socket.on(LEAVE_LOBBY, (data) => this.handleLeaveLobby(data));
        this.socket.on(DROP_FROM_LOBBY, (data) => this.handleDropFromLobby(data));
        this.socket.on(SET_READY, (data) => this.handleSetReady(data));
        this.socket.on(LOBBY_UPDATED, (data) => this.handleLobbyUpdated(data));
        this.socket.on(GET_LOBBYS, (data) => this.handleGetLobbys(data));
        this.socket.on(LOBBYS_LIST_UPDATED, (data) => this.handleLobbysListUpdate(data));
        this.socket.on(START_GAME, (data) => this.handleStartGame(data));        

        this.socket.on(REGISTRATION, (data) => this.handleRegistration(data));
        this.socket.on(LOGIN, (data) => this.handleLogin(data));
        this.socket.on(LOGOUT, (data) => this.handleLogout(data));

        this.socket.on(LOBBY_START, (data) => this.handleLobbyStart(data));
        this.socket.on(GAME_STARTED, (data) => this.handleGameStarted(data));
        this.socket.on(GAME_STATE, (data) => this.handleGameState(data));
        this.socket.on(GAME_OVER, (data) => this.handleGameOver(data));

        // Автоматически логинимся при (пере)подключении если есть сохранённые credentials
        this.socket.on('connect', () => this.autoRestore());
    }

    private autoRestore(): void {
        const credentials = authStorage.getCredentials();
        const { user } = authStorage.getAuth();
        if (credentials && user) {
            this.socket.emit(LOGIN, {
                name: credentials.name,
                passwordHash: credentials.passwordHash,
            });
        }
    }

    register(username: string, password: string, passwordRepeat: string): void {
        authStorage.setCredentials(username, md5(password));
        this.socket.emit(REGISTRATION, {
            name: username,
            passwordHash: md5(password),
        });
    }

    login(username: string, password: string): void {
        authStorage.setCredentials(username, md5(password));
        this.socket.emit(LOGIN, {
            name: username,
            passwordHash: md5(password),
        });
    }

    logout(): void {
        const ERROR = this.mediator.getEventTypes().ERROR;
        const user = this.mediator.get<TUser | null>(
            this.mediator.getTriggerTypes().GET_STORE,
            'user'
        );

        if (!user) {
            this.mediator.call(ERROR, { code: 13, message: 'Пользователь не найден' });
            return;
        }

        this.socket.emit(LOGOUT, {
            token: user.token,
            guid: user.guid
        });
    }

    lobbyStart(): void {
        const ERROR = this.mediator.getEventTypes().ERROR;
        const user = this.mediator.get<TUser>(
            this.mediator.getTriggerTypes().GET_STORE,
            'user'
        );

        if (!user || !user.token || !user.guid) {
            this.mediator.call(ERROR, { code: 13, message: 'Недостаточно данных' });
            return;
        }

        this.socket.emit(LOBBY_START, {
            token: user.token,
            guid: user.guid
        });
    }

    createLobby(payload: Record<string, unknown> = {}): void {
        const user = this.getAuthorizedUser();
        if (!user) return;

        this.socket.emit(CREATE_LOBBY, {
            token: user.token,
            guid: user.guid,
            ...payload
        });
    }

    joinToLobby(payload: Record<string, unknown> = {}): void {
        const user = this.getAuthorizedUser();
        if (!user) return;

        this.socket.emit(JOIN_TO_LOBBY, {
            token: user.token,
            guid: user.guid,
            ...payload
        });
    }

    leaveLobby(payload: Record<string, unknown> = {}): void {
        const user = this.getAuthorizedUser();
        if (!user) return;

        this.socket.emit(LEAVE_LOBBY, {
            token: user.token,
            guid: user.guid,
            ...payload
        });
    }

    dropFromLobby(payload: Record<string, unknown> = {}): void {
        const user = this.getAuthorizedUser();
        if (!user) return;

        this.socket.emit(DROP_FROM_LOBBY, {
            token: user.token,
            guid: user.guid,
            ...payload
        });
    }

    setReady(payload: Record<string, unknown> = {}): void {
        const user = this.getAuthorizedUser();
        if (!user) return;

        this.socket.emit(SET_READY, {
            token: user.token,
            guid: user.guid,
            ...payload
        });
    }

    startGame(payload: Record<string, unknown> = {}): void {
        const user = this.getAuthorizedUser();
        if (!user) return;

        this.socket.emit(START_GAME, {
            token: user.token,
            guid: user.guid,
            ...payload
        });
    }

    spawnUnit(type: 'sporomet' | 'champigneb' | 'eblekar' | 'pizdoglyad', x: number, y: number): void {
        const user = this.getAuthorizedUser();
        if (!user) return;

        this.socket.emit(CONFIG.SOCKET.SPAWN_UNIT, {
            guid: user.guid,
            token: user.token,
            type,
            x,
            y,
        });
    }

    async getLobbies(): Promise<ILobby[]> {
        const user = this.mediator.get<TUser | null>(
            this.mediator.getTriggerTypes().GET_STORE,
            'user'
        );
        const response = await fetch(`${HOST}/getLobbies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ guid: user?.guid ?? '' })
        });

        if (!response.ok) {
            throw new Error(`Failed to load lobbies: ${response.status}`);
        }

        const data = await response.json() as TResponse<ILobby[]>;

        if (data.result === 'ok' && Array.isArray(data.data)) {
            return data.data;
        }

        throw new Error(data.error?.message || 'Failed to load lobbies');
    }

    private handleCreateLobby(response: TResponse<boolean>): void {
        if (response?.result === 'ok' && response.data) {
            const CREATE_LOBBY_EVENT = this.mediator.getEventTypes().CREATE_LOBBY;
            this.mediator.call(CREATE_LOBBY_EVENT, response.data);
            return;
        }

        this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
    }

    private handleJoinToLobby(response: TResponse<boolean>): void {
        if (response?.result === 'ok' && response.data) {
            const JOIN_TO_LOBBY_EVENT = this.mediator.getEventTypes().JOIN_TO_LOBBY;
            this.mediator.call(JOIN_TO_LOBBY_EVENT, response.data);
            return;
        }

        this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
    }

    private handleLeaveLobby(response: TResponse<boolean>): void {
        if (response?.result === 'ok' && response.data) {
            const LEAVE_LOBBY_EVENT = this.mediator.getEventTypes().LEAVE_LOBBY;
            this.mediator.call(LEAVE_LOBBY_EVENT, response.data);
            return;
        }

        this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
    }

    private handleDropFromLobby(response: TResponse<boolean>): void {
        if (response?.result === 'ok' && response.data) {
            const DROP_FROM_LOBBY_EVENT = this.mediator.getEventTypes().DROP_FROM_LOBBY;
            this.mediator.call(DROP_FROM_LOBBY_EVENT, response.data);
            return;
        }

        this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
    }

    private handleSetReady(response: TResponse<boolean>): void {
        if (response?.result === 'ok' && response.data) {
            const SET_READY_EVENT = this.mediator.getEventTypes().SET_READY;
            this.mediator.call(SET_READY_EVENT, response.data);
            return;
        }

        this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
    }

    private handleLobbyUpdated(response: TResponse<ILobby>): void {
        if (response?.result === 'ok' && response.data) {
            const LOBBY_UPDATED_EVENT = this.mediator.getEventTypes().LOBBY_UPDATED;
            this.mediator.call(LOBBY_UPDATED_EVENT, response.data);
            return;
        }

        this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
    }

    private handleGetLobbys(response: TResponse<boolean>): void {
        if (response?.result === 'ok' && response.data) {
            const GET_LOBBYS_EVENT = this.mediator.getEventTypes().GET_LOBBYS;
            this.mediator.call(GET_LOBBYS_EVENT, response.data);
            return;
        }

        this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
    }

    private handleLobbysListUpdate(response: TResponse<ILobby[]>): void {
        if (response?.result === 'ok' && response.data) {
            const LOBBYS_LIST_UPDATED_EVENT = this.mediator.getEventTypes().LOBBYS_LIST_UPDATED;
            this.mediator.call(LOBBYS_LIST_UPDATED_EVENT, response.data);
            return;
        }

        this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
    }

    private handleStartGame(response: TResponse<boolean>): void {
        if (response?.result === 'ok' && response.data) {
            const GAME_STARTED = this.mediator.getEventTypes().GAME_STARTED;
            this.mediator.call(GAME_STARTED);
            return;
        }

        this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
    }

    private getAuthorizedUser(): TUser | null {
        const ERROR = this.mediator.getEventTypes().ERROR;
        const user = this.mediator.get<TUser | null>(
            this.mediator.getTriggerTypes().GET_STORE,
            'user'
        );

        if (!user || !user.token || !user.guid) {
            this.mediator.call(ERROR, { code: 13, message: 'Недостаточно данных авторизованного пользователя' });
            return null;
        }

        return user;
    }

    private handleRegistration(response: TResponse<TUser>): void {
        if (response?.result === 'ok' && response.data) {
            const SET_STORE = this.mediator.getTriggerTypes().SET_STORE;
            const USER_REGISTERED = this.mediator.getEventTypes().USER_REGISTERED;

            this.mediator.get(SET_STORE, {
                name: 'user',
                value: response.data
            });

            authStorage.setAuth(response.data.token, response.data);
            this.mediator.call(USER_REGISTERED, response.data);
            this.lobbyStart();
            return;
        }

        this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
    }

    private handleLogin(response: TResponse<TUser>) {
        if (response?.result === 'ok' && response.data) {
            const SET_STORE = this.mediator.getTriggerTypes().SET_STORE;
            const LOGIN_EVENT = this.mediator.getEventTypes().LOGIN;

            this.mediator.get(SET_STORE, {
                name: 'user',
                value: response.data
            });

            authStorage.setAuth(response.data.token, response.data);
            this.mediator.call(LOGIN_EVENT, response.data);
            this.lobbyStart();
        } else {
            this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
        }
    }

    private handleLogout(response: TResponse<boolean>) {
        const CLEAR_STORE = this.mediator.getTriggerTypes().CLEAR_STORE;
        const USER_LOGGED_OUT = this.mediator.getEventTypes().USER_LOGGED_OUT;

        this.mediator.get(CLEAR_STORE, 'user');
        this.mediator.call(USER_LOGGED_OUT);
    }

    private handleLobbyStart(response: TResponse<boolean>) {
        if (response?.result !== 'ok') {
            this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
        }
        // socketId зарегистрирован на сервере — навигацию не делаем здесь,
        // она произойдёт при получении 'game:started'
    }

    private handleGameStarted(response: TResponse<boolean>) {
        if (response?.result === 'ok' && response.data) {
            const GAME_STARTED_EVENT = this.mediator.getEventTypes().GAME_STARTED;
            this.mediator.call(GAME_STARTED_EVENT, response.data);
            return;
        }

        this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
    }

    private handleGameState(response: TResponse<TArmyState>) {
        if (response?.result !== 'ok' || !response.data) return;
        const GAME_STATE_UPDATED = this.mediator.getEventTypes().GAME_STATE_UPDATED;
        this.mediator.call(GAME_STATE_UPDATED, response.data);
    }

    private handleGameOver(data: TResponse<{ message: string }>) {
        const GAME_OVER_EVENT = this.mediator.getEventTypes().GAME_OVER;
        this.mediator.call(GAME_OVER_EVENT, data);
    }
}

export default Server;
