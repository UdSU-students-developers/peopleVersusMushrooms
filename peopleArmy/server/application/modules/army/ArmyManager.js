const CONFIG = require('../../../config');
const BaseManager = require('../../../../../global/modules/BaseManager');
const { URLS, MAP } = require('../../../../../global/globalConfig');
const Army = require('../../army/Army');
const { UPDATE_ARMY } = CONFIG.SOCKETS;

class ArmyManager extends BaseManager {
    constructor(options) {
        super(options);

        // хранит армии
        this.army = {};
        this.unitTypes = {};
        this.unitTypesLoaded = false;

        // хранит данные о лобби (mapGuid, guids))
        this.lobbyData = {};

        // sockets
        if (!this.io) return;
        this.io.on('connection', (socket) => {});
        // mediator event subscribers
        this.mediator.subscribe(this.EVENTS.START_GAME, (data) => this.eventStartGame(data));
        this.mediator.subscribe(this.EVENTS.DELETE_USER, (data) => this.eventUserDisconnect(data));
        // mediator trigger setters
        this.mediator.set(this.TRIGGERS.CREATE_UNIT, (data) => this.createUnit(data));
        this.mediator.set(this.TRIGGERS.UNIT_TAKE_DAMAGE, (data) => this.unitTakeDamage(data));
    }

    async loadUnitTypes() {
        if (this.unitTypesLoaded) {
            return this.unitTypes;
        }
        const types = await this.db.getUnitTypes();
        this.unitTypes = types || {};
        this.unitTypesLoaded = true;
        return this.unitTypes;
    }

    destructor() {
        this.army.destructor();
    }

    /* PRIVATE */
    async updateArmyCallback(guid) {
        const army = this.army[guid];
        if (!army?.mapGuid) {
            return;
        }

        // отправить позиции наших юнитов на карту
        const entities = army.units
            .filter(u => typeof u.get === 'function')
            .map(u => {
                const s = u.get();
                return { guid: s.guid, x: s.x, y: s.y, type: s.type, visibility: s.visible, hp: s.hp };
            });
        await this.sendToMap(URLS.UPDATE_UNITS, { mapGuid: army.mapGuid, userGuid: guid, entities });

        // запросить видимость
        const visibility = await this.sendToMap(URLS.GET_VISIBILITY, { mapGuid: army.mapGuid, userGuid: guid });
        if (visibility) {
            army.setVisibility(visibility);
        }

        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            this.io.to(user.socketId).emit(UPDATE_ARMY, this.answer.good(army.get()));
        }
    }

    /* TRIGGERS */

    /**
     * mediator.get(CREATE_UNIT, { guid, x, y, type? })
     * guid — guid пользователя
     * type: "soldier" | "bmp" (по умолчанию soldier)
     * @returns {{ result: "ok", data: object } | { result: "error", error: string, code: number }}
     */
    createUnit(data) {
        const guid = data?.guid;
        const x = Number(data?.x);
        const y = Number(data?.y);
        const type = data?.type ?? 'soldier';

        if (guid === null || data?.x === undefined || data?.y === undefined) {
            return this.answer.bad(400);
        }
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return this.answer.bad(400);
        }

        // Проверяем залогиненность юзера (isLogin)
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (!user || !user?.isLogin()) {
            return this.answer.bad(11);
        }

        // Проверяем наличие армии у этого юзера
        if (!this.army[guid]) {
            return this.answer.bad(400);
        }

        // Находим его армию и вызываем createUnit на уровне Army
        const army = this.army[guid];
        const result = army.createUnit({ x, y, type });
        if (!result?.ok) {
            return this.answer.bad(400);
        }
        return this.answer.good(result.data);
    }

    /**
     * mediator.get(UNIT_TAKE_DAMAGE, { userGuid, unitGuid, damage })
     * userGuid — guid пользователя (владельца армии)
     * unitGuid — guid юнита, которому наносится урон
     * damage — количество урона
     */
    unitTakeDamage(data) {
        const userGuid = data?.userGuid;
        const unitGuid = data?.unitGuid;
        const damage = Number(data?.damage);

        if (!userGuid || !unitGuid || !Number.isFinite(damage)) {
            return this.answer.bad(400);
        }

        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, userGuid);
        if (!user || !user?.isLogin()) {
            return this.answer.bad(11);
        }

        const army = this.army[userGuid];
        if (!army) {
            return this.answer.bad(400);
        }

        const result = army.unitTakeDamage({ guid: unitGuid, damage });
        if (!result?.ok) {
            return this.answer.bad(404);
        }

        return this.answer.good(result.data);
    }

    async damageMushroomsUnit({ armyGuid, economyGuid, unitGuid, amount, targetKind, type }) {
        if (!unitGuid || !Number.isFinite(Number(amount))) {
            return null;
        }

        const sanitizedAmount = Number(amount);

        if (targetKind === 'building') {
            const buildingType = String(type || '').toLowerCase();
            // башня и взрывомор — здания mushroomsArmy, не economy
            if (buildingType === 'sporovaya_bashnya' || buildingType === 'vzryvomor') {
                if (!armyGuid) {
                    return null;
                }
                return this.sendToMushroomsArmy('/takeDamage', {
                    armyGuid,
                    unitGuid,
                    amount: sanitizedAmount,
                });
            }
            if (!economyGuid) {
                return null;
            }
            return this.sendToMushroomsEconomy(URLS.APPLY_DAMAGE, {
                economyGuid,
                guid: unitGuid,
                damage: sanitizedAmount,
            });
        }

        if (!armyGuid) {
            return null;
        }

        return this.sendToMushroomsArmy('/takeDamage', {
            armyGuid,
            unitGuid,
            amount: sanitizedAmount,
        });
    }

    /* EVENTS */
    async eventStartGame({ mapGuid, guids }) {
        if (!mapGuid || !guids || !guids.peopleArmy) {
            return;
        }

        const guid = guids.peopleArmy;
        this.lobbyData[guid] = { mapGuid, guids };

        const map = await this.sendToMap(`${URLS.GET_RELIEF}`, { mapGuid, userGuid: guid });
        if (!map || !Array.isArray(map)) {
            return;
        }
        await this.loadUnitTypes();

        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
        if (user) {
            if (this.army[guid]) {
                this.army[guid].destructor();
                delete this.army[guid];
            }
            this.army[guid] = new Army({ guids, mapGuid, map, buildings: [], unitTypes: this.unitTypes, common: this.common, guid,
                callbacks: {
                    update: (guid) => this.updateArmyCallback(guid),
                    takeDamage: (payload) => this.damageMushroomsUnit(payload),
                }
            });
            // Хардкод: спавн 20 юнитов людям при старте игры
            const spawnTypes = ['soldier', 'bmp', 'sniper', 'partizan'];
            for (let i = 0; i < 20; i++) {
                const type = spawnTypes[i % spawnTypes.length];
                // Координаты спавна: вокруг стартовой точки
                const baseX = (this.lobbyData[guid]?.guids?.startPoint?.x ?? 4) || 4;
                const baseY = (this.lobbyData[guid]?.guids?.startPoint?.y ?? 4) || 4;
                const x = baseX + (i % 5);
                const y = baseY + Math.floor(i / 5);
                this.army[guid].createUnit({ x, y, type });
            }
            this.io.to(user.socketId).emit(
                this.SOCKET.START_GAME,
                this.answer.good({ map })
            );
            await this.updateArmyCallback(guid);
        }
    }

    eventUserDisconnect(guid) {
        if (!guid || !this.army[guid]) {
            return;
        }
        this.army[guid].destructor();
        delete this.army[guid];
        console.log(`армия с guid: ${guid} уничтожена`);
    }

    /* SOCKETS */
    //...
}

module.exports = ArmyManager;