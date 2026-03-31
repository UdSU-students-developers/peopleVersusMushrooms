import md5 from 'md5';
import { io, Socket } from 'socket.io-client';
import CONFIG, { MEDIATOR, EMESSAGES } from '../../config';
import { TAnswer, TUser } from "./types";
import Mediator from '../Mediator/Mediator';

const HOST = CONFIG.HOST;

class Server {
    socket: Socket;
    chatInterval: NodeJS.Timer | null = null;
    mediator: Mediator;

    constructor(mediator: Mediator) {
        this.mediator = mediator;
        this.socket = io(HOST);

        this.socket.on('connect', () => console.log('КОНнЕНКШОН!!! id:', this.socket.id));
        this.socket.on("disconnect", () => console.log('дисконнект. id:', this.socket.id));

        this.socket.on(EMESSAGES.CHECK, (data: string) => {
            this.mediator.call(EMESSAGES.CHECK, data);
        });

        this.socket.on(EMESSAGES.SEND_TO_ALL, (data: { name: string, text: string }) => {
            this.mediator.call(EMESSAGES.SEND_TO_ALL, data);
        });

        this.socket.on(MEDIATOR.EVENTS.LOGIN, (data: TAnswer<TUser>) => {
            const result = this._validate(data);
            if (result) {
                const { LOGIN } = this.mediator.getEventTypes();
                this.mediator.call(LOGIN, data);
            }
        });

        this.socket.on(MEDIATOR.EVENTS.REGISTRATION, (data: TAnswer<TUser>) => {
            const result = this._validate(data);
            if (result) {
                const { REGISTRATION } = this.mediator.getEventTypes();
                this.mediator.call(REGISTRATION, data);
            }
        });

        this.socket.on(MEDIATOR.EVENTS.LOGOUT, (data: TAnswer<TUser>) => {
            const result = this._validate(data);
            if (result) {
                const { LOGOUT } = this.mediator.getEventTypes();
                this.mediator.call(LOGOUT, data);
            }
        });

        this.socket.on(EMESSAGES.CREATE_LOBBY, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { CREATE_LOBBY } = this.mediator.getEventTypes();
                this.mediator.call(CREATE_LOBBY, data);
            }
        });

        this.socket.on(EMESSAGES.JOIN_TO_LOBBY, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { JOIN_TO_LOBBY } = this.mediator.getEventTypes();
                this.mediator.call(JOIN_TO_LOBBY, data);
            }
        });

        this.socket.on(EMESSAGES.LEAVE_LOBBY, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { LEAVE_LOBBY } = this.mediator.getEventTypes();
                this.mediator.call(LEAVE_LOBBY, data);
            }
        });

        this.socket.on(EMESSAGES.DROP_FROM_LOBBY, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { DROP_FROM_LOBBY } = this.mediator.getEventTypes();
                this.mediator.call(DROP_FROM_LOBBY, data);
            }
        });

        this.socket.on(EMESSAGES.START_GAME, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { START_GAME } = this.mediator.getEventTypes();
                this.mediator.call(START_GAME, data);
            }
        });

        this.socket.on(EMESSAGES.GET_LOBBIES, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { GET_LOBBIES } = this.mediator.getEventTypes();
                this.mediator.call(GET_LOBBIES, data);
            }
        });

        this.socket.on(EMESSAGES.LOBBY_UPDATED, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { LOBBY_UPDATED } = this.mediator.getEventTypes();
                this.mediator.call(LOBBY_UPDATED, data);
            }
        });

        this.socket.on(EMESSAGES.LOBBIES_LIST_UPDATED, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { LOBBIES_LIST_UPDATED } = this.mediator.getEventTypes();
                this.mediator.call(LOBBIES_LIST_UPDATED, data);
            }
        });
    }

    _validate(data: any) {
        if (data.result === "ok") {
            return data.data;
        }
        const { SHOW_ERROR } = this.mediator.getEventTypes();
        this.mediator.call(SHOW_ERROR, data.error);
        return null;
    }

    private async request<T>(method: string, params: { [key: string]: string | number } = {}): Promise<T | null> {
        try {
            params.method = method;
            const token = this.mediator.get<string>(MEDIATOR.TRIGGERS.GET_TOKEN);
            if (token) {
                params.token = token;
            }
            const response = await fetch(`${HOST}/?${Object.keys(params).map(key => `${key}=${params[key]}`).join('&')}`);
            const answer: TAnswer<T> = await response.json();
            if (answer.result === 'ok' && answer.data) {
                return answer.data;
            }
            //answer.error && this.setError(answer.error);
            return null;
        } catch (e) {
            console.log(e);
            /*this.setError({
                code: 9000,
                text: 'Unknown error',
            });*/
            return null;
        }
    }

    check(name: string, text: string): void {
        this.socket.emit(EMESSAGES.CHECK, { name, text });
    }

    login(login: string, password: string): void {
        const passwordHash = md5(`${login}${password}`);
        this.socket.emit(MEDIATOR.EVENTS.LOGIN, { login, passwordHash });
    };

    registration(login: string, password: string): void {
        const passwordHash = md5(`${login}${password}`);
        this.socket.emit(MEDIATOR.EVENTS.REGISTRATION, { login, passwordHash });
    }

    logout(): void {
        this.socket.emit(MEDIATOR.EVENTS.LOGOUT);
    }

    createLobby(lobbyName: string): void {
        this.socket.emit(EMESSAGES.CREATE_LOBBY, { lobbyName });
    }

    joinToLobby(lobbyGuid: string): void {
        this.socket.emit(EMESSAGES.JOIN_TO_LOBBY, { lobbyGuid });
    }

    leaveLobby(): void {
        this.socket.emit(EMESSAGES.LEAVE_LOBBY, {});
    }

    dropFromLobby(targetGuid: string): void {
        this.socket.emit(EMESSAGES.DROP_FROM_LOBBY, { targetGuid });
    }

    startGame(): void {
        this.socket.emit(EMESSAGES.START_GAME, {});
    }

    getLobbies(): void {
        this.socket.emit(EMESSAGES.GET_LOBBIES, {});
    }
}

export default Server;