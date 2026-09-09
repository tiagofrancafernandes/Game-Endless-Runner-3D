import * as THREE from 'three';

export class FruitManager {
  constructor(scene) {
    this.scene = scene;
    this.fruits = [];
    this.laneWidth = 2.4;

    // Materials
    this.appleMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.1 });
    this.bananaMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    this.cherryMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.2, metalness: 0.1 });
    this.orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    this.stemMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    this.leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });

    // Spawn parameters
    this.spawnDistance = 90;
    this.minSpacing = 12;
    this.maxSpacing = 22;
    this.nextSpawnZ = -20;
    this.animTime = 0;
  }

  createApple() {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.SphereGeometry(0.3, 12, 12);
    bodyGeo.scale(1, 0.9, 1);
    const body = new THREE.Mesh(bodyGeo, this.appleMat);
    body.castShadow = true;

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.16, 6);
    const stem = new THREE.Mesh(stemGeo, this.stemMat);
    stem.position.set(0, 0.32, 0);
    stem.rotation.z = 0.2;

    // Leaf
    const leafGeo = new THREE.BoxGeometry(0.12, 0.03, 0.08);
    const leaf = new THREE.Mesh(leafGeo, this.leafMat);
    leaf.position.set(0.08, 0.35, 0);
    leaf.rotation.z = 0.3;

    group.add(body, stem, leaf);
    group.userData = {
      type: 'apple',
      name: 'Maçã',
      points: 60,
      health: 12,
      strength: 15,
      color: 0xef4444,
      radius: 0.4
    };
    return group;
  }

  createBanana() {
    const group = new THREE.Group();

    // Curved banana shape using Torus segment
    const bananaGeo = new THREE.TorusGeometry(0.4, 0.12, 8, 16, Math.PI * 0.7);
    const banana = new THREE.Mesh(bananaGeo, this.bananaMat);
    banana.rotation.z = Math.PI * 0.65;
    banana.castShadow = true;

    // Tip
    const tipGeo = new THREE.BoxGeometry(0.06, 0.08, 0.06);
    const tip = new THREE.Mesh(tipGeo, this.stemMat);
    tip.position.set(-0.35, 0.2, 0);

    group.add(banana, tip);
    group.userData = {
      type: 'banana',
      name: 'Banana',
      points: 80,
      health: 15,
      strength: 20,
      color: 0xfacc15,
      radius: 0.4
    };
    return group;
  }

  createCherry() {
    const group = new THREE.Group();

    // Double cherry
    const cherryGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const cherry1 = new THREE.Mesh(cherryGeo, this.cherryMat);
    cherry1.position.set(-0.16, -0.05, 0);
    cherry1.castShadow = true;

    const cherry2 = new THREE.Mesh(cherryGeo, this.cherryMat);
    cherry2.position.set(0.16, -0.05, 0);
    cherry2.castShadow = true;

    // Stems
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6);
    const stem1 = new THREE.Mesh(stemGeo, this.stemMat);
    stem1.position.set(-0.08, 0.12, 0);
    stem1.rotation.z = -0.4;

    const stem2 = new THREE.Mesh(stemGeo, this.stemMat);
    stem2.position.set(0.08, 0.12, 0);
    stem2.rotation.z = 0.4;

    group.add(cherry1, cherry2, stem1, stem2);
    group.userData = {
      type: 'cherry',
      name: 'Cereja',
      points: 120,
      health: 20,
      strength: 25,
      color: 0xbe123c,
      radius: 0.42
    };
    return group;
  }

  createOrange() {
    const group = new THREE.Group();

    // Sphere
    const orangeGeo = new THREE.SphereGeometry(0.28, 14, 14);
    const orange = new THREE.Mesh(orangeGeo, this.orangeMat);
    orange.castShadow = true;

    // Small green star/leaf on top
    const leafGeo = new THREE.BoxGeometry(0.1, 0.02, 0.1);
    const leaf = new THREE.Mesh(leafGeo, this.leafMat);
    leaf.position.y = 0.28;

    group.add(orange, leaf);
    group.userData = {
      type: 'orange',
      name: 'Laranja',
      points: 90,
      health: 16,
      strength: 18,
      color: 0xf97316,
      radius: 0.38
    };
    return group;
  }

  spawnFruitPattern(startZ) {
    const types = ['apple', 'banana', 'cherry', 'orange'];
    const fruitType = types[Math.floor(Math.random() * types.length)];
    const lane = Math.floor(Math.random() * 3) - 1;
    const laneX = lane * this.laneWidth;

    // Decide pattern: line of 3 or jumping arc of 3
    const isArc = Math.random() > 0.5;
    const count = 3;
    const spacing = 3.5;

    for (let i = 0; i < count; i++) {
      let fruitMesh;
      if (fruitType === 'apple') fruitMesh = this.createApple();
      else if (fruitType === 'banana') fruitMesh = this.createBanana();
      else if (fruitType === 'cherry') fruitMesh = this.createCherry();
      else fruitMesh = this.createOrange();

      const z = startZ - i * spacing;
      let y = 0.8;
      if (isArc) {
        // Parabolic arc for jumping path
        y = 0.7 + Math.sin((i / (count - 1)) * Math.PI) * 1.5;
      }

      fruitMesh.position.set(laneX, y, z);
      this.scene.add(fruitMesh);

      this.fruits.push({
        mesh: fruitMesh,
        baseY: y,
        lane,
        collected: false
      });
    }
  }

  update(delta, gameSpeed) {
    this.animTime += delta * 3;
    const distanceToMove = gameSpeed * delta;

    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      f.mesh.position.z += distanceToMove;

      // Floating bobbing and rotation
      f.mesh.rotation.y += delta * 2.5;
      f.mesh.position.y = f.baseY + Math.sin(this.animTime + f.mesh.position.z * 0.5) * 0.12;

      // Despawn once behind camera
      if (f.mesh.position.z > 10) {
        this.scene.remove(f.mesh);
        this.fruits.splice(i, 1);
      }
    }

    // Spawn new fruit clusters
    this.nextSpawnZ += distanceToMove;
    if (this.nextSpawnZ > -this.spawnDistance) {
      const spacing = this.minSpacing + Math.random() * (this.maxSpacing - this.minSpacing);
      const spawnZ = -this.spawnDistance - spacing;
      this.spawnFruitPattern(spawnZ);
      this.nextSpawnZ = spawnZ;
    }
  }

  checkCollision(playerPos, playerRadius = 0.6) {
    const collectedFruits = [];

    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      if (f.collected) continue;

      const fPos = f.mesh.position;
      const dx = playerPos.x - fPos.x;
      const dy = playerPos.y + 0.8 - fPos.y; // check against torso height
      const dz = playerPos.z - fPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      const hitDist = playerRadius + f.mesh.userData.radius;
      if (distSq < hitDist * hitDist) {
        f.collected = true;
        collectedFruits.push({
          fruit: f.mesh.userData,
          position: fPos.clone()
        });

        // Remove from scene
        this.scene.remove(f.mesh);
        this.fruits.splice(i, 1);
      }
    }

    return collectedFruits;
  }

  clear() {
    for (const f of this.fruits) {
      this.scene.remove(f.mesh);
    }
    this.fruits = [];
    this.nextSpawnZ = -20;
  }
}
