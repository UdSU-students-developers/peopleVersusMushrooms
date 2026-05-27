/**
 * Прямая видимость (Bresenham). Блокируют туман (null) и вода (1).
 * @param {Array<Array<number|null>>} map
 */
function hasLineOfSight(map, fromX, fromY, toX, toY) {
    const x0 = Math.floor(fromX);
    const y0 = Math.floor(fromY);
    const x1 = Math.floor(toX);
    const y1 = Math.floor(toY);

    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let cx = x0;
    let cy = y0;

    while (true) {
        if (cy >= 0 && cx >= 0 && cy < map.length && cx < (map[0]?.length ?? 0)) {
            const tile = map[cy][cx];
            if (tile === null || tile === 1) {
                return false;
            }
        }

        if (cx === x1 && cy === y1) {
            break;
        }

        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            cx += sx;
        }
        if (e2 < dx) {
            err += dx;
            cy += sy;
        }
    }

    return true;
}

module.exports = { hasLineOfSight };
