import * as THREE from 'three';
import { audioManager } from '../audio/AudioManager.js';

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

    // Glider / Paraglider state
    this.isGliding = false;
    this.airTime = 0;
    this.glideTime = 0;
    this.gliderHoldThreshold = 0.18; // Minimum hold time (~180ms) to deploy glider
    this.jumpOriginGround = false;   // Tracks if current jump originated from the ground
    this.onLowStrength = null;       // Callback when trying to glide without enough strength
    this.hasWarnedLowStrength = false;

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

    // Build hang-glider wings
    this.buildGliderMesh();
  }

  buildGliderMesh() {
    this.gliderGroup = new THREE.Group();
    this.gliderGroup.position.set(0, 2.05, -0.15); // positioned above character's head/arms
    this.gliderGroup.visible = false;

    // Materials
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9, // vibrant sky cyan
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // amber gold racing stripe
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // dark slate titanium frame
      roughness: 0.25,
      metalness: 0.85
    });

    this.characterMaterials.push(wingMat, stripeMat, frameMat);

    // 1. Delta Wing Canopy (Two triangular swept wings)
    // Left Wing
    const leftWingGeo = new THREE.BufferGeometry();
    const leftVertices = new Float32Array([
      0, 0.05, -0.85,     // Nose apex (forward -Z)
      -2.1, -0.05, 0.55,  // Left wingtip
      0, 0.08, 0.45       // Center trailing edge (+Z)
    ]);
    leftWingGeo.setAttribute('position', new THREE.BufferAttribute(leftVertices, 3));
    leftWingGeo.computeVertexNormals();
    const leftWing = new THREE.Mesh(leftWingGeo, wingMat);
    leftWing.castShadow = true;
    this.gliderGroup.add(leftWing);

    // Right Wing
    const rightWingGeo = new THREE.BufferGeometry();
    const rightVertices = new Float32Array([
      0, 0.05, -0.85,     // Nose apex (forward -Z)
      0, 0.08, 0.45,      // Center trailing edge (+Z)
      2.1, -0.05, 0.55    // Right wingtip
    ]);
    rightWingGeo.setAttribute('position', new THREE.BufferAttribute(rightVertices, 3));
    rightWingGeo.computeVertexNormals();
    const rightWing = new THREE.Mesh(rightWingGeo, wingMat);
    rightWing.castShadow = true;
    this.gliderGroup.add(rightWing);

    // Center decorative spine stripe
    const stripeGeo = new THREE.BufferGeometry();
    const stripeVertices = new Float32Array([
      0, 0.06, -0.85,
      -0.35, 0.07, 0.45,
      0.35, 0.07, 0.45
    ]);
    stripeGeo.setAttribute('position', new THREE.BufferAttribute(stripeVertices, 3));
    stripeGeo.computeVertexNormals();
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    this.gliderGroup.add(stripe);

    // 2. Tubular Frame (Central keel + Leading edges)
    const keelGeo = new THREE.CylinderGeometry(0.028, 0.028, 1.4, 8);
    const keel = new THREE.Mesh(keelGeo, frameMat);
    keel.rotation.x = Math.PI / 2;
    keel.position.set(0, 0.06, -0.15);
    this.gliderGroup.add(keel);

    const leftEdgeGeo = new THREE.CylinderGeometry(0.024, 0.024, 2.5, 8);
    const leftEdge = new THREE.Mesh(leftEdgeGeo, frameMat);
    leftEdge.position.set(-1.05, 0, -0.15);
    leftEdge.rotation.z = Math.atan2(0.1, 2.1);
    leftEdge.rotation.y = -Math.atan2(1.4, 2.1);
    this.gliderGroup.add(leftEdge);

    const rightEdgeGeo = new THREE.CylinderGeometry(0.024, 0.024, 2.5, 8);
    const rightEdge = new THREE.Mesh(rightEdgeGeo, frameMat);
    rightEdge.position.set(1.05, 0, -0.15);
    rightEdge.rotation.z = -Math.atan2(0.1, 2.1);
    rightEdge.rotation.y = Math.atan2(1.4, 2.1);
    this.gliderGroup.add(rightEdge);

    // 3. A-Frame Control Bar (Hanging down to hand level)
    const aFrameGroup = new THREE.Group();
    const strutGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.72, 8);
    const leftStrut = new THREE.Mesh(strutGeo, frameMat);
    leftStrut.position.set(-0.32, -0.34, -0.05);
    leftStrut.rotation.z = -0.22;
    aFrameGroup.add(leftStrut);

    const rightStrut = new THREE.Mesh(strutGeo, frameMat);
    rightStrut.position.set(0.32, -0.34, -0.05);
    rightStrut.rotation.z = 0.22;
    aFrameGroup.add(rightStrut);

    const barGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.84, 8);
    const handleBar = new THREE.Mesh(barGeo, frameMat);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, -0.66, -0.05);
    aFrameGroup.add(handleBar);

    this.gliderGroup.add(aFrameGroup);

    this.model.add(this.gliderGroup);
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
      this.isGliding = false;
      this.airTime = 0;
      this.glideTime = 0;
      this.jumpOriginGround = true; // Started from the ground
      if (this.gliderGroup) this.gliderGroup.visible = false;
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

    // Cancel gliding immediately on impact
    this.isGliding = false;
    this.jumpOriginGround = false;
    if (this.gliderGroup) this.gliderGroup.visible = false;

    // "volta para o meio onde continua a correr" (user requirement)
    this.currentLane = 0;
    this.targetX = 0;
  }

  cancelGliding() {
    if (this.isGliding) {
      this.isGliding = false;
      if (this.gliderGroup) this.gliderGroup.visible = false;
    }
  }

  update(delta, gameSpeed, particleSystem, isJumpHeld = false, canGlide = true) {
    // Smooth lane transition (lerp)
    this.group.position.x += (this.targetX - this.group.position.x) * Math.min(1, delta * 14);

    // Apply slight banking/tilt when moving laterally
    const lateralSpeed = (this.targetX - this.group.position.x);
    this.model.rotation.z = -lateralSpeed * 0.15;

    // Vertical physics (jump, gliding & gravity)
    if (!this.isGrounded) {
      this.airTime += delta;

      // Deploy glider if jump action is held while airborne and enough strength is available
      if (isJumpHeld && this.airTime >= this.gliderHoldThreshold) {
        if (!this.isGliding) {
          if (canGlide) {
            this.isGliding = true;
            if (this.gliderGroup) this.gliderGroup.visible = true;
            audioManager.playGliderOpen();

            // If coming from the ground, the glider jump reaches noticeably higher
            if (this.jumpOriginGround) {
              this.jumpOriginGround = false;
              this.vy = 5.6; // High soaring launch boost from ground
            } else {
              // Mid-air / fall deploy: gentle thermal lift pop
              if (this.y < 4.2) {
                this.vy = 3.2;
              } else {
                this.vy = Math.max(this.vy, 0.5);
              }
            }

            if (particleSystem) {
              particleSystem.createRunningDust(this.group.position);
            }
          } else if (!this.hasWarnedLowStrength) {
            this.hasWarnedLowStrength = true;
            if (this.onLowStrength) this.onLowStrength();
          }
        }
      } else if (!isJumpHeld && this.isGliding) {
        // Player released jump in mid-air -> retract glider
        this.cancelGliding();
      }

      if (this.isGliding) {
        this.glideTime += delta;
        // Substantially reduced gravity and capped downward speed for slow glide
        const glideGravity = -7.5;
        this.vy += glideGravity * delta;
        this.vy = Math.max(this.vy, -2.8); // Terminal descent speed

        // Aerodynamic flight oscillation
        if (this.gliderGroup) {
          this.gliderGroup.rotation.z = Math.sin(this.glideTime * 4.5) * 0.06;
          this.gliderGroup.rotation.x = -0.12 + Math.sin(this.glideTime * 3) * 0.04;
        }
      } else {
        // Normal fall gravity
        this.vy += this.gravity * delta;
      }

      this.y += this.vy * delta;

      // Ground touchdown check
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.isGrounded = true;
        this.airTime = 0;
        this.glideTime = 0;
        this.jumpOriginGround = false;
        this.hasWarnedLowStrength = false;

        // "sumindo as asas do planador assim que toca o chão"
        this.cancelGliding();

        // Landing dust puffs
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
    } else if (this.isGliding) {
      // Streamlined forward aerodynamic tilt when flying
      this.model.rotation.x = -0.32;
    } else {
      this.model.rotation.x = -0.08; // slight forward lean into the run (-Z)
    }

    // Running / In-air animation
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
    } else if (this.isGliding) {
      // Gliding flight pose: hands reaching up to the control bar, legs streaming back
      this.leftArmPivot.rotation.x = -2.3;
      this.rightArmPivot.rotation.x = -2.3;
      this.leftLegPivot.rotation.x = 0.55;
      this.rightLegPivot.rotation.x = 0.65;
    } else {
      // Normal in-air jump pose (legs tucked slightly back, arms spread for balance)
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
    this.isGliding = false;
    this.airTime = 0;
    this.glideTime = 0;
    this.jumpOriginGround = false;
    if (this.gliderGroup) this.gliderGroup.visible = false;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.model.visible = true;
  }
}
