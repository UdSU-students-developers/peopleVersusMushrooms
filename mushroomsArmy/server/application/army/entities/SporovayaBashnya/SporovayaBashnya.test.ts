import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import SporovayaBashnya from './SporovayaBashnya';
import Unit from '../Units';

const defaultOptions = {
    guid: 'test-sporovaya-bashnya-1',
    x: 10,
    y: 15,
    hp: 100,
};

describe('SporovayaBashnya', () => {
    let bashnya: SporovayaBashnya;

    beforeEach(() => {
        bashnya = new SporovayaBashnya(defaultOptions);
    });

    it('параметры при создании соответствуют переданным в конструктор', () => {
        expect(bashnya.guid).toBe('test-sporovaya-bashnya-1');
        expect(bashnya.hp).toBe(100);
        expect(bashnya.x).toBe(10);
        expect(bashnya.y).toBe(15);
        expect(typeof bashnya.hp).toBe('number');
    });

    it('константы размера установлены верно (sizeX, sizeY = 2)', () => {
        expect(bashnya.sizeX).toBe(2);
        expect(bashnya.sizeY).toBe(2);
    });

    it('начальное состояние флагов корректно', () => {
        expect(bashnya.isAlive).toBe(true);
        expect(bashnya.isAttacking).toBe(false);
        expect(bashnya.isAlive).toBeTruthy();
    });

    it('getState() возвращает корректный объект состояния', () => {
        const state = bashnya.getState();
        expect(state.type).toBe('sporovaya_bashnya');
        expect(state.guid).toBe('test-sporovaya-bashnya-1');
        expect(state.sizeX).toBe(2);
        expect(state.isAlive).toBe(true);
        expect(state.hp).toBe(100);
    });

    it('takeDamage(50) снижает hp наполовину', () => {
        bashnya.takeDamage(50);
        expect(bashnya.hp).toBe(50);
        expect(bashnya.isAlive).toBe(true);
    });

    it('takeDamage(100) убивает башню', () => {
        bashnya.takeDamage(100);
        expect(bashnya.hp).toBe(0);
        expect(bashnya.isAlive).toBe(false);
        expect(bashnya.isAlive).not.toBeTruthy();
    });

    it('takeDamage(-10) не изменяет hp (защита от отрицательного урона)', () => {
        bashnya.takeDamage(-10);
        expect(bashnya.hp).toBe(100);
    });

    it('урон не наносится, если башня мертва', () => {
        const enemy = { 
            x: 11, 
            y: 11, 
            isAlive: true, 
            takeDamage: jest.fn() 
        } as unknown as Unit; 
        bashnya.takeDamage(100);
        bashnya.update([enemy], [] as any, 5);
        expect(enemy.takeDamage).not.toHaveBeenCalled();
    });
});