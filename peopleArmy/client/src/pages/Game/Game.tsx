import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import CONFIG from '../../config';
import './Game.css';
import {
    UNIT_FRAME_SRCS,
    VZRYVOMOR_BUILDING_SRCS,
    SPOROVAYA_BASHNYA_SRCS,
    PEOPLE_ECONOMY_BUILDING_SRCS,
    MUSHROOMS_ECONOMY_BUILDING_SRCS,
    BUILDING_DEFAULT_SIZE,
    LARVA_SPRITE_SRCS,
} from './assets';
import { TILE } from './terrainConstants';
import { drawTerrainCell } from './terrainRenderer';
import { getTerrainTilePreviewUrl } from './terrainTiles';

/** Базовый размер клетки (карта скроллится, если не влезает) */
const MIN_CELL_PX = 40;
/** Максимум клетки при зуме */
const MAX_CELL_PX = 72;
/** Запас под padding обёртки (см. Game.css .game-canvas-wrap) */
const CANVAS_WRAP_PAD_PX = 40;
const ZOOM_DEFAULT = 1;
const ZOOM_MIN = 0.15;
const ZOOM_MAX = 4.0;
/** Мультипликативный шаг зума — как в map-клиенте (20% за шаг колёсика) */
const ZOOM_FACTOR = 0.2;

/** Кадры спрайтов (ходьба юнитов, vzryvomor, здания mushroomsEconomy, союзные здания) */
const SPRITE_FRAME_MS = 200;

/** Типы юнитов в легенде (фиксированный порядок) */
const ALLY_LEGEND_TYPES = ['soldier', 'bmp', 'partizan', 'sniper'] as const;
const ENEMY_LEGEND_TYPES = ['sporomet', 'champigneb', 'eblekar', 'pizdoglyad', 'larva'] as const;
/** Здания mushroomsArmy на карте */
const ENEMY_BUILDING_LEGEND_TYPES = ['sporovaya_bashnya', 'vzryvomor'] as const;

const TERRAIN_PREVIEW = {
    grass: getTerrainTilePreviewUrl('grass', 0),
    water: getTerrainTilePreviewUrl('water', 0),
    stone: getTerrainTilePreviewUrl('stone', 0),
};

const LEGEND_LABELS: Record<(typeof ALLY_LEGEND_TYPES)[number] | (typeof ENEMY_LEGEND_TYPES)[number], string> = {
    soldier: 'Солдат',
    bmp: 'БМП',
    partizan: 'Партизан',
    sniper: 'Снайпер',
    sporomet: 'Споромёт',
    champigneb: 'Шампиньёнб',
    eblekar: 'Эблекар',
    pizdoglyad: 'Пиздогляд',
    larva: 'Личинка',
};

const BUILDING_LEGEND_LABELS: Record<(typeof ENEMY_BUILDING_LEGEND_TYPES)[number], string> = {
    sporovaya_bashnya: 'Споровая башня',
    vzryvomor: 'Взрывомор',
};

const BUILDING_LEGEND_PREVIEW: Record<(typeof ENEMY_BUILDING_LEGEND_TYPES)[number], string> = {
    sporovaya_bashnya: SPOROVAYA_BASHNYA_SRCS.idle,
    vzryvomor: VZRYVOMOR_BUILDING_SRCS[0],
};

const COLOR = {
    bg: '#0d1117',
    grid: '#1a2332',
    water: '#1a4f6e',
    waterLight: '#2a6a8f',
    waterDeep: '#123d55',
    mountain: '#5a5f66',
    mountainLight: '#7a8088',
    mountainDark: '#3d4248',
    terrainUnknown: '#5c3d4a',
    soldier: '#4a9eff',
    soldierBorder: '#7dc4ff',
    bmp: '#39d353',
    bmpBorder: '#7ee787',
    target: 'rgba(255, 200, 50, 0.25)',
    targetBorder: 'rgba(255, 200, 50, 0.7)',
    enemyMushroom: '#bc8cff',
    enemyMushroomBorder: '#e9ddff',
    hpBarBg: '#d32f2f',
    hpBarAlly: '#4caf50',
    hpBarEnemy: '#9c27b0',
    enemyBuildingFallback: '#6a0dad',
    enemyBuildingFallbackStroke: '#b388ff',
    alliedBuildingFallback: '#1e4d6b',
};

const buildingImageCache: Record<string, HTMLImageElement> = {};
function getBuildingImage(key: string, src: string): HTMLImageElement {
    if (!buildingImageCache[key]) {
        const img = new Image();
        img.src = src;
        buildingImageCache[key] = img;
    }
    return buildingImageCache[key];
}

const vzryvomorBuildingImgs = VZRYVOMOR_BUILDING_SRCS.map((src, i) =>
    getBuildingImage(`vzryvomor_b_${i}`, src),
);
const bashnyaIdleImg = getBuildingImage('bashnya_idle', SPOROVAYA_BASHNYA_SRCS.idle);

/** Кадры личинки в кэше зданий — те же URL, что в drawEnemyBuilding для type larva */
LARVA_SPRITE_SRCS.forEach((src) => {
    getBuildingImage(`mush-econ:larva:${src}`, src);
});

const unitImageCache: Record<string, HTMLImageElement[]> = {};
const prevUnitPositions = new Map<string, { x: number; y: number }>();

function isImageDrawable(img: HTMLImageElement | undefined): img is HTMLImageElement {
    return img !== undefined && img.complete && img.naturalWidth > 0;
}

function tryDrawImageScaled(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
): boolean {
    try {
        ctx.drawImage(img, dx, dy, dw, dh);
        return true;
    } catch {
        return false;
    }
}

function spriteFrameIndex(frameCount: number): number {
    if (frameCount <= 0) return 0;
    return Math.floor(Date.now() / SPRITE_FRAME_MS) % frameCount;
}

function normUnitType(type: string | undefined): string {
    const t = String(type ?? '').trim().toLowerCase();
    return t || 'soldier';
}

function countUnitsByTypes(units: { type?: string }[], types: readonly string[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const t of types) {
        out[t] = 0;
    }
    for (const u of units) {
        const t = normUnitType(u.type);
        if (Object.prototype.hasOwnProperty.call(out, t)) {
            out[t] += 1;
        }
    }
    return out;
}

function countBuildingsByTypes(
    buildings: EnemyBuildingData[],
    types: readonly string[],
): Record<string, number> {
    const out: Record<string, number> = {};
    for (const t of types) {
        out[t] = 0;
    }
    for (const b of buildings) {
        if (!isEnemyBuildingAlive(b)) continue;
        const t = normBuildingType(b.type);
        if (Object.prototype.hasOwnProperty.call(out, t)) {
            out[t] += 1;
        }
    }
    return out;
}

function getUnitFrames(type: string): HTMLImageElement[] {
    const key = normUnitType(type);
    if (unitImageCache[key]) return unitImageCache[key];
    const srcs = UNIT_FRAME_SRCS[key];
    if (!srcs) return [];
    const imgs = srcs.map((src) => Object.assign(new Image(), { src }));
    unitImageCache[key] = imgs;
    return imgs;
}

function getUnitImage(unit: { guid: string; x: number; y: number; type?: string }): HTMLImageElement | undefined {
    const type = normUnitType(unit.type);
    const frames = getUnitFrames(type);
    if (frames.length === 0) return undefined;
    if (frames.length === 1) return frames[0];
    const prev = prevUnitPositions.get(unit.guid);
    const isMoving = prev !== undefined && (prev.x !== unit.x || prev.y !== unit.y);
    prevUnitPositions.set(unit.guid, { x: unit.x, y: unit.y });
    if (!isMoving) return frames[0];
    return frames[spriteFrameIndex(frames.length)];
}

void getUnitFrames('larva');

function normBuildingType(type: string | undefined): string {
    return String(type ?? '').toLowerCase();
}

/** Удаляет кэш позиций для юнитов, которых больше нет в снимке армии */
function pruneWalkPositionCache(activeGuids: Set<string>): void {
    const stale: string[] = [];
    prevUnitPositions.forEach((_, guid) => {
        if (!activeGuids.has(guid)) stale.push(guid);
    });
    for (const guid of stale) {
        prevUnitPositions.delete(guid);
    }
}

function collectUnitGuids(units: UnitData[], enemyUnits: EnemyUnitData[]): Set<string> {
    const guids = new Set<string>();
    for (const u of units) {
        if (u?.guid) guids.add(u.guid);
    }
    for (const u of enemyUnits) {
        if (u?.guid) guids.add(u.guid);
    }
    return guids;
}

function drawHealthBar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    size: number,
    cell: number,
    hpPct: number,
    hpFill: string,
): void {
    const barW = size;
    const barH = Math.max(3, cell * 0.07);
    const barX = cx - barW / 2;
    const barY = cy - r - barH - 2;
    ctx.fillStyle = COLOR.hpBarBg;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpFill;
    ctx.fillRect(barX, barY, barW * hpPct, barH);
}

interface UnitData {
    guid: string;
    type?: string;
    x: number;
    y: number;
    hp: number;
    maxHp?: number;
    speed: number;
    targetX: number | null;
    targetY: number | null;
}

/** Юнит армии грибов (mushroomsArmy / карта) в enemyUnits */
interface EnemyUnitData {
    guid: string;
    type: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    isAlive?: boolean;
    speed: number;
    attackRange: number;
}

interface EnemyBuildingData {
    guid: string;
    type: string;
    x: number;
    y: number;
    size?: number;
    hp?: number;
    isAlive?: boolean;
}

function isEnemyBuildingAlive(b: EnemyBuildingData): boolean {
    if (b.isAlive === false) return false;
    if (typeof b.hp === 'number' && b.hp <= 0) return false;
    return true;
}

interface ArmyData {
    units: UnitData[];
    enemyUnits?: EnemyUnitData[];
    enemyBuildings?: EnemyBuildingData[];
    alliedBuildings?: EnemyBuildingData[];
    destroyedEnemyBuildingGuids?: string[];
}

interface ArmySocketPayload {
    result?: string;
    data?: ArmyData;
}

type ArmySocket = {
    on(event: string, handler: (response: ArmySocketPayload) => void): void;
    off(event: string, handler: (response: ArmySocketPayload) => void): void;
};

function getBuildingSize(b: EnemyBuildingData): number {
    const type = normBuildingType(b.type);
    return Math.max(1, Number(b.size) || BUILDING_DEFAULT_SIZE[type] || 1);
}

function drawMap(ctx: CanvasRenderingContext2D, map: number[][], cell: number) {
    const rows = map.length;
    const cols = map.reduce((max, row) => Math.max(max, row.length), 0);

    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, cols * cell, rows * cell);

    for (let y = 0; y < rows; y++) {
        const row = map[y];
        for (let x = 0; x < cols; x++) {
            const v = row[x];
            const px = x * cell;
            const py = y * cell;
            drawTerrainCell(ctx, x, y, px, py, cell, v, COLOR.terrainUnknown);
        }
    }
}

function drawUnit(ctx: CanvasRenderingContext2D, unit: UnitData, cell: number) {
    const cx = unit.x * cell + cell / 2;
    const cy = unit.y * cell + cell / 2;
    const isBmp = unit.type === 'bmp' || unit.speed >= 3;
    const r = isBmp ? cell * 0.48 : cell * 0.44;
    const size = r * 2;

    if (unit.targetX != null && unit.targetY != null) {
        const tx = unit.targetX * cell + cell / 2;
        const ty = unit.targetY * cell + cell / 2;
        ctx.strokeStyle = isBmp ? COLOR.bmpBorder : COLOR.soldierBorder;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = Math.max(0.5, cell * 0.08);
        ctx.setLineDash([Math.max(2, cell * 0.2), Math.max(2, cell * 0.28)]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        const m = Math.max(1, cell * 0.15);
        ctx.fillStyle = COLOR.target;
        ctx.strokeStyle = COLOR.targetBorder;
        ctx.lineWidth = Math.max(0.5, cell * 0.06);
        ctx.fillRect(unit.targetX * cell + m, unit.targetY * cell + m, cell - 2 * m, cell - 2 * m);
        ctx.strokeRect(unit.targetX * cell + m, unit.targetY * cell + m, cell - 2 * m, cell - 2 * m);
    }

    const img = getUnitImage(unit);
    let spriteOk = false;
    if (isImageDrawable(img)) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(-1, 1);
        spriteOk = tryDrawImageScaled(ctx, img, -size / 2, -size / 2, size, size);
        ctx.restore();
    }
    if (!spriteOk) {
        if (isBmp) {
            const s = r * 1.6;
            ctx.fillStyle = COLOR.bmp;
            ctx.strokeStyle = COLOR.bmpBorder;
            ctx.lineWidth = Math.max(1, cell * 0.1);
            ctx.beginPath();
            ctx.roundRect(cx - s / 2, cy - s / 2, s, s, Math.max(1, cell * 0.12));
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillStyle = COLOR.soldier;
            ctx.strokeStyle = COLOR.soldierBorder;
            ctx.lineWidth = Math.max(1, cell * 0.1);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }

    const maxHp = unit.maxHp ?? (isBmp ? 30 : 10);
    const hpPct = Math.max(0, Math.min(1, unit.hp / maxHp));
    drawHealthBar(ctx, cx, cy, r, size, cell, hpPct, COLOR.hpBarAlly);
}

function drawEnemyUnit(ctx: CanvasRenderingContext2D, unit: EnemyUnitData, cell: number) {
    if (unit.isAlive === false || unit.hp <= 0) return;

    const cx = unit.x * cell + cell / 2;
    const cy = unit.y * cell + cell / 2;
    const isLarge = unit.type === 'vzryvomor';
    const r = isLarge ? cell * 0.48 : cell * 0.44;
    const size = r * 2;

    const img = getUnitImage(unit);
    if (!isImageDrawable(img) || !tryDrawImageScaled(ctx, img, cx - size / 2, cy - size / 2, size, size)) {
        ctx.fillStyle = COLOR.enemyMushroom;
        ctx.strokeStyle = COLOR.enemyMushroomBorder;
        ctx.lineWidth = Math.max(1, cell * 0.1);
        ctx.beginPath();
        ctx.roundRect(cx - r, cy - r, size, size, Math.max(2, cell * 0.2));
        ctx.fill();
        ctx.stroke();
    }

    const hpPct = Math.max(0, Math.min(1, unit.hp / (unit.maxHp || unit.hp)));
    drawHealthBar(ctx, cx, cy, r, size, cell, hpPct, COLOR.hpBarEnemy);
}

function drawEnemyBuilding(ctx: CanvasRenderingContext2D, b: EnemyBuildingData, cell: number) {
    if (!isEnemyBuildingAlive(b)) return;

    const size = getBuildingSize(b);
    const px = b.x * cell;
    const py = b.y * cell;
    const pw = size * cell;
    const ph = size * cell;

    let img: HTMLImageElement | undefined;
    const type = normBuildingType(b.type);
    if (type === 'vzryvomor') {
        img = vzryvomorBuildingImgs[spriteFrameIndex(vzryvomorBuildingImgs.length)];
    } else if (type === 'sporovaya_bashnya') {
        img = bashnyaIdleImg;
    } else {
        const frames = MUSHROOMS_ECONOMY_BUILDING_SRCS[type];
        const frameSrc = Array.isArray(frames) && frames.length > 0
            ? frames[spriteFrameIndex(frames.length)]
            : undefined;
        if (frameSrc) {
            img = getBuildingImage(`mush-econ:${type}:${frameSrc}`, frameSrc);
        }
    }

    if (img && isImageDrawable(img) && tryDrawImageScaled(ctx, img, px, py, pw, ph)) {
        return;
    }

    ctx.fillStyle = COLOR.enemyBuildingFallback;
    ctx.strokeStyle = COLOR.enemyBuildingFallbackStroke;
    ctx.lineWidth = Math.max(1, cell * 0.06);
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeRect(px, py, pw, ph);
}

function drawAlliedBuilding(ctx: CanvasRenderingContext2D, b: EnemyBuildingData, cell: number) {
    const size = getBuildingSize(b);
    const px = b.x * cell;
    const py = b.y * cell;
    const pw = size * cell;
    const ph = size * cell;
    const type = normBuildingType(b.type);

    const frames = PEOPLE_ECONOMY_BUILDING_SRCS[type];
    const frame = Array.isArray(frames) && frames.length > 0
        ? frames[spriteFrameIndex(frames.length)]
        : undefined;

    if (frame) {
        const img = getBuildingImage(`people-econ:${type}:${frame}`, frame);
        if (isImageDrawable(img) && tryDrawImageScaled(ctx, img, px, py, pw, ph)) {
            return;
        }
    }

    ctx.fillStyle = COLOR.alliedBuildingFallback;
    ctx.strokeStyle = COLOR.soldierBorder;
    ctx.lineWidth = Math.max(1, cell * 0.06);
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeRect(px, py, pw, ph);
}

function isValidMap(map: unknown): map is number[][] {
    return (
        Array.isArray(map) &&
        map.length > 0 &&
        map.every((row) => Array.isArray(row) && row.length > 0 && row.every((c) => Number.isFinite(c)))
    );
}

function getMapSize(map: number[][]): { cols: number; rows: number } {
    if (!isValidMap(map)) return { cols: 0, rows: 0 };
    const rows = map.length;
    const cols = map.reduce((max, row) => Math.max(max, row.length), 0);
    return { cols, rows };
}

function fitCellToWrap(wrap: HTMLElement, cols: number, rows: number): number {
    if (cols <= 0 || rows <= 0) return MIN_CELL_PX;
    const { width, height } = wrap.getBoundingClientRect();
    const aw = Math.max(1, width - CANVAS_WRAP_PAD_PX);
    const ah = Math.max(1, height - CANVAS_WRAP_PAD_PX);
    const fit = Math.min(aw / cols, ah / rows);
    return Math.min(Math.max(fit, MIN_CELL_PX), MAX_CELL_PX);
}

type LegendUnitStats = {
    allies: Record<string, number>;
    enemies: Record<string, number>;
    enemyBuildings: Record<string, number>;
};

function applyArmyUpdate(
    data: ArmyData,
    unitsRef: React.MutableRefObject<UnitData[]>,
    enemyUnitsRef: React.MutableRefObject<EnemyUnitData[]>,
    enemyBuildingsRef: React.MutableRefObject<Map<string, EnemyBuildingData>>,
    alliedBuildingsRef: React.MutableRefObject<Map<string, EnemyBuildingData>>,
    setUnitCount: (n: number) => void,
    setLegendUnitStats: (s: LegendUnitStats) => void,
): void {
    if (Array.isArray(data.units)) {
        unitsRef.current = data.units;
        setUnitCount(data.units.length);
    }
    if (Array.isArray(data.enemyUnits)) {
        enemyUnitsRef.current = data.enemyUnits;
    }
    pruneWalkPositionCache(collectUnitGuids(unitsRef.current, enemyUnitsRef.current));

    if (Array.isArray(data.destroyedEnemyBuildingGuids)) {
        for (const guid of data.destroyedEnemyBuildingGuids) {
            if (guid) enemyBuildingsRef.current.delete(guid);
        }
    }
    if (Array.isArray(data.alliedBuildings)) {
        const seenAllied = new Set<string>();
        for (const b of data.alliedBuildings) {
            if (!b?.guid) continue;
            seenAllied.add(b.guid);
            alliedBuildingsRef.current.set(b.guid, b);
        }
        alliedBuildingsRef.current.forEach((_, guid) => {
            if (!seenAllied.has(guid)) {
                alliedBuildingsRef.current.delete(guid);
            }
        });
    }
    if (Array.isArray(data.enemyBuildings)) {
        for (const b of data.enemyBuildings) {
            if (!b?.guid) continue;
            if (!isEnemyBuildingAlive(b)) {
                enemyBuildingsRef.current.delete(b.guid);
                continue;
            }
            enemyBuildingsRef.current.set(b.guid, b);
        }
    }

    setLegendUnitStats({
        allies: countUnitsByTypes(unitsRef.current, ALLY_LEGEND_TYPES),
        enemies: countUnitsByTypes(enemyUnitsRef.current, ENEMY_LEGEND_TYPES),
        enemyBuildings: countBuildingsByTypes(
            Array.from(enemyBuildingsRef.current.values()),
            ENEMY_BUILDING_LEGEND_TYPES,
        ),
    });
}

const Game: React.FC<IBasePage> = ({ mediator, setPage }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasWrapRef = useRef<HTMLDivElement>(null);
    const pendingScrollRef = useRef<{ ratio: number; sl: number; st: number } | null>(null);
    const cellPxRef = useRef(MIN_CELL_PX);
    const baseCellRef = useRef(MIN_CELL_PX);
    const zoomRef = useRef(ZOOM_DEFAULT);
    const mapRef = useRef<number[][]>([]);
    const unitsRef = useRef<UnitData[]>([]);
    const enemyUnitsRef = useRef<EnemyUnitData[]>([]);
    const enemyBuildingsRef = useRef<Map<string, EnemyBuildingData>>(new Map());
    const alliedBuildingsRef = useRef<Map<string, EnemyBuildingData>>(new Map());
    const animFrameRef = useRef<number>(0);
    const [unitCount, setUnitCount] = useState(0);
    const [legendUnitStats, setLegendUnitStats] = useState<LegendUnitStats>(() => ({
        allies: countUnitsByTypes([], ALLY_LEGEND_TYPES),
        enemies: countUnitsByTypes([], ENEMY_LEGEND_TYPES),
        enemyBuildings: countBuildingsByTypes([], ENEMY_BUILDING_LEGEND_TYPES),
    }));
    const [hasMap, setHasMap] = useState(false);
    const [zoom, setZoom] = useState(ZOOM_DEFAULT);

    const socket = mediator.get(CONFIG.MEDIATOR.TRIGGERS.GET_STORE, 'socket') as ArmySocket | undefined;

    useEffect(() => {
        const stored = mediator.get(CONFIG.MEDIATOR.TRIGGERS.GET_STORE, 'map');
        if (isValidMap(stored)) {
            mapRef.current = stored;
            setHasMap(true);
        } else {
            mapRef.current = [];
            setHasMap(false);
        }
    }, [mediator]);

    useLayoutEffect(() => {
        if (!hasMap) return;
        const wrap = canvasWrapRef.current;
        if (!wrap) return;

        const updateCell = () => {
            const map = mapRef.current;
            if (!isValidMap(map)) return;
            const { cols, rows } = getMapSize(map);
            baseCellRef.current = fitCellToWrap(wrap, cols, rows);
            cellPxRef.current = baseCellRef.current * zoomRef.current;
        };

        updateCell();
        const ro = new ResizeObserver(() => updateCell());
        ro.observe(wrap);
        window.addEventListener('resize', updateCell);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', updateCell);
        };
    }, [hasMap]);

    const applyZoom = useCallback((next: number) => {
        const wrap = canvasWrapRef.current;
        const prev = zoomRef.current;
        if (wrap && prev > 0 && next !== prev) {
            pendingScrollRef.current = {
                ratio: next / prev,
                sl: wrap.scrollLeft,
                st: wrap.scrollTop,
            };
        }
        zoomRef.current = next;
        cellPxRef.current = baseCellRef.current * next;
        setZoom(next);
    }, []);

    useEffect(() => {
        const wrap = canvasWrapRef.current;
        if (!wrap) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1 + ZOOM_FACTOR : 1 - ZOOM_FACTOR;
            const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomRef.current * factor));
            applyZoom(next);
        };
        wrap.addEventListener('wheel', onWheel, { passive: false });
        return () => wrap.removeEventListener('wheel', onWheel);
    }, [applyZoom]);

    const zoomIn = useCallback(
        () => applyZoom(Math.min(ZOOM_MAX, zoomRef.current * (1 + ZOOM_FACTOR))),
        [applyZoom],
    );
    const zoomOut = useCallback(
        () => applyZoom(Math.max(ZOOM_MIN, zoomRef.current * (1 - ZOOM_FACTOR))),
        [applyZoom],
    );
    const zoomReset = useCallback(() => applyZoom(ZOOM_DEFAULT), [applyZoom]);

    const zoomPercent = useMemo(() => Math.round((zoom / ZOOM_DEFAULT) * 100), [zoom]);

    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const wrap = canvasWrapRef.current;
        if (!wrap) return;

        const onMouseDown = (e: MouseEvent) => {
            if (e.button !== 0) return;
            isDraggingRef.current = true;
            dragStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                scrollLeft: wrap.scrollLeft,
                scrollTop: wrap.scrollTop,
            };
            setIsDragging(true);
            e.preventDefault();
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y;
            wrap.scrollLeft = dragStartRef.current.scrollLeft - dx;
            wrap.scrollTop = dragStartRef.current.scrollTop - dy;
        };

        const onMouseUp = () => {
            isDraggingRef.current = false;
            setIsDragging(false);
        };

        wrap.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            wrap.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const map = mapRef.current;
        if (isValidMap(map)) {
            const { cols, rows } = getMapSize(map);
            const cell = cellPxRef.current;
            const w = Math.max(1, Math.ceil(cols * cell));
            const h = Math.max(1, Math.ceil(rows * cell));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
            drawMap(ctx, map, cell);
            alliedBuildingsRef.current.forEach((b) => drawAlliedBuilding(ctx, b, cell));
            enemyBuildingsRef.current.forEach((b) => drawEnemyBuilding(ctx, b, cell));
            enemyUnitsRef.current.forEach((eu) => drawEnemyUnit(ctx, eu, cell));
            unitsRef.current.forEach((unit) => drawUnit(ctx, unit, cell));

            const wrap = canvasWrapRef.current;
            const pend = pendingScrollRef.current;
            if (wrap && pend) {
                pendingScrollRef.current = null;
                const maxL = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
                const maxT = Math.max(0, wrap.scrollHeight - wrap.clientHeight);
                wrap.scrollLeft = Math.max(0, Math.min(pend.sl * pend.ratio, maxL));
                wrap.scrollTop = Math.max(0, Math.min(pend.st * pend.ratio, maxT));
            }
        }

        animFrameRef.current = requestAnimationFrame(render);
    }, []);

    useEffect(() => {
        animFrameRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [render]);

    useEffect(() => {
        if (!socket) return;

        const handler = (response: ArmySocketPayload) => {
            if (response?.result !== 'ok') return;
            const data = response.data;
            if (!data) return;
            applyArmyUpdate(
                data,
                unitsRef,
                enemyUnitsRef,
                enemyBuildingsRef,
                alliedBuildingsRef,
                setUnitCount,
                setLegendUnitStats,
            );
        };

        socket.on(CONFIG.SOCKETS.UPDATE_ARMY, handler);
        return () => socket.off(CONFIG.SOCKETS.UPDATE_ARMY, handler);
    }, [socket]);

    return (
        <div className="game-page">
            <div className="game-sidebar">
                <h2 className="game-title">Армия</h2>

                <div className="game-stat">
                    <span className="game-stat-label">Юнитов</span>
                    <span className="game-stat-value">{unitCount}</span>
                </div>

                <div className="game-section">
                    <p className="game-section-label">Лобби</p>
                    <button
                        type="button"
                        className="game-type-btn"
                        onClick={() => setPage(PAGES.LOBBY)}
                    >
                        Открыть лобби
                    </button>
                </div>

                <div className="game-section">
                    <p className="game-section-label">Масштаб</p>
                    <div className="game-zoom">
                        <button className="game-zoom-btn" onClick={zoomOut} title="Уменьшить (−)">−</button>
                        <button className="game-zoom-value" onClick={zoomReset} title="Сбросить">{zoomPercent}%</button>
                        <button className="game-zoom-btn" onClick={zoomIn} title="Увеличить (+)">+</button>
                    </div>
                </div>

                <div className="game-legend">
                    <p className="game-section-label">Легенда</p>
                    <p className="game-legend-subhead">Армия людей</p>
                    {ALLY_LEGEND_TYPES.map((type) => (
                        <div key={type} className="game-legend-row game-legend-row--unit">
                            <img
                                className="game-legend-sprite"
                                src={UNIT_FRAME_SRCS[type]?.[0]}
                                alt=""
                                width={22}
                                height={22}
                            />
                            <span className="game-legend-name">{LEGEND_LABELS[type]}</span>
                            <span className="game-legend-count">{legendUnitStats.allies[type] ?? 0}</span>
                        </div>
                    ))}
                    <p className="game-legend-subhead">Армия грибов</p>
                    {ENEMY_LEGEND_TYPES.map((type) => (
                        <div key={type} className="game-legend-row game-legend-row--unit">
                            <img
                                className="game-legend-sprite"
                                src={UNIT_FRAME_SRCS[type]?.[0]}
                                alt=""
                                width={22}
                                height={22}
                            />
                            <span className="game-legend-name">{LEGEND_LABELS[type]}</span>
                            <span className="game-legend-count">{legendUnitStats.enemies[type] ?? 0}</span>
                        </div>
                    ))}
                    <p className="game-legend-subhead">Здания (армия грибов)</p>
                    {ENEMY_BUILDING_LEGEND_TYPES.map((type) => (
                        <div key={type} className="game-legend-row game-legend-row--unit">
                            <img
                                className="game-legend-sprite"
                                src={BUILDING_LEGEND_PREVIEW[type]}
                                alt=""
                                width={22}
                                height={22}
                            />
                            <span className="game-legend-name">{BUILDING_LEGEND_LABELS[type]}</span>
                            <span className="game-legend-count">{legendUnitStats.enemyBuildings[type] ?? 0}</span>
                        </div>
                    ))}
                    <p className="game-legend-subhead">Рельеф</p>
                    <div className="game-legend-row game-legend-row--unit">
                        <img className="game-legend-sprite game-legend-sprite--terrain" src={TERRAIN_PREVIEW.grass} alt="" width={22} height={22} />
                        <span className="game-legend-name">Земля</span>
                    </div>
                    <div className="game-legend-row game-legend-row--unit">
                        <img className="game-legend-sprite game-legend-sprite--terrain" src={TERRAIN_PREVIEW.water} alt="" width={22} height={22} />
                        <span className="game-legend-name">Вода</span>
                    </div>
                    <div className="game-legend-row game-legend-row--unit">
                        <img className="game-legend-sprite game-legend-sprite--terrain" src={TERRAIN_PREVIEW.stone} alt="" width={22} height={22} />
                        <span className="game-legend-name">Камень / горы</span>
                    </div>
                </div>
            </div>

            <div
                className={`game-canvas-wrap${isDragging ? ' game-canvas-wrap--dragging' : ''}`}
                ref={canvasWrapRef}
            >
                <div className="game-canvas-inner">
                    {!hasMap ? (
                        <p className="game-no-map">Карта не загружена</p>
                    ) : (
                        <canvas ref={canvasRef} className="game-canvas" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Game;
