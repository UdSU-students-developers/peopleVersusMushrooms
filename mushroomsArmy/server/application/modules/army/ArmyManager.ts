import BaseManager, { TManagerOptions } from '../BaseManager';
import CONFIG from '../../../config';
import { Army, TMap, TArmyState, TBuildingInput } from '../../army/Army';
import { ArmyStateManager, ArmyMode, EconomyRequest, EconomyResponse } from '../../army/ArmyStateManager';
import { Socket } from 'socket.io';

const GLOBAL_CONFIG = require('../../../../../global/globalConfig');

const { GAME_STATE, LOBBY_START, GAME_STARTED } = CONFIG.SOCKET;

type TStartGame = { guid: string; map?: TMap; buildings: TBuildingInput[]; mapGuid: string; peopleArmyGuid?: string | null };
type TTakeDamage = { armyGuid: string; unitGuid: string; amount: number };
type TMoveUnit = { armyGuid: string; unitGuid: string; x: number; y: number };
type TGetArmy = string;
type TSpawnUnit = { armyGuid: string; type: 'sporomet' | 'champigneb' | 'eblekar' | 'pizdoglyad'; x: number; y: number };
type TSpawnBuildingUnit = { armyGuid: string; type: 'vzryvomor' | 'sporovaya_bashnya'; x: number; y: number };
type TUpdateEconomyBuildings = { armyGuid: string; buildings: TBuildingInput[] };
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

class ArmyManager extends BaseManager {
    private army: { [guid: string]: Army };
    private armyStateManagers: { [guid: string]: ArmyStateManager };
    private armyGuids: Record<string, { peopleArmyGuid: string | null }>;

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

        this.mediator.set(CONFIG.MEDIATOR.TRIGGERS.UPDATE_ECONOMY_BUILDINGS, (data: unknown) =>
            this.triggerUpdateEconomyBuildings(data as TUpdateEconomyBuildings)
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

        // Ищем цель среди юнитов
        const unit = army.units.find(u => u.guid === unitGuid);
        if (unit) {
            unit.takeDamage(sanitizedAmount);
            return true;
        }

        // Ищем цель среди зданий
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

        (unit as any).targetX = x;
        (unit as any).targetY = y;

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
        }

        return result;
    }

    private triggerSpawnBuildingUnit({ armyGuid, type, x, y }: TSpawnBuildingUnit): { guid: string } | null {
        const army = this.army[armyGuid];
        if (!army) return null;

        return army.spawnBuilding(type, x, y, this.common);
    }

    private triggerUpdateEconomyBuildings({ armyGuid, buildings }: TUpdateEconomyBuildings): boolean {
        const army = this.army[armyGuid];
        if (!army) return false;

        army.setEconomyBuildings(buildings);
        return true;
    }

    private triggerGetArmyMetrics(armyGuid: string): object | null {
        const stateManager = this.armyStateManagers[armyGuid];
        if (!stateManager) return null;

        return {
            metrics: stateManager.getMetrics(),
            scouts: stateManager.getScouts(),
        };
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

    private async updateArmyCallback(guid: string, armyState: TArmyState) {
        const user = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid) as { socketId: string } | null;
        if (!user) return;

        const army = this.army[guid];
        const fogMap = army ? this.buildFogMap(armyState, army.map) : armyState.map;
        
        const stateManager = this.armyStateManagers[guid];
        const metrics = stateManager ? stateManager.getMetrics() : null;
        
        this.io.to(user.socketId).emit(GAME_STATE, this.answer.good({ 
            ...armyState, 
            map: fogMap,
            metrics,
        }));

        // if (army && army.getAliveUnits().length === 0) {
        //     this.io.to(user.socketId).emit(GAME_OVER, this.answer.good({ message: 'Все юниты погибли' }));
        //     this.destroyArmy(guid);
        //     return;
        // }
        
        // if (army && army.buildings.length === 0) {
        //     this.io.to(user.socketId).emit(GAME_OVER, this.answer.good({ message: 'Все здания разрушены' }));
        //     this.destroyArmy(guid);
        //     return;
        // }

        const { units, buildings } = armyState;

        // Отправляем юниты и здания на карту
        await this.send<{ mapGuid: string; userGuid: string; units: TArmyState['units'] }>(
            `${GLOBAL_CONFIG.MAP.URL}${GLOBAL_CONFIG.URLS.UPDATE_UNITS}`,
            { mapGuid: army.mapGuid, userGuid: army.guid, units }
        );

        await this.send<{ mapGuid: string; userGuid: string; buildings: TArmyState['buildings'] }>(
            `${GLOBAL_CONFIG.MAP.URL}${GLOBAL_CONFIG.URLS.UPDATE_BUILDINGS}`,
            { mapGuid: army.mapGuid, userGuid: army.guid, buildings }
        );

        // Получаем видимых врагов
        const visibility = await this.sendToMap<TVisibilityResponse>(
            GLOBAL_CONFIG.URLS.GET_VISIBILITY, army.mapGuid, army.guid
        );

        const visibleEnemies: TVisibleEntity[] = [
            ...(visibility?.units ?? []),
            ...(visibility?.buildings ?? []),
        ];

        if (visibleEnemies.length > 0) {
            const enemyEntities: TBuildingInput[] = visibleEnemies.map(entity => ({
                guid: entity.guid,
                type: entity.type,
                x: entity.x,
                y: entity.y,
                hp: entity.hp,
            }));
            army.updateEnemyEntities(enemyEntities);
        }
    }

    private async damagePeopleUnit(armyGuid: string, unitGuid: string, amount: number): Promise<void> {
        const guids = this.armyGuids[armyGuid];
        if (!guids?.peopleArmyGuid) return;
        await this.send(
            `${GLOBAL_CONFIG.PEOPLE_ARMY.URL}${GLOBAL_CONFIG.URLS.TAKE_DAMAGE_PEOPLE_ARMY}`,
            { userGuid: guids.peopleArmyGuid, unitGuid, damage: amount }
        );
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
        
        delete this.army[guid];
        delete this.armyStateManagers[guid];
        delete this.armyGuids[guid];
    }

    private async handleEconomyRequest(request: EconomyRequest): Promise<EconomyResponse | null> {
        try {
            const response = await this.send<EconomyRequest, { success: boolean; data?: unknown }>(
                `${GLOBAL_CONFIG.ECONOMY.URL}${GLOBAL_CONFIG.URLS.ECONOMY_REQUEST}`,
                request
            );

            if (!response) return null;

            return {
                success: response.success,
                data: response.data as EconomyResponse['data'],
            };
        } catch (error) {
            return null;
        }
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

    private async eventStartGame({ guid, map, buildings, mapGuid, peopleArmyGuid }: TStartGame): Promise<void> {
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

        this.armyGuids[guid] = { peopleArmyGuid: peopleArmyGuid ?? null };
        this.army[guid] = new Army({
            mapGuid,
            map: resolvedMap,
            buildings: finalBuildings,
            common: this.common,
            guid,
            callbacks: {
                update: (guid: string, armyState: TArmyState) => this.updateArmyCallback(guid, armyState),
                takeDamage: (unitGuid: string, amount: number) => this.damagePeopleUnit(guid, unitGuid, amount),
            }
        });

        this.armyStateManagers[guid] = new ArmyStateManager({
            army: this.army[guid],
            common: this.common,
            onModeChange: (mode) => this.handleModeChange(guid, mode),
            onDistanceMilestone: (distance) => this.handleDistanceMilestone(guid, distance),
            onScoutRespawn: (scoutGuid) => this.handleScoutRespawn(guid, scoutGuid),
            economyRequestCallback: (request) => this.handleEconomyRequest(request),
        });

        const userObj = this.mediator.get(this.TRIGGERS.GET_USER_BY_GUID, guid) as TUser | null;
        if (userObj?.socketId) {
            this.io.to(userObj.socketId).emit(GAME_STARTED, this.answer.good(true));
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
