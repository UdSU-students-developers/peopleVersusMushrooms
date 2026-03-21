import React, { useEffect, useContext } from 'react';
import CONFIG from '../../config';
import { TPoint } from '../../config';
import Canvas from '../../services/Canvas/Canvas';
import useCanvas from '../../services/Canvas/useCanvas';
import useSprites from '../Hooks/useSprite';
import TerrainBlock from '../../Game/Entities/TerrainBlock';

import "./Game.css";

const GAME_FIELD = 'game-field';

const { WINDOW, BORDER_PADDING, MIN_ZOOM, MAX_ZOOM, ZOOM_FACTOR } = CONFIG.GRAPHICS;

const GameCanvas: React.FC = () => {
    

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


    const drawSprites = (canvas: Canvas, item: TerrainBlock, coords: TPoint[]) => {
        item.sprite.forEach((sprite, i) => {
            const spriteData = getSprite(sprite);
            canvas.spriteFull(spritesImage, coords[i].x, coords[i].y, spriteData[0], spriteData[1], spriteData[2]);
        });
    };

    function render(FPS: number) {
        if (FPS > 0) {
            animationTime += (1 / FPS);
        } else {
            animationTime += (1 / 60);
            }
        if (!canvas) return;
        canvas.clear();
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
        return
    };

    const mouseRightClickDown = (x: number, y: number) => {
    };

    const mouseLeave = () => {
        console.log('Мышь покинула канвас');
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
        
        // Ограничение зума
        if (newHeight < MIN_ZOOM || newHeight > MAX_ZOOM) return;
        
        // Масштабирование относительно точки курсора
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
            canvas = null;
        };
    }, []);

    return (
        <div id={GAME_FIELD} className={GAME_FIELD}></div>
    )
};

export default GameCanvas;