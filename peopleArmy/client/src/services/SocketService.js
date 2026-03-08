import { io } from 'socket.io-client';
import CONFIG from '../config';

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
    }
    
    connect() {
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
        
        this.socket.on(CONFIG.SOCKET.EVENTS.MESSAGE_TO_CLIENTS, (data) => {
            console.log('[SocketService] Получено сообщение от сервера:', data);
            this.onMessage(data);
        });
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
        }
    }
    
    sendMessage(message) {
        if (this.socket && this.connected) {
            this.socket.emit(CONFIG.SOCKET.EVENTS.MESSAGE_FROM_CLIENT, {
                text: message,
                timestamp: new Date().toISOString()
            });
        } else {
            console.error('[SocketService] Нет подключения к серверу');
        }
    }
    
    onMessage(data) {
        // Метод для переопределения в компонентах
        console.log('[SocketService] Получено сообщение:', data);
    }
    
    isConnected() {
        return this.connected;
    }
}

export default new SocketService();
