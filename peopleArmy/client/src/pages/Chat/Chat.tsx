import React, { useState, useEffect } from 'react';
import { IBasePage } from '../PageManager';
import { io, Socket } from 'socket.io-client';
import CONFIG from '../../config';
import './Chat.css';

interface Message {
    id: string;
    text: string;
    from: string;
    timestamp: string;
}
const Chat: React.FC<IBasePage> = ({ mediator }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const client = io(CONFIG.SERVER_URL);
        setSocket(client);

        client.on('connect', () => setIsConnected(true));
        client.on('disconnect', () => setIsConnected(false));
        client.on(CONFIG.SOCKETS.MESSAGE_TO_CLIENTS, (data) => {
            setMessages((prev) => prev.concat({
                id: `${Date.now()}-${Math.random()}`,
                text: data?.data?.text || '',
                from: data?.data?.from || 'server',
                timestamp: data?.data?.timestamp || new Date().toISOString(),
            }));
        });

        return () => {
            client.disconnect();
        };
    }, []);

    const sendMessage = () => {
        const text = message.trim();
        if (!text || !socket) return;
        const user = mediator.get(CONFIG.MEDIATOR.TRIGGERS.GET_STORE, 'user') as { guid?: string } | null;
        const guid = user?.guid;
        if (!guid) return;
        socket.emit(CONFIG.SOCKETS.MESSAGE_FROM_CLIENT, {
            text,
            timestamp: new Date().toISOString(),
            guid,
        });
        setMessage('');
    };

    return (
        <div className="socket-chat">
            <div className="socket-chat-header">
                <h3>Чат через сокеты</h3>
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
                                    {msg.from}
                                </span>
                                <span className="message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="message-content">
                                {msg.text}
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
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Введите сообщение..."
                    disabled={!isConnected}
                />
                <button 
                    onClick={sendMessage}
                    disabled={!isConnected || !message.trim()}
                >
                    Отправить
                </button>
            </div>
        </div>  
    );  
};  

export default Chat;