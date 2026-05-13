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
      unlockedItems: ['shirt_default', 'pants_default', 'hair_default'],
      currentShirt: 'shirt_default',
      currentPants: 'pants_default',
      currentHair: 'hair_default',
      currentSet: null,
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
    if (!user.unlockedItems) {
        user.unlockedItems = (user as any).unlockedSkins || ['shirt_default', 'pants_default', 'hair_default'];
    }
    if (!user.currentShirt) user.currentShirt = (user as any).currentSkin || 'shirt_default';
    if (!user.currentPants) user.currentPants = 'pants_default';
    if (!user.currentHair) user.currentHair = 'hair_default';
    if (user.currentSet === undefined) user.currentSet = null;
    
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

  buyItem: (userId: string, itemId: string, price: number) => {
    const users = AuthService.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const user = users[userIndex];
      if (user.coins >= price && !user.unlockedItems.includes(itemId)) {
        user.coins -= price;
        user.unlockedItems.push(itemId);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        const currentUser = AuthService.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          currentUser.coins -= price;
          currentUser.unlockedItems.push(itemId);
          AuthService.setCurrentUser(currentUser);
        }
        return true;
      }
    }
    return false;
  },

  equipItem: (userId: string, itemId: string, category: string) => {
    const users = AuthService.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const user = users[userIndex];
      if (category === 'shirt') user.currentShirt = itemId;
      else if (category === 'pants') user.currentPants = itemId;
      else if (category === 'hair') user.currentHair = itemId;
      else if (category === 'set') user.currentSet = itemId;
      else if (category === 'clear_set') user.currentSet = null;

      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      const currentUser = AuthService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        if (category === 'shirt') currentUser.currentShirt = itemId;
        else if (category === 'pants') currentUser.currentPants = itemId;
        else if (category === 'hair') currentUser.currentHair = itemId;
        else if (category === 'set') currentUser.currentSet = itemId;
        else if (category === 'clear_set') currentUser.currentSet = null;
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
