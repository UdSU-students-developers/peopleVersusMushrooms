import { Unit, EnemyUnit, Projectile, EconomyUnit } from '../types';
import { UNIT_SRCS, PEOPLE_UNIT_SRCS, PIZDOGLYAD_SRCS, champignebExplImages, vzryvomorExplImages, VZRYVOMOR_FRAME_SRCS, SPOROVAYA_BASHNYA_SRCS, PEOPLE_ECONOMY_BUILDING_SRCS, economySpritesSrc } from './assets';
import { isImageDrawable, tryDrawImageScaled, getBuildingImage } from './buildingRenderer';
import { getVzryvomorFrameKey } from './vzryvomorAnimation';
import { Building, GameState } from '../types';

const MAX_HP: Record<string, number> = {
  sporomet: 8,
  champigneb: 35,
  eblekar: 40,
  vzryvomor: 70,
  sporovaya_bashnya: 160,
  pizdoglyad: 2,
  soldier: 10,
  bmp: 100,
  sniper: 20,
  partizan: 15,
};

const PEOPLE_UNIT_COLORS: Record<string, { fill: string; stroke: string }> = {
  soldier: { fill: '#4a9eff', stroke: '#7dc4ff' },
  bmp: { fill: '#39d353', stroke: '#7ee787' },
  sniper: { fill: '#f59e0b', stroke: '#fde68a' },
  partizan: { fill: '#22c55e', stroke: '#bbf7d0' },
};

const ECONOMY_BUILDING_TYPES = new Set([
  'mycelium', 'incubator', 'reactor', 'small_reactor', 'mine',
]);

const PEOPLE_ECONOMY_BUILDING_TYPES = new Set([
  'pipe',
  'oil_barrel',
  'iron_barrel',
  'barracks',
  'small_reactor',
  'large_reactor',
  'driller',
  'mine',
]);

// Спрайт-лист экономики: 32×32 пикселя на спрайт, 32 спрайта в строке (1-индексированные)
const ECONOMY_SPRITE_SIZE = 32;
const ECONOMY_SPRITES_PER_ROW = 32;

function getEconomySpriteCoords(spriteNo: number): [number, number, number] {
  const y = Math.trunc(spriteNo / ECONOMY_SPRITES_PER_ROW) * ECONOMY_SPRITE_SIZE;
  const x = (spriteNo % ECONOMY_SPRITES_PER_ROW - 1) * ECONOMY_SPRITE_SIZE;
  return [x, y, ECONOMY_SPRITE_SIZE];
}

const ECONOMY_SPRITE_NUM: Record<string, number> = {
  mycelium:     4, // level 1; levels 2 and 3 use 5 and 6
  small_reactor: 8,
  reactor:      8,
  incubator:    11,
  mine:         14,
  larva:        10,
  geodezist:    12,
};

/** Для грибниц спрайт зависит от уровня (1→4, 2→5, 3→6) */
function getEconomyBuildingSpriteNum(type: string, level?: number): number {
  if (type === 'mycelium') {
    const lvl = level ?? 1;
    return lvl <= 1 ? 4 : lvl === 2 ? 5 : 6;
  }
  return ECONOMY_SPRITE_NUM[type] ?? 4;
}

let economySpritesImage: HTMLImageElement | null = null;
function getEconomySpritesImage(): HTMLImageElement {
  if (!economySpritesImage) {
    economySpritesImage = new Image();
    economySpritesImage.src = economySpritesSrc;
  }
  return economySpritesImage;
}

function drawEconomySprite(
  ctx: CanvasRenderingContext2D,
  spriteNo: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number
): boolean {
  const img = getEconomySpritesImage();
  if (!isImageDrawable(img)) return false;
  const [sx, sy, sSize] = getEconomySpriteCoords(spriteNo);
  try {
    ctx.drawImage(img, sx, sy, sSize, sSize, dx, dy, dw, dh);
    return true;
  } catch {
    return false;
  }
}

const ECONOMY_BUILDING_CONFIG: Record<string, { label: string; color: string }> = {
  mycelium:     { label: 'Г',  color: '#ec4899' },
  incubator:    { label: 'И',  color: '#a855f7' },
  reactor:      { label: 'БР', color: '#3b82f6' },
  small_reactor:{ label: 'Р',  color: '#06b6d4' },
  mine:         { label: 'Ш',  color: '#eab308' },
};

export const getMaxHp = (type: string): number => MAX_HP[type] ?? 100;

function normalizeBuildingType(type: string): string {
  return String(type || '').toLowerCase();
}

function getBuildingSize(building: Building): number {
  return building.sizeX ?? building.sizeY ?? building.size ?? 1;
}

function isPeopleEconomyBuilding(building: Building, normalizedType: string): boolean {
  if (building.role === 'peopleEconomy') return true;
  if (building.role === 'mushroomsEconomy') return false;
  return PEOPLE_ECONOMY_BUILDING_TYPES.has(normalizedType)
    && !ECONOMY_BUILDING_TYPES.has(normalizedType);
}

const pizdoglyadImages: { idle: HTMLImageElement; walk: HTMLImageElement } = {
  idle: Object.assign(new Image(), { src: PIZDOGLYAD_SRCS.idle }),
  walk: Object.assign(new Image(), { src: PIZDOGLYAD_SRCS.walk }),
};

const prevUnitPositions = new Map<string, { x: number; y: number }>();

const unitImages: Record<string, HTMLImageElement> = {};
const peopleUnitImages: Record<string, HTMLImageElement> = {};

function getUnitImage(unit: Unit): HTMLImageElement | undefined {
  if (unit.type === 'pizdoglyad') {
    const prev = prevUnitPositions.get(unit.guid);
    const isMoving = prev !== undefined && (prev.x !== unit.x || prev.y !== unit.y);
    prevUnitPositions.set(unit.guid, { x: unit.x, y: unit.y });
    return isMoving ? pizdoglyadImages.walk : pizdoglyadImages.idle;
  }

  if (!unitImages[unit.type]) {
    const src = UNIT_SRCS[unit.type];
    if (src === undefined) return undefined;
    const img = new Image();
    img.src = src;
    unitImages[unit.type] = img;
  }
  return unitImages[unit.type];
}

function getPeopleUnitImage(unit: EnemyUnit): HTMLImageElement | undefined {
  if (!peopleUnitImages[unit.type]) {
    const src = PEOPLE_UNIT_SRCS[unit.type];
    if (src === undefined) return undefined;
    const img = new Image();
    img.src = src;
    peopleUnitImages[unit.type] = img;
  }

  return peopleUnitImages[unit.type];
}

const CHAMPIGNEB_EXPL_DURATION = 1000;
const CHAMPIGNEB_EXPLOSION_FRAME_COUNT = 5;

const champignebExplosions = new Map<string, { x: number; y: number; startTime: number }>();
const prevChampignebHp = new Map<string, number>();

function updateChampignebExplosions(units: Unit[], now: number): void {
  units.forEach(unit => {
    if (unit.type !== 'champigneb') return;
    const prevHp = prevChampignebHp.get(unit.guid) ?? unit.hp;
    if (unit.hp <= 0 && prevHp > 0 && !champignebExplosions.has(unit.guid)) {
      champignebExplosions.set(unit.guid, { x: unit.x, y: unit.y, startTime: now });
    }
    prevChampignebHp.set(unit.guid, unit.hp);
  });
}

function drawChampignebExplosions(
  ctx: CanvasRenderingContext2D,
  cellW: number,
  cellH: number,
  now: number
): void {
  for (const [guid, entry] of champignebExplosions.entries()) {
    const elapsed = now - entry.startTime;
    if (elapsed >= CHAMPIGNEB_EXPL_DURATION) {
      champignebExplosions.delete(guid);
      prevChampignebHp.delete(guid);
      continue;
    }
    const fi = Math.min(
      Math.floor((elapsed / CHAMPIGNEB_EXPL_DURATION) * CHAMPIGNEB_EXPLOSION_FRAME_COUNT),
      CHAMPIGNEB_EXPLOSION_FRAME_COUNT - 1
    );
    const cx = entry.x * cellW + cellW / 2;
    const cy = entry.y * cellH + cellH / 2;
    const size = 20 * Math.min(cellW, cellH);
    const img = champignebExplImages[fi];
    if (isImageDrawable(img)) {
      tryDrawImageScaled(ctx, img, cx - size / 2, cy - size / 2, size, size);
    } else {
      const alpha = 1 - elapsed / CHAMPIGNEB_EXPL_DURATION;
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,152,0,${alpha * 0.85})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255,80,0,${alpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
}

const VZRYVOMOR_EXPL_DURATION = 1000;
const VZRYVOMOR_EXPLOSION_FRAME_COUNT = 5;

const vzryvomorExplosions = new Map<string, { x: number; y: number; startTime: number }>();
const prevVzryvomorExploding = new Map<string, boolean>();
const prevVzryvomorHp = new Map<string, number>();

function updateVzryvomorExplosions(buildings: Building[], now: number): void {
  buildings.forEach(building => {
    if (building.type !== 'vzryvomor') return;
    const prevExploding = prevVzryvomorExploding.get(building.guid) ?? false;
    const prevHp = prevVzryvomorHp.get(building.guid) ?? building.hp;
    const exploding = building.isExploding === true;

    if (!vzryvomorExplosions.has(building.guid)) {
      if (exploding && !prevExploding) {
        vzryvomorExplosions.set(building.guid, { x: building.x, y: building.y, startTime: now });
      } else if (building.hp <= 0 && prevHp > 0) {
        vzryvomorExplosions.set(building.guid, { x: building.x, y: building.y, startTime: now });
      }
    }

    prevVzryvomorExploding.set(building.guid, exploding);
    prevVzryvomorHp.set(building.guid, building.hp);
  });
}

function isVzryvomorExplosionPlaying(guid: string, now: number): boolean {
  const entry = vzryvomorExplosions.get(guid);
  if (!entry) return false;
  return now - entry.startTime < VZRYVOMOR_EXPL_DURATION;
}

function drawVzryvomorExplosions(
  ctx: CanvasRenderingContext2D,
  cellW: number,
  cellH: number,
  now: number
): void {
  for (const [guid, entry] of vzryvomorExplosions.entries()) {
    const elapsed = now - entry.startTime;
    if (elapsed >= VZRYVOMOR_EXPL_DURATION) {
      vzryvomorExplosions.delete(guid);
      prevVzryvomorExploding.delete(guid);
      prevVzryvomorHp.delete(guid);
      continue;
    }
    const fi = Math.min(
      Math.floor((elapsed / VZRYVOMOR_EXPL_DURATION) * VZRYVOMOR_EXPLOSION_FRAME_COUNT),
      VZRYVOMOR_EXPLOSION_FRAME_COUNT - 1
    );
    const cx = entry.x * cellW + cellW / 2;
    const cy = entry.y * cellH + cellH / 2;
    const size = 24 * Math.min(cellW, cellH);
    const img = vzryvomorExplImages[fi];
    if (isImageDrawable(img)) {
      tryDrawImageScaled(ctx, img, cx - size / 2, cy - size / 2, size, size);
    } else {
      const alpha = 1 - elapsed / VZRYVOMOR_EXPL_DURATION;
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,200,0,${alpha * 0.9})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255,60,0,${alpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
}

const activeProjectiles = new Map<string, Projectile & { duration: number }>();

function getProjectileDuration(type: Projectile['type']): number {
  switch (type) {
    case 'sporovaya_bashnya': return 500;
    case 'eblekar': return 450;
    case 'sporomet':
    default: return 400;
  }
}

function getProjectileColor(type: Projectile['type']): string {
  switch (type) {
    case 'sporomet': return '#4caf50';
    case 'sporovaya_bashnya': return '#f1c40f';
    case 'eblekar': return '#2196f3';
    default: return '#ffffff';
  }
}

function drawProjectiles(
  ctx: CanvasRenderingContext2D,
  projectiles: Projectile[],
  cellW: number,
  cellH: number,
  circularVisibilityMask: boolean[][],
  now: number
): void {
  for (const projectile of projectiles ?? []) {
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
    const pTileX = Math.floor(x);
    const pTileY = Math.floor(y);
    if (circularVisibilityMask[pTileY]?.[pTileX] !== true) continue;

    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = getProjectileColor(projectile.type);
    ctx.fill();
  }
}

function preloadBuildingImages(): void {
  VZRYVOMOR_FRAME_SRCS.forEach((src, i) => {
    getBuildingImage(getVzryvomorFrameKey(i), src);
  });
  getBuildingImage('sporovaya_bashnya:idle', SPOROVAYA_BASHNYA_SRCS.idle);
  getBuildingImage('sporovaya_bashnya:attack', SPOROVAYA_BASHNYA_SRCS.attack);
  getBuildingImage('sporovaya_bashnya:destroyed', SPOROVAYA_BASHNYA_SRCS.destroyed);
  Object.entries(PEOPLE_ECONOMY_BUILDING_SRCS).forEach(([type, src]) => {
    getBuildingImage(`people_economy:${type}`, src);
  });
}

preloadBuildingImages();

export function drawBuildings(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cellW: number,
  cellH: number,
  circularVisibilityMask: boolean[][]
): void {
  const now = Date.now();
  updateVzryvomorExplosions(state.buildings ?? [], now);

  (state.buildings ?? []).forEach(building => {
    const buildingType = normalizeBuildingType(building.type);
    if (building.hp <= 0 && !ECONOMY_BUILDING_TYPES.has(buildingType)) return;
    const footprintSize = getBuildingSize(building);
    const sx = building.sizeX ?? footprintSize;
    const sy = building.sizeY ?? footprintSize;
    let buildingVisibleNow = false;
    for (let yy = 0; yy < sy && !buildingVisibleNow; yy++) {
      for (let xx = 0; xx < sx; xx++) {
        const tx = building.x + xx;
        const ty = building.y + yy;
        if (circularVisibilityMask[ty]?.[tx] === true) {
          buildingVisibleNow = true;
          break;
        }
      }
    }
    const isFriendly = buildingType === 'vzryvomor' || buildingType === 'sporovaya_bashnya' || ECONOMY_BUILDING_TYPES.has(buildingType);
    if (!buildingVisibleNow && !isFriendly) return;

    const bx = building.x * cellW;
    const by = building.y * cellH;
    const hpPercent = Math.max(0, Math.min(1, building.hp / getMaxHp(buildingType)));

    if (buildingType === 'vzryvomor') {
      if (isVzryvomorExplosionPlaying(building.guid, now) || building.isExploding === true) {
        return;
      }
      const vzImg = getBuildingImage(getVzryvomorFrameKey(0), VZRYVOMOR_FRAME_SRCS[0]);
      const barHeight = 4;
      let barX: number, barY: number, barWidth: number;
      const cx = bx + cellW / 2;
      const cy = by + cellH / 2;
      const side = Math.min(cellW, cellH) * 0.88;

      if (isImageDrawable(vzImg) && tryDrawImageScaled(ctx, vzImg, bx, by, cellW, cellH)) {
        barX = bx; barY = by - 6; barWidth = cellW;
      } else {
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
        ctx.fillText('Р’', cx, cy);
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

    if (buildingType === 'sporovaya_bashnya') {
      const bsx = building.sizeX ?? 2;
      const bsy = building.sizeY ?? 2;
      const px = bx, py = by;
      const pw = bsx * cellW, ph = bsy * cellH;
      const destroyed = building.isAlive === false || building.hp <= 0;
      const attacking = !destroyed && building.isAttacking === true;
      const sbImg = destroyed
        ? getBuildingImage('sporovaya_bashnya:destroyed', SPOROVAYA_BASHNYA_SRCS.destroyed)
        : attacking
          ? getBuildingImage('sporovaya_bashnya:attack', SPOROVAYA_BASHNYA_SRCS.attack)
          : getBuildingImage('sporovaya_bashnya:idle', SPOROVAYA_BASHNYA_SRCS.idle);

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
        ctx.fillText('РЎР‘', px + pw / 2, py + ph / 2);
      }

      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(px, py - 6, pw, 4);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(px, py - 6, pw * hpPercent, 4);
      return;
    }

    const peopleEconomyBuildingSrc = isPeopleEconomyBuilding(building, buildingType)
      ? PEOPLE_ECONOMY_BUILDING_SRCS[buildingType]
      : undefined;
    if (peopleEconomyBuildingSrc) {
      const pw = sx * cellW;
      const ph = sy * cellH;
      const img = getBuildingImage(`people_economy:${buildingType}`, peopleEconomyBuildingSrc);

      if (!isImageDrawable(img) || !tryDrawImageScaled(ctx, img, bx, by, pw, ph)) {
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(bx, by, pw, ph);
        ctx.strokeStyle = '#7b241c';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, pw, ph);
      }

      if (Number.isFinite(hpPercent) && hpPercent > 0) {
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(bx, by - 6, pw, 4);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(bx, by - 6, pw * hpPercent, 4);
      }
      return;
    }

    const economyBuilding = ECONOMY_BUILDING_CONFIG[buildingType];
    if (economyBuilding) {
      const bw = cellW * 1.4;
      const bh = cellH * 1.4;
      const bOffX = bx - bw / 2 + cellW / 2;
      const bOffY = by - bh / 2 + cellH / 2;

      const spriteNo = getEconomyBuildingSpriteNum(buildingType, building.level);
      const drawnSprite = spriteNo !== undefined && drawEconomySprite(ctx, spriteNo, bOffX, bOffY, bw, bh);

      if (!drawnSprite) {
        ctx.fillStyle = economyBuilding.color;
        ctx.fillRect(bOffX, bOffY, bw, bh);
        ctx.strokeStyle = '#4c1d95';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bOffX, bOffY, bw, bh);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(8, cellW * 0.32)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(economyBuilding.label, bx + cellW / 2, by + cellH / 2);
      }

      ctx.fillStyle = '#d32f2f';
      if (Number.isFinite(hpPercent) && hpPercent > 0) {
        ctx.fillRect(bOffX, bOffY - 6, bw, 4);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(bOffX, bOffY - 6, bw * hpPercent, 4);
      }
      return;
    }

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
    const label = building.type === 'house' ? 'Р”' : building.type === 'barracks' ? 'Р‘' : 'Рў';
    ctx.fillText(label, bx + cellW / 2, by + cellH / 2);
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(bOffX, bOffY - 6, bw, 4);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(bOffX, bOffY - 6, bw * hpPercent, 4);
  });

  drawVzryvomorExplosions(ctx, cellW, cellH, now);
}

/**
 * Рисует тонкую стрелку от юнита к его цели
 */
function drawTargetArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  cellW: number,
  cellH: number,
  color: string = 'rgba(200, 200, 200, 0.6)'
): void {
  const x1 = fromX * cellW + cellW / 2;
  const y1 = fromY * cellH + cellH / 2;
  const x2 = toX * cellW + cellW / 2;
  const y2 = toY * cellH + cellH / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 1) return; // Стрелка слишком короткая

  // Направление
  const dirX = dx / dist;
  const dirY = dy / dist;

  // Линия
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Стрелочка в конце
  const arrowSize = 6;
  const perp1X = -dirY * arrowSize;
  const perp1Y = dirX * arrowSize;

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - dirX * arrowSize + perp1X * 0.5, y2 - dirY * arrowSize + perp1Y * 0.5);
  ctx.lineTo(x2 - dirX * arrowSize - perp1X * 0.5, y2 - dirY * arrowSize - perp1Y * 0.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawUnits(
  ctx: CanvasRenderingContext2D,
  units: Unit[],
  cellW: number,
  cellH: number,
  circularVisibilityMask: boolean[][]
): void {
  const now = Date.now();
  updateChampignebExplosions(units, now);
  drawChampignebExplosions(ctx, cellW, cellH, now);

  units.forEach(unit => {
    if (unit.hp <= 0) return;
    const ux = Math.floor(unit.x);
    const uy = Math.floor(unit.y);
    const isFriendly = unit.type === 'sporomet' || unit.type === 'champigneb' || unit.type === 'eblekar' || unit.type === 'pizdoglyad';
    const unitVisibleNow = circularVisibilityMask[uy]?.[ux] === true;
    if (!unitVisibleNow && !isFriendly) return;

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
    const hpPercent = Math.max(0, Math.min(1, unit.hp / getMaxHp(unit.type)));

    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    // Рисуем стрелку к цели, если она есть
    if (unit.targetX !== undefined && unit.targetY !== undefined) {
      const arrowColor = unit.type === 'sporomet' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(224, 64, 251, 0.4)';
      drawTargetArrow(ctx, unit.x, unit.y, unit.targetX, unit.targetY, cellW, cellH, arrowColor);
    }
  });
}

export function drawEnemyUnits(
  ctx: CanvasRenderingContext2D,
  units: EnemyUnit[],
  cellW: number,
  cellH: number,
  circularVisibilityMask: boolean[][]
): void {
  units.forEach(unit => {
    if ((unit.hp ?? 1) <= 0) return;
    const ux = Math.floor(unit.x);
    const uy = Math.floor(unit.y);
    if (circularVisibilityMask[uy]?.[ux] !== true) return;

    const cx = unit.x * cellW + cellW / 2;
    const cy = unit.y * cellH + cellH / 2;
    const radius = Math.min(cellW, cellH) * 0.35;
    const peopleUnitColor = PEOPLE_UNIT_COLORS[unit.type];

    if (peopleUnitColor) {
      const img = getPeopleUnitImage(unit);
      const sizeMultiplier = unit.type === 'bmp' ? 3.2 : 2.2;
      const size = radius * sizeMultiplier;

      if (!isImageDrawable(img) || !tryDrawImageScaled(ctx, img, cx - size / 2, cy - size / 2, size, size)) {
        ctx.fillStyle = peopleUnitColor.fill;
        ctx.strokeStyle = peopleUnitColor.stroke;
        ctx.lineWidth = 1.5;

        if (unit.type === 'bmp') {
          const side = radius * 1.8;
          ctx.fillRect(cx - side / 2, cy - side / 2, side, side);
          ctx.strokeRect(cx - side / 2, cy - side / 2, side, side);
        } else if (unit.type === 'sniper') {
          ctx.beginPath();
          ctx.moveTo(cx, cy - radius);
          ctx.lineTo(cx + radius, cy);
          ctx.lineTo(cx, cy + radius);
          ctx.lineTo(cx - radius, cy);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (unit.type === 'partizan') {
          ctx.beginPath();
          ctx.moveTo(cx, cy - radius);
          ctx.lineTo(cx + radius, cy + radius);
          ctx.lineTo(cx - radius, cy + radius);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#e53935';
      ctx.fill();
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const barWidth = radius * 1.8;
    const barHeight = 5;
    const barX = cx - barWidth / 2;
    const barY = cy - radius - 5;
    const unitHp = unit.hp ?? getMaxHp(unit.type);
    const hpPercent = Math.max(0, Math.min(1, unitHp / getMaxHp(unit.type)));

    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    // Рисуем стрелку к цели для врагов, если она есть
    if (unit.targetX !== undefined && unit.targetY !== undefined) {
      drawTargetArrow(ctx, unit.x, unit.y, unit.targetX, unit.targetY, cellW, cellH, 'rgba(200, 100, 100, 0.4)');
    }
  });
}

export function drawProjectileLayer(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cellW: number,
  cellH: number,
  circularVisibilityMask: boolean[][]
): void {
  drawProjectiles(ctx, state.projectiles ?? [], cellW, cellH, circularVisibilityMask, Date.now());
}

const ECONOMY_UNIT_CONFIG: Record<string, { label: string; fill: string; stroke: string }> = {
  larva:     { label: 'Л', fill: '#86efac', stroke: '#22c55e' },
  geodezist: { label: 'Г', fill: '#fde68a', stroke: '#f59e0b' },
};

export function drawEconomyUnits(
  ctx: CanvasRenderingContext2D,
  units: EconomyUnit[],
  cellW: number,
  cellH: number
): void {
  if (!units || units.length === 0) return;

  units.forEach(unit => {
    if (unit.hp <= 0) return;

    const cx = unit.x * cellW + cellW / 2;
    const cy = unit.y * cellH + cellH / 2;
    const radius = Math.min(cellW, cellH) * 0.3;
    const size = radius * 2;

    const spriteNo = ECONOMY_SPRITE_NUM[unit.type];
    if (spriteNo !== undefined) {
      if (!drawEconomySprite(ctx, spriteNo, cx - size / 2, cy - size / 2, size, size)) {
        const cfg = ECONOMY_UNIT_CONFIG[unit.type];
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = cfg?.fill ?? '#a3e635';
        ctx.fill();
        ctx.strokeStyle = cfg?.stroke ?? '#65a30d';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (cfg) {
          ctx.fillStyle = '#1a1a1a';
          ctx.font = `bold ${Math.max(7, radius * 0.9)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cfg.label, cx, cy);
        }
      }
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#a3e635';
      ctx.fill();
      ctx.strokeStyle = '#65a30d';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });
}
