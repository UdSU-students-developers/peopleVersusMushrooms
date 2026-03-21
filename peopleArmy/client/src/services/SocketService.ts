import { io, Socket } from 'socket.io-client';
import CONFIG from '../config';

interface MessageData {
    text: string;
    timestamp: string;
}

interface BroadcastData {
    type: string;
    data: MessageData;
    from: string;
    timestamp: string;
}

/**
 * Сервис для работы с сокетами
 * Управляет подключением, отправкой и получением сообщений
 */
class SocketService {
    private socket: Socket | null = null;
    private connected: boolean = false;
    private onMessageCallback: ((data: BroadcastData) => void) | null = null;

    /**
     * Подключение к серверу сокетов
     * Устанавливает соединение и обработчики событий
     */
    connect(): void {
        if (this.socket && this.connected) {
            return;
        }
        
        this.socket = io(CONFIG.SERVER_URL);
        
        this.socket.on('connect', () => {
            console.log('[SocketService] Подключено к серверу');
            this.connected = true;
        });
        
        this.socket.on('disconnect', () => {
            console.log('[SocketService] Отключено от сервера');
            this.connected = false;
        });
        
        this.socket.on(CONFIG.SOCKET.EVENTS.MESSAGE_TO_CLIENTS, (data: BroadcastData) => {
            console.log('[SocketService] Получено сообщение от сервера:', data);
            this.onMessage(data);
        });
    }

    /**
     * Отключение от сервера сокетов
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
        }
    }

    /**
     * Отправка сообщения на сервер
     * @param message - текст сообщения для отправки
     */
    sendMessage(message: string): void {
        if (this.socket && this.connected) {
            this.socket.emit(CONFIG.SOCKET.EVENTS.MESSAGE_FROM_CLIENT, {
                text: message,
                timestamp: new Date().toISOString()
            });
        } else {
            console.error('[SocketService] Нет подключения к серверу');
        }
    }

    /**
     * Установка callback для обработки входящих сообщений
     * @param callback - функция для обработки сообщений
     */
    setOnMessageCallback(callback: (data: BroadcastData) => void): void {
        this.onMessageCallback = callback;
    }

    /**
     * Внутренний метод для обработки входящих сообщений
     * @param data - данные сообщения
     */
    private onMessage(data: BroadcastData): void {
        if (this.onMessageCallback) {
            this.onMessageCallback(data);
        }
    }

    /**
     * Проверка статуса подключения
     * @returns true если подключено, иначе false
     */
    isConnected(): boolean {
        return this.connected;
    }
}

export default new SocketService();
