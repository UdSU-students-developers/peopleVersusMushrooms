class Message {
    constructor({ common, author, message }) {
        this.common = common;
        this.guid = this.common.guid();
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
    
    getSelf() {
        return {
            common: this.common,
            guid: this.guid,
            author: this.author,
            message: this.message
        }
    }

    isValid() {
        return this.author && this.message;
    }
}

module.exports = Message;