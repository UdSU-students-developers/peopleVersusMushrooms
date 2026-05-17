// Игровые изображения: спрайты юнитов, зданий и текстуры тумана войны

import sporometSrc from '../../../assets/units/Sporomet.png';
import champignebSrc from '../../../assets/units/Champigneb.png';
import eblekarSrc from '../../../assets/units/Eblekar.png';
import pizdoglyadIdleSrc from '../../../assets/units/Pizdoglyad2.png';
import pizdoglyadWalkSrc from '../../../assets/units/Pizdoglyad1.png';

import vzryvomorFrame0 from '../../../assets/buildings/vzryvomor/frame_0.png';
import vzryvomorFrame1 from '../../../assets/buildings/vzryvomor/frame_1.png';
import vzryvomorFrame2 from '../../../assets/buildings/vzryvomor/frame_2.png';
import vzryvomorFrame3 from '../../../assets/buildings/vzryvomor/frame_3.png';
import vzryvomorFrame4 from '../../../assets/buildings/vzryvomor/frame_4.png';
import vzryvomorFrame5 from '../../../assets/buildings/vzryvomor/frame_5.png';
import vzryvomorFrame6 from '../../../assets/buildings/vzryvomor/frame_6.png';
import vzryvomorFrame7 from '../../../assets/buildings/vzryvomor/frame_7.png';
import vzryvomorFrame8 from '../../../assets/buildings/vzryvomor/frame_8.png';
import vzryvomorFrame9 from '../../../assets/buildings/vzryvomor/frame_9.png';
import vzryvomorFrame10 from '../../../assets/buildings/vzryvomor/frame_10.png';

import sporovayaBashnyaIdle from '../../../assets/buildings/sporovaya_bashnya/idle.png';
import sporovayaBashnyaAttack from '../../../assets/buildings/sporovaya_bashnya/attack.png';
import sporovayaBashnyaDestroyed from '../../../assets/buildings/sporovaya_bashnya/destroyed.png';

import economySpritesSrc from '../../../assets/buildings/economy/sprites.png';

import champignebExplFrame0 from '../../../assets/units/champigneb_explosion/frame_0.png';
import champignebExplFrame1 from '../../../assets/units/champigneb_explosion/frame_1.png';
import champignebExplFrame2 from '../../../assets/units/champigneb_explosion/frame_2.png';
import champignebExplFrame3 from '../../../assets/units/champigneb_explosion/frame_3.png';
import champignebExplFrame4 from '../../../assets/units/champigneb_explosion/frame_4.png';

import grassTextureSrc1 from '../../../assets/map/grass/grass1.webp';
import grassTextureSrc2 from '../../../assets/map/grass/grass2.webp';
import grassTextureSrc3 from '../../../assets/map/grass/grass3.webp';
import grassWithFrlowersTextureSrc from '../../../assets/map/grass/grass_with_flowers.webp';
import grassWithFlowersTextureSrc2 from '../../../assets/map/grass/grass_with_flowers2.webp';
import grass1TextureSrc22 from '../../../assets/map/grass/grass_with_flowers22.webp';
import grassWithOneFlowerTextureSrc from '../../../assets/map/grass/grass_with_one_flower.webp';

import waterTextureSrc from '../../../assets/map/water/water.webp';
import waterFlowersSrc from '../../../assets/map/water/water_with_flowers.webp';
import lilyWhiteSrc from '../../../assets/map/water/water_lily_with_white_flowers.webp';
import lilyYellowSrc from '../../../assets/map/water/water_lily_with_yellow_flowers.webp';
import lilyBaseSrc from '../../../assets/map/water/water_lily.webp';

import mountainsTextureSrc from '../../../assets/map/mountains/mountains.webp';

import tumanSrc from '../../../assets/map/fog/tuman.png';
import tuman2Src from '../../../assets/map/fog/tuman2.png';
import tuman3Src from '../../../assets/map/fog/tuman3.png';

import waterEdgeTop from '../../../assets/map/water-edges/edge-t.webp';
import waterEdgeBottom from '../../../assets/map/water-edges/edge-b.webp';
import waterEdgeLeft from '../../../assets/map/water-edges/edge-l.webp';
import waterEdgeRight from '../../../assets/map/water-edges/edge-r.webp';
import waterCornerTopLeft from '../../../assets/map/water-edges/corner-tl.webp';
import waterCornerTopRight from '../../../assets/map/water-edges/corner-tr.webp';
import waterCornerBottomLeft from '../../../assets/map/water-edges/corner-bl.webp';
import waterCornerBottomRight from '../../../assets/map/water-edges/corner-br.webp';
import landCornerSrc from '../../../assets/map/water-edges/corner-earth-tr.webp';
import waterInnerCornerTopLeft from '../../../assets/map/water-edges/innerCorner-tl.webp';
import waterInnerCornerTopRight from '../../../assets/map/water-edges/innerCorner-tr.webp';
import waterInnerCornerBottomLeft from '../../../assets/map/water-edges/innerCorner-bl.webp';
import waterInnerCornerBottomRight from '../../../assets/map/water-edges/innerCorner-br.webp';

import bushImgSrc from '../../../assets/map/decoration/bushbush.webp';

export const UNIT_SRCS: Record<string, string> = {
  sporomet: sporometSrc,
  champigneb: champignebSrc,
  eblekar: eblekarSrc,
  pizdoglyad: pizdoglyadIdleSrc,
};

export const CHAMPIGNEB_EXPL_FRAME_SRCS: string[] = [
  champignebExplFrame0,
  champignebExplFrame1,
  champignebExplFrame2,
  champignebExplFrame3,
  champignebExplFrame4,
];

export const champignebExplImages: HTMLImageElement[] = CHAMPIGNEB_EXPL_FRAME_SRCS.map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

export const VZRYVOMOR_FRAME_SRCS: string[] = [
  vzryvomorFrame0, vzryvomorFrame1, vzryvomorFrame2, vzryvomorFrame3,
  vzryvomorFrame4, vzryvomorFrame5, vzryvomorFrame6, vzryvomorFrame7,
  vzryvomorFrame8, vzryvomorFrame9, vzryvomorFrame10,
];

export const PIZDOGLYAD_SRCS = {
  idle: pizdoglyadIdleSrc,
  walk: pizdoglyadWalkSrc,
};

export const SPOROVAYA_BASHNYA_SRCS = {
  idle: sporovayaBashnyaIdle,
  attack: sporovayaBashnyaAttack,
  destroyed: sporovayaBashnyaDestroyed,
};

export const economySpritesImg = Object.assign(new Image(), { src: economySpritesSrc });

const grass1Img = Object.assign(new Image(), { src: grassTextureSrc1 });
const grass2Img = Object.assign(new Image(), { src: grassTextureSrc2 });
const grass3Img = Object.assign(new Image(), { src: grassTextureSrc3 });
const flower1Img = Object.assign(new Image(), { src: grassWithFrlowersTextureSrc });
const flower2Img = Object.assign(new Image(), { src: grassWithFlowersTextureSrc2 });
const flower3Img = Object.assign(new Image(), { src: grass1TextureSrc22 });
const flower4Img = Object.assign(new Image(), { src: grassWithOneFlowerTextureSrc });

export const weightedGrassPool: HTMLImageElement[] = [
  ...Array(15).fill(grass1Img),
  ...Array(15).fill(grass2Img),
  ...Array(4).fill(grass3Img),
  ...Array(1).fill(flower1Img),
  ...Array(1).fill(flower2Img),
  ...Array(1).fill(flower3Img),
  ...Array(1).fill(flower4Img),
];

export const waterBaseImg = Object.assign(new Image(), { src: waterTextureSrc });
export const waterFlowersImg = Object.assign(new Image(), { src: waterFlowersSrc });
export const waterLilies: HTMLImageElement[] = [
  Object.assign(new Image(), { src: lilyWhiteSrc }),
  Object.assign(new Image(), { src: lilyYellowSrc }),
  Object.assign(new Image(), { src: lilyBaseSrc }),
];

export const edgeImages = {
  top: Object.assign(new Image(), { src: waterEdgeTop }),
  bottom: Object.assign(new Image(), { src: waterEdgeBottom }),
  left: Object.assign(new Image(), { src: waterEdgeLeft }),
  right: Object.assign(new Image(), { src: waterEdgeRight }),
  topLeft: Object.assign(new Image(), { src: waterCornerTopLeft }),
  topRight: Object.assign(new Image(), { src: waterCornerTopRight }),
  bottomLeft: Object.assign(new Image(), { src: waterCornerBottomLeft }),
  bottomRight: Object.assign(new Image(), { src: waterCornerBottomRight }),
  landCorner: Object.assign(new Image(), { src: landCornerSrc }),
  innerTopLeft: Object.assign(new Image(), { src: waterInnerCornerTopLeft }),
  innerTopRight: Object.assign(new Image(), { src: waterInnerCornerTopRight }),
  innerBottomLeft: Object.assign(new Image(), { src: waterInnerCornerBottomLeft }),
  innerBottomRight: Object.assign(new Image(), { src: waterInnerCornerBottomRight }),
};

export const mountainImg = Object.assign(new Image(), { src: mountainsTextureSrc });

export const FOG_WAR_TEXTURE_SRCS = [tumanSrc, tuman2Src, tuman3Src] as const;

export const fogWarImages: HTMLImageElement[] = (FOG_WAR_TEXTURE_SRCS as readonly string[]).map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

export const bushImg = Object.assign(new Image(), { src: bushImgSrc });