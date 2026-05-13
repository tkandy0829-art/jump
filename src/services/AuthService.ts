/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from '../types';

const USERS_KEY = 'super_platformer_users';
const CURRENT_USER_KEY = 'super_platformer_current_user';

export const AuthService = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  register: (username: string): User | null => {
    // Regex: alphanumeric only
    const regex = /^[a-zA-Z0-9]+$/;
    if (!regex.test(username)) return null;

    const users = AuthService.getUsers();
    const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) return null;

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      highscore: 0,
      coins: 0,
      unlockedSkins: ['default'],
      currentSkin: 'default',
      isAdmin: username.toLowerCase() === 'admin'
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newUser;
  },

  login: (username: string): User | null => {
    const users = AuthService.getUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (!data) return null;
    const user = JSON.parse(data) as User;
    
    // Safety migration for old user data
    if (user.coins === undefined) user.coins = 0;
    if (!user.unlockedSkins) user.unlockedSkins = ['default'];
    if (!user.currentSkin) user.currentSkin = 'default';
    
    return user;
  },

  updateHighscore: (userId: string, score: number) => {
    const users = AuthService.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      if (score > users[userIndex].highscore) {
        users[userIndex].highscore = score;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        // Sync current user
        const currentUser = AuthService.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          currentUser.highscore = score;
          AuthService.setCurrentUser(currentUser);
        }
      }
    }
  },

  addCoins: (userId: string, amount: number) => {
    const users = AuthService.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].coins += amount;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      const currentUser = AuthService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        currentUser.coins += amount;
        AuthService.setCurrentUser(currentUser);
      }
    }
  },

  buySkin: (userId: string, skinId: string, price: number) => {
    const users = AuthService.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const user = users[userIndex];
      if (user.coins >= price && !user.unlockedSkins.includes(skinId)) {
        user.coins -= price;
        user.unlockedSkins.push(skinId);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        const currentUser = AuthService.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          currentUser.coins -= price;
          currentUser.unlockedSkins.push(skinId);
          AuthService.setCurrentUser(currentUser);
        }
        return true;
      }
    }
    return false;
  },

  setCurrentSkin: (userId: string, skinId: string) => {
    const users = AuthService.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].currentSkin = skinId;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      const currentUser = AuthService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        currentUser.currentSkin = skinId;
        AuthService.setCurrentUser(currentUser);
      }
    }
  },

  // Admin methods
  searchUsers: (query: string): User[] => {
    const users = AuthService.getUsers();
    return users.filter(u => u.username.toLowerCase().includes(query.toLowerCase()));
  },

  updateUserStatus: (userId: string, isAdmin: boolean) => {
    const users = AuthService.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].isAdmin = isAdmin;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }
};
