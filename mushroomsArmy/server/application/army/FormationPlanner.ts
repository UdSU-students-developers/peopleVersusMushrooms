import { TMap } from './Army';

export type FormationUnitType = 'sporomet' | 'eblekar' | 'champigneb';

export type FormationSlotPos = { x: number; y: number };

export type FormationUnitCounts = Partial<Record<FormationUnitType, number>>;

export type FormationFillOrder = 'inner-first' | 'outer-first';

/** Расстояние последней построенной L-стены взрывоморов от угла базы. */
export type FormationPlannerUpdateOpts = {
    fillOrder?: FormationFillOrder;
    /** Режим обороны: формация не уходит дальше последней стены взрывоморов. */
    defenseHold?: boolean;
};

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
// Шаг между лекарями вдоль плеча L: stride 4 × SLOT_STEP 2 = 8 клеток.
const EBLEKAR_SLOT_STRIDE = 4;

// Авторитетная семантика: L-кольца вокруг угла базы,
// 3 активные L подряд, type-rank, wave-fill.
export class FormationPlanner {
    private readonly _center: Readonly<{ x: number; y: number }>;
    private readonly map: TMap;
    private readonly baseWallTopY: number;
    private readonly baseWallLeftX: number;
    private readonly mapRows: number;
    private readonly mapCols: number;

    // Текущий радиус формации (d_start). В оборонительном режиме всегда MIN_D.
    private currentDStart: number = MIN_D;
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
        opts: FormationPlannerUpdateOpts = {},
    ): Record<FormationUnitType, FormationSlotPos[]> {
        const fillOrder: FormationFillOrder = opts.fillOrder ?? 'inner-first';
        const defenseHold = opts.defenseHold ?? false;

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

        // В оборонительном режиме армия всегда стоит у базы на фиксированных 3 кольцах
        this.currentDStart = MIN_D;

        // Используем 3 фиксированных кольца на минимальном расстоянии
        const innerCells = this.lShellCells(MIN_D);
        const middleCells = this.lShellCells(MIN_D + L_STEP);
        const outerCells = this.lShellCells(MIN_D + 2 * L_STEP);

        // Лекари — на inner L (3-я линия фронта, в тылу за боевыми).
        // Распределяем по обоим плечам с шагом ~8 клеток (stride 2 слота).
        const innerArms = this.lShellArms(MIN_D);
        const eblekarCells = this.distributeEblekars(innerArms, remaining.eblekar);
        result.eblekar.push(...eblekarCells);
        remaining.eblekar -= eblekarCells.length;
        const eblekarKeys = new Set(eblekarCells.map(c => `${c.x},${c.y}`));
        const innerCellsForOthers = innerCells.filter(c => !eblekarKeys.has(`${c.x},${c.y}`));

        type LSpec = {
            cells: FormationSlotPos[];
            priority: ReadonlyArray<FormationUnitType>;
        };
        const Ls: LSpec[] = [
            { cells: innerCellsForOthers, priority: ['sporomet', 'champigneb'] },
            { cells: middleCells,         priority: ['sporomet', 'champigneb'] },
            { cells: outerCells,          priority: ['champigneb', 'sporomet'] },
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

    // -- private helpers --

    // Lattice-слоты L(d), отдельно по top и left плечам (в порядке от апекса).
    private lShellArms(d: number): { top: FormationSlotPos[]; left: FormationSlotPos[] } {
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

        return { top, left };
    }

    // Wave-ordered lattice-слоты L(d): top[0], left[0], top[1], left[1]...
    // (apex входит в top[0] если он lattice-cell).
    private lShellCells(d: number): FormationSlotPos[] {
        const { top, left } = this.lShellArms(d);
        const result: FormationSlotPos[] = [];
        const maxLen = Math.max(top.length, left.length);
        for (let k = 0; k < maxLen; k++) {
            if (k < top.length)  result.push(top[k]);
            if (k < left.length) result.push(left[k]);
        }
        return result;
    }

    // Равномерно раскладываем лекарей по плечам inner L: основной проход
    // (offset=0, шаг 2 слота = 8 клеток между соседями), при переполнении —
    // в пропуски (offset=1, плотнее). Чередуем top/left, чтобы оба плеча
    // заполнялись параллельно.
    private distributeEblekars(
        arms: { top: ReadonlyArray<FormationSlotPos>; left: ReadonlyArray<FormationSlotPos> },
        count: number,
    ): FormationSlotPos[] {
        if (count <= 0) return [];
        const stride = EBLEKAR_SLOT_STRIDE;
        const pick = (arm: ReadonlyArray<FormationSlotPos>, offset: number): FormationSlotPos[] => {
            const out: FormationSlotPos[] = [];
            for (let i = offset; i < arm.length; i += stride) out.push(arm[i]);
            return out;
        };

        const result: FormationSlotPos[] = [];
        let remaining = count;
        for (let offset = 0; offset < stride && remaining > 0; offset++) {
            const topPicks  = pick(arms.top,  offset);
            const leftPicks = pick(arms.left, offset);
            const maxLen = Math.max(topPicks.length, leftPicks.length);
            for (let k = 0; k < maxLen && remaining > 0; k++) {
                if (k < topPicks.length  && remaining > 0) { result.push(topPicks[k]);  remaining--; }
                if (k < leftPicks.length && remaining > 0) { result.push(leftPicks[k]); remaining--; }
            }
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

    private isWalkable(x: number, y: number): boolean {
        const tile = this.map[y]?.[x];
        return tile != null && WALKABLE_TILES.has(tile);
    }
}

export default FormationPlanner;
