import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  GameState, 
  Player, 
  Enemy, 
  Bullet, 
  PowerUp, 
  Particle, 
  Planet,
  EnemyType, 
  PowerUpType 
} from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PLAYER_SIZE, 
  PLAYER_SPEED, 
  PLAYER_MAX_HEALTH,
  BULLET_WIDTH,
  BULLET_HEIGHT,
  BULLET_SPEED,
  ENEMY_CONFIGS,
  POWERUP_SIZE,
  POWERUP_DURATION,
  BOSS_CONFIGS,
  PLANET_COLORS
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  onScoreUpdate: (score: number) => void;
  onLevelUpdate: (level: number) => void;
  onHealthUpdate: (health: number) => void;
  onAchievementUnlock: (id: string) => void;
  onBossWarning: (bossName: string | null) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  onScoreUpdate, 
  onLevelUpdate, 
  onHealthUpdate, 
  onAchievementUnlock,
  onBossWarning
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game State Refs (to avoid closure issues in loop)
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const healthRef = useRef(PLAYER_MAX_HEALTH);
  const startTimeRef = useRef(Date.now());
  const lastEnemySpawnRef = useRef(0);
  const lastPowerUpSpawnRef = useRef(0);
  const lastShotRef = useRef(0);
  const lastLevelHealedRef = useRef(1);
  const bossWarningActiveRef = useRef(false);
  const bossEntranceTimerRef = useRef(0);
  
  // Entities
  const playerRef = useRef<Player>({
    id: 'player',
    x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
    y: CANVAS_HEIGHT - 100,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    speed: PLAYER_SPEED,
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    shieldActive: false,
    invincible: false,
    invincibleTimer: 0,
    powerUpTimer: 0,
    activePowerUp: null,
  });
  
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const planetsRef = useRef<Planet[]>([]);
  const starsRef = useRef<{x: number, y: number, size: number, speed: number}[]>([]);
  const bossesRef = useRef<Enemy[]>([]);
  
  // Input tracking
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  // Audio Refs
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const bossMusicRef = useRef<HTMLAudioElement | null>(null);

  // Image Assets Refs
  const imagesRef = useRef<{ [key: string]: HTMLImageElement }>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Initialize Background and Images
  useEffect(() => {
    // Load Images
    const assetList = {
      player: '/player.png',
      enemy_basic: '/enemy_basic.png',
      enemy_fast: '/enemy_fast.png',
      enemy_heavy: '/enemy_heavy.png',
      enemy_ranged: '/enemy_ranged.png',
      boss: '/boss.png',
    };

    let loadedCount = 0;
    const totalAssets = Object.keys(assetList).length;

    Object.entries(assetList).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imagesRef.current[key] = img;
        loadedCount++;
        if (loadedCount === totalAssets) setImagesLoaded(true);
      };
      img.onerror = () => {
        loadedCount++; // Still count as processed even if failed
        if (loadedCount === totalAssets) setImagesLoaded(true);
      };
    });

    // Planets
    const planets: Planet[] = [];
    for (let i = 0; i < 5; i++) {
      const colorSet = PLANET_COLORS[Math.floor(Math.random() * PLANET_COLORS.length)];
      planets.push({
        id: Math.random().toString(),
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: 40 + Math.random() * 100,
        speed: 0.1 + Math.random() * 0.3,
        color: colorSet.main,
        detailColor: colorSet.detail,
      });
    }
    planetsRef.current = planets;

    // Stars
    const stars = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 1.5,
        speed: 0.05 + Math.random() * 0.1,
      });
    }
    starsRef.current = stars;
  }, []);

  // Audio Setup
  useEffect(() => {
    // Using high-energy synthwave/techno style audio from public sources
    bgMusicRef.current = new Audio('https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3');
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.4;

    bossMusicRef.current = new Audio('https://assets.mixkit.co/music/preview/mixkit-heavy-industrial-rock-600.mp3');
    bossMusicRef.current.loop = true;
    bossMusicRef.current.volume = 0.6;

    return () => {
      bgMusicRef.current?.pause();
      bossMusicRef.current?.pause();
    };
  }, []);

  // Handle Music Transitions and Reset
  const prevGameStateRef = useRef<GameState>(gameState);
  useEffect(() => {
    if (gameState === GameState.PLAYING && prevGameStateRef.current !== GameState.PLAYING) {
      // Reset game values when starting a new game
      scoreRef.current = 0;
      levelRef.current = 1;
      healthRef.current = PLAYER_MAX_HEALTH;
      lastLevelHealedRef.current = 1;
      startTimeRef.current = Date.now();
      enemiesRef.current = [];
      bulletsRef.current = [];
      powerUpsRef.current = [];
      particlesRef.current = [];
      bossesRef.current = [];
      bossWarningActiveRef.current = false;
      
      playerRef.current = {
        ...playerRef.current,
        x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
        y: CANVAS_HEIGHT - 100,
        health: PLAYER_MAX_HEALTH,
        shieldActive: false,
        invincible: false,
        activePowerUp: null,
      };

      onScoreUpdate(0);
      onLevelUpdate(1);
      onHealthUpdate(PLAYER_MAX_HEALTH);
    }

    if (gameState === GameState.PLAYING) {
      if (bossesRef.current.length > 0) {
        bgMusicRef.current?.pause();
        bossMusicRef.current?.play().catch(() => {});
      } else {
        bossMusicRef.current?.pause();
        bgMusicRef.current?.play().catch(() => {});
      }
    } else {
      bgMusicRef.current?.pause();
      bossMusicRef.current?.pause();
    }
    prevGameStateRef.current = gameState;
  }, [gameState, onScoreUpdate, onLevelUpdate, onHealthUpdate]);

  // Reset Game & Clear Entities on Pause/GameOver
  useEffect(() => {
    if (gameState === GameState.PAUSED || gameState === GameState.GAMEOVER || gameState === GameState.START) {
      // Clear entities as requested
      enemiesRef.current = [];
      bulletsRef.current = [];
      powerUpsRef.current = [];
      bossesRef.current = [];
    }
  }, [gameState]);

  // Input Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
    if (gameState !== GameState.PLAYING) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    touchRef.current = {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleTouchEnd = () => {
    touchRef.current = null;
  };

  // Helper: Create Explosion
  const createExplosion = (x: number, y: number, color: string, count = 15) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.5,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  };

  // Game Logic
  const update = (dt: number) => {
    if (gameState !== GameState.PLAYING) return;

    const player = playerRef.current;
    const now = Date.now();

    // 0. Update Background
    planetsRef.current.forEach(p => {
      p.y += p.speed;
      if (p.y > CANVAS_HEIGHT + p.size) {
        p.y = -p.size;
        p.x = Math.random() * CANVAS_WIDTH;
      }
    });
    starsRef.current.forEach(s => {
      s.y += s.speed;
      if (s.y > CANVAS_HEIGHT) s.y = 0;
    });

    // 1. Handle Player Movement
    if (touchRef.current) {
      const targetX = touchRef.current.x - player.width / 2;
      const targetY = touchRef.current.y - player.height / 2;
      player.x += (targetX - player.x) * 0.2;
      player.y += (targetY - player.y) * 0.2;
    } else {
      if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) player.x -= player.speed;
      if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) player.x += player.speed;
      if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) player.y -= player.speed;
      if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) player.y += player.speed;
    }

    // Boundary checks
    player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));
    player.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.height, player.y));

    // 2. Handle Shooting
    let shotInterval = 200;
    if (levelRef.current >= 30) shotInterval = 120; // Rapid fire at level 30

    if ((keysRef.current['Space'] || touchRef.current) && now - lastShotRef.current > shotInterval) {
      const bulletX = player.x + player.width / 2 - BULLET_WIDTH / 2;
      const bulletY = player.y;

      // New attack methods based on level
      if (player.activePowerUp === PowerUpType.TRIPLE_SHOT || (levelRef.current >= 15 && levelRef.current < 25)) {
        bulletsRef.current.push({ id: Math.random().toString(), x: bulletX, y: bulletY, width: BULLET_WIDTH, height: BULLET_HEIGHT, speed: BULLET_SPEED, damage: 1, angle: 0 });
        bulletsRef.current.push({ id: Math.random().toString(), x: bulletX, y: bulletY, width: BULLET_WIDTH, height: BULLET_HEIGHT, speed: BULLET_SPEED, damage: 1, angle: -0.2 });
        bulletsRef.current.push({ id: Math.random().toString(), x: bulletX, y: bulletY, width: BULLET_WIDTH, height: BULLET_HEIGHT, speed: BULLET_SPEED, damage: 1, angle: 0.2 });
      } else if (levelRef.current >= 25) {
        // Penta shot
        for (let i = -2; i <= 2; i++) {
          bulletsRef.current.push({ id: Math.random().toString(), x: bulletX, y: bulletY, width: BULLET_WIDTH, height: BULLET_HEIGHT, speed: BULLET_SPEED, damage: 1, angle: i * 0.15 });
        }
      } else if (levelRef.current >= 5) {
        // Double shot
        bulletsRef.current.push({ id: Math.random().toString(), x: player.x + 10, y: bulletY, width: BULLET_WIDTH, height: BULLET_HEIGHT, speed: BULLET_SPEED, damage: 1, angle: 0 });
        bulletsRef.current.push({ id: Math.random().toString(), x: player.x + player.width - 10 - BULLET_WIDTH, y: bulletY, width: BULLET_WIDTH, height: BULLET_HEIGHT, speed: BULLET_SPEED, damage: 1, angle: 0 });
      } else {
        bulletsRef.current.push({ id: Math.random().toString(), x: bulletX, y: bulletY, width: BULLET_WIDTH, height: BULLET_HEIGHT, speed: BULLET_SPEED, damage: 1, angle: 0 });
      }
      lastShotRef.current = now;
    }

    // 3. Update Bullets
    bulletsRef.current.forEach(b => {
      const dir = b.isEnemy ? -1 : 1;
      b.x += Math.sin(b.angle) * b.speed;
      b.y -= Math.cos(b.angle) * b.speed * dir;
    });
    bulletsRef.current = bulletsRef.current.filter(b => b.y > -50 && b.y < CANVAS_HEIGHT + 50 && b.x > -50 && b.x < CANVAS_WIDTH + 50);

    // 4. Update Bosses
    bossesRef.current.forEach(boss => {
      // Boss movement (side to side + slight vertical)
      boss.x += boss.speed;
      if (boss.x <= 0 || boss.x + boss.width >= CANVAS_WIDTH) {
        boss.speed *= -1;
      }
      
      // Keep boss on screen
      if (boss.y < 50) boss.y += 1;

      // Boss shooting patterns
      if (!boss.attackTimer) boss.attackTimer = 0;
      const attackInterval = levelRef.current >= 20 ? 500 : 1000;
      
      if (now - boss.attackTimer > attackInterval) {
        const pattern = Math.floor(Math.random() * 4); // Increased pattern variety
        const centerX = boss.x + boss.width / 2;
        const centerY = boss.y + boss.height / 2;

        if (pattern === 0) {
          // Circular burst
          const count = levelRef.current >= 30 ? 20 : 12;
          for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            bulletsRef.current.push({
              id: Math.random().toString(),
              x: centerX,
              y: centerY,
              width: 8,
              height: 8,
              speed: 4,
              damage: 1,
              angle: angle,
              isEnemy: true
            });
          }
        } else if (pattern === 1) {
          // Targeted burst
          const angleToPlayer = Math.atan2(player.x + player.width/2 - centerX, -(player.y + player.height/2 - centerY));
          const count = levelRef.current >= 30 ? 5 : 3;
          for (let i = -Math.floor(count/2); i <= Math.floor(count/2); i++) {
            bulletsRef.current.push({
              id: Math.random().toString(),
              x: centerX,
              y: centerY,
              width: 10,
              height: 10,
              speed: 6,
              damage: 1,
              angle: angleToPlayer + i * 0.15,
              isEnemy: true
            });
          }
        } else if (pattern === 2) {
          // Spiral pattern
          const time = now / 1000;
          for (let i = 0; i < 4; i++) {
            const angle = time + (i / 4) * Math.PI * 2;
            bulletsRef.current.push({
              id: Math.random().toString(),
              x: centerX,
              y: centerY,
              width: 8,
              height: 8,
              speed: 5,
              damage: 1,
              angle: angle,
              isEnemy: true
            });
          }
        } else {
          // Vertical rain (avoidable gaps)
          const count = 10;
          const gap = Math.floor(Math.random() * (count - 2));
          for (let i = 0; i < count; i++) {
            if (i === gap || i === gap + 1) continue; // Gap
            bulletsRef.current.push({
              id: Math.random().toString(),
              x: (CANVAS_WIDTH / count) * i + (CANVAS_WIDTH / count / 2),
              y: boss.y + boss.height,
              width: 6,
              height: 20,
              speed: 5,
              damage: 1,
              angle: 0,
              isEnemy: true
            });
          }
        }

        // Level 50 Boss Ultimate Move
        if (levelRef.current >= 50 && Math.random() < 0.1) {
          // Screen-wide wave
          for (let i = 0; i < 20; i++) {
            bulletsRef.current.push({
              id: Math.random().toString(),
              x: (CANVAS_WIDTH / 20) * i,
              y: boss.y + boss.height,
              width: 10,
              height: 10,
              speed: 3,
              damage: 2,
              angle: 0,
              isEnemy: true
            });
          }
        }

        boss.attackTimer = now;
      }
    });

    // 5. Update Boss Spawning with Warning
    const bossLevels = [5, 10, 20, 30, 50];
    if (bossLevels.includes(levelRef.current) && bossesRef.current.length === 0 && !bossWarningActiveRef.current) {
      const config = BOSS_CONFIGS[levelRef.current as keyof typeof BOSS_CONFIGS];
      bossWarningActiveRef.current = true;
      onBossWarning(config.name);
      
      // Clear screen for boss
      enemiesRef.current = [];
      
      setTimeout(() => {
        onBossWarning(null);
        
        // Determine number of bosses
        let bossCount = 1;
        if (levelRef.current === 20) bossCount = 2;
        if (levelRef.current === 30) bossCount = 3;
        if (levelRef.current === 50) bossCount = 1; // Ghroth Core is one, but huge
        
        for (let i = 0; i < bossCount; i++) {
          bossesRef.current.push({
            id: `boss_${i}`,
            type: EnemyType.BASIC,
            x: (CANVAS_WIDTH / (bossCount + 1)) * (i + 1) - config.width / 2,
            y: -config.height,
            width: config.width,
            height: config.height,
            speed: config.speed * (i % 2 === 0 ? 1 : -1),
            health: config.health,
            maxHealth: config.health,
            scoreValue: config.scoreValue,
            isBoss: true,
            attackTimer: now,
          });
        }

        // Add Escorts
        let escortCount = 0;
        if (levelRef.current === 20) escortCount = 2;
        if (levelRef.current === 30) escortCount = 3;
        if (levelRef.current === 50) escortCount = 5;

        for (let i = 0; i < escortCount; i++) {
          const eType = EnemyType.HEAVY;
          const eConfig = ENEMY_CONFIGS[eType];
          enemiesRef.current.push({
            id: `escort_${i}`,
            type: eType,
            x: (CANVAS_WIDTH / (escortCount + 1)) * (i + 1) - eConfig.width / 2,
            y: -eConfig.height - 100,
            width: eConfig.width,
            height: eConfig.height,
            speed: eConfig.speed,
            health: eConfig.health * 2, // Stronger escorts
            maxHealth: eConfig.health * 2,
            scoreValue: eConfig.scoreValue,
            attackTimer: now + 1000,
          });
        }

        bossEntranceTimerRef.current = now;
        bossWarningActiveRef.current = false;
        
        // Trigger music change
        bgMusicRef.current?.pause();
        bossMusicRef.current?.play().catch(() => {});
      }, 3000);
    }

    // Boss Entrance Animation
    let isEntering = false;
    if (bossesRef.current.length > 0 && now - bossEntranceTimerRef.current < 2000) {
      bossesRef.current.forEach(boss => {
        const targetY = 50;
        boss.y += (targetY - boss.y) * 0.05;
      });
      isEntering = true;
    }

    // Only spawn regular enemies if no boss is present and no warning
    if (bossesRef.current.length === 0 && !bossWarningActiveRef.current && !isEntering) {
      const spawnInterval = Math.max(300, 1500 - levelRef.current * 120);
      if (now - lastEnemySpawnRef.current > spawnInterval) {
        const rand = Math.random();
        let type = EnemyType.BASIC;
        if (levelRef.current >= 3 && rand > 0.6) type = EnemyType.FAST;
        if (levelRef.current >= 5 && rand > 0.75) type = EnemyType.RANGED;
        if (levelRef.current >= 7 && rand > 0.9) type = EnemyType.HEAVY;

        const config = ENEMY_CONFIGS[type];
        // Health scales with level
        const scaledHealth = config.health + Math.floor(levelRef.current / 2);
        enemiesRef.current.push({
          id: Math.random().toString(),
          type,
          x: Math.random() * (CANVAS_WIDTH - config.width),
          y: -config.height,
          width: config.width,
          height: config.height,
          speed: config.speed + (levelRef.current * 0.3),
          health: scaledHealth,
          maxHealth: scaledHealth,
          scoreValue: config.scoreValue,
          attackTimer: now + Math.random() * 2000, // Randomize first shot
        });
        lastEnemySpawnRef.current = now;
      }
    }

    enemiesRef.current.forEach(e => {
      if (e.type === EnemyType.RANGED) {
        // Ranged enemies stop at a certain height to shoot
        if (e.y < 200) {
          e.y += e.speed;
        } else {
          // Shoot at player
          if (!e.attackTimer) e.attackTimer = 0;
          if (now - e.attackTimer > 2000) {
            const angle = Math.atan2(player.x + player.width/2 - (e.x + e.width/2), -(player.y + player.height/2 - (e.y + e.height/2)));
            bulletsRef.current.push({
              id: Math.random().toString(),
              x: e.x + e.width / 2,
              y: e.y + e.height,
              width: 6,
              height: 6,
              speed: 4,
              damage: 1,
              angle: angle,
              isEnemy: true
            });
            e.attackTimer = now;
          }
        }
      } else {
        e.y += e.speed;
      }
    });

    // Check for escaped enemies
    const escaped = enemiesRef.current.filter(e => e.y > CANVAS_HEIGHT);
    if (escaped.length > 0) {
      scoreRef.current = Math.max(0, scoreRef.current - 50 * escaped.length);
      onScoreUpdate(scoreRef.current);
      enemiesRef.current = enemiesRef.current.filter(e => e.y <= CANVAS_HEIGHT);
    }

    // 6. Update PowerUps & Spawning
    if (now - lastPowerUpSpawnRef.current > 15000) {
      const type = Math.random() > 0.5 ? PowerUpType.TRIPLE_SHOT : PowerUpType.SHIELD;
      powerUpsRef.current.push({
        id: Math.random().toString(),
        type,
        x: Math.random() * (CANVAS_WIDTH - POWERUP_SIZE),
        y: -POWERUP_SIZE,
        width: POWERUP_SIZE,
        height: POWERUP_SIZE,
        speed: 2,
      });
      lastPowerUpSpawnRef.current = now;
    }

    powerUpsRef.current.forEach(p => p.y += p.speed);
    powerUpsRef.current = powerUpsRef.current.filter(p => p.y < CANVAS_HEIGHT);

    // 7. Collision Detection
    // Bullet vs Enemy/Boss
    bulletsRef.current.forEach(b => {
      // Check Bosses
      bossesRef.current.forEach(e => {
        if (
          b.x < e.x + e.width &&
          b.x + b.width > e.x &&
          b.y < e.y + e.height &&
          b.y + b.height > e.y
        ) {
          e.health -= b.damage;
          b.y = -100;
          createExplosion(b.x, b.y, '#fff', 3);
          
          if (e.health <= 0) {
            const config = BOSS_CONFIGS[levelRef.current as keyof typeof BOSS_CONFIGS] || BOSS_CONFIGS[50];
            createExplosion(e.x + e.width / 2, e.y + e.height / 2, config.color, 50);
            scoreRef.current += e.scoreValue;
            onScoreUpdate(scoreRef.current);
            e.id = 'dead'; // Mark for removal
          }
        }
      });

      // Check regular enemies
      enemiesRef.current.forEach(e => {
        if (
          b.x < e.x + e.width &&
          b.x + b.width > e.x &&
          b.y < e.y + e.height &&
          b.y + b.height > e.y
        ) {
          e.health -= b.damage;
          b.y = -100; // Mark for removal
          
          if (e.health <= 0) {
            createExplosion(e.x + e.width / 2, e.y + e.height / 2, ENEMY_CONFIGS[e.type].color);
            scoreRef.current += e.scoreValue;
            onScoreUpdate(scoreRef.current);
            onAchievementUnlock('first_blood');
            if (scoreRef.current >= 10000) onAchievementUnlock('ace');
            
            // Level up check (only if no boss is active)
            if (bossesRef.current.length === 0) {
              // Only level up by one at a time based on score threshold
              if (scoreRef.current >= levelRef.current * 2000) {
                const nextLevel = levelRef.current + 1;
                // Healing logic: every 2 levels
                if (nextLevel % 2 === 0 && nextLevel > lastLevelHealedRef.current) {
                  if (healthRef.current < PLAYER_MAX_HEALTH) {
                    healthRef.current += 1;
                    onHealthUpdate(healthRef.current);
                  }
                  lastLevelHealedRef.current = nextLevel;
                }

                levelRef.current = nextLevel;
                onLevelUpdate(levelRef.current);
                if (levelRef.current === 5) onAchievementUnlock('level_up');
              }
            }
          }
        }
      });
    });
    enemiesRef.current = enemiesRef.current.filter(e => e.health > 0);

    // Cleanup dead bosses
    const deadBosses = bossesRef.current.filter(b => b.id === 'dead');
    if (deadBosses.length > 0) {
      bossesRef.current = bossesRef.current.filter(b => b.id !== 'dead');
      if (bossesRef.current.length === 0) {
        // All bosses defeated
        levelRef.current += 1;
        onLevelUpdate(levelRef.current);
        // Switch music back
        bossMusicRef.current?.pause();
        bgMusicRef.current?.play().catch(() => {});
      }
    }

    // Player vs Enemy/Boss/EnemyBullet
    if (!player.invincible) {
      // Check enemy bullets
      bulletsRef.current.forEach(b => {
        if (b.isEnemy) {
          if (
            player.x < b.x + b.width &&
            player.x + player.width > b.x &&
            player.y < b.y + b.height &&
            player.y + player.height > b.y
          ) {
            if (player.shieldActive) {
              player.shieldActive = false;
            } else {
              healthRef.current -= 1;
              onHealthUpdate(healthRef.current);
            }
            player.invincible = true;
            player.invincibleTimer = now;
            b.y = CANVAS_HEIGHT + 100; // Remove bullet
            createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#ff0000', 20);
          }
        }
      });

      // Check Bosses
      bossesRef.current.forEach(e => {
        if (
          player.x < e.x + e.width &&
          player.x + player.width > e.x &&
          player.y < e.y + e.height &&
          player.y + player.height > e.y
        ) {
          if (player.shieldActive) {
            player.shieldActive = false;
          } else {
            healthRef.current -= 1;
            onHealthUpdate(healthRef.current);
          }
          player.invincible = true;
          player.invincibleTimer = now;
          createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#ff0000', 20);
        }
      });

      enemiesRef.current.forEach(e => {
        if (
          player.x < e.x + e.width &&
          player.x + player.width > e.x &&
          player.y < e.y + e.height &&
          player.y + player.height > e.y
        ) {
          if (player.shieldActive) {
            player.shieldActive = false;
            onAchievementUnlock('shield_master');
          } else {
            healthRef.current -= 1;
            onHealthUpdate(healthRef.current);
          }
          
          player.invincible = true;
          player.invincibleTimer = now;
          createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#ff0000', 20);
          e.health = 0; // Destroy enemy on impact
        }
      });
    }

    // Player vs PowerUp
    powerUpsRef.current.forEach(p => {
      if (
        player.x < p.x + p.width &&
        player.x + player.width > p.x &&
        player.y < p.y + p.height &&
        player.y + player.height > p.y
      ) {
        if (p.type === PowerUpType.SHIELD) {
          player.shieldActive = true;
        } else {
          player.activePowerUp = p.type;
          player.powerUpTimer = now;
          onAchievementUnlock('triple_threat');
        }
        p.y = CANVAS_HEIGHT + 100; // Mark for removal
        createExplosion(p.x + p.width / 2, p.y + p.height / 2, '#00ff00', 10);
      }
    });

    // 8. Update Timers
    if (player.invincible && now - player.invincibleTimer > 2000) {
      player.invincible = false;
    }
    if (player.activePowerUp && now - player.powerUpTimer > POWERUP_DURATION) {
      player.activePowerUp = null;
    }

    // 9. Particles
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Stars
    ctx.fillStyle = '#fff';
    starsRef.current.forEach(s => {
      ctx.globalAlpha = 0.2 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Planets (Background)
    planetsRef.current.forEach(p => {
      ctx.save();
      
      // Realistic Planet with Atmosphere Glow
      const glow = ctx.createRadialGradient(p.x, p.y, p.size, p.x, p.y, p.size * 1.2);
      glow.addColorStop(0, p.color + '44');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Main planet body with shadow/lighting
      const gradient = ctx.createRadialGradient(
        p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.1,
        p.x, p.y, p.size
      );
      gradient.addColorStop(0, p.detailColor);
      gradient.addColorStop(0.5, p.color);
      gradient.addColorStop(1, '#000');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Texture/Surface details
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = p.detailColor;
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(
          p.x + Math.sin(i) * p.size * 0.5, 
          p.y + Math.cos(i) * p.size * 0.5, 
          p.size * 0.3, p.size * 0.1, 
          Math.random() * Math.PI, 0, Math.PI * 2
        );
        ctx.fill();
      }
      ctx.restore();
    });

    const player = playerRef.current;

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw PowerUps
    powerUpsRef.current.forEach(p => {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.type === PowerUpType.SHIELD ? '#3b82f6' : '#facc15';
      ctx.fillStyle = ctx.shadowColor;
      
      ctx.beginPath();
      ctx.moveTo(p.x + p.width / 2, p.y);
      ctx.lineTo(p.x + p.width, p.y + p.height / 2);
      ctx.lineTo(p.x + p.width / 2, p.y + p.height);
      ctx.lineTo(p.x, p.y + p.height / 2);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#000';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type === PowerUpType.SHIELD ? 'S' : 'T', p.x + p.width / 2, p.y + p.height / 2);
      ctx.restore();
    });

    // Draw Bullets
    bulletsRef.current.forEach(b => {
      ctx.save();
      ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
      ctx.rotate(b.angle);
      
      const color = b.isEnemy ? '#ef4444' : '#3b82f6';
      const gradient = ctx.createLinearGradient(0, -b.height / 2, 0, b.height / 2);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(1, color);
      
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.fillStyle = gradient;
      ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
      ctx.restore();
    });

    // Draw Bosses
    bossesRef.current.forEach(e => {
      const config = BOSS_CONFIGS[levelRef.current as keyof typeof BOSS_CONFIGS] || BOSS_CONFIGS[50];
      
      if (imagesRef.current['boss'] && imagesRef.current['boss'].complete && imagesRef.current['boss'].naturalWidth !== 0) {
        ctx.save();
        ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
        ctx.rotate(Math.PI); // Rotate boss to face down
        ctx.drawImage(imagesRef.current['boss'], -e.width / 2, -e.height / 2, e.width, e.height);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
        ctx.rotate(Math.PI); // Rotate boss to face down
        ctx.shadowBlur = 30;
        ctx.shadowColor = config.color;
        ctx.fillStyle = config.color;

        // Draw Boss Body (More complex shape)
        ctx.beginPath();
        ctx.moveTo(-e.width / 2, -e.height / 2);
        ctx.lineTo(e.width / 2, -e.height / 2);
        ctx.lineTo(e.width * 0.4, -e.height * 0.1);
        ctx.lineTo(e.width / 2, e.height * 0.1);
        ctx.lineTo(0, e.height / 2);
        ctx.lineTo(-e.width / 2, e.height * 0.1);
        ctx.lineTo(-e.width * 0.4, -e.height * 0.1);
        ctx.closePath();
        ctx.fill();

        // Boss Glow Core
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, e.width * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Boss Health Bar
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(e.x, e.y - 20, e.width, 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(e.x, e.y - 20, e.width * (e.health / e.maxHealth), 10);
      
      // Boss Name
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(config.name, e.x + e.width / 2, e.y - 30);
      ctx.restore();
    });

    // Draw Enemies (Futuristic Tech Style)
    enemiesRef.current.forEach(e => {
      const imgKey = `enemy_${e.type.toLowerCase()}`;
      if (imagesRef.current[imgKey] && imagesRef.current[imgKey].complete && imagesRef.current[imgKey].naturalWidth !== 0) {
        ctx.save();
        ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
        ctx.rotate(Math.PI); // Rotate enemy to face down
        ctx.drawImage(imagesRef.current[imgKey], -e.width / 2, -e.height / 2, e.width, e.height);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
        ctx.rotate(Math.PI); // Rotate enemy to face down
        const color = ENEMY_CONFIGS[e.type].color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        
        // Techy Body (Fighter Jet Style)
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        if (e.type === EnemyType.HEAVY) {
          // Twin engine heavy jet (Image 3 style)
          ctx.moveTo(0, -e.height/2);
          ctx.lineTo(e.width * 0.2, -e.height * 0.3);
          ctx.lineTo(e.width * 0.5, e.height * 0.2);
          ctx.lineTo(e.width * 0.5, e.height * 0.5);
          ctx.lineTo(e.width * 0.2, e.height * 0.4);
          ctx.lineTo(0, e.height * 0.5);
          ctx.lineTo(-e.width * 0.2, e.height * 0.4);
          ctx.lineTo(-e.width * 0.5, e.height * 0.5);
          ctx.lineTo(-e.width * 0.5, e.height * 0.2);
          ctx.lineTo(-e.width * 0.2, -e.height * 0.3);
        } else if (e.type === EnemyType.FAST) {
          // Sleek swept-wing jet (Image 2 style)
          ctx.moveTo(0, -e.height/2);
          ctx.lineTo(e.width * 0.1, -e.height * 0.1);
          ctx.lineTo(e.width * 0.5, e.height * 0.4);
          ctx.lineTo(0, e.height * 0.2);
          ctx.lineTo(-e.width * 0.5, e.height * 0.4);
          ctx.lineTo(-e.width * 0.1, -e.height * 0.1);
        } else if (e.type === EnemyType.RANGED) {
          // Futuristic glowing jet (Image 4 style)
          ctx.moveTo(0, -e.height/2);
          ctx.lineTo(e.width * 0.4, 0);
          ctx.lineTo(e.width * 0.5, e.height * 0.5);
          ctx.lineTo(0, e.height * 0.3);
          ctx.lineTo(-e.width * 0.5, e.height * 0.5);
          ctx.lineTo(-e.width * 0.4, 0);
          
          // Neon accents
          ctx.save();
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        } else {
          // Standard fighter jet (Image 1 style)
          ctx.moveTo(0, -e.height/2);
          ctx.lineTo(e.width * 0.2, -e.height * 0.1);
          ctx.lineTo(e.width * 0.5, e.height * 0.3);
          ctx.lineTo(e.width * 0.1, e.height * 0.3);
          ctx.lineTo(0, e.height * 0.5);
          ctx.lineTo(-e.width * 0.1, e.height * 0.3);
          ctx.lineTo(-e.width * 0.5, e.height * 0.3);
          ctx.lineTo(-e.width * 0.2, -e.height * 0.1);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing Core
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(0, 0, e.width * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Enemy Health Bar
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(e.x, e.y - 10, e.width, 4);
      ctx.fillStyle = ENEMY_CONFIGS[e.type].color;
      ctx.fillRect(e.x, e.y - 10, e.width * (e.health / e.maxHealth), 4);
      ctx.restore();
    });

    // Draw Player (Detailed Ship from Image)
    if (!player.invincible || Math.floor(Date.now() / 100) % 2 === 0) {
      if (imagesRef.current['player'] && imagesRef.current['player'].complete && imagesRef.current['player'].naturalWidth !== 0) {
        ctx.drawImage(imagesRef.current['player'], player.x, player.y, player.width, player.height);
      } else {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        
        // Shadow
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        
        // Main Body (White/Grey)
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(0, -player.height / 2); // Nose
        ctx.lineTo(player.width * 0.15, -player.height * 0.1);
        ctx.lineTo(player.width * 0.15, player.height * 0.4);
        ctx.lineTo(0, player.height * 0.5); // Tail
        ctx.lineTo(-player.width * 0.15, player.height * 0.4);
        ctx.lineTo(-player.width * 0.15, -player.height * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Cockpit (Dark Glass)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(0, -player.height * 0.1, player.width * 0.1, player.height * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings (Outer)
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(player.width * 0.15, -player.height * 0.1);
        ctx.lineTo(player.width * 0.5, player.height * 0.3);
        ctx.lineTo(player.width * 0.5, player.height * 0.5);
        ctx.lineTo(player.width * 0.15, player.height * 0.4);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-player.width * 0.15, -player.height * 0.1);
        ctx.lineTo(-player.width * 0.5, player.height * 0.3);
        ctx.lineTo(-player.width * 0.5, player.height * 0.5);
        ctx.lineTo(-player.width * 0.15, player.height * 0.4);
        ctx.closePath();
        ctx.fill();
        
        // Engines (Glow)
        const engineGlow = ctx.createRadialGradient(0, player.height * 0.5, 0, 0, player.height * 0.5, 20);
        engineGlow.addColorStop(0, '#3b82f6');
        engineGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = engineGlow;
        ctx.beginPath();
        ctx.arc(0, player.height * 0.5, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Shield
      if (player.shieldActive) {
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 30;
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
  };

  const loop = useCallback((time: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      update(16); // Fixed dt for simplicity
      draw(ctx);
    }
    requestRef.current = requestAnimationFrame(loop);
  }, [gameState]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [loop]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="max-w-full max-h-full object-contain cursor-crosshair"
      onMouseDown={handleTouch}
      onMouseMove={handleTouch}
      onMouseUp={handleTouchEnd}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={handleTouchEnd}
    />
  );
};

export default GameCanvas;
