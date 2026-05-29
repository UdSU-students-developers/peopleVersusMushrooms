import React, { useContext, useEffect } from "react";
import { MediatorContext, ServerContext } from "../../../App";
import CONFIG, { EMESSAGES } from "../../../config";
import { Canvas, useCanvas } from "../../../services/canvas";
import { EntityType, Sprite, useSprites } from "../hooks/useSprites";
import { TEntities, TMap, TSource } from "../../../services/server/types";
import Map from "../../../services/Map/Map";

const mapField = 'map-field';

const MapCanvas: React.FC = () => {
    let map: Map | null = null;
    let canvas: Canvas;
    const mediator = useContext(MediatorContext);
    const server = useContext(ServerContext);
    const Canvas = useCanvas(render);
    const { WINDOW } = CONFIG;
    const { sprites, animations, getRenderOrder } = useSprites();

    let canMove = false;
    let dragStartX = 0;
    let dragStartY = 0

    const isConnectable = (building: any): boolean => {
        const connectableTypes = ['PIPE', 'DRILLER', 'BARRACKS', 'LARGE_REACTOR', 'SMALL_REACTOR', 'REACTOR', 'INCUBATOR', 'MINE'];
        return connectableTypes.includes(building.type?.toUpperCase());
    };

    const getPipeTextureType = (x: number, y: number, buildings: any[]): number => {
        const hasUp = buildings.some(b => b.x === x && b.y === y - 1 && isConnectable(b));
        const hasDown = buildings.some(b => b.x === x && b.y === y + 1 && isConnectable(b));
        const hasLeft = buildings.some(b => b.x === x - 1 && b.y === y && isConnectable(b));
        const hasRight = buildings.some(b => b.x === x + 1 && b.y === y && isConnectable(b));
        const upBuilding = buildings.find(b => b.x === x && b.y === y - 1 && isConnectable(b));
        const downBuilding = buildings.find(b => b.x === x && b.y === y + 1 && isConnectable(b));
        const leftBuilding = buildings.find(b => b.x === x - 1 && b.y === y && isConnectable(b));
        const rightBuilding = buildings.find(b => b.x === x + 1 && b.y === y && isConnectable(b));
        if (hasUp && hasDown && !hasLeft && !hasRight) {
            return 2;
        }

        if (hasLeft && hasRight && !hasUp && !hasDown) {
            return 1;
        }

        if (hasUp && hasRight && !hasDown && !hasLeft) {
            return 4;
        }
        if (hasUp && hasLeft && !hasDown && !hasRight) {
            return 5;
        }
        if (hasDown && hasRight && !hasUp && !hasLeft) {
            return 3;
        }
        if (hasDown && hasLeft && !hasUp && !hasRight) {
            return 6;
        }
        if (hasUp && hasDown && hasLeft && !hasRight) {
            return 11;
        }
        if (hasUp && hasDown && hasRight && !hasLeft) {
            return 9;
        }
        if (hasUp && hasLeft && hasRight && !hasDown) {
            return 10;
        }
        if (hasDown && hasLeft && hasRight && !hasUp) {
            return 8;
        }
        if (hasUp && hasDown && hasLeft && hasRight) {
            return 7;
        }
        if (hasUp && !hasDown && !hasLeft && !hasRight) {
            return 15;
        }
        if (!hasUp && hasDown && !hasLeft && !hasRight) {
            return 13;
        }
        if (!hasUp && !hasDown && hasLeft && !hasRight) {
            return 12;
        }
        if (!hasUp && !hasDown && !hasLeft && hasRight) {
            return 14;
        }
        return 7;
    };


    useEffect(() => {
        const { GET_RELIEF, UPDATE_MAP } = mediator.getEventTypes();

        const renderMap = (mapData: TMap) => {
            console.log('Наша карта', mapData);
            const cells = mapData.map.flatMap((row, y: number) =>
                row.map((type, x) => ({
                    x,
                    y,
                    type,
                    color: type === 1 ? 'blue'
                        : type === 2 ? 'gray'
                            : 'green',
                    isResource: false,
                    resourceColor: null as string | null
                }))
            );

            if (mapData.sources) {
                mapData.sources.forEach((source: TSource) => {
                    const cell = cells.find(c => c.x === source.x && c.y === source.y);

                    if (cell) {
                        cell.isResource = true;
                        cell.resourceColor = source.type === 'IRON' ? 'white' : 'black';
                    }
                });
            }
            map?.setCells(cells);
        };

        const renderEntities = (entitiesData: TEntities) => {
            console.log('Сущности', entitiesData);
            const buildings = entitiesData.buildings.flat();
            const units = entitiesData.units.flat();

            map?.setBuildings(buildings);
            map?.setUnits(units);
        };

        mediator.subscribe(GET_RELIEF, renderMap);
        mediator.subscribe(UPDATE_MAP, renderEntities);

        return () => {
            mediator.unsubscribe(GET_RELIEF, renderMap);
            mediator.unsubscribe(UPDATE_MAP, renderEntities);
        };
    }, []);

    const cellSize = CONFIG.WINDOW.WIDTH / CONFIG.WIDTH;

    function render(): void {
        canvas.clear();

        if (canvas && map) {
            map.cells.forEach((cell) => {
                canvas.rect(cell.x * cellSize, cell.y * cellSize, cellSize, cell.color);

                if (cell.isResource) {
                    const centerX = cell.x * cellSize + cellSize / 2;
                    const centerY = cell.y * cellSize + cellSize / 2;
                    const radius = cellSize / 4;

                    canvas.circle(centerX, centerY, radius, cell.resourceColor);
                }
            });

            const getSprite = (sprites: Record<EntityType, Sprite>, type: string) => {
                return sprites[type as EntityType] ?? [];
            };

            const getAnim = (animations: Partial<Record<EntityType, () => number>>, type: string) => {
                const anim = animations[type as EntityType];
                return typeof anim === 'function' ? anim : () => 0;
            };

            map.buildings.slice().sort((a, b) => getRenderOrder(a.type) - getRenderOrder(b.type)).forEach((building) => {
                if (building.type === 'PIPE') return;
                const sprite = getSprite(sprites, building.type);
                if (!sprite) return;

                const anim = getAnim(animations, building.type);
                const frame = anim();
                const sx = frame * sprite.frameWidth;

                const worldW = building.size * cellSize;
                const worldH = building.size * cellSize;

                const scale = Math.min(
                    worldW / sprite.frameWidth,
                    worldH / sprite.frameHeight
                );

                const dw = sprite.frameWidth * scale;
                const dh = sprite.frameHeight * scale;

                const dx = building.x * cellSize + (worldW - dw) / 2;
                const dy = building.y * cellSize + (worldH - dh) / 2;

                canvas.sprite(sprite.image, sx, 0, sprite.frameWidth, sprite.frameHeight, dx, dy, dw, dh);
            });

            const pipes = map.buildings.filter(b => b.type === 'PIPE');

            pipes.forEach((pipe) => {
                const textureType = getPipeTextureType(pipe.x, pipe.y, map?.buildings || []);
                const pipeTypeWithTexture = `PIPE${textureType}`;
                let sprite = getSprite(sprites, pipeTypeWithTexture);

                if (!sprite) {
                    sprite = getSprite(sprites, 'PIPE');
                }

                if (sprite) {
                    const anim = getAnim(animations, 'PIPE');
                    const frame = anim();
                    const sx = frame * sprite.frameWidth;

                    const worldW = pipe.size * cellSize;
                    const worldH = pipe.size * cellSize;

                    const scale = Math.min(
                        worldW / sprite.frameWidth,
                        worldH / sprite.frameHeight
                    );

                    const dw = sprite.frameWidth * scale;
                    const dh = sprite.frameHeight * scale;

                    const dx = pipe.x * cellSize + (worldW - dw) / 2;
                    const dy = pipe.y * cellSize + (worldH - dh) / 2;

                    canvas.sprite(sprite.image, sx, 0, sprite.frameWidth, sprite.frameHeight, dx, dy, dw, dh);
                }
            });

            map.units.slice().sort((a, b) => getRenderOrder(a.type) - getRenderOrder(b.type)).forEach((unit) => {
                const sprite = getSprite(sprites, unit.type);
                if (!sprite) return;

                const anim = getAnim(animations, unit.type);
                const frame = anim();
                const sx = frame * sprite.frameWidth;

                const worldW = cellSize;
                const worldH = cellSize;

                const scale = Math.min(
                    worldW / sprite.frameWidth,
                    worldH / sprite.frameHeight
                );

                const dw = sprite.frameWidth * scale;
                const dh = sprite.frameHeight * scale;

                const dx = unit.x * cellSize + (worldW - dw) / 2;
                const dy = unit.y * cellSize + (worldH - dh) / 2;

                canvas.sprite(sprite.image, sx, 0, sprite.frameWidth, sprite.frameHeight, dx, dy, dw, dh);
            });

            canvas.render();
        }
    }

    const mouseWheel = (delta: number, x: number, y: number) => {
        if (!canvas) return;
        const ZOOM = 0.2;
        const zoomAmount = delta > 0 ? 1 + ZOOM : 1 - ZOOM;
        let newWidth = WINDOW.WIDTH * zoomAmount;
        let newHeight = WINDOW.HEIGHT * zoomAmount;
        const MIN_ZOOM = 100;
        const MAX_ZOOM = 2000;
        if (newHeight < MIN_ZOOM || newHeight > MAX_ZOOM) return;

        WINDOW.LEFT = x - (x - WINDOW.LEFT) * zoomAmount;
        WINDOW.TOP = y - (y - WINDOW.TOP) * zoomAmount;
        WINDOW.WIDTH = newWidth;
        WINDOW.HEIGHT = newHeight;
    };

    const mouseMove = (x: number, y: number) => {
        if (!canMove) return;
        WINDOW.LEFT -= (x - dragStartX);
        WINDOW.TOP -= (y - dragStartY);
    };

    const mouseDown = (x: number, y: number) => {
        canMove = true;
        dragStartX = x;
        dragStartY = y;
    };

    const mouseUp = () => {
        canMove = false;
    };

    const mouseLeave = () => {
        canMove = false;
    };

    useEffect(() => {
        map = new Map(CONFIG.WINDOW.WIDTH, CONFIG.WINDOW.HEIGHT);
        canvas = Canvas({
            parentId: mapField,
            WIDTH: WINDOW.WIDTH,
            HEIGHT: WINDOW.HEIGHT,
            WINDOW,
            callbacks: {
                mouseWheel,
                mouseMove, mouseDown,
                mouseUp,
                mouseLeave,
                mouseClick: () => { },
                mouseRightClick: () => { },
            },
        });

        return () => {
            canvas?.destructor();
        };
    }, []);

    // выстреливает только при уничтожении компоненты
    useEffect(() => () => map?.destructor());

    return (<div id={mapField} className={mapField}></div>);
};

export default MapCanvas;