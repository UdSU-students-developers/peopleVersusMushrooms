import { TPoint } from "../../config";

export default class SmallReactor {
    coords:TPoint;
    sprite: number[];

    constructor(guid:string, coords:TPoint) {
        this.coords = coords;
        this.sprite = [8];
    }
}