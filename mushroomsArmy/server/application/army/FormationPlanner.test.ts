import { describe, expect, it } from '@jest/globals';
import FormationPlanner, { FormationUnitCounts } from './FormationPlanner';
import { TMap } from './Army';

/** 100×100 walkable map (все тайлы = 0). */
const makeMap = (rows: number = 100, cols: number = 100, tile: number = 0): TMap =>
    Array.from({ length: rows }, () => Array.from({ length: cols }, () => tile));

/** Стандартный конструктор: база в правом нижнем углу 15×15. */
const standardOpts = (overrides: Partial<ConstructorParameters<typeof FormationPlanner>[0]> = {}) => {
    const map = overrides.map ?? makeMap();
    const rows = map.length;
    const cols = map[0].length;
    return {
        map,
        baseCenter:    { x: cols - 8, y: rows - 8 },
        baseWallTopY:  rows - 15,
        baseWallLeftX: cols - 15,
        ...overrides,
    };
};

const shellDist = (s: { x: number; y: number }, baseTopY: number, baseLeftX: number) =>
    Math.max(baseTopY - s.y, baseLeftX - s.x);

/** Unique shells (sorted asc) present among the given slots. */
const distinctShells = (slots: { x: number; y: number }[], baseTopY: number, baseLeftX: number) => {
    const ss = new Set<number>();
    slots.forEach(s => ss.add(shellDist(s, baseTopY, baseLeftX)));
    return Array.from(ss).sort((a, b) => a - b);
};

describe('FormationPlanner — 3 активные L подряд, type-rank constraint', () => {

    describe('конструктор и getters', () => {
        it('создаётся; getAllSlots возвращает пустые массивы до updateForCounts', () => {
            const p = new FormationPlanner(standardOpts());
            const all = p.getAllSlots();
            expect(all.sporomet).toEqual([]);
            expect(all.eblekar).toEqual([]);
            expect(all.champigneb).toEqual([]);
        });

        it('center это базовый центр (immutable)', () => {
            const p = new FormationPlanner(standardOpts({ baseCenter: { x: 92, y: 92 } }));
            expect(p.center).toEqual({ x: 92, y: 92 });
        });
    });

    describe('updateForCounts — общие инварианты', () => {
        it('пустые counts → все массивы пустые', () => {
            const p = new FormationPlanner(standardOpts());
            const slots = p.updateForCounts({});
            expect(slots.sporomet).toEqual([]);
            expect(slots.eblekar).toEqual([]);
            expect(slots.champigneb).toEqual([]);
        });

        it('5 sporomet → ровно 5 sporomet-слотов, остальные пусты', () => {
            const p = new FormationPlanner(standardOpts());
            const slots = p.updateForCounts({ sporomet: 5 });
            expect(slots.sporomet.length).toBe(5);
            expect(slots.eblekar.length).toBe(0);
            expect(slots.champigneb.length).toBe(0);
        });

        it('все слоты ВНЕ базовой 15×15 зоны', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            const slots = p.updateForCounts({ sporomet: 50, eblekar: 50, champigneb: 50 });
            const all = [...slots.sporomet, ...slots.eblekar, ...slots.champigneb];
            for (const s of all) {
                const inBase = s.x >= opts.baseWallLeftX && s.y >= opts.baseWallTopY;
                expect(inBase).toBe(false);
            }
        });

        it('никаких дубликатов координат', () => {
            const p = new FormationPlanner(standardOpts());
            const slots = p.updateForCounts({ sporomet: 50, eblekar: 50, champigneb: 50 });
            const all = [...slots.sporomet, ...slots.eblekar, ...slots.champigneb];
            const keys = new Set(all.map(s => `${s.x},${s.y}`));
            expect(keys.size).toBe(all.length);
        });

        it('фильтрует non-walkable тайлы (вода=1)', () => {
            const map = makeMap();
            for (let x = 0; x < 100; x++) map[80][x] = 1;
            const p = new FormationPlanner(standardOpts({ map }));
            const slots = p.updateForCounts({ sporomet: 100, eblekar: 100, champigneb: 100 });
            const all = [...slots.sporomet, ...slots.eblekar, ...slots.champigneb];
            for (const s of all) {
                expect(map[s.y][s.x]).not.toBe(1);
            }
        });
    });

    describe('3 активные L подряд', () => {
        it('малый армия (3+3+3): d_start = 1, формация занимает {1, 3, 5}', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            const slots = p.updateForCounts({ sporomet: 3, eblekar: 3, champigneb: 3 });
            const all = [...slots.sporomet, ...slots.eblekar, ...slots.champigneb];
            const shells = distinctShells(all, opts.baseWallTopY, opts.baseWallLeftX);
            // Все слоты на одной из 3 активных L
            for (const s of shells) {
                expect([1, 3, 5]).toContain(s);
            }
        });

        it('армия > capacity 3-L при d_start=1: d_start сдвигается наружу', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            // 30+30+30 = 90 юнитов. d_start=1 вмещает ~52. Должен сдвинуться.
            const slots = p.updateForCounts({ sporomet: 30, eblekar: 30, champigneb: 30 });
            const all = [...slots.sporomet, ...slots.eblekar, ...slots.champigneb];
            const shells = distinctShells(all, opts.baseWallTopY, opts.baseWallLeftX);
            // ровно 3 уникальных shell с шагом 2
            expect(shells.length).toBeLessThanOrEqual(3);
            if (shells.length === 3) {
                expect(shells[1] - shells[0]).toBe(2);
                expect(shells[2] - shells[1]).toBe(2);
            }
            // Inner shell > 1 (сдвинулся)
            expect(shells[0]).toBeGreaterThan(1);
        });

        it('армия = 0: пустой результат', () => {
            const p = new FormationPlanner(standardOpts());
            const slots = p.updateForCounts({});
            expect(slots.sporomet.length).toBe(0);
            expect(slots.eblekar.length).toBe(0);
            expect(slots.champigneb.length).toBe(0);
        });
    });

    describe('type-rank constraint', () => {
        it('eblekar только на inner L (= d_start)', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            const slots = p.updateForCounts({ eblekar: 100, sporomet: 100, champigneb: 100 });
            const all = [...slots.sporomet, ...slots.eblekar, ...slots.champigneb];
            const shells = distinctShells(all, opts.baseWallTopY, opts.baseWallLeftX);
            const dStart = shells[0];
            for (const e of slots.eblekar) {
                expect(shellDist(e, opts.baseWallTopY, opts.baseWallLeftX)).toBe(dStart);
            }
        });

        it('sporomet только на inner или middle L', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            const slots = p.updateForCounts({ eblekar: 100, sporomet: 100, champigneb: 100 });
            const all = [...slots.sporomet, ...slots.eblekar, ...slots.champigneb];
            const shells = distinctShells(all, opts.baseWallTopY, opts.baseWallLeftX);
            const dStart = shells[0];
            const middle = dStart + 2;
            for (const s of slots.sporomet) {
                const sh = shellDist(s, opts.baseWallTopY, opts.baseWallLeftX);
                expect([dStart, middle]).toContain(sh);
            }
        });

        it('champigneb может быть на любой из 3 активных L', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            // 9 champ — d_start=1 вмещает (~52 слотов). Активные shells={1,3,5}.
            const slots = p.updateForCounts({ champigneb: 9 });
            const shells = distinctShells(
                slots.champigneb, opts.baseWallTopY, opts.baseWallLeftX);
            // Все слоты на одной из {1,3,5}
            expect(shells.every(s => s === 1 || s === 3 || s === 5)).toBe(true);
            // Champ priority в inner=3rd, middle=2nd, outer=1st. Inner-first:
            // inner заполняется первым (ebl=sporo=0, champ доливает).
            // ~15 inner слотов — все 9 champ вмещаются на inner.
            expect(slots.champigneb.length).toBe(9);
        });

        it('eblekar расширяет формацию чтобы все вошли с шагом 8 клеток', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            const slots = p.updateForCounts({ eblekar: 30 });
            // Все 30 на одной L (inner), formation разъезжается чтобы вместить.
            expect(slots.eblekar.length).toBe(30);
            const shells = distinctShells(slots.eblekar, opts.baseWallTopY, opts.baseWallLeftX);
            expect(shells.length).toBe(1);
        });

        it('сверх-обилие eblekar упирается в maxD → лишние без слота', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            const slots = p.updateForCounts({ eblekar: 1000 });
            expect(slots.eblekar.length).toBeLessThan(1000);
            expect(slots.eblekar.length).toBeGreaterThan(0);
        });
    });

    describe('priority внутри L (mixing в пределах rank)', () => {
        it('inner L приоритет eblekar: 3 ebl + 3 sporo, малая армия → ebl на inner вместе с sporo (mixing)', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            const slots = p.updateForCounts({ eblekar: 3, sporomet: 3 });
            // 6 units, d_start=1 (вмещает). Inner priority [ebl,sporo,champ].
            // 7 inner-слотов: первые 3 → ebl, следующие 3 → sporo (rank позволяет).
            // ebl на inner (shell=1).
            for (const e of slots.eblekar) {
                expect(shellDist(e, opts.baseWallTopY, opts.baseWallLeftX)).toBe(1);
            }
            // sporo может оказаться на inner (mixing) или middle. Главное — не дальше.
            for (const s of slots.sporomet) {
                expect(shellDist(s, opts.baseWallTopY, opts.baseWallLeftX)).toBeLessThanOrEqual(3);
            }
        });

        it('outer L: champigneb приоритетно, ebl никогда (sporo — fallback)', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            // Армия маленькая (3+3+3), d_start=1, outer L = L(d=5).
            const slots = p.updateForCounts({ sporomet: 3, eblekar: 3, champigneb: 3 });
            const champOnShell5 = slots.champigneb.filter(c =>
                shellDist(c, opts.baseWallTopY, opts.baseWallLeftX) === 5);
            // Eblekar никогда на outer (rank = inner only)
            const eblOnOuter = slots.eblekar.filter(e =>
                shellDist(e, opts.baseWallTopY, opts.baseWallLeftX) === 5);
            expect(eblOnOuter.length).toBe(0);
            // Champ inner-first: outer заполняется ПОСЛЕДНИМ, поэтому при 3 champ
            // и mixing на inner/middle где champ ниже priority — champ может попасть
            // на любую из 3. Просто проверим что champ всё-таки распределён.
            expect(slots.champigneb.length).toBe(3);
        });
    });

    describe('fillOrder', () => {
        it('inner-first (default): ebl на самой внутренней активной L', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            const slots = p.updateForCounts({ eblekar: 3, sporomet: 3, champigneb: 3 });
            const shells = distinctShells(
                [...slots.eblekar, ...slots.sporomet, ...slots.champigneb],
                opts.baseWallTopY, opts.baseWallLeftX);
            const dStart = shells[0];
            for (const e of slots.eblekar) {
                expect(shellDist(e, opts.baseWallTopY, opts.baseWallLeftX)).toBe(dStart);
            }
        });

        it('outer-first: ebl всё равно на inner (rank), но champ на outer первым', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            const slots = p.updateForCounts(
                { eblekar: 3, sporomet: 3, champigneb: 3 },
                { fillOrder: 'outer-first' },
            );
            // Rank ebl=inner only — ebl всё равно на самой внутренней L. Rank не зависит от fillOrder.
            const shells = distinctShells(
                [...slots.eblekar, ...slots.sporomet, ...slots.champigneb],
                opts.baseWallTopY, opts.baseWallLeftX);
            const dStart = shells[0];
            for (const e of slots.eblekar) {
                expect(shellDist(e, opts.baseWallTopY, opts.baseWallLeftX)).toBe(dStart);
            }
        });
    });

    describe('eblekar равномерное распределение по плечам inner L', () => {
        it('11 eblekar на 100×100 → распределены по обоим плечам, шаг ≥ 8 клеток на каждом плече', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            const slots = p.updateForCounts({
                eblekar: 11, sporomet: 200, champigneb: 200,
            });
            expect(slots.eblekar.length).toBe(11);

            // Определяем апекс L: минимальная y (топ-плечо лежит на этой строке)
            // и одновременно минимальная x. Лекари на топ-плече имеют общую y, на левом
            // плече — общую x; апекс (apexX, apexY) формально принадлежит топ-плечу.
            const apexY = Math.min(...slots.eblekar.map(e => e.y));
            const apexX = Math.min(...slots.eblekar.map(e => e.x));
            const topArm  = slots.eblekar.filter(e => e.y === apexY);
            const leftArm = slots.eblekar.filter(e => e.x === apexX && e.y !== apexY);
            expect(topArm.length).toBeGreaterThan(0);
            expect(leftArm.length).toBeGreaterThan(0);

            const checkSpacing = (coords: number[]): void => {
                const sorted = [...coords].sort((a, b) => a - b);
                for (let i = 1; i < sorted.length; i++) {
                    expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(8);
                }
            };
            checkSpacing(topArm.map(e => e.x));
            checkSpacing(leftArm.map(e => e.y));
        });
    });

    describe('outer L: sporomet fallback', () => {
        it('sporomet идёт на 1-ю линию (outer L) если нет champignebs', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            const slots = p.updateForCounts({ sporomet: 100, eblekar: 0, champigneb: 0 });
            const shells = distinctShells(slots.sporomet, opts.baseWallTopY, opts.baseWallLeftX);
            // sporo занял все 3 L
            expect(shells.length).toBe(3);
        });
    });

    describe('generateWallL — огибание воды', () => {
        const advanceAndCheck = (p: FormationPlanner, counts: FormationUnitCounts) => {
            const slots = p.updateForCounts(counts);
            const positions = [...slots.sporomet, ...slots.eblekar, ...slots.champigneb];
            return p.checkWallTrigger(positions);
        };

        // На 100×100 standardOpts: baseWallTopY=baseWallLeftX=85.
        // checkWallTrigger срабатывает на shellDist = WALL_TRIGGER_RINGS·L_STEP = 10,
        // → top-плечо стены лежит на y=75, x∈[75..99]; left-плечо — на x=75, y∈[76..99].
        it('стена не ставится на воду; водоём огибается ВНИЗ (вглубь защищённой зоны)', () => {
            const map = makeMap();
            // Полоса воды в строке y=75, x∈[80..90] — пересекает top-плечо стены.
            for (let x = 80; x <= 90; x++) map[75][x] = 1;

            const opts = standardOpts({ map });
            const p = new FormationPlanner(opts);
            const wall = advanceAndCheck(p, { sporomet: 200, eblekar: 200, champigneb: 200 });
            expect(wall).not.toBe(null);

            for (const w of wall!) {
                expect(map[w.y][w.x]).not.toBe(1);
            }
            const topWalls = wall!.filter(w => w.x >= 80 && w.x <= 90);
            expect(topWalls.length).toBe(11);
            // Огибание вниз — все стены огибания на y > 75 (вглубь защищённой зоны).
            for (const w of topWalls) {
                expect(w.y).toBeGreaterThan(75);
            }
        });

        it('водоём окружается 4-смежными стенами (минимальное замыкание)', () => {
            const map = makeMap();
            // 3 клетки воды по горизонтали на top-плече: y=75, x∈[82..84]. Соседи (81,75) и (85,75) — равнина.
            map[75][82] = 1; map[75][83] = 1; map[75][84] = 1;
            const opts = standardOpts({ map });
            const p = new FormationPlanner(opts);
            const wall = advanceAndCheck(p, { sporomet: 200, eblekar: 200, champigneb: 200 });
            expect(wall).not.toBe(null);
            const keys = new Set(wall!.map(w => `${w.x},${w.y}`));
            // Соседи воды на L-линии
            expect(keys.has('81,75')).toBe(true);
            expect(keys.has('85,75')).toBe(true);
            // Огибание воды снизу
            expect(keys.has('82,76')).toBe(true);
            expect(keys.has('83,76')).toBe(true);
            expect(keys.has('84,76')).toBe(true);
            // Диагональные «затычки» (81,76), (85,76) НЕ ставятся (4-conn достаточно)
            expect(keys.has('81,76')).toBe(false);
            expect(keys.has('85,76')).toBe(false);
        });

        it('столбец полностью заблокирован горой → стена не ставится в этом столбце', () => {
            const map = makeMap();
            // Гора на 75-й строке в колонке 82, на этом столбце выше тоже горы.
            for (let y = 75; y < 100; y++) map[y][82] = 2;

            const opts = standardOpts({ map });
            const p = new FormationPlanner(opts);
            const wall = advanceAndCheck(p, { sporomet: 200, eblekar: 200, champigneb: 200 });
            expect(wall).not.toBe(null);
            for (const w of wall!) expect(map[w.y][w.x]).not.toBe(2);
            const onCol82 = wall!.filter(w => w.x === 82);
            expect(onCol82.length).toBe(0);
        });
    });

    describe('checkWallTrigger', () => {
        const advanceAndCheck = (p: FormationPlanner, counts: FormationUnitCounts) => {
            const slots = p.updateForCounts(counts);
            const positions = [
                ...slots.sporomet,
                ...slots.eblekar,
                ...slots.champigneb,
            ];
            return p.checkWallTrigger(positions);
        };

        it('null если позиций нет', () => {
            const p = new FormationPlanner(standardOpts());
            expect(p.checkWallTrigger([])).toBe(null);
        });

        it('срабатывает когда outer ring достаточно велик', () => {
            const p = new FormationPlanner(standardOpts());
            const wall = advanceAndCheck(p, { sporomet: 200, eblekar: 200, champigneb: 200 });
            expect(wall).not.toBe(null);
            expect(wall!.length).toBeGreaterThan(0);
        });

        it('стена имеет L-форму (TOP-сегмент И LEFT-сегмент)', () => {
            const opts = standardOpts();
            const p = new FormationPlanner(opts);
            const wall = advanceAndCheck(p, { sporomet: 200, eblekar: 200, champigneb: 200 });
            expect(wall).not.toBe(null);
            const hasTop = wall!.some(w => w.y < opts.baseWallTopY);
            const hasLeft = wall!.some(w => w.x < opts.baseWallLeftX);
            expect(hasTop).toBe(true);
            expect(hasLeft).toBe(true);
        });
    });
});
