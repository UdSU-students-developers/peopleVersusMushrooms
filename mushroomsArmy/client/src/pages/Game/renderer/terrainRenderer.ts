import { MapTile, TerrainType } from '../types';
import {
  weightedGrassPool, bushImg,
  waterBaseImg, waterFlowersImg, waterLilies, edgeImages,
  mountainImg,
} from './assets';
import { coerceTerrainCell, drawFogOfWarCell, drawStaleFogCell, easeOutCubic, fogRevealAt, FOG_REVEAL_MS } from './fogOfWar';
import { isImageDrawable, tryDrawImageScaled } from './buildingRenderer';

export function getTerrainColor(type: MapTile | undefined): string {
  switch (type) {
    case 0: return '#2ecc71';
    case 1: return '#7fd3ff';
    case 2: return '#8b5a2b';
    case null:
    default: return '#2a3338';
  }
}

function getNeighbors(map: MapTile[][], x: number, y: number) {
  return {
    top: coerceTerrainCell(map[y - 1]?.[x]),
    bottom: coerceTerrainCell(map[y + 1]?.[x]),
    left: coerceTerrainCell(map[y]?.[x - 1]),
    right: coerceTerrainCell(map[y]?.[x + 1]),
  };
}

function drawGrass(ctx: CanvasRenderingContext2D, x: number, y: number, cellW: number, cellH: number): void {
  const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  const seed = Math.abs(hash - Math.floor(hash));
  const assetIndex = Math.floor(seed * weightedGrassPool.length);
  const activeImg = weightedGrassPool[assetIndex];

  if (isImageDrawable(activeImg)) {
    ctx.drawImage(activeImg, x * cellW, y * cellH, cellW, cellH);
  }

  if (isImageDrawable(bushImg)) {
    const bushSeed = Math.abs((x * 73856093) ^ (y * 19349663));
    if ((bushSeed % 100) < 3) {
      ctx.save();
      const offsetX = (bushSeed % 7) - 3;
      const offsetY = (bushSeed % 5) - 2;
      ctx.drawImage(bushImg, x * cellW + offsetX, y * cellH + offsetY, cellW, cellH);
      ctx.restore();
    }
  }
}

function drawWater(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellW: number,
  cellH: number,
  terrainSourceMap: MapTile[][]
): void {
  if (!isImageDrawable(waterBaseImg)) return;

  const seed = (x * 15485863 + y * 2038074743);
  const probability = Math.abs(seed % 100);
  const neighbors = getNeighbors(terrainSourceMap, x, y);
  let currentImg: HTMLImageElement;

  if (probability < 70) {
    currentImg = waterBaseImg;
  } else if (probability < 90) {
    currentImg = waterFlowersImg;
  } else {
    currentImg = waterLilies[Math.abs(seed % waterLilies.length)];
  }

  ctx.save();
  ctx.translate(x * cellW + cellW / 2, y * cellH + cellH / 2);
  ctx.drawImage(currentImg, -cellW / 2, -cellH / 2, cellW, cellH);

  if (neighbors.top === 0 && isImageDrawable(edgeImages.top))
    ctx.drawImage(edgeImages.top, -cellW / 2, -cellH / 2, cellW, cellH);
  if (neighbors.bottom === 0 && isImageDrawable(edgeImages.bottom))
    ctx.drawImage(edgeImages.bottom, -cellW / 2, -cellH / 2, cellW, cellH);
  if (neighbors.left === 0 && isImageDrawable(edgeImages.left))
    ctx.drawImage(edgeImages.left, -cellW / 2, -cellH / 2, cellW, cellH);
  if (neighbors.right === 0 && isImageDrawable(edgeImages.right))
    ctx.drawImage(edgeImages.right, -cellW / 2, -cellH / 2, cellW, cellH);

  if (neighbors.top === 0 && neighbors.left === 0 && isImageDrawable(edgeImages.topLeft))
    ctx.drawImage(edgeImages.topLeft, -cellW / 2, -cellH / 2, cellW, cellH);
  if (neighbors.top === 0 && neighbors.right === 0 && isImageDrawable(edgeImages.topRight))
    ctx.drawImage(edgeImages.topRight, -cellW / 2, -cellH / 2, cellW, cellH);
  if (neighbors.bottom === 0 && neighbors.left === 0 && isImageDrawable(edgeImages.bottomLeft))
    ctx.drawImage(edgeImages.bottomLeft, -cellW / 2, -cellH / 2, cellW, cellH);
  if (neighbors.bottom === 0 && neighbors.right === 0 && isImageDrawable(edgeImages.bottomRight))
    ctx.drawImage(edgeImages.bottomRight, -cellW / 2, -cellH / 2, cellW, cellH);

  const tTopLeft = coerceTerrainCell(terrainSourceMap[y - 1]?.[x - 1]);
  const tTopRight = coerceTerrainCell(terrainSourceMap[y - 1]?.[x + 1]);
  const tBottomLeft = coerceTerrainCell(terrainSourceMap[y + 1]?.[x - 1]);
  const tBottomRight = coerceTerrainCell(terrainSourceMap[y + 1]?.[x + 1]);

  if (neighbors.top !== 0 && neighbors.left !== 0 && tTopLeft === 0 && isImageDrawable(edgeImages.innerTopLeft))
    ctx.drawImage(edgeImages.innerTopLeft, -cellW / 2, -cellH / 2, cellW, cellH);
  if (neighbors.top !== 0 && neighbors.right !== 0 && tTopRight === 0 && isImageDrawable(edgeImages.innerTopRight))
    ctx.drawImage(edgeImages.innerTopRight, -cellW / 2, -cellH / 2, cellW, cellH);
  if (neighbors.bottom !== 0 && neighbors.left !== 0 && tBottomLeft === 0 && isImageDrawable(edgeImages.innerBottomLeft))
    ctx.drawImage(edgeImages.innerBottomLeft, -cellW / 2, -cellH / 2, cellW, cellH);
  if (neighbors.bottom !== 0 && neighbors.right !== 0 && tBottomRight === 0 && isImageDrawable(edgeImages.innerBottomRight))
    ctx.drawImage(edgeImages.innerBottomRight, -cellW / 2, -cellH / 2, cellW, cellH);

  ctx.restore();
}

function drawMountain(ctx: CanvasRenderingContext2D, x: number, y: number, cellW: number, cellH: number): void {
  if (!isImageDrawable(mountainImg)) return;
  const seed = (x * 73856093 ^ y * 19349663 + x * y);
  ctx.save();
  ctx.translate(x * cellW + cellW / 2, y * cellH + cellH / 2);
  const rotation = (Math.abs(seed % 4) * Math.PI) / 2;
  ctx.rotate(rotation);
  if ((seed >> 2) % 2 === 0) ctx.scale(-1, 1);
  ctx.drawImage(mountainImg, -cellW / 2, -cellH / 2, cellW, cellH);
  ctx.restore();
}

export function drawTerrainCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellW: number,
  cellH: number,
  terrain: MapTile,
  terrainSourceMap: MapTile[][],
  fogNow: number,
  currentlyVisible: boolean,
  wasExplored: boolean
): void {
  if (terrain === 0) {
    drawGrass(ctx, x, y, cellW, cellH);
  } else if (terrain === 1) {
    drawWater(ctx, x, y, cellW, cellH, terrainSourceMap);
  } else if (terrain === 2) {
    drawMountain(ctx, x, y, cellW, cellH);
  } else if (terrain === null) {
    drawFogOfWarCell(ctx, x, y, cellW, cellH, fogNow, 1);
  } else {
    ctx.fillStyle = getTerrainColor(terrain);
    ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
  }

  if (!currentlyVisible && wasExplored && terrain !== null) {
    drawStaleFogCell(ctx, x, y, cellW, cellH);
  }

  if (currentlyVisible && terrain !== null) {
    const key = `${x},${y}`;
    const started = fogRevealAt.get(key);
    if (started !== undefined) {
      const elapsed = fogNow - started;
      if (elapsed >= FOG_REVEAL_MS) {
        fogRevealAt.delete(key);
      } else {
        const fadeAlpha = 1 - easeOutCubic(elapsed / FOG_REVEAL_MS);
        drawFogOfWarCell(ctx, x, y, cellW, cellH, fogNow, fadeAlpha);
      }
    }
  }
}
export function drawGridFogAware(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellW: number,
  cellH: number,
  rows: number,
  cols: number,
  map: MapTile[][]
): void {
  ctx.beginPath();
  ctx.strokeStyle = '#1518143c';
  ctx.lineWidth = 0.5;

  for (let x = 1; x < cols; x++) {
    const px = x * cellW;
    for (let y = 0; y < rows; y++) {
      const left = coerceTerrainCell(map[y]?.[x - 1]);
      const right = coerceTerrainCell(map[y]?.[x]);
      if (left === null && right === null) continue;
      ctx.moveTo(px, y * cellH);
      ctx.lineTo(px, (y + 1) * cellH);
    }
  }

  for (let y = 1; y < rows; y++) {
    const py = y * cellH;
    for (let x = 0; x < cols; x++) {
      const up = coerceTerrainCell(map[y - 1]?.[x]);
      const down = coerceTerrainCell(map[y]?.[x]);
      if (up === null && down === null) continue;
      ctx.moveTo(x * cellW, py);
      ctx.lineTo((x + 1) * cellW, py);
    }
  }

  ctx.moveTo(0, 0); ctx.lineTo(width, 0);
  ctx.moveTo(0, height); ctx.lineTo(width, height);
  ctx.moveTo(0, 0); ctx.lineTo(0, height);
  ctx.moveTo(width, 0); ctx.lineTo(width, height);
  ctx.stroke();
}

