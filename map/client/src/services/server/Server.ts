import { io, Socket } from 'socket.io-client';
import CONFIG, { EMESSAGES } from '../../config';
import { TAnswer } from "./types";

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
    }

    private async request<T>(method: string, params: { [key: string]: string | number } = {}): Promise<T | null> {
        try {
            params.method = method;
            const token = 'default token'; //this.store.getToken();
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
}

export default Server;