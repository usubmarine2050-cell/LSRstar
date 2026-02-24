export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER',
}

export enum EnemyType {
  BASIC = 'BASIC',
  FAST = 'FAST',
  HEAVY = 'HEAVY',
  RANGED = 'RANGED',
}

export enum PowerUpType {
  TRIPLE_SHOT = 'TRIPLE_SHOT',
  SHIELD = 'SHIELD',
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface Player extends Entity {
  health: number;
  maxHealth: number;
  shieldActive: boolean;
  invincible: boolean;
  invincibleTimer: number;
  powerUpTimer: number;
  activePowerUp: PowerUpType | null;
}

export interface Bullet extends Entity {
  damage: number;
  angle: number;
  isEnemy?: boolean;
}

export interface Enemy extends Entity {
  type: EnemyType;
  health: number;
  maxHealth: number;
  scoreValue: number;
  isBoss?: boolean;
  attackTimer?: number;
}

export interface Planet {
  id: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  detailColor: string;
}

export interface PowerUp extends Entity {
  type: PowerUpType;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}
