class Player {
    constructor(guid, role) {
        this.guid = guid;
        this.role = role;
        this.ready = true;
    }

    get() {
        return {
            guid: this.guid,
            role: this.role,
            ready: this.ready,
        }
    }

    setReady() {
        this.ready = true;
    }

    setNotReady() {
        this.ready = false;
    }

    isReady() {
        return this.ready;
    }
}

module.exports = Player;