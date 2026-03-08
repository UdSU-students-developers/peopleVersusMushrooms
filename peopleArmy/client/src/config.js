const CONFIG = {
    SERVER_URL: 'http://localhost:3007',
    
    SOCKET: {
        EVENTS: {
            CONNECTION: 'connection',
            DISCONNECT: 'disconnect',
            MESSAGE_FROM_CLIENT: 'message_from_client',
            MESSAGE_TO_CLIENTS: 'message_to_clients',
        },
    },
}

export default CONFIG;
