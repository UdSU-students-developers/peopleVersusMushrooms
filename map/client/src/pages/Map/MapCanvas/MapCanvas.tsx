import React, { useContext, useEffect } from "react";
import { MediatorContext, ServerContext } from "../../../App";
import CONFIG from "../../../config";
import { Canvas, useCanvas } from "../../../services/canvas";
import Map from "../../../services/Map/Map";
import { TMap, TSource } from "../../../services/server/types";

const mapField = 'map-field';

const MapCanvas: React.FC = () => {
    let map: Map | null = null;
    let canvas: Canvas;
    const mediator = useContext(MediatorContext);
    const server = useContext(ServerContext);
    const Canvas = useCanvas(render);
    const { WINDOW } = CONFIG;

    let canMove = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartLeft = 0;
    let dragStartTop = 0;

    useEffect(() => {
        const { GENERATE_MAP } = mediator.getEventTypes();

        const renderMap = (mapData: TMap) => {
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

        mediator.subscribe(GENERATE_MAP, renderMap);

        return () => {
            mediator.unsubscribe(GENERATE_MAP, renderMap);
        };
    }, []);

    const cellSize = WINDOW.WIDTH / CONFIG.WIDTH;

    function render(fps: number): void {
        if (canvas && map) {
            canvas.clear();
            map.cells.forEach((cell) => {
                canvas.rect(cell.x * cellSize, cell.y * cellSize, cellSize, cell.color);

                if (cell.isResource) {
                    const centerX = cell.x * cellSize + cellSize / 2;
                    const centerY = cell.y * cellSize + cellSize / 2;
                    const radius = cellSize / 4;

                    canvas.circle(centerX, centerY, radius, cell.resourceColor);
                }
            });

            canvas.text(WINDOW.LEFT + 20, WINDOW.TOP + 50, String(fps), 'red');
            canvas.render();
        }
    }

    const mouseWheel = (delta: number, x: number, y: number) => {
        if (!canvas) return;
        const ZOOM = 0.2;
        const zoomAmount = delta > 0 ? 1 + ZOOM : 1 - ZOOM;
        let newWidth = WINDOW.WIDTH * zoomAmount;
        let newHeight = WINDOW.HEIGHT * zoomAmount;
        const MIN_ZOOM = 400;
        const MAX_ZOOM = 2000;
        newWidth = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newWidth));
        newHeight = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newHeight));

        WINDOW.LEFT = x - (x - WINDOW.LEFT) * zoomAmount;
        WINDOW.TOP = y - (y - WINDOW.TOP) * zoomAmount;
        WINDOW.WIDTH = newWidth;
        WINDOW.HEIGHT = newHeight;
    };

    const mouseMove = (x: number, y: number) => {
        if (!canMove) return;
        WINDOW.LEFT = dragStartLeft - (x - dragStartX) / canvas.WIDTH * WINDOW.WIDTH;
        WINDOW.TOP = dragStartTop - (y - dragStartY) / canvas.HEIGHT * WINDOW.HEIGHT;
    };

    const mouseDown = () => {
        canMove = true;
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
    });

    // выстреливает только при уничтожении компоненты
    useEffect(() => () => map?.destructor());

    return (<div id={mapField} className={mapField}></div>);
};

export default MapCanvas;