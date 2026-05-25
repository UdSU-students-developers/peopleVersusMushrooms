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

module.exports = {
    PEOPLE_ECONOMY_BUILDING_SIZES,
    buildingFootprintSize,
    buildPathGrid,
    isWalkable,
};
