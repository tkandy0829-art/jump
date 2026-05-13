/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  username: string;
  highscore: number;
  coins: number;
  unlockedSkins: string[];
  currentSkin: string;
  isAdmin?: boolean;
}

export interface GameState {
  score: number;
  distance: number;
  health: number;
  isGameOver: boolean;
  difficulty: number;
}

export type EntityType = 'player' | 'enemy' | 'platform' | 'coin' | 'block' | 'flower';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
