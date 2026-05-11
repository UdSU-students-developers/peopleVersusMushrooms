import Eblekar from './Eblekar';
import { TUnitOptions } from '../Units';

const defaultOptions: TUnitOptions = {
    guid: 'test-eblekar-1',
    type: 'eblekar',
    x: 5,
    y: 5,
    hp: 40,
    speed: 1,
    attackRange: 10,
};

describe('Eblekar', () => {
    let eblekar: Eblekar;

    beforeEach(() => {
        eblekar = new Eblekar(defaultOptions);
    });

    it('hp при создании равен 40', () => {
        expect(eblekar.hp).toBe(40);
        expect(eblekar.hp).toBeGreaterThan(0);
        expect(typeof eblekar.hp).toBe('number');
    });

    it('speed при создании равен 1', () => {
        expect(eblekar.speed).toBe(1);
        expect(eblekar.speed).toBeGreaterThan(0);
        expect(typeof eblekar.speed).toBe('number');
        expect(eblekar.speed).not.toBeNaN();
        expect(eblekar.speed).not.toBeUndefined();
    });

    it('attackRange при создании равен 10', () => {
        expect(eblekar.attackRange).toBe(10);
        expect(eblekar.attackRange).toBeGreaterThan(0);
        expect(typeof eblekar.attackRange).toBe('number');
        expect(eblekar.attackRange).not.toBeNaN();
        expect(eblekar.attackRange).not.toBeUndefined();
    });

    it('isAlive при создании равен true', () => {
        expect(eblekar.isAlive).toBe(true);
        expect(typeof eblekar.isAlive).toBe('boolean');
        expect(eblekar.isAlive).not.toBeUndefined();
        expect(eblekar.isAlive).not.toBeNull();
        expect(eblekar.isAlive).toBeTruthy();
    });

    it('guid совпадает с переданным в конструктор', () => {
        expect(eblekar.guid).toBe('test-eblekar-1');
        expect(typeof eblekar.guid).toBe('string');
        expect(eblekar.guid.length).toBeGreaterThan(0);
        expect(eblekar.guid).not.toBeNull();
        expect(eblekar.guid).not.toBeUndefined();
    });

    it('getState() возвращает корректные поля', () => {
        const state = eblekar.getState();
        expect(state.type).toBe('eblekar');
        expect(state.guid).toBe('test-eblekar-1');
        expect(state.hp).toBe(40);
        expect(state.x).toBe(5);
    });

    it('takeDamage(40) убивает Эблекара', () => {
        eblekar.takeDamage(40);
        expect(eblekar.isAlive).toBe(false);
        expect(eblekar.hp).toBe(0);
        expect(eblekar.hp).not.toBeGreaterThan(0);
        expect(eblekar.isAlive).not.toBe(true);
        expect(typeof eblekar.isAlive).toBe('boolean');
    });
});
