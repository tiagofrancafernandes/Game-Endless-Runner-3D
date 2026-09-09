/**
 * GamepadAdapter - Abstracts Gamepad API, provides Xbox and PlayStation labels,
 * analog axis deadzones, and dual-rumble vibration support.
 */

export const PRESET_XINPUT = 'xinput';
export const PRESET_DUALSHOCK = 'dualshock';

export class GamepadAdapter {
  constructor() {
    this.preset = this.loadPreset();
    this.deadzone = 0.45;
  }

  loadPreset() {
    try {
      const saved = localStorage.getItem('endless_runner_gamepad_preset');
      if (saved === PRESET_DUALSHOCK || saved === PRESET_XINPUT) {
        return saved;
      }
    } catch (e) {
      console.warn(e);
    }
    return PRESET_XINPUT;
  }

  setPreset(preset) {
    if (preset === PRESET_XINPUT || preset === PRESET_DUALSHOCK) {
      this.preset = preset;
      try {
        localStorage.setItem('endless_runner_gamepad_preset', preset);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  getPreset() {
    return this.preset;
  }

  getActiveGamepad() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        return gamepads[i];
      }
    }
    return null;
  }

  /**
   * Translates a joystick identifier code (e.g. 'btn_0', 'axis_0_neg') into a human-friendly name
   * based on the active controller preset (XInput vs DualShock).
   */
  getLabel(code) {
    if (!code) return 'Não atribuído';

    const isXbox = this.preset === PRESET_XINPUT;

    // Buttons
    if (code.startsWith('btn_')) {
      const idx = parseInt(code.replace('btn_', ''), 10);
      switch (idx) {
        case 0: return isXbox ? 'Botão A' : 'Botão ✕ (Cruz)';
        case 1: return isXbox ? 'Botão B' : 'Botão ○ (Círculo)';
        case 2: return isXbox ? 'Botão X' : 'Botão □ (Quadrado)';
        case 3: return isXbox ? 'Botão Y' : 'Botão △ (Triângulo)';
        case 4: return isXbox ? 'LB (Ombro Esq)' : 'L1 (Ombro Esq)';
        case 5: return isXbox ? 'RB (Ombro Dir)' : 'R1 (Ombro Dir)';
        case 6: return isXbox ? 'LT (Gatilho Esq)' : 'L2 (Gatilho Esq)';
        case 7: return isXbox ? 'RT (Gatilho Dir)' : 'R2 (Gatilho Dir)';
        case 8: return isXbox ? 'Back / View' : 'Select / Share';
        case 9: return isXbox ? 'Start / Menu' : 'Start / Options';
        case 10: return isXbox ? 'Clique Stick Esq (LS)' : 'Clique Stick Esq (L3)';
        case 11: return isXbox ? 'Clique Stick Dir (RS)' : 'Clique Stick Dir (R3)';
        case 12: return 'D-Pad Cima (Direcional)';
        case 13: return 'D-Pad Baixo (Direcional)';
        case 14: return 'D-Pad Esquerda (Direcional)';
        case 15: return 'D-Pad Direita (Direcional)';
        case 16: return isXbox ? 'Botão Xbox' : 'Botão PS';
        default: return `Botão ${idx}`;
      }
    }

    // Axes
    if (code === 'axis_0_neg') return 'Analógico Esq (Esquerda)';
    if (code === 'axis_0_pos') return 'Analógico Esq (Direita)';
    if (code === 'axis_1_neg') return 'Analógico Esq (Cima)';
    if (code === 'axis_1_pos') return 'Analógico Esq (Baixo)';
    if (code === 'axis_2_neg') return 'Analógico Dir (Esquerda)';
    if (code === 'axis_2_pos') return 'Analógico Dir (Direita)';
    if (code === 'axis_3_neg') return 'Analógico Dir (Cima)';
    if (code === 'axis_3_pos') return 'Analógico Dir (Baixo)';

    return code;
  }

  /**
   * Check if a specific joystick code is currently triggered on the active gamepad
   */
  isCodeTriggered(code, gamepad) {
    if (!gamepad || !code) return false;

    if (code.startsWith('btn_')) {
      const idx = parseInt(code.replace('btn_', ''), 10);
      const btn = gamepad.buttons[idx];
      return btn ? (btn.pressed || btn.value > 0.4) : false;
    }

    if (code.startsWith('axis_')) {
      const parts = code.split('_'); // ['axis', '0', 'neg' | 'pos']
      const axisIdx = parseInt(parts[1], 10);
      const direction = parts[2];
      const val = gamepad.axes[axisIdx];
      if (typeof val === 'number') {
        if (direction === 'neg' && val < -this.deadzone) return true;
        if (direction === 'pos' && val > this.deadzone) return true;
      }
    }

    return false;
  }

  /**
   * Detect the first active button or axis currently being pressed (for rebinding)
   */
  detectInput(gamepad) {
    if (!gamepad) return null;

    // Check buttons
    if (gamepad.buttons) {
      for (let i = 0; i < gamepad.buttons.length; i++) {
        const btn = gamepad.buttons[i];
        if (btn && (btn.pressed || btn.value > 0.6)) {
          return `btn_${i}`;
        }
      }
    }

    // Check analog axes
    if (gamepad.axes) {
      for (let i = 0; i < gamepad.axes.length; i++) {
        const val = gamepad.axes[i];
        if (val < -0.65) {
          return `axis_${i}_neg`;
        } else if (val > 0.65) {
          return `axis_${i}_pos`;
        }
      }
    }

    return null;
  }

  /**
   * Triggers haptic vibration / rumble on the gamepad (PS2/PS3/PS4/PS5 & Xbox supported)
   */
  vibrate(duration = 200, strongMagnitude = 0.8, weakMagnitude = 0.5) {
    const gamepad = this.getActiveGamepad();
    if (!gamepad) return false;

    try {
      // Modern Gamepad Haptics API (Chrome, Edge, Opera, Firefox)
      if (gamepad.vibrationActuator && typeof gamepad.vibrationActuator.playEffect === 'function') {
        gamepad.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: duration,
          weakMagnitude: Math.min(1, Math.max(0, weakMagnitude)),
          strongMagnitude: Math.min(1, Math.max(0, strongMagnitude))
        }).catch(() => {});
        return true;
      }

      // Legacy actuator fallback
      if (gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
        const act = gamepad.hapticActuators[0];
        if (typeof act.pulse === 'function') {
          act.pulse(strongMagnitude, duration);
          return true;
        }
      }
    } catch (e) {
      console.warn('Gamepad vibration error:', e);
    }
    return false;
  }
}

export const gamepadAdapter = new GamepadAdapter();
