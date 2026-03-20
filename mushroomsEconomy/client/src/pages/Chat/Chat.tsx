import React, { useEffect, useState, useRef, useMemo, KeyboardEvent } from "react";
import { IBasePage } from '../PageManager';
import { TUser, TMessage, TMessages } from "../../services/Server/types";
import CONFIG from "../../config";
import Button from "../../components/Button/Button";
import './Chat.css';

const Chat: React.FC<IBasePage> = (props: IBasePage) => {
    const { setPage, server, store, mediator } = props;
    const [messages, setMessages] = useState<TMessages>([]);
    const [_, setHash] = useState<string>('');
    const messageRef = useRef<HTMLInputElement>(null);
    const user = store.get('user');

    useEffect(() => {
        const messages = store.getMessages();
        setMessages(messages);
    }, [store]);

    useEffect(() => {
        if (!mediator) return;

        const eventTypes = mediator.getEventTypes();

        const handleNewMessage = (message: TMessage) => {
            setMessages(prev => [...prev, message]);
        };

        const handleMessagesLoaded = (messages: TMessages) => {
            setMessages(messages);
        };

        mediator.subscribe(eventTypes.NEW_MESSAGE, handleNewMessage);
        mediator.subscribe(eventTypes.MESSAGES_LOADED, handleMessagesLoaded);

        server.getMessages();

        return () => {
            mediator.unsubscribe(eventTypes.NEW_MESSAGE, handleNewMessage);
            mediator.unsubscribe(eventTypes.MESSAGES_LOADED, handleMessagesLoaded);
        }

    }, [mediator, store]);

    const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            if (messageRef.current) {
                const message = messageRef.current.value;
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

    const input = useMemo(() => 
        <input 
            id='testInput'
            ref={messageRef} 
            onKeyUp={handleKeyUp} 
            placeholder='сообщение' 
            className='inputChat'
        />, 
    [handleKeyUp]);

    const getAuthorColor = (author: string) => {
        let hash = 0;
        for (let i = 0; i < author.length; i++) {
            hash = author.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Генерируем цвет в формате HSL для лучшей читаемости
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