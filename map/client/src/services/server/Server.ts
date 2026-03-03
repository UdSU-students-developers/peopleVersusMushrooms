import CONFIG from '../../config';
import Store from "../Store/Store";
import { TAnswer, TError, TUser } from "./types";
import { io, Socket } from 'socket.io-client';

const HOST = CONFIG.HOST;

class Server {
    HOST = HOST;
    store: Store;
    chatInterval: NodeJS.Timer | null = null;
    showErrorCb: (error: TError) => void = () => { };
    socket: Socket | null = null;
    socketConnected: boolean = false;
    private eventHandlers: Map<string, Function[]> = new Map();

    constructor(store: Store) {
        this.store = store;
    }

    initSocket(): void {
        if (this.socket) return;

        const token = this.store.getToken();
        this.socket = io(this.HOST, {
            query: token ? { token } : {},
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
            this.socketConnected = true;
            this.emitEvent('connect');
        });

        this.socket.on('disconnect', (reason) => {
            this.socketConnected = false;
            this.emitEvent('disconnect', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.emitEvent('connect_error', error);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.setError(error.message);
            this.emitEvent('error', error);
        });

        this.socket.onAny((eventName, ...args) => {
            this.emitEvent(eventName, ...args);
        });
    }

    on(event: string, callback: Function): void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event)?.push(callback);
    }

    private emitEvent(event: string, ...args: any[]): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    private emit(event: string, data: any): void {
        if (!this.socket || !this.socketConnected) {
            return;
        }
        this.socket.emit(event, data);
    }

    disconnectSocket(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.socketConnected = false;
            this.eventHandlers.clear();
        }
    }

    private setError(error: TError): void {
        this.showErrorCb(error);
    }

    showError(cb: (error: TError) => void) {
        this.showErrorCb = cb;
    }
}

export default Server;