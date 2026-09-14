/**
 * VirtualJoystick - On-screen virtual analog thumbstick for touch & pointer devices.
 * Controls lane switching (Left / Right) and Jump (pull up) with smooth spring-back physics
 * and continuous hold repeat when tilted in a direction.
 */
export class VirtualJoystick {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.onMoveLeft = callbacks.onMoveLeft || (() => {});
    this.onMoveRight = callbacks.onMoveRight || (() => {});
    this.onJump = callbacks.onJump || (() => {});

    this.base = this.container.querySelector('#touch-joystick-base');
    this.knob = this.container.querySelector('#touch-joystick-knob');

    this.activePointerId = null;
    this.centerX = 0;
    this.centerY = 0;
    this.maxRadius = 38; // Max distance knob can move from center in pixels

    // Deadzones & thresholds
    this.moveThreshold = 0.45;
    this.jumpThreshold = -0.55;
    this.lastDirection = 0; // -1 (left), 0 (center), 1 (right)
    this.jumpTriggered = false;

    // Continuous hold repeat timings
    this.initialRepeatDelay = 220; // ms before continuous repeat kicks in
    this.repeatInterval = 180;     // ms between repeated triggers while held
    this.nextRepeatTime = 0;
    this.rafId = null;

    this.initEvents();
  }

  initEvents() {
    if (!this.base || !this.knob) return;

    this.base.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    window.addEventListener('blur', () => this.reset());
  }

  startHoldLoop() {
    if (this.rafId) return;
    const tick = () => {
      if (this.activePointerId !== null) {
        this.checkHoldRepeat();
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stopHoldLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  checkHoldRepeat() {
    const now = performance.now();
    if (this.lastDirection !== 0 && now >= this.nextRepeatTime) {
      if (this.lastDirection === -1) {
        this.onMoveLeft();
      } else if (this.lastDirection === 1) {
        this.onMoveRight();
      }
      this.nextRepeatTime = now + this.repeatInterval;
    }
  }

  onPointerDown(e) {
    if (this.activePointerId !== null) return;
    this.activePointerId = e.pointerId;

    if (this.base.setPointerCapture) {
      try {
        this.base.setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    const rect = this.base.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;

    this.updateStick(e.clientX, e.clientY);
    this.startHoldLoop();
  }

  onPointerMove(e) {
    if (e.pointerId !== this.activePointerId) return;
    this.updateStick(e.clientX, e.clientY);
  }

  onPointerUp(e) {
    if (e.pointerId !== this.activePointerId) return;
    this.activePointerId = null;
    this.reset();
  }

  updateStick(clientX, clientY) {
    const dx = clientX - this.centerX;
    const dy = clientY - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let clampedX = dx;
    let clampedY = dy;

    if (distance > this.maxRadius) {
      const angle = Math.atan2(dy, dx);
      clampedX = Math.cos(angle) * this.maxRadius;
      clampedY = Math.sin(angle) * this.maxRadius;
    }

    // Visual knob displacement
    this.knob.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

    // Normalized input vector [-1.0, 1.0]
    const nx = clampedX / this.maxRadius;
    const ny = clampedY / this.maxRadius;

    const now = performance.now();

    // Horizontal lane movement with hysteresis and continuous hold repeat
    if (nx < -this.moveThreshold) {
      if (this.lastDirection !== -1) {
        this.lastDirection = -1;
        this.onMoveLeft();
        this.nextRepeatTime = now + this.initialRepeatDelay;
      }
    } else if (nx > this.moveThreshold) {
      if (this.lastDirection !== 1) {
        this.lastDirection = 1;
        this.onMoveRight();
        this.nextRepeatTime = now + this.initialRepeatDelay;
      }
    } else if (Math.abs(nx) < 0.22) {
      // Re-centered horizontally, allow next lane switch
      this.lastDirection = 0;
      this.nextRepeatTime = 0;
    }

    // Vertical jump trigger (push stick upward)
    if (ny < this.jumpThreshold) {
      if (!this.jumpTriggered) {
        this.jumpTriggered = true;
        this.onJump();
      }
    } else if (ny > -0.25) {
      this.jumpTriggered = false;
    }
  }

  reset() {
    this.stopHoldLoop();
    if (this.knob) {
      this.knob.style.transform = 'translate(0px, 0px)';
    }
    this.lastDirection = 0;
    this.nextRepeatTime = 0;
    this.jumpTriggered = false;
  }
}
