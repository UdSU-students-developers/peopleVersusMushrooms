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
        /*
        const loginValidation = validateLogin(username);
        if (!loginValidation.isValid) {
            this.setError({ code: 422, text: loginValidation.error! });
            return false;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            this.setError({ code: 422, text: passwordValidation.error! });
            return false;
        }

        if (confirmPassword) {
            const matchValidation = validatePasswordMatch(password, confirmPassword);
            if (!matchValidation.isValid) {
                this.setError({ code: 422, text: matchValidation.error! });
                return false;
            }
        }

        const notLoginValidation = validatePasswordNotLogin(username, password);
        if (!notLoginValidation.isValid) {
            this.setError({ code: 422, text: notLoginValidation.error! });
            return false;
        }
        */

        this.socket.emit(REGISTRATION, {
            name: username,
            password,
            passwordRepeat,
        });
    }

    login(username: string, password: string): void {
        /*
        const loginValidation = validateLogin(username);
        if (!loginValidation.isValid) {
            this.setError({ code: 422, text: loginValidation.error! });
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            this.setError({ code: 422, text: passwordValidation.error! });
            return;
        }
        */

        this.socket.emit(LOGIN, {
            name: username,
            password
        });
    }

    logout(): void {
        const { GET_STORE } = this.mediator.getTriggerTypes();
        const { SHOW_ERROR } = this.mediator.getEventTypes();
        const user = this.mediator.get<TUser | null>(GET_STORE, 'user');

        if (!user) {
            this.mediator.call(SHOW_ERROR, {});
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
            const { SET_STORE } = this.mediator.getTriggerTypes();
            const { USER_REGISTERED, SHOW_ERROR } = this.mediator.getEventTypes();
            this.mediator.get(SET_STORE, {
                name: 'user',
                value: response.data
            });
            this.mediator.call(USER_REGISTERED, response.data);
            return;
        } 
        if (response?.error) {
            this.mediator.call(SHOW_ERROR, response.error);
        }
    }

    private handleLogin(response: TResponse<TUser>) {
        console.log('[Server] Ответ входа:', response);

        if (response?.result === 'ok' && response.data) {
            const { SET_STORE } = this.mediator.getTriggerTypes();
            const { LOGIN, SHOW_ERROR } = this.mediator.getEventTypes();

            this.mediator.get(SET_STORE, {
                name: 'user',
                value: response.data
            });

            this.mediator.call(LOGIN, response.data);
        } else if (response?.error) {
            this.mediator.call(SHOW_ERROR, response.error);
        }
    }

    private handleLogout(response: TResponse<boolean>) {
        console.log('[Server] Ответ выхода:', response);

        if (response?.result === 'ok' && response.data) {
            const { CLEAR_STORE } = this.mediator.getTriggerTypes();
            const { USER_LOGGED_OUT, SHOW_ERROR } = this.mediator.getEventTypes();

            this.mediator.get(CLEAR_STORE, 'user');

            this.mediator.call(USER_LOGGED_OUT);
        } else if (response?.error) {
            this.mediator.call(SHOW_ERROR, response.error);
        }
    }
}

export default Server;