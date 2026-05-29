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
import PIPE1 from '../../../assets/PIPE1.png';
import PIPE2 from '../../../assets/PIPE2.png';
import PIPE3 from '../../../assets/PIPE3.png';
import PIPE4 from '../../../assets/PIPE4.png';
import PIPE5 from '../../../assets/PIPE5.png';
import PIPE6 from '../../../assets/PIPE6.png';
import PIPE7 from '../../../assets/PIPE7.png';
import PIPE8 from '../../../assets/PIPE8.png';
import PIPE9 from '../../../assets/PIPE9.png';
import PIPE10 from '../../../assets/PIPE10.png';
import PIPE11 from '../../../assets/PIPE11.png';
import PIPE12 from '../../../assets/PIPE12.png';
import PIPE13 from '../../../assets/PIPE13.png';
import PIPE14 from '../../../assets/PIPE14.png';
import PIPE15 from '../../../assets/PIPE15.png';
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
    | 'PIPE1'
    | 'PIPE2'
    | 'PIPE3'
    | 'PIPE4'
    | 'PIPE5'
    | 'PIPE6'
    | 'PIPE7'
    | 'PIPE8'
    | 'PIPE9'
    | 'PIPE10'
    | 'PIPE11'
    | 'PIPE12'
    | 'PIPE13'
    | 'PIPE14'
    | 'PIPE15'
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
        PIPE1: 1,
        PIPE2: 1,
        PIPE3: 1,
        PIPE4: 1,
        PIPE5: 1,
        PIPE6: 1,
        PIPE7: 1,
        PIPE8: 1,
        PIPE9: 1,
        PIPE10: 1,
        PIPE11: 1,
        PIPE12: 1,
        PIPE13: 1,
        PIPE14: 1,
        PIPE15: 1,
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
        PIPE1: { image: loadImage(PIPE1), frameWidth: 32, frameHeight: 32 },
        PIPE2: { image: loadImage(PIPE2), frameWidth: 32, frameHeight: 32 },
        PIPE3: { image: loadImage(PIPE3), frameWidth: 32, frameHeight: 32 },
        PIPE4: { image: loadImage(PIPE4), frameWidth: 32, frameHeight: 32 },
        PIPE5: { image: loadImage(PIPE5), frameWidth: 32, frameHeight: 32 },
        PIPE6: { image: loadImage(PIPE6), frameWidth: 32, frameHeight: 32 },
        PIPE7: { image: loadImage(PIPE7), frameWidth: 32, frameHeight: 32 },
        PIPE8: { image: loadImage(PIPE8), frameWidth: 32, frameHeight: 32 },
        PIPE9: { image: loadImage(PIPE9), frameWidth: 32, frameHeight: 32 },
        PIPE10: { image: loadImage(PIPE10), frameWidth: 32, frameHeight: 32 },
        PIPE11: { image: loadImage(PIPE11), frameWidth: 32, frameHeight: 32 },
        PIPE12: { image: loadImage(PIPE12), frameWidth: 32, frameHeight: 32 },
        PIPE13: { image: loadImage(PIPE13), frameWidth: 32, frameHeight: 32 },
        PIPE14: { image: loadImage(PIPE14), frameWidth: 32, frameHeight: 32 },
        PIPE15: { image: loadImage(PIPE15), frameWidth: 32, frameHeight: 32 },
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