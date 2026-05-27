const { FORMATION_SLOTS } = require('./constants');

function rotateOffset(dx, dy, forwardDx, forwardDy) {
    return {
        dx: Math.round(dx * forwardDx - dy * forwardDy),
        dy: Math.round(dx * forwardDy + dy * forwardDx),
    };
}

/**
 * Назначает мировые координаты слотов формации относительно якоря.
 * @param {object[]} aliveUnits
 * @param {{ x: number, y: number }} anchor
 * @param {{ dx: number, dy: number }} forward
 * @param {number} mapRows
 * @param {number} mapCols
 */
function assignFormationSlots(aliveUnits, anchor, forward, mapRows, mapCols) {
    const used = new Set();
    const typeCounters = {};

    for (const unit of aliveUnits) {
        const type = String(unit.type || 'soldier').toLowerCase();
        const templates = FORMATION_SLOTS[type] || FORMATION_SLOTS.soldier;
        const idx = typeCounters[type] || 0;
        typeCounters[type] = idx + 1;
        const template = templates[idx % templates.length];

        const rotated = rotateOffset(template.dx, template.dy, forward.dx, forward.dy);
        let wx = Math.round(anchor.x + rotated.dx);
        let wy = Math.round(anchor.y + rotated.dy);

        wx = Math.max(0, Math.min(mapCols - 1, wx));
        wy = Math.max(0, Math.min(mapRows - 1, wy));

        const key = `${wx},${wy}`;
        if (used.has(key)) {
            wx = Math.min(mapCols - 1, wx + 1);
        }
        used.add(`${wx},${wy}`);

        unit.formationSlot = { x: wx, y: wy };
    }
}

module.exports = { assignFormationSlots, rotateOffset };
