import React, { useEffect, useLayoutEffect, useRef, useCallback, useState, useMemo } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import CONFIG from '../../config';
import './Game.css';
import {
    UNIT_FRAME_SRCS,
    VZRYVOMOR_BUILDING_SRCS,
    SPOROVAYA_BASHNYA_SRCS,
    BUILDING_DEFAULT_SIZE,
} from './assets';

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

/** Типы клеток рельефа (как в map/server/.../MapConfig.js TILES) */
const TILE = {
    PLANE: 0,
    WATER: 1,
    MOUNTAIN: 2,
} as const;

// Цвета
const COLOR = {
    bg: '#0d1117',
    grid: '#1a2332',
    water: '#1a4f6e',
    waterLight: '#2a6a8f',
    waterDeep: '#123d55',
    mountain: '#5a5f66',
    mountainLight: '#7a8088',
    mountainDark: '#3d4248',
    /** неизвестный код клетки */
    terrainUnknown: '#5c3d4a',
    soldier: '#4a9eff',
    soldierBorder: '#7dc4ff',
    bmp: '#39d353',
    bmpBorder: '#7ee787',
    target: 'rgba(255, 200, 50, 0.25)',
    targetBorder: 'rgba(255, 200, 50, 0.7)',
    /** юнит грибов (enemyUnits), см. mushroomsArmy API unit */
    enemyMushroom: '#bc8cff',
    enemyMushroomBorder: '#e9ddff',
};

const WALK_FRAME_MS = 150;
const VZRYVOMOR_FRAME_MS = 120;

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
    getBuildingImage(`vzryvomor_b_${i}`, src)
);
const bashnyaIdleImg = getBuildingImage('bashnya_idle', SPOROVAYA_BASHNYA_SRCS.idle);

const unitImageCache: Record<string, HTMLImageElement[]> = {};
const prevUnitPositions = new Map<string, { x: number; y: number }>();

function isImageDrawable(img: HTMLImageElement | undefined): img is HTMLImageElement {
    return img !== undefined && img.complete && img.naturalWidth > 0;
}

function tryDrawImageScaled(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    dx: number, dy: number, dw: number, dh: number,
): boolean {
    try {
        ctx.drawImage(img, dx, dy, dw, dh);
        return true;
    } catch {
        return false;
    }
}

function getUnitFrames(type: string): HTMLImageElement[] {
    if (unitImageCache[type]) return unitImageCache[type];
    const srcs = UNIT_FRAME_SRCS[type];
    if (!srcs) return [];
    const imgs = srcs.map(src => Object.assign(new Image(), { src }));
    unitImageCache[type] = imgs;
    return imgs;
}

function getUnitImage(unit: { guid: string; x: number; y: number; type?: string }): HTMLImageElement | undefined {
    const type = unit.type ?? 'soldier';
    const frames = getUnitFrames(type);
    if (frames.length === 0) return undefined;
    if (frames.length === 1) return frames[0];
    const prev = prevUnitPositions.get(unit.guid);
    const isMoving = prev !== undefined && (prev.x !== unit.x || prev.y !== unit.y);
    prevUnitPositions.set(unit.guid, { x: unit.x, y: unit.y });
    if (!isMoving) return frames[0];
    return frames[Math.floor(Date.now() / WALK_FRAME_MS) % frames.length];
}

// --- Интерфейсы ---

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

/** Формат unit армии грибов (mushroomsArmy) для enemyUnits */
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
    /** guid зданий, уничтоженных нашей армией — клиент убирает с карты */
    destroyedEnemyBuildingGuids?: string[];
}

function getBuildingSize(b: EnemyBuildingData): number {
    const type = String(b.type || '').toLowerCase();
    return Math.max(1, Number(b.size) || BUILDING_DEFAULT_SIZE[type] || 1);
}

function drawWaterCell(ctx: CanvasRenderingContext2D, px: number, py: number, cell: number) {
    const g = ctx.createLinearGradient(px, py, px + cell, py + cell);
    g.addColorStop(0, COLOR.waterLight);
    g.addColorStop(0.45, COLOR.water);
    g.addColorStop(1, COLOR.waterDeep);
    ctx.fillStyle = g;
    ctx.fillRect(px, py, cell, cell);
    // Лёгкая глубина без горизонтальных штрихов (они на стыках клеток давали полосы)
    const cx = px + cell * 0.35;
    const cy = py + cell * 0.4;
    const r = Math.max(1, cell * 0.55);
    const h = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    h.addColorStop(0, 'rgba(140, 210, 255, 0.12)');
    h.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = h;
    ctx.fillRect(px, py, cell, cell);
}

function drawMountainCell(ctx: CanvasRenderingContext2D, px: number, py: number, cell: number) {
    ctx.fillStyle = COLOR.mountainDark;
    ctx.fillRect(px, py, cell, cell);
    ctx.fillStyle = COLOR.mountain;
    const inset = cell * 0.08;
    ctx.fillRect(px + inset, py + inset, cell - 2 * inset, cell - 2 * inset);
    ctx.fillStyle = COLOR.mountainLight;
    const h = Math.max(1, cell * 0.25);
    const w = Math.max(1, cell * 0.35);
    ctx.fillRect(px + inset, py + inset, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = Math.max(0.5, cell * 0.05);
    ctx.strokeRect(px + inset, py + inset, cell - 2 * inset, cell - 2 * inset);
}

// Рисуем карту (фон + рельеф)
function drawMap(ctx: CanvasRenderingContext2D, map: number[][], cell: number) {
    const rows = map.length;
    const cols = map.reduce((max, row) => Math.max(max, row.length), 0);

    // Фон
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, cols * cell, rows * cell);

    // Сетка
    ctx.strokeStyle = COLOR.grid;
    ctx.lineWidth = Math.max(0.25, cell * 0.04);
    for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cell);
        ctx.lineTo(cols * cell, y * cell);
        ctx.stroke();
    }
    for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cell, 0);
        ctx.lineTo(x * cell, rows * cell);
        ctx.stroke();
    }

    for (let y = 0; y < rows; y++) {
        const row = map[y];
        for (let x = 0; x < cols; x++) {
            const v = row[x];
            const px = x * cell;
            const py = y * cell;
            if (v === TILE.WATER) {
                drawWaterCell(ctx, px, py, cell);
            } else if (v === TILE.MOUNTAIN) {
                drawMountainCell(ctx, px, py, cell);
            } else if (v !== undefined && v !== TILE.PLANE) {
                ctx.fillStyle = COLOR.terrainUnknown;
                ctx.fillRect(px, py, cell, cell);
            }
        }
    }
}

// Рисуем юнита
function drawUnit(ctx: CanvasRenderingContext2D, unit: UnitData, cell: number) {
    const cx = unit.x * cell + cell / 2;
    const cy = unit.y * cell + cell / 2;
    const isBmp = unit.type === 'bmp' || unit.speed >= 3;
    const r = isBmp ? cell * 0.48 : cell * 0.44;
    const size = r * 2;

    // Линия к цели
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

        // Маркер цели
        const m = Math.max(1, cell * 0.15);
        ctx.fillStyle = COLOR.target;
        ctx.strokeStyle = COLOR.targetBorder;
        ctx.lineWidth = Math.max(0.5, cell * 0.06);
        ctx.fillRect(unit.targetX * cell + m, unit.targetY * cell + m, cell - 2 * m, cell - 2 * m);
        ctx.strokeRect(unit.targetX * cell + m, unit.targetY * cell + m, cell - 2 * m, cell - 2 * m);
    }

    // Спрайт юнита (по умолчанию отражён по горизонтали), при недоступности — цветная фигура
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

    // Полоска HP
    const maxHp = unit.maxHp ?? (isBmp ? 30 : 10);
    const hpPct = Math.max(0, Math.min(1, unit.hp / maxHp));
    const barW = size;
    const barH = Math.max(3, cell * 0.07);
    const barX = cx - barW / 2;
    const barY = cy - r - barH - 2;
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(barX, barY, barW * hpPct, barH);
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
    const barW = size;
    const barH = Math.max(3, cell * 0.07);
    const barX = cx - barW / 2;
    const barY = cy - r - barH - 2;
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#9c27b0';
    ctx.fillRect(barX, barY, barW * hpPct, barH);
}

function drawEnemyBuilding(ctx: CanvasRenderingContext2D, b: EnemyBuildingData, cell: number) {
    if (!isEnemyBuildingAlive(b)) return;

    const size = getBuildingSize(b);
    const px = b.x * cell;
    const py = b.y * cell;
    const pw = size * cell;
    const ph = size * cell;

    let img: HTMLImageElement | undefined;
    const type = String(b.type || '').toLowerCase();
    if (type === 'vzryvomor') {
        const frameIdx = Math.floor(Date.now() / VZRYVOMOR_FRAME_MS) % vzryvomorBuildingImgs.length;
        img = vzryvomorBuildingImgs[frameIdx];
    } else if (type === 'sporovaya_bashnya') {
        img = bashnyaIdleImg;
    }

    if (img && isImageDrawable(img) && tryDrawImageScaled(ctx, img, px, py, pw, ph)) {
        return;
    }

    ctx.fillStyle = '#6a0dad';
    ctx.strokeStyle = '#b388ff';
    ctx.lineWidth = Math.max(1, cell * 0.06);
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeRect(px, py, pw, ph);
}

function isValidMap(map: unknown): map is number[][] {
    return Array.isArray(map) &&
        map.length > 0 &&
        map.every((row) => Array.isArray(row) && row.length > 0 && row.every((cell) => Number.isFinite(cell)));
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

const Game: React.FC<IBasePage> = ({ mediator, setPage, server: _server }) => {
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
    const animFrameRef = useRef<number>(0);
    const [unitCount, setUnitCount] = useState(0);
    const [hasMap, setHasMap] = useState(false);
    const [zoom, setZoom] = useState(ZOOM_DEFAULT);

    const socket: any = mediator.get(CONFIG.MEDIATOR.TRIGGERS.GET_STORE, 'socket');

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

    // Колёсико мыши — зум
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

    const zoomIn  = useCallback(() => applyZoom(Math.min(ZOOM_MAX, zoomRef.current * (1 + ZOOM_FACTOR))), [applyZoom]);
    const zoomOut = useCallback(() => applyZoom(Math.max(ZOOM_MIN, zoomRef.current * (1 - ZOOM_FACTOR))), [applyZoom]);
    const zoomReset = useCallback(() => applyZoom(ZOOM_DEFAULT), [applyZoom]);

    const zoomPercent = useMemo(() => Math.round(zoom / ZOOM_DEFAULT * 100), [zoom]);

    // Перетаскивание карты мышью
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
            wrap.scrollTop  = dragStartRef.current.scrollTop  - dy;
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

    // Игровой цикл — рисуем каждый кадр
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

    // Подписка на UPDATE_ARMY от сервера
    useEffect(() => {
        if (!socket) return;

        const handler = (response: any) => {
            if (response?.result !== 'ok') return;
            const data: ArmyData = response.data;
            if (!data) return;
            if (Array.isArray(data.units)) {
                unitsRef.current = data.units;
                setUnitCount(data.units.length);
            }
            if (Array.isArray(data.enemyUnits)) {
                enemyUnitsRef.current = data.enemyUnits;
            }
            if (Array.isArray(data.destroyedEnemyBuildingGuids)) {
                data.destroyedEnemyBuildingGuids.forEach((guid) => {
                    if (guid) enemyBuildingsRef.current.delete(guid);
                });
            }
            if (Array.isArray(data.enemyBuildings)) {
                // Накапливаем увиденные здания: пустой тик с карты не стирает уже показанные.
                // Убираем только мёртвые (hp) или guid из destroyedEnemyBuildingGuids (выше).
                data.enemyBuildings.forEach((b: EnemyBuildingData) => {
                    if (!b?.guid) return;
                    if (!isEnemyBuildingAlive(b)) {
                        enemyBuildingsRef.current.delete(b.guid);
                        return;
                    }
                    enemyBuildingsRef.current.set(b.guid, b);
                });
            }
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
                    <div className="game-legend-row">
                        <span className="game-legend-dot" style={{ background: '#4a9eff' }} />
                        Солдат
                    </div>
                    <div className="game-legend-row">
                        <span className="game-legend-dot" style={{ background: '#39d353', borderRadius: '2px' }} />
                        БМП
                    </div>
                    <div className="game-legend-row">
                        <span className="game-legend-dot" style={{ background: '#bc8cff', borderRadius: '4px' }} />
                        Враг (грибы)
                    </div>
                    <div className="game-legend-row">
                        <span className="game-legend-dot" style={{ background: '#1a4f6e', borderRadius: '2px' }} />
                        Вода
                    </div>
                    <div className="game-legend-row">
                        <span className="game-legend-dot" style={{ background: '#5a5f66', borderRadius: '2px' }} />
                        Горы / камень
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
