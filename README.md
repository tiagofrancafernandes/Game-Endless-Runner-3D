# Endless Runner 3D - Three.js & Joystick

[🇧🇷 Versão em Português](README.pt-br.md) | 🇺🇸 English Version

![Endless Runner 3D Screenshot](./screenshot.png)
![Endless Runner 3D Screenshot 'pt-br'](./screenshot.pt-br.png)

A vibrant, fluid, and full-featured **3D Endless Runner** web game built with **Pure Vanilla JavaScript (ES Modules)**, **Three.js**, **Vite**, and **Iconify** (100% modular and framework-agnostic, with zero dependencies on React, Vue, or other component frameworks).

The game features infinite 3-lane gameplay, comprehensive support for **Keyboard**, **Physical Gamepads/Joysticks (USB & Bluetooth)** with dedicated layouts for Xbox and PlayStation controllers plus haptic rumble vibration, an on-screen **Virtual Analog Thumbstick** and **D-Pad Touch Buttons** for mobile devices with directional hold-to-repeat, real-time procedural audio and synthwave soundtrack via the **Web Audio API**, **Dynamic Multilingual Localization (`pt-BR` and `en-US`)** with auto-detection, responsive **Fullscreen Mode**, and full user preference persistence via **`localStorage`**.

---

## 🎮 Game Mechanics & Features

### 1. 3D World & Graphics (Three.js)
- **Infinite 3-Lane Track**:
  - Continuous road with moving dashed lane dividers and edge curbs delivering a high-speed sensation.
  - Surrounding scenery with green plains, stylized pine and leafy trees, and dynamic procedural clouds.
  - Soft atmospheric fog and dynamic lighting with smooth shadows (`PCFSoftShadowMap`).
  - Third-person perspective camera with smooth damping that tracks lateral lane switching and jumps.
- **Stylized 3D Animated Character**:
  - Procedurally modeled with Three.js primitive geometries (instant loading without heavy external 3D files).
  - Detailed, friendly face oriented toward the running direction (`-Z`), featuring expressive eyes, pupils, a smile, and a peaked cap.
  - Character backpack visible from the third-person camera angle.
  - Continuous running animation synchronized with game speed, banking tilt during turns, jump arc physics with gravity, and ground landing dust particles.

### 2. Obstacles & Collision Dynamics
- **Varied Obstacles**:
  - Mossy fallen tree logs, striped safety road barriers with reflective panels, and boulders on the pavement.
  - Fair distribution and smooth difficulty progression ramping up speed based on distance traveled.
- **Infinite (*Endless*) Run Flow**:
  - Colliding with an obstacle causes points loss (-120 pts), life reduction (-25%), and strength loss (-20%), triggers visual flinching and invulnerability blinking, and **smoothly returns the character to the center lane** to keep running.
  - No frustrating game over screens: even if health depletes, the runner recovers breath and continues running indefinitely.

### 3. Collectible 3D Fruits
- **Assortment of Fruits**:
  - **Red Apples** (+60 pts, +12% health, +15% strength)
  - **Golden Bananas** (+80 pts, +15% health, +18% strength)
  - **Twin Cherries** (+100 pts, +18% health, +20% strength)
  - **Citrus Oranges** (+120 pts, +20% health, +25% strength)
- Fruits float and spin gently in the air, arranged in rows or curved jump arcs.
- Collecting fruits triggers a synthesized musical chime, color-coded particle spark bursts, and floating score notifications.

### 4. Real-Time Procedural Audio (Web Audio API)
- Pure synthesized sound effects generated in code without loading external `.mp3` or `.wav` assets:
  - Jump whoosh sound (triangle wave with frequency modulation).
  - Obstacle bump impact sound (sawtooth wave with filtered noise).
  - Harmonic fruit pickup chimes.
  - Retro chiptune / synthwave procedural background music (BGM).
- **Quick Audio HUD Controls**:
  - Master Mute (`iconify-icon icon="mdi:volume-high"` / `mdi:volume-off`).
  - Toggle Sound Effects (SFX) (`mdi:bell-ring` / `mdi:bell-off`).
  - Toggle Background Music (BGM) (`mdi:music` / `mdi:music-off`).

### 5. Dynamic Multilingual Support (i18n)
- Full localization for **English (`en-US`)** and **Portuguese (`pt-BR`)**.
- Automatic browser language detection on initial launch.
- Quick toggle button in the top HUD (`EN` / `PT`).
- Real-time updates across HUD labels, modals, tooltips, floating notices, gamepad button legends, and fruit names.
- Language preference saved to `localStorage`.

### 6. Fullscreen Mode
- Dedicated button in the HUD to enter and exit fullscreen.
- Quick keyboard shortcut using the **`F`** key.
- Dynamic icon and tooltip state updates (`fullscreenchange`).

---

## 🕹️ Controls: Keyboard, Physical Gamepad & Touch

The game features a unified input management system supporting multiple input devices concurrently:

### 1. Keyboard and Physical Gamepad / Joystick (USB & Bluetooth)
- **Controller Naming Presets**:
  - **Xbox (XInput)**: `A`, `B`, `X`, `Y`, `LB`, `RB`, `LT`, `RT`, `View`, `Menu`, `D-Pad`, etc.
  - **PlayStation (DualShock / DualSense)**: `✕ (Cross)`, `○ (Circle)`, `□ (Square)`, `△ (Triangle)`, `L1`, `R1`, `L2`, `R2`, `Share`, `Options`, `D-Pad`, `L3`, etc.
- **2 Inputs per Action (Keyboard + Joystick)**:
  - Each action features two independent configurable binding slots:
    - Slot 1: Keyboard key
    - Slot 2: Joystick button, D-Pad direction, or analog stick axis (with deadzone)
- **Interactive Remapping**:
  - Click any slot in the Settings Modal and press the new key on your keyboard or button on your gamepad.
- **Haptic Rumble Feedback**:
  - Native Gamepad Haptics API (`dual-rumble`) support.
  - The controller vibrates on obstacle collisions and gives subtle vibration pulses when collecting fruits.
  - Dedicated **"Test Vibration"** button inside the Control Settings modal.

| Action | Default Keyboard | Alternative | Joystick (Xbox) | Joystick (PlayStation) |
|---|---|---|---|---|
| **Move Left** | `Left Arrow` | `A` | `D-Pad Left` or `Left Stick (←)` | `D-Pad Left` or `Left Stick (←)` |
| **Move Right** | `Right Arrow` | `D` | `D-Pad Right` or `Left Stick (→)` | `D-Pad Right` or `Left Stick (→)` |
| **Jump / Glide** | `Spacebar` (hold in mid-air to glide) | `Up Arrow` / `W` | `A Button` | `✕ (Cross) Button` |
| **Pause / Resume** | `Esc` | `P` | `Menu / Start` | `Options / Start` |
| **Fullscreen** | `F` | — | — | — |

- **Hang Glider Wings (*Paraglider*)**:
  - Tapping the jump button triggers a standard acrobatic jump.
  - **Holding down** the jump action (on keyboard, physical controller, touch jump button `#touch-jump`, or pulling the virtual analog upward) deploys **3D hang-glider wings**, sustaining the character in the air with a gentle, slow gliding descent.
  - **Strength Requirement & Drain**:
    - Deploying the glider requires at least **15% Strength**.
    - Gliding steadily consumes strength at a rate of 18 units/second.
    - If strength depletes to 0% mid-flight, the glider wings automatically retract and a warning alert is triggered.
    - Running on the ground gently recharges strength up to 35%, ensuring you can always glide again.
  - The moment the character's feet touch the ground (or if the jump button is released), the glider wings instantly vanish and normal running resumes seamlessly.

### 2. Touch Controls (Mobile / Tablets)
- **Two Selectable Modes**:
  1. **Directional Arrows (D-Pad)**: Clean round touch buttons for left and right lane shifts, and an elevated jump button.
  2. **Virtual Analog Joystick (`VirtualJoystick`)**: Circular spring-back thumbstick with polar vector clamping, deadzone calibration, and pull-up jump detection.
- **Instant Mode Toggle**:
  - Dedicated HUD button to switch between D-Pad and Virtual Analog with one tap.
  - Preference selector in the Settings Modal.
- **Hold-to-Repeat (Continuous Directional Movement)**:
  - Holding the analog stick tilted or holding the touch arrow buttons/keyboard keys continuously triggers lane movements (initial delay of 220ms, repeated every 180ms).
- **Ergonomics & Safe Areas**:
  - On-screen controls elevated above browser navigation bars and mobile safe areas (`calc(3.5rem + env(safe-area-inset-bottom))`).
  - Top HUD action buttons automatically center horizontally on mobile and tablet screens for balanced two-handed accessibility, while aligning right on desktop.

---

## 💾 Data Persistence (`localStorage`)

All player preferences are saved automatically across sessions:
- `endless_runner_locale`: Selected language (`en-US` or `pt-BR`).
- `endless_runner_audio`: Audio preferences (master mute, SFX toggle, BGM toggle).
- `endless_runner_gamepad_preset`: Controller naming preset (`xinput` or `dualshock`).
- `endless_runner_controls`: Customized keyboard and gamepad action bindings.
- `endless_runner_touch_mode`: Active touch control mode (`dpad` or `analog`).

---

## 🛠️ Built With

- **[Three.js](https://threejs.org/)**: 3D WebGL renderer, perspective camera, directional lighting, soft shadow maps, fog, and procedural meshes.
- **[Vite](https://vitejs.dev/)**: Next-generation frontend build tool with instantaneous Hot Module Replacement (HMR).
- **[Iconify](https://iconify.design/)**: Modern vector icon web component (`<iconify-icon>`).
- **Web Audio API**: Real-time procedural audio and retro synth music engine.
- **Gamepad API**: Gamepad detection, analog stick polling, and dual-motor haptic rumble.
- **HTML5 Fullscreen API**: Responsive fullscreen mode.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (version 18 or higher)
- **npm**, **yarn**, or **pnpm**

### Installation

1. Clone the repository:
```bash
git clone https://github.com/tiagofrancafernandes/Game-Endless-Runner-3D.git
cd Game-Endless-Runner-3D
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open the local URL displayed in your terminal (typically `http://localhost:5173/`).

### Production Build

To compile minified, production-ready static assets to the `dist/` directory:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

---

## 📁 Directory Structure

```
jogo-threejs-joystick/
├── index.html                  # Main markup, canvas, HUD, and modal dialogs
├── package.json                # Project dependencies and npm scripts
├── vite.config.js              # Vite configuration
├── README.md                   # English documentation (default)
├── README.pt-br.md             # Portuguese documentation
├── AGENTS.md                   # Technical guidelines for AI agents & contributors
├── screenshot.png              # In-game gameplay screenshot (English HUD)
├── screenshot.pt-br.png        # In-game gameplay screenshot (Portuguese HUD)
├── src/
│   ├── main.js                 # Entry point, game and UI bootstrap
│   ├── style.css               # Styling, glassmorphism, responsive HUD, and touch controls
│   ├── audio/
│   │   └── AudioManager.js     # Web Audio API procedural sound and music synthesizer
│   ├── entities/
│   ├── game/
│   │   ├── Game.js             # Core game loop, game state, speeds, and collisions
│   │   ├── Player.js           # 3D player mesh, physics, lane switching, and animations
│   │   ├── SceneManager.js     # Three.js scene, camera, lights, road, clouds, and fog
│   │   ├── ObstacleManager.js  # Procedural obstacle spawning and object pooling
│   │   ├── FruitManager.js     # 3D collectible fruits, rotation, and pickup logic
│   │   └── ParticleSystem.js   # Particle system for dust puffs and fruit pickup sparks
│   ├── i18n/
│   │   ├── I18nManager.js      # Locale management and reactive subscriber pattern
│   │   └── translations.js     # Dictionaries for pt-BR and en-US
│   ├── input/
│   │   ├── GamepadAdapter.js   # Gamepad API, haptics, and Xbox/PlayStation presets
│   │   ├── InputManager.js     # Unified input manager with hold auto-repeat
│   │   └── KeyConfig.js        # Action binding configuration and localStorage persistence
│   └── ui/
│       ├── UIManager.js        # HUD updates, modals, audio controls, and touch events
│       └── VirtualJoystick.js  # Virtual analog thumbstick with spring-back physics
```

---

## 📄 License

This project is licensed under the MIT License. Feel free to clone, learn from, and adapt the code!
