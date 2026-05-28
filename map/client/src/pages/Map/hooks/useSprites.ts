// useSprites.ts
import black from '../../../assets/black.png';
import incubator from '../../../assets/incubator.png';
import reactor from '../../../assets/reactor.png';
import mycelium from '../../../assets/mycelium.png';
import geodezist from '../../../assets/geodezist.png';
import larva from '../../../assets/larva.png';
import mine from '../../../assets/mine.png';
import sporovaya_bashnya from '../../../assets/sporovaya_bashnya.png';
import vzryvomor from '../../../assets/vzryvomor.png';
import sporomet from '../../../assets/sporomet.png';
import champigneb from '../../../assets/champigneb.png';
import eblekar from '../../../assets/eblekar.png';
import pizdoglyad from '../../../assets/pizdoglyad.png';
import DRILLER from '../../../assets/DRILLER.png';
import PIPE from '../../../assets/PIPE.png';
import SMALL_REACTOR from '../../../assets/SMALL_REACTOR.png';
import LARGE_REACTOR from '../../../assets/LARGE_REACTOR.png';
import BARRACKS from '../../../assets/BARRACKS.png';
import WORKER from '../../../assets/WORKER.png';
import bmp from '../../../assets/bmp.png';
import soldier from '../../../assets/soldier.png';
import partizan from '../../../assets/partizan.png';
import sniper from '../../../assets/sniper.png';

export type EntityType =
    'incubator'
    | 'small_reactor'
    | 'reactor'
    | 'mycelium'
    | 'geodezist'
    | 'larva'
    | 'mine'
    | 'sporovaya_bashnya'
    | 'vzryvomor'
    | 'sporomet'
    | 'champigneb'
    | 'eblekar'
    | 'pizdoglyad'
    | 'DRILLER'
    | 'MINE'
    | 'PIPE'
    | 'SMALL_REACTOR'
    | 'LARGE_REACTOR'
    | 'BARRACKS'
    | 'worker'
    | 'bmp'
    | 'soldier'
    | 'partizan'
    | 'sniper';

export type Sprite = {
    image: HTMLImageElement;
    frameWidth: number;
    frameHeight: number;
};

const loadImage = (src: string) => {
    const img = new Image();
    img.src = src;
    return img;
};

const createAnimation = (framesCount: number, delay = 150) => {
    let frame = 0;
    let last = Date.now();

    return () => {
        const now = Date.now();

        if (now - last > delay) {
            last = now;
            frame = (frame + 1) % framesCount;
        }

        return frame;
    };
};

export const useSprites = () => {
    const renderOrder: Record<EntityType, number> = {
        mycelium: 0,
        incubator: 1,
        mine: 1,
        small_reactor: 1,
        reactor: 1,
        geodezist: 2,
        larva: 2,

        sporovaya_bashnya: 1,
        sporomet: 1,
        champigneb: 1,
        eblekar: 1,
        vzryvomor: 2,
        pizdoglyad: 2,

        DRILLER: 1,
        MINE: 1,
        PIPE: 1,
        SMALL_REACTOR: 1,
        LARGE_REACTOR: 1,
        BARRACKS: 1,
        worker: 2,

        bmp: 2,
        soldier: 2,
        partizan: 2,
        sniper: 2,
    };
    const getRenderOrder = (type: string) =>
        renderOrder[type as EntityType] ?? 999;

    const sprites: Record<EntityType, Sprite> = {
        incubator: { image: loadImage(incubator), frameWidth: 32, frameHeight: 32 },
        mine: { image: loadImage(mine), frameWidth: 32, frameHeight: 32 },
        small_reactor: { image: loadImage(reactor), frameWidth: 32, frameHeight: 32 },
        reactor: { image: loadImage(reactor), frameWidth: 32, frameHeight: 32 },
        sporovaya_bashnya: { image: loadImage(sporovaya_bashnya), frameWidth: 64, frameHeight: 64 },
        DRILLER: { image: loadImage(DRILLER), frameWidth: 32, frameHeight: 32 },
        MINE: { image: loadImage(mine), frameWidth: 32, frameHeight: 32 },
        PIPE: { image: loadImage(PIPE), frameWidth: 32, frameHeight: 32 },
        SMALL_REACTOR: { image: loadImage(SMALL_REACTOR), frameWidth: 32, frameHeight: 32 },
        LARGE_REACTOR: { image: loadImage(LARGE_REACTOR), frameWidth: 64, frameHeight: 64 },
        BARRACKS: { image: loadImage(BARRACKS), frameWidth: 64, frameHeight: 64 },

        mycelium: { image: loadImage(mycelium), frameWidth: 32, frameHeight: 32 },
        geodezist: { image: loadImage(geodezist), frameWidth: 32, frameHeight: 42 },
        larva: { image: loadImage(larva), frameWidth: 16, frameHeight: 16 },
        sporomet: { image: loadImage(sporomet), frameWidth: 32, frameHeight: 32 },
        champigneb: { image: loadImage(champigneb), frameWidth: 320, frameHeight: 320 },
        eblekar: { image: loadImage(eblekar), frameWidth: 32, frameHeight: 32 },
        vzryvomor: { image: loadImage(vzryvomor), frameWidth: 32, frameHeight: 32 },
        pizdoglyad: { image: loadImage(pizdoglyad), frameWidth: 32, frameHeight: 32 },
        worker: { image: loadImage(WORKER), frameWidth: 32, frameHeight: 32 },
        bmp: { image: loadImage(bmp), frameWidth: 64, frameHeight: 48 },
        soldier: { image: loadImage(soldier), frameWidth: 32, frameHeight: 32 },
        partizan: { image: loadImage(partizan), frameWidth: 32, frameHeight: 32 },
        sniper: { image: loadImage(sniper), frameWidth: 32, frameHeight: 32 },
    };

    const animations: Partial<Record<EntityType, () => number>> = {
        incubator: createAnimation(2),
        reactor: createAnimation(7),
        mycelium: createAnimation(1),
        geodezist: createAnimation(4),
        larva: createAnimation(2),
        mine: createAnimation(12),
        sporovaya_bashnya: createAnimation(1),
        vzryvomor: createAnimation(11),
        sporomet: createAnimation(3),
        champigneb: createAnimation(2),
        pizdoglyad: createAnimation(2),
        eblekar: createAnimation(5),
        DRILLER: createAnimation(4),
        MINE: createAnimation(12),
        PIPE: createAnimation(1),
        LARGE_REACTOR: createAnimation(4),
        BARRACKS: createAnimation(7),
        worker: createAnimation(4),
        bmp: createAnimation(1),
        soldier: createAnimation(4),
        partizan: createAnimation(2),
        sniper: createAnimation(3),
    };

    return { sprites, animations, getRenderOrder };
};