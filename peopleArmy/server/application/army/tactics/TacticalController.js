const { SHOT_COOLDOWN_BY_TYPE, MARCH_OBJECTIVE } = require('./constants');
const { buildSenseSnapshot, aimPoint } = require('./sensing');
const { pickEngageTarget, pickShootTarget } = require('./targeting');
const { hasLineOfSight } = require('./lineOfSight');
const { findNearestWalkableTile } = require('../pathGrid');

/**
 * Упрощённая тактика:
 * — нет формации, отхода, last seen, резервов целей;
 * — без врагов: марш на MARCH_OBJECTIVE;
 * — с врагами: идти к ближайшему (bmp/partizan → здания), в радиусе стоять и стрелять.
 */
class TacticalController {
    constructor(army) {
        this.army = army;
        this.simTime = 0;
    }

    plan() {
        const army = this.army;
        const sense = buildSenseSnapshot(army);

        for (const unit of army.units) {
            if (unit.isDead?.() || (typeof unit.hp === 'number' && unit.hp <= 0)) {
                continue;
            }
            this._ensureCombatFields(unit);

            const pick = pickEngageTarget(army, unit, sense);
            unit.tacticalTarget = pick.target;

            if (pick.aim) {
                unit.moveGoal = this._snapGoal(pick.aim.x, pick.aim.y, 'engage');
            } else {
                unit.moveGoal = this._snapGoal(MARCH_OBJECTIVE.x, MARCH_OBJECTIVE.y, 'march');
            }
        }
    }

    async executeCombat(deltaSec) {
        const army = this.army;
        if (!army.units.length || typeof army.callbacks?.takeDamage !== 'function') {
            return;
        }

        this.simTime += deltaSec;
        const { units: enemyUnits, buildings: enemyBuildings } = army.getShootableTargets();
        if (!enemyUnits.length && !enemyBuildings.length) {
            return;
        }

        const armyGuid = army.guids.mushroomsArmy;
        const economyGuid = army.guids.mushroomsEconomy;

        for (const unit of army.units) {
            if (unit.isDead?.() || (typeof unit.hp === 'number' && unit.hp <= 0)) {
                continue;
            }
            this._ensureCombatFields(unit);
            if (!this._canShoot(unit)) {
                continue;
            }

            const target = pickShootTarget(army, unit, enemyUnits, enemyBuildings, army.map);
            if (!target) {
                continue;
            }

            unit.tacticalTarget = target;

            const amount = Number(unit.damage) || 1;
            const damageApplied = await army.callbacks.takeDamage({
                armyGuid,
                economyGuid,
                unitGuid: target.guid,
                amount,
                targetKind: target.targetKind,
                type: target.type,
                role: target.role,
            });

            if (target.targetKind === 'building') {
                if (army.constructor._isMushroomsEconomyBuilding(target)
                    && !army.constructor._isDamageApplied(damageApplied)) {
                    army._discardGhostEconomyBuilding(target.guid);
                } else {
                    army._applyBuildingShotResult(target.guid, target.type, amount, damageApplied);
                }
            }

            unit.lastShotTime = this.simTime;
        }
    }

    executeMovement() {
        const army = this.army;
        const { units: enemyUnits, buildings: enemyBuildings } = army.getShootableTargets();

        for (const unit of army.units) {
            if (unit.isDead?.() || (typeof unit.hp === 'number' && unit.hp <= 0)) {
                continue;
            }

            const range = Number(unit.range) || 0;
            const rangeSq = range * range;

            const canShootNow = (list) => list.some((t) => {
                if (army.getTargetDistanceSquared(unit, t) > rangeSq) {
                    return false;
                }
                const aim = aimPoint(t);
                return hasLineOfSight(army.map, unit.x, unit.y, aim.x, aim.y);
            });

            if (canShootNow(enemyUnits) || canShootNow(enemyBuildings)) {
                unit.path = [];
                unit.walkPoints = 0;
                continue;
            }

            const goal = unit.moveGoal || this._snapGoal(MARCH_OBJECTIVE.x, MARCH_OBJECTIVE.y, 'march');
            const gx = Math.round(goal.x);
            const gy = Math.round(goal.y);

            const goalKey = `${goal.reason}:${gx},${gy}`;
            if (unit._goalKey !== goalKey) {
                unit._goalKey = goalKey;
                if (typeof unit.setTarget === 'function') {
                    unit.setTarget(gx, gy);
                } else {
                    unit.targetX = gx;
                    unit.targetY = gy;
                    unit.path = [];
                }
            }

            if (typeof unit.move === 'function' && unit.move(army.map, army.alliedBuildings)) {
                army.updated = true;
            }
        }
    }

    async tick(deltaSec) {
        this.plan();
        await this.executeCombat(deltaSec);
        this.executeMovement();
    }

    _ensureCombatFields(unit) {
        const type = String(unit.type || 'soldier').toLowerCase();
        if (unit.shotCooldown == null) {
            unit.shotCooldown = SHOT_COOLDOWN_BY_TYPE[type] ?? 2;
        }
        if (unit.shotCooldownJitter == null) {
            unit.shotCooldownJitter = (unit.guid || '').length * 0.07 % 0.35;
        }
        if (unit.lastShotTime == null) {
            unit.lastShotTime = -999;
        }
    }

    _canShoot(unit) {
        const cd = (Number(unit.shotCooldown) || 2) + (Number(unit.shotCooldownJitter) || 0);
        return this.simTime - unit.lastShotTime >= cd;
    }

    _snapGoal(x, y, reason) {
        const snapped = findNearestWalkableTile(this.army.map, x, y);
        if (snapped) {
            return { x: snapped.x, y: snapped.y, reason };
        }
        return { x, y, reason };
    }
}

module.exports = TacticalController;
