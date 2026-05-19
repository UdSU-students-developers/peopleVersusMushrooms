const LobbyManager = require('../../global/modules/lobby/LobbyManager');

class MushroomsArmyLobbyManager extends LobbyManager {
    constructor(options, role) {
        super(options, role);
        this._previousLobbiesSnapshot = [];
    }

    _cloneLobbiesList(list) {
        try {
            return JSON.parse(JSON.stringify(Array.isArray(list) ? list : []));
        } catch {
            return [];
        }
    }

    _guidsInServiceRole(lobbiesList) {
        const guids = new Set();
        if (!Array.isArray(lobbiesList)) return guids;
        for (const lobby of lobbiesList) {
            const g = lobby?.playersGuids?.[this.role];
            if (g) guids.add(g);
        }
        return guids;
    }

    _emitLeaveLobbyIfRemovedFromRole(oldList, newList) {
        const prevGuids = this._guidsInServiceRole(oldList);
        const nextGuids = this._guidsInServiceRole(newList);
        for (const guid of prevGuids) {
            if (nextGuids.has(guid)) continue;
            const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
            if (!user?.socketId) continue;
            this.io.to(user.socketId).emit(this.SOCKET.LEAVE_LOBBY, this.answer.good(true));
        }
    }

    eventLobbyUpdated(lobbies) {
        const newList = this._cloneLobbiesList(lobbies);
        const oldList = this._previousLobbiesSnapshot;
        this._emitLeaveLobbyIfRemovedFromRole(oldList, newList);
        this._previousLobbiesSnapshot = newList;
        this.io.emit(this.SOCKET.LOBBIES_LIST_UPDATED, this.answer.good(newList));
    }
}

module.exports = MushroomsArmyLobbyManager;
