import {
  TERRAIN_SPRITES,
  MUSHROOM_SPRITES,
  SPRITE,
  getTerrainSprite,
  getMushroomSprite,
} from './Sprites';

describe('Константы спрайтов', () => {
  it('TERRAIN_SPRITES должны содержать ожидаемые значения', () => {
    expect(TERRAIN_SPRITES[0]).toBe(1);
    expect(TERRAIN_SPRITES[1]).toBe(2);
    expect(TERRAIN_SPRITES[2]).toBe(3);
    expect(TERRAIN_SPRITES['null']).toBe(7);
  });

  it('MUSHROOM_SPRITES должны содержать ожидаемые значения', () => {
    expect(MUSHROOM_SPRITES[1]).toBe(4);
    expect(MUSHROOM_SPRITES[2]).toBe(5);
    expect(MUSHROOM_SPRITES[3]).toBe(6);
  });

  it('SPRITE должен иметь корректный fallback и остальные ключи', () => {
    expect(SPRITE.FALLBACK).toBe(7);
    expect(SPRITE.LARVA).toBe(10);
    expect(SPRITE.SMALL_REACTOR).toBe(8);
    expect(SPRITE.REACTOR).toBe(8);
  });
});

describe('getTerrainSprite', () => {
  it('должен возвращать правильный спрайт для известных типов местности', () => {
    expect(getTerrainSprite(0)).toBe(1);
    expect(getTerrainSprite(1)).toBe(2);
    expect(getTerrainSprite(2)).toBe(3);
  });

  it('должен возвращать спрайт для null-местности, если тип null', () => {
    expect(getTerrainSprite(null)).toBe(7);
  });

  it('должен возвращать спрайт для null-местности, если тип undefined', () => {
    expect(getTerrainSprite(undefined as unknown as number | null)).toBe(7);
  });

  it('должен возвращать FALLBACK спрайт для неизвестного типа местности', () => {
    expect(getTerrainSprite(999)).toBe(SPRITE.FALLBACK);
    expect(getTerrainSprite(-1)).toBe(SPRITE.FALLBACK);
  });
});

describe('getMushroomSprite', () => {
  it('должен возвращать правильный спрайт для известных уровней грибов', () => {
    expect(getMushroomSprite(1)).toBe(4);
    expect(getMushroomSprite(2)).toBe(5);
    expect(getMushroomSprite(3)).toBe(6);
  });

  it('должен возвращать FALLBACK спрайт для неизвестного уровня грибов', () => {
    expect(getMushroomSprite(0)).toBe(SPRITE.FALLBACK);
    expect(getMushroomSprite(4)).toBe(SPRITE.FALLBACK);
    expect(getMushroomSprite(100)).toBe(SPRITE.FALLBACK);
  });
});