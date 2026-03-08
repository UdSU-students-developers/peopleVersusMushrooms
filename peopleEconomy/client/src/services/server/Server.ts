import md5 from 'md5';
import { io, Socket } from 'socket.io-client';
import CONFIG, { EMESSAGES } from '../../config';
import { TAnswer, TUser } from "./types";

const HOST = CONFIG.HOST;

class Server {
    socket: Socket;
    chatInterval: NodeJS.Timer | null = null;

    constructor() {
        this.socket = io(HOST);
        this.socket.on('connect', () => console.log('КОНнЕНКШОН!!! id:', this.socket.id));
        this.socket.on("disconnect", () => console.log('дисконнект. id:', this.socket.id));
        this.socket.on(EMESSAGES.CHECK, (data: string) => console.log(data));
        this.socket.on(EMESSAGES.SEND_TO_ALL, (data: { name: string, text: string }) => console.log(data));
        this.socket.on(EMESSAGES.LOGIN, (data: TAnswer<TUser>) => console.log(data));
        this.socket.on(EMESSAGES.REGISTRATION, (data: TAnswer<TUser>) => console.log(data));
        this.socket.on(EMESSAGES.LOGOUT, (data: TAnswer<TUser>) => console.log(data));
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