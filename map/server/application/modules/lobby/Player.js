class Player {
    constructor(guid, role) {
        this.guid = guid;
        this.role = role;
        this.ready = ready;
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