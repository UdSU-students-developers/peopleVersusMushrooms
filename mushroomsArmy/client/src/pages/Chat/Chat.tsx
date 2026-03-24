import React from "react";
import { PAGES } from '../PageManager';
import './Chat.css';

const Chat: React.FC<{ setPage: (page: PAGES) => void }> = ({ setPage }) => {
    return (
        <div>
            <p>Chat</p>
        </div>
    );
}

export default Chat;