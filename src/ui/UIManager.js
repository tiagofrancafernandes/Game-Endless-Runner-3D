import { audioManager } from '../audio/AudioManager.js';
import { gamepadAdapter, PRESET_XINPUT, PRESET_DUALSHOCK } from '../input/GamepadAdapter.js';
import { keyConfig, ACTION_LEFT, ACTION_RIGHT, ACTION_JUMP, ACTION_PAUSE, getActionName } from '../input/KeyConfig.js';
import { inputManager } from '../input/InputManager.js';
import { i18n } from '../i18n/I18nManager.js';
import { VirtualJoystick } from './VirtualJoystick.js';

export class UIManager {
  constructor() {
    this.game = null;
    this.virtualJoystick = null;
    this.touchMode = this.loadTouchMode();

    // Cache DOM elements
    this.elScore = document.getElementById('hud-score');
    this.elDistance = document.getElementById('hud-distance');
    this.elFruits = document.getElementById('hud-fruits');
    this.elHealthBar = document.getElementById('health-bar-fill');
    this.elHealthText = document.getElementById('health-text');
    this.elStrengthBar = document.getElementById('strength-bar-fill');
    this.elStrengthText = document.getElementById('strength-text');

    // Modals
    this.pauseModal = document.getElementById('pause-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.rebindingOverlay = document.getElementById('rebinding-overlay');
    this.rebindingActionText = document.getElementById('rebinding-action-text');

    // Notifications container
    this.floatingContainer = document.getElementById('floating-notifications');

    this.initEventListeners();
    this.updateAudioIcons();
    this.updateLangButton();
    this.updateFullscreenIcon();
    this.updateTouchModeUI();
    i18n.applyDomTranslations();
    this.renderKeybindingRows();
    this.checkGamepadConnection();

    i18n.subscribe(() => {
      this.updateLangButton();
      this.updateFullscreenIcon();
      this.updateTouchModeUI();
      this.renderKeybindingRows();
      this.checkGamepadConnection();
    });
  }

  setGame(game) {
    this.game = game;
    const joystickContainer = document.getElementById('touch-joystick-container');
    if (joystickContainer) {
      this.virtualJoystick = new VirtualJoystick(joystickContainer, {
        onMoveLeft: () => {
          if (this.game && !this.game.isPaused) this.game.player.moveLeft();
        },
        onMoveRight: () => {
          if (this.game && !this.game.isPaused) this.game.player.moveRight();
        },
        onJump: () => {
          if (this.game && !this.game.isPaused) {
            if (this.game.player.jump()) audioManager.playJump();
          }
        }
      });
    }
  }

  initEventListeners() {
    // Quick buttons
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        if (this.game) this.game.togglePause();
      });
    }

    const btnMute = document.getElementById('btn-mute');
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        audioManager.toggleMute();
        this.updateAudioIcons();
      });
    }

    const btnSfx = document.getElementById('btn-sfx');
    if (btnSfx) {
      btnSfx.addEventListener('click', () => {
        audioManager.toggleSfx();
        this.updateAudioIcons();
      });
    }

    const btnMusic = document.getElementById('btn-music');
    if (btnMusic) {
      btnMusic.addEventListener('click', () => {
        audioManager.toggleMusic();
        this.updateAudioIcons();
      });
    }

    const btnOpenSettings = document.getElementById('btn-open-settings');
    if (btnOpenSettings) {
      btnOpenSettings.addEventListener('click', () => {
        this.openSettings();
      });
    }

    // Language Toggle button
    const btnLang = document.getElementById('btn-lang');
    if (btnLang) {
      btnLang.addEventListener('click', () => {
        i18n.toggleLocale();
        audioManager.playClick();
      });
    }

    // Fullscreen Toggle button
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        this.toggleFullscreen();
        audioManager.playClick();
      });
    }

    const onFullscreenChange = () => {
      this.updateFullscreenIcon();
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    // Toggle Touch Control Mode button
    const btnToggleTouch = document.getElementById('btn-toggle-touch');
    if (btnToggleTouch) {
      btnToggleTouch.addEventListener('click', () => {
        const next = this.touchMode === 'dpad' ? 'analog' : 'dpad';
        this.setTouchMode(next);
        audioManager.playClick();
      });
    }

    // Touch control mode options in settings modal
    const touchOptDpad = document.getElementById('touch-opt-dpad');
    if (touchOptDpad) {
      touchOptDpad.addEventListener('click', () => {
        this.setTouchMode('dpad');
        audioManager.playClick();
      });
    }

    const touchOptAnalog = document.getElementById('touch-opt-analog');
    if (touchOptAnalog) {
      touchOptAnalog.addEventListener('click', () => {
        this.setTouchMode('analog');
        audioManager.playClick();
      });
    }

    // Keyboard shortcut for Fullscreen ('F')
    window.addEventListener('keydown', (e) => {
      if (inputManager && inputManager.isListening) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

      if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.toggleFullscreen();
        audioManager.playClick();
      }
    });

    // Pause modal buttons
    const btnResume = document.getElementById('btn-resume');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        if (this.game) this.game.setPaused(false);
      });
    }

    const btnPauseSettings = document.getElementById('btn-pause-settings');
    if (btnPauseSettings) {
      btnPauseSettings.addEventListener('click', () => {
        this.openSettings();
      });
    }

    const btnResetScore = document.getElementById('btn-reset-score');
    if (btnResetScore) {
      btnResetScore.addEventListener('click', () => {
        if (this.game) {
          this.game.resetScore();
          this.game.setPaused(false);
        }
      });
    }

    // Settings Modal buttons
    const btnCloseSettings = document.getElementById('btn-close-settings');
    if (btnCloseSettings) {
      btnCloseSettings.addEventListener('click', () => {
        this.closeSettings();
      });
    }

    const btnSaveSettings = document.getElementById('btn-save-settings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
        this.closeSettings();
      });
    }

    const btnResetControls = document.getElementById('btn-reset-controls');
    if (btnResetControls) {
      btnResetControls.addEventListener('click', () => {
        keyConfig.resetDefaults();
        this.renderKeybindingRows();
        audioManager.playClick();
      });
    }

    // Preset selector buttons
    const btnPresetXbox = document.getElementById('preset-xbox');
    const btnPresetPS = document.getElementById('preset-ps');

    if (btnPresetXbox) {
      btnPresetXbox.addEventListener('click', () => {
        gamepadAdapter.setPreset(PRESET_XINPUT);
        this.updatePresetButtons();
        this.renderKeybindingRows();
        audioManager.playClick();
      });
    }

    if (btnPresetPS) {
      btnPresetPS.addEventListener('click', () => {
        gamepadAdapter.setPreset(PRESET_DUALSHOCK);
        this.updatePresetButtons();
        this.renderKeybindingRows();
        audioManager.playClick();
      });
    }

    // Test vibration button
    const btnTestVibration = document.getElementById('btn-test-vibration');
    if (btnTestVibration) {
      btnTestVibration.addEventListener('click', () => {
        const success = gamepadAdapter.vibrate(400, 1.0, 0.8);
        if (success) {
          this.showFloatingNotice(i18n.t('vibration_ok'), '#3b82f6');
        } else {
          this.showFloatingNotice(i18n.t('vibration_fail'), '#f59e0b');
        }
      });
    }

    // Cancel rebinding button
    const btnCancelRebind = document.getElementById('btn-cancel-rebind');
    if (btnCancelRebind) {
      btnCancelRebind.addEventListener('click', () => {
        inputManager.cancelListening();
        this.rebindingOverlay.classList.add('hidden');
      });
    }

    // Touch on-screen buttons
    const touchLeft = document.getElementById('touch-left');
    const touchRight = document.getElementById('touch-right');
    const touchJump = document.getElementById('touch-jump');

    const setupRepeatingTouchButton = (btn, actionCallback) => {
      if (!btn) return;
      let timer = null;
      let interval = null;

      const stopRepeat = () => {
        if (timer) clearTimeout(timer);
        if (interval) clearInterval(interval);
        timer = null;
        interval = null;
      };

      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        stopRepeat();
        actionCallback();
        timer = setTimeout(() => {
          interval = setInterval(() => {
            actionCallback();
          }, 180);
        }, 220);
      });

      btn.addEventListener('pointerup', stopRepeat);
      btn.addEventListener('pointercancel', stopRepeat);
      btn.addEventListener('pointerleave', stopRepeat);
    };

    setupRepeatingTouchButton(touchLeft, () => {
      if (this.game && !this.game.isPaused) this.game.player.moveLeft();
    });

    setupRepeatingTouchButton(touchRight, () => {
      if (this.game && !this.game.isPaused) this.game.player.moveRight();
    });
    if (touchJump) {
      touchJump.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (this.game && !this.game.isPaused) {
          if (this.game.player.jump()) audioManager.playJump();
        }
      });
    }

    // Gamepad connection events
    inputManager.onGamepadStatusChange = () => {
      this.checkGamepadConnection();
      this.renderKeybindingRows();
    };

    setInterval(() => this.checkGamepadConnection(), 2000);
  }

  updateStats(game) {
    if (this.elScore) this.elScore.textContent = game.score;
    if (this.elDistance) this.elDistance.textContent = Math.floor(game.distance) + 'm';
    if (this.elFruits) this.elFruits.textContent = game.fruitsCount;

    // Health
    const hp = Math.max(0, Math.min(100, Math.round(game.life)));
    if (this.elHealthBar) {
      this.elHealthBar.style.width = hp + '%';
      if (hp <= 30) {
        this.elHealthBar.className = 'bar-fill bg-red-500';
      } else if (hp <= 60) {
        this.elHealthBar.className = 'bar-fill bg-amber-500';
      } else {
        this.elHealthBar.className = 'bar-fill bg-emerald-500';
      }
    }
    if (this.elHealthText) this.elHealthText.textContent = hp + '%';

    // Strength
    const str = Math.max(0, Math.min(100, Math.round(game.strength)));
    if (this.elStrengthBar) this.elStrengthBar.style.width = str + '%';
    if (this.elStrengthText) this.elStrengthText.textContent = str + '%';
  }

  setPaused(paused) {
    if (this.pauseModal) {
      if (paused) {
        this.pauseModal.classList.remove('hidden');
      } else {
        this.pauseModal.classList.add('hidden');
      }
    }
    const pauseIcon = document.getElementById('pause-icon');
    if (pauseIcon) {
      pauseIcon.setAttribute('icon', paused ? 'mdi:play' : 'mdi:pause');
    }
  }

  openSettings() {
    audioManager.playClick();
    if (this.settingsModal) {
      this.settingsModal.classList.remove('hidden');
      this.updatePresetButtons();
      this.updateTouchModeUI();
      this.renderKeybindingRows();
      this.checkGamepadConnection();
    }
  }

  closeSettings() {
    audioManager.playClick();
    if (this.settingsModal) {
      this.settingsModal.classList.add('hidden');
    }
  }

  updatePresetButtons() {
    const current = gamepadAdapter.getPreset();
    const btnXbox = document.getElementById('preset-xbox');
    const btnPS = document.getElementById('preset-ps');

    if (btnXbox && btnPS) {
      if (current === PRESET_XINPUT) {
        btnXbox.classList.add('active-preset');
        btnPS.classList.remove('active-preset');
      } else {
        btnPS.classList.add('active-preset');
        btnXbox.classList.remove('active-preset');
      }
    }
  }

  checkGamepadConnection() {
    const gamepad = gamepadAdapter.getActiveGamepad();
    const elStatus = document.getElementById('gamepad-status');
    const btnTestVib = document.getElementById('btn-test-vibration');

    if (elStatus) {
      if (gamepad) {
        elStatus.innerHTML = `
          <iconify-icon icon="mdi:check-circle" class="text-emerald-400 text-lg mr-1"></iconify-icon>
          <span class="text-emerald-300 font-medium">${i18n.t('gamepad_connected')}</span>
          <span class="text-slate-200 truncate max-w-xs ml-1" title="${gamepad.id}">${gamepad.id}</span>
        `;
        if (btnTestVib) btnTestVib.disabled = false;
      } else {
        elStatus.innerHTML = `
          <iconify-icon icon="mdi:alert-circle-outline" class="text-amber-400 text-lg mr-1"></iconify-icon>
          <span class="text-slate-400">${i18n.t('gamepad_none')}</span>
        `;
        if (btnTestVib) btnTestVib.disabled = false; // still allow clicking to test
      }
    }
  }

  renderKeybindingRows() {
    const tableBody = document.getElementById('bindings-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    const actions = [ACTION_LEFT, ACTION_RIGHT, ACTION_JUMP, ACTION_PAUSE];

    actions.forEach((action) => {
      const binding = keyConfig.getBinding(action);
      const actionName = getActionName(action);

      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-700/60 hover:bg-slate-800/40 transition';

      // Action Title
      const tdName = document.createElement('td');
      tdName.className = 'py-3 px-4 font-semibold text-white';
      tdName.textContent = actionName;

      // Slot 1: Keyboard
      const tdKb = document.createElement('td');
      tdKb.className = 'py-3 px-4 text-center';
      const btnKb = document.createElement('button');
      btnKb.className = 'btn-key-slot';
      btnKb.innerHTML = `
        <iconify-icon icon="mdi:keyboard" class="text-blue-400 mr-1"></iconify-icon>
        <span>${keyConfig.getKeyboardLabel(binding.keyboard)}</span>
      `;
      btnKb.addEventListener('click', () => this.startRebindPrompt(action, 'keyboard', actionName));
      tdKb.appendChild(btnKb);

      // Slot 2: Joystick
      const tdJoy = document.createElement('td');
      tdJoy.className = 'py-3 px-4 text-center';
      const btnJoy = document.createElement('button');
      btnJoy.className = 'btn-key-slot';
      btnJoy.innerHTML = `
        <iconify-icon icon="mdi:controller" class="text-amber-400 mr-1"></iconify-icon>
        <span>${gamepadAdapter.getLabel(binding.joystick)}</span>
      `;
      btnJoy.addEventListener('click', () => this.startRebindPrompt(action, 'joystick', actionName));
      tdJoy.appendChild(btnJoy);

      tr.appendChild(tdName);
      tr.appendChild(tdKb);
      tr.appendChild(tdJoy);
      tableBody.appendChild(tr);
    });
  }

  startRebindPrompt(action, type, actionName) {
    audioManager.playClick();
    if (!this.rebindingOverlay) return;

    this.rebindingOverlay.classList.remove('hidden');
    if (this.rebindingActionText) {
      const typeLabel = type === 'keyboard' ? i18n.t('on_keyboard') : i18n.t('on_joystick');
      this.rebindingActionText.textContent = i18n.t('rebinding_prompt', { action: actionName, type: typeLabel });
    }

    inputManager.startListening(action, type, (newCode) => {
      this.rebindingOverlay.classList.add('hidden');
      if (newCode) {
        audioManager.playJump();
        this.renderKeybindingRows();
        this.showFloatingNotice(i18n.t('key_configured'), '#10b981');
      }
    });
  }

  updateLangButton() {
    const btnLangText = document.getElementById('lang-text');
    const isPt = i18n.getLocale() === 'pt-BR';
    if (btnLangText) {
      btnLangText.textContent = isPt ? 'PT' : 'EN';
    }
  }

  toggleFullscreen() {
    const doc = document;
    const isFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

    if (!isFullscreen) {
      const elem = doc.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  }

  updateFullscreenIcon() {
    const doc = document;
    const isFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
    const icon = document.getElementById('fullscreen-icon');
    const btn = document.getElementById('btn-fullscreen');

    if (icon) {
      icon.setAttribute('icon', isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen');
    }
    if (btn) {
      const key = isFullscreen ? 'btn_fullscreen_exit' : 'btn_fullscreen_enter';
      btn.setAttribute('title', i18n.t(key));
      btn.setAttribute('data-i18n-title', key);
    }
  }

  updateAudioIcons() {
    const iconMute = document.getElementById('icon-mute');
    if (iconMute) {
      iconMute.setAttribute('icon', audioManager.isMuted ? 'mdi:volume-off' : 'mdi:volume-high');
    }

    const iconSfx = document.getElementById('icon-sfx');
    if (iconSfx) {
      iconSfx.setAttribute('icon', audioManager.sfxEnabled ? 'mdi:bell-ring' : 'mdi:bell-off');
      const btnSfx = document.getElementById('btn-sfx');
      if (btnSfx) {
        if (audioManager.sfxEnabled) btnSfx.classList.remove('opacity-40');
        else btnSfx.classList.add('opacity-40');
      }
    }

    const iconMusic = document.getElementById('icon-music');
    if (iconMusic) {
      iconMusic.setAttribute('icon', audioManager.musicEnabled ? 'mdi:music' : 'mdi:music-off');
      const btnMusic = document.getElementById('btn-music');
      if (btnMusic) {
        if (audioManager.musicEnabled) btnMusic.classList.remove('opacity-40');
        else btnMusic.classList.add('opacity-40');
      }
    }
  }

  loadTouchMode() {
    try {
      const saved = localStorage.getItem('endless_runner_touch_mode');
      if (saved === 'analog' || saved === 'dpad') {
        return saved;
      }
    } catch (e) {
      console.warn('Could not load touch mode from localStorage:', e);
    }
    return 'dpad';
  }

  setTouchMode(mode) {
    this.touchMode = mode === 'analog' ? 'analog' : 'dpad';
    try {
      localStorage.setItem('endless_runner_touch_mode', this.touchMode);
    } catch (e) {
      console.warn('Could not save touch mode to localStorage:', e);
    }
    this.updateTouchModeUI();
    const noticeKey = this.touchMode === 'analog' ? 'touch_mode_notice_analog' : 'touch_mode_notice_dpad';
    this.showFloatingNotice(i18n.t(noticeKey), '#38bdf8');
  }

  updateTouchModeUI() {
    const isAnalog = this.touchMode === 'analog';
    const clusterLeft = document.getElementById('touch-cluster-left');
    const joystickContainer = document.getElementById('touch-joystick-container');
    const btnToggleTouch = document.getElementById('btn-toggle-touch');
    const touchModeIcon = document.getElementById('touch-mode-icon');
    const touchOptDpad = document.getElementById('touch-opt-dpad');
    const touchOptAnalog = document.getElementById('touch-opt-analog');

    if (clusterLeft) {
      if (isAnalog) {
        clusterLeft.classList.add('hidden');
      } else {
        clusterLeft.classList.remove('hidden');
      }
    }

    if (joystickContainer) {
      if (isAnalog) {
        joystickContainer.classList.remove('hidden');
      } else {
        joystickContainer.classList.add('hidden');
      }
    }

    if (btnToggleTouch) {
      const key = isAnalog ? 'btn_touch_mode_analog' : 'btn_touch_mode_dpad';
      btnToggleTouch.setAttribute('title', i18n.t(key));
      btnToggleTouch.setAttribute('data-i18n-title', key);
    }

    if (touchModeIcon) {
      touchModeIcon.setAttribute('icon', isAnalog ? 'mdi:axis-arrow' : 'material-symbols:joystick');
    }

    if (touchOptDpad && touchOptAnalog) {
      if (isAnalog) {
        touchOptAnalog.classList.add('active-preset');
        touchOptDpad.classList.remove('active-preset');
      } else {
        touchOptDpad.classList.add('active-preset');
        touchOptAnalog.classList.remove('active-preset');
      }
    }
  }

  showFloatingNotice(text, color = '#ffffff') {
    if (!this.floatingContainer) return;

    const el = document.createElement('div');
    el.className = 'floating-notice animate-float-fade';
    el.style.color = color;
    el.textContent = text;

    this.floatingContainer.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 1200);
  }
}
