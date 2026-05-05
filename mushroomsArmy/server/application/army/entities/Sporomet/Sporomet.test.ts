import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import Sporomet from './Sporomet';
import Unit from '../Units';

const defaultOptions = {
    guid: 'test-sporomet-1',
    x: 50,
    y: 50,
    hp: 8,
    maxHp: 8,
    speed: 1,
    attackRange: 12,
    type: 'sporomet',
};


describe('Sporomet', () => {
    let sporomet: Sporomet;

    beforeEach(() => {
        sporomet = new Sporomet(defaultOptions);
        jest.useFakeTimers();
    });

    
    it('параметры при создании соответствуют переданным в конструктор', () => {
        expect(sporomet.guid).toBe('test-sporomet-1');
        expect(sporomet.hp).toBe(8);
        expect(sporomet.maxHp).toBe(8);
        expect(sporomet.x).toBe(50);
        expect(sporomet.y).toBe(50);
        expect(sporomet.speed).toBe(1);
        expect(sporomet.attackRange).toBe(12);
        expect(typeof sporomet.hp).toBe('number');
    });

    it('константы характеристик установлены верно', () => {
        expect(sporomet.retreatRange).toBe(8);
        expect(sporomet.cooldown).toBe(2);
        expect(sporomet.aimTime).toBe(0.5);
        expect(sporomet.attackDamage).toBe(5);
        expect(sporomet.poisonDuration).toBe(10);
        expect(sporomet.poisonDamagePerSecond).toBe(10);
    });

    it('getState() возвращает корректный объект состояния', () => {
        const state = sporomet.getState();
        expect(state.type).toBe('sporomet');
        expect(state.guid).toBe('test-sporomet-1');
        expect(state.hp).toBe(8);
        expect(state.maxHp).toBe(8);
        expect(state.x).toBe(50);
        expect(state.y).toBe(50);
    });

    it('takeDamage(5) снижает hp на 5', () => {
        sporomet.takeDamage(5, 'physical');
        expect(sporomet.hp).toBe(3);
        expect(sporomet.isAlive).toBe(true);
    });

    it('takeDamage(8) убивает споромета', () => {
        sporomet.takeDamage(8, 'physical');
        expect(sporomet.hp).toBe(0);
        expect(sporomet.isAlive).toBe(false);
    });

    it('takeDamage с отрицательным уроном не изменяет hp', () => {
        sporomet.takeDamage(-10, 'physical');
        expect(sporomet.hp).toBe(8);
    });

    it('урон не наносится, если споромет мертв', () => {
        const enemy = {
            x: 60,
            y: 50,
            isAlive: true,
            takeDamage: jest.fn(),
            poisonEffects: [],
        } as unknown as Unit;
        
        sporomet.takeDamage(8, 'physical');
        sporomet.update([enemy], [] as any, 5);
        expect(enemy.takeDamage).not.toHaveBeenCalled();
    });

    it('sporomet стреляет во врага в зоне атаки после прицеливания', () => {
        const enemy = {
            guid: 'enemy-1',
            x: 58,
            y: 50,
            hp: 100,
            isAlive: true,
            takeDamage: jest.fn(),
            poisonEffects: [],
        } as unknown as Unit;
        
        (sporomet as any).isAiming = true;
        (sporomet as any).currentTarget = enemy;
        
        sporomet.update([enemy], [] as any, 0.6);
        
        expect((sporomet as any).isAiming).toBe(false);
        expect((sporomet as any).currentTarget).toBe(null);

    });

    it('sporomet применяет эффект яда при попадании', () => {
        const enemy = {
            guid: 'enemy-1',
            x: 60,
            y: 50,
            hp: 100,
            maxHp: 100,
            isAlive: true,
            takeDamage: jest.fn(),
            poisonEffects: [],
        } as unknown as Unit;
        
        (sporomet as any).shoot(enemy);
        
        expect(enemy.poisonEffects).toHaveLength(1);
        expect(enemy.poisonEffects[0]).toMatchObject({
            duration: 10,
            damagePerSecond: 10,
            sourceGuid: 'test-sporomet-1',
        });
    });

    it('яд наносит урон с течением времени', () => {
        const enemy = {
            guid: 'enemy-1',
            x: 60,
            y: 50,
            hp: 100,
            maxHp: 100,
            isAlive: true,
            takeDamage: jest.fn(),
            poisonEffects: [{
                duration: 10,
                damagePerSecond: 10,
                sourceGuid: 'test-sporomet-1',
            }],
        } as unknown as Unit;
        
        sporomet.update([enemy], [] as any, 0.5);
        
        expect(enemy.takeDamage).toHaveBeenCalledWith(5, 'poison');
    });

    it('sporomet отступает, если враг слишком близко (дистанция < retreatRange)', () => {
        const enemy = {
            guid: 'enemy-1',
            x: 55,
            y: 50,
            isAlive: true,
        } as Unit;
        
        // Находим врага на дистанции 5
        (sporomet as any).onEnemyFound(enemy, 5);
        
        // Должен отступить от врага (targetX смещается в сторону от врага)
        expect((sporomet as any).targetX).toBeLessThan(50);
        expect((sporomet as any).isAiming).toBe(false);
        expect((sporomet as any).currentTarget).toBe(null);
    });

   it('sporomet не стреляет, если цель вне радиуса атаки', () => {
        const enemy = {
            guid: 'enemy-1',
            x: 70,
            y: 50,
            isAlive: true,
            takeDamage: jest.fn(),
            poisonEffects: [],
        } as unknown as Unit;

        (sporomet as any).isAiming = true;
        (sporomet as any).currentTarget = enemy;

        const initialProjectilesCount = sporomet.projectiles.length;

        sporomet.update([enemy], [] as any, 0.1);

        expect((sporomet as any).isAiming).toBe(false);
        expect((sporomet as any).currentTarget).toBe(null);
        expect(sporomet.projectiles.length).toBe(initialProjectilesCount);
    });

    it('sporomet перестает целиться, если цель умерла во время прицеливания', () => {
        const enemy = {
            guid: 'enemy-1',
            x: 58,
            y: 50,
            isAlive: false,
            takeDamage: jest.fn(),
        } as unknown as Unit;
        
        (sporomet as any).isAiming = true;
        (sporomet as any).currentTarget = enemy;
        
        sporomet.update([enemy], [] as any, 0.1);
        
        expect((sporomet as any).isAiming).toBe(false);
        expect((sporomet as any).currentTarget).toBe(null);
    });

    it('споромет создает снаряд при выстреле', () => {
        const enemy = {
            guid: 'enemy-1',
            x: 60,
            y: 50,
            hp: 100,
            isAlive: true,
            takeDamage: jest.fn(),
            poisonEffects: [],
        } as unknown as Unit;
        
        const initialProjectilesCount = sporomet.projectiles.length;
        (sporomet as any).shoot(enemy);
        
        expect(sporomet.projectiles.length).toBe(initialProjectilesCount + 1);
        expect(sporomet.projectiles[initialProjectilesCount]).toMatchObject({
            type: 'sporomet',
            fromX: 50,
            fromY: 50,
            toX: 60,
            toY: 50,
        });
    });

    it('повторное отравление обновляет длительность яда', () => {
        const enemy = {
            guid: 'enemy-1',
            x: 60,
            y: 50,
            hp: 100,
            maxHp: 100,
            isAlive: true,
            takeDamage: jest.fn(),
            poisonEffects: [{
                duration: 3,
                damagePerSecond: 10,
                sourceGuid: 'test-sporomet-1',
            }],
        } as unknown as Unit;
        
        (sporomet as any).shoot(enemy);
        
        expect(enemy.poisonEffects).toHaveLength(1);
        expect(enemy.poisonEffects[0].duration).toBe(10);
    });

    it('споромет не двигается, если находится на оптимальной дистанции', () => {
        const enemy = {
            guid: 'enemy-1',
            x: 60,
            y: 50,
            isAlive: true,
        } as Unit;
        
        // Оптимальная дистанция: (retreatRange + attackRange) / 2 = 10
        (sporomet as any).onEnemyFound(enemy, 10);
        
        expect((sporomet as any).targetX).toBe(50);
        expect((sporomet as any).targetY).toBe(50);
    });

    it('споромет корректно обрабатывает пустой массив врагов', () => {
        expect(() => {
            sporomet.update([], [] as any, 0.1);
        }).not.toThrow();
        expect(sporomet.isAlive).toBe(true);
    });

    it('споромет получает повышенный урон от огня', () => {
        const initialHp = sporomet.hp;
        sporomet.takeDamage(4, 'fire');
        expect(sporomet.hp).toBe(initialHp - 8);
    });

    it('споромет умирает и перестает реагировать на обновления', () => {
        const enemy = {
            x: 60,
            y: 50,
            isAlive: true,
            takeDamage: jest.fn(),
        } as unknown as Unit;
        
        sporomet.takeDamage(8, 'physical');
        expect(sporomet.isAlive).toBe(false);
        
        // Пытаемся обновить мертвого споромета
        const originalX = sporomet.x;
        sporomet.update([enemy], [] as any, 1);
        
        expect(sporomet.x).toBe(originalX);
        expect(enemy.takeDamage).not.toHaveBeenCalled();
    });


  
});