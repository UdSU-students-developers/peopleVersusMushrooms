import { TILE } from './terrainConstants';
import { getTerrainTileCanvas, terrainVariantIndex, type TerrainKind } from './terrainTiles';

const patternCache = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasPattern>>();

function patternKey(kind: TerrainKind, variant: number): string {
    return `${kind}:${variant}`;
}

function getTerrainPattern(
    ctx: CanvasRenderingContext2D,
    kind: TerrainKind,
    variant: number,
): CanvasPattern | null {
    let perCtx = patternCache.get(ctx);
    if (!perCtx) {
        perCtx = new Map();
        patternCache.set(ctx, perCtx);
    }
    const key = patternKey(kind, variant);
    const cached = perCtx.get(key);
    if (cached) {
        return cached;
    }

    const tile = getTerrainTileCanvas(kind, variant);
    const created = ctx.createPattern(tile, 'repeat');
    if (created) {
        perCtx.set(key, created);
        return created;
    }
    return null;
}

function fillTexturedCell(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    cell: number,
    kind: TerrainKind,
    mapX: number,
    mapY: number,
): void {
    const variant = terrainVariantIndex(mapX, mapY, kind);
    const pattern = getTerrainPattern(ctx, kind, variant);
    if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(px, py, cell, cell);
        return;
    }
    ctx.fillStyle = '#333';
    ctx.fillRect(px, py, cell, cell);
}

/** Лёгкая сетка поверх текстур */
function drawSubtleGrid(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    cell: number,
): void {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = Math.max(0.5, cell * 0.03);
    ctx.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1);
}

export function drawTerrainCell(
    ctx: CanvasRenderingContext2D,
    mapX: number,
    mapY: number,
    px: number,
    py: number,
    cell: number,
    tileValue: number,
    unknownColor: string,
): void {
    if (tileValue === TILE.WATER) {
        fillTexturedCell(ctx, px, py, cell, 'water', mapX, mapY);
        drawSubtleGrid(ctx, px, py, cell);
        return;
    }
    if (tileValue === TILE.MOUNTAIN) {
        fillTexturedCell(ctx, px, py, cell, 'stone', mapX, mapY);
        drawSubtleGrid(ctx, px, py, cell);
        return;
    }
    if (tileValue === TILE.PLANE) {
        fillTexturedCell(ctx, px, py, cell, 'grass', mapX, mapY);
        drawSubtleGrid(ctx, px, py, cell);
        return;
    }
    if (tileValue !== undefined) {
        ctx.fillStyle = unknownColor;
        ctx.fillRect(px, py, cell, cell);
    }
}
