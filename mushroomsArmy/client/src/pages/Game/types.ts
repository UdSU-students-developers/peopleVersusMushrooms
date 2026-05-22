// pages/Game/types.ts

/**
 * Тип местности на карте
 * 0 - равнина
 * 1 - вода
 * 2 - горы
 */
export type TerrainType = 0 | 1 | 2;

export type MapTile = TerrainType | null;

/**
 * Игровой юнит (споромёт или шампиньеб)
 * isAlive вычисляется: hp > 0
 */
export type Unit = {
  guid: string;               
  x: number;                
  y: number;                
  type: 'sporomet' | 'champigneb' | 'eblekar' | 'pizdoglyad';
  hp: number;               
  visibility?: number;
  isHealing?: boolean;          
};

export type EnemyUnit = Omit<Unit, 'type'> & {
  type: string;
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
  level?: number;
  visibility?: number;
  sizeX?: number;
  sizeY?: number;
  isAlive?: boolean;
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

export type Projectile = {
  guid: string;
  type: 'sporomet' | 'sporovaya_bashnya' | 'eblekar';
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  createdAt: number;
};

/**
 * Юнит экономики грибов (личинка, геодезист)
 */
export type EconomyUnit = {
  guid: string;
  x: number;
  y: number;
  type: string;
  hp: number;
};

/**
 * Полное состояние игры
 */
export type GameState = {
  map: MapTile[][];
  units: Unit[];
  enemyUnits?: EnemyUnit[];
  buildings: Building[];
  economyUnits?: EconomyUnit[];
  slimePuddles: SlimePuddle[]; 
  projectiles: Projectile[];
};

export type TCamera = {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
}
