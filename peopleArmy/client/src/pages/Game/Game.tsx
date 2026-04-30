import React, { useEffect, useRef, useCallback, useState } from 'react';
import { IBasePage, PAGES } from '../PageManager';
import CONFIG from '../../config';
import './Game.css';

// Размер одной клетки в пикселях
const CELL = 14;
const COLS = 50;
const ROWS = 50;

// Цвета
const COLOR = {
    bg: '#0d1117',
    grid: '#1a2332',
    wall: '#8b1a1a',
    soldier: '#4a9eff',
    soldierBorder: '#7dc4ff',
    bmp: '#39d353',
    bmpBorder: '#7ee787',
    target: 'rgba(255, 200, 50, 0.25)',
    targetBorder: 'rgba(255, 200, 50, 0.7)',
    path: 'rgba(74, 158, 255, 0.15)',
};

interface UnitData {
    guid: string;
    x: number;
    y: number;
    hp: number;
    speed: number;
    targetX: number | null;
    targetY: number | null;
    type?: string;
}

interface ArmyData {
    units: UnitData[];
}

// Рисуем карту (фон + стены)
function drawMap(ctx: CanvasRenderingContext2D, map: number[][]) {
    const rows = map.length;
    const cols = map[0]?.length ?? 0;

    // Фон
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, cols * CELL, rows * CELL);

    // Сетка
    ctx.strokeStyle = COLOR.grid;
    ctx.lineWidth = 0.5;
    for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL);
        ctx.lineTo(cols * CELL, y * CELL);
        ctx.stroke();
    }
    for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL, 0);
        ctx.lineTo(x * CELL, rows * CELL);
        ctx.stroke();
    }

    // Стены
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (map[y][x] !== 0) {
                ctx.fillStyle = COLOR.wall;
                ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
            }
        }
    }
}

// Рисуем юнита
function drawUnit(ctx: CanvasRenderingContext2D, unit: UnitData) {
    const cx = unit.x * CELL + CELL / 2;
    const cy = unit.y * CELL + CELL / 2;
    const isBmp = unit.type === 'bmp' || unit.speed >= 3;
    const r = isBmp ? CELL * 0.42 : CELL * 0.35;

    // Линия к цели
    if (unit.targetX != null && unit.targetY != null) {
        const tx = unit.targetX * CELL + CELL / 2;
        const ty = unit.targetY * CELL + CELL / 2;
        ctx.strokeStyle = isBmp ? COLOR.bmpBorder : COLOR.soldierBorder;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Маркер цели
        ctx.fillStyle = COLOR.target;
        ctx.strokeStyle = COLOR.targetBorder;
        ctx.lineWidth = 1;
        ctx.fillRect(unit.targetX * CELL + 2, unit.targetY * CELL + 2, CELL - 4, CELL - 4);
        ctx.strokeRect(unit.targetX * CELL + 2, unit.targetY * CELL + 2, CELL - 4, CELL - 4);
    }

    if (isBmp) {
        const s = r * 1.6;
        ctx.fillStyle = COLOR.bmp;
        ctx.strokeStyle = COLOR.bmpBorder;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(cx - s / 2, cy - s / 2, s, s, 2);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillStyle = COLOR.soldier;
        ctx.strokeStyle = COLOR.soldierBorder;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

// Статическая карта (та же что в UserManager на сервере)
function buildDefaultMap(): number[][] {
    const map: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 5].forEach((r) => {
        if (map[r]) map[r][25] = 1;
    });
    return map;
}

function isValidMap(map: unknown): map is number[][] {
    return Array.isArray(map) &&
        map.length > 0 &&
        map.every((row) => Array.isArray(row) && row.every((cell) => Number.isFinite(cell)));
}

const Game: React.FC<IBasePage> = ({ mediator, server, setPage }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mapRef = useRef<number[][]>((storedMap => isValidMap(storedMap) ? storedMap : buildDefaultMap())(mediator.get(CONFIG.MEDIATOR.TRIGGERS.GET_STORE, 'map')));
    const unitsRef = useRef<UnitData[]>([]);
    const animFrameRef = useRef<number>(0);
    const [selectedType, setSelectedType] = useState<'soldier' | 'bmp'>('soldier');
    const [status, setStatus] = useState('Кликните по карте, чтобы создать юнита');
    const [unitCount, setUnitCount] = useState(0);

    const guid: string | null = mediator.get(CONFIG.MEDIATOR.TRIGGERS.GET_STORE, 'guid');
    const socket: any = mediator.get(CONFIG.MEDIATOR.TRIGGERS.GET_STORE, 'socket');
    if (mapRef) {
        console.log("карта дошла до game")
    }
    // Игровой цикл — рисуем каждый кадр
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        drawMap(ctx, mapRef.current);
        unitsRef.current.forEach((unit) => drawUnit(ctx, unit));

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
            if (!data?.units) return;
            unitsRef.current = data.units;
            setUnitCount(data.units.length);
        };

        socket.on(CONFIG.SOCKETS.UPDATE_ARMY, handler);
        return () => socket.off(CONFIG.SOCKETS.UPDATE_ARMY, handler);

    }, [socket]);

    // Клик по канвасу — создать юнита
    const handleCanvasClick = useCallback(
        async (e: React.MouseEvent<HTMLCanvasElement>) => {
            const canvas = canvasRef.current;
            if (!canvas || !guid) return;

            const rect = canvas.getBoundingClientRect();
            // Учитываем масштаб если канвас отображается не 1:1
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const px = (e.clientX - rect.left) * scaleX;
            const py = (e.clientY - rect.top) * scaleY;

            const x = Math.floor(px / CELL);
            const y = Math.floor(py / CELL);

            // Нельзя ставить на стену
            if (mapRef.current[y]?.[x] !== 0) {
                setStatus('Нельзя поставить юнита на стену');
                return;
            }

            setStatus(`Создаём ${selectedType} на [${x}, ${y}]…`);

            try {
                const body = await server.createUnit(guid, x, y, selectedType);

                if (!body) {
                    setStatus('Ошибка сети');
                    return;
                }
                if (body.result === 'ok') {
                    setStatus(`${selectedType} создан на [${x}, ${y}]`);
                } else {
                    setStatus(`Ошибка: ${body.error ?? 'неизвестная'}`);
                }
            } catch (err) {
                setStatus('Ошибка сети');
                console.error(err);
            }
        },
        [guid, selectedType, server]
    );

    return (
        <div className="game-page">
            <div className="game-sidebar">
                <h2 className="game-title">Армия</h2>

                <div className="game-stat">
                    <span className="game-stat-label">Юнитов</span>
                    <span className="game-stat-value">{unitCount}</span>
                </div>

                <div className="game-section">
                    <p className="game-section-label">Тип юнита</p>
                    <div className="game-type-btns">
                        <button
                            className={`game-type-btn ${selectedType === 'soldier' ? 'active' : ''}`}
                            onClick={() => setSelectedType('soldier')}
                        >
                            <span className="game-type-dot soldier" />
                            Солдат
                        </button>
                        <button
                            className={`game-type-btn ${selectedType === 'bmp' ? 'active' : ''}`}
                            onClick={() => setSelectedType('bmp')}
                        >
                            <span className="game-type-dot bmp" />
                            БМП
                        </button>
                    </div>
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
                        <span className="game-legend-dot" style={{ background: '#8b1a1a', borderRadius: '2px' }} />
                        Стена
                    </div>
                </div>

                <p className="game-status">{status}</p>
            </div>

            <div className="game-canvas-wrap">
                <canvas
                    ref={canvasRef}
                    width={COLS * CELL}
                    height={ROWS * CELL}
                    onClick={handleCanvasClick}
                    className="game-canvas"
                    title="Кликните чтобы создать юнита"
                />
            </div>
        </div>
    );
};

export default Game;
