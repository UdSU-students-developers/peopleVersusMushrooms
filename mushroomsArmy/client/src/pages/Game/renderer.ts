import { GameState, Projectile, TerrainType, Unit } from './types';
import sporometSrc from '../../assets/units/Sporomet.png';
import champignebSrc from '../../assets/units/Champigneb.png';
import eblekarSrc from '../../assets/units/Eblekar.png';
import vzryvomorFrame0 from '../../assets/buildings/vzryvomor/frame_0.png';
import vzryvomorFrame1 from '../../assets/buildings/vzryvomor/frame_1.png';
import vzryvomorFrame2 from '../../assets/buildings/vzryvomor/frame_2.png';
import vzryvomorFrame3 from '../../assets/buildings/vzryvomor/frame_3.png';
import vzryvomorFrame4 from '../../assets/buildings/vzryvomor/frame_4.png';
import vzryvomorFrame5 from '../../assets/buildings/vzryvomor/frame_5.png';
import vzryvomorFrame6 from '../../assets/buildings/vzryvomor/frame_6.png';
import vzryvomorFrame7 from '../../assets/buildings/vzryvomor/frame_7.png';
import vzryvomorFrame8 from '../../assets/buildings/vzryvomor/frame_8.png';
import vzryvomorFrame9 from '../../assets/buildings/vzryvomor/frame_9.png';
import vzryvomorFrame10 from '../../assets/buildings/vzryvomor/frame_10.png';
import sporovayaBashnyaIdle from '../../assets/buildings/sporovaya_bashnya/idle.png';
import sporovayaBashnyaAttack from '../../assets/buildings/sporovaya_bashnya/attack.png';
import sporovayaBashnyaDestroyed from '../../assets/buildings/sporovaya_bashnya/destroyed.png';
import {
  getVzryvomorFrameKey,
  stepVzryvomorAnimation,
  VZRYVOMOR_FRAME_MS,
} from './vzryvomorAnimation';


const unitImages: Record<string, HTMLImageElement> = {};
const activeProjectiles = new Map<string, Projectile & { duration: number }>();

const buildingImages: Record<string, HTMLImageElement> = {};

const VZRYVOMOR_FRAME_SRCS: string[] = [
  vzryvomorFrame0,
  vzryvomorFrame1,
  vzryvomorFrame2,
  vzryvomorFrame3,
  vzryvomorFrame4,
  vzryvomorFrame5,
  vzryvomorFrame6,
  vzryvomorFrame7,
  vzryvomorFrame8,
  vzryvomorFrame9,
  vzryvomorFrame10,
];

/** Возвращает картинку здания по стабильному ключу и URL (как getUnitImage, но с явным src). */
function getBuildingImage(key: string, src: string | undefined): HTMLImageElement | undefined {
  if (src === undefined) return undefined;
  if (!buildingImages[key]) {
    const img = new Image();
    img.src = src;
    buildingImages[key] = img;
  }
  return buildingImages[key];
}

/** Картинка реально готова к отрисовке (не битая, загрузка завершена). */
function isImageDrawable(img: HTMLImageElement | undefined): img is HTMLImageElement {
  return img !== undefined && img.complete && img.naturalWidth > 0;
}

/**
 * Безопасный drawImage: при сбое canvas (редко: битое изображение, taint) возвращает false —
 * тогда рисуем fillRect-fallback как раньше.
 */
function tryDrawImageScaled(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
): boolean {
  try {
    ctx.drawImage(img, dx, dy, dw, dh);
    return true;
  } catch {
    return false;
  }
}

function preloadBuildingImages(): void {
  VZRYVOMOR_FRAME_SRCS.forEach((src, i) => {
    getBuildingImage(getVzryvomorFrameKey(i), src);
  });
  getBuildingImage('sporovaya_bashnya:idle', sporovayaBashnyaIdle);
  getBuildingImage('sporovaya_bashnya:attack', sporovayaBashnyaAttack);
  getBuildingImage('sporovaya_bashnya:destroyed', sporovayaBashnyaDestroyed);
}

preloadBuildingImages();

const VZRYVOMOR_FRAME_COUNT = VZRYVOMOR_FRAME_SRCS.length;

/** Текущий кадр взрывомора и время последней смены кадра (по guid здания). */
const buildingAnimState: Record<string, { frame: number; lastFrameTime: number }> = {};

/**
 * Обновляет состояние анимации взрывомора и возвращает индекс кадра 0 … frameCount-1.
 * При isExploding=false кадр сбрасывается (запись удаляется), при отрисовке считается 0.
 */
function updateVzryvomorAnimation(guid: string, isExploding: boolean): number {
  const now = Date.now();
  const { next, frameIndex } = stepVzryvomorAnimation(
    buildingAnimState[guid],
    isExploding,
    now,
    VZRYVOMOR_FRAME_COUNT,
    VZRYVOMOR_FRAME_MS
  );
  if (next === undefined) {
    delete buildingAnimState[guid];
  } else {
    buildingAnimState[guid] = next;
  }
  return frameIndex;
}

function getUnitImage(unit: Unit): HTMLImageElement | undefined {

  let getImage = (unit: Unit) => {
    switch (unit.type) {
      case 'sporomet': return sporometSrc;
      case 'champigneb': return champignebSrc;
      case 'eblekar': return eblekarSrc;
      default: return undefined;
    }
  }

  if (!unitImages[unit.type]) {
    const imgSrc = getImage(unit);
    if (imgSrc === undefined) return undefined;

    const img = new Image();
    img.src = imgSrc;
    unitImages[unit.type] = img;
  }
  return unitImages[unit.type];
}

export function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState | null,
  widthCSS: number,
  heightCSS: number
) {
  if (!state) {
    drawPlaceholder(ctx, widthCSS, heightCSS);
    return;
  }

  const cellW = widthCSS / 100;
  const cellH = heightCSS / 100;

  // 1. Отрисовка карты (тайлы 100×100)
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < 100; x++) {
      const terrain = state.map[y]?.[x];
      ctx.fillStyle = getTerrainColor(terrain);
      ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
    }
  }

  // 1.5. Сетка
  drawGrid(ctx, widthCSS, heightCSS, cellW, cellH);

  // 2. Отрисовка луж слизи (полупрозрачные, под юнитами)
  state.slimePuddles.forEach(puddle => {
    const cx = puddle.x * cellW + cellW / 2;
    const cy = puddle.y * cellH + cellH / 2;
    const radiusPx = puddle.radius * Math.min(cellW, cellH);
    ctx.beginPath();
    ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(76, 175, 80, 0.4)'; // зелёный с прозрачностью 0.4
    ctx.fill();
  });

  // 3. Отрисовка зданий (вражеские — красные; сооружения грибов — отдельный вид)
  const activeVzryvomorGuids = new Set(
    (state.buildings ?? [])
      .filter(b => b.type === 'vzryvomor' && b.hp > 0)
      .map(b => b.guid)
  );

  (state.buildings ?? []).forEach(building => {
    if (building.hp <= 0) return;

    const bx = building.x * cellW;
    const by = building.y * cellH;
    const hpPercent =
      building.maxHp > 0
        ? Math.max(0, Math.min(1, building.hp / building.maxHp))
        : 0;

    if (building.type === 'vzryvomor') {
      const frameIndex = updateVzryvomorAnimation(building.guid, building.isExploding === true);
      const fi = Math.max(0, Math.min(frameIndex, VZRYVOMOR_FRAME_COUNT - 1));
      const vzImg = getBuildingImage(getVzryvomorFrameKey(fi), VZRYVOMOR_FRAME_SRCS[fi]);

      const barHeight = 4;
      let barX: number;
      let barY: number;
      let barWidth: number;

      if (isImageDrawable(vzImg) && tryDrawImageScaled(ctx, vzImg, bx, by, cellW, cellH)) {
        barX = bx;
        barY = by - 6;
        barWidth = cellW;
      } else {
        const cx = bx + cellW / 2;
        const cy = by + cellH / 2;
        const side = Math.min(cellW, cellH) * 0.88;
        const half = side / 2;
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(cx - half, cy - half, side, side);
        ctx.strokeStyle = '#b7950b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - half, cy - half, side, side);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = `bold ${Math.max(10, side * 0.42)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('В', cx, cy);
        barWidth = side;
        barX = cx - barWidth / 2;
        barY = cy - half - 6;
      }

      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
      return;
    }

    if (building.type === 'sporovaya_bashnya') {
      const sx = building.sizeX ?? 2;
      const sy = building.sizeY ?? 2;
      const px = bx;
      const py = by;
      const pw = sx * cellW;
      const ph = sy * cellH;

      const destroyed = building.isAlive === false || building.hp <= 0;
      const attacking = !destroyed && building.isAttacking === true;
      const sbImg = destroyed
        ? getBuildingImage('sporovaya_bashnya:destroyed', sporovayaBashnyaDestroyed)
        : attacking
          ? getBuildingImage('sporovaya_bashnya:attack', sporovayaBashnyaAttack)
          : getBuildingImage('sporovaya_bashnya:idle', sporovayaBashnyaIdle);

      if (!isImageDrawable(sbImg) || !tryDrawImageScaled(ctx, sbImg, px, py, pw, ph)) {
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 0.75, py + 0.75, pw - 1.5, ph - 1.5);
        ctx.fillStyle = '#efebe9';
        ctx.font = `bold ${Math.max(9, Math.min(cellW, cellH) * 0.32)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('СБ', px + pw / 2, py + ph / 2);
      }

      const barWidth = pw;
      const barHeight = 4;
      const barX = px;
      const barY = py - 6;
      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
      return;
    }

    // Вражеские здания: дом, казармы, башня — прежний красный стиль
    const bw = cellW * 1.4;
    const bh = cellH * 1.4;
    const bOffX = bx - bw / 2 + cellW / 2;
    const bOffY = by - bh / 2 + cellH / 2;

    ctx.fillStyle = '#c0392b';
    ctx.fillRect(bOffX, bOffY, bw, bh);
    ctx.strokeStyle = '#7b241c';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bOffX, bOffY, bw, bh);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(8, cellW * 0.4)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = building.type === 'house' ? 'Д' : building.type === 'barracks' ? 'Б' : 'Т';
    ctx.fillText(label, bx + cellW / 2, by + cellH / 2);

    const barWidth = bw;
    const barHeight = 4;
    const barX = bOffX;
    const barY = bOffY - 6;
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  });

  for (const guid of Object.keys(buildingAnimState)) {
    if (!activeVzryvomorGuids.has(guid)) {
      delete buildingAnimState[guid];
    }
  }

  // Отрисовка снарядов
  const now = Date.now();
  for (const projectile of state.projectiles ?? []) {
    if (!activeProjectiles.has(projectile.guid)) {
      activeProjectiles.set(projectile.guid, {
        ...projectile,
        duration: getProjectileDuration(projectile.type),
      });
    }
  }

  for (const [guid, projectile] of activeProjectiles.entries()) {
    const elapsed = Math.max(0, (now - projectile.createdAt) / projectile.duration);
    if (elapsed >= 1) {
      activeProjectiles.delete(guid);
      continue;
    }

    const x = projectile.fromX + (projectile.toX - projectile.fromX) * elapsed;
    const y = projectile.fromY + (projectile.toY - projectile.fromY) * elapsed;
    const px = x * cellW + cellW / 2;
    const py = y * cellH + cellH / 2;

    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = getProjectileColor(projectile.type);
    ctx.fill();
  }

  // 4. Отрисовка юнитов (только живых)
  state.units.forEach(unit => {
    if (unit.hp <= 0) return; // мёртвых не рисуем

    const cx = unit.x * cellW + cellW / 2;
    const cy = unit.y * cellH + cellH / 2;
    const radius = Math.min(cellW, cellH) * 0.35;
    const size = radius * 2;

    const img = getUnitImage(unit);
    if (!isImageDrawable(img) || !tryDrawImageScaled(ctx, img, cx - size / 2, cy - size / 2, size, size)) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = unit.type === 'sporomet' ? '#4caf50' : unit.type === 'eblekar' ? '#e040fb' : '#ff9800';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const barWidth = radius * 1.8;
    const barHeight = 5;
    const barX = cx - barWidth / 2;
    const barY = cy - radius - 5;

    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpPercent = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  });

}

function getTerrainColor(type: TerrainType): string {
  switch (type) {
    case 0: return '#a0d6a0';
    case 1: return '#4a7db4';
    case 2: return '#555555';
    default: return '#a0d6a0';
  }
}

function getProjectileDuration(type: Projectile['type']): number {
  switch (type) {
    case 'sporovaya_bashnya':
      return 500;
    case 'eblekar':
      return 450;
    case 'sporomet':
    default:
      return 400;
  }
}

function getProjectileColor(type: Projectile['type']): string {
  switch (type) {
    case 'sporomet':
      return '#4caf50';
    case 'sporovaya_bashnya':
      return '#f1c40f';
    case 'eblekar':
      return '#2196f3';
    default:
      return '#ffffff';
  }
}

/**
 * Рисует тонкую серую сетку 100×100
 */
function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, cellW: number, cellH: number) {
  ctx.beginPath();
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 100; i++) {
    const x = i * cellW;
    const y = i * cellH;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const cellW = width / 100;
  const cellH = height / 100;
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < 100; x++) {
      ctx.fillStyle = '#a0d6a0';
      ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
    }
  }
  drawGrid(ctx, width, height, cellW, cellH);
}
