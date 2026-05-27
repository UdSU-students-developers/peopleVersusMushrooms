const { hasLineOfSight } = require('./lineOfSight');
const { aimPoint } = require('./sensing');

function prefersBuildings(unitType) {
    return unitType === 'partizan' || unitType === 'bmp';
}

function buildPool(sense, unitType) {
    const units = sense.units;
    const buildings = sense.buildings;
    if (prefersBuildings(unitType)) {
        return buildings.length > 0 ? [...buildings, ...units] : units;
    }
    return units.length > 0 ? [...units, ...buildings] : buildings;
}

/**
 * Куда идти: к ближайшему видимому врагу (приоритет типа для bmp/partizan).
 */
function pickEngageTarget(army, unit, sense) {
    if (!sense.hasVisibleEnemies) {
        return { target: null, aim: null };
    }

    const unitType = String(unit.type || 'soldier').toLowerCase();
    const pool = buildPool(sense, unitType);
    if (!pool.length) {
        return { target: null, aim: null };
    }

    let best = null;
    let bestDist = Infinity;

    for (const target of pool) {
        const aim = aimPoint(target);
        const dist = Math.hypot(aim.x - unit.x, aim.y - unit.y);
        if (dist < bestDist) {
            bestDist = dist;
            best = { target, aim };
        }
    }

    return best ? { target: best.target, aim: best.aim } : { target: null, aim: null };
}

/**
 * Кого стрелять: в радиусе + LoS, приоритет типа, в пуле — с наименьшим hp.
 */
function pickShootTarget(army, unit, enemyUnits, enemyBuildings, map) {
    const unitType = String(unit.type || 'soldier').toLowerCase();
    const range = Number(unit.range) || 0;
    const rangeSq = range * range;

    const inRange = (list, kind) => list
        .filter((t) => {
            if (army.getTargetDistanceSquared(unit, t) > rangeSq) {
                return false;
            }
            const aim = aimPoint(t);
            return hasLineOfSight(map, unit.x, unit.y, aim.x, aim.y);
        })
        .map((t) => ({ ...t, targetKind: kind }));

    const units = inRange(enemyUnits, 'unit');
    const buildings = inRange(enemyBuildings, 'building');

    const [primary, secondary] = prefersBuildings(unitType)
        ? [buildings, units]
        : [units, buildings];

    const pool = primary.length > 0 ? primary : secondary;
    if (!pool.length) {
        return null;
    }

    return pool.reduce((weakest, t) => {
        const hp = Number.isFinite(Number(t.hp)) ? Number(t.hp) : Infinity;
        const wHp = Number.isFinite(Number(weakest.hp)) ? Number(weakest.hp) : Infinity;
        return hp < wHp ? t : weakest;
    });
}

module.exports = {
    pickEngageTarget,
    pickShootTarget,
    prefersBuildings,
};
