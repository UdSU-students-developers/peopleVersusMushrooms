import React, { useEffect, useState, useRef, KeyboardEvent, useContext } from "react";
import { MediatorContext, ServerContext } from "../../App";
import { IBasePage } from '../PageManager';
import { TUser, TMessage, TMessages } from "../../services/Server/types";
import CONFIG from "../../config";
import Button from "../../components/Button/Button";

import './Chat.css';

const Chat: React.FC<IBasePage> = (props: IBasePage) => {
    const { setPage } = props;

    const { GET_STORE, SET_STORE } = CONFIG.MEDIATOR.TRIGGERS;

    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);
    
    const [messages, setMessages] = useState<TMessages>([]);
    const [user, setUser] = useState<TUser | null>(null);
    const messageRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!mediator) return;
        
        const storedUser = mediator.get<TUser | null>(GET_STORE, 'user');
        setUser(storedUser);
    }, [mediator]);

    useEffect(() => {
        if (!mediator) return;
        
        const storedMessages = mediator.get<TMessages>(GET_STORE, 'messages');
        if (storedMessages) {
            setMessages(storedMessages);
        }
    }, [mediator]);

    useEffect(() => {
        if (!mediator) return;

        const eventTypes = mediator.getEventTypes();

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

        mediator.subscribe(eventTypes.NEW_MESSAGE, handleNewMessage);
        mediator.subscribe(eventTypes.MESSAGES_LOADED, handleMessagesLoaded);

        server.getMessages();

        return () => {
            mediator.unsubscribe(eventTypes.NEW_MESSAGE, handleNewMessage);
            mediator.unsubscribe(eventTypes.MESSAGES_LOADED, handleMessagesLoaded);
        }

    }, [mediator, server]);

    const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
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
    }

    const handleSend = () => {
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

    const getAuthorColor = (author: string) => {
        let hash = 0;
        for (let i = 0; i < author.length; i++) {
            hash = author.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 50%)`;
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
                    onClick={handleSend} 
                    text="Отправить"
                    className='button button-primary'
                    id='testSendButton'
                />
            </div>
        </div>
}

export default Chat;