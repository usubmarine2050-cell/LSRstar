/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy, 
  Shield, 
  Zap, 
  Heart, 
  Info, 
  ChevronRight,
  Gamepad2,
  X
} from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import { GameState, Achievement } from './types';
import { ACHIEVEMENTS_LIST } from './constants';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [health, setHealth] = useState(3);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_LIST);
  const [lastAchievement, setLastAchievement] = useState<Achievement | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [bossWarning, setBossWarning] = useState<string | null>(null);

  // Load high score and achievements from localStorage
  useEffect(() => {
    const savedBestScore = localStorage.getItem('gherros_best_score');
    if (savedBestScore) setBestScore(parseInt(savedBestScore));

    const savedAchievements = localStorage.getItem('gherros_achievements');
    if (savedAchievements) {
      const parsed = JSON.parse(savedAchievements);
      setAchievements(prev => prev.map(a => ({
        ...a,
        unlocked: parsed.includes(a.id)
      })));
    }
  }, []);

  // Handle game events from canvas
  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
    if (newScore > bestScore) {
      setBestScore(newScore);
      localStorage.setItem('gherros_best_score', newScore.toString());
    }
  }, [bestScore]);

  const handleLevelUpdate = useCallback((newLevel: number) => {
    setLevel(newLevel);
  }, []);

  const handleHealthUpdate = useCallback((newHealth: number) => {
    setHealth(newHealth);
    if (newHealth <= 0) {
      setGameState(GameState.GAMEOVER);
    }
  }, []);

  const handleAchievementUnlock = useCallback((id: string) => {
    setAchievements(prev => {
      const index = prev.findIndex(a => a.id === id);
      if (index !== -1 && !prev[index].unlocked) {
        const updated = [...prev];
        updated[index] = { ...updated[index], unlocked: true };
        
        // Save to localStorage
        const unlockedIds = updated.filter(a => a.unlocked).map(a => a.id);
        localStorage.setItem('gherros_achievements', JSON.stringify(unlockedIds));

        setLastAchievement(updated[index]);
        setTimeout(() => setLastAchievement(null), 3000);
        return updated;
      }
      return prev;
    });
  }, []);

  const handleBossWarning = useCallback((bossName: string | null) => {
    setBossWarning(bossName);
  }, []);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setHealth(3);
    setGameState(GameState.PLAYING);
  };

  const togglePause = () => {
    if (gameState === GameState.PLAYING) setGameState(GameState.PAUSED);
    else if (gameState === GameState.PAUSED) setGameState(GameState.PLAYING);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-blue-500/30">
      {/* Background Stars - CSS Animation */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,20,50,1)_0%,rgba(5,5,5,1)_100%)]" />
        <div className="stars-container absolute inset-0 opacity-50">
          {[...Array(100)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: Math.random() * 2 + 'px',
                height: Math.random() * 2 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
                animationDuration: Math.random() * 3 + 2 + 's'
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row h-screen p-4 gap-4">
        {/* Sidebar - Desktop Only */}
        <aside className="hidden lg:flex flex-col w-80 gap-4">
          <div className="glass-card p-6 flex flex-col gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
              <Info size={20} /> 操作指南
            </h2>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                <span>移动</span>
                <span className="text-white font-mono">方向键 / WASD</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                <span>射击</span>
                <span className="text-white font-mono">空格键</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                <span>暂停</span>
                <span className="text-white font-mono">P 键</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 flex-1 overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold flex items-center gap-2 text-yellow-400 mb-4">
              <Trophy size={20} /> 成就系统
            </h2>
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`p-3 rounded-lg border transition-all ${
                    achievement.unlocked 
                      ? 'bg-yellow-500/10 border-yellow-500/30' 
                      : 'bg-white/5 border-white/10 opacity-50'
                  }`}
                >
                  <div className="font-bold text-sm mb-1 flex items-center justify-between">
                    {achievement.title}
                    {achievement.unlocked && <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Game Area */}
        <main className="flex-1 relative flex items-center justify-center bg-black/40 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <GameCanvas 
            gameState={gameState}
            onScoreUpdate={handleScoreUpdate}
            onLevelUpdate={handleLevelUpdate}
            onHealthUpdate={handleHealthUpdate}
            onAchievementUnlock={handleAchievementUnlock}
            onBossWarning={handleBossWarning}
          />

          {/* Boss Warning Overlay */}
          <AnimatePresence>
            {bossWarning && (
              <motion.div
                initial={{ opacity: 0, scale: 1.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
              >
                <div className="bg-red-600/20 backdrop-blur-md border-y border-red-600 w-full py-8 flex flex-col items-center gap-4 shadow-[0_0_50px_rgba(220,38,38,0.3)]">
                  <div className="text-red-500 font-black tracking-[0.5em] text-xl animate-pulse">WARNING</div>
                  <div className="text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    {bossWarning} 正在降临
                  </div>
                  <div className="text-red-400 font-mono text-sm">DETECTING MASSIVE ENERGY SIGNATURE</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* HUD Overlay */}
          {gameState !== GameState.START && (
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none">
              <div className="flex flex-col gap-1">
                <div className="text-xs uppercase tracking-widest text-blue-400 font-bold">Score</div>
                <div className="text-3xl font-mono font-black tracking-tighter">{score.toLocaleString()}</div>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <div className="glass-card px-4 py-2 flex items-center gap-4">
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <Heart 
                        key={i} 
                        size={20} 
                        className={i < health ? "fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "text-white/20"} 
                      />
                    ))}
                  </div>
                  <div className="w-px h-4 bg-white/20" />
                  <div className="text-sm font-bold">LVL {level}</div>
                </div>
              </div>

              <button 
                onClick={togglePause}
                className="pointer-events-auto w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                {gameState === GameState.PAUSED ? <Play size={20} fill="white" /> : <Pause size={20} fill="white" />}
              </button>
            </div>
          )}

          {/* Achievement Popup */}
          <AnimatePresence>
            {lastAchievement && (
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
              >
                <div className="glass-card px-6 py-3 border-yellow-500/50 flex items-center gap-4 shadow-[0_0_30px_rgba(250,204,21,0.2)]">
                  <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-black">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-yellow-500 font-bold uppercase tracking-wider">成就达成</div>
                    <div className="font-bold">{lastAchievement.title}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Menus */}
          <AnimatePresence>
            {gameState === GameState.START && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 flex flex-col items-center justify-center p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="max-w-md"
                >
                  <h1 className="text-6xl font-black italic tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                    LSR<br/>星际先锋
                  </h1>
                  <p className="text-red-400 font-mono tracking-widest text-sm mb-4">LSR STAR PIONEER PROTOCOL v1.0</p>
                  
                  <div className="mb-8 flex flex-col items-center gap-1">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Best Record</div>
                    <div className="text-2xl font-mono font-black text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                      {bestScore.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={startGame}
                      className="group relative px-12 py-4 bg-red-600 rounded-full font-bold text-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(220,38,38,0.6)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      <span className="relative flex items-center justify-center gap-2">
                        开始任务 <Play size={20} fill="currentColor" />
                      </span>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setShowGallery(true)}
                        className="px-6 py-4 glass-card rounded-full font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        <Trophy size={18} className="text-yellow-500" /> 成就馆
                      </button>
                      <button 
                        onClick={() => setShowInstructions(true)}
                        className="px-6 py-4 glass-card rounded-full font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        <Info size={18} className="text-blue-500" /> 游戏说明
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {gameState === GameState.PAUSED && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center"
              >
                <div className="glass-card p-12 flex flex-col items-center gap-8 max-w-sm w-full">
                  <h2 className="text-4xl font-black italic tracking-tighter">已暂停</h2>
                  <div className="flex flex-col gap-4 w-full">
                    <button 
                      onClick={togglePause}
                      className="w-full py-4 bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors"
                    >
                      继续游戏 <Play size={20} fill="currentColor" />
                    </button>
                    <button 
                      onClick={() => setGameState(GameState.START)}
                      className="w-full py-4 glass-card rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                    >
                      退出任务 <X size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {gameState === GameState.GAMEOVER && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8"
              >
                <div className="glass-card p-12 flex flex-col items-center gap-8 max-w-md w-full text-center">
                  <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-red-500 mb-2">
                    <Gamepad2 size={40} />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black italic tracking-tighter mb-2">任务失败</h2>
                    <p className="text-gray-400 text-sm">您的战机已被摧毁，星际防线失守。</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="text-xs text-blue-400 font-bold uppercase mb-1">最终分数</div>
                      <div className="text-2xl font-mono font-black">{score.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="text-xs text-blue-400 font-bold uppercase mb-1">到达关卡</div>
                      <div className="text-2xl font-mono font-black">{level}</div>
                    </div>
                  </div>

                  <div className="w-full">
                    <button 
                      onClick={startGame}
                      className="w-full py-4 bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors mb-4"
                    >
                      重新开始 <RotateCcw size={20} />
                    </button>
                    <button 
                      onClick={() => setGameState(GameState.START)}
                      className="w-full py-4 glass-card rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                    >
                      返回主菜单
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Mobile Instructions Modal */}
        <AnimatePresence>
          {showGallery && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-lg flex items-center justify-center p-6"
            >
              <div className="glass-card p-8 w-full max-w-2xl relative max-h-[80vh] flex flex-col">
                <button 
                  onClick={() => setShowGallery(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
                <h2 className="text-3xl font-black italic tracking-tighter mb-6 flex items-center gap-3 text-yellow-500">
                  <Trophy size={32} /> 成就馆
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-4 custom-scrollbar">
                  {achievements.map((achievement) => (
                    <div 
                      key={achievement.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                        achievement.unlocked 
                          ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]' 
                          : 'bg-white/5 border-white/10 opacity-40 grayscale'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        achievement.unlocked ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-500'
                      }`}>
                        <Trophy size={24} />
                      </div>
                      <div>
                        <div className="font-bold text-lg leading-tight mb-1">{achievement.title}</div>
                        <p className="text-xs text-gray-400 leading-relaxed">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    已解锁: <span className="text-white font-bold">{achievements.filter(a => a.unlocked).length}</span> / {achievements.length}
                  </div>
                  <button 
                    onClick={() => setShowGallery(false)}
                    className="px-8 py-3 bg-white/10 rounded-full font-bold hover:bg-white/20 transition-all"
                  >
                    返回
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {showInstructions && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-lg flex items-center justify-center p-6 lg:hidden"
            >
              <div className="glass-card p-8 w-full max-w-sm relative">
                <button 
                  onClick={() => setShowInstructions(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-400">
                  <Gamepad2 size={24} /> 游戏说明
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold mb-2 flex items-center gap-2"><ChevronRight size={16} className="text-blue-500" /> 移动与射击</h3>
                    <p className="text-sm text-gray-400">在屏幕上滑动手指控制战机移动，战机会自动或点击射击。</p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 flex items-center gap-2"><Zap size={16} className="text-yellow-500" /> 道具系统</h3>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col items-center text-center">
                        <Zap size={20} className="text-yellow-400 mb-1" />
                        <span className="text-[10px] font-bold">三向子弹</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col items-center text-center">
                        <Shield size={20} className="text-blue-400 mb-1" />
                        <span className="text-[10px] font-bold">能量护盾</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowInstructions(false)}
                  className="w-full mt-8 py-4 bg-blue-600 rounded-xl font-bold"
                >
                  明白了
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1.5rem;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
