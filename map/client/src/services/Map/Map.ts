import { TBuilding, TUnit } from "../server/types";

class Map {
    width: number = 0;
    height: number = 0;
    cells: any[] = [];
    buildings: TBuilding[] = [];
    units: TUnit[] = [];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    setCells(cells: any[]) {
        this.cells = cells;
    }

    setBuildings(buildings: TBuilding[]) {
        this.buildings = buildings;
    }

    setUnits(units: TUnit[]) {
        this.units = units;
    }

    render(canvas: any) {
        this.cells.forEach(cell => {
            canvas.rect(cell.x * 10, cell.y * 10, 10, 10, cell.color);
        });
    }

    destructor() {
        this.cells = [];
        this.buildings = [];
        this.units = [];
    }
}

export default Map;