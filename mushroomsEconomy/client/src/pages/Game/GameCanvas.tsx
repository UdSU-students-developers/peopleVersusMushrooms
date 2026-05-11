import React, { useEffect, useContext } from 'react';
import CONFIG from '../../config';
import { GameContext } from '../../App';
import { TPoint } from '../../config';
import { TScene, TSmallReactor } from '../../services/Server/types';
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

    const drawTile = (spriteId: number, wx: number, wy: number, sizePx: number) => {
        if (!canvas) return;
        const [sx, sy, sSize] = getSprite(spriteId);
        canvas.contextV.drawImage(
            spritesImage,
            sx, sy, sSize, sSize,
            canvas.xs(wx), canvas.ys(wy), sizePx, sizePx
        );
    };

    const drawScene = () => {
        if (!canvas) return;
        const { scene } = game.get();
        if (!scene?.map) return;

        const tw  = INITIAL_WINDOW_WIDTH / MAP_SIZE; 
        const tpx = canvas.dec(tw);               

        // terrain
        for (let r = 0; r < MAP_SIZE; r++) {
            const row = scene.map.relief[r];
            for (let c = 0; c < row.length; c++)
                drawTile(getTerrainSprite(row[c]), c * tw, r * tw, tpx);
        }

        // mushrooms
        for (const m of scene.buildings.mycelium)
            drawTile(getMushroomSprite(m.level), m.x * tw, m.y * tw, tpx);

        // small reactors
        for (const b of scene.buildings.smallReactors) {
            const sr = b as TSmallReactor;
            if (sr.type !== 'small_reactor') continue;
            drawTile(SPRITE.SMALL_REACTOR, sr.x * tw, sr.y * tw, tpx);
            if (sr.consumed)
                drawTile(SPRITE.REACTOR_CONSUMED_ANIM, sr.x * tw, sr.y * tw - 15, tpx);
        }

        // larvae
        for (const l of scene.units.larvae)
            drawTile(SPRITE.LARVA, l.coords.x * tw, l.coords.y * tw, tpx);
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