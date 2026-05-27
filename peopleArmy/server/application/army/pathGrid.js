/**
 * Размеры зданий peopleEconomy (peopleEconomy/server/config.js → ECONOMY.BUILDINGS).
 * Координата (x, y) — верхний левый угол; size — сторона квадрата в клетках.
 */
const PEOPLE_ECONOMY_BUILDING_SIZES = {
    pipe: 1,
    oil_barrel: 1,
    iron_barrel: 1,
    barracks: 2,
    small_reactor: 1,
    large_reactor: 2,
    driller: 1,
    mine: 1,
    small_generator: 1,
};

/** Размер футпринта: с карты приходит size, иначе справочник по type. */
function buildingFootprintSize(building) {
    const fromMap = Number(building?.size);
    if (fromMap > 0) {
        return Math.floor(fromMap);
    }
    const type = String(building?.type || '').toLowerCase();
    return PEOPLE_ECONOMY_BUILDING_SIZES[type] ?? 1;
}

/** Сетка для EasyStar: 0 — можно идти, иначе препятствие (рельеф + союзные здания). */
function buildPathGrid(terrainMap, alliedBuildings = []) {
    const grid = terrainMap.map((row) => [...row]);

    for (const building of alliedBuildings) {
        const size = buildingFootprintSize(building);
        const startX = Math.floor(Number(building.x) || 0);
        const startY = Math.floor(Number(building.y) || 0);

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const x = startX + dx;
                const y = startY + dy;
                if (grid[y]?.[x] !== undefined) {
                    grid[y][x] = 1;
                }
            }
        }
    }

    return grid;
}

function isWalkable(grid, x, y) {
    return grid[y]?.[x] === 0;
}

/**
 * Находит достижимую клетку, наиболее близкую к целевой точке.
 * Поиск идёт BFS от позиции юнита только по связной компоненте проходимости.
 * @returns {{ x: number, y: number } | null}
 */
function findNearestReachableTile(grid, fromX, fromY, targetX, targetY) {
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    const sx = Math.floor(fromX);
    const sy = Math.floor(fromY);
    const tx = Math.floor(targetX);
    const ty = Math.floor(targetY);

    if (sx < 0 || sy < 0 || sx >= cols || sy >= rows || !isWalkable(grid, sx, sy)) {
        return null;
    }

    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const queue = [{ x: sx, y: sy }];
    visited[sy][sx] = true;

    let best = { x: sx, y: sy };
    let bestDistSq = (sx - tx) * (sx - tx) + (sy - ty) * (sy - ty);

    for (let i = 0; i < queue.length; i += 1) {
        const current = queue[i];
        const distSq = (current.x - tx) * (current.x - tx) + (current.y - ty) * (current.y - ty);
        if (distSq < bestDistSq) {
            best = current;
            bestDistSq = distSq;
        }

        const neighbors = [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 },
        ];

        for (const next of neighbors) {
            if (next.x < 0 || next.y < 0 || next.x >= cols || next.y >= rows) {
                continue;
            }
            if (visited[next.y][next.x] || !isWalkable(grid, next.x, next.y)) {
                continue;
            }
            visited[next.y][next.x] = true;
            queue.push(next);
        }
    }

    return best;
}

/** Проходимая клетка рельефа (без учёта зданий). */
function isTerrainWalkable(map, x, y) {
    const tile = map[y]?.[x];
    return tile === 0;
}

/**
 * Ближайшая проходимая клетка к точке (для цели марша на воде/горе).
 * @returns {{ x: number, y: number } | null}
 */
function findNearestWalkableTile(map, x, y, maxRadius = 15) {
    const rows = map.length;
    const cols = map[0]?.length ?? 0;
    const startX = Math.floor(x);
    const startY = Math.floor(y);

    if (startX >= 0 && startY >= 0 && startX < cols && startY < rows && isTerrainWalkable(map, startX, startY)) {
        return { x: startX, y: startY };
    }

    for (let r = 1; r <= maxRadius; r += 1) {
        for (let dy = -r; dy <= r; dy += 1) {
            for (let dx = -r; dx <= r; dx += 1) {
                if (Math.abs(dx) !== r && Math.abs(dy) !== r) {
                    continue;
                }
                const nx = startX + dx;
                const ny = startY + dy;
                if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && isTerrainWalkable(map, nx, ny)) {
                    return { x: nx, y: ny };
                }
            }
        }
    }

    return null;
}

module.exports = {
    PEOPLE_ECONOMY_BUILDING_SIZES,
    buildingFootprintSize,
    buildPathGrid,
    isWalkable,
    findNearestReachableTile,
    isTerrainWalkable,
    findNearestWalkableTile,
};
