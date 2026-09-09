import * as THREE from 'three';

export class Player {
  constructor(scene) {
    this.scene = scene;

    // Lanes definition: -1 (left), 0 (center), 1 (right)
    this.laneWidth = 2.4;
    this.currentLane = 0;
    this.targetX = 0;

    // Physics & state
    this.y = 0;
    this.vy = 0;
    this.isGrounded = true;
    this.jumpForce = 13.5;
    this.gravity = -34;

    // Invulnerability & Hit state
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.invulnerableDuration = 1.5;

    // Stumble animation
    this.stumbleTimer = 0;

    // Running animation variables
    this.runCycle = 0;
    this.runSpeed = 16;

    // Create 3D character mesh
    this.group = new THREE.Group();
    this.buildCharacterMesh();
    this.scene.add(this.group);

    // Initial position
    this.group.position.set(0, 0, 0);

    // Reusable Box3 for collision
    this.collider = new THREE.Box3();
  }

  buildCharacterMesh() {
    // Colors
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 }); // vibrant blue
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }); // dark navy
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }); // red cap
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });

    this.characterMaterials = [skinMat, shirtMat, pantsMat, shoeMat, capMat, eyeMat];

    // Root model container
    this.model = new THREE.Group();
    this.group.add(this.model);

    // Torso / Body
    const bodyGeo = new THREE.BoxGeometry(0.65, 0.75, 0.4);
    const body = new THREE.Mesh(bodyGeo, shirtMat);
    body.position.y = 0.95;
    body.castShadow = true;
    this.model.add(body);
    this.bodyMesh = body;

    // Head
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.6;
    head.castShadow = true;
    this.model.add(head);
    this.headMesh = head;

    // Eyes (facing forward towards -Z, in direction of running)
    const eyeGeo = new THREE.BoxGeometry(0.09, 0.09, 0.05);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.13, 1.62, -0.24);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.13, 1.62, -0.24);
    this.model.add(leftEye, rightEye);

    // Cap / Hat (visor facing forward towards -Z)
    const capGeo = new THREE.BoxGeometry(0.54, 0.16, 0.54);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 1.88;
    cap.castShadow = true;
    const visorGeo = new THREE.BoxGeometry(0.5, 0.06, 0.25);
    const visor = new THREE.Mesh(visorGeo, capMat);
    visor.position.set(0, 1.83, -0.36);
    visor.castShadow = true;
    this.model.add(cap, visor);

    // Backpack (on character's back, facing the camera at +Z)
    const packMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 }); // orange pack
    const strapMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
    this.characterMaterials.push(packMat, strapMat);

    const packGeo = new THREE.BoxGeometry(0.48, 0.52, 0.22);
    const backpack = new THREE.Mesh(packGeo, packMat);
    backpack.position.set(0, 0.96, 0.26);
    backpack.castShadow = true;

    // Small detail badge on backpack
    const badgeGeo = new THREE.BoxGeometry(0.24, 0.2, 0.04);
    const badgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 0.96, 0.38);

    // Straps over shoulders
    const strapLGeo = new THREE.BoxGeometry(0.08, 0.45, 0.42);
    const strapL = new THREE.Mesh(strapLGeo, strapMat);
    strapL.position.set(-0.2, 1.05, 0.06);
    const strapRGeo = new THREE.BoxGeometry(0.08, 0.45, 0.42);
    const strapR = new THREE.Mesh(strapRGeo, strapMat);
    strapR.position.set(0.2, 1.05, 0.06);

    this.model.add(backpack, badge, strapL, strapR);

    // Limbs with pivot points
    // Left Leg
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.2, 0.65, 0);
    const legGeo = new THREE.BoxGeometry(0.24, 0.55, 0.24);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.y = -0.28;
    leftLeg.castShadow = true;
    const footGeo = new THREE.BoxGeometry(0.26, 0.15, 0.38);
    const leftFoot = new THREE.Mesh(footGeo, shoeMat);
    leftFoot.position.set(0, -0.58, -0.06); // toes pointing forward (-Z)
    leftFoot.castShadow = true;
    this.leftLegPivot.add(leftLeg, leftFoot);
    this.model.add(this.leftLegPivot);

    // Right Leg
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.2, 0.65, 0);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.y = -0.28;
    rightLeg.castShadow = true;
    const rightFoot = new THREE.Mesh(footGeo, shoeMat);
    rightFoot.position.set(0, -0.58, -0.06); // toes pointing forward (-Z)
    rightFoot.castShadow = true;
    this.rightLegPivot.add(rightLeg, rightFoot);
    this.model.add(this.rightLegPivot);

    // Left Arm
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.43, 1.25, 0);
    const armGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
    const leftArm = new THREE.Mesh(armGeo, shirtMat);
    leftArm.position.y = -0.22;
    leftArm.castShadow = true;
    const handGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -0.48;
    this.leftArmPivot.add(leftArm, leftHand);
    this.model.add(this.leftArmPivot);

    // Right Arm
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.43, 1.25, 0);
    const rightArm = new THREE.Mesh(armGeo, shirtMat);
    rightArm.position.y = -0.22;
    rightArm.castShadow = true;
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -0.48;
    this.rightArmPivot.add(rightArm, rightHand);
    this.model.add(this.rightArmPivot);
  }

  moveLeft() {
    if (this.currentLane > -1) {
      this.currentLane--;
      this.targetX = this.currentLane * this.laneWidth;
      return true;
    }
    return false;
  }

  moveRight() {
    if (this.currentLane < 1) {
      this.currentLane++;
      this.targetX = this.currentLane * this.laneWidth;
      return true;
    }
    return false;
  }

  jump() {
    if (this.isGrounded) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      return true;
    }
    return false;
  }

  /**
   * Called when player bumps into an obstacle
   */
  hitObstacle() {
    // Trigger invulnerability blink
    this.isInvulnerable = true;
    this.invulnerableTimer = this.invulnerableDuration;
    this.stumbleTimer = 0.5;

    // "volta para o meio onde continua a correr" (user requirement)
    this.currentLane = 0;
    this.targetX = 0;
  }

  update(delta, gameSpeed, particleSystem) {
    // Smooth lane transition (lerp)
    this.group.position.x += (this.targetX - this.group.position.x) * Math.min(1, delta * 14);

    // Apply slight banking/tilt when moving laterally
    const lateralSpeed = (this.targetX - this.group.position.x);
    this.model.rotation.z = -lateralSpeed * 0.15;

    // Vertical physics (jump & gravity)
    if (!this.isGrounded) {
      this.vy += this.gravity * delta;
      this.y += this.vy * delta;

      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.isGrounded = true;
        // Landing dust
        if (particleSystem) {
          particleSystem.createRunningDust(this.group.position);
          particleSystem.createRunningDust(this.group.position);
        }
      }
    }

    this.group.position.y = this.y;

    // Stumble effect (backward tilt)
    if (this.stumbleTimer > 0) {
      this.stumbleTimer -= delta;
      this.model.rotation.x = 0.35 * (this.stumbleTimer / 0.5); // tilts backward towards camera
    } else {
      this.model.rotation.x = -0.08; // slight forward lean into the run (-Z)
    }

    // Running animation
    if (this.isGrounded) {
      this.runCycle += delta * this.runSpeed * (gameSpeed / 12);
      const swing = Math.sin(this.runCycle);

      this.leftLegPivot.rotation.x = swing * 0.75;
      this.rightLegPivot.rotation.x = -swing * 0.75;

      this.leftArmPivot.rotation.x = -swing * 0.8;
      this.rightArmPivot.rotation.x = swing * 0.8;

      // Vertical bounce while running
      this.bodyMesh.position.y = 0.95 + Math.abs(Math.cos(this.runCycle)) * 0.08;
      this.headMesh.position.y = 1.6 + Math.abs(Math.cos(this.runCycle)) * 0.08;

      // Dust particles
      if (particleSystem && Math.abs(swing) > 0.85) {
        particleSystem.createRunningDust(this.group.position);
      }
    } else {
      // In-air pose (legs tucked slightly back, arms spread for balance)
      this.leftLegPivot.rotation.x = 0.3;
      this.rightLegPivot.rotation.x = 0.4;
      this.leftArmPivot.rotation.x = -0.6;
      this.rightArmPivot.rotation.x = -0.6;
    }

    // Invulnerability blinking effect
    if (this.isInvulnerable) {
      this.invulnerableTimer -= delta;
      const blink = Math.sin(this.invulnerableTimer * 25) > 0;
      this.model.visible = blink;

      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
        this.model.visible = true;
      }
    } else {
      this.model.visible = true;
    }
  }

  getCollider() {
    // Character bounding box around current position
    const pos = this.group.position;
    this.collider.min.set(pos.x - 0.35, pos.y + 0.1, pos.z - 0.35);
    this.collider.max.set(pos.x + 0.35, pos.y + 1.8, pos.z + 0.35);
    return this.collider;
  }

  reset() {
    this.currentLane = 0;
    this.targetX = 0;
    this.group.position.set(0, 0, 0);
    this.y = 0;
    this.vy = 0;
    this.isGrounded = true;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.model.visible = true;
  }
}
