import { TMap } from "../../services/server/types";

class Map {
    width: number = 0;
    height: number = 0;
    cells: any[] = [];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    setCells(cells: any[]) {
        this.cells = cells;
    }

    render(canvas: any) {
        this.cells.forEach(cell => {
            canvas.rect(cell.x * 10, cell.y * 10, 10, 10, cell.color);
        });
    }

    destructor() {
        this.cells = [];
    }
}

export default Map;