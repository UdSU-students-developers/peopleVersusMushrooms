import { TLarva } from '../../services/Server/types';

const LARVA_SPRITE_ID = 7; 

export default class Larva {
    public guid: string;
    public coords: { x: number, y: number };
    public sprite: number[];

    constructor(guid: string, coords: { x: number, y: number }) {
        this.guid = guid;
        this.coords = coords;
        this.sprite = [LARVA_SPRITE_ID]; 
    }
}
