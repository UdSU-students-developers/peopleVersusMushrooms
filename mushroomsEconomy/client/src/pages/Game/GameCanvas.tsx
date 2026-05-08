import React, { useEffect, useContext } from 'react';
import CONFIG from '../../config';
import { GameContext } from '../../App';
import { TPoint } from '../../config';
import { TMushroom, TScene, TSmallReactor } from '../../services/Server/types';
import Canvas from '../../services/Canvas/Canvas';
import useCanvas from '../../services/Canvas/useCanvas';
import useSprites from '../Hooks/useSprite';
import TerrainBlock from '../../Game/Entities/TerrainBlock';
import Mushroom from '../../Game/Entities/Mushroom';
import SmallReactor from '../../Game/Entities/SmallReactor';
import Larva from '../../Game/Entities/Larva';

import "./Game.css";

const GAME_FIELD = 'game-field';

const { BORDER_PADDING, MIN_ZOOM, MAX_ZOOM, ZOOM_FACTOR, MAP_SIZE } = CONFIG.GRAPHICS;

const INITIAL_WINDOW_WIDTH = CONFIG.GRAPHICS.WINDOW.WIDTH;
const INITIAL_WINDOW_HEIGHT = CONFIG.GRAPHICS.WINDOW.HEIGHT;
const INITIAL_WINDOW_LEFT = CONFIG.GRAPHICS.WINDOW.LEFT;
const INITIAL_WINDOW_TOP = CONFIG.GRAPHICS.WINDOW.TOP;

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
    let windowStartPosition: { LEFT: number, TOP: number } | null = null;
    let animationTime = 0;

    const drawTile = (spriteIds: number[], worldX: number, worldY: number, tileSizePx: number) => {
        if (!canvas) return;
        for (let i = 0; i < spriteIds.length; i++) {
            const [sx, sy, sSize] = getSprite(spriteIds[i]);
            canvas.contextV.drawImage(
                spritesImage,
                sx, sy, sSize, sSize,
                canvas.xs(worldX), canvas.ys(worldY), tileSizePx, tileSizePx
            );
        }
    };

    const drawMap = (scene: TScene, tileWorldSize: number, tileSizePx: number) => {
        for (let rowIndex = 0; rowIndex < MAP_SIZE; rowIndex++) {
            const row = scene.map.relief[rowIndex];
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
                const block = new TerrainBlock({ x: colIndex, y: rowIndex }, row[colIndex]);
                drawTile(block.sprite, colIndex * tileWorldSize, rowIndex * tileWorldSize, tileSizePx);
            }
        }
    };

    const drawMushrooms = (scene: TScene, tileWorldSize: number, tileSizePx: number) => {
        for (let i = 0; i < scene.buildings.mycelium.length; i++) {
            const m = scene.buildings.mycelium[i];
            const mushroom = new Mushroom(m.guid, {x: m.x, y: m.y}, m.level);
            drawTile(mushroom.sprite, m.x * tileWorldSize, m.y * tileWorldSize, tileSizePx);
        }
    };

    const drawSmallReactors = (scene: TScene, tileWorldSize: number, tileSizePx: number) => {
        if (!canvas) return;
        for (let i = 0; i < scene.buildings.smallReactors.length; i++) {
            const b = scene.buildings.smallReactors[i];
            if ((b as TSmallReactor).type !== 'small_reactor') continue;
            const sr = b as TSmallReactor;
            const reactor = new SmallReactor(sr.guid, {x: sr.x, y: sr.y });
            const [sx, sy, sSize] = getSprite(reactor.sprite[0]);
            canvas.contextV.drawImage(
                spritesImage,
                sx, sy, sSize, sSize,
                canvas.xs(sr.x * tileWorldSize), canvas.ys(sr.y * tileWorldSize), tileSizePx, tileSizePx
            );

            if (sr.consumed) {
                const [animX, animY, animSize] = getSprite(9); // спрайт анимации
                canvas.contextV.drawImage(
                    spritesImage,
                    animX, animY, animSize, animSize,
                    canvas.xs(sr.x * tileWorldSize), 
                    canvas.ys(sr.y * tileWorldSize - 15), 
                    tileSizePx, 
                    tileSizePx
                );
            }
        }
    };

    const drawLarvae = (scene: TScene, tileWorldSize: number, tileSizePx: number) => {
        if (!canvas) return;
        
        for (let i = 0; i < scene.units.larvae.length; i++) {
            const l = scene.units.larvae[i];
            const larva = new Larva(l.guid, l.coords);
            
            const [sx, sy, sSize] = getSprite(larva.sprite[0]);
            
            canvas.contextV.drawImage(
                spritesImage,
                sx, sy, sSize, sSize,
                canvas.xs(l.coords.x * tileWorldSize), 
                canvas.ys(l.coords.y * tileWorldSize), 
                tileSizePx, 
                tileSizePx
            );
        }
    };

    const drawScene = () => {
        if (!canvas) return;

        const { scene } = game.get();
        if (!scene || !scene.map) return;

        const tileWorldSize = INITIAL_WINDOW_WIDTH / MAP_SIZE;
        const tileSizePx = canvas.dec(tileWorldSize);

        drawMap(scene, tileWorldSize, tileSizePx);
        drawMushrooms(scene, tileWorldSize, tileSizePx);
        drawSmallReactors(scene, tileWorldSize, tileSizePx);
        drawLarvae(scene, tileWorldSize, tileSizePx);
    };

    function render(FPS: number) {
        if (!canvas) return;

        animationTime += FPS > 0 ? 1 / FPS : 1 / 60;

        canvas.clear();
        drawScene();
        canvas.render();
    }

    const mouseDown = (x: number, y: number) => {
        mouseDownPosition = { x, y };
        mouseDownTime = Date.now();
        wasDragging = false;
    };

    const mouseMove = (x: number, y: number, screenX?: number, screenY?: number) => {
        if (!isMiddleMouseDragging || !middleMouseStartScreenPosition || !windowStartPosition || !canvas || screenX === undefined || screenY === undefined) return;

        WINDOW.LEFT = windowStartPosition.LEFT - (screenX - middleMouseStartScreenPosition.x) / canvas.WIDTH * WINDOW.WIDTH;
        WINDOW.TOP = windowStartPosition.TOP - (screenY - middleMouseStartScreenPosition.y) / canvas.HEIGHT * WINDOW.HEIGHT;
    };

    const mouseUp = (x: number, y: number) => {
        mouseDownPosition = null;
        mouseDownTime = 0;
    };

    const mouseClick = async (x: number, y: number) => {
    };

    const mouseRightClickDown = (x: number, y: number) => {
    };

    const mouseLeave = () => {
        wasDragging = false;
        isMiddleMouseDragging = false;
        middleMouseStartScreenPosition = null;
        windowStartPosition = null;
    };

    const mouseWheel = (delta: number, x: number, y: number) => {
        if (!canvas) return;

        const zoomAmount = delta > 0 ? 1 + ZOOM_FACTOR : 1 - ZOOM_FACTOR;
        const newHeight = WINDOW.HEIGHT * zoomAmount;

        if (newHeight < MIN_ZOOM || newHeight > MAX_ZOOM) return;

        const newWidth = WINDOW.WIDTH * zoomAmount;
        WINDOW.LEFT = x - (x - WINDOW.LEFT) * zoomAmount;
        WINDOW.TOP = y - (y - WINDOW.TOP) * zoomAmount;
        WINDOW.WIDTH = newWidth;
        WINDOW.HEIGHT = newHeight;
    };

    const mouseMiddleDown = (x: number, y: number, screenX?: number, screenY?: number) => {
        isMiddleMouseDragging = true;
        if (screenX !== undefined && screenY !== undefined) {
            middleMouseStartScreenPosition = { x: screenX, y: screenY };
        }
        windowStartPosition = { LEFT: WINDOW.LEFT, TOP: WINDOW.TOP };
    };

    const mouseMiddleUp = () => {
        isMiddleMouseDragging = false;
        middleMouseStartScreenPosition = null;
        windowStartPosition = null;
    };

    const keyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
    };

    useEffect(() => {

        canvas = CanvasRef({
            parentId: GAME_FIELD,
            WIDTH: WINDOW.WIDTH,
            HEIGHT: WINDOW.HEIGHT,
            WINDOW,
            callbacks: {
                mouseMove, mouseDown, mouseUp, mouseRightClickDown, mouseClick,
                mouseLeave, mouseWheel, mouseMiddleDown, mouseMiddleUp, keyDown
            },
        });

        canvas.context.imageSmoothingEnabled = false;
        canvas.contextV.imageSmoothingEnabled = false;

        render(0);

        return () => {
            if (WINDOW.WIDTH !== INITIAL_WINDOW_WIDTH) {
                WINDOW.WIDTH = INITIAL_WINDOW_WIDTH;
                WINDOW.HEIGHT = INITIAL_WINDOW_HEIGHT;
                WINDOW.LEFT = INITIAL_WINDOW_LEFT;
                WINDOW.TOP = INITIAL_WINDOW_TOP;
            }

            canvas = null;
        };
    }, []);

    return (
        <div id={GAME_FIELD} className={GAME_FIELD}></div>
    );
};

export default GameCanvas;