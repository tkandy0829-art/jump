/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Trophy, TrendingUp, Zap } from 'lucide-react';

interface GameHUDProps {
  score: number;
  distance: number;
  difficulty: number;
  playerName: string;
}

export default function GameHUD({ score, distance, difficulty, playerName }: GameHUDProps) {
  return (
    <div className="fixed top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-10 font-mono">
      <div className="flex flex-col space-y-3">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-[#0F1115] border border-[#1F2937] px-4 py-2 rounded flex items-center gap-3 shadow-xl"
        >
          <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center text-white font-bold text-[10px]">
             {playerName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">플레이어_ID</span>
            <span className="text-white font-bold text-xs">{playerName}</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0F1115] border border-[#1F2937] px-4 py-3 rounded flex items-center gap-4 shadow-xl overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
          <Trophy className="text-yellow-500 w-5 h-5 shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold uppercase text-gray-500 tracking-tighter mb-1">누적_점수</span>
            <span className="text-2xl font-black text-[#E0E0E0] tabular-nums tracking-tighter">{score.toLocaleString()}</span>
          </div>
        </motion.div>
      </div>

      <div className="flex space-x-3">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0F1115] border border-[#1F2937] px-4 py-2 rounded flex items-center gap-3 shadow-xl"
        >
          <TrendingUp className="text-emerald-400 w-4 h-4" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest mb-1">진행_거리</span>
            <span className="text-sm font-bold text-[#E0E0E0]">{distance}M</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0F1115] border border-[#1F2937] px-4 py-2 rounded flex items-center gap-3 shadow-xl"
        >
          <Zap className={`w-4 h-4 ${difficulty > 5 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest mb-1">난이도</span>
            <span className="text-sm font-bold text-[#E0E0E0]">LVL_{difficulty.toString().padStart(2, '0')}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
