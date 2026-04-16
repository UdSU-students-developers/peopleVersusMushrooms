import md5 from 'md5';
import { io, Socket } from 'socket.io-client';
import CONFIG, { MEDIATOR, EMESSAGES } from '../../config';
import { ILobby, TAnswer, TMap, TUser } from "./types";
import Mediator from '../Mediator/Mediator';

const HOST = CONFIG.HOST;

class Server {
    socket: Socket;
    chatInterval: NodeJS.Timer | null = null;
    mediator: Mediator;
    user: any;

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
                this.mediator.call(LOGIN, result);
                console.log(result)
                this.user = result
            }
        });

        this.socket.on(MEDIATOR.EVENTS.REGISTRATION, (data: TAnswer<TUser>) => {
            const result = this._validate(data);
            if (result) {
                const { REGISTRATION } = this.mediator.getEventTypes();
                this.mediator.call(REGISTRATION, result);
            }
        });

        this.socket.on(MEDIATOR.EVENTS.LOGOUT, (data: TAnswer<TUser>) => {
            const result = this._validate(data);
            if (result) {
                const { LOGOUT } = this.mediator.getEventTypes();
                this.mediator.call(LOGOUT, result);
            }
        });

        this.socket.on(MEDIATOR.EVENTS.SET_READY, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { SET_READY } = this.mediator.getEventTypes();
                this.mediator.call(SET_READY, result);
            }
        });

        this.socket.on(MEDIATOR.EVENTS.CREATE_LOBBY, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { CREATE_LOBBY } = this.mediator.getEventTypes();
                this.mediator.call(CREATE_LOBBY, result);
            }
        });

        this.socket.on(MEDIATOR.EVENTS.JOIN_TO_LOBBY, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { JOIN_TO_LOBBY } = this.mediator.getEventTypes();
                this.mediator.call(JOIN_TO_LOBBY, result);
            }
        });

        this.socket.on(MEDIATOR.EVENTS.LEAVE_LOBBY, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { LEAVE_LOBBY } = this.mediator.getEventTypes();
                this.mediator.call(LEAVE_LOBBY, result);
            }
        });

        this.socket.on(EMESSAGES.DROP_FROM_LOBBY, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { DROP_FROM_LOBBY } = this.mediator.getEventTypes();
                this.mediator.call(DROP_FROM_LOBBY, result);
            }
        });

        this.socket.on(MEDIATOR.EVENTS.START_GAME, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { START_GAME } = this.mediator.getEventTypes();
                this.mediator.call(START_GAME, result);
            }
        });

        this.socket.on(MEDIATOR.EVENTS.LOBBY_UPDATED, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { LOBBY_UPDATED } = this.mediator.getEventTypes();
                this.mediator.call(LOBBY_UPDATED, result);
            }
        });

        this.socket.on(MEDIATOR.EVENTS.LOBBIES_LIST_UPDATED, (data: TAnswer<any>) => {
            const result = this._validate(data);
            if (result) {
                const { LOBBIES_LIST_UPDATED } = this.mediator.getEventTypes();
                this.mediator.call(LOBBIES_LIST_UPDATED, result);
            }
        });

        this.socket.on(MEDIATOR.EVENTS.GENERATE_MAP, (data: TAnswer<TMap>) => {
            const result = this._validate(data);
            if (result) {
                const { GENERATE_MAP } = this.mediator.getEventTypes();
                this.mediator.call(GENERATE_MAP, result);
            }
        });
    }

    private _validate(data: any) {
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

    setReady(guid: string): void {
        console.log(guid)
        this.socket.emit(MEDIATOR.EVENTS.SET_READY, { guid });
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

    createLobby(guid: string, lobbyName: string, role: string): void {
        this.socket.emit(MEDIATOR.EVENTS.CREATE_LOBBY, { guid, lobbyName, role });
    }

    joinToLobby(guid: string, lobbyGuid: string, role: string): void {
        this.socket.emit(MEDIATOR.EVENTS.JOIN_TO_LOBBY, { guid, lobbyGuid, role });
    }

    leaveLobby(guid: string): void {
        this.socket.emit(MEDIATOR.EVENTS.LEAVE_LOBBY, { guid });
    }

    dropFromLobby(guid: string, targetGuid: string): void {
        this.socket.emit(EMESSAGES.DROP_FROM_LOBBY, { guid, targetGuid });
    }

    startGame(guid: string): void {
        this.socket.emit(MEDIATOR.EVENTS.START_GAME, { guid });
    }

    getLobbies(): ILobby[] | null {
        return this.mediator.get<ILobby[]>(MEDIATOR.TRIGGERS.GET_LOBBIES);
    }

    generateMap(seed?: number, water?: number, mountains?: number, iron?: number, oil?: number): void {
        const params: any = { width: CONFIG.WIDTH, height: CONFIG.HEIGHT };

        if (seed !== undefined) params.seed = seed;
        if (water !== undefined) params.water = water;
        if (mountains !== undefined) params.mountains = mountains;
        if (iron !== undefined) params.iron = iron;
        if (oil !== undefined) params.oil = oil;

        this.socket.emit(MEDIATOR.EVENTS.GENERATE_MAP, params);
    }

    setGeneratedMap(data: TMap): void {
        this.mediator.set(MEDIATOR.TRIGGERS.SET_GENERATED_MAP, () => data);
    }

    getGeneratedMap(): TMap | null {
        return this.mediator.get(MEDIATOR.TRIGGERS.GET_GENERATED_MAP);
    }
}

export default Server;
