const { THREAT_BY_ENEMY_TYPE, MARCH_OBJECTIVE } = require('./constants');

function aimPoint(target) {
    const x = Number(target.x);
    const y = Number(target.y);
    const size = Math.max(0, Number(target.size) || 0);
    return {
        x: x + size / 2,
        y: y + size / 2,
    };
}

function threatOf(entity) {
    const type = String(entity.type || '').toLowerCase();
    return THREAT_BY_ENEMY_TYPE[type] ?? 8;
}

/**
 * @param {import('../Army')} army
 */
function buildSenseSnapshot(army) {
    const { units: shootableUnits, buildings: shootableBuildings } = army.getShootableTargets();
    const allTargets = [...shootableUnits, ...shootableBuildings];

    let sumX = 0;
    let sumY = 0;
    let allyCount = 0;
    for (const u of army.units) {
        if (u.isDead?.() || (typeof u.hp === 'number' && u.hp <= 0)) {
            continue;
        }
        sumX += Number(u.x);
        sumY += Number(u.y);
        allyCount += 1;
    }

    const anchor = allyCount > 0
        ? { x: sumX / allyCount, y: sumY / allyCount }
        : { x: 0, y: 0 };

    let enemySumX = 0;
    let enemySumY = 0;
    let enemyCount = 0;
    for (const t of allTargets) {
        const p = aimPoint(t);
        enemySumX += p.x;
        enemySumY += p.y;
        enemyCount += 1;
    }

    const enemyCentroid = enemyCount > 0
        ? { x: enemySumX / enemyCount, y: enemySumY / enemyCount }
        : null;

    let forwardDx = 1;
    let forwardDy = 0;
    if (enemyCentroid) {
        forwardDx = enemyCentroid.x - anchor.x;
        forwardDy = enemyCentroid.y - anchor.y;
    } else {
        forwardDx = MARCH_OBJECTIVE.x - anchor.x;
        forwardDy = MARCH_OBJECTIVE.y - anchor.y;
    }
    const forwardLen = Math.hypot(forwardDx, forwardDy) || 1;
    forwardDx /= forwardLen;
    forwardDy /= forwardLen;

    const hasVisibleEnemies = allTargets.length > 0;

    return {
        anchor,
        enemyCentroid,
        hasVisibleEnemies,
        marchObjective: MARCH_OBJECTIVE,
        forward: { dx: forwardDx, dy: forwardDy },
        units: shootableUnits,
        buildings: shootableBuildings,
        allTargets,
        threatByGuid: new Map(allTargets.map((t) => [t.guid, threatOf(t)])),
    };
}

module.exports = {
    buildSenseSnapshot,
    aimPoint,
    threatOf,
};
