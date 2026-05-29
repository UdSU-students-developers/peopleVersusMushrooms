import BaseManager, { TManagerOptions } from '../BaseManager';
import CONFIG from '../../../config';
import { Army, TMap, TArmyState, TBuildingInput, TDamageTarget, PEOPLE_ARMY_UNIT_TYPES, PEOPLE_ARMY_DEFAULT_HP } from '../../army/Army';
import { ArmyStateManager, ArmyMode, EconomyRequest, EconomyResponse } from '../../army/ArmyStateManager';
import { Socket } from 'socket.io';

const GLOBAL_CONFIG = require('../../../../../global/globalConfig');

const { GAME_STATE, LOBBY_START, GAME_STARTED } = CONFIG.SOCKET;

type TStartGame = { guid: string; map?: TMap; buildings: TBuildingInput[]; mapGuid: string; peopleArmyGuid?: string | null; mushroomsEconomyGuid?: string | null; peopleEconomyGuid?: string | null };
export type TArmyGuids = { peopleArmyGuid: string | null; mushroomsEconomyGuid: string | null; peopleEconomyGuid: string | null };
type TTakeDamage = { armyGuid: string; unitGuid: string; amount: number };
type TMoveUnit = { armyGuid: string; unitGuid: string; x: number; y: number };
type TGetArmy = string;
type TSpawnUnit = { armyGuid: string; type: 'sporomet' | 'champigneb' | 'eblekar' | 'pizdoglyad'; x: number; y: number };
type TSpawnBuildingUnit = { armyGuid: string; type: 'vzryvomor' | 'sporovaya_bashnya'; x: number; y: number };
type TUser = { guid: string; token: string; socketId: string; name: string };

type TVisibleEntity = {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
};

type TVisibilityResponse = {
    units: TVisibleEntity[];
    buildings: TVisibleEntity[];
};

type TReliefResponse = TMap;

const ALLIED_ECONOMY_UNIT_TYPES = new Set(['larva', 'geodezist']);
const PEOPLE_ECONOMY_BUILDING_TYPES = new Set(['barracks', 'driller', 'mine', 'pipe', 'smallGenerator']);
// Map хранит здания без hp — нормализуем дефолтами на стороне грибов,
// чтобы прокси-цель не убивалась одной атакой.
const PEOPLE_ECONOMY_DEFAULT_HP: Record<string, number> = {
    barracks: 200,
    driller: 100,
    mine: 100,
    pipe: 100,
    smallGenerator: 100,
};

function normalizeMapUnitHp(unit: TVisibleEntity): TVisibleEntity {
    const parsed = Number(unit.hp);
    if (Number.isFinite(parsed) && parsed > 0) {
        return { ...unit, hp: parsed };
    }
    return { ...unit, hp: PEOPLE_ARMY_DEFAULT_HP[unit.type] ?? 1 };
}

function normalizeEnemyBuildingHp(entity: TVisibleEntity): TVisibleEntity {
    const parsed = Number(entity.hp);
    if (Number.isFinite(parsed) && parsed > 0) {
        return { ...entity, hp: parsed };
    }
    return { ...entity, hp: PEOPLE_ECONOMY_DEFAULT_HP[entity.type] ?? 50 };
}

export type DamageRoute = { url: string; body: Record<string, unknown> };

/**
 * Чистая функция: по типу цели выбирает куда слать урон.
 * — здание экономики людей → peopleEconomy /damage
 * — юнит/постройка peopleArmy → peopleArmy /unit/takeDamage
 * Возвращает null если соответствующий guid отсутствует.
 */
export function resolveDamageRoute(
    targetType: string,
    targetGuid: string,
    amount: number,
    guids: TArmyGuids,
): DamageRoute | null {
    if (PEOPLE_ECONOMY_BUILDING_TYPES.has(targetType)) {
        if (!guids.peopleEconomyGuid) return null;
        return {
            url: `${GLOBAL_CONFIG.PEOPLE_ECONOMY.URL}${GLOBAL_CONFIG.URLS.DAMAGE}`,
            body: { guid: targetGuid, damage: amount, economyGuid: guids.peopleEconomyGuid },
        };
    }
    if (!guids.peopleArmyGuid) return null;
    return {
        url: `${GLOBAL_CONFIG.PEOPLE_ARMY.URL}${GLOBAL_CONFIG.URLS.TAKE_DAMAGE_PEOPLE_ARMY}`,
        body: { userGuid: guids.peopleArmyGuid, unitGuid: targetGuid, damage: amount },
    };
}

// Структура для отслеживания системы спавна юнитов
type UnitSpawnQueue = {
    queue: Array<'sporomet' | 'champigneb' | 'eblekar' | 'pizdoglyad'>; // очередь типов
    inFlight: number; // количество запросов "в пути" (макс. 5)
    lastSpawnTime: number; // время последнего спавна
};

class ArmyManager extends BaseManager {
    private army: { [guid: string]: Army };
    private armyStateManagers: { [guid: string]: ArmyStateManager };
    private armyGuids: Record<string, TArmyGuids>;
    private economyRequestIntervals: Record<string, NodeJS.Timeout> = {};
    private spawnQueues: Record<string, UnitSpawnQueue> = {}; // очереди спавна по армиям

    constructor(options: TManagerOptions) {
        super(options);

        this.army = {};
        this.armyStateManagers = {};
        this.armyGuids = {};

        this.mediator.subscribe(this.EVENTS.START_GAME, (data: unknown) => this.eventStartGame(data as TStartGame));

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.TAKE_DAMAGE_HANDLER, (data: unknown) =>
            this.triggerTakeDamage(data as TTakeDamage)
        );

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.DESTROY_ARMY, (data: unknown) => this.destroyArmy(data as string));

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.MOVE_UNIT, (data: unknown) =>
            this.triggerMoveUnit(data as TMoveUnit)
        );

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.GET_ARMY, (data: unknown) =>
            this.triggerGetArmy(data as TGetArmy)
        );

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.SPAWN_UNIT, (data: unknown) =>
            this.triggerSpawnUnit(data as TSpawnUnit)
        );

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.SPAWN_BUILDING, (data: unknown) => 
            this.triggerSpawnBuildingUnit(data as TSpawnBuildingUnit)
        );

        if (!this.io) return;
        this.io.on('connection', (socket: Socket) => {
            socket.on(LOBBY_START, (data: { guid?: string; token?: string }) => this.socketLobbyStart(data, socket));
            socket.on(CONFIG.SOCKET.SPAWN_UNIT, (data: { guid?: string; token?: string; type?: string; x?: number; y?: number }) => this.socketSpawnUnit(data, socket));
        });
    }

    private triggerTakeDamage({ armyGuid, unitGuid, amount }: TTakeDamage): boolean {
        const army = this.army[armyGuid];
        if (!army) return false;

        const sanitizedAmount = Math.max(0, amount);

        const unit = army.units.find(u => u.guid === unitGuid);
        if (unit) {
            unit.takeDamage(sanitizedAmount);
            return true;
        }

        const building = army.buildings.find(b => b.guid === unitGuid);
        if (building) {
            if ('takeDamage' in building && typeof building.takeDamage === 'function') {
                building.takeDamage(sanitizedAmount);
            }
            return true;
        }

        return false;
    }

    private triggerMoveUnit({ armyGuid, unitGuid, x, y }: TMoveUnit): boolean {
        const army = this.army[armyGuid];
        if (!army) return false;

        const unit = army.units.find(u => u.guid === unitGuid);
        if (!unit) return false;

        unit.targetX = x;
        unit.targetY = y;

        return true;
    }

    private triggerGetArmy(armyGuid: TGetArmy): TArmyState | null {
        const army = this.army[armyGuid];
        if (!army) return null;

        return army.getState();
    }

    private triggerSpawnUnit({ armyGuid, type, x, y }: TSpawnUnit): { guid: string } | null {
        const army = this.army[armyGuid];
        if (!army) return null;

        const result = army.spawnUnit(type, x, y, this.common);
        
        // Регистрируем спавн в State Manager
        if (result) {
            const stateManager = this.armyStateManagers[armyGuid];
            if (stateManager) {
                stateManager.registerUnitSpawn(type, result.guid);
            }
            
            // Уменьшаем счетчик "в пути" и отправляем следующий запрос из очереди
            const queue = this.spawnQueues[armyGuid];
            if (queue && queue.inFlight > 0) {
                queue.inFlight--;
                queue.lastSpawnTime = Date.now();
                this.processSpawnQueue(armyGuid);
            }
        }

        return result;
    }

    private triggerSpawnBuildingUnit({ armyGuid, type, x, y }: TSpawnBuildingUnit): { guid: string } | null {
        const army = this.army[armyGuid];
        if (!army) return null;

        return army.spawnBuilding(type, x, y, this.common);
    }

    private buildFogMap(armyState: TArmyState, fullMap: TMap, visionRadius: number = 8): TMap {
        const rows = fullMap.length;
        const cols = fullMap[0]?.length ?? 0;
        const visible = new Uint8Array(rows * cols);

        const reveal = (cx: number, cy: number, r: number) => {
            const rr = r * r;
            const x0 = Math.max(0, Math.floor(cx - r));
            const x1 = Math.min(cols - 1, Math.ceil(cx + r));
            const y0 = Math.max(0, Math.floor(cy - r));
            const y1 = Math.min(rows - 1, Math.ceil(cy + r));
            for (let y = y0; y <= y1; y++) {
                for (let x = x0; x <= x1; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    if (dx * dx + dy * dy <= rr) {
                        visible[y * cols + x] = 1;
                    }
                }
            }
        };

        for (const unit of armyState.units) {
            if (unit.hp > 0) reveal(unit.x, unit.y, unit.visibility ?? visionRadius);
        }
        for (const building of armyState.buildings) {
            const hp = building.hp ?? 0;
            if (hp > 0 && building.type !== 'house' && building.type !== 'barracks' && building.type !== 'tower') {
                const sizeX = building.sizeX ?? 1;
                const sizeY = building.sizeY ?? 1;
                reveal(building.x + sizeX / 2, building.y + sizeY / 2, building.visibility ?? visionRadius);
            }
        }

        return fullMap.map((row, y) =>
            row.map((tile, x) => (visible[y * cols + x] ? tile : null))
        );
    }

    /**
     * Карта удаляет юнита при повторной отправке тех же координат.
     * Поэтому отправляем только изменения и tombstone для пропавших юнитов.
     */
    private async updateArmyCallback(guid: string, armyState: TArmyState) {
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid) as { socketId: string } | null;
        if (!user) return;

        const army = this.army[guid];
        if (!army) return;

        // const ownBuildings = army.buildings.map(building => building.getState());

        const unitEntities = army.buildMapUnitUpdateEntities();
        if (unitEntities.length > 0) {
            await this.send<{ mapGuid: string; userGuid: string; entities: typeof unitEntities }>(
                `${GLOBAL_CONFIG.MAP.URL}${GLOBAL_CONFIG.URLS.UPDATE_UNITS}`,
                { mapGuid: army.mapGuid, userGuid: army.guid, entities: unitEntities }
            );
        }

        // // Здания отправляем только новые (map использует toggle: повторная отправка удаляет с карты)
        // /const newBuildings = ownBuildings.filter(b => !army.sentBuildingGuids.has(b.guid));
        // if (newBuildings.length > 0) {
        //     await this.send<{ mapGuid: string; userGuid: string; entities: TArmyState['buildings'] }>(
        //         `${GLOBAL_CONFIG.MAP.URL}${GLOBAL_CONFIG.URLS.UPDATE_BUILDINGS}`,
        //         { mapGuid: army.mapGuid, userGuid: army.guid, entities: newBuildings }
        //     );
        //     newBuildings.forEach(b => army.sentBuildingGuids.add(b.guid));
        // }

        const buildingEntities = army.buildMapBuildingUpdateEntities();
        if (buildingEntities.length > 0) {
            await this.send<{ mapGuid: string; userGuid: string; entities: typeof buildingEntities }>(
                `${GLOBAL_CONFIG.MAP.URL}${GLOBAL_CONFIG.URLS.UPDATE_BUILDINGS}`,
                { mapGuid: army.mapGuid, userGuid: army.guid, entities: buildingEntities }
            );
        }

        // Получаем видимых врагов
        const visibility = await this.sendToMap<TVisibilityResponse>(
            GLOBAL_CONFIG.URLS.GET_VISIBILITY, army.mapGuid, army.guid
        );

        const visibleEnemyUnits = visibility?.units ?? [];
        const visibleEnemyBuildings = visibility?.buildings ?? [];

        // Типы союзной экономики грибов — отображаем отдельно, не атакуем
        const ALLIED_ECONOMY_BUILDING_TYPES = new Set([
            'mycelium', 'incubator', 'reactor', 'small_reactor', 'mine',
        ]);
        // Фильтруем по role+type: peopleEconomy mine не должен попадать в свои economyBuildings.
        const isAlliedEconomyBuilding = (b: TVisibleEntity & { role?: string }) =>
            b.role === 'mushroomsEconomy' && ALLIED_ECONOMY_BUILDING_TYPES.has(b.type);

        // Также фильтруем юниты экономики по role, чтобы не атаковать союзные юниты
        const isAlliedEconomyUnit = (u: TVisibleEntity & { role?: string }) =>
            u.role === 'mushroomsEconomy' && ALLIED_ECONOMY_UNIT_TYPES.has(u.type);

        army.economyBuildings = visibleEnemyBuildings.filter(isAlliedEconomyBuilding);
        army.economyUnits     = visibleEnemyUnits.filter(u => isAlliedEconomyUnit(u));

        const visibleEnemies: TVisibleEntity[] = [
            ...visibleEnemyUnits.filter(e => !isAlliedEconomyUnit(e)),
            ...visibleEnemyBuildings.filter(e => !isAlliedEconomyBuilding(e)),
        ];

        const enemyEntities: TBuildingInput[] = visibleEnemies.map(entity => {
            const normalized = PEOPLE_ECONOMY_BUILDING_TYPES.has(entity.type)
                ? normalizeEnemyBuildingHp(entity)
                : entity;
            return {
                guid: normalized.guid,
                type: normalized.type,
                x: normalized.x,
                y: normalized.y,
                hp: normalized.hp,
                role: (entity as { role?: string }).role,
            };
        });
        army.updateEnemyEntities(enemyEntities);

        const updatedState = army.getState();
        const clientBuildingsByGuid = new Map(
            updatedState.buildings.map(building => [building.guid, building] as const)
        );
        // Map не хранит hp у buildings — берём актуальный hp из enemyUnits-прокси
        // (он отражает накопленный damage от грибов). Иначе фолбэк на дефолт.
        // Также скрываем недавно убитые (recentlyKilledGuids) пока peopleEconomy
        // не уберёт их с карты через tombstone.
        const proxyByGuid = new Map(army.enemyUnits.map(u => [u.guid, u] as const));
        for (const raw of visibleEnemyBuildings.filter(e => !isAlliedEconomyBuilding(e))) {
            if (army.recentlyKilledGuids.has(raw.guid)) continue;
            const proxy = proxyByGuid.get(raw.guid);
            const hp = proxy
                ? proxy.hp
                : (PEOPLE_ECONOMY_BUILDING_TYPES.has(raw.type) ? (PEOPLE_ECONOMY_DEFAULT_HP[raw.type] ?? 50) : raw.hp);
            clientBuildingsByGuid.set(raw.guid, { ...raw, hp });
        }

        const clientEnemyUnits = visibleEnemyUnits
            .filter((unit) => PEOPLE_ARMY_UNIT_TYPES.has(unit.type))
            .map(normalizeMapUnitHp);

        const fogMap = this.buildFogMap(updatedState, army.map);
        const stateManager = this.armyStateManagers[guid];
        const metrics = stateManager?.getMetrics() ?? null;
        const formation = stateManager?.getFormationState() ?? null;

        this.io.to(user.socketId).emit(GAME_STATE, this.answer.good({
            ...updatedState,
            map: fogMap,
            enemyUnits: clientEnemyUnits,
            buildings: [...clientBuildingsByGuid.values()],
            economyUnits: updatedState.economyUnits,
            metrics,
            formation,
        }));
    }

    private async damageEnemy(armyGuid: string, target: TDamageTarget): Promise<void> {
        const guids = this.armyGuids[armyGuid];
        if (!guids) return;

        const route = resolveDamageRoute(target.type ?? '', target.unitGuid, target.amount, guids);
        if (!route) return;

        await this.send(route.url, route.body);
    }

    private destroyArmy(guid: string): void {
        const army = this.army[guid];
        if (army) {
            army.destructor();
        }

        const stateManager = this.armyStateManagers[guid];
        if (stateManager) {
            stateManager.destroy();
        }

        // Останавливаем таймер запросов в экономику
        const interval = this.economyRequestIntervals[guid];
        if (interval) {
            clearInterval(interval);
            delete this.economyRequestIntervals[guid];
        }

        // Очищаем очередь спавна
        delete this.spawnQueues[guid];

        delete this.army[guid];
        delete this.armyStateManagers[guid];
        delete this.armyGuids[guid];
    }

    private startEconomyRequests(armyGuid: string, mushroomsEconomyGuid: string): void {
        const url = `${GLOBAL_CONFIG.MUSHROOMS_ECONOMY.URL}${GLOBAL_CONFIG.URLS.REQUEST_UNITS}`;
        
        // Инициализируем очередь спавна
        this.spawnQueues[armyGuid] = {
            queue: [],
            inFlight: 0,
            lastSpawnTime: Date.now()
        };

        // Целевое соотношение: 40% champigneb, 40% sporomet, 10% eblekar, 10% pizdoglyad
        const TARGET_RATIOS = {
            champigneb: 0.40,
            sporomet: 0.40,
            eblekar: 0.10,
            pizdoglyad: 0.10
        };

        const getUnitTypeToSpawn = (): 'sporomet' | 'champigneb' | 'eblekar' | 'pizdoglyad' => {
            const army = this.army[armyGuid];
            if (!army) return 'sporomet';

            const queue = this.spawnQueues[armyGuid];
            if (!queue) return 'sporomet';

            const units = army.units;
            
            // Считаем текущее количество каждого типа (в армии + в очереди + в пути)
            const counts = {
                champigneb: 0,
                sporomet: 0,
                eblekar: 0,
                pizdoglyad: 0
            };

            // Юниты в армии
            for (const unit of units) {
                if (unit.type in counts) {
                    counts[unit.type as keyof typeof counts]++;
                }
            }

            // Юниты в очереди и в пути (планируемые)
            for (const typeInQueue of queue.queue) {
                counts[typeInQueue]++;
            }

            const totalUnits = units.length;
            const totalExpected = totalUnits + queue.queue.length;

            if (totalUnits === 0 && queue.queue.length === 0) {
                return 'champigneb';
            }

            // Находим тип с наибольшим отклонением от целевого соотношения
            // Учитываем текущее состояние армии + планируемые спавны
            let maxDeviation = -1;
            let typeToSpawn: 'sporomet' | 'champigneb' | 'eblekar' | 'pizdoglyad' = 'sporomet';

            for (const [type, targetRatio] of Object.entries(TARGET_RATIOS)) {
                const typeCount = counts[type as keyof typeof counts];
                const currentRatio = totalExpected > 0 ? typeCount / totalExpected : 0;
                const deviation = targetRatio - currentRatio;
                
                if (deviation > maxDeviation) {
                    maxDeviation = deviation;
                    typeToSpawn = type as 'sporomet' | 'champigneb' | 'eblekar' | 'pizdoglyad';
                }
            }

            return typeToSpawn;
        };

        // Интервал для пополнения очереди: каждые 100мс проверяем нужно ли добавить новый запрос
        // Максимум 5 запросов одновременно, новый отправляется когда юнит спавнится
        this.economyRequestIntervals[armyGuid] = setInterval(async () => {
            try {
                const queue = this.spawnQueues[armyGuid];
                if (!queue) return;

                // Пополняем очередь до 5 максимум
                while (queue.queue.length < 5 && queue.inFlight + queue.queue.length < 5) {
                    const unitType = getUnitTypeToSpawn();
                    queue.queue.push(unitType);
                }

                // Отправляем из очереди если есть место
                this.processSpawnQueue(armyGuid);
            } catch (error) {
                console.error('[ArmyManager] Error in economy request interval:', error);
            }
        }, 100); // Проверяем каждые 100мс
    }

    /** Обрабатывает очередь спавна: отправляет запросы пока не достигнем максимума 5 "в пути" */
    private async processSpawnQueue(armyGuid: string): Promise<void> {
        const queue = this.spawnQueues[armyGuid];
        if (!queue) return;

        const url = `${GLOBAL_CONFIG.MUSHROOMS_ECONOMY.URL}${GLOBAL_CONFIG.URLS.REQUEST_UNITS}`;
        const mushroomsEconomyGuid = this.armyGuids[armyGuid]?.mushroomsEconomyGuid;
        if (!mushroomsEconomyGuid) return;

        // Отправляем запросы пока не достигнем максимума 5 "в пути"
        while (queue.queue.length > 0 && queue.inFlight < 5) {
            const unitType = queue.queue.shift();
            if (!unitType) break;

            queue.inFlight++;
            try {
                await this.send(
                    url,
                    {
                        mushroomsEconomy: mushroomsEconomyGuid,
                        unitsType: unitType,
                        unitsAmount: 1
                    }
                );
            } catch (error) {
                console.error('[ArmyManager] Error requesting unit from economy:', error);
                queue.inFlight--;
            }
        }
    }

    private async handleEconomyRequest(request: EconomyRequest): Promise<EconomyResponse | null> {
        const guids = this.armyGuids[request.armyGuid];
        if (!guids || !guids.mushroomsEconomyGuid) {
            return { success: false };
        }

        const url = `${GLOBAL_CONFIG.MUSHROOMS_ECONOMY.URL}${GLOBAL_CONFIG.URLS.REQUEST_BUILDINGS}`;
        const response = await this.send(
            url,
            {
                mushroomsEconomy: guids.mushroomsEconomyGuid,
                buildingsType: request.data?.buildingType,
                buildingsAmount: 1,
            }
        );

        return response ? { success: true } : { success: false };
    }

    private handleModeChange(armyGuid: string, newMode: ArmyMode): void {
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, armyGuid) as { socketId: string } | null;
        if (!user) return;

        this.io.to(user.socketId).emit('army_mode_changed', this.answer.good({ mode: newMode }));
    }

    private handleDistanceMilestone(armyGuid: string, distance: number): void {
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, armyGuid) as { socketId: string } | null;
        if (!user) return;

        this.io.to(user.socketId).emit('distance_milestone', this.answer.good({ distance }));
    }

    private handleScoutRespawn(armyGuid: string, scoutGuid: string): void {
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, armyGuid) as { socketId: string } | null;
        if (!user) return;

        this.io.to(user.socketId).emit('scout_respawned', this.answer.good({ scoutGuid }));
    }

    private async eventStartGame({ guid, map, buildings, mapGuid, peopleArmyGuid, mushroomsEconomyGuid, peopleEconomyGuid }: TStartGame): Promise<void> {
        try {
            const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid);
            if (!user) return;

        if (this.army[guid]) {
            this.destroyArmy(guid);
        }
        let resolvedMap = map;

        if (!resolvedMap) {
            const relief = await this.send<{ mapGuid: string; userGuid: string }, TReliefResponse>(
                `${GLOBAL_CONFIG.MAP.URL}${GLOBAL_CONFIG.URLS.GET_RELIEF}`,
                { mapGuid, userGuid: guid }
            );

            if (!relief || !Array.isArray(relief)) {
                return;
            }

            resolvedMap = relief;
        }

        let finalBuildings = buildings;
        if (!finalBuildings || finalBuildings.length === 0) {
            finalBuildings = Army.generateDefensiveLayout(resolvedMap, this.common);
        }

        this.armyGuids[guid] = {
            peopleArmyGuid: peopleArmyGuid ?? null,
            mushroomsEconomyGuid: mushroomsEconomyGuid ?? null,
            peopleEconomyGuid: peopleEconomyGuid ?? null,
        };
        this.army[guid] = new Army({
            mapGuid,
            map: resolvedMap,
            buildings: finalBuildings,
            common: this.common,
            guid,
            callbacks: {
                update: (guid: string, armyState: TArmyState) => this.updateArmyCallback(guid, armyState),
                takeDamage: (target: TDamageTarget) => this.damageEnemy(guid, target),
                scheduleRebuild: (type: 'sporovaya_bashnya' | 'vzryvomor', x: number, y: number) => this.armyStateManagers[guid]?.scheduleRebuild(type, x, y),
            } as any
        });

        this.armyStateManagers[guid] = new ArmyStateManager({
            army: this.army[guid],
            common: this.common,
            onModeChange: (mode) => this.handleModeChange(guid, mode),
            onDistanceMilestone: (distance) => this.handleDistanceMilestone(guid, distance),
            onScoutRespawn: (scoutGuid) => this.handleScoutRespawn(guid, scoutGuid),
            economyRequestCallback: (request) => this.handleEconomyRequest(request),
        });

        // Запускаем таймер автоматических запросов в экономику на создание юнитов
        if (mushroomsEconomyGuid) {
            this.startEconomyRequests(guid, mushroomsEconomyGuid);
        }

        const userObj = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid) as TUser | null;
        if (userObj?.socketId) {
            this.io.to(userObj.socketId).emit(GAME_STARTED, this.answer.good(true));
        }
        } catch (error) {
            console.error('[ArmyManager] Error in eventStartGame:', error);
        }
    }

    private socketLobbyStart({ guid, token }: { guid?: string; token?: string }, socket: Socket): void {
        if (!guid || !token) {
            socket.emit(LOBBY_START, this.answer.bad(242));
            return;
        }

        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid) as TUser | null;
        if (!user || user.token !== token) {
            socket.emit(LOBBY_START, this.answer.bad(242));
            return;
        }

        user.socketId = socket.id;
        socket.emit(LOBBY_START, this.answer.good(true));
    }

    private socketSpawnUnit({ guid, token, type, x, y }: { guid?: string; token?: string; type?: string; x?: number; y?: number }, socket: Socket): void {
        if (!guid || !token || !type || x === undefined || y === undefined) return;

        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid) as TUser | null;
        if (!user || user.token !== token) return;

        const validTypes: Array<'sporomet' | 'champigneb' | 'eblekar' | 'pizdoglyad'> = ['sporomet', 'champigneb', 'eblekar', 'pizdoglyad'];
        if (!validTypes.includes(type as 'sporomet' | 'champigneb' | 'eblekar' | 'pizdoglyad')) return;

        this.triggerSpawnUnit({ armyGuid: guid, type: type as 'sporomet' | 'champigneb' | 'eblekar' | 'pizdoglyad', x, y });
    }
}

export default ArmyManager;
