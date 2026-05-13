/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { RotateCcw, Home, Skull, Trophy } from 'lucide-react';

interface GameOverProps {
  score: number;
  highscore: number;
  onRestart: () => void;
  onHome: () => void;
}

export default function GameOver({ score, highscore, onRestart, onHome }: GameOverProps) {
  const isNewHighscore = score > highscore;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 font-mono"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm bg-[#0A0B0D] border border-[#1F2937] p-8 rounded shadow-2xl text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
        
        <div className="mb-6 flex justify-center">
           <div className="p-4 bg-red-950/20 rounded border border-red-900/50">
             <Skull className="w-12 h-12 text-red-500" />
           </div>
        </div>

        <h2 className="text-3xl font-black text-white italic tracking-tighter mb-1 uppercase">세션_종료됨</h2>
        <p className="text-gray-600 font-bold uppercase text-[9px] tracking-widest mb-8">메인_엔진과의 연결이 끊어졌습니다</p>

        <div className="bg-[#0F1115] border border-[#1F2937] rounded p-6 mb-8 relative">
          <div className="flex flex-col items-center mb-6">
             <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-2">최종_누적치</span>
             <span className="text-5xl font-black text-[#E0E0E0] tabular-nums tracking-tighter">{score.toLocaleString()}</span>
          </div>
          
          <div className="h-[1px] bg-[#1F2937] w-full mb-4" />

          <div className="flex items-center justify-center space-x-3">
             <Trophy className={`w-3 h-3 ${isNewHighscore ? 'text-emerald-500 animate-pulse' : 'text-gray-600'}`} />
             <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">기록_동기화: {Math.max(score, highscore).toLocaleString()}</span>
          </div>
          {isNewHighscore && (
            <motion.div 
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 5, scale: 1 }}
              className="absolute -top-3 -right-3 bg-emerald-600 text-white font-black text-[9px] py-1 px-3 rounded shadow-lg border border-white/10 uppercase"
            >
              최고_기록
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onRestart}
            className="bg-emerald-600 text-white font-black py-4 rounded text-xs uppercase tracking-widest hover:bg-emerald-500 transition-colors group shadow-lg shadow-emerald-600/10"
          >
            시스템_재부팅
          </button>
          <button 
            onClick={onHome}
            className="bg-[#1F2937] text-gray-300 font-bold py-4 rounded text-xs uppercase tracking-widest hover:bg-gray-700 transition-colors shadow-lg border border-[#374151]"
          >
            응용_프로그램_중단
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
