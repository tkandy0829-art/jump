/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Shield, ShieldAlert, User as UserIcon, Settings } from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { User } from '../types';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setUsers(AuthService.getUsers());
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setUsers(AuthService.searchUsers(query));
  };

  const toggleAdmin = (userId: string, currentStatus: boolean) => {
    AuthService.updateUserStatus(userId, !currentStatus);
    setUsers(AuthService.getUsers());
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-sans"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#0A0B0D] border border-[#1F2937] w-full max-w-4xl max-h-[85vh] rounded shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-[#1F2937] flex items-center justify-between bg-[#0F1115]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center font-bold text-white text-sm">M</div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">마스터_제어_패널 <span className="text-emerald-500 text-[10px] font-mono ml-2">v2.0.4-SECURE</span></h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 border border-[#374151] rounded text-gray-500 hover:text-white hover:bg-[#1F2937] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-auto custom-scrollbar">
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
            <input 
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="식별 키 검색..."
              className="w-full bg-[#0F1115] border border-[#1F2937] text-gray-300 pl-11 pr-4 py-3 rounded font-mono text-sm focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {users.map(user => (
                <motion.div 
                  key={user.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0F1115] border border-[#1F2937] p-4 rounded flex items-center justify-between hover:bg-[#15181e] transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-[#0A0B0D] border border-[#1F2937] rounded flex items-center justify-center">
                      <UserIcon className="text-gray-600 w-5 h-5 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-[#E0E0E0] font-bold text-sm tracking-tight">{user.username}</p>
                      <p className="text-gray-600 font-mono text-[9px] uppercase">ID://{user.id}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-emerald-500/80 uppercase">최고_기록:</span>
                        <span className="text-[10px] font-mono text-gray-500">{user.highscore}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => toggleAdmin(user.id, !!user.isAdmin)}
                    className={`px-3 py-1.5 rounded transition-all text-[9px] font-bold uppercase tracking-widest border ${user.isAdmin ? 'bg-red-900/10 text-red-500 border-red-900/50 hover:bg-red-900/30' : 'bg-emerald-900/10 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/30'}`}
                  >
                    {user.isAdmin ? '권한_회수' : '마스터_권한_부여'}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-24">
               <div className="w-16 h-16 bg-[#0F1115] border border-[#1F2937] rounded-full flex items-center justify-center mx-auto mb-4">
                 <Search className="w-6 h-6 text-gray-700" />
               </div>
               <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-600">일치하는_신호_없음</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#1F2937] bg-[#0F1115] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></span>
              <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">안전_동기화: 양호</span>
            </div>
          </div>
          <span className="text-[9px] font-mono text-gray-600 uppercase">ARCHITECT_CONSOLE v2304</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
