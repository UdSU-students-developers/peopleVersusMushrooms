import React, { useContext, useEffect } from "react";
import { MediatorContext, ServerContext } from "../../../App";
import CONFIG from "../../../config";
import { Canvas, useCanvas } from "../../../services/canvas";
import Map from "../Map";
import { TMap } from "../../../services/server/types";

const mapField = 'map-field';

const MapCanvas: React.FC = () => {
    let map: Map | null = null;
    let canvas: Canvas;
    const mediator = useContext(MediatorContext);
    const server = useContext(ServerContext);
    const Canvas = useCanvas(render);
    const { WINDOW } = CONFIG;


    useEffect(() => {
        const { GENERATE_MAP } = mediator.getEventTypes();

        const mapHandler = (mapData: TMap) => {
            console.log('Карта пришла', mapData);

            const cells = mapData.map.flatMap((row: any[], y: number) =>
                row.map((type, x) => ({
                    x,
                    y,
                    type,
                    color: type === 1 ? 'blue'
                        : type === 2 ? 'gray'
                            : 'green',
                }))
            );
            map?.setCells(cells);
        };

        mediator.subscribe(GENERATE_MAP, mapHandler);
        server.generateMap();

        return () => {
            mediator.unsubscribe(GENERATE_MAP, mapHandler);
            map?.destructor();
        };
    }, []);

    function render(fps: number): void {
        if (canvas && map) {
            canvas.clear();
            map.cells.forEach((cell) => {
                canvas.rect(cell.x * 8, cell.y * 8, 100, cell.color);
            });
            canvas.text(WINDOW.LEFT + 20, WINDOW.TOP + 50, String(fps), 'red');
            canvas.render();
        }
    }

    useEffect(() => {
        map = new Map(CONFIG.WINDOW.WIDTH, CONFIG.WINDOW.HEIGHT);
        canvas = Canvas({
            parentId: mapField,
            WIDTH: WINDOW.WIDTH,
            HEIGHT: WINDOW.HEIGHT,
            WINDOW,
            callbacks: {
                mouseMove: () => { },
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