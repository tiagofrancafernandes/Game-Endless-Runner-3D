import { SceneManager } from './SceneManager.js';
import { Player } from './Player.js';
import { ObstacleManager } from './ObstacleManager.js';
import { FruitManager } from './FruitManager.js';
import { ParticleSystem } from './ParticleSystem.js';
import { inputManager } from '../input/InputManager.js';
import { audioManager } from '../audio/AudioManager.js';
import { gamepadAdapter } from '../input/GamepadAdapter.js';
import { ACTION_LEFT, ACTION_RIGHT, ACTION_JUMP, ACTION_PAUSE } from '../input/KeyConfig.js';

export class Game {
  constructor(canvas, uiManager) {
    this.canvas = canvas;
    this.uiManager = uiManager;

    // Subsystems
    this.sceneManager = new SceneManager(this.canvas);
    this.particleSystem = new ParticleSystem(this.sceneManager.scene);
    this.player = new Player(this.sceneManager.scene);
    this.obstacleManager = new ObstacleManager(this.sceneManager.scene);
    this.fruitManager = new FruitManager(this.sceneManager.scene);

    // Gameplay parameters
    this.baseSpeed = 16;
    this.gameSpeed = this.baseSpeed;
    this.distance = 0;
    this.score = 0;
    this.fruitsCount = 0;
    this.life = 100;
    this.strength = 60;

    // State: 'RUNNING' | 'PAUSED'
    this.isPaused = false;
    this.lastTime = performance.now();

    // Bind loop
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  start() {
    this.lastTime = performance.now();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.uiManager) {
      this.uiManager.setPaused(this.isPaused);
    }
    if (!this.isPaused) {
      this.lastTime = performance.now();
    }
  }

  setPaused(state) {
    this.isPaused = state;
    if (this.uiManager) {
      this.uiManager.setPaused(this.isPaused);
    }
    if (!this.isPaused) {
      this.lastTime = performance.now();
    }
  }

  resetScore() {
    this.score = 0;
    this.distance = 0;
    this.fruitsCount = 0;
    this.life = 100;
    this.strength = 60;
    this.gameSpeed = this.baseSpeed;
    this.obstacleManager.clear();
    this.fruitManager.clear();
    this.particleSystem.clear();
    this.player.reset();
    if (this.uiManager) {
      this.uiManager.updateStats(this);
    }
  }

  handleInput() {
    inputManager.update();

    // Pause toggle
    if (inputManager.isJustPressed(ACTION_PAUSE)) {
      this.togglePause();
      audioManager.playClick();
      return;
    }

    if (this.isPaused) return;

    // Movement controls
    if (inputManager.isJustPressed(ACTION_LEFT)) {
      this.player.moveLeft();
    } else if (inputManager.isJustPressed(ACTION_RIGHT)) {
      this.player.moveRight();
    }

    // Jump
    if (inputManager.isJustPressed(ACTION_JUMP)) {
      if (this.player.jump()) {
        audioManager.playJump();
      }
    }
  }

  update(delta) {
    // Distance & gradual score increase
    this.distance += this.gameSpeed * delta;
    this.score += Math.floor(delta * 10);

    // Speed progression: slight increase over time, capped safely
    this.gameSpeed = Math.min(26, this.baseSpeed + (this.distance * 0.003));

    // Update Player
    this.player.update(delta, this.gameSpeed, this.particleSystem);

    // Update Obstacles & Fruits
    this.obstacleManager.update(delta, this.gameSpeed, this.player.group.position.z);
    this.fruitManager.update(delta, this.gameSpeed);
    this.particleSystem.update(delta);
    this.sceneManager.update(delta, this.gameSpeed, this.player.group.position);

    // Check collisions
    this.checkCollisions();

    // Update UI Stats
    if (this.uiManager) {
      this.uiManager.updateStats(this);
    }
  }

  checkCollisions() {
    // 1. Obstacle collision
    if (!this.player.isInvulnerable) {
      const obstacleHit = this.obstacleManager.checkCollision(this.player.getCollider());
      if (obstacleHit) {
        this.onObstacleCollision(obstacleHit);
      }
    }

    // 2. Fruit collection
    const collected = this.fruitManager.checkCollision(this.player.group.position);
    for (const item of collected) {
      this.onFruitCollected(item.fruit, item.position);
    }
  }

  onObstacleCollision(obstacle) {
    // Trigger player stumble, blinking and centering: "volta para o meio onde continua a correr"
    this.player.hitObstacle();

    // Play impact sound & controller vibration
    audioManager.playHit();
    gamepadAdapter.vibrate(300, 1.0, 0.7);

    // Particle effect
    this.particleSystem.createObstacleHitBurst(this.player.group.position);

    // Penalties:
    // "perde os pontos e volta para o meio onde continua a correr, o jogo não tem fim"
    const scoreLoss = Math.min(this.score, 120);
    this.score = Math.max(0, this.score - scoreLoss);

    // Decrease life and strength
    this.life = Math.max(0, this.life - 25);
    this.strength = Math.max(0, this.strength - 20);

    // Floating text notification in UI
    if (this.uiManager) {
      this.uiManager.showFloatingNotice(`-${scoreLoss} PONTOS!`, '#ef4444');
    }

    // "o jogo não tem fim" - if life hits 0, recover baseline health with warning so game continues infinitely!
    if (this.life <= 0) {
      this.life = 25;
      if (this.uiManager) {
        this.uiManager.showFloatingNotice('RECUPEROU O FÔLEGO!', '#f59e0b');
      }
    }
  }

  onFruitCollected(fruit, position) {
    audioManager.playFruit();
    gamepadAdapter.vibrate(60, 0.25, 0.35);

    // Particle burst with fruit color
    this.particleSystem.createFruitBurst(position, fruit.color);

    // Reward:
    // "frutas tem uma pontuação e aumentam a força e vida"
    this.score += fruit.points;
    this.fruitsCount++;
    this.life = Math.min(100, this.life + fruit.health);
    this.strength = Math.min(100, this.strength + fruit.strength);

    if (this.uiManager) {
      this.uiManager.showFloatingNotice(`+${fruit.points} [${fruit.name}]`, '#10b981');
    }
  }

  loop(currentTime) {
    requestAnimationFrame(this.loop);

    const delta = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.handleInput();

    if (!this.isPaused) {
      this.update(delta);
    }

    this.sceneManager.render();
  }
}
