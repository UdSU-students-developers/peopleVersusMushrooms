import { GameState, MapTile, TerrainType, Unit } from '../types';
import { fogWarImages, FOG_WAR_TEXTURE_SRCS } from './assets';
import { tryDrawImageScaled } from './buildingRenderer';

export const FOG_REVEAL_MS = 640;

let fogPrevMap: MapTile[][] | null = null;
export const fogRevealAt = new Map<string, number>();
export let exploredTerrainMap: MapTile[][] | null = null;
export let exploredMask: boolean[][] | null = null;

const ALLY_UNIT_VISION_RADIUS = 4;
const ALLY_BUILDING_VISION_RADIUS = 5;

export function createGrid<T>(rows: number, cols: number, valueFactory: () => T): T[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, valueFactory));
}

function ensureExplorationMaps(rows: number, cols: number): void {
  const shapeChanged =
    !exploredTerrainMap ||
    exploredTerrainMap.length !== rows ||
    (exploredTerrainMap[0]?.length ?? 0) !== cols ||
    !exploredMask ||
    exploredMask.length !== rows ||
    (exploredMask[0]?.length ?? 0) !== cols;
  if (!shapeChanged) return;
  exploredTerrainMap = createGrid<MapTile>(rows, cols, () => null);
  exploredMask = createGrid<boolean>(rows, cols, () => false);
}

export function syncExplorationMemory(map: MapTile[][]): void {
  const rows = map.length;
  const cols = map[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return;
  ensureExplorationMaps(rows, cols);
  if (!exploredTerrainMap || !exploredMask) return;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const terrain = coerceTerrainCell(map[y]?.[x]);
      if (terrain !== null) {
        exploredMask[y][x] = true;
        exploredTerrainMap[y][x] = terrain;
      }
    }
  }
}

function isFriendlyUnit(unit: Unit): boolean {
  return unit.type === 'sporomet' || unit.type === 'champigneb' || unit.type === 'eblekar' || unit.type === 'pizdoglyad';
}

function isFriendlyBuildingType(type: string): boolean {
  return type === 'vzryvomor' || type === 'sporovaya_bashnya';
}

function stampCircle(mask: boolean[][], cx: number, cy: number, radius: number): void {
  const rows = mask.length;
  const cols = mask[0]?.length ?? 0;
  const rr = radius * radius;
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(rows - 1, Math.ceil(cy + radius));
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(cols - 1, Math.ceil(cx + radius));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= rr) mask[y][x] = true;
    }
  }
}

export function buildCircularVisibilityMask(state: GameState, rows: number, cols: number): boolean[][] {
  const mask = createGrid<boolean>(rows, cols, () => false);
  state.units.forEach(unit => {
    if (unit.hp <= 0 || !isFriendlyUnit(unit)) return;
    const radius = Math.max(0, unit.visibility ?? ALLY_UNIT_VISION_RADIUS);
    stampCircle(mask, unit.x, unit.y, radius);
  });
  (state.buildings ?? []).forEach(building => {
    if (building.hp <= 0 || !isFriendlyBuildingType(building.type)) return;
    const sx = building.sizeX ?? 1;
    const sy = building.sizeY ?? 1;
    const centerX = building.x + (sx - 1) * 0.5;
    const centerY = building.y + (sy - 1) * 0.5;
    const radius = Math.max(0, building.visibility ?? ALLY_BUILDING_VISION_RADIUS);
    stampCircle(mask, centerX, centerY, radius);
  });
  return mask;
}

export function easeOutCubic(t: number): number {
  const u = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - u, 3);
}

export function coerceTerrainCell(raw: unknown): MapTile {
  if (raw === null || raw === undefined) return null;
  if (raw === 0 || raw === 1 || raw === 2) return raw;
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    if (s === '' || s === 'null') return null;
    const n = parseInt(s, 10);
    if (n === 0 || n === 1 || n === 2) return n as TerrainType;
    return null;
  }
  if (typeof raw === 'number' && !Number.isNaN(raw)) {
    if (raw === 0 || raw === 1 || raw === 2) return raw;
    return null;
  }
  return null;
}

function getFogWarVariant(x: number, y: number): { imgIndex: number; rotation: number; flip: boolean } {
  const seed = (x * 15485863 + y * 2038074743) ^ 0x9e3779b9;
  return {
    imgIndex: Math.abs(seed) % fogWarImages.length,
    rotation: (Math.abs(seed >> 3) % 4) * (Math.PI / 2),
    flip: (seed >> 5) % 2 === 0,
  };
}

export function drawFogOfWarCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellW: number,
  cellH: number,
  nowMs: number,
  alpha: number
): void {
  const px0 = x * cellW;
  const py0 = y * cellH;
  const px = Math.floor(px0);
  const py = Math.floor(py0);
  const cw = Math.ceil(px0 + cellW) - px + 1;
  const ch = Math.ceil(py0 + cellH) - py + 1;
  const { imgIndex, rotation, flip } = getFogWarVariant(x, y);
  const fogImg: HTMLImageElement | undefined = fogWarImages[imgIndex];
  const breathe = 0.9 + 0.1 * Math.sin(nowMs * 0.0015 + x * 0.47 + y * 0.39);
  const a = Math.max(0, Math.min(1, alpha * breathe));

  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = `rgba(16, 20, 26, ${a * 0.45})`;
  ctx.fillRect(px, py, cw, ch);
  const cx = px + cw / 2;
  const cy = py + ch / 2;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  if (flip) ctx.scale(-1, 1);

  let drawn = false;
  if (fogImg !== undefined) {
    if (fogImg.complete && fogImg.naturalWidth > 0) {
      drawn = tryDrawImageScaled(ctx, fogImg, -cw / 2, -ch / 2, cw, ch);
    } else if (fogImg.src) {
      try {
        ctx.drawImage(fogImg, -cw / 2, -ch / 2, cw, ch);
        drawn = fogImg.naturalWidth > 0 && fogImg.naturalHeight > 0;
      } catch {
        drawn = false;
      }
    }
  }
  if (!drawn) {
    ctx.fillStyle = `rgba(32, 38, 46, ${a * 0.85})`;
    ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
  }
  ctx.restore();
}

export function drawStaleFogCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellW: number,
  cellH: number
): void {
  const px0 = x * cellW;
  const py0 = y * cellH;
  const px = Math.floor(px0);
  const py = Math.floor(py0);
  const cw = Math.ceil(px0 + cellW) - px + 1;
  const ch = Math.ceil(py0 + cellH) - py + 1;
  ctx.save();
  ctx.fillStyle = 'rgba(24, 28, 35, 0.42)';
  ctx.fillRect(px, py, cw, ch);
  ctx.fillStyle = 'rgba(100, 106, 116, 0.14)';
  ctx.fillRect(px, py, cw, ch);
  ctx.restore();
}

export function syncFogRevealTracking(map: MapTile[][]): void {
  const rows = map.length;
  const cols = map[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return;

  if (!fogPrevMap || fogPrevMap.length !== rows || (fogPrevMap[0]?.length ?? 0) !== cols) {
    fogPrevMap = map.map(row => row.map(cell => coerceTerrainCell(cell)));
    fogRevealAt.clear();
    return;
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const prevT = fogPrevMap[y][x];
      const currT = coerceTerrainCell(map[y][x]);
      if (prevT === null && currT !== null) {
        fogRevealAt.set(`${x},${y}`, performance.now());
      }
    }
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      fogPrevMap[y][x] = coerceTerrainCell(map[y][x]);
    }
  }
}

export function preloadFogWarTextures(): Promise<void> {
  return Promise.all(
    fogWarImages.map(
      img =>
        new Promise<void>(resolve => {
          const finish = () => {
            if (typeof img.decode === 'function') {
              img.decode().then(() => resolve()).catch(() => resolve());
            } else {
              resolve();
            }
          };
          if (img.complete && img.naturalWidth > 0) {
            finish();
            return;
          }
          img.addEventListener('load', finish, { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        })
    )
  ).then(() => undefined);
}

