import { io, Socket } from "socket.io-client";
import CONFIG from '../../config';
import Mediator from '../Mediator/Mediator';
import { TResponse, TUser, TError } from "./types";
import { validateLogin, validatePassword, validatePasswordMatch, validatePasswordNotLogin } from "../../utils/validation";

const { HOST } = CONFIG;

class Server {
    mediator: Mediator;
    socket: Socket;
    showErrorCb: (error: TError) => void = () => { };

    constructor(mediator: Mediator) {
        this.mediator = mediator;
        this.socket = io(HOST);

        this.socket.on("connect", () => {
            console.log('[Server] Подключено к серверу');
        });

        this.socket.on(CONFIG.SOCKET.REGISTRATION, (data) => this.handleRegistration(data));
        this.socket.on(CONFIG.SOCKET.LOGIN, (data) => this.handleLogin(data));
        this.socket.on(CONFIG.SOCKET.LOGOUT, (data) => this.handleLogout(data));
    }

    private setError(error: TError): void {
        this.showErrorCb(error);
    }

    showError(cb: (error: TError) => void) {
        this.showErrorCb = cb;
    }

    async register(username: string, password: string, confirmPassword?: string): Promise<boolean> {
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

        this.socket.emit(CONFIG.SOCKET.REGISTRATION, { 
            name: username, 
            password,
            passwordRepeat: confirmPassword 
        });
        return true;
    }

    login(username: string, password: string): void {
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

        this.socket.emit(CONFIG.SOCKET.LOGIN, { 
            name: username, 
            password 
        });
    }

    async logout(): Promise<boolean> {
        const { GET_STORE } = this.mediator.getTriggerTypes();
        const user = this.mediator.get<TUser | null>(GET_STORE, 'user');
        
        if (!user?.token || !user?.guid) {
            this.setError({ code: 401, text: 'Пользователь не авторизован' });
            return false;
        }

        this.socket.emit(CONFIG.SOCKET.LOGOUT, { 
            token: user.token,
            guid: user.guid 
        });
        return true;
    }

    private handleRegistration(response: TResponse<TUser>) {
        console.log('[Server] Ответ регистрации:', response);

        if (response?.result === 'ok' && response.data) {
            const { SET_STORE } = this.mediator.getTriggerTypes();
            const { USER_REGISTERED } = this.mediator.getEventTypes();
            
            this.mediator.get(SET_STORE, {
                name: 'user',
                value: response.data
            });
            
            this.mediator.call(USER_REGISTERED, response.data);
        } else if (response?.error) {
            this.setError(response.error);
        }
    }

    private handleLogin(response: TResponse<TUser>) {
        console.log('[Server] Ответ входа:', response);

        if (response?.result === 'ok' && response.data) {
            const { SET_STORE } = this.mediator.getTriggerTypes();
            const { USER_LOGGED_IN } = this.mediator.getEventTypes();
            
            this.mediator.get(SET_STORE, {
                name: 'user',
                value: response.data
            });
            
            this.mediator.call(USER_LOGGED_IN, response.data);
        } else if (response?.error) {
            this.setError(response.error);
        }
    }

    private handleLogout(response: TResponse<boolean>) {
        console.log('[Server] Ответ выхода:', response);

        if (response?.result === 'ok' && response.data) {
            const { CLEAR_STORE } = this.mediator.getTriggerTypes();
            const { USER_LOGGED_OUT } = this.mediator.getEventTypes();
            
            this.mediator.get(CLEAR_STORE, 'user');
            
            this.mediator.call(USER_LOGGED_OUT);
        } else if (response?.error) {
            this.setError(response.error);
        }
    }

    /**
     * Проверка подключения к серверу
     */
    isConnected(): boolean {
        return this.socket.connected;
    }

    /**
     * Отключение от сервера
     */
    disconnect(): void {
        this.socket.disconnect();
    }
}

export default Server;
