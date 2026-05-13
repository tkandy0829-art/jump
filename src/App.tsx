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
type ShopCategory = 'shirt' | 'pants' | 'hair' | 'set';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [user, setUser] = useState<User | null>(AuthService.getCurrentUser());
  const [view, setView] = useState<ViewState>(user ? 'MAIN' : 'AUTH');
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('shirt');
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [hud, setHud] = useState({ score: 0, distance: 0, difficulty: 1 });
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const keys = useRef<{ [key: string]: boolean }>({});

  const [previewEquip, setPreviewEquip] = useState({
    shirt: user?.currentShirt || 'shirt_default',
    pants: user?.currentPants || 'pants_default',
    hair: user?.currentHair || 'hair_default',
    set: user?.currentSet || null as string | null
  });

  const shopItems = useMemo(() => ({
    shirt: [
      { id: 'shirt_default', name: '기본 초록', price: 0, color: '#22C55E' },
      { id: 'red', name: '빨간 옷', price: 500, color: '#EF4444' },
      { id: 'yellow', name: '노란 옷', price: 500, color: '#F59E0B' },
      { id: 'blue', name: '파란 옷', price: 550, color: '#3B82F6' },
      { id: 'black', name: '검정 옷', price: 550, color: '#1F2937' },
      { id: 'fire', name: '불의 옷', price: 1200, color: '#3B82F6', special: 'fire' },
    ],
    pants: [
      { id: 'pants_default', name: '기본 청바지', price: 0, color: '#3B82F6' },
      { id: 'pants_green', name: '녹색 바지', price: 700, color: '#22C55E' },
      { id: 'pants_red', name: '빨간 바지', price: 500, color: '#EF4444' },
      { id: 'pants_pink', name: '분홍 치마', price: 1000, color: '#EC4899', style: 'skirt' },
      { id: 'pants_yellow', name: '노란 바지', price: 750, color: '#F59E0B' },
      { id: 'pants_coin', name: '코인 바지', price: 1300, color: '#FFD700', pattern: 'coin' },
      { id: 'pants_black', name: '검정 바지', price: 330, color: '#1F2937' },
    ],
    hair: [
      { id: 'hair_default', name: '대머리', price: 0, color: 'transparent' },
      { id: 'hair_bbang', name: '머리카락 1개', price: 700, color: '#000000' },
      { id: 'hair_red', name: '빨간 머리', price: 550, color: '#EF4444' },
      { id: 'hair_black', name: '검정 머리', price: 770, color: '#000000' },
      { id: 'hair_curly', name: '검정 곱슬머리', price: 660, color: '#000000' },
      { id: 'hair_white', name: '흰 머리', price: 1400, color: '#FFFFFF' },
    ],
    set: [
      { id: 'set_mario', name: '마리오 세트', price: 7777, desc: '점프력 1.5배' },
      { id: 'set_luigi', name: '루이지 세트', price: 5000, desc: '루이지 생김새' },
      { id: 'set_rich', name: '부자 세트', price: 9999, desc: '돈을 뿌리며 달림' },
      { id: 'set_squid', name: '오징어 게임 세트', price: 10000, desc: '죽을 때 총소리' },
    ]
  }), []);

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
      engineRef.current.setEquipment({
        shirt: user.currentShirt,
        pants: user.currentPants,
        hair: user.currentHair,
        set: user.currentSet
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'A') {
        if (user.isAdmin) setIsAdminOpen(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && engineRef.current && !isGameOver && !isAdminOpen) {
        engineRef.current.toggleMovement();
      }
    };

    const onGameOver = (e: any) => {
      setIsGameOver(true);
      setFinalScore(e.detail.score);
      AuthService.updateHighscore(user.id, e.detail.score);
      AuthService.addCoins(user.id, e.detail.coins || 0);
      setUser(AuthService.getCurrentUser());
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

  const handleSelectPreview = (item: any) => {
    setPreviewEquip(prev => ({
        ...prev,
        [activeCategory]: item.id
    }));
  };

  const handleBuyOrEquip = () => {
    if (!user) return;
    const itemId = (previewEquip as any)[activeCategory];
    const categoryItems = (shopItems as any)[activeCategory];
    const item = categoryItems.find((i: any) => i.id === itemId);
    
    if (user.unlockedItems.includes(itemId)) {
        AuthService.equipItem(user.id, itemId, activeCategory);
        setUser(AuthService.getCurrentUser());
    } else if (item && user.coins >= item.price) {
        if (AuthService.buyItem(user.id, itemId, item.price)) {
            AuthService.equipItem(user.id, itemId, activeCategory);
            setUser(AuthService.getCurrentUser());
        }
    }
  };

  const handleResetPreview = () => {
    if (!user) return;
    setPreviewEquip({
        shirt: user.currentShirt,
        pants: user.currentPants,
        hair: user.currentHair,
        set: user.currentSet
    });
  };

  if (view === 'AUTH' || !user) {
    return <Auth onLogin={handleLogin} />;
  }

  const currentPreviewItem = (shopItems as any)[activeCategory].find((i: any) => i.id === (previewEquip as any)[activeCategory]);
  const isUnlocked = user.unlockedItems.includes(currentPreviewItem?.id);
  const canAfford = user.coins >= (currentPreviewItem?.price || 0);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none font-sans text-white">
      <AnimatePresence mode="wait">
        {view === 'MAIN' && (
          <motion.div 
            key="main" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center h-full z-50 relative bg-black/60 backdrop-blur-md"
          >
            <h1 className="text-8xl font-black mb-16 tracking-tighter">JUMP</h1>
            <div className="flex gap-6">
              <button onClick={() => setView('GAME')} className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 px-12 py-5 rounded-2xl font-bold text-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <Play fill="currentColor" /> 플레이
              </button>
              <button onClick={() => setView('SHOP')} className="flex items-center gap-3 bg-white/10 hover:bg-white/20 px-12 py-5 rounded-2xl font-bold text-2xl border border-white/10 transition-all hover:scale-105 active:scale-95">
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
            key="shop" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}
            className="flex h-full w-full z-50 relative bg-[#0A0B0D]"
          >
            {/* Left: Clothing List */}
            <div className="w-1/2 p-12 overflow-y-auto border-r border-white/5 bg-black/20">
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => { handleResetPreview(); setView('MAIN'); }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft /> 나가기
                    </button>
                    <div className="text-emerald-400 font-mono text-xl flex items-center gap-2">
                        <Coins size={20} /> {user.coins.toLocaleString()}
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {[
                        { id: 'shirt', name: '상의' },
                        { id: 'pants', name: '하의' },
                        { id: 'hair', name: '머리' },
                        { id: 'set', name: '세트' }
                    ].map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => setActiveCategory(cat.id as ShopCategory)}
                            className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
                
                <div className="grid gap-4">
                    {(shopItems as any)[activeCategory].map((item: any) => (
                        <div 
                            key={item.id}
                            onClick={() => handleSelectPreview(item)}
                            className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                (previewEquip as any)[activeCategory] === item.id 
                                ? 'bg-white/10 border-white text-white' 
                                : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                {activeCategory !== 'set' ? (
                                    <div className="w-10 h-10 rounded-lg border border-white/10" style={{ backgroundColor: item.color }}>
                                        {item.id === 'hair_bbang' && <div className="w-1 h-5 bg-black mx-auto" />}
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">SET</div>
                                )}
                                <div>
                                    <div className="text-lg font-bold">{item.name}</div>
                                    {item.desc && <div className="text-xs text-gray-500">{item.desc}</div>}
                                </div>
                            </div>
                            <div className={`font-mono ${user.unlockedItems.includes(item.id) ? 'text-gray-500' : 'text-emerald-400'}`}>
                                {user.unlockedItems.includes(item.id) ? '보유 중' : `${item.price} COIN`}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Preview & Action */}
            <div className="w-1/2 flex flex-col items-center justify-center relative bg-gradient-to-b from-black/80 to-emerald-950/10">
                <div className="absolute top-12 text-2xl font-black tracking-[0.3em] text-white/20 uppercase">Character Preview</div>
                <div className="w-48 h-72 relative flex flex-col items-center">
                    {/* Character Visualization */}
                    <div className="relative animate-bounce-slow">
                        {/* Hair */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
                            {previewEquip.hair === 'hair_bbang' && <div className="w-1 h-6 bg-black" />}
                            {previewEquip.hair === 'hair_red' && <div className="w-12 h-6 bg-red-600 rounded-t-full" />}
                            {previewEquip.hair === 'hair_black' && <div className="w-12 h-4 bg-black rounded-t-lg" />}
                            {previewEquip.hair === 'hair_curly' && <div className="flex gap-1"><div className="w-3 h-3 bg-black rounded-full" /><div className="w-3 h-3 bg-black rounded-full" /><div className="w-3 h-3 bg-black rounded-full" /></div>}
                            {previewEquip.hair === 'hair_white' && <div className="w-12 h-5 bg-white rounded-t-xl" />}
                        </div>
                        {/* Head */}
                        <div className="w-16 h-16 bg-[#FFDBAC] rounded-full relative z-20" />
                        {/* Shirt */}
                        <div className="w-20 h-24 bg-gray-500 mx-auto -mt-2 rounded-lg relative z-10 overflow-hidden" 
                            style={{ backgroundColor: (shopItems.shirt.find(i=>i.id===previewEquip.shirt)?.color) || '#22C55E' }}>
                            {previewEquip.shirt === 'fire' && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-red-500 rounded-full blur-xl animate-pulse" />}
                        </div>
                        {/* Pants */}
                        <div className="w-18 h-18 bg-blue-500 mx-auto -mt-1 flex" style={{ backgroundColor: (shopItems.pants.find(i=>i.id===previewEquip.pants)?.color) || '#3B82F6' }}>
                           <div className="w-1/2 border-r border-black/10"></div>
                           <div className="w-1/2"></div>
                        </div>
                    </div>
                </div>

                <div className="mt-20 text-center w-full max-w-sm px-12">
                    <h3 className="text-2xl font-bold mb-2">{currentPreviewItem?.name}</h3>
                    <p className="text-gray-400 mb-8 text-sm h-4">{currentPreviewItem?.desc || ''}</p>
                    
                    <button 
                        onClick={handleBuyOrEquip}
                        disabled={!isUnlocked && !canAfford}
                        className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-2xl ${
                            isUnlocked 
                            ? 'bg-white text-black hover:scale-105 active:scale-95' 
                            : canAfford 
                                ? 'bg-emerald-500 text-white hover:bg-emerald-400 hover:scale-105 active:scale-95' 
                                : 'bg-white/5 text-gray-600 cursor-not-allowed'
                        }`}
                    >
                        {isUnlocked ? '장착하기' : `${currentPreviewItem?.price.toLocaleString()} 코인으로 구매`}
                    </button>
                    {!isUnlocked && !canAfford && <div className="mt-4 text-red-500 text-xs font-bold">코인이 부족합니다</div>}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {view === 'GAME' && (
        <>
            <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="block" />
            <GameHUD playerName={user.username} score={hud.score} distance={hud.distance} difficulty={hud.difficulty} />
            {user.isAdmin && (
                <button onClick={() => setIsAdminOpen(true)} className="fixed bottom-6 right-6 bg-[#0F1115] border border-[#1F2937] p-4 rounded hover:bg-[#1F2937] group transition-all z-40 pointer-events-auto">
                    <Settings className="text-gray-500 group-hover:text-emerald-400 w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                </button>
            )}
        </>
      )}

      <AnimatePresence>
        {isGameOver && <GameOver score={finalScore} highscore={user.highscore} onRestart={handleRestart} onHome={handleHome} />}
        {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} />}
      </AnimatePresence>

      <div className="fixed bottom-6 left-6 text-gray-700 text-[9px] uppercase font-mono font-bold tracking-[0.3em] pointer-events-none z-[60]">
        제어: [W] / [SPACE] (2단 점프) | 마우스 좌클릭 (이동 토글) // 시스템: [CTRL+SHIFT+A]
      </div>
    </div>
  );
}
