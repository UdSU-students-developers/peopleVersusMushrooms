import React, { useEffect, useContext } from 'react';
import CONFIG from '../../config';
import { GameContext } from '../../App';
import { TPoint } from '../../config';
import Canvas from '../../services/Canvas/Canvas';
import useCanvas from '../../services/Canvas/useCanvas';
import useSprites from '../Hooks/useSprite';
import TerrainBlock from '../../Game/Entities/TerrainBlock';

import "./Game.css";

const GAME_FIELD = 'game-field';

const { BORDER_PADDING, MIN_ZOOM, MAX_ZOOM, ZOOM_FACTOR } = CONFIG.GRAPHICS;

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

    const createTiles = (matrix: number[][]): TerrainBlock[] => {
        const tiles: TerrainBlock[] = [];

        matrix.forEach((row, rowIndex) =>
            row.forEach((cellId, colIndex) => {
                const terrainType = cellId === 1 ? "grow" : "water";
                const tileId = rowIndex * row.length + colIndex;
                tiles.push(new TerrainBlock(tileId, { x: colIndex, y: rowIndex }, terrainType));
            })
        );

        return tiles;
    };

    const drawMap = () => {
        if (!canvas) return;

        const { map } = game.get();

        const tileWorldSize = INITIAL_WINDOW_WIDTH / map.map.length;
        const tileSizePx = canvas.dec(tileWorldSize);
        const tiles = createTiles(map.map);

        tiles.forEach((tile) => {
            const worldX = tile.coords.x * tileWorldSize;
            const worldY = tile.coords.y * tileWorldSize;

            tile.sprite.forEach((spriteId) => {
                const [sx, sy, sSize] = getSprite(spriteId);
                if (!canvas) return; //Без 2 проверки ругалось
                canvas.contextV.drawImage(
                    spritesImage,
                    sx, sy, sSize, sSize,
                    canvas.xs(worldX), canvas.ys(worldY), tileSizePx, tileSizePx
                );
            });
        });
    };

    function render(FPS: number) {
        if (!canvas) return;

        if (FPS > 0) {
            animationTime += (1 / FPS);
        } else {
            animationTime += (1 / 60);
        }

        canvas.clear();
        drawMap();
        canvas.render();
    }

    const mouseDown = (x: number, y: number) => {
        mouseDownPosition = { x, y };
        mouseDownTime = Date.now();
        wasDragging = false;
    };

    const mouseMove = (x: number, y: number, screenX?: number, screenY?: number) => {
        if (isMiddleMouseDragging && middleMouseStartScreenPosition && windowStartPosition && canvas && screenX !== undefined && screenY !== undefined) {
            const deltaX = (screenX - middleMouseStartScreenPosition.x) / canvas.WIDTH * WINDOW.WIDTH;
            const deltaY = (screenY - middleMouseStartScreenPosition.y) / canvas.HEIGHT * WINDOW.HEIGHT;

            WINDOW.LEFT = windowStartPosition.LEFT - deltaX;
            WINDOW.TOP = windowStartPosition.TOP - deltaY;
        }
    };

    const mouseUp = (x: number, y: number) => {
        mouseDownPosition = null;
        mouseDownTime = 0;
    };

    const mouseClick = async (x: number, y: number) => {
        const { map } = game.get();
        console.log(map);
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
        const newWidth = WINDOW.WIDTH * zoomAmount;
        const newHeight = WINDOW.HEIGHT * zoomAmount;

        if (newHeight < MIN_ZOOM || newHeight > MAX_ZOOM) return;

        const scale = newWidth / WINDOW.WIDTH;
        WINDOW.LEFT = x - (x - WINDOW.LEFT) * scale;
        WINDOW.TOP = y - (y - WINDOW.TOP) * scale;

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