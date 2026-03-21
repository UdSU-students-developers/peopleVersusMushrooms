import { TPoint } from "../../config";

export default class TerrainBlock {
    coords:TPoint;
    sprite: number[];

    constructor(id:number, coords:TPoint, type: string) {
        this.coords = coords;
        this.sprite = this.getTerrainSprite(type);
    }

    getTerrainSprite(type: string): number[] {
        switch (type) {
            case "grow":
                return [1];
            case "water":
                return [5];
            default:
                console.log("Спрайт не определён");
                return [10];
        }
    }
}