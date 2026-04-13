class Message {
    constructor({ common, author, message, socketId }) {
        this.socketId = socketId;
        this.guid = common.guid();
        this.author = author;
        this.message = message;
    }

    get() {
        return {
            socketId: this.socketId,
            guid: this.guid,
            author: this.author,
            message: this.message
        }
    }
}

module.exports = Message;