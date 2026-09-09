/**
 * KeyConfig - Manages configurable bindings for actions.
 * Each action supports 2 simultaneous inputs:
 * 1. A Keyboard key
 * 2. A Joystick button / axis
 */

export const ACTION_LEFT = 'MOVE_LEFT';
export const ACTION_RIGHT = 'MOVE_RIGHT';
export const ACTION_JUMP = 'JUMP';
export const ACTION_PAUSE = 'PAUSE';

export const ACTION_NAMES = {
  [ACTION_LEFT]: 'Mover para Esquerda',
  [ACTION_RIGHT]: 'Mover para Direita',
  [ACTION_JUMP]: 'Pular Obstáculo',
  [ACTION_PAUSE]: 'Pausar / Despausar'
};

export const ACTION_DESCRIPTIONS = {
  [ACTION_LEFT]: 'Desvia para a faixa da esquerda',
  [ACTION_RIGHT]: 'Desvia para a faixa da direita',
  [ACTION_JUMP]: 'Salta por cima de troncos e barreiras',
  [ACTION_PAUSE]: 'Abre o menu de pausa'
};

const DEFAULT_BINDINGS = {
  [ACTION_LEFT]: {
    keyboard: 'ArrowLeft',
    joystick: 'btn_14' // D-Pad Left (or axis_0_neg)
  },
  [ACTION_RIGHT]: {
    keyboard: 'ArrowRight',
    joystick: 'btn_15' // D-Pad Right (or axis_0_pos)
  },
  [ACTION_JUMP]: {
    keyboard: 'Space',
    joystick: 'btn_0' // A (Xbox) / ✕ (DualShock)
  },
  [ACTION_PAUSE]: {
    keyboard: 'Escape',
    joystick: 'btn_9' // Start / Options
  }
};

export class KeyConfig {
  constructor() {
    this.bindings = JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('endless_runner_controls');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all actions exist
        Object.keys(DEFAULT_BINDINGS).forEach(action => {
          if (parsed[action]) {
            this.bindings[action] = {
              keyboard: parsed[action].keyboard || DEFAULT_BINDINGS[action].keyboard,
              joystick: parsed[action].joystick || DEFAULT_BINDINGS[action].joystick
            };
          }
        });
      }
    } catch (e) {
      console.warn('Could not load key bindings from storage:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('endless_runner_controls', JSON.stringify(this.bindings));
    } catch (e) {
      console.warn('Could not save key bindings to storage:', e);
    }
  }

  resetDefaults() {
    this.bindings = JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
    this.saveToStorage();
  }

  getBinding(action) {
    return this.bindings[action] || { keyboard: '', joystick: '' };
  }

  setBinding(action, type, code) {
    if (!this.bindings[action]) return;
    if (type === 'keyboard' || type === 'joystick') {
      this.bindings[action][type] = code;
      this.saveToStorage();
    }
  }

  /**
   * Human-friendly label for keyboard key codes
   */
  getKeyboardLabel(code) {
    if (!code) return 'Não atribuído';
    if (code === 'Space') return 'Espaço';
    if (code === 'ArrowUp') return 'Seta Cima';
    if (code === 'ArrowDown') return 'Seta Baixo';
    if (code === 'ArrowLeft') return 'Seta Esquerda';
    if (code === 'ArrowRight') return 'Seta Direita';
    if (code === 'Escape') return 'Esc';
    if (code === 'Enter') return 'Enter';
    if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
    if (code === 'ControlLeft' || code === 'ControlRight') return 'Ctrl';
    if (code.startsWith('Key')) return 'Tecla ' + code.replace('Key', '');
    if (code.startsWith('Digit')) return 'Número ' + code.replace('Digit', '');
    return code;
  }
}

export const keyConfig = new KeyConfig();
