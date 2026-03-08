import React, { useState, useEffect } from 'react';
import SocketService from '../services/SocketService';
import './SocketChat.css';

const SocketChat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Подключаемся к сокету при монтировании компонента
        SocketService.connect();
        setIsConnected(SocketService.isConnected());

        // Переопределяем метод для обработки входящих сообщений
        SocketService.onMessage = (data) => {
            setMessages(prev => [...prev, {
                ...data,
                id: Date.now()
            }]);
        };

        // Проверяем статус подключения
        const checkConnection = setInterval(() => {
            setIsConnected(SocketService.isConnected());
        }, 1000);

        return () => {
            clearInterval(checkConnection);
        };
    }, []);

    const handleSendMessage = () => {
        if (message.trim()) {
            SocketService.sendMessage(message.trim());
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="socket-chat">
            <div className="socket-chat-header">
                <h3>Тестовый чат через сокеты</h3>
                <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? 'Подключено' : 'Отключено'}
                </div>
            </div>
            
            <div className="messages-container">
                <div className="messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className="message">
                            <div className="message-header">
                                <span className="message-from">
                                    {msg.from ? `Клиент ${msg.from.slice(0, 8)}` : 'Сервер'}
                                </span>
                                <span className="message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="message-content">
                                {msg.data?.text || msg.text || 'Пустое сообщение'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="input-container">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Введите сообщение..."
                    disabled={!isConnected}
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!isConnected || !message.trim()}
                >
                    Отправить
                </button>
            </div>
        </div>
    );
};

export default SocketChat;
