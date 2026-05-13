/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { User } from './types';
import { AuthService } from './services/AuthService';
import Auth from './components/Auth';
import GameHUD from './components/GameHUD';
import GameOver from './components/GameOver';
import AdminPanel from './components/AdminPanel';
import { Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEngine } from './services/SoundEngine';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [user, setUser] = useState<User | null>(AuthService.getCurrentUser());
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [hud, setHud] = useState({ score: 0, distance: 0, difficulty: 1 });
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const keys = useRef<{ [key: string]: boolean }>({});

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
    if (!user || isGameOver || isAdminOpen) return;

    if (!engineRef.current && canvasRef.current) {
      engineRef.current = new GameEngine(canvasRef.current);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      
      // Hidden admin shortcut: Ctrl + Shift + A
      if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'A') {
        if (user.isAdmin) {
          setIsAdminOpen(prev => !prev);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Toggle movement on left click (button 0)
      if (e.button === 0) {
        // We only toggle if the game is active and not over/admin open
        if (engineRef.current && !isGameOver && !isAdminOpen) {
          engineRef.current.toggleMovement();
        }
      }
    };

    const onGameOver = (e: any) => {
      setIsGameOver(true);
      setFinalScore(e.detail.score);
      AuthService.updateHighscore(user.id, e.detail.score);
      soundEngine.stopMusic();
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
        soundEngine.startMusic();
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
  }, [user, isGameOver, isAdminOpen]);

  const handleLogin = (u: User) => {
    AuthService.setCurrentUser(u);
    setUser(u);
  };

  const handleRestart = () => {
    setIsGameOver(false);
    engineRef.current?.reset();
  };

  const handleHome = () => {
    setUser(null);
    AuthService.setCurrentUser(null);
    setIsGameOver(false);
    engineRef.current = null;
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
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

      <div className="fixed bottom-6 left-6 text-gray-700 text-[9px] uppercase font-mono font-bold tracking-[0.3em] pointer-events-none">
        제어: [W] / [SPACE] (2단 점프) | 마우스 좌클릭 (이동 토글) // 시스템: [CTRL+SHIFT+A]
      </div>
    </div>
  );
}
