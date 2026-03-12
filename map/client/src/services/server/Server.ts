import md5 from 'md5';
import { io, Socket } from 'socket.io-client';
import CONFIG, { EMESSAGES } from '../../config';
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

        this.socket.on(EMESSAGES.LOGIN, (data: TAnswer<TUser>) => {
            this.mediator.call(EMESSAGES.LOGIN, data);
        });

        this.socket.on(EMESSAGES.REGISTRATION, (data: TAnswer<TUser>) => {
            this.mediator.call(EMESSAGES.REGISTRATION, data);
        });

        this.socket.on(EMESSAGES.LOGOUT, (data: TAnswer<TUser>) => {
            this.mediator.call(EMESSAGES.LOGOUT, data);
        });
    }

    private async request<T>(method: string, params: { [key: string]: string | number } = {}): Promise<T | null> {
        try {
            params.method = method;
            const token = this.mediator.get<string>(EMESSAGES.GET_TOKEN);
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
        const rnd = Math.round(Math.random() * 100000);
        const passwordHash = md5(`${md5(`${login}${password}`)}${rnd}`)
        this.socket.emit(EMESSAGES.LOGIN, { login, passwordHash });
    };

    registration(login: string, password: string, nickname: string): void {
        const passwordHash = md5(`${login}${password}`);
        this.socket.emit(EMESSAGES.REGISTRATION, { login, passwordHash, nickname });
    }

    logout(): void {
        this.socket.emit(EMESSAGES.LOGOUT);
    }
}

export default Server;