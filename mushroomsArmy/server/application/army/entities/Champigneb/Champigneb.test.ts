import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import Champigneb from './Champigneb';
import Unit, { TUnitOptions } from '../Units';
import { TMap } from '../../Army';

/** Вспомогательный тип для доступа к protected членам в тестах */
interface ITChampignebTestable {
    enemies: Unit[];
    targetX: number;
    targetY: number;
    onEnemyFound(enemy: Unit, distance: number): void;
    explode(): void;
}

const defaultOptions: TUnitOptions = {
    guid: 'test-champigneb-1',
    type: 'champigneb',
    x: 20,
    y: 20,
    hp: 35,
    speed: 3,
    attackRange: 6,
};

describe('Champigneb', () => {
    let champigneb: Champigneb;

    beforeEach(() => {
        champigneb = new Champigneb(defaultOptions);
    });

    it('параметры при создании соответствуют переданным в конструктор', () => {
        expect(champigneb.guid).toBe('test-champigneb-1');
        expect(champigneb.type).toBe('champigneb');
        expect(champigneb.x).toBe(20);
        expect(champigneb.y).toBe(20);
        expect(champigneb.hp).toBe(35);
        expect(champigneb.speed).toBe(3);
        expect(champigneb.attackRange).toBe(6);
        expect(typeof champigneb.hp).toBe('number');
    });

    it('leashRadius=20 — поводок к formationTarget, чтобы champigneb не убегал за дальними врагами', () => {
        expect(champigneb.leashRadius).toBe(20);
    });

    it('baseHp равен 35', () => {
        expect(champigneb.baseHp).toBe(35);
    });

    it('константы взрыва установлены верно', () => {
        expect(champigneb.explosionRadius).toBe(6);
        expect(champigneb.explosionDamage).toBe(60);
        expect(champigneb.slimeDuration).toBe(10);
    });

    it('начальное состояние слизи и флага взрыва', () => {
        expect(champigneb.slimePuddle).toEqual({ x: 0, y: 0, radius: 0, ttl: 0 });
        expect(champigneb.hasExploded).toBe(false);
        expect(champigneb.isAlive).toBe(true);
    });

    it('getState() возвращает корректный объект состояния', () => {
        const state = champigneb.getState();
        expect(state.type).toBe('champigneb');
        expect(state.guid).toBe('test-champigneb-1');
        expect(state.hp).toBe(35);
        expect(state.x).toBe(20);
        expect(state.y).toBe(20);
    });

    it('takeDamage(10) снижает hp на 10', () => {
        champigneb.takeDamage(10);
        expect(champigneb.hp).toBe(25);
        expect(champigneb.isAlive).toBe(true);
        expect(champigneb.hasExploded).toBe(false);
    });

    it('takeDamage(35) убивает чампигнеба и вызывает взрыв (onDeath → explode)', () => {
        champigneb.takeDamage(35);
        expect(champigneb.hp).toBe(0);
        expect(champigneb.isAlive).toBe(false);
        expect(champigneb.hasExploded).toBe(true);
        expect(champigneb.slimePuddle.radius).toBe(6);
        expect(champigneb.slimePuddle.ttl).toBe(10);
        expect(champigneb.slimePuddle.x).toBe(20);
        expect(champigneb.slimePuddle.y).toBe(20);
    });

    it('takeDamage с отрицательным уроном не изменяет hp', () => {
        champigneb.takeDamage(-5);
        expect(champigneb.hp).toBe(35);
        expect(champigneb.isAlive).toBe(true);
        expect(champigneb.hasExploded).toBe(false);
    });

    it('onEnemyFound при дистанции < 6 вызывает взрыв и наносит урон ближним врагам', () => {
        const near = {
            x: 22,
            y: 20,
            isAlive: true,
            takeDamage: jest.fn(),
        } as unknown as Unit;
        const far = {
            x: 30,
            y: 20,
            isAlive: true,
            takeDamage: jest.fn(),
        } as unknown as Unit;

        (champigneb as unknown as ITChampignebTestable).enemies = [near, far];
        (champigneb as unknown as ITChampignebTestable).onEnemyFound(near, 3);

        expect(near.takeDamage).toHaveBeenCalledTimes(1);
        expect(near.takeDamage).toHaveBeenCalledWith(60);
        expect(far.takeDamage).not.toHaveBeenCalled();
        expect(champigneb.hasExploded).toBe(true);
        expect(champigneb.isAlive).toBe(false);
        expect(champigneb.slimePuddle).toEqual({ x: 20, y: 20, radius: 6, ttl: 10 });
    });

    it('onEnemyFound при дистанции >= 6 не вызывает взрыв, но обновляет цель', () => {
        const enemy = {
            x: 30,
            y: 20,
            isAlive: true,
            takeDamage: jest.fn(),
        } as unknown as Unit;

        (champigneb as unknown as ITChampignebTestable).enemies = [enemy];
        (champigneb as unknown as ITChampignebTestable).onEnemyFound(enemy, 10);

        expect(champigneb.hasExploded).toBe(false);
        expect(champigneb.isAlive).toBe(true);
        expect((champigneb as unknown as ITChampignebTestable).targetX).toBe(30);
        expect((champigneb as unknown as ITChampignebTestable).targetY).toBe(20);
        expect(enemy.takeDamage).not.toHaveBeenCalled();
    });

    it('повторный explode() ничего не делает (защита hasExploded)', () => {
        const enemy = {
            x: 22,
            y: 20,
            isAlive: true,
            takeDamage: jest.fn(),
        } as unknown as Unit;

        (champigneb as unknown as ITChampignebTestable).enemies = [enemy];
        (champigneb as unknown as ITChampignebTestable).explode();

        expect(enemy.takeDamage).toHaveBeenCalledTimes(1);
        const slimeAfterFirst = { ...champigneb.slimePuddle };

        (champigneb as unknown as ITChampignebTestable).explode();

        expect(enemy.takeDamage).toHaveBeenCalledTimes(1);
        expect(champigneb.slimePuddle).toEqual(slimeAfterFirst);
    });

    it('взрыв не наносит урон врагам за пределами explosionRadius', () => {
        const outOfRange = {
            x: 27,
            y: 20,
            isAlive: true,
            takeDamage: jest.fn(),
        } as unknown as Unit;

        (champigneb as unknown as ITChampignebTestable).enemies = [outOfRange];
        (champigneb as unknown as ITChampignebTestable).explode();

        expect(outOfRange.takeDamage).not.toHaveBeenCalled();
        expect(champigneb.hasExploded).toBe(true);
    });

    it('мёртвый юнит не реагирует на update', () => {
        const enemy = {
            x: 22,
            y: 20,
            isAlive: true,
            takeDamage: jest.fn(),
        } as unknown as Unit;

        champigneb.takeDamage(35);
        expect(champigneb.isAlive).toBe(false);

        const originalX = champigneb.x;
        expect(() => {
            champigneb.update([enemy], [] as TMap, 1);
        }).not.toThrow();
        expect(champigneb.x).toBe(originalX);
    });
});
