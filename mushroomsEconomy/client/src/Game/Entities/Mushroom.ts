import { TPoint } from "../../config";

export default class Mushroom {
    coords:TPoint;
    level: number;
    sprite: number[];

    constructor(guid:string, coords:TPoint, level: number) {
        this.coords = coords;
        this.level = level
        this.sprite = this.getMushroomSprite(level);
    }

    getMushroomSprite(level: number): number[] {
        switch (level) {
            case 1: 
                return [4];
            case 2: 
                return [5];
            case 3: 
                return [6];
            default:
                console.log("Спрайт не определён, уровень гриба ", level);
                return [7];
        }
    }
}