/**
 * KeyConfig - Manages configurable bindings for actions.
 * Each action supports 2 simultaneous inputs:
 * 1. A Keyboard key
 * 2. A Joystick button / axis
 */

import { i18n } from '../i18n/I18nManager.js';

export const ACTION_LEFT = 'MOVE_LEFT';
export const ACTION_RIGHT = 'MOVE_RIGHT';
export const ACTION_JUMP = 'JUMP';
export const ACTION_PAUSE = 'PAUSE';

export function getActionName(action) {
  return i18n.t(`action_${action}`);
}

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
    if (!code) return i18n.t('key_unassigned');
    if (code === 'Space') return i18n.t('key_space');
    if (code === 'ArrowUp') return i18n.t('key_arrow_up');
    if (code === 'ArrowDown') return i18n.t('key_arrow_down');
    if (code === 'ArrowLeft') return i18n.t('key_arrow_left');
    if (code === 'ArrowRight') return i18n.t('key_arrow_right');
    if (code === 'Escape') return 'Esc';
    if (code === 'Enter') return 'Enter';
    if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
    if (code === 'ControlLeft' || code === 'ControlRight') return 'Ctrl';
    if (code.startsWith('Key')) return `${i18n.t('key_prefix')} ${code.replace('Key', '')}`;
    if (code.startsWith('Digit')) return `${i18n.t('digit_prefix')} ${code.replace('Digit', '')}`;
    return code;
  }
}

export const keyConfig = new KeyConfig();
