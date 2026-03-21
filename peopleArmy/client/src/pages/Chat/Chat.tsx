import React, { useState, useEffect } from 'react';
import { IBasePage } from '../PageManager';
import SocketService from '../../services/SocketService';
import CONFIG from '../../config';
import './Chat.css';

const {EVENTS, TRIGGERS} = CONFIG.MEDIATOR;

interface Message {
    id: number;
    data?: { text: string; timestamp: string };
    text?: string;
    from?: string;
    timestamp: string;
}

/**
 * Компонент страницы чата с функционалом сокетов
 * Позволяет отправлять и получать сообщения в реальном времени
 */
const Chat: React.FC<IBasePage> = (props: IBasePage) => {
    const {mediator, server, store, setPage} = props;
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    /**
     * Инициализация подключения к сокетам и настройка обработчиков
     * Выполняется при монтировании компонента
     */
    useEffect(() => {
        // Сокет уже подключен в PageManager, просто проверяем статус
        setIsConnected(SocketService.isConnected());

        // Устанавливаем callback для обработки входящих сообщений
        SocketService.setOnMessageCallback((data) => {
            setMessages(prev => [...prev, {
                ...data,
                id: Date.now()
            }]);
        });

        // Проверяем статус подключения каждую секунду
        const checkConnection = setInterval(() => {
            setIsConnected(SocketService.isConnected());
        }, 1000);

        //тест медиатора
        mediator.set(TRIGGERS.TEST_TRIGGER, () => {
            return {status:'ok', from: 'Chat'};
        }   );

        const handleTestEvent = (data: any) => {
            console.log('Получено событие TEST_EVENT с данными:', data);
        };
        mediator.subscribe(EVENTS.TEST_EVENT, handleTestEvent);

        // Очистка при размонтировании
        return () => {
            clearInterval(checkConnection);
            mediator.unsubscribe(EVENTS.TEST_EVENT, handleTestEvent);
        };
    }, []);


    const handleTest = (): void => {
        mediator.call(EVENTS.TEST_EVENT, { message: 'Hello from Chat!' });
        const result = mediator.get(TRIGGERS.TEST_TRIGGER);
        console.log('[TEST_TRIGGER result]', result);
    };
    /**
     * Обработчик отправки сообщения
     * Проверяет валидность сообщения и отправляет через сокет
     */
    const handleSendMessage = (): void => {
        if (message.trim()) {
            SocketService.sendMessage(message.trim());
            setMessage('');
        }
    };

    /**
     * Обработчик нажатия Enter в поле ввода
     * @param e - событие клавиатуры
     */
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    /**
     * Форматирование времени сообщения для отображения
     * @param timestamp - строка с временным штампом ISO
     * @returns отформатированное время
     */
    const formatTime = (timestamp: string): string => {
        return new Date(timestamp).toLocaleTimeString();
    };

    /**
     * Получение текста сообщения из различных форматов
     * @param msg - объект сообщения
     * @returns текст сообщения
     */
    const getMessageText = (msg: Message): string => {
        return msg.data?.text || msg.text || 'Пустое сообщение';
    };

    /**
     * Получение имени отправителя
     * @param msg - объект сообщения
     * @returns имя отправителя
     */
    const getSenderName = (msg: Message): string => {
        return msg.from ? `Клиент ${msg.from.slice(0, 8)}` : 'Сервер';
    };

    /**
     * Обработчик выхода из системы
     */
    const handleLogout = (): void => {
        server.logout();
        
        const onLogoutResponse = (data: { result: string }) => {
            if (data.result === 'ok') {
                store.clearUser();
                setPage(0);
            }
        };
        
        server.onLogout(onLogoutResponse);
        
        setTimeout(() => {
            server.offLogout(onLogoutResponse);
        }, 1000);
    };

    return (
        <div className="socket-chat">
            <div className="socket-chat-header">
                <h3>Чат через сокеты</h3>
                <div className="header-actions">
                    <span className="user-name">Привет, {store.getUser()?.name}!</span>
                    <button className="logout-button" onClick={handleLogout}>
                        Выйти
                    </button>
                    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? 'Подключено' : 'Отключено'}
                    </div>
                </div>
            </div>
            
            <div className="messages-container">
                <div className="messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className="message">
                            <div className="message-header">
                                <span className="message-from">
                                    {getSenderName(msg)}
                                </span>
                                <span className="message-time">
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                            <div className="message-content">
                                {getMessageText(msg)}
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
            <button onClick={handleTest}>Test Mediator</button>
             
        </div>  
    );  
};  

export default Chat;