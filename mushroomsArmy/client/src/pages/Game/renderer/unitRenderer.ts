import { Unit, Projectile } from '../types';
import {
  UNIT_SRCS,
  PIZDOGLYAD_SRCS,
  champignebExplImages,
  VZRYVOMOR_FRAME_SRCS,
  SPOROVAYA_BASHNYA_SRCS,
  economySpritesImg,
} from './assets';
import { isImageDrawable, tryDrawImageScaled, getBuildingImage } from './buildingRenderer';
import {
  getVzryvomorFrameKey,
  stepVzryvomorAnimation,
  VZRYVOMOR_FRAME_MS,
} from './vzryvomorAnimation';
import { GameState } from '../types';

const MAX_HP: Record<string, number> = {
  sporomet: 8,
  champigneb: 35,
  eblekar: 40,
  vzryvomor: 70,
  sporovaya_bashnya: 160,
  pizdoglyad: 2,
  larva: 1,
};

const ECONOMY_BUILDING_CONFIG: Record<string, { label: string; color: string; spriteNo?: number }> = {
  mycelium: { label: 'Г', color: '#ec4899', spriteNo: 4 },
  incubator: { label: 'И', color: '#a855f7', spriteNo: 11 },

  small_reactor: { label: 'Р', color: '#06b6d4', spriteNo: 8 },
  small_bioreactor: { label: 'Р', color: '#06b6d4', spriteNo: 8 },

  big_bioreactor: { label: 'БР', color: '#3b82f6' },
  fat_barrel: { label: 'Б', color: '#f97316' },
  iron_barrel: { label: 'Ж', color: '#6b7280' },
  mine: { label: 'Ш', color: '#eab308' },
};

const ECONOMY_SPRITE_SIZE = 32;
const ECONOMY_SPRITES_IN_ROW = 32;

export const getMaxHp = (type: string): number => MAX_HP[type] ?? 100;

function getEconomySpriteFrame(spriteNo: number): { sx: number; sy: number; size: number } {
  const index = spriteNo - 1;

  return {
    sx: (index % ECONOMY_SPRITES_IN_ROW) * ECONOMY_SPRITE_SIZE,
    sy: Math.floor(index / ECONOMY_SPRITES_IN_ROW) * ECONOMY_SPRITE_SIZE,
    size: ECONOMY_SPRITE_SIZE,
  };
}

function getEconomySpriteNo(building: { type: string }): number | undefined {
  if (building.type === 'mycelium') {
    const level = Math.max(1, Math.min(3, Number((building as any).level ?? 1)));

    if (level === 1) return 4;
    if (level === 2) return 5;
    return 6;
  }

  return ECONOMY_BUILDING_CONFIG[building.type]?.spriteNo;
}

function drawFallbackEconomyBuilding(
  ctx: CanvasRenderingContext2D,
  label: string,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  cellW: number
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = '#4c1d95';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.max(8, cellW * 0.32)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, centerX, centerY);
}

function drawEconomyUnit(
  ctx: CanvasRenderingContext2D,
  unit: Unit,
  cellW: number,
  cellH: number
): void {
  const spriteNo = unit.type === 'larva' ? 10 : undefined;

  if (spriteNo === undefined || !isImageDrawable(economySpritesImg)) {
    const cx = unit.x * cellW + cellW / 2;
    const cy = unit.y * cellH + cellH / 2;

    ctx.beginPath();
    ctx.ellipse(cx, cy, cellW * 0.35, cellH * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#9ca3af';
    ctx.fill();

    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1;
    ctx.stroke();

    return;
  }

  const { sx, sy, size } = getEconomySpriteFrame(spriteNo);

  ctx.drawImage(
    economySpritesImg,
    sx,
    sy,
    size,
    size,
    unit.x * cellW,
    unit.y * cellH,
    cellW,
    cellH
  );
}

const pizdoglyadImages: { idle: HTMLImageElement; walk: HTMLImageElement } = {
  idle: Object.assign(new Image(), { src: PIZDOGLYAD_SRCS.idle }),
  walk: Object.assign(new Image(), { src: PIZDOGLYAD_SRCS.walk }),
};

const prevUnitPositions = new Map<string, { x: number; y: number }>();

const unitImages: Record<string, HTMLImageElement> = {};

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

const activeProjectiles = new Map<string, Projectile & { duration: number }>();

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

const VZRYVOMOR_FRAME_COUNT = VZRYVOMOR_FRAME_SRCS.length;
const buildingAnimState: Record<string, { frame: number; lastFrameTime: number }> = {};

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

function preloadBuildingImages(): void {
  VZRYVOMOR_FRAME_SRCS.forEach((src, i) => {
    getBuildingImage(getVzryvomorFrameKey(i), src);
  });

  getBuildingImage('sporovaya_bashnya:idle', SPOROVAYA_BASHNYA_SRCS.idle);
  getBuildingImage('sporovaya_bashnya:attack', SPOROVAYA_BASHNYA_SRCS.attack);
  getBuildingImage('sporovaya_bashnya:destroyed', SPOROVAYA_BASHNYA_SRCS.destroyed);
}

preloadBuildingImages();

export function drawBuildings(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cellW: number,
  cellH: number,
  circularVisibilityMask: boolean[][]
): void {
  const activeVzryvomorGuids = new Set(
    (state.buildings ?? [])
      .filter(b => b.type === 'vzryvomor' && b.hp > 0)
      .map(b => b.guid)
  );

  (state.buildings ?? []).forEach(building => {
    if (building.hp <= 0) return;

    const sx = building.sizeX ?? 1;
    const sy = building.sizeY ?? 1;

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

    const economyBuilding = ECONOMY_BUILDING_CONFIG[building.type];
    const isFriendly =
      building.type === 'vzryvomor' ||
      building.type === 'sporovaya_bashnya' ||
      economyBuilding !== undefined;

    if (!buildingVisibleNow && !isFriendly) return;

    const bx = building.x * cellW;
    const by = building.y * cellH;
    const hpPercent = Math.max(0, Math.min(1, building.hp / getMaxHp(building.type)));

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
      const bsx = building.sizeX ?? 2;
      const bsy = building.sizeY ?? 2;

      const px = bx;
      const py = by;
      const pw = bsx * cellW;
      const ph = bsy * cellH;

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
        ctx.fillText('СБ', px + pw / 2, py + ph / 2);
      }

      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(px, py - 6, pw, 4);

      ctx.fillStyle = '#4caf50';
      ctx.fillRect(px, py - 6, pw * hpPercent, 4);

      return;
    }

    if (economyBuilding) {
      const bsx = building.sizeX ?? 1;
      const bsy = building.sizeY ?? 1;

      const px = bx;
      const py = by;
      const pw = bsx * cellW;
      const ph = bsy * cellH;

      const spriteNo = getEconomySpriteNo(building);
      const canDrawSprite = spriteNo !== undefined && isImageDrawable(economySpritesImg);

      if (canDrawSprite) {
        const { sx, sy, size } = getEconomySpriteFrame(spriteNo);
        ctx.drawImage(economySpritesImg, sx, sy, size, size, px, py, pw, ph);
      } else {
        drawFallbackEconomyBuilding(
          ctx,
          economyBuilding.label,
          economyBuilding.color,
          px,
          py,
          pw,
          ph,
          px + pw / 2,
          py + ph / 2,
          cellW
        );
      }

      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(px, py - 6, pw, 4);

      ctx.fillStyle = '#4caf50';
      ctx.fillRect(px, py - 6, pw * hpPercent, 4);

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

    const label = building.type === 'house'
      ? 'Д'
      : building.type === 'barracks'
        ? 'Б'
        : 'Т';

    ctx.fillText(label, bx + cellW / 2, by + cellH / 2);

    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(bOffX, bOffY - 6, bw, 4);

    ctx.fillStyle = '#4caf50';
    ctx.fillRect(bOffX, bOffY - 6, bw * hpPercent, 4);
  });

  for (const guid of Object.keys(buildingAnimState)) {
    if (!activeVzryvomorGuids.has(guid)) {
      delete buildingAnimState[guid];
    }
  }
}

export function drawUnits(
  ctx: CanvasRenderingContext2D,
  units: Unit[],
  cellW: number,
  cellH: number,
  circularVisibilityMask: boolean[][],
  economyUnits: Unit[] = []
): void {
  const now = Date.now();

  updateChampignebExplosions(units, now);
  drawChampignebExplosions(ctx, cellW, cellH, now);

  economyUnits.forEach(unit => {
    if (unit.hp <= 0) return;

    const ux = Math.floor(unit.x);
    const uy = Math.floor(unit.y);

    if (circularVisibilityMask[uy]?.[ux] !== true) return;

    if (unit.type === 'larva') {
      drawEconomyUnit(ctx, unit, cellW, cellH);
    }
  });

  units.forEach(unit => {
    if (unit.hp <= 0) return;

    const ux = Math.floor(unit.x);
    const uy = Math.floor(unit.y);

    const isFriendly =
      unit.type === 'sporomet' ||
      unit.type === 'champigneb' ||
      unit.type === 'eblekar' ||
      unit.type === 'pizdoglyad';

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

      ctx.fillStyle = unit.type === 'sporomet'
        ? '#4caf50'
        : unit.type === 'eblekar'
          ? '#e040fb'
          : '#ff9800';

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