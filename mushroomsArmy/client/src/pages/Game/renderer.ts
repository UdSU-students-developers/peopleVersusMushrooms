import { GameState, TCamera, MapTile, Projectile, TerrainType, Unit } from './types';
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
import champignebExplFrame0 from '../../assets/units/champigneb_explosion/frame_0.png';
import champignebExplFrame1 from '../../assets/units/champigneb_explosion/frame_1.png';
import champignebExplFrame2 from '../../assets/units/champigneb_explosion/frame_2.png';
import champignebExplFrame3 from '../../assets/units/champigneb_explosion/frame_3.png';
import champignebExplFrame4 from '../../assets/units/champigneb_explosion/frame_4.png';
import { camera, MIN_SCALE, MAX_SCALE } from '../../utils/camera';

//ассеты травы
import grassTextureSrc1 from '../../assets/map/grass/grass1.webp';
import grassTextureSrc2 from '../../assets/map/grass/grass2.webp';
import grassTextureSrc3 from '../../assets/map/grass/grass3.webp';
import grassWithFrlowersTextureSrc from '../../assets/map/grass/grass_with_flowers.webp';
import grassWithFlowersTextureSrc2 from '../../assets/map/grass/grass_with_flowers2.webp';
import grass1TextureSrc22 from '../../assets/map/grass/grass_with_flowers22.webp';
import grassWithOneFlowerTextureSrc from '../../assets/map/grass/grass_with_one_flower.webp';

//ассеты водички
import waterTextureSrc from '../../assets/map/water/water.webp';
import waterFlowersSrc from '../../assets/map/water/water_with_flowers.webp';
import lilyWhiteSrc from '../../assets/map/water/water_lily_with_white_flowers.webp';
import lilyYellowSrc from '../../assets/map/water/water_lily_with_yellow_flowers.webp';
import lilyBaseSrc from '../../assets/map/water/water_lily.webp'; 

//ассеты гор
import mountainsTextureSrc from '../../assets/map/mountains/mountains.webp';
import tumanSrc from '../../assets/map/fog/tuman.png';
import tuman2Src from '../../assets/map/fog/tuman2.png';
import tuman3Src from '../../assets/map/fog/tuman3.png';

//трава
const grass1Img: HTMLImageElement = new Image();
grass1Img.src = grassTextureSrc1;
const grass2Img: HTMLImageElement = new Image();
grass2Img.src = grassTextureSrc2;
const grass3Img: HTMLImageElement = new Image();
grass3Img.src = grassTextureSrc3;
const flower1Img: HTMLImageElement = new Image();
flower1Img.src = grassWithFrlowersTextureSrc;
const flower2Img: HTMLImageElement = new Image();
flower2Img.src = grassWithFlowersTextureSrc2;
const flower3Img: HTMLImageElement = new Image();
flower3Img.src = grass1TextureSrc22;
const flower4Img: HTMLImageElement = new Image();
flower4Img.src = grassWithOneFlowerTextureSrc;

const weightedPool: HTMLImageElement[] = [
  ...Array(15).fill(grass1Img),

  ...Array(15).fill(grass2Img), 
  ...Array(4).fill(grass3Img),

  ...Array(1).fill(flower1Img),
  ...Array(1).fill(flower2Img),
  ...Array(1).fill(flower3Img),
  ...Array(1).fill(flower4Img),
];

const waterBaseImg = new Image();
waterBaseImg.src = waterTextureSrc;
const waterFlowersImg = new Image();
waterFlowersImg.src = waterFlowersSrc;
const lilyWhiteImg = new Image();
lilyWhiteImg.src = lilyWhiteSrc;
const lilyYellowImg = new Image();
lilyYellowImg.src = lilyYellowSrc;
const lilyBaseImg = new Image();
lilyBaseImg.src = lilyBaseSrc;
const waterLilies = [lilyWhiteImg, lilyYellowImg, lilyBaseImg];

const mountainImg = new Image();
mountainImg.src = mountainsTextureSrc;

/** Туман войны: несколько текстур, детерминированный выбор по координатам ячейки */
const FOG_WAR_TEXTURE_SRCS = [tumanSrc, tuman2Src, tuman3Src] as const;
const fogWarImages: HTMLImageElement[] = FOG_WAR_TEXTURE_SRCS.map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

/** Длительность растворения тумана при открытии клетки (мс) */
const FOG_REVEAL_MS = 640;

let fogPrevMap: MapTile[][] | null = null;
/** key "x,y" → performance.now() в момент открытия клетки */
const fogRevealAt = new Map<string, number>();

function easeOutCubic(t: number): number {
  const u = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - u, 3);
}

/**
 * Приводит значение тайла с сервера/JSON к MapTile.
 * Туман часто приходит как null; иногда как строка "null" или лишние числа — иначе рисовалась серая заливка.
 */
function coerceTerrainCell(raw: unknown): MapTile {
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

/**
 * Отрисовка тумана войны по текстурам из assets/tuman (alpha 0…1).
 * Для alpha < 1 — плавное «растворение» поверх уже нарисованного рельефа.
 */
function drawFogOfWarCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellW: number,
  cellH: number,
  nowMs: number,
  alpha: number
): void {
  // Целочисленные границы + лёгкое перекрытие соседей — без субпиксельных «щелей»
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

function syncFogRevealTracking(map: MapTile[][]): void {
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

/** Предзагрузка текстур тумана (вызывать при монтировании игры). */
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

const CHAMPIGNEB_EXPL_DURATION = 1000; // 1 секунда
const CHAMPIGNEB_EXPLOSION_FRAME_COUNT = 5;

const unitImages: Record<string, HTMLImageElement> = {};
const activeProjectiles = new Map<string, Projectile & { duration: number }>();

// ── Анимации взрывов шампиньебов ─────────────────────────────────────────────
const CHAMPIGNEB_EXPL_FRAME_SRCS: string[] = [
  champignebExplFrame0,
  champignebExplFrame1,
  champignebExplFrame2,
  champignebExplFrame3,
  champignebExplFrame4,
];
const champignebExplImages: HTMLImageElement[] = CHAMPIGNEB_EXPL_FRAME_SRCS.map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

/** guid → {x, y, startTime} — активные взрывы шампиньебов */
const champignebExplosions = new Map<string, { x: number; y: number; startTime: number }>();
/** guid → последнее hp, чтобы поймать момент смерти */
const prevChampignebHp = new Map<string, number>();

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

export function drawGame(ctx: CanvasRenderingContext2D,
  state: GameState | null,
  widthCSS: number,
  heightCSS: number,
  camera: TCamera
) {
  const canvas = ctx.canvas;

  // Синхронизируем внутренний размер канваса с его реальным размером на экране
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== rect.width || canvas.height !== rect.height) {
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Инициализация один раз
  if (!(canvas as any).__cameraInitialized) {
    initCameraListeners(canvas);
    (canvas as any).__cameraInitialized = true;
  }

  if (!state) return;

  const rows = state.map.length;
  const cols = state.map[0]?.length ?? 0;

  const fogNow = performance.now();
  syncFogRevealTracking(state.map);

  const cellW = (canvas.width / cols) * camera.scale;
  const cellH = cellW;

  // 2. Считаем полный размер карты
  const mapFullWidth = cols * cellW;
  const mapFullHeight = rows * cellH;

  const EPSILON = 0.1;

  // --- ЕДИНЫЙ БЛОК УПРАВЛЕНИЯ КАМЕРОЙ ---
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

  // 3. ПЕРЕД ВСЕМ рисуем бесконечный фон (траву)
  ctx.fillStyle = '#45a049'; // Тот же зеленый, что на карте
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(camera.offsetX, camera.offsetY);

  // --- НАЧАЛО ОТРИСОВКИ ОБЪЕКТОВ ---

  // 1. Отрисовка карты (ландшафт)[cite: 1]
  //[cite: 1] - Внутри цикла y/x
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const terrain = coerceTerrainCell(state.map[y]?.[x]);

    // Отрисовка ландшафта: Равнина (terrain === 0)
    // Внутри цикла отрисовки по x и y
    if (terrain === 0) {
      // Агрессивный хэш для устранения линейных паттернов
      // Числа 12.9898 и 78.233 — классические константы для генерации шума
      const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const seed = Math.abs(hash - Math.floor(hash)); 
      
      // Выбираем индекс из подготовленного пула
      const assetIndex = Math.floor(seed * weightedPool.length);
      const activeImg = weightedPool[assetIndex];

      if (isImageDrawable(activeImg)) {
        ctx.save();
        
        // Отрисовка без вращения, строго по сетке
        ctx.translate(x * cellW, y * cellH);
        ctx.drawImage(activeImg, 0, 0, cellW, cellH);
        
        ctx.restore();
      }
    }
      //вода
      else if (terrain === 1 && isImageDrawable(waterBaseImg)) {
      // Отрисовка воды
      const seed = (x * 15485863 + y * 2038074743);
      const probability = Math.abs(seed % 100);
      
      let currentImg: HTMLImageElement;

      // Распределение по весам
      if (probability < 70) {
          currentImg = waterBaseImg; // 70% обычная вода
      } else if (probability < 90) {
          currentImg = waterFlowersImg; // 20% вода с цветочками
      } else {
          // 10% кувшинки (выбираем одну из массива)
          currentImg = waterLilies[Math.abs(seed % waterLilies.length)];
      }

      ctx.save();
      //перемещение в центр ячейки[cite: 1]
      ctx.translate(x * cellW + cellW / 2, y * cellH + cellH / 2);
            
      ctx.drawImage(currentImg, -cellW / 2, -cellH / 2, cellW, cellH);
      ctx.restore();
      }
      //горы
       else if (terrain === 2 && isImageDrawable(mountainImg)) {
        // Используем уникальные множители для гор, чтобы разнообразить паттерн
        const seed = (x * 73856093 ^ y * 19349663 + x * y);
        
        ctx.save();
        ctx.translate(x * cellW + cellW / 2, y * cellH + cellH / 2);
        
        // Вращение на 0, 90, 180 или 270 градусов
        const rotation = (Math.abs(seed % 4) * Math.PI) / 2;
        ctx.rotate(rotation);
        
        // Добавляем случайное отражение по горизонтали
        if ((seed >> 2) % 2 === 0) {
            ctx.scale(-1, 1);
        }
        
        // Рисуем гору
        ctx.drawImage(mountainImg, -cellW / 2, -cellH / 2, cellW, cellH);
        ctx.restore();
      }
      else if (terrain === null) {
        drawFogOfWarCell(ctx, x, y, cellW, cellH, fogNow, 1);
      } else {
        ctx.fillStyle = getTerrainColor(terrain);
        ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
      }

      if (terrain !== null) {
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
}

  // 1.5. Сетка (без линий между двумя клетками тумана — иначе «просветы» по шву)
  drawGridFogAware(ctx, cols * cellW, rows * cellH, cellW, cellH, rows, cols, state.map);

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

  // 4a. Ловим смерть шампиньебов и запускаем взрыв на 1 секунду
  const now2 = Date.now();
  state.units.forEach(unit => {
    if (unit.type !== 'champigneb') return;
    const prevHp = prevChampignebHp.get(unit.guid) ?? unit.hp;
    if (unit.hp <= 0 && prevHp > 0 && !champignebExplosions.has(unit.guid)) {
      champignebExplosions.set(unit.guid, { x: unit.x, y: unit.y, startTime: now2 });
    }
    prevChampignebHp.set(unit.guid, unit.hp);
  });

  // 4b. Рисуем активные взрывы
  for (const [guid, entry] of champignebExplosions.entries()) {
    const elapsed = now2 - entry.startTime;
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

  ctx.restore(); // Возвращаем контекст в норму

}

/**
 * Вспомогательная функция для отрисовки полосок HP[cite: 1]
 */
function drawHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, percent: number) {
  ctx.fillStyle = '#d32f2f';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(x, y, w * percent, h);
}

// 4. ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ СОБЫТИЙ

function initCameraListeners(canvas: HTMLCanvasElement) {
  // Ловим событие на уровне окна, чтобы никакие слои не мешали
  window.addEventListener('wheel', (e: WheelEvent) => {
    const rect = canvas.getBoundingClientRect();

    // Проверяем, находится ли мышь над канвасом
    const isOverCanvas =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!isOverCanvas) return;

    // Блокируем стандартный скролл страницы
    e.preventDefault();

    const oldScale = camera.scale;
    // Чувствительность зума
    const zoomDelta = -e.deltaY * 0.005;
    camera.scale = Math.min(Math.max(camera.scale + zoomDelta, MIN_SCALE), MAX_SCALE);

    if (oldScale !== camera.scale) {
      // Учитываем разницу между размером в CSS и внутренним разрешением (1125 vs 900)
      const scaleFactor = canvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleFactor;
      const mouseY = (e.clientY - rect.top) * scaleFactor;

      // Формула зума в точку курсора
      camera.offsetX -= (mouseX - camera.offsetX) * (camera.scale / oldScale - 1);
      camera.offsetY -= (mouseY - camera.offsetY) * (camera.scale / oldScale - 1);

      console.log("Масштаб:", camera.scale.toFixed(2));
    }
  }, { passive: false, capture: true }); // capture: true — критически важно!

  // Аналогично для перемещения (drag-n-drop)
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

function getTerrainColor(type: MapTile | undefined): string {
  switch (type) {
    case 0:
      return '#2ecc71'; // равнина - зелёный
    case 1:
      return '#7fd3ff'; // вода - голубой
    case 2:
      return '#8b5a2b'; // горы - коричневый
    case null:
    default:
      return '#2a3338'; // туман / неизвестно (fallback без текстуры)
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

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellW: number,
  cellH: number,
  rows: number,
  cols: number
) {
  ctx.beginPath();
  ctx.strokeStyle = '#1518143c';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= cols; x++) {
    const px = x * cellW;
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
  }
  for (let y = 0; y <= rows; y++) {
    const py = y * cellH;
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
  }
  ctx.stroke();
}

/** Сетка без отрезков между двумя соседними клетками тумана (туман+туман). */
function drawGridFogAware(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellW: number,
  cellH: number,
  rows: number,
  cols: number,
  map: MapTile[][]
) {
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

  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.moveTo(0, height);
  ctx.lineTo(width, height);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, height);
  ctx.moveTo(width, 0);
  ctx.lineTo(width, height);
  ctx.stroke();
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const rows = 100;
  const cols = 100;
  const cellW = width / cols;
  const cellH = cellW;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      ctx.fillStyle = getTerrainColor(0);
      ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
    }
  }
  drawGrid(ctx, width, height, cellW, cellH, rows, cols);
}