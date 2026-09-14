# AGENTS.md - Developer & Agent Guidelines

This document provides architectural context, development standards, operational workflows, and behavioral rules for AI agents and engineers working on the **Endless Runner 3D** codebase.

---

## 1. Project Overview & Philosophy

**Endless Runner 3D** is a lightweight, responsive 3D game built with **Vanilla JavaScript (ES Modules)**, **Three.js**, **Vite**, and **Iconify**.

### Core Tenets
1. **Framework-Agnostic by Design**:
   - The game is built entirely with pure Vanilla JS and Web APIs.
   - **DO NOT** introduce React, Vue, Angular, Svelte, or any front-end component framework.
2. **Zero Heavy Assets**:
   - 3D models (player, obstacles, fruits, trees, clouds) are generated **procedurally** using Three.js primitive geometries and PBR materials.
   - Audio (SFX and BGM) is synthesized in real-time via the **Web Audio API**—no external `.mp3` or `.wav` files.
   - Icons are delivered dynamically using the **Iconify** web component (`<iconify-icon>`).
3. **Multi-Input First**:
   - Full concurrent support for Keyboard, Physical Gamepad (Xbox and PlayStation layouts with haptics), and Touch Controls (Virtual Analog Thumbstick + D-Pad buttons).
4. **Resilience & Infinite Play**:
   - The game does not stop on obstacle collision; the player stumbles, resets safely to the center lane, flashes with temporary invulnerability, and keeps running indefinitely.

---

## 2. Directory & Module Architecture

```
├── index.html                  # Main markup, canvas mount, HUD, and modal windows
├── package.json                # Dependencies and project scripts
├── vite.config.js              # Vite bundler configuration
├── src/
│   ├── main.js                 # Entry point: instantiates Game and UIManager
│   ├── style.css               # Styling, Tailwind-like utility classes, glassmorphism, HUD
│   ├── audio/
│   │   └── AudioManager.js     # Web Audio API procedural synthesizer (SFX & chiptune BGM)
│   ├── game/
│   │   ├── Game.js             # Core game loop, delta calculations, speeds, collisions, life/strength
│   │   ├── Player.js           # 3D player mesh, physics, lane switching, jumping, procedural animation
│   │   ├── SceneManager.js     # Three.js scene, camera, lights, shadows, moving road, clouds, fog
│   │   ├── ObstacleManager.js  # Procedural obstacle spawning, positioning, pooling, collision boxes
│   │   ├── FruitManager.js     # 3D collectible fruits (apples, bananas, cherries, oranges), rotation
│   │   └── ParticleSystem.js   # Particle pooling for dust puffs, landing impacts, fruit sparks
│   ├── i18n/
│   │   ├── I18nManager.js      # Locale detector, translation getter, pub/sub reactive notifications
│   │   └── translations.js     # Translation dictionaries for pt-BR and en-US
│   ├── input/
│   │   ├── GamepadAdapter.js   # Gamepad API integration, dual-rumble vibration, naming presets
│   │   ├── InputManager.js     # Unified input manager with hold auto-repeat detection
│   │   └── KeyConfig.js        # Multi-slot bindings (Keyboard + Joystick) and localStorage persistence
│   └── ui/
│       ├── UIManager.js        # HUD updates, modal handling, audio controls, touch mode toggle, i18n
│       └── VirtualJoystick.js  # On-screen virtual analog stick with pointer capture and hold-repeat
```

---

## 3. Strict Development Rules

### Rule 1: Icon Management (Iconify Only)
- **Always use Iconify**: Use `<iconify-icon icon="<set>:<name>"></iconify-icon>` for all icons.
- **Never add**:
  - Raw SVG files scattered in directories or assets.
  - Font icon kits (FontAwesome webfonts, Glyphicons, etc.).
  - Unicode character symbols as UI icons.
- Preferred Icon Collections:
  - Material Design Icons: `mdi:<icon-name>` (e.g., `mdi:controller`, `mdi:fullscreen`, `mdi:volume-high`).
  - Material Symbols: `material-symbols:<icon-name>`.

### Rule 2: Shell & Command Execution
- On this system, Node.js and npm are managed via **NVM** located at `$HOME/.config/nvm`.
- Any command involving `node`, `npm`, `npx`, or Vite in bash subshells **MUST** load the NVM environment first:
  ```bash
  export NVM_DIR="$HOME/.config/nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"; <command>
  ```
- **Long-Running Support Processes**:
  - When starting a development server (`npm run dev`), **NEVER** run it synchronously with a long wait time.
  - Always run it as a daemon (`IsDaemon: true`) with a short `WaitMsBeforeAsync` (~1000ms) to avoid blocking interactions.

### Rule 3: Localization (i18n)
- The application supports both **Portuguese (`pt-BR`)** and **English (`en-US`)**.
- Any new user-facing text, button label, tooltip, modal text, or notification:
  1. **Must** be added to both `pt-BR` and `en-US` in `src/i18n/translations.js`.
  2. Use `data-i18n="<key>"` or `data-i18n-title="<key>"` for static DOM elements in `index.html`.
  3. Use `i18n.t('<key>', params)` for dynamic code strings in JS.

### Rule 4: Data Persistence (`localStorage`)
- All user preferences must persist across page reloads:
  - `endless_runner_locale`: Active locale (`pt-BR` | `en-US`).
  - `endless_runner_audio`: Audio settings (`isMuted`, `sfxEnabled`, `musicEnabled`).
  - `endless_runner_gamepad_preset`: Active controller preset (`xinput` | `dualshock`).
  - `endless_runner_controls`: Customized action-to-key/button bindings.
  - `endless_runner_touch_mode`: Active touch mode (`dpad` | `analog`).
- Always wrap `localStorage` access in `try / catch` blocks to gracefully handle restricted browser environments (e.g., private browsing mode or iframe sandbox).

### Rule 5: Touch Controls & Mobile Ergonomics
- **Directional Repeat (Hold-to-Repeat)**:
  - Both the virtual analog thumbstick (`VirtualJoystick`) and on-screen directional buttons (`#touch-left`, `#touch-right`) must support continuous hold-to-repeat (initial delay: ~220ms, repeat cadence: ~180ms).
  - Virtual analog touch handling must use `setPointerCapture` and a `requestAnimationFrame` loop to detect holding even when the user's thumb remains completely motionless on the screen.
- **Visual & Layout Alignment**:
  - Touch buttons must be elevated using CSS safe areas (`calc(3.5rem + env(safe-area-inset-bottom))`) to stay clear of native OS home bars.
  - Top HUD actions must center horizontally on mobile/tablet viewports (`@media (max-width: 1024px)`) and right-align on desktop.

### Rule 6: Three.js Performance & Asset Integrity
- Avoid creating new geometries or materials every frame inside update/render loops. Cache and reuse materials and geometries wherever possible.
- When removing entities from the scene (e.g., obstacle pooling, particle removal), ensure their resources are cleaned up to prevent memory leaks.
- Ensure character meshes are facing the running direction (`-Z` axis) and that face elements (eyes, pupils, visor) point forward.

---

## 4. Testing & Verification Workflows

Before submitting or committing any change, verify the following:

1. **Production Build Verification**:
   ```bash
   export NVM_DIR="$HOME/.config/nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"; npm run build
   ```
   Ensure the build passes with code `0` and zero module/syntax errors.

2. **Git Conventions**:
   - Use clear commit messages following Conventional Commits format:
     - `feat: <description>` for new user features.
     - `fix: <description>` for bug fixes.
     - `docs: <description>` for documentation updates.
     - `style: <description>` for formatting/styling adjustments.
     - `refactor: <description>` for code restructuring without feature changes.

---

## 5. Contact & Repository

- **Repository**: [https://github.com/tiagofrancafernandes/Game-Endless-Runner-3D.git](https://github.com/tiagofrancafernandes/Game-Endless-Runner-3D.git)
- **Maintainer**: Tiago França
