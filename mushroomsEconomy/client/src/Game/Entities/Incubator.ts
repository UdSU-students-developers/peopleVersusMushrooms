import { TPoint } from "../../config";

export default class Incubator {
    coords: TPoint;
    sprite: number[];

    constructor(guid: string, coords: TPoint) {
        this.coords = coords;
        this.sprite = [8];
    }
}