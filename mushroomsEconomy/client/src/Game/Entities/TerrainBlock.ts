import { TPoint } from "../../config";

export default class TerrainBlock {
    coords:TPoint;
    sprite: number[];

    constructor(coords:TPoint, type: number) {
        this.coords = coords;
        this.sprite = this.getTerrainSprite(type);
    }

    getTerrainSprite(type: number): number[] {
        switch (type) {
            case 0: //grass
                return [1];
            case 1: //water
                return [2];
            case 2: //stone
                return [3];
            default:
                console.log("Спрайт не определён");
                return [7];
        }
    }
}