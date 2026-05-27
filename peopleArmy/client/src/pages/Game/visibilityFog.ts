/** Дальность видимости по умолчанию (peopleArmy/server data.sql) */
const DEFAULT_VISIBLE_BY_TYPE: Record<string, number> = {
    soldier: 5,
    bmp: 7,
    sniper: 25,
    partizan: 10,
};

export type UnitWithVision = {
    x: number;
    y: number;
    hp: number;
    type?: string;
    visible?: number;
};

export function getUnitVisionRadius(unit: UnitWithVision): number {
    const parsed = Number(unit.visible);
    if (Number.isFinite(parsed) && parsed > 0) {
        return Math.floor(parsed);
    }
    const type = String(unit.type ?? 'soldier').toLowerCase();
    return DEFAULT_VISIBLE_BY_TYPE[type] ?? 5;
}

/**
 * Сетка видимости: true — клетка в зоне обзора хотя бы одного союзного юнита.
 */
export function buildAllyVisibilityGrid(
    rows: number,
    cols: number,
    units: UnitWithVision[],
): boolean[][] {
    const grid: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));

    for (const unit of units) {
        if (unit.hp <= 0) continue;

        const radius = getUnitVisionRadius(unit);
        if (radius <= 0) continue;

        const cx = unit.x;
        const cy = unit.y;
        const rr = radius * radius;
        const x0 = Math.max(0, Math.floor(cx - radius));
        const x1 = Math.min(cols - 1, Math.ceil(cx + radius));
        const y0 = Math.max(0, Math.floor(cy - radius));
        const y1 = Math.min(rows - 1, Math.ceil(cy + radius));

        for (let y = y0; y <= y1; y += 1) {
            for (let x = x0; x <= x1; x += 1) {
                const dx = x - cx;
                const dy = y - cy;
                if (dx * dx + dy * dy <= rr) {
                    grid[y][x] = true;
                }
            }
        }
    }

    return grid;
}

/** Затемняет клетки вне зоны видимости союзных юнитов */
export function drawVisibilityFog(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    cell: number,
    visibleGrid: boolean[][],
    fogColor = 'rgba(8, 12, 18, 0.55)',
): void {
    ctx.fillStyle = fogColor;
    for (let y = 0; y < rows; y += 1) {
        const row = visibleGrid[y];
        if (!row) continue;
        for (let x = 0; x < cols; x += 1) {
            if (row[x]) continue;
            ctx.fillRect(x * cell, y * cell, cell, cell);
        }
    }
}
