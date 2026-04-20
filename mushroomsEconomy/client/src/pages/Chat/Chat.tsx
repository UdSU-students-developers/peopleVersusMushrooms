import React, { useEffect, useState, useRef, KeyboardEvent, useContext } from "react";
import { MediatorContext, ServerContext } from "../../App";
import { IBasePage, PAGES } from '../PageManager';
import { TUser, TMessage, TMessages } from "../../services/Server/types";
import CONFIG from "../../config";
import Button from "../../components/Button/Button";

import './Chat.css';

const Chat: React.FC<IBasePage> = ({setPage}) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);
    const { GET_STORE, SET_STORE } = CONFIG.MEDIATOR.TRIGGERS;
    const EVENTS = mediator.getEventTypes();
    const [messages, setMessages] = useState<TMessages>([]);
    const user = mediator.get<TUser | null>(GET_STORE, 'user');
    const messageRef = useRef<HTMLInputElement>(null);
    const storedMessages = mediator.get<TMessage>(GET_STORE, 'messages');

    useEffect(() => {
        const initialMessages = Array.isArray(storedMessages) ? storedMessages : [];
        setMessages(initialMessages);
        server.getMessages();

        const handleNewMessage = (message: TMessage) => {
            setMessages(prev => [...prev, message]);
            const currentMessages = mediator.get<TMessages>(GET_STORE, 'messages') || [];

            mediator.get(SET_STORE, { 
                name: 'messages', 
                value: [...currentMessages, message] 
            });
        };

        const handleMessagesLoaded = (loadedMessages: TMessages) => {
            setMessages(loadedMessages);
            mediator.get(SET_STORE, { 
                name: 'messages', 
                value: loadedMessages 
            });
        };

        mediator.subscribe(EVENTS.NEW_MESSAGE, handleNewMessage);
        mediator.subscribe(EVENTS.MESSAGES_LOADED, handleMessagesLoaded);

        return () => {
            mediator.unsubscribe(EVENTS.NEW_MESSAGE, handleNewMessage);
            mediator.unsubscribe(EVENTS.MESSAGES_LOADED, handleMessagesLoaded);
        }

    }, []);

    const handleSendMessage = () => {
        if (messageRef.current) {
            const message = messageRef.current.value;
            if (message.length > CONFIG.CHAT_MAX_MESSAGE_LENGTH) {
                alert(`Сообщение не должно превышать ${CONFIG.CHAT_MAX_MESSAGE_LENGTH} символов`);
                return;
            }
            if (message) {
                server.sendMessage(message);
                messageRef.current.value = '';
            }
        }
    }

    const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') handleSendMessage();
    }

    const handleBackToGame = () => setPage(PAGES.GAME);

    const getAuthorColor = (author: string) => {
        let hash = 0;
        for (let i = 0; i < author.length; i++) {
            hash = author.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return `hsl(${hash % 360}, 70%, 50%)`;
    }

    if (!user) {
        return (<div className='chat'>
            <h1>Чат</h1>
            <h1>Что-то пошло не так =</h1>
        </div>)
    }

    return <div className='chat' id='testChat'>
            <div className="chat-header">
                <h2>Чат</h2>
                <div className="user-info">
                    <span>{user.name}</span>
                </div>
                <button className="chat-close-btn" onClick={handleBackToGame}>
                    &times;
                </button>
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                        Нет сообщений
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isOwnMessage = message.author === user.name;
                        return (
                            <div 
                                key={index} 
                                className={`message ${isOwnMessage ? 'message-own' : ''}`}
                            >
                                <strong style={{ color: getAuthorColor(message.author) }}>
                                    {message.author}:
                                </strong>
                                <span>{message.message}</span>
                            </div>
                        )
                    })
                )}
            </div>

            <div className="chat-input">
                <input
                    id='testInput'
                    ref={messageRef}
                    onKeyUp={handleKeyUp}
                    placeholder='Сообщение'
                />
                <Button 
                    onClick={handleSendMessage} 
                    text="Отправить"
                    className='button button-primary'
                    id='testSendButton'
                />
            </div>
        </div>
}

export default Chat;