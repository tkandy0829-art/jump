/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { GameEngine } from './game/GameEngine';
import { User } from './types';
import { AuthService } from './services/AuthService';
import Auth from './components/Auth';
import GameHUD from './components/GameHUD';
import GameOver from './components/GameOver';
import AdminPanel from './components/AdminPanel';
import { Settings, Play, ShoppingBag, ArrowLeft, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEngine } from './services/SoundEngine';

type ViewState = 'AUTH' | 'MAIN' | 'GAME' | 'SHOP';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [user, setUser] = useState<User | null>(AuthService.getCurrentUser());
  const [view, setView] = useState<ViewState>(user ? 'MAIN' : 'AUTH');
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [hud, setHud] = useState({ score: 0, distance: 0, difficulty: 1 });
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const keys = useRef<{ [key: string]: boolean }>({});

  const shopItems = useMemo(() => [
    { id: 'red', name: '빨간 옷', price: 500, color: '#EF4444' },
    { id: 'yellow', name: '노란 옷', price: 500, color: '#F59E0B' },
    { id: 'blue', name: '파란 옷', price: 550, color: '#3B82F6' },
    { id: 'black', name: '검정 옷', price: 550, color: '#1F2937' },
    { id: 'fire', name: '불의 옷', price: 1200, color: '#3B82F6', special: 'fire' },
  ], []);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user || view !== 'GAME' || isGameOver || isAdminOpen) return;

    if (!engineRef.current && canvasRef.current) {
      engineRef.current = new GameEngine(canvasRef.current);
      engineRef.current.setSkin(user.currentSkin);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'A') {
        if (user.isAdmin) setIsAdminOpen(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && engineRef.current && !isGameOver && !isAdminOpen) {
        engineRef.current.toggleMovement();
      }
    };

    const onGameOver = (e: any) => {
      setIsGameOver(true);
      setFinalScore(e.detail.score);
      AuthService.updateHighscore(user.id, e.detail.score);
      // Use direct coins from game engine
      AuthService.addCoins(user.id, e.detail.coins || 0);
      setUser(AuthService.getCurrentUser()); // Refresh user data
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('gameover', onGameOver);

    let animationId: number;
    const loop = () => {
      if (engineRef.current && !isGameOver && !isAdminOpen) {
        engineRef.current.update(keys.current);
        engineRef.current.draw();
        setHud(engineRef.current.getHUD());
      }
      animationId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('gameover', onGameOver);
      cancelAnimationFrame(animationId);
    };
  }, [user, view, isGameOver, isAdminOpen]);

  const handleLogin = (u: User) => {
    AuthService.setCurrentUser(u);
    setUser(u);
    setView('MAIN');
  };

  const handleRestart = () => {
    setIsGameOver(false);
    engineRef.current?.reset();
  };

  const handleHome = () => {
    setIsGameOver(false);
    setView('MAIN');
    engineRef.current = null;
  };

  const handleBuySkin = (item: any) => {
    if (!user) return;
    if (user.unlockedSkins.includes(item.id)) {
      AuthService.setCurrentSkin(user.id, item.id);
      setUser(AuthService.getCurrentUser());
    } else {
      if (AuthService.buySkin(user.id, item.id, item.price)) {
        setUser(AuthService.getCurrentUser());
      }
    }
  };

  if (view === 'AUTH' || !user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none font-sans">
      <AnimatePresence mode="wait">
        {view === 'MAIN' && (
          <motion.div 
            key="main"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center h-full z-50 relative bg-black/60 backdrop-blur-md"
          >
            <h1 className="text-8xl font-black mb-16 tracking-tighter text-white">JUMP</h1>
            <div className="flex gap-6">
              <button 
                onClick={() => setView('GAME')}
                className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white px-12 py-5 rounded-2xl font-bold text-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
              >
                <Play fill="currentColor" /> 플레이
              </button>
              <button 
                onClick={() => setView('SHOP')}
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-12 py-5 rounded-2xl font-bold text-2xl border border-white/10 transition-all hover:scale-105 active:scale-95"
              >
                <ShoppingBag /> 상점
              </button>
            </div>
            <div className="mt-12 flex items-center gap-4 text-emerald-400 font-mono text-xl">
               <Coins /> {user.coins.toLocaleString()}
            </div>
          </motion.div>
        )}

        {view === 'SHOP' && (
          <motion.div 
            key="shop"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="flex h-full w-full z-50 relative bg-[#0A0B0D]"
          >
            {/* Left: Clothing List */}
            <div className="w-1/2 p-12 overflow-y-auto border-r border-white/5">
                <button onClick={() => setView('MAIN')} className="mb-12 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft /> 나가기
                </button>
                <h2 className="text-4xl font-bold mb-8 text-white">상의 상점</h2>
                <div className="grid gap-4">
                    {shopItems.map(item => (
                        <div 
                            key={item.id}
                            onClick={() => handleBuySkin(item)}
                            className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                user.currentSkin === item.id 
                                ? 'bg-emerald-500/20 border-emerald-500 text-white' 
                                : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg border border-white/10 flex items-center justify-center" style={{ backgroundColor: item.color }}>
                                    {item.special === 'fire' && <div className="w-3 h-3 bg-red-500 rounded-full blur-[2px]" />}
                                </div>
                                <span className="text-xl font-bold">{item.name}</span>
                            </div>
                            <div className="font-mono text-emerald-400">
                                {user.unlockedSkins.includes(item.id) 
                                    ? (user.currentSkin === item.id ? '장착됨' : '보유 중') 
                                    : `${item.price} COIN`}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Preview */}
            <div className="w-1/2 flex flex-col items-center justify-center bg-black/40">
                <div className="relative mb-8 text-2xl font-bold tracking-widest text-emerald-500/50 uppercase">Preview</div>
                <div className="w-48 h-72 relative animate-bounce">
                    {/* Simplified Character Preview */}
                    <div className="w-16 h-16 bg-[#FFDBAC] rounded-full mx-auto relative z-10" />
                    <div className="w-24 h-32 absolute top-12 left-12 rounded-xl" style={{ backgroundColor: shopItems.find(i => i.id === user.currentSkin)?.color || '#22C55E' }}>
                        {user.currentSkin === 'fire' && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-red-500 rounded-full blur-md opacity-80" />}
                    </div>
                </div>
                <div className="mt-12 text-center">
                    <div className="text-gray-500 mb-2 uppercase tracking-widest text-sm">내 잔액</div>
                    <div className="text-4xl font-mono text-white flex items-center justify-center gap-3">
                        <Coins className="text-emerald-500" /> {user.coins.toLocaleString()}
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {view === 'GAME' && (
        <>
            <canvas 
                ref={canvasRef} 
                width={window.innerWidth} 
                height={window.innerHeight}
                className="block"
            />
            <GameHUD 
                playerName={user.username}
                score={hud.score}
                distance={hud.distance}
                difficulty={hud.difficulty}
            />
            {user.isAdmin && (
                <button 
                    onClick={() => setIsAdminOpen(true)}
                    className="fixed bottom-6 right-6 bg-[#0F1115] border border-[#1F2937] p-4 rounded hover:bg-[#1F2937] group transition-all z-40 pointer-events-auto"
                >
                    <Settings className="text-gray-500 group-hover:text-emerald-400 w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                </button>
            )}
        </>
      )}

      <AnimatePresence>
        {isGameOver && (
          <GameOver 
            score={finalScore}
            highscore={user.highscore}
            onRestart={handleRestart}
            onHome={handleHome}
          />
        )}
        {isAdminOpen && (
          <AdminPanel onClose={() => setIsAdminOpen(false)} />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 left-6 text-gray-700 text-[9px] uppercase font-mono font-bold tracking-[0.3em] pointer-events-none z-[60]">
        제어: [W] / [SPACE] (2단 점프) | 마우스 좌클릭 (이동 토글) // 시스템: [CTRL+SHIFT+A]
      </div>
    </div>
  );
}
