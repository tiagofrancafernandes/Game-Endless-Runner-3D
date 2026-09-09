import 'iconify-icon';
import { Game } from './game/Game.js';
import { UIManager } from './ui/UIManager.js';
import { audioManager } from './audio/AudioManager.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const uiManager = new UIManager();
  const game = new Game(canvas, uiManager);

  uiManager.setGame(game);
  game.start();

  // Resume / Initialize Web Audio on first user interaction
  const initAudio = () => {
    audioManager.init();
    window.removeEventListener('click', initAudio);
    window.removeEventListener('keydown', initAudio);
    window.removeEventListener('touchstart', initAudio);
  };

  window.addEventListener('click', initAudio);
  window.addEventListener('keydown', initAudio);
  window.addEventListener('touchstart', initAudio);

  console.log('🎮 Endless Runner 3D inicializado com sucesso!');
});
