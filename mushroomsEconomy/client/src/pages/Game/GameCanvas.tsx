import React, { useEffect, useContext } from 'react';
import CONFIG from '../../config';
import { GameContext } from '../../App';
import { TPoint } from '../../config';
import { TIncubator, TReactor, TScene } from '../../services/Server/types';
import Canvas from '../../services/Canvas/Canvas';
import useCanvas from '../../services/Canvas/useCanvas';
import useSprites from '../Hooks/useSprite';
import { getTerrainSprite, getMushroomSprite, SPRITE } from '../../Game/Sprites';

import "./Game.css";

const GAME_FIELD = 'game-field';
const { BORDER_PADDING, MIN_ZOOM, MAX_ZOOM, ZOOM_FACTOR, MAP_SIZE } = CONFIG.GRAPHICS;
const INITIAL_WINDOW_WIDTH  = CONFIG.GRAPHICS.WINDOW.WIDTH;
const INITIAL_WINDOW_HEIGHT = CONFIG.GRAPHICS.WINDOW.HEIGHT;
const INITIAL_WINDOW_LEFT   = CONFIG.GRAPHICS.WINDOW.LEFT;
const INITIAL_WINDOW_TOP    = CONFIG.GRAPHICS.WINDOW.TOP;

const GameCanvas: React.FC = () => {

    const { WINDOW } = CONFIG.GRAPHICS;
    const game = useContext(GameContext);

    let canvas: Canvas | null = null;
    const CanvasRef = useCanvas(render);
    const [[spritesImage], getSprite] = useSprites();

    let mouseDownPosition: TPoint | null = null;
    let mouseDownTime = 0;
    let wasDragging = false;
    let isMiddleMouseDragging = false;
    let middleMouseStartScreenPosition: TPoint | null = null;
    let windowStartPosition: { LEFT: number; TOP: number } | null = null;
    let animationTime = 0;

    const tw = INITIAL_WINDOW_WIDTH / MAP_SIZE;

    // Рисует спрайт в 1×1 клетку
    const drawTile = (spriteId: number, col: number, row: number) => {
        if (!canvas) return;
        const [sx, sy, sSize] = getSprite(spriteId);
        const px = canvas.xs(col * tw);
        const py = canvas.ys(row * tw);
        const size = canvas.dec(tw);
        canvas.contextV.drawImage(spritesImage, sx, sy, sSize, sSize, px, py, size, size);
    };

    // Рисует спрайт в tileSize×tileSize клеток (для зданий крупнее 1×1)
    const drawTileSized = (spriteId: number, col: number, row: number, tileSize: number) => {
        if (!canvas) return;
        const [sx, sy, sSize] = getSprite(spriteId);
        const px = canvas.xs(col * tw);
        const py = canvas.ys(row * tw);
        const size = canvas.dec(tw * tileSize);
        canvas.contextV.drawImage(spritesImage, sx, sy, sSize, sSize, px, py, size, size);
    };

    const drawScene = () => {
        if (!canvas) return;
        const { scene } = game.get();
        if (!scene?.map) return;

        // terrain
        for (let r = 0; r < MAP_SIZE; r++)
            for (let c = 0; c < MAP_SIZE; c++)
                drawTile(getTerrainSprite(scene.map.relief[r][c]), c, r);

        // mushrooms
        for (const m of scene.buildings.mycelium)
            drawTile(getMushroomSprite(m.level), m.x, m.y);

        // reactors — малый (size=1) и большой (size=2) в одном массиве,
        // используют один спрайт, но рисуются в разный размер
        for (const r of scene.buildings.reactors as TReactor[]) {
            const tileSize = r.size ?? 1;
            drawTileSized(SPRITE.REACTOR, r.x, r.y, tileSize);
            if (r.consumed)
                drawTileSized(SPRITE.REACTOR_CONSUMED_ANIM, r.x, r.y - 7 / tw, tileSize);
        }

        // incubators
        for (const i of scene.buildings.incubators as TIncubator[])
            drawTile(SPRITE.INCUBATOR, i.x, i.y);

        // larvae
        for (const l of scene.units.larvae)
            drawTile(SPRITE.LARVA, l.x, l.y);
    };

    function render(FPS: number) {
        if (!canvas) return;
        animationTime += FPS > 0 ? 1 / FPS : 1 / 60;
        canvas.clear();
        drawScene();
        canvas.render();
    }

    const mouseDown  = (x: number, y: number) => { mouseDownPosition = { x, y }; mouseDownTime = Date.now(); wasDragging = false; };
    const mouseUp    = (_x: number, _y: number) => { mouseDownPosition = null; mouseDownTime = 0; };
    const mouseClick = async (_x: number, _y: number) => {};
    const mouseRightClickDown = (_x: number, _y: number) => {};
    const mouseLeave = () => { wasDragging = false; isMiddleMouseDragging = false; middleMouseStartScreenPosition = null; windowStartPosition = null; };

    const mouseMove = (_x: number, _y: number, screenX?: number, screenY?: number) => {
        if (!isMiddleMouseDragging || !middleMouseStartScreenPosition || !windowStartPosition || !canvas || screenX === undefined || screenY === undefined) return;
        WINDOW.LEFT = windowStartPosition.LEFT - (screenX - middleMouseStartScreenPosition.x) / canvas.WIDTH  * WINDOW.WIDTH;
        WINDOW.TOP  = windowStartPosition.TOP  - (screenY - middleMouseStartScreenPosition.y) / canvas.HEIGHT * WINDOW.HEIGHT;
    };

    const mouseWheel = (delta: number, x: number, y: number) => {
        if (!canvas) return;
        const zoom = delta > 0 ? 1 + ZOOM_FACTOR : 1 - ZOOM_FACTOR;
        const newH = WINDOW.HEIGHT * zoom;
        if (newH < MIN_ZOOM || newH > MAX_ZOOM) return;
        WINDOW.LEFT   = x - (x - WINDOW.LEFT) * zoom;
        WINDOW.TOP    = y - (y - WINDOW.TOP)  * zoom;
        WINDOW.WIDTH  = WINDOW.WIDTH  * zoom;
        WINDOW.HEIGHT = newH;
    };

    const mouseMiddleDown = (_x: number, _y: number, screenX?: number, screenY?: number) => {
        isMiddleMouseDragging = true;
        if (screenX !== undefined && screenY !== undefined)
            middleMouseStartScreenPosition = { x: screenX, y: screenY };
        windowStartPosition = { LEFT: WINDOW.LEFT, TOP: WINDOW.TOP };
    };

    const mouseMiddleUp = () => { isMiddleMouseDragging = false; middleMouseStartScreenPosition = null; windowStartPosition = null; };

    const keyDown = (event: KeyboardEvent) => { if (event.key !== 'Escape') return; };

    useEffect(() => {
        canvas = CanvasRef({
            parentId: GAME_FIELD,
            WIDTH: WINDOW.WIDTH,
            HEIGHT: WINDOW.HEIGHT,
            WINDOW,
            callbacks: { mouseMove, mouseDown, mouseUp, mouseRightClickDown, mouseClick, mouseLeave, mouseWheel, mouseMiddleDown, mouseMiddleUp, keyDown },
        });

        canvas.context.imageSmoothingEnabled  = false;
        canvas.contextV.imageSmoothingEnabled = false;
        render(0);

        return () => {
            if (WINDOW.WIDTH !== INITIAL_WINDOW_WIDTH) {
                WINDOW.WIDTH  = INITIAL_WINDOW_WIDTH;
                WINDOW.HEIGHT = INITIAL_WINDOW_HEIGHT;
                WINDOW.LEFT   = INITIAL_WINDOW_LEFT;
                WINDOW.TOP    = INITIAL_WINDOW_TOP;
            }
            canvas = null;
        };
    }, []);

    return <div id={GAME_FIELD} className={GAME_FIELD} />;
};

export default GameCanvas;