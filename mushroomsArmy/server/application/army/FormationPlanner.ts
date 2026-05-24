import { TMap } from './Army';

export type FormationUnitType = 'sporomet' | 'eblekar' | 'champigneb';

export type FormationSlotPos = { x: number; y: number };

export type FormationUnitCounts = Partial<Record<FormationUnitType, number>>;

export type FormationFillOrder = 'inner-first' | 'outer-first';

export type FormationPlannerOptions = {
    map: TMap;
    baseCenter: { x: number; y: number };
    baseWallTopY: number;
    baseWallLeftX: number;
};

const WALKABLE_TILES = new Set<number>([0, 2]);

// Параметры решётки: SLOT_OFFSET = SLOT_STEP/2 даёт треугольную упаковку.
const SLOT_STEP          = 2;
const L_STEP             = 2;   // расстояние между L-кольцами
const SLOT_OFFSET        = 1;
const MIN_D              = 1;
const WALL_TRIGGER_RINGS = 5;
// Схлопывание: кольцо сжимается только если юнитов < 60% ёмкости меньшего радиуса.
const SHRINK_THRESHOLD   = 0.6;
// Кулдаун между схлопываниями (тиков × 200 мс). 10 тиков = 2 сек.
const SHRINK_COOLDOWN    = 10;

// Авторитетная семантика: L-кольца вокруг угла базы,
// 3 активные L подряд, type-rank, wave-fill.
export class FormationPlanner {
    private readonly _center: Readonly<{ x: number; y: number }>;
    private readonly map: TMap;
    private readonly baseWallTopY: number;
    private readonly baseWallLeftX: number;
    private readonly mapRows: number;
    private readonly mapCols: number;

    private lastWallRingIdx: number = 0;
    // Текущий радиус формации (d_start). Расширяется немедленно при нехватке
    // слотов, схлопывается постепенно с кулдауном — без рывков при потерях.
    private currentDStart: number = MIN_D;
    private contractionCooldown: number = 0;
    private lastBuiltSlots: Record<FormationUnitType, FormationSlotPos[]> = {
        sporomet:   [],
        eblekar:    [],
        champigneb: [],
    };

    constructor(opts: FormationPlannerOptions) {
        this._center       = Object.freeze({ ...opts.baseCenter });
        this.map           = opts.map;
        this.baseWallTopY  = opts.baseWallTopY;
        this.baseWallLeftX = opts.baseWallLeftX;
        this.mapRows       = this.map.length;
        this.mapCols       = this.map[0]?.length ?? 0;
    }

    public get center(): Readonly<{ x: number; y: number }> {
        return this._center;
    }

    public updateForCounts(
        counts: FormationUnitCounts,
        opts: { fillOrder?: FormationFillOrder } = {},
    ): Record<FormationUnitType, FormationSlotPos[]> {
        const fillOrder: FormationFillOrder = opts.fillOrder ?? 'inner-first';

        const result: Record<FormationUnitType, FormationSlotPos[]> = {
            sporomet:   [],
            eblekar:    [],
            champigneb: [],
        };
        const remaining: Record<FormationUnitType, number> = {
            sporomet:   counts.sporomet   ?? 0,
            eblekar:    counts.eblekar    ?? 0,
            champigneb: counts.champigneb ?? 0,
        };
        const total = this.totalRemaining(remaining);
        if (total === 0) {
            this.lastBuiltSlots = result;
            return result;
        }

        const maxD = Math.max(this.baseWallTopY, this.baseWallLeftX);

        // Ёмкость трёх активных L при данном d_start.
        const capacityAt = (d: number): number =>
            this.lShellCells(d).length +
            this.lShellCells(d + L_STEP).length +
            this.lShellCells(d + 2 * L_STEP).length;

        // Расширение: немедленно, пока юниты не помещаются.
        while (capacityAt(this.currentDStart) < total && this.currentDStart + 2 * L_STEP < maxD) {
            this.currentDStart += L_STEP;
        }

        // Схлопывание: одно кольцо за раз с кулдауном — без тряски при потерях.
        if (this.contractionCooldown > 0) {
            this.contractionCooldown--;
        } else if (this.currentDStart > MIN_D) {
            const smallerD = Math.max(MIN_D, this.currentDStart - L_STEP);
            if (total <= Math.floor(capacityAt(smallerD) * SHRINK_THRESHOLD)) {
                this.currentDStart = smallerD;
                this.contractionCooldown = SHRINK_COOLDOWN;
            }
        }

        const dStart = this.currentDStart;
        const innerCells = this.lShellCells(dStart);
        const middleCells = this.lShellCells(dStart + L_STEP);
        const outerCells = this.lShellCells(dStart + 2 * L_STEP);

        type LSpec = {
            cells: FormationSlotPos[];
            priority: ReadonlyArray<FormationUnitType>;
        };
        const Ls: LSpec[] = [
            { cells: innerCells,  priority: ['eblekar', 'sporomet', 'champigneb'] },
            { cells: middleCells, priority: ['sporomet', 'champigneb'] },
            { cells: outerCells,  priority: ['champigneb'] },
        ];
        if (fillOrder === 'outer-first') Ls.reverse();

        for (const { cells, priority } of Ls) {
            if (this.totalRemaining(remaining) === 0) break;
            this.fillCells(cells, priority, remaining, result);
        }

        this.lastBuiltSlots = result;
        return result;
    }

    public getAllSlots(): Readonly<Record<FormationUnitType, ReadonlyArray<FormationSlotPos>>> {
        return this.lastBuiltSlots;
    }

    public getSlots(type: FormationUnitType): ReadonlyArray<FormationSlotPos> {
        return this.lastBuiltSlots[type];
    }

    // unitPositions — фактические позиции «осевших» юнитов (фильтрация на стороне
    // ArmyStateManager); по слотам считать нельзя, иначе стены строятся на спавне.
    public checkWallTrigger(unitPositions: ReadonlyArray<{ x: number; y: number }>): FormationSlotPos[] | null {
        if (unitPositions.length === 0) return null;
        let outerShell = -1;
        for (const u of unitPositions) {
            const shell = Math.max(this.baseWallTopY - u.y, this.baseWallLeftX - u.x);
            if (shell > outerShell) outerShell = shell;
        }
        if (outerShell < 0) return null;

        const outerRingIdx = Math.floor(outerShell / L_STEP);
        if (outerRingIdx - this.lastWallRingIdx < WALL_TRIGGER_RINGS) return null;

        const newWallRingIdx = this.lastWallRingIdx + WALL_TRIGGER_RINGS;
        this.lastWallRingIdx = newWallRingIdx;
        return this.generateWallL(newWallRingIdx * L_STEP);
    }

    // -- private helpers --

    // Wave-ordered lattice-слоты L(d): top[0], left[0], top[1], left[1]...
    // (apex входит в top[0] если он lattice-cell). См. §2.3, §3.3.
    private lShellCells(d: number): FormationSlotPos[] {
        const i = Math.floor((d - MIN_D) / L_STEP);
        const shift = (i & 1) ? SLOT_OFFSET : 0;

        const apexX = this.baseWallLeftX - d;
        const apexY = this.baseWallTopY  - d;

        const top: FormationSlotPos[] = [];
        if (apexY >= 0 && apexY < this.mapRows) {
            const xStart = Math.max(0, apexX);
            for (let x = xStart; x < this.mapCols; x++) {
                if (((x - shift) % SLOT_STEP + SLOT_STEP) % SLOT_STEP !== 0) continue;
                if (!this.isWalkable(x, apexY)) continue;
                top.push({ x, y: apexY });
            }
        }

        const left: FormationSlotPos[] = [];
        if (apexX >= 0 && apexX < this.mapCols) {
            const yStart = Math.max(0, apexY + 1);
            for (let y = yStart; y < this.mapRows; y++) {
                if (((y - shift) % SLOT_STEP + SLOT_STEP) % SLOT_STEP !== 0) continue;
                if (!this.isWalkable(apexX, y)) continue;
                left.push({ x: apexX, y });
            }
        }

        const result: FormationSlotPos[] = [];
        const maxLen = Math.max(top.length, left.length);
        for (let k = 0; k < maxLen; k++) {
            if (k < top.length)  result.push(top[k]);
            if (k < left.length) result.push(left[k]);
        }
        return result;
    }

    private fillCells(
        cells: ReadonlyArray<FormationSlotPos>,
        priority: ReadonlyArray<FormationUnitType>,
        remaining: Record<FormationUnitType, number>,
        result: Record<FormationUnitType, FormationSlotPos[]>,
    ): void {
        for (const cell of cells) {
            for (const type of priority) {
                if (remaining[type] > 0) {
                    result[type].push({ x: cell.x, y: cell.y });
                    remaining[type]--;
                    break;
                }
            }
        }
    }

    private totalRemaining(r: Record<FormationUnitType, number>): number {
        return r.sporomet + r.eblekar + r.champigneb;
    }

    // Сплошная L (каждая клетка, не lattice-слоты) — vzryvomor стена.
    private generateWallL(shellDist: number): FormationSlotPos[] {
        const topY  = this.baseWallTopY  - shellDist;
        const leftX = this.baseWallLeftX - shellDist;
        const positions: FormationSlotPos[] = [];

        if (topY >= 0 && topY < this.mapRows) {
            const xStart = Math.max(0, leftX);
            for (let x = xStart; x < this.mapCols; x++) positions.push({ x, y: topY });
        }
        if (leftX >= 0 && leftX < this.mapCols) {
            const yStart = Math.max(0, topY + 1);
            for (let y = yStart; y < this.mapRows; y++) positions.push({ x: leftX, y });
        }
        return positions;
    }

    public buildAttackSemicircle(
        counts: FormationUnitCounts,
        centerX: number,
        centerY: number,
    ): Record<FormationUnitType, FormationSlotPos[]> {
        const result: Record<FormationUnitType, FormationSlotPos[]> = {
            champigneb: [], sporomet: [], eblekar: [],
        };

        // Направление к врагу от центра полукруга
        const dx = centerX - this._center.x;
        const dy = centerY - this._center.y;
        const norm = Math.sqrt(dx * dx + dy * dy) || 1;
        // Базовый угол — в сторону врага
        const ATTACK_ANGLE = Math.atan2(dy / norm, dx / norm);

        // Шампиньебы — передняя дуга
        const R_FRONT = 18;
        // Спорометы — средняя дуга
        const R_MID = 10;
        // Еблекари
        const R_BACK = 5;

        const arcSlots = (
            r: number,
            n: number,
            spreadRad: number,
            offsetAngle = 0,
        ): FormationSlotPos[] => {
            if (n === 0) return [];
            const slots: FormationSlotPos[] = [];
            for (let i = 0; i < n; i++) {
                const t = n > 1 ? (i / (n - 1) - 0.5) * spreadRad : 0;
                const angle = ATTACK_ANGLE + offsetAngle + t;
                const x = Math.round(this._center.x + r * Math.cos(angle));
                const y = Math.round(this._center.y + r * Math.sin(angle));
                if (x >= 0 && y >= 0 && x < this.mapCols && y < this.mapRows) {
                    if (this.isWalkable(x, y)) slots.push({ x, y });
                }
            }
            return slots;
    };

    result.champigneb = arcSlots(R_FRONT, counts.champigneb ?? 0, Math.PI * 0.9);
    result.sporomet   = arcSlots(R_MID,   counts.sporomet   ?? 0, Math.PI * 0.7);
    result.eblekar    = arcSlots(R_BACK,  counts.eblekar    ?? 0, Math.PI * 0.25, Math.PI);

    return result;
}
    private isWalkable(x: number, y: number): boolean {
        const tile = this.map[y]?.[x];
        return tile != null && WALKABLE_TILES.has(tile);
    }
}

export default FormationPlanner;
