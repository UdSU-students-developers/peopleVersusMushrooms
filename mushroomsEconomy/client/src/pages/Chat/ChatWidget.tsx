import React, { useState, useEffect, useRef, useContext, KeyboardEvent } from "react";
import { MediatorContext, ServerContext } from "../../App";
import { TUser, TMessage, TMessages } from "../../services/Server/types";
import CONFIG from "../../config";
import Button from "../../components/Button/Button";

import './ChatWidget.css';

const ChatWidget: React.FC = () => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);
    const { GET_STORE, SET_STORE } = CONFIG.MEDIATOR.TRIGGERS;
    const EVENTS = mediator.getEventTypes();
    
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [messages, setMessages] = useState<TMessages>([]);
    const user = mediator.get<TUser | null>(GET_STORE, 'user');
    const messageRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedMessages = mediator.get<TMessages>(GET_STORE, 'messages');
        if (Array.isArray(storedMessages)) {
            setMessages(storedMessages);
        }
        server.getMessages();

        const handleNewMessage = (message: TMessage) => {
            setMessages(prev => [...prev, message]);
            const currentMessages = mediator.get<TMessages>(GET_STORE, 'messages') || [];
            mediator.get(SET_STORE, { name: 'messages', value: [...currentMessages, message] });
        };

        const handleMessagesLoaded = (loadedMessages: TMessages) => {
            setMessages(loadedMessages);
            mediator.get(SET_STORE, { name: 'messages', value: loadedMessages });
        };

        mediator.subscribe(EVENTS.NEW_MESSAGE, handleNewMessage);
        mediator.subscribe(EVENTS.MESSAGES_LOADED, handleMessagesLoaded);

        return () => {
            mediator.unsubscribe(EVENTS.NEW_MESSAGE, handleNewMessage);
            mediator.unsubscribe(EVENTS.MESSAGES_LOADED, handleMessagesLoaded);
        };
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSendMessage = () => {
        if (messageRef.current) {
            const message = messageRef.current.value;
            if (message.length > CONFIG.CHAT_MAX_MESSAGE_LENGTH) {
                alert(`Сообщение не должно превышать ${CONFIG.CHAT_MAX_MESSAGE_LENGTH} символов`);
                return;
            }
            if (message.trim()) {
                server.sendMessage(message);
                messageRef.current.value = '';
            }
        }
    };

    const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') handleSendMessage();
    };

    const getAuthorColor = (author: string) => {
        let hash = 0;
        for (let i = 0; i < author.length; i++) {
            hash = author.charCodeAt(i) + ((hash << 5) - hash);
        }
        return `hsl(${hash % 360}, 60%, 70%)`;
    };

    if (!user) return null;

    return (
        <div className="chat-widget">
            {!isOpen && (
                <Button 
                    onClick={() => setIsOpen(true)} 
                    text="💬" 
                    variant="accent" 
                    className="chat-toggle-btn"
                />
            )}

            {isOpen && (
                <div className="chat-window">
                    <div className="chat-window-header">
                        <h3>Чат</h3>
                        <Button 
                            onClick={() => setIsOpen(false)} 
                            text="✕" 
                            variant="main" 
                            className="chat-close-btn"
                        />
                    </div>

                    <div className="chat-messages-container">
                        {messages.length === 0 ? (
                            <div className="empty-messages">Нет сообщений</div>
                        ) : (
                            messages.map((message, index) => {
                                const isOwnMessage = message.author === user.name;
                                return (
                                    <div 
                                        key={index} 
                                        className={`message ${isOwnMessage ? 'message-own' : ''}`}
                                    >
                                        <strong style={{ color: isOwnMessage ? 'rgba(255,255,255,0.8)' : getAuthorColor(message.author) }}>
                                            {message.author}
                                        </strong>
                                        <span>{message.message}</span>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-container">
                        <input
                            ref={messageRef}
                            onKeyUp={handleKeyUp}
                            placeholder='Сообщение...'
                            className="pixel-input"
                        />
                        <Button 
                            onClick={handleSendMessage} 
                            text="→"
                            variant="primary"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
