class SocketManager {
    constructor(mediator, config) {
        this.mediator = mediator;
        this.config = config;
        this.io = null;
        
        // Регистрируем триггеры в медиаторе
        this.mediator.set(this.mediator.TRIGGERS.SOCKET_HANDLE_MESSAGE, this.handleMessage.bind(this));
        this.mediator.set(this.mediator.TRIGGERS.SOCKET_BROADCAST_TO_ALL, this.broadcastToAll.bind(this));
        
        // Подписываемся на события
        this.mediator.subscribe(this.mediator.EVENTS.SOCKET_MESSAGE_RECEIVED, (data) => {
            console.log(`[SocketManager] Получено сообщение:`, data);
        });
        
        this.mediator.subscribe(this.mediator.EVENTS.SOCKET_BROADCAST_MESSAGE, (data) => {
            console.log(`[SocketManager] Рассылка сообщения:`, data);
            this.broadcastToAll(data);
        });
    }
    
    initialize(server) {
        const { Server } = require('socket.io');
        this.io = new Server(server, {
            cors: {
                origin: "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        
        this.io.on(this.config.SOCKET.EVENTS.CONNECTION, (socket) => {
            console.log(`[Socket] Клиент подключился: ${socket.id}`);
            
            socket.on(this.config.SOCKET.EVENTS.MESSAGE_FROM_CLIENT, (data) => {
                console.log(`[Socket] Сообщение от клиента ${socket.id}:`, data);
                
                // Вызываем триггер через медиатор
                this.mediator.get(this.mediator.TRIGGERS.SOCKET_HANDLE_MESSAGE, {
                    socketId: socket.id,
                    message: data,
                    timestamp: new Date().toISOString()
                });
            });
            
            socket.on(this.config.SOCKET.EVENTS.DISCONNECT, () => {
                console.log(`[Socket] Клиент отключился: ${socket.id}`);
            });
        });
        
        console.log('[SocketManager] Сокеты инициализированы');
    }
    
    handleMessage(data) {
        // Генерируем событие о получении сообщения
        this.mediator.call(this.mediator.EVENTS.SOCKET_MESSAGE_RECEIVED, data);
        
        // Генерируем событие для рассылки всем клиентам
        // Рассылка произойдет через подписчика в конструкторе
        this.mediator.call(this.mediator.EVENTS.SOCKET_BROADCAST_MESSAGE, {
            type: 'message',
            data: data.message,
            from: data.socketId,
            timestamp: data.timestamp
        });
    }
    
    broadcastToAll(data) {
        if (this.io) {
            // Отправляем всем клиентам, кроме отправителя
            this.io.except(data.from).emit(this.config.SOCKET.EVENTS.MESSAGE_TO_CLIENTS, data);
            console.log(`[SocketManager] Сообщение разослано всем клиентам (кроме ${data.from}):`, data);
        }
    }
}

module.exports = SocketManager;
