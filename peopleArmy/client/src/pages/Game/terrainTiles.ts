/**
 * Пиксельные тайлы рельефа 16×16 (генерируются в рантайме, бесшовно тайлятся).
 */

const TILE_PX = 16;

type TileGrid = string[][];

function buildTileCanvas(grid: TileGrid): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_PX;
    canvas.height = TILE_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    for (let y = 0; y < TILE_PX; y += 1) {
        for (let x = 0; x < TILE_PX; x += 1) {
            ctx.fillStyle = grid[y]?.[x] ?? '#000000';
            ctx.fillRect(x, y, 1, 1);
        }
    }
    return canvas;
}

/** Земля / трава — три варианта */
const GRASS_A: TileGrid = [
    ['#3d6b34', '#3d6b34', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#3d6b34', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#3d6b34'],
    ['#4a7c3f', '#5d9450', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#3d6b34', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#3d6b34', '#4a7c3f'],
    ['#4a7c3f', '#4a7c3f', '#3d6b34', '#5d9450', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450'],
    ['#3d6b34', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#6b8f3a', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#4a7c3f', '#5d9450', '#4a7c3f'],
    ['#4a7c3f', '#5d9450', '#3d6b34', '#4a7c3f', '#4a7c3f', '#5d9450', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#4a7c3f', '#3d6b34', '#5d9450', '#4a7c3f', '#3d6b34'],
    ['#4a7c3f', '#4a7c3f', '#4a7c3f', '#5d9450', '#3d6b34', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#4a7c3f', '#5d9450', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f'],
    ['#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#4a7c3f', '#3d6b34', '#6b8f3a', '#4a7c3f', '#4a7c3f', '#3d6b34', '#5d9450', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450'],
    ['#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#3d6b34', '#5d9450', '#4a7c3f', '#4a7c3f', '#4a7c3f'],
    ['#4a7c3f', '#5d9450', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#3d6b34', '#4a7c3f', '#4a7c3f', '#3d6b34'],
    ['#3d6b34', '#4a7c3f', '#4a7c3f', '#5d9450', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#4a7c3f', '#5d9450', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#3d6b34', '#5d9450', '#4a7c3f'],
    ['#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#4a7c3f', '#5d9450', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#4a7c3f'],
    ['#4a7c3f', '#5d9450', '#4a7c3f', '#3d6b34', '#5d9450', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#4a7c3f', '#5d9450', '#4a7c3f', '#3d6b34', '#4a7c3f', '#4a7c3f', '#5d9450'],
    ['#3d6b34', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#3d6b34', '#4a7c3f', '#4a7c3f', '#5d9450', '#4a7c3f', '#3d6b34', '#4a7c3f'],
    ['#4a7c3f', '#4a7c3f', '#5d9450', '#3d6b34', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#5d9450', '#4a7c3f', '#3d6b34', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#3d6b34'],
    ['#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#5d9450', '#3d6b34', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#4a7c3f'],
    ['#3d6b34', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#5d9450', '#4a7c3f', '#4a7c3f', '#3d6b34', '#4a7c3f', '#4a7c3f', '#3d6b34'],
];

const GRASS_B: TileGrid = GRASS_A.map((row, y) =>
    row.map((c, x) => {
        if ((x + y) % 5 === 0 && c === '#4a7c3f') return '#5d9450';
        if ((x + y) % 7 === 0 && c === '#3d6b34') return '#6b8f3a';
        return c;
    }),
);

const GRASS_C: TileGrid = GRASS_A.map((row, y) =>
    row.map((c, x) => {
        if ((x * 3 + y) % 6 === 0 && c === '#5d9450') return '#4a7c3f';
        if ((x + y * 2) % 8 === 0) return '#3d6b34';
        return c;
    }),
);

/** Вода */
const WATER_A: TileGrid = [
    ['#123d55', '#1a4f6e', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#3a88b5', '#2a6a8f', '#1a4f6e', '#123d55'],
    ['#1a4f6e', '#2a6a8f', '#3a88b5', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e'],
    ['#1a4f6e', '#2a6a8f', '#1a4f6e', '#1a4f6e', '#2a6a8f', '#8cd4ff', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#3a88b5', '#2a6a8f', '#1a4f6e'],
    ['#123d55', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#1a4f6e', '#2a6a8f', '#123d55'],
    ['#1a4f6e', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#3a88b5', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#2a6a8f', '#1a4f6e', '#1a4f6e', '#2a6a8f'],
    ['#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#1a4f6e'],
    ['#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#8cd4ff', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#1a4f6e', '#2a6a8f', '#3a88b5', '#1a4f6e', '#123d55'],
    ['#1a4f6e', '#2a6a8f', '#2a6a8f', '#1a4f6e', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#2a6a8f', '#1a4f6e', '#1a4f6e', '#2a6a8f', '#2a6a8f', '#1a4f6e'],
    ['#123d55', '#1a4f6e', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#123d55', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#1a4f6e', '#1a4f6e', '#2a6a8f'],
    ['#1a4f6e', '#2a6a8f', '#3a88b5', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#123d55', '#2a6a8f', '#2a6a8f', '#1a4f6e', '#1a4f6e'],
    ['#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#123d55'],
    ['#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#8cd4ff', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#1a4f6e', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f'],
    ['#1a4f6e', '#2a6a8f', '#1a4f6e', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#3a88b5', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e'],
    ['#123d55', '#1a4f6e', '#2a6a8f', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#2a6a8f', '#1a4f6e'],
    ['#1a4f6e', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#1a4f6e', '#1a4f6e', '#123d55'],
    ['#123d55', '#1a4f6e', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#2a6a8f', '#1a4f6e', '#123d55', '#1a4f6e', '#2a6a8f', '#1a4f6e'],
];

const WATER_B: TileGrid = WATER_A.map((row, y) =>
    row.map((c, x) => ((x + y) % 9 === 0 && c.startsWith('#2')) ? '#3a88b5' : c),
);

const WATER_C: TileGrid = WATER_A.map((row, y) =>
    row.map((c, x) => ((x * 2 + y) % 11 === 0 ? '#8cd4ff' : c)),
);

/** Камень / горы */
const STONE_A: TileGrid = [
    ['#3d4248', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#7a8088', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#7a8088', '#5a5f66', '#3d4248'],
    ['#5a5f66', '#7a8088', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#7a8088', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66'],
    ['#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#2a2d30', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#7a8088', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66'],
    ['#3d4248', '#5a5f66', '#5a5f66', '#7a8088', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#2a2d30', '#5a5f66', '#5a5f66', '#3d4248'],
    ['#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#7a8088', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#7a8088', '#5a5f66', '#5a5f66'],
    ['#5a5f66', '#7a8088', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#7a8088', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66'],
    ['#3d4248', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#2a2d30', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#7a8088', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248'],
    ['#5a5f66', '#5a5f66', '#7a8088', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#7a8088', '#5a5f66'],
    ['#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#7a8088', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#2a2d30', '#5a5f66', '#5a5f66'],
    ['#3d4248', '#5a5f66', '#7a8088', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#7a8088', '#5a5f66', '#3d4248', '#5a5f66'],
    ['#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#7a8088', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248'],
    ['#5a5f66', '#7a8088', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#2a2d30', '#5a5f66', '#5a5f66', '#7a8088', '#5a5f66', '#5a5f66'],
    ['#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#7a8088', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66'],
    ['#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#7a8088', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#7a8088'],
    ['#5a5f66', '#3d4248', '#5a5f66', '#7a8088', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66'],
    ['#3d4248', '#5a5f66', '#5a5f66', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#3d4248', '#5a5f66', '#7a8088', '#5a5f66', '#3d4248', '#5a5f66', '#5a5f66', '#3d4248'],
];

const STONE_B: TileGrid = STONE_A.map((row, y) =>
    row.map((c, x) => ((x + y) % 6 === 0 && c === '#5a5f66') ? '#7a8088' : c),
);

const STONE_C: TileGrid = STONE_A.map((row, y) =>
    row.map((c, x) => ((x * 2 + y) % 7 === 0) ? '#2a2d30' : c),
);

export type TerrainKind = 'grass' | 'water' | 'stone';

const TILE_CANVASES: Record<TerrainKind, HTMLCanvasElement[]> = {
    grass: [GRASS_A, GRASS_B, GRASS_C].map(buildTileCanvas),
    water: [WATER_A, WATER_B, WATER_C].map(buildTileCanvas),
    stone: [STONE_A, STONE_B, STONE_C].map(buildTileCanvas),
};

export function terrainVariantIndex(x: number, y: number, kind: TerrainKind): number {
    const n = TILE_CANVASES[kind].length;
    const h = (x * 73856093) ^ (y * 19349663) ^ (kind.charCodeAt(0) * 83492791);
    return Math.abs(h) % n;
}

export function getTerrainTileCanvas(kind: TerrainKind, variant: number): HTMLCanvasElement {
    const list = TILE_CANVASES[kind];
    return list[variant % list.length] ?? list[0];
}

/** Data URL для превью в легенде */
export function getTerrainTilePreviewUrl(kind: TerrainKind, variant = 0): string {
    return getTerrainTileCanvas(kind, variant).toDataURL('image/png');
}

export { TILE_PX };
