export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 900;

export const PLAYER_SIZE = 50;
export const PLAYER_SPEED = 7;
export const PLAYER_MAX_HEALTH = 3;

export const BULLET_WIDTH = 4;
export const BULLET_HEIGHT = 15;
export const BULLET_SPEED = 15;

export const ENEMY_CONFIGS = {
  BASIC: {
    width: 40,
    height: 40,
    speed: 2.5,
    health: 1,
    scoreValue: 100,
    color: '#3b82f6', // blue-500
  },
  FAST: {
    width: 30,
    height: 30,
    speed: 5.5,
    health: 1,
    scoreValue: 200,
    color: '#facc15', // yellow-400
  },
  HEAVY: {
    width: 60,
    height: 60,
    speed: 1.5,
    health: 6,
    scoreValue: 500,
    color: '#ef4444', // red-500
  },
  RANGED: {
    width: 45,
    height: 45,
    speed: 2.2,
    health: 3,
    scoreValue: 300,
    color: '#f97316', // orange-500
  },
};

export const POWERUP_SIZE = 30;
export const POWERUP_DURATION = 10000; // 10 seconds

export const BOSS_CONFIGS = {
  5: {
    name: '初级守卫',
    width: 150,
    height: 100,
    health: 100,
    scoreValue: 5000,
    color: '#9333ea', // purple-600
    speed: 1.2,
  },
  10: {
    name: '虚空掠夺者',
    width: 200,
    height: 150,
    health: 300,
    scoreValue: 15000,
    color: '#c026d3', // fuchsia-600
    speed: 1.8,
  },
  20: {
    name: '星系毁灭者',
    width: 250,
    height: 200,
    health: 800,
    scoreValue: 50000,
    color: '#dc2626', // red-600
    speed: 2.5,
  },
  30: {
    name: '格赫罗斯之影',
    width: 300,
    height: 250,
    health: 2500,
    scoreValue: 100000,
    color: '#000000', // black
    speed: 3.2,
  },
  50: {
    name: '格赫罗斯本体',
    width: 400,
    height: 350,
    health: 10000,
    scoreValue: 500000,
    color: '#7f1d1d', // dark red
    speed: 4,
  },
};

export const PLANET_COLORS = [
  { main: '#1e293b', detail: '#334155' }, // slate
  { main: '#312e81', detail: '#4338ca' }, // indigo
  { main: '#4c1d95', detail: '#5b21b6' }, // violet
  { main: '#701a75', detail: '#86198f' }, // fuchsia
  { main: '#831843', detail: '#9d174d' }, // pink
];

export const ACHIEVEMENTS_LIST = [
  { id: 'first_blood', title: '第一滴血', description: '击毁第一架敌机', unlocked: false },
  { id: 'survivor', title: '生存者', description: '在单局游戏中存活超过60秒', unlocked: false },
  { id: 'ace', title: '王牌飞行员', description: '单局得分超过10000分', unlocked: false },
  { id: 'shield_master', title: '护盾大师', description: '使用护盾抵挡一次攻击', unlocked: false },
  { id: 'triple_threat', title: '三重威胁', description: '拾取三向子弹道具', unlocked: false },
  { id: 'level_up', title: '晋升', description: '达到第5关', unlocked: false },
  { id: 'boss_slayer', title: '首领克星', description: '击败第一个BOSS', unlocked: false },
  { id: 'untouchable', title: '不可触碰', description: '单局游戏内无伤击败一个BOSS', unlocked: false },
  { id: 'power_hungry', title: '能量渴求', description: '单局累计拾取10个道具', unlocked: false },
  { id: 'planet_traveler', title: '星际旅者', description: '单局累计得分超过50000分', unlocked: false },
  { id: 'order_restorer', title: '秩序修复者', description: '击败最终BOSS格赫罗斯之影', unlocked: false },
  { id: 'speed_demon', title: '极速恶魔', description: '在30秒内击毁50架敌机', unlocked: false },
];
