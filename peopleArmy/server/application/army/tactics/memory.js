const { RESERVATION_TTL_SEC, LAST_SEEN_TTL_SEC } = require('./constants');

class TacticalMemory {
    constructor() {
        /** @type {Map<string, { byUnitGuid: string, until: number }>} */
        this.reservations = new Map();
        /** @type {Map<string, { x: number, y: number, type: string, targetKind: string, until: number }>} */
        this.lastSeen = new Map();
    }

    _now() {
        return Date.now() / 1000;
    }

    prune() {
        const now = this._now();
        for (const [guid, r] of this.reservations) {
            if (r.until <= now) {
                this.reservations.delete(guid);
            }
        }
        for (const [guid, s] of this.lastSeen) {
            if (s.until <= now) {
                this.lastSeen.delete(guid);
            }
        }
    }

    reserve(targetGuid, byUnitGuid, ttlSec = RESERVATION_TTL_SEC) {
        this.reservations.set(targetGuid, {
            byUnitGuid,
            until: this._now() + ttlSec,
        });
    }

    getReservation(targetGuid) {
        const r = this.reservations.get(targetGuid);
        if (!r || r.until <= this._now()) {
            this.reservations.delete(targetGuid);
            return null;
        }
        return r;
    }

    setLastSeen(entity) {
        if (!entity?.guid) {
            return;
        }
        const x = Number(entity.x);
        const y = Number(entity.y);
        this.lastSeen.set(entity.guid, {
            x,
            y,
            type: entity.type,
            targetKind: entity.targetKind || (entity.size != null ? 'building' : 'unit'),
            until: this._now() + LAST_SEEN_TTL_SEC,
        });
    }

    getLastSeen(guid) {
        const s = this.lastSeen.get(guid);
        if (!s || s.until <= this._now()) {
            this.lastSeen.delete(guid);
            return null;
        }
        return s;
    }
}

module.exports = TacticalMemory;
