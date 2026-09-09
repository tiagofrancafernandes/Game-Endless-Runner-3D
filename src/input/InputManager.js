import { keyConfig } from './KeyConfig.js';
import { gamepadAdapter } from './GamepadAdapter.js';

export class InputManager {
  constructor() {
    this.keyConfig = keyConfig;
    this.gamepadAdapter = gamepadAdapter;

    this.keysDown = new Set();
    this.keysJustPressed = new Set();

    this.actionState = {
      MOVE_LEFT: false,
      MOVE_RIGHT: false,
      JUMP: false,
      PAUSE: false
    };

    this.prevActionState = { ...this.actionState };

    // Listening / Rebinding state
    this.isListening = false;
    this.listeningAction = null;
    this.listeningType = null; // 'keyboard' | 'joystick'
    this.listeningCallback = null;

    // Gamepad status callbacks
    this.onGamepadStatusChange = null;

    this.initEvents();
  }

  initEvents() {
    window.addEventListener('keydown', (e) => {
      // If we are currently rebinding a key
      if (this.isListening) {
        if (this.listeningType === 'keyboard') {
          e.preventDefault();
          const code = e.code;
          this.finishListening(code);
          return;
        } else if (e.code === 'Escape') {
          // Allow Esc to cancel rebinding
          this.cancelListening();
          return;
        }
      }

      // Prevent default page scroll on game controls
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (!this.keysDown.has(e.code)) {
        this.keysJustPressed.add(e.code);
      }
      this.keysDown.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
      this.keysJustPressed.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keysDown.clear();
      this.keysJustPressed.clear();
    });

    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
      if (this.onGamepadStatusChange) {
        this.onGamepadStatusChange(true, e.gamepad);
      }
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
      if (this.onGamepadStatusChange) {
        this.onGamepadStatusChange(false, null);
      }
    });
  }

  startListening(action, type, callback) {
    this.isListening = true;
    this.listeningAction = action;
    this.listeningType = type;
    this.listeningCallback = callback;
    this.listeningReadyTime = performance.now() + 250; // 250ms debounce
  }

  cancelListening() {
    this.isListening = false;
    this.listeningAction = null;
    this.listeningType = null;
    if (this.listeningCallback) {
      this.listeningCallback(null);
      this.listeningCallback = null;
    }
  }

  finishListening(code) {
    if (!this.isListening) return;
    const action = this.listeningAction;
    const type = this.listeningType;
    const cb = this.listeningCallback;

    this.keyConfig.setBinding(action, type, code);

    this.isListening = false;
    this.listeningAction = null;
    this.listeningType = null;
    this.listeningCallback = null;

    if (cb) {
      cb(code);
    }
  }

  /**
   * Called on each frame loop before processing game logic
   */
  update() {
    const gamepad = this.gamepadAdapter.getActiveGamepad();

    // If currently listening for joystick input
    if (this.isListening && this.listeningType === 'joystick' && gamepad) {
      if (performance.now() >= this.listeningReadyTime) {
        const detected = this.gamepadAdapter.detectInput(gamepad);
        if (detected) {
          this.finishListening(detected);
          return;
        }
      }
    }

    // Save previous frame state
    for (const key in this.actionState) {
      this.prevActionState[key] = this.actionState[key];
    }

    // Evaluate current state for each action
    for (const action in this.actionState) {
      const binding = this.keyConfig.getBinding(action);
      let active = false;

      // 1. Check Keyboard primary binding
      if (binding.keyboard && this.keysDown.has(binding.keyboard)) {
        active = true;
      }

      // Also support intuitive alternate keys (e.g. WASD as fallback)
      if (!active) {
        if (action === 'MOVE_LEFT' && (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft'))) active = true;
        if (action === 'MOVE_RIGHT' && (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight'))) active = true;
        if (action === 'JUMP' && (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp') || this.keysDown.has('Space'))) active = true;
      }

      // 2. Check Joystick primary binding
      if (!active && gamepad && binding.joystick) {
        if (this.gamepadAdapter.isCodeTriggered(binding.joystick, gamepad)) {
          active = true;
        }
      }

      // Also support stick tilt fallback if not explicitly rebound
      if (!active && gamepad) {
        if (action === 'MOVE_LEFT' && (gamepad.axes[0] < -0.5 || (gamepad.buttons[14] && gamepad.buttons[14].pressed))) active = true;
        if (action === 'MOVE_RIGHT' && (gamepad.axes[0] > 0.5 || (gamepad.buttons[15] && gamepad.buttons[15].pressed))) active = true;
        if (action === 'JUMP' && (gamepad.axes[1] < -0.5 || (gamepad.buttons[12] && gamepad.buttons[12].pressed))) active = true;
      }

      this.actionState[action] = active;
    }

    // Clear one-frame keyboard events
    this.keysJustPressed.clear();
  }

  isPressed(action) {
    return !!this.actionState[action];
  }

  isJustPressed(action) {
    return !!this.actionState[action] && !this.prevActionState[action];
  }
}

export const inputManager = new InputManager();
