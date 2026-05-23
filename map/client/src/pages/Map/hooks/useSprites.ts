// useSprites.ts
import black from '../../../assets/black.png';
import mycelium from '../../../assets/mycelium.png';
import geodezist from '../../../assets/geodezist.png';
import larva from '../../../assets/larva.png';
import mine from '../../../assets/mine.png';

export type EntityType =
    'incubator'
    | 'small_reactor'
    | 'reactor'
    | 'mycelium'
    | 'geodezist'
    | 'larva'
    | 'mine';

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
        larva: 2
    };
    const getRenderOrder = (type: string) =>
        renderOrder[type as EntityType]?? 999;

    const sprites: Record<EntityType, Sprite> = {
        incubator: { image: loadImage(black), frameWidth: 32, frameHeight: 32 },
        mine: { image: loadImage(mine), frameWidth: 32, frameHeight: 32 },
        small_reactor: { image: loadImage(black), frameWidth: 32, frameHeight: 32 },
        reactor: { image: loadImage(black), frameWidth: 32, frameHeight: 32 },

        mycelium: { image: loadImage(mycelium), frameWidth: 32, frameHeight: 32 },
        geodezist: { image: loadImage(geodezist), frameWidth: 32, frameHeight: 42 },
        larva: { image: loadImage(larva), frameWidth: 16, frameHeight: 16 },
    };

    const animations: Partial<Record<EntityType, () => number>> = {
        mycelium: createAnimation(1),
        geodezist: createAnimation(4),
        larva: createAnimation(2),
        mine: createAnimation(12),
    };

    return { sprites, animations, getRenderOrder };
};