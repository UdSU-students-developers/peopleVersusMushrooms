import { io, Socket } from "socket.io-client";
import CONFIG from '../../config';
import Mediator from '../Mediator/Mediator';
import { TResponse, TUser, TError } from './types';

const { HOST, SOCKET } = CONFIG;
const { REGISTRATION, LOGIN, LOGOUT } = SOCKET;

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
        const user = this.mediator.get<TUser | null>(this.mediator.getTriggerTypes().GET_STORE, 'user');

        if (!user) {
            this.mediator.call(ERROR, {});
            return;
        }

        this.socket.emit(CONFIG.SOCKET.LOGOUT, {
            token: user.token,
            guid: user.guid
        });
    }

    private handleRegistration(response: TResponse<TUser>): void {
        console.log('[Server] Ответ регистрации:', response);

        if (response?.result === 'ok' && response.data) {
            const SET_STORE = this.mediator.getTriggerTypes().SET_STORE;
            const USER_REGISTERED = this.mediator.getEventTypes().USER_REGISTERED;
            const ERROR = this.mediator.getEventTypes().ERROR;
            this.mediator.get(SET_STORE, {
                name: 'user',
                value: response.data
            });
            this.mediator.call(USER_REGISTERED, response.data);
            return;
        } 
        this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
    }

    private handleLogin(response: TResponse<TUser>) {
        console.log('[Server] Ответ входа:', response);

        if (response?.result === 'ok' && response.data) {
            const SET_STORE = this.mediator.getTriggerTypes().SET_STORE;
            const LOGIN = this.mediator.getEventTypes().LOGIN;

            this.mediator.get(SET_STORE, {
                name: 'user',
                value: response.data
            });

            this.mediator.call(LOGIN, response.data);
        } else {
            this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
        }
    }

    private handleLogout(response: TResponse<boolean>) {
        console.log('[Server] Ответ выхода:', response);

        if (response?.result === 'ok' && response.data) {
            const CLEAR_STORE = this.mediator.getTriggerTypes().CLEAR_STORE;
            const USER_LOGGED_OUT = this.mediator.getEventTypes().USER_LOGGED_OUT;

            this.mediator.get(CLEAR_STORE, 'user');

            this.mediator.call(USER_LOGGED_OUT);
        } else {
            this.mediator.call(this.mediator.getEventTypes().ERROR, response.error);
        }
    }
}

export default Server;