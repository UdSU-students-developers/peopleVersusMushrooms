class Message {
    constructor({ common, author, message, socketId }) {
        this.socketId = socketId;
        this.guid = common.guid();
        this.author = author;
        this.message = message;
        this.date = new Date();
    }

    get() {
        return {
            socketId: this.socketId,
            guid: this.guid,
            author: this.author,
            message: this.message,
            date: this.date,
        }
    }
}

module.exports = Message;