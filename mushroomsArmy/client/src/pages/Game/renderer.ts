import { GameState, TerrainType, Unit } from './types';
import sporometSrc from '../../assets/units/Sporomet.png';
import champignebSrc from '../../assets/units/Champigneb.png';
import eblekarSrc from '../../assets/units/Eblekar.png';


// Предзагрузка изображений (один раз)
const unitImages: Record<string, HTMLImageElement> = {};

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
    if (imgSrc == undefined) return undefined;
    
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

  const cellW = widthCSS / 50;
  const cellH = heightCSS / 50;

  // 1. Отрисовка карты (тайлы 50×50)
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 50; x++) {
      const terrain = state.map[y][x];
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
  (state.buildings ?? []).forEach(building => {
    if (building.hp <= 0) return;

    const bx = building.x * cellW;
    const by = building.y * cellH;
    const hpPercent =
      building.maxHp > 0
        ? Math.max(0, Math.min(1, building.hp / building.maxHp))
        : 0;

    if (building.type === 'vzryvomor') {
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
      const barWidth = side;
      const barHeight = 4;
      const barX = cx - barWidth / 2;
      const barY = cy - half - 6;
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
      const barWidth = 2 * cellW;
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

  // 4. Отрисовка юнитов (только живых)
  state.units.forEach(unit => {
    if (unit.hp <= 0) return; // мёртвых не рисуем

    const cx = unit.x * cellW + cellW / 2;
    const cy = unit.y * cellH + cellH / 2;
    const radius = Math.min(cellW, cellH) * 0.35;
    const size = radius * 2;

    // Изображение юнита
    const img = getUnitImage(unit);
    if (img != undefined && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
    } else {
      // fallback — цветной круг пока изображение не загружено
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = unit.type === 'sporomet' ? '#4caf50' : unit.type === 'eblekar' ? '#e040fb' : '#ff9800';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Полоска HP
    const barWidth = radius * 1.8;
    const barHeight = 5;
    const barX = cx - barWidth / 2;
    const barY = cy - radius - 5;

    ctx.fillStyle = '#d32f2f'; // красный фон
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpPercent = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
    ctx.fillStyle = '#4caf50'; // зелёный заряд
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  });

}

/**
 * Возвращает цвет тайла в зависимости от типа местности
 */
function getTerrainColor(type: TerrainType): string {
  switch (type) {
    case 0: return '#a0d6a0'; // равнина
    case 1: return '#4a7db4'; // вода
    case 2: return '#555555'; // горы
    default: return '#a0d6a0';
  }
}

/**
 * Рисует тонкую серую сетку 50×50
 */
function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, cellW: number, cellH: number) {
  ctx.beginPath();
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 50; i++) {
    const x = i * cellW;
    const y = i * cellH;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
}

/**
 * Заглушка на случай отсутствия состояния
 */
function drawPlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const cellW = width / 50;
  const cellH = height / 50;
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 50; x++) {
      ctx.fillStyle = '#a0d6a0';
      ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
    }
  }
  drawGrid(ctx, width, height, cellW, cellH);
}