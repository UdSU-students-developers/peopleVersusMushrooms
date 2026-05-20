// Спрайты юнитов для canvas-рендера Game

import soldier1Src from '../../assets/units/soldier/soldier1.png';
import soldier2Src from '../../assets/units/soldier/soldier2.png';
import soldier3Src from '../../assets/units/soldier/soldier3.png';
import soldier4Src from '../../assets/units/soldier/soldier4.png';
import bmp1Src from '../../assets/units/bmp/bmp1.png';
import bmp2Src from '../../assets/units/bmp/bmp2.png';
import bmp3Src from '../../assets/units/bmp/bmp3.png';
import bmp4Src from '../../assets/units/bmp/bmp4.png';
import bmp5Src from '../../assets/units/bmp/bmp5.png';
import bmp6Src from '../../assets/units/bmp/bmp6.png';
import bmp7Src from '../../assets/units/bmp/bmp7.png';
import bmp8Src from '../../assets/units/bmp/bmp8.png';
import partizan1Src from '../../assets/units/partizan/partizan1.png';
import partizan2Src from '../../assets/units/partizan/partizan2.png';
import sniper1Src from '../../assets/units/sniper/sniper1.png';
import sniper2Src from '../../assets/units/sniper/sniper2.png';
import sniper3Src from '../../assets/units/sniper/sniper3.png';
import sporomet1Src from '../../assets/units/sporomet/sporomet1.png';
import sporomet2Src from '../../assets/units/sporomet/sporomet2.png';
import sporomet3Src from '../../assets/units/sporomet/sporomet3.png';
import champigneb1Src from '../../assets/units/champigneb/champigneb1.png';
import champigneb2Src from '../../assets/units/champigneb/champigneb2.png';
import eblekar1Src from '../../assets/units/eblekar/eblekar1.png';
import eblekar2Src from '../../assets/units/eblekar/eblekar2.png';
import eblekar3Src from '../../assets/units/eblekar/eblekar3.png';
import eblekar4Src from '../../assets/units/eblekar/eblekar4.png';
import eblekar5Src from '../../assets/units/eblekar/eblekar5.png';
import eblekar6Src from '../../assets/units/eblekar/eblekar6.png';
import pizdoglyad1Src from '../../assets/units/pizdoglyad/pizdoglyad1.png';
import pizdoglyad2Src from '../../assets/units/pizdoglyad/pizdoglyad2.png';
import vzryvomorSrc from '../../assets/units/vzryvomor/frame_0.png';

import bashnyaIdleSrc from '../../assets/buildings/sporovaya_bashnya/idle.png';
import bashnyaAttackSrc from '../../assets/buildings/sporovaya_bashnya/attack.png';
import bashnyaDestroyedSrc from '../../assets/buildings/sporovaya_bashnya/destroyed.png';
import vzryvomorB0Src from '../../assets/buildings/vzryvomor/frame_0.png';
import vzryvomorB1Src from '../../assets/buildings/vzryvomor/frame_1.png';
import vzryvomorB2Src from '../../assets/buildings/vzryvomor/frame_2.png';
import vzryvomorB3Src from '../../assets/buildings/vzryvomor/frame_3.png';
import vzryvomorB4Src from '../../assets/buildings/vzryvomor/frame_4.png';
import vzryvomorB5Src from '../../assets/buildings/vzryvomor/frame_5.png';
import vzryvomorB6Src from '../../assets/buildings/vzryvomor/frame_6.png';
import vzryvomorB7Src from '../../assets/buildings/vzryvomor/frame_7.png';
import vzryvomorB8Src from '../../assets/buildings/vzryvomor/frame_8.png';
import vzryvomorB9Src from '../../assets/buildings/vzryvomor/frame_9.png';
import vzryvomorB10Src from '../../assets/buildings/vzryvomor/frame_10.png';

export const UNIT_FRAME_SRCS: Record<string, string[]> = {
    soldier:    [soldier1Src, soldier2Src, soldier3Src, soldier4Src],
    bmp:        [bmp1Src, bmp2Src, bmp3Src, bmp4Src, bmp5Src, bmp6Src, bmp7Src, bmp8Src],
    partizan:   [partizan1Src, partizan2Src],
    sniper:     [sniper1Src, sniper2Src, sniper3Src],
    sporomet:   [sporomet1Src, sporomet2Src, sporomet3Src],
    champigneb: [champigneb1Src, champigneb2Src],
    eblekar:    [eblekar1Src, eblekar2Src, eblekar3Src, eblekar4Src, eblekar5Src, eblekar6Src],
    pizdoglyad: [pizdoglyad2Src, pizdoglyad1Src],
    vzryvomor:  [vzryvomorSrc],
};

export const VZRYVOMOR_BUILDING_SRCS = [
    vzryvomorB0Src, vzryvomorB1Src, vzryvomorB2Src, vzryvomorB3Src,
    vzryvomorB4Src, vzryvomorB5Src, vzryvomorB6Src, vzryvomorB7Src,
    vzryvomorB8Src, vzryvomorB9Src, vzryvomorB10Src,
];

export const SPOROVAYA_BASHNYA_SRCS = {
    idle: bashnyaIdleSrc,
    attack: bashnyaAttackSrc,
    destroyed: bashnyaDestroyedSrc,
};

export const BUILDING_DEFAULT_SIZE: Record<string, number> = {
    sporovaya_bashnya: 2,
    vzryvomor: 1,
};
