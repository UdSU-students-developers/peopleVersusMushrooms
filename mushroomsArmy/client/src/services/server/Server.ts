import { io, Socket } from "socket.io-client";
import md5 from 'md5';
import CONFIG from '../../config';
import Mediator from '../Mediator/Mediator';
import { TArmyState, TResponse, TUser } from './types';
import { authStorage } from '../../utils/authStorage';

const { HOST, SOCKET } = CONFIG;
const { REGISTRATION, LOGIN, LOGOUT, LOBBY_START, GAME_STATE, GAME_OVER } = SOCKET;

class Server {
    mediator: Mediator;
    socket: Socket;

    constructor(mediator: Mediator) {
        this.mediator = mediator;
        this.socket = io(HOST);

        this.socket.on(REGISTRATION, (data) => this.handleRegistration(data));
        this.socket.on(LOGIN, (data) => this.handleLogin(data));
        this.socket.on(LOGOUT, (data) => this.handleLogout(data));
        this.socket.on(LOBBY_START, (data) => this.handleLobbyStart(data));
        this.socket.on(GAME_STATE, (data) => this.handleGameState(data));
        this.socket.on(GAME_OVER, (data) => this.handleGameOver(data));
    }

    register(username: string, password: string, passwordRepeat: string): void {
        this.socket.emit(REGISTRATION, {
            name: username,
            passwordHash: md5(password),
        });
    }

    login(username: string, password: string): void {
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
        if (response?.result === 'ok' && response.data) {
            const GAME_STARTED = this.mediator.getEventTypes().GAME_STARTED;
            this.mediator.call(GAME_STARTED);
        } else {
            this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
        }
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