import { io, Socket } from "socket.io-client";
import CONFIG from '../../config';
import Mediator from '../Mediator/Mediator';
import { TResponse, TUser } from './types';
import { authStorage } from '../../utils/authStorage';

const { HOST, SOCKET } = CONFIG;
const { REGISTRATION, LOGIN, LOGOUT, LOBBY_START, VALIDATE_TOKEN } = SOCKET;

class Server {
    mediator: Mediator;
    socket: Socket;

    constructor(mediator: Mediator) {
        this.mediator = mediator;
        this.socket = io(HOST);

        this.socket.on("connect", () => {
            console.log(`[Server] Подключено к серверу ${HOST}`);

            this.socket.on(REGISTRATION, (data) => this.handleRegistration(data));
            this.socket.on(LOGIN, (data) => this.handleLogin(data));
            this.socket.on(LOGOUT, (data) => this.handleLogout(data));
            this.socket.on(LOBBY_START, (data) => this.handleLobbyStart(data));
        });
    }

    register(username: string, password: string, passwordRepeat: string): void {
        this.socket.emit(REGISTRATION, {
            name: username,
            password,
            passwordRepeat,
        });
    }

    login(username: string, password: string): void {
        this.socket.emit(LOGIN, {
            name: username,
            password
        });
    }

    logout(): void {
        const ERROR = this.mediator.getEventTypes().ERROR;
        const user = this.mediator.get<TUser | null>(
            this.mediator.getTriggerTypes().GET_STORE,
            'user'
        );

        if (!user) {
            this.mediator.call(ERROR, { code: 13, text: 'Пользователь не найден' });
            return;
        }

        this.socket.emit(LOGOUT, {
            token: user.token,
            guid: user.guid
        });
    }

    lobbyStart(): void {
        const ERROR = this.mediator.getEventTypes().ERROR;
        const user = this.mediator.get<any>(
            this.mediator.getTriggerTypes().GET_STORE,
            'user'
        );

        if (!user || !user.token || !user.guid) {
            this.mediator.call(ERROR, { code: 13, text: 'Недостаточно данных' });
            return;
        }

        this.socket.emit(LOBBY_START, {
            token: user.token,
            guid: user.guid
        });
    }

    authValidate(token: string): Promise<any> {
        return new Promise((resolve) => {
            this.socket.emit(VALIDATE_TOKEN, { token });
            this.socket.once(VALIDATE_TOKEN, (response) => resolve(response));
        });
    }

    private handleRegistration(response: TResponse<any>): void {
        console.log('[Server] Ответ регистрации:', response);

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

    private handleLogin(response: TResponse<any>) {
        console.log('[Server] Ответ входа:', response);

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
        console.log('[Server] Ответ выхода:', response);

        const CLEAR_STORE = this.mediator.getTriggerTypes().CLEAR_STORE;
        const USER_LOGGED_OUT = this.mediator.getEventTypes().USER_LOGGED_OUT;

        this.mediator.get(CLEAR_STORE, 'user');
        this.mediator.call(USER_LOGGED_OUT);
    }

    private handleLobbyStart(response: TResponse<boolean>) {
        console.log('[Server] Ответ запуска игры:', response);

        if (response?.result === 'ok' && response.data) {
            const GAME_STARTED = this.mediator.getEventTypes().GAME_STARTED;
            this.mediator.call(GAME_STARTED);
        } else {
            this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
        }
    }
}

export default Server;