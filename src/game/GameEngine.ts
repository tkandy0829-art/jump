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
  private speedMultiplier = 1;
  private coinsGained = 0;
  private particles: any[] = [];
  private prevKeys: { [key: string]: boolean } = {};
  
  private playerEquip = {
    shirt: 'shirt_default',
    pants: 'pants_default',
    hair: 'hair_default',
    set: null as string | null
  };

  private readonly GRAVITY_UP = 0.5;
  private readonly GRAVITY_DOWN = 0.7;
  private readonly JUMP_FORCE = -15; 

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

  public setEquipment(equip: { shirt: string, pants: string, hair: string, set: string | null }) {
    this.playerEquip = { ...equip };
  }

  public toggleMovement() {
    this.isMovementPaused = !this.isMovementPaused;
  }

  private initLevel() {
    this.entities = [
      { id: 'floor-0', type: 'platform', pos: { x: -100, y: 550 }, vel: { x: 0, y: 0 }, size: { x: 1200, y: 50 }, color: '#1F2937', isGrounded: true },
      { id: 'block-1', type: 'block', pos: { x: 300, y: 400 }, vel: { x: 0, y: 0 }, size: { x: 40, y: 40 }, color: '#374151', isGrounded: true, hasItem: true },
    ];
  }

  public update(keys: { [key: string]: boolean }) {
    if (this.isGameOver) return;

    if (this.isMovementPaused) {
      this.player.vel.x = 0;
    } else {
      this.player.vel.x = 8 * this.speedMultiplier;
      if (this.speedMultiplier > 1) this.speedMultiplier -= 0.008;
      if (this.speedMultiplier < 1) this.speedMultiplier += 0.005;
      if (Math.abs(this.speedMultiplier - 1) < 0.01) this.speedMultiplier = 1;
    }

    const jumpPower = this.playerEquip.set === 'set_mario' ? -22.5 : -15;
    if ((keys['w'] || keys[' '] || keys['ArrowUp']) && this.player.jumpCount < 2) {
      if (!this.prevKeys['w'] && !this.prevKeys[' '] && !this.prevKeys['ArrowUp']) {
        this.player.vel.y = jumpPower;
        this.player.jumpCount++;
        soundEngine.playJump();
      }
    }
    this.prevKeys = { ...keys };

    const gravity = this.player.vel.y < 0 ? this.GRAVITY_UP : this.GRAVITY_DOWN;
    this.player.vel.y += gravity;
    this.player.pos.x += this.player.vel.x;
    this.player.pos.y += this.player.vel.y;
    this.cameraX = this.player.pos.x - 200;

    this.checkCollisions();
    
    if (this.player.pos.y > 800) this.gameOver();
    this.distance = Math.max(this.distance, Math.floor(this.player.pos.x / 40));
    this.difficulty = 1 + Math.floor(this.distance / 300);
    this.spawnEntities();
    this.updateEnemies();
    this.updateParticles();
  }

  private updateParticles() {
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
    });
  }

  private spawnEntities() {
    const lastEntity = this.entities[this.entities.length - 1];
    if (lastEntity && lastEntity.pos.x < this.cameraX + this.canvas.width + 800) {
      const gapX = 150 + Math.random() * 200;
      const x = lastEntity.pos.x + lastEntity.size.x + gapX;
      const y = 300 + Math.random() * 250;
      this.entities.push({
        id: `gen-${Date.now()}`,
        type: Math.random() > 0.8 ? 'enemy' : 'platform',
        pos: { x, y: Math.random() > 0.8 ? 518 : y },
        vel: { x: -2, y: 0 },
        size: { x: 200 + Math.random() * 200, y: 20 },
        color: '#1F2937',
        isGrounded: true
      });
    }
    this.entities = this.entities.filter(e => e.pos.x > this.cameraX - 1000);
  }

  private updateEnemies() {
    this.entities.forEach(e => {
      if (e.type === 'enemy') e.pos.x += e.vel.x;
    });
  }

  private checkCollisions() {
    let stillOnGround = false;
    for (const e of this.entities) {
      if (this.collides(this.player, e)) {
        if (e.type === 'platform' || e.type === 'block') {
            const overlapY = (this.player.pos.y + this.player.size.y) - e.pos.y;
            if (this.player.vel.y > 0 && overlapY < 20) {
                this.player.pos.y = e.pos.y - this.player.size.y;
                this.player.vel.y = 0;
                this.player.isGrounded = true;
                this.player.jumpCount = 0;
                stillOnGround = true;
            } else if (this.player.vel.y < 0 && e.type === 'block' && e.pos.y < this.player.pos.y) {
                this.hitBlock(e);
                this.player.vel.y = 1;
                soundEngine.playCollectJingle();
            }
        } else if (e.type === 'enemy') {
          if (this.player.vel.y > 0 && this.player.pos.y < e.pos.y) {
            this.stompEnemy(e);
          } else {
            this.gameOver();
          }
        }
      }
    }
    if (!stillOnGround) this.player.isGrounded = false;
  }

  private hitBlock(e: GameObject) {
    if (e.hasItem) {
      this.score += 100;
      this.coinsGained += 100;
      e.hasItem = false;
      e.color = '#1F2937';
    }
  }

  private stompEnemy(e: GameObject) {
    this.player.vel.y = -10;
    this.score += 200;
    this.coinsGained += 200;
    this.entities = this.entities.filter(ent => ent.id !== e.id);
    soundEngine.playStompExplosion();
  }

  private collides(a: GameObject, b: GameObject) {
    return a.pos.x < b.pos.x + b.size.x && a.pos.x + a.size.x > b.pos.x &&
           a.pos.y < b.pos.y + b.size.y && a.pos.y + a.size.y > b.pos.y;
  }

  private gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    if (this.playerEquip.set === 'set_squid') soundEngine.playGunshot();
    else soundEngine.playDeathSound();
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('gameover', { 
        detail: { score: this.score + this.distance, coins: this.coinsGained } 
      }));
    }, 2000);
  }

  public draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#0A0B0D';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(-this.cameraX, 0);

    this.entities.forEach(e => {
      this.ctx.fillStyle = e.color;
      this.ctx.fillRect(e.pos.x, e.pos.y, e.size.x, e.size.y);
    });

    this.drawPlayer();

    this.particles.forEach(p => {
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(p.x - this.cameraX, p.y, 4, 4);
    });
    this.ctx.globalAlpha = 1;

    this.ctx.restore();
  }

  private drawPlayer() {
    const { pos, size } = this.player;
    const x = pos.x - this.cameraX;
    const y = pos.y;
    const w = size.x;
    const h = size.y;

    if (this.playerEquip.set === 'set_rich' && !this.isGameOver && Math.random() > 0.8) {
        this.particles.push({
            x: pos.x + w/2, y: pos.y + h,
            vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 3,
            life: 1, color: '#FFD700'
        });
    }

    const skinColor = '#FFDBAC';
    let shirtColor = '#22C55E';
    let pantsColor = '#3B82F6';
    let hairColor = '#000000';
    
    if (this.playerEquip.shirt === 'red') shirtColor = '#EF4444';
    else if (this.playerEquip.shirt === 'yellow') shirtColor = '#F59E0B';
    else if (this.playerEquip.shirt === 'blue') shirtColor = '#3B82F6';
    else if (this.playerEquip.shirt === 'black') shirtColor = '#1F2937';
    else if (this.playerEquip.shirt === 'fire') shirtColor = '#3B82F6';

    if (this.playerEquip.pants === 'pants_green') pantsColor = '#22C55E';
    else if (this.playerEquip.pants === 'pants_red') pantsColor = '#EF4444';
    else if (this.playerEquip.pants === 'pants_pink') pantsColor = '#EC4899';
    else if (this.playerEquip.pants === 'pants_yellow') pantsColor = '#F59E0B';
    else if (this.playerEquip.pants === 'pants_coin') pantsColor = '#FFD700';
    else if (this.playerEquip.pants === 'pants_black') pantsColor = '#1F2937';

    if (this.playerEquip.hair === 'hair_red') hairColor = '#EF4444';
    else if (this.playerEquip.hair === 'hair_white') hairColor = '#FFFFFF';

    if (this.playerEquip.set === 'set_mario') { shirtColor = '#FF0000'; pantsColor = '#0000FF'; }
    else if (this.playerEquip.set === 'set_luigi') { shirtColor = '#00FF00'; pantsColor = '#0000FF'; }
    else if (this.playerEquip.set === 'set_rich') { shirtColor = '#FFD700'; pantsColor = '#FFD700'; }
    else if (this.playerEquip.set === 'set_squid') { shirtColor = '#FF007F'; pantsColor = '#FF007F'; }

    const headSize = 16, torsoH = 14, torsoW = 10, limbW = 4, limbH = 10;
    const anim = (this.player.vel.x !== 0 && !this.isGameOver) ? Math.sin(Date.now() / 80) * 0.5 : 0;

    this.ctx.save();
    this.drawLimb(x + w/2 - 2, y + headSize + torsoH, limbW, limbH, anim, pantsColor);
    this.drawLimb(x + w/2 + 2, y + headSize + torsoH, limbW, limbH, -anim, pantsColor);

    if (this.playerEquip.pants === 'pants_pink' && !this.playerEquip.set) {
        this.ctx.fillStyle = pantsColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x + (w - torsoW) / 2 - 2, y + headSize + torsoH - 2);
        this.ctx.lineTo(x + (w + torsoW) / 2 + 2, y + headSize + torsoH - 2);
        this.ctx.lineTo(x + w + 2, y + headSize + torsoH + 8);
        this.ctx.lineTo(x - 2, y + headSize + torsoH + 8);
        this.ctx.fill();
    }

    if (this.playerEquip.pants === 'pants_coin' && !this.playerEquip.set) {
        this.ctx.fillStyle = '#C5A000';
        this.ctx.beginPath();
        this.ctx.arc(x + w/2 - 3, y + headSize + torsoH + 4, 2, 0, Math.PI*2);
        this.ctx.arc(x + w/2 + 3, y + headSize + torsoH + 4, 2, 0, Math.PI*2);
        this.ctx.fill();
    }

    this.drawLimb(x + w/2 - 3, y + headSize + 4, limbW, limbH, -anim, shirtColor);
    this.drawLimb(x + w/2 + 3, y + headSize + 4, limbW, limbH, anim, shirtColor);

    this.ctx.fillStyle = shirtColor;
    this.ctx.beginPath();
    if (this.ctx.roundRect) this.ctx.roundRect(x + (w - torsoW)/2, y + headSize - 2, torsoW, torsoH, 4);
    else this.ctx.rect(x + (w - torsoW)/2, y + headSize - 2, torsoW, torsoH);
    this.ctx.fill();

    if (this.playerEquip.shirt === 'fire' && !this.playerEquip.set) {
      this.ctx.fillStyle = '#EF4444'; this.ctx.shadowBlur = 10; this.ctx.shadowColor = '#EF4444';
      this.ctx.beginPath(); this.ctx.arc(x + w/2, y + headSize + torsoH/2, 3, 0, Math.PI * 2); this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    this.ctx.fillStyle = skinColor;
    this.ctx.beginPath(); this.ctx.arc(x + w/2, y + headSize/2, headSize/2, 0, Math.PI * 2); this.ctx.fill();

    this.ctx.fillStyle = hairColor;
    if (this.playerEquip.set === 'set_mario') {
        this.ctx.fillStyle = '#FF0000'; this.ctx.fillRect(x + w/2 - 10, y - 4, 20, 6);
        this.ctx.fillStyle = '#FFFFFF'; this.ctx.beginPath(); this.ctx.arc(x + w/2, y - 2, 3, 0, Math.PI * 2); this.ctx.fill();
    } else if (this.playerEquip.set === 'set_luigi') {
        this.ctx.fillStyle = '#00FF00'; this.ctx.fillRect(x + w/2 - 10, y - 4, 20, 6);
    } else if (this.playerEquip.set === 'set_rich') {
        this.ctx.fillStyle = '#FFD700'; this.ctx.fillRect(x + w/2 - 8, y - 5, 16, 5);
        this.ctx.fillStyle = '#000000'; this.ctx.fillRect(x + w/2 - 6, y + 4, 12, 3);
    } else if (this.playerEquip.set === 'set_squid') {
        this.ctx.fillStyle = '#000000'; this.ctx.beginPath();
        this.ctx.moveTo(x + w/2, y + 2); this.ctx.lineTo(x + w/2 - 4, y + 10); this.ctx.lineTo(x + w/2 + 4, y + 10);
        this.ctx.closePath(); this.ctx.stroke();
    } else {
        if (this.playerEquip.hair === 'hair_bbang') {
            this.ctx.lineWidth = 3; this.ctx.strokeStyle = '#000000';
            this.ctx.beginPath(); this.ctx.moveTo(x + w/2, y); this.ctx.lineTo(x + w/2, y - 12); this.ctx.stroke();
        } else if (this.playerEquip.hair === 'hair_red') {
            this.ctx.beginPath(); this.ctx.moveTo(x + w/2 - 8, y + 4); this.ctx.lineTo(x + w/2, y - 10); this.ctx.lineTo(x + w/2 + 8, y + 4); this.ctx.fill();
        } else if (this.playerEquip.hair === 'hair_black' || this.playerEquip.hair === 'hair_white') {
            this.ctx.fillRect(x + w/2 - 8, y - 2, 16, 6);
        } else if (this.playerEquip.hair === 'hair_curly') {
            for(let i=0; i<5; i++){
                this.ctx.beginPath(); this.ctx.arc(x+w/2-6+i*3, y, 3, 0, Math.PI*2); this.ctx.fill();
            }
        }
    }
    this.ctx.restore();
  }

  private drawLimb(x: number, y: number, w: number, h: number, angle: number, color: string) {
    this.ctx.save(); this.ctx.translate(x, y); this.ctx.rotate(angle);
    this.ctx.fillStyle = color; this.ctx.beginPath();
    if (this.ctx.roundRect) this.ctx.roundRect(-w/2, 0, w, h, w/2);
    else this.ctx.rect(-w/2, 0, w, h);
    this.ctx.fill(); this.ctx.restore();
  }

  public getHUD() { return { score: this.score, distance: this.distance, difficulty: this.difficulty }; }

  public reset() {
    this.cameraX = 0; this.score = 0; this.distance = 0; this.difficulty = 1; this.coinsGained = 0;
    this.isGameOver = false; this.isMovementPaused = false;
    this.player.pos = { x: 50, y: 300 }; this.player.vel = { x: 0, y: 0 };
    this.initLevel();
  }
}
