class Message {
    constructor({ common, author, message }) {
        this.guid = common.guid();
        this.author = author;
        this.message = message;
    }

    get() {
        return {
            guid: this.guid,
            author: this.author,
            message: this.message
        }
    }
}

module.exports = Message;