import { GameState, TCamera } from '../types';
import { camera, MIN_SCALE, MAX_SCALE } from '../../../utils/camera';
import {
  syncFogRevealTracking,
  syncExplorationMemory,
  buildCircularVisibilityMask,
  exploredTerrainMap,
  exploredMask,
  preloadFogWarTextures,
} from './fogOfWar';
import { coerceTerrainCell } from './fogOfWar';
import { drawTerrainCell, drawGridFogAware } from './terrainRenderer';
import { drawBuildings, drawUnits, drawEnemyUnits, drawProjectileLayer } from './unitRenderer';

interface IInitializableCanvas extends HTMLCanvasElement {
    __cameraInitialized?: boolean;
}

export { preloadFogWarTextures };

export function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState | null,
  widthCSS: number,
  heightCSS: number,
  camera: TCamera
) {
  const canvas = ctx.canvas;

  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== rect.width || canvas.height !== rect.height) {
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!(canvas as IInitializableCanvas).__cameraInitialized) {
    initCameraListeners(canvas);
    (canvas as IInitializableCanvas).__cameraInitialized = true;
  }

  if (!state) return;

  const rows = state.map.length;
  const cols = state.map[0]?.length ?? 0;

  const fogNow = performance.now();
  syncFogRevealTracking(state.map);
  syncExplorationMemory(state.map);
  const circularVisibilityMask = buildCircularVisibilityMask(state, rows, cols);

  const cellW = (canvas.width / cols) * camera.scale;
  const cellH = cellW;
  const mapFullWidth = cols * cellW;
  const mapFullHeight = rows * cellH;
  const EPSILON = 0.1;

  if (mapFullWidth > canvas.width + EPSILON) {
    camera.offsetX = Math.min(0, Math.max(camera.offsetX, canvas.width - mapFullWidth));
  } else {
    camera.offsetX = (canvas.width - mapFullWidth) / 2;
  }

  if (mapFullHeight > canvas.height + EPSILON) {
    camera.offsetY = Math.min(0, Math.max(camera.offsetY, canvas.height - mapFullHeight));
  } else {
    camera.offsetY = (canvas.height - mapFullHeight) / 2;
  }

  ctx.fillStyle = '#45a049';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(camera.offsetX, camera.offsetY);

  // Рельеф
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const serverTerrain = coerceTerrainCell(state.map[y]?.[x]);
      const rememberedTerrain = exploredTerrainMap?.[y]?.[x] ?? null;
      const wasExplored = exploredMask?.[y]?.[x] === true && rememberedTerrain !== null;
      const currentlyVisible = circularVisibilityMask[y]?.[x] === true && serverTerrain !== null;
      const terrain = currentlyVisible ? serverTerrain : wasExplored ? rememberedTerrain : null;
      const terrainSourceMap = currentlyVisible ? state.map : (exploredTerrainMap ?? state.map);

      drawTerrainCell(ctx, x, y, cellW, cellH, terrain, terrainSourceMap, fogNow, currentlyVisible, wasExplored);
    }
  }

  drawGridFogAware(ctx, cols * cellW, rows * cellH, cellW, cellH, rows, cols, state.map);

  drawBuildings(ctx, state, cellW, cellH, circularVisibilityMask);
  drawProjectileLayer(ctx, state, cellW, cellH, circularVisibilityMask);
  drawEnemyUnits(ctx, state.enemyUnits ?? [], cellW, cellH, circularVisibilityMask);
  drawUnits(ctx, state.units, cellW, cellH, circularVisibilityMask);

  ctx.restore();
}

function initCameraListeners(canvas: HTMLCanvasElement) {
  window.addEventListener('wheel', (e: WheelEvent) => {
    const rect = canvas.getBoundingClientRect();
    const isOverCanvas =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!isOverCanvas) return;

    e.preventDefault();

    const oldScale = camera.scale;
    const zoomDelta = -e.deltaY * 0.005;
    camera.scale = Math.min(Math.max(camera.scale + zoomDelta, MIN_SCALE), MAX_SCALE);

    if (oldScale !== camera.scale) {
      const scaleFactor = canvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleFactor;
      const mouseY = (e.clientY - rect.top) * scaleFactor;
      camera.offsetX -= (mouseX - camera.offsetX) * (camera.scale / oldScale - 1);
      camera.offsetY -= (mouseY - camera.offsetY) * (camera.scale / oldScale - 1);
    }
  }, { passive: false, capture: true });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      camera.isDragging = true;
      camera.lastMouseX = e.clientX;
      camera.lastMouseY = e.clientY;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!camera.isDragging) return;
    camera.offsetX += e.clientX - camera.lastMouseX;
    camera.offsetY += e.clientY - camera.lastMouseY;
    camera.lastMouseX = e.clientX;
    camera.lastMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => camera.isDragging = false);
}

