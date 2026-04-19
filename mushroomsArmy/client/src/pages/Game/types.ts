// pages/Game/types.ts

/**
 * Тип местности на карте
 * 0 - равнина
 * 1 - вода
 * 2 - горы
 */
export type TerrainType = 0 | 1 | 2;

/**
 * Игровой юнит (споромёт или шампиньеб)
 * isAlive вычисляется: hp > 0
 */
export type Unit = {
  guid: string;               
  x: number;                
  y: number;                
  type: 'sporomet' | 'champigneb' | 'eblekar';
  hp: number;               
  maxHp: number;  
  isHealing?: boolean;          
};

/**
 * Здание (цель для армии грибов)
 */
export type Building = {
  guid: string;
  type: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  sizeX?: number;
  sizeY?: number;
  isExploding?: boolean;
  isAttacking?: boolean;
};

/**
 * Лужа слизи
 */
export type SlimePuddle = {
  x: number;               
  y: number;                
  radius: number;          
};

/**
 * Полное состояние игры
 */
export type GameState = {
  map: TerrainType[][];
  units: Unit[];
  buildings: Building[];
  slimePuddles: SlimePuddle[]; 
};