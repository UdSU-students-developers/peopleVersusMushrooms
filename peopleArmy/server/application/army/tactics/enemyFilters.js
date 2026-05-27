/** Юниты врага, которых армия людей не преследует и по которым не стреляет */
const IGNORED_ENEMY_UNIT_TYPES = new Set(['pizdoglyad']);

function isIgnoredEnemyUnit(entity) {
    if (!entity) return false;
    const type = String(entity.type || '').toLowerCase();
    return IGNORED_ENEMY_UNIT_TYPES.has(type);
}

function filterCombatEnemyUnits(units) {
    return units.filter((u) => !isIgnoredEnemyUnit(u));
}

module.exports = {
    IGNORED_ENEMY_UNIT_TYPES,
    isIgnoredEnemyUnit,
    filterCombatEnemyUnits,
};
