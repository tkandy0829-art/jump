/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Gamepad2, Info } from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = AuthService.login(username);
      if (user) {
        onLogin(user);
      } else {
        setError('사용자_찾을_수_없음: 액세스_거부됨');
      }
    } else {
      const newUser = AuthService.register(username);
      if (newUser) {
        onLogin(newUser);
      } else {
        setError('등록_오류: 영문숫자_전용_또는_중복');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0B0D] p-4 font-sans ring-1 ring-[#1F2937]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0F1115] border border-[#1F2937] p-8 rounded shadow-2xl relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600" />
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-600 rounded flex items-center justify-center font-bold text-white text-xl">S</div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">SUPER_AI <span className="text-emerald-500 text-xs font-mono ml-1">v2.0.4</span></h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Platformer_Architect</p>
          </div>
        </div>

        <div className="flex bg-[#0A0B0D] p-1 rounded border border-[#1F2937] mb-8">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-all ${isLogin ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' : 'text-gray-500 hover:text-gray-300'}`}
          >
            시스템_로그인
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-all ${!isLogin ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' : 'text-gray-500 hover:text-gray-300'}`}
          >
            시스템_등록
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">
              식별_키 (사용자명)
            </label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="영문/숫자 키를 입력하십시오..."
              className="w-full bg-[#0A0B0D] border border-[#1F2937] text-[#E0E0E0] px-4 py-3 rounded font-mono text-sm focus:outline-none focus:border-emerald-500 transition-all"
              required
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-[10px] font-mono bg-red-950/20 p-3 rounded border border-red-900/50 flex items-center gap-2"
              >
                <Info className="w-3 h-3" />
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center group"
          >
            {isLogin ? (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                세션_수립
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                핸드셰이크_시작
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-[#1F2937] flex flex-col items-center space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            <span className="text-[10px] font-mono text-emerald-400">상태: 코어_시스템_준비됨</span>
          </div>
          <p className="text-[10px] text-gray-600 font-mono">© 2026 ARCHITECT_CLI // v2.0.4</p>
        </div>
      </motion.div>
    </div>
  );
}
