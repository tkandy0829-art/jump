/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vector2, Rect } from '../types';
import { soundEngine } from '../services/SoundEngine';

export interface GameObject {
  id: string;
  type: 'player' | 'enemy' | 'platform' | 'coin' | 'block';
  pos: Vector2;
  vel: Vector2;
  size: Vector2;
  color: string;
  isGrounded: boolean;
  hasItem?: boolean;
  behavior?: 'static' | 'vertical' | 'horizontal' | 'ghost' | 'bouncy' | 'crumbling' | 'speed_boost' | 'sticky' | 'conveyor';
  originY?: number;
  originX?: number;
  range?: number;
  timer?: number;
  opacity?: number;
  isTouched?: boolean;
  animateTimer?: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lastTime = 0;
  private player: GameObject & { jumpCount: number };
  private entities: GameObject[] = [];
  private cameraX = 0;
  private score = 0;
  private distance = 0;
  private difficulty = 1;
  private isGameOver = false;
  private isMovementPaused = false;
  private currentSpeed = 8;
  private speedMultiplier = 1;
  private currentSkin = 'default';
  private coinsGained = 0;
  private deathTimer = 0;

  // Constants for "쫀득한 조작감" (Juicy Controls)
  private readonly GRAVITY_UP = 0.5;
  private readonly GRAVITY_DOWN = 0.7;
  private readonly JUMP_FORCE = -13.5; 
  private readonly MAX_JUMPS = 2;

  public toggleMovement() {
    this.isMovementPaused = !this.isMovementPaused;
  }

  public setPaused(paused: boolean) {
    this.isMovementPaused = paused;
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.player = {
      id: 'player',
      type: 'player',
      pos: { x: 50, y: 300 },
      vel: { x: 8, y: 0 },
      size: { x: 32, y: 48 },
      color: '#E0E0E0',
      isGrounded: false,
      jumpCount: 0
    };

    this.initLevel();
  }

  public setSkin(skin: string) {
    this.currentSkin = skin;
  }

  private initLevel() {
    this.entities = [
      { id: 'floor-0', type: 'platform', pos: { x: -100, y: 550 }, vel: { x: 0, y: 0 }, size: { x: 1200, y: 50 }, color: '#1F2937', isGrounded: true },
      { id: 'block-1', type: 'block', pos: { x: 300, y: 400 }, vel: { x: 0, y: 0 }, size: { x: 40, y: 40 }, color: '#374151', isGrounded: true, hasItem: true },
    ];
  }

  private spawnEntities() {
    const lastEntity = this.entities[this.entities.length - 1];
    
    // Balanced Generation: Easier gaps
    if (lastEntity && lastEntity.pos.x < this.cameraX + this.canvas.width + 800) {
      const type = Math.random() > 0.85 ? 'enemy' : 'platform';
      
      // Calculate safe distance: max gap ~280 pixels (very safe for speed 6.5)
      const gapX = 120 + Math.random() * 180; 
      const x = lastEntity.pos.x + lastEntity.size.x + gapX;
      
      const lastY = lastEntity.type === 'platform' ? lastEntity.pos.y : 500;
      const y = Math.max(300, Math.min(550, lastY + (Math.random() - 0.5) * 120));
      
      if (type === 'platform') {
        const width = 300 + Math.random() * 400;
        const rand = Math.random();
        let behavior: any = 'static';
        let color = '#1F2937';
        let velY = 0;
        let velX = 0;

        if (rand > 0.92) {
            behavior = 'vertical';
            color = '#4B5563';
            velY = 1.2;
        } else if (rand > 0.84) {
            behavior = 'horizontal';
            color = '#374151';
            velX = 1.5;
        } else if (rand > 0.76) {
            behavior = 'ghost';
            color = '#6B7280';
        } else if (rand > 0.68) {
            behavior = 'bouncy';
            color = '#84CC16'; // Lime
        } else if (rand > 0.60) {
            behavior = 'crumbling';
            color = '#92400E'; // Brown
        } else if (rand > 0.52) {
            behavior = 'speed_boost';
            color = '#F59E0B'; // Gold
        } else if (rand > 0.44) {
            behavior = 'sticky';
            color = '#4C1D95'; // Dark Purple
        } else if (rand > 0.36) {
            behavior = 'conveyor';
            color = '#3B82F6'; // Blue
            velX = 3; // Conveyor speed
        }
        
        this.entities.push({
          id: `gen-${Date.now()}`,
          type: 'platform',
          pos: { x, y },
          vel: { x: velX, y: velY },
          size: { x: width, y: 20 },
          color, 
          isGrounded: true,
          behavior,
          originY: y,
          originX: x,
          range: (100 + Math.random() * 100) * 1.5,
          timer: Math.random() * 10,
          opacity: 1
        });

        // Chance to spawn a block on top
        if (Math.random() > 0.6) {
          this.entities.push({
            id: `block-${Date.now()}`,
            type: 'block',
            pos: { x: x + width / 2 - 20, y: y - 100 },
            vel: { x: 0, y: 0 },
            size: { x: 40, y: 40 },
            color: '#374151',
            isGrounded: true,
            hasItem: true
          });
        }
      } else {
         this.entities.push({
          id: `gen-${Date.now()}`,
          type: 'enemy',
          pos: { x, y: 518 },
          vel: { x: -(1 + this.difficulty * 0.05), y: 0 }, // Slower enemy scaling
          size: { x: 32, y: 32 },
          color: '#EF4444',
          isGrounded: false
        });
      }
    }

    this.entities = this.entities.filter(e => e.pos.x > this.cameraX - 1000);
  }

  private jumpRequested = false;

  public update(keys: { [key: string]: boolean }) {
    if (this.isGameOver) return;

    // Forward Movement (Paused by 'm' key)
    if (this.isMovementPaused) {
      this.player.vel.x = 0;
    } else {
      this.player.vel.x = 8 * this.speedMultiplier;
      
      // Slow decay back to normal speed
      if (this.speedMultiplier > 1) this.speedMultiplier -= 0.008;
      if (this.speedMultiplier < 1) this.speedMultiplier += 0.005;
      if (Math.abs(this.speedMultiplier - 1) < 0.01) this.speedMultiplier = 1;
    }

    // Jump Input Handling (Single press trigger)
    const isJumpPressed = keys['ArrowUp'] || keys['w'] || keys[' '];
    if (isJumpPressed && !this.jumpRequested) {
      if (this.player.jumpCount < this.MAX_JUMPS) {
        this.player.vel.y = this.JUMP_FORCE;
        this.player.isGrounded = false;
        this.player.jumpCount++;
        soundEngine.playJump();
      }
      this.jumpRequested = true;
    }
    if (!isJumpPressed) {
      this.jumpRequested = false;
    }

    // Gravity (Juice: lower gravity on ascent)
    const gravity = this.player.vel.y < 0 ? this.GRAVITY_UP : this.GRAVITY_DOWN;
    this.player.vel.y += gravity;

    // Apply Velocity
    this.player.pos.x += this.player.vel.x;
    this.player.pos.y += this.player.vel.y;

    // Camera follow (Keep player in left-middle)
    this.cameraX = this.player.pos.x - 200;

    this.checkCollisions();
    
    if (this.player.pos.y > 800) {
      this.gameOver();
    }

    this.distance = Math.max(this.distance, Math.floor(this.player.pos.x / 40));
    this.difficulty = 1 + Math.floor(this.distance / 300);
    
    this.spawnEntities();
    this.updateEnemies();
  }

  private updateEnemies() {
    this.entities.forEach(e => {
      if (e.type === 'enemy') {
        e.pos.x += e.vel.x;
      } else if (e.behavior === 'vertical' && e.originY !== undefined && e.range !== undefined) {
        e.pos.y += e.vel.y;
        if (Math.abs(e.pos.y - e.originY) > e.range) {
          e.vel.y *= -1;
        }
      } else if (e.behavior === 'horizontal' && e.originX !== undefined && e.range !== undefined) {
        e.pos.x += e.vel.x;
        // Adjust for global movement if needed, but here simple relative range suffice
        if (Math.abs(e.pos.x - e.originX) > e.range) {
          e.vel.x *= -1;
        }
      } else if (e.behavior === 'ghost') {
        if (e.timer === undefined) e.timer = 0;
        if (e.opacity === undefined) e.opacity = 1;
        e.timer += 0.02;
        e.opacity = (Math.sin(e.timer) + 1) / 2;
      } else if (e.behavior === 'crumbling' && e.isTouched) {
        if (e.timer === undefined) e.timer = 1;
        e.timer -= 0.02; // Crumble down
        if (e.timer <= 0) {
          this.entities = this.entities.filter(ent => ent.id !== e.id);
        }
      }
    });
  }

  private checkCollisions() {
    // We don't reset isGrounded here to avoid flicker during platform walking
    // but we need to know when we fall off
    let stillOnGround = false;

    for (const e of this.entities) {
      // Don't collide with ghost if it's too transparent
      if (e.behavior === 'ghost' && (e.opacity ?? 1) < 0.3) continue;

      if (this.collides(this.player, e)) {
        if (e.type === 'platform' || e.type === 'block') {
           const overlapX = (this.player.pos.x + this.player.size.x / 2) - (e.pos.x + e.size.x / 2);
           const overlapY = (this.player.pos.y + this.player.size.y / 2) - (e.pos.y + e.size.y / 2);

           const normalizedOverlapX = Math.abs(overlapX / e.size.x);
           const normalizedOverlapY = Math.abs(overlapY / e.size.y);

           if (normalizedOverlapX < normalizedOverlapY) {
             if (overlapY < 0) { // Top
               this.player.pos.y = e.pos.y - this.player.size.y;
               if (e.behavior === 'bouncy') {
                 this.player.vel.y = this.JUMP_FORCE * 1.5;
                 soundEngine.playJump();
               } else {
                 this.player.vel.y = 0;
               }
               if (e.behavior === 'speed_boost') {
                 this.speedMultiplier = 1.8;
               }
               if (e.behavior === 'sticky') {
                 this.speedMultiplier = 0.4;
               }
               if (e.behavior === 'conveyor') {
                 this.player.pos.x += e.vel.x;
               }
               if (e.behavior === 'crumbling') {
                 e.isTouched = true;
               }
               this.player.isGrounded = true;
               this.player.jumpCount = 0;
               stillOnGround = true;
             } else { // Bottom
               this.player.pos.y = e.pos.y + e.size.y;
               this.player.vel.y = 0;
               if (e.type === 'block') {
                 this.hitBlock(e);
                 soundEngine.playCollectJingle();
               }
             }
           } else {
             // Side hit: Resolve collision without game over
             if (e.type === 'block' || e.type === 'platform') {
               if (overlapX < 0) { // Hitting left side or front
                 this.player.pos.x = e.pos.x - this.player.size.x;
                 this.player.vel.x = 0;
               } else { // Hitting right side or back
                 this.player.pos.x = e.pos.x + e.size.x;
                 this.player.vel.x = 0;
               }
             }
           }
        } else if (e.type === 'enemy') {
          if (this.player.vel.y > 0 && this.player.pos.y < e.pos.y) {
            this.stompEnemy(e);
            soundEngine.playStompExplosion();
          } else {
            this.gameOver();
          }
        }
      }
    }
    
    if (!stillOnGround && this.player.isGrounded && this.player.vel.y > 1) {
       this.player.isGrounded = false;
       if (this.player.jumpCount === 0) this.player.jumpCount = 1; // Count as 1 jump if just walked off
    }
  }

  private hitBlock(e: GameObject) {
    if (e.hasItem) {
      this.score += 100;
      this.coinsGained += 100;
      e.hasItem = false;
      e.color = '#1F2937'; // Hit state
    }
  }

  private stompEnemy(e: GameObject) {
    this.player.vel.y = -10; // Bounce
    this.score += 200;
    this.coinsGained += 200;
    this.entities = this.entities.filter(ent => ent.id !== e.id);
    soundEngine.playStompExplosion();
  }

  private collides(a: GameObject, b: GameObject): boolean {
    return a.pos.x < b.pos.x + b.size.x &&
           a.pos.x + a.size.x > b.pos.x &&
           a.pos.y < b.pos.y + b.size.y &&
           a.pos.y + a.size.y > b.pos.y;
  }

  private gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    soundEngine.playDeathSound();
    
    // Dispatch after 2 seconds as requested
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('gameover', { 
        detail: { 
          score: this.score + this.distance,
          coins: this.coinsGained
        } 
      }));
    }, 2000);
  }

  public draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Background (Elegant Dark Gray)
    this.ctx.fillStyle = '#0A0B0D';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(-this.cameraX, 0);

    // Grid lines for "Architect" feel
    this.ctx.strokeStyle = '#1F2937';
    this.ctx.lineWidth = 1;
    const gridSpacing = 100;
    const startIdx = Math.floor(this.cameraX / gridSpacing);
    for (let i = startIdx; i < startIdx + (this.canvas.width / gridSpacing) + 2; i++) {
        const x = i * gridSpacing;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
    }

    // Entities
    this.entities.forEach(e => {
      this.ctx.save();
      if (e.behavior === 'ghost') {
        this.ctx.globalAlpha = e.opacity ?? 1;
      }
      if (e.behavior === 'crumbling' && e.isTouched) {
        this.ctx.globalAlpha = e.timer ?? 1;
        const shake = (1 - (e.timer ?? 1)) * 10;
        this.ctx.translate((Math.random() - 0.5) * shake, 0);
      }
      if (e.behavior === 'bouncy') {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = e.color;
      }

      this.ctx.fillStyle = e.color;
      this.ctx.strokeStyle = '#374151';
      this.ctx.lineWidth = 1;
      this.ctx.fillRect(e.pos.x, e.pos.y, e.size.x, e.size.y);
      this.ctx.strokeRect(e.pos.x, e.pos.y, e.size.x, e.size.y);

      if (e.type === 'block' && e.hasItem) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(e.pos.x + 8, e.pos.y + 8, e.size.x - 16, e.size.y - 16);
      }

      this.ctx.restore();
    });

    this.drawPlayer();

    this.ctx.restore();
  }

  private drawPlayer() {
    const p = this.player;
    const x = p.pos.x;
    const y = p.pos.y;
    const w = p.size.x;
    const h = p.size.y;
    
    // Animation state: moving on ground
    const isMoving = Math.abs(p.vel.x) > 0.1 && !this.isMovementPaused && p.isGrounded;
    const time = performance.now() / 1000;
    
    // 0.5s for a swap (front to back) means 1s for a full cycle (front-back-front)
    const frequency = 1; 
    const walkCycle = isMoving ? Math.sin(time * Math.PI * 2 * frequency) : 0;
    const swingAngle = walkCycle * 0.6; // ~35 degrees max swing

    this.ctx.save();
    
    // Glow effect for the hero
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = 'rgba(34, 197, 94, 0.3)';

    // Parts setup
    const headSize = w * 0.55;
    const torsoW = w * 0.7;
    const torsoH = h * 0.35;
    const legH = h * 0.35;
    const armH = h * 0.25;

    // Skin Color Mapping
    let shirtColor = '#22C55E';
    let backShirtColor = '#15803D';
    let pantsColor = '#3B82F6';
    let backPantsColor = '#1D4ED8';

    if (this.currentSkin === 'red') { shirtColor = '#EF4444'; backShirtColor = '#991B1B'; }
    else if (this.currentSkin === 'yellow') { shirtColor = '#F59E0B'; backShirtColor = '#92400E'; }
    else if (this.currentSkin === 'blue') { shirtColor = '#3B82F6'; backShirtColor = '#1E40AF'; }
    else if (this.currentSkin === 'black') { shirtColor = '#1F2937'; backShirtColor = '#111827'; }
    else if (this.currentSkin === 'fire') { shirtColor = '#3B82F6'; backShirtColor = '#1E40AF'; } // Blue base

    // 1. Back Leg
    this.drawLimb(x + w/2, y + h - legH, w * 0.35, legH, -swingAngle, backPantsColor); 
    
    // 2. Back Arm
    this.drawLimb(x + w/2, y + headSize + 5, w * 0.25, armH, -swingAngle * 0.8, backShirtColor);

    // 3. Torso
    this.ctx.fillStyle = shirtColor;
    this.ctx.beginPath();
    this.ctx.roundRect(x + (w - torsoW)/2, y + headSize - 2, torsoW, torsoH, 4);
    this.ctx.fill();

    // Fire Detail for 'fire' skin
    if (this.currentSkin === 'fire') {
      this.ctx.fillStyle = '#EF4444';
      this.ctx.beginPath();
      this.ctx.arc(x + w/2, y + headSize + torsoH/2, 4, 0, Math.PI * 2);
      this.ctx.fill();
      // Glow for fire
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#EF4444';
    }

    // 4. Head
    this.ctx.fillStyle = '#FFDBAC';
    this.ctx.beginPath();
    this.ctx.arc(x + w/2, y + headSize/2, headSize/2, 0, Math.PI * 2);
    this.ctx.fill();

    // Face Detail
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(x + w/2 + 4, y + headSize/2 - 2, 3, 3);

    // 5. Front Leg
    this.drawLimb(x + w/2, y + h - legH, w * 0.35, legH, swingAngle, pantsColor); 

    // 6. Front Arm
    this.drawLimb(x + w/2, y + headSize + 5, w * 0.25, armH, swingAngle * 0.8, shirtColor);

    this.ctx.restore();
  }

  private drawLimb(x: number, y: number, w: number, h: number, angle: number, color: string) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.roundRect(-w/2, 0, w, h, w/2);
    this.ctx.fill();
    this.ctx.restore();
  }

  public getHUD() {
    return {
      score: this.score,
      distance: this.distance,
      difficulty: this.difficulty
    };
  }

  public reset() {
    this.cameraX = 0;
    this.score = 0;
    this.distance = 0;
    this.difficulty = 1;
    this.coinsGained = 0;
    this.isGameOver = false;
    this.isMovementPaused = false;
    this.player.pos = { x: 50, y: 300 };
    this.player.vel = { x: 0, y: 0 };
    this.initLevel();
  }
}
