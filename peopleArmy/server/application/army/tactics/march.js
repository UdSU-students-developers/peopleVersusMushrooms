const { MARCH_OBJECTIVE } = require('./constants');

/** Сколько клеток якорь формации сдвигается к базе грибов за один plan-тик. */
const MARCH_STEP_PER_PLAN = 6;

/** Считаем, что отряд дошёл, если центр в этом радиусе от цели. */
const MARCH_ARRIVED_RADIUS = 5;

/**
 * Якорь формации движется от текущего центра отряда к (95,95), а не телепортируется сразу.
 * @param {{ x: number, y: number }} armyAnchor
 */
function computeMarchAnchor(armyAnchor) {
    const dx = MARCH_OBJECTIVE.x - armyAnchor.x;
    const dy = MARCH_OBJECTIVE.y - armyAnchor.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= MARCH_ARRIVED_RADIUS) {
        return { x: MARCH_OBJECTIVE.x, y: MARCH_OBJECTIVE.y, arrived: true };
    }

    const step = Math.min(dist, MARCH_STEP_PER_PLAN);
    return {
        x: armyAnchor.x + (dx / dist) * step,
        y: armyAnchor.y + (dy / dist) * step,
        arrived: false,
    };
}

module.exports = {
    MARCH_STEP_PER_PLAN,
    MARCH_ARRIVED_RADIUS,
    computeMarchAnchor,
};
