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
// Шаг между лекарями вдоль плеча L: stride 4 × SLOT_STEP 2 = 8 клеток.
// При переполнении inner L — формация раздувается чтобы все вошли.
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

        // Расширение: немедленно, пока юниты не помещаются ИЛИ inner L не вмещает
        // всех лекарей при шаге EBLEKAR_SLOT_STRIDE (иначе один лекарь оказался бы
        // без слота и убежал бы лечить раненых на 1-й линии).
        // Жёсткий потолок: формация не уходит дальше текущей линии обороны +
        // буфер до следующего тригера стены — армия держится у стены.
        const maxDefenseD = this.lastWallRingIdx * L_STEP + WALL_TRIGGER_RINGS * L_STEP;
        const eblekarStrideCapacity = (d: number): number =>
            Math.ceil(this.lShellCells(d).length / EBLEKAR_SLOT_STRIDE);
        while (
            (capacityAt(this.currentDStart) < total
             || eblekarStrideCapacity(this.currentDStart) < remaining.eblekar)
            && this.currentDStart + L_STEP < maxD
            && this.currentDStart + L_STEP <= maxDefenseD
        ) {
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

        // Лекари — на inner L (3-я линия фронта, в тылу за боевыми).
        // Распределяем по обоим плечам с шагом ~8 клеток (stride 2 слота).
        const innerArms = this.lShellArms(dStart);
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
        const baseShell = newWallRingIdx * L_STEP;
        // Fallback: если стена не замыкается на baseShell — пробуем чуть ближе/дальше.
        // Иначе деньги на постройку незамкнутой стены — впустую.
        for (const offset of [0, -1, 1, -2, 2]) {
            const shell = baseShell + offset;
            if (shell <= 0) continue;
            const wall = this.generateWallL(shell);
            if (wall.length > 0) {
                this.lastWallRingIdx = newWallRingIdx;
                return wall;
            }
        }
        return null;
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

    // Стена L по контуру защищённой зоны.
    // Враги ходят по равнине И по воде, гора непроходима. Алгоритм:
    //   1. Каждая клетка L-линии (top-arm y=topY, left-arm x=leftX):
    //      • равнина → стена;
    //      • гора/туман → пропуск (гора сама непроходима);
    //      • вода → flood-fill всего водоёма (по 4-связности) и стены на ВСЕХ
    //        равнинных клетках, 8-смежных с водоёмом, ВНУТРИ защищённой зоны.
    //   2. Верификация замкнутости: BFS из «снаружи L» через равнину+воду
    //      (стены непроходимы). Если достигли равнины ВНУТРИ L → дыра, не строим.
    private generateWallL(shellDist: number): FormationSlotPos[] {
        const topY  = this.baseWallTopY  - shellDist;
        const leftX = this.baseWallLeftX - shellDist;
        const rows = this.mapRows, cols = this.mapCols;

        const tileAt = (x: number, y: number): number | null | undefined =>
            (y < 0 || y >= rows || x < 0 || x >= cols) ? undefined : this.map[y]?.[x];
        const isInsideL = (x: number, y: number): boolean => x >= leftX && y >= topY;
        const key = (x: number, y: number): string => `${x},${y}`;

        const wallSet = new Set<string>();
        const enqueueWall = (x: number, y: number): void => {
            if (x < 0 || y < 0 || x >= cols || y >= rows) return;
            if (tileAt(x, y) !== 0) return;
            if (!isInsideL(x, y)) return;
            wallSet.add(key(x, y));
        };

        const visitedWater = new Set<string>();
        const NEIGHBORS_4: ReadonlyArray<readonly [number, number]> = [
            [1,0],[-1,0],[0,1],[0,-1],
        ];
        const encloseLake = (startX: number, startY: number): void => {
            const lake: Array<[number, number]> = [];
            const stack: Array<[number, number]> = [[startX, startY]];
            const seen = new Set<string>([key(startX, startY)]);
            while (stack.length > 0) {
                const cell = stack.pop()!;
                const [x, y] = cell;
                if (tileAt(x, y) !== 1) continue;
                lake.push(cell);
                for (const [dx, dy] of NEIGHBORS_4) {
                    const nx = x + dx, ny = y + dy;
                    const k = key(nx, ny);
                    if (seen.has(k)) continue;
                    seen.add(k);
                    if (tileAt(nx, ny) === 1) stack.push([nx, ny]);
                }
            }
            for (const [wx, wy] of lake) visitedWater.add(key(wx, wy));
            // 4-смежные равнины внутри L — на стену. Это минимальное замыкание
            // (соответствует 4-связному pathfinding'у врагов). Замкнутость
            // проверяется отдельно через isWallClosed.
            for (const [wx, wy] of lake) {
                for (const [dx, dy] of NEIGHBORS_4) enqueueWall(wx + dx, wy + dy);
            }
        };

        const processLLineCell = (x: number, y: number): void => {
            const t = tileAt(x, y);
            if (t === 0) enqueueWall(x, y);
            else if (t === 1 && !visitedWater.has(key(x, y))) encloseLake(x, y);
            // гора (2) / туман (null) / вне карты — пропуск
        };

        if (topY >= 0 && topY < rows) {
            const xStart = Math.max(0, leftX);
            for (let x = xStart; x < cols; x++) processLLineCell(x, topY);
        }
        if (leftX >= 0 && leftX < cols) {
            const yStart = Math.max(0, topY + 1);  // апекс уже обработан верхним плечом
            for (let y = yStart; y < rows; y++) processLLineCell(leftX, y);
        }

        // Верификация: BFS из «снаружи L» через равнину+воду (стены — препятствие).
        if (!this.isWallClosed(wallSet, topY, leftX)) return [];

        return [...wallSet].map(k => {
            const [x, y] = k.split(',').map(Number);
            return { x, y };
        });
    }

    // Проверяем что после установки стен ни одна равнинная клетка внутри L
    // не достижима из «снаружи L» (y < topY OR x < leftX) через равнину+воду.
    private isWallClosed(wallSet: ReadonlySet<string>, topY: number, leftX: number): boolean {
        const rows = this.mapRows, cols = this.mapCols;
        const key = (x: number, y: number): string => `${x},${y}`;
        const isPassable = (x: number, y: number): boolean => {
            if (x < 0 || y < 0 || x >= cols || y >= rows) return false;
            if (wallSet.has(key(x, y))) return false;
            const t = this.map[y]?.[x];
            return t === 0 || t === 1;
        };

        const visited = new Set<string>();
        const stack: Array<[number, number]> = [];
        // Seed: все проходимые клетки на границе «снаружи L».
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                if (x >= leftX && y >= topY) continue;  // только outside-L
                if (!isPassable(x, y)) continue;
                const k = key(x, y);
                if (visited.has(k)) continue;
                visited.add(k);
                stack.push([x, y]);
            }
        }
        const NEIGHBORS_4: ReadonlyArray<readonly [number, number]> = [
            [1,0],[-1,0],[0,1],[0,-1],
        ];
        while (stack.length > 0) {
            const [x, y] = stack.pop()!;
            // Достигли равнины ВНУТРИ L → дыра.
            if (x >= leftX && y >= topY && this.map[y]?.[x] === 0) return false;
            for (const [dx, dy] of NEIGHBORS_4) {
                const nx = x + dx, ny = y + dy;
                const k = key(nx, ny);
                if (visited.has(k)) continue;
                if (!isPassable(nx, ny)) continue;
                visited.add(k);
                stack.push([nx, ny]);
            }
        }
        return true;
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
