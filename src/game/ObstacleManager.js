import * as THREE from 'three';

export class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.laneWidth = 2.4;

    // Materials
    this.woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
    this.darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 });
    this.rockMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9, flatShading: true });
    this.mossMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.7 });
    this.stripeYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    this.stripeBlackMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 });

    // Spawn parameters: "poucos obstáculos" -> moderate spacing
    this.spawnDistance = 90; // distance ahead to spawn
    this.minSpacing = 28;
    this.maxSpacing = 42;
    this.nextSpawnZ = -35;
  }

  createHurdle() {
    const group = new THREE.Group();

    // Crossbar
    const barGeo = new THREE.BoxGeometry(1.8, 0.25, 0.2);
    const bar1 = new THREE.Mesh(barGeo, this.stripeYellowMat);
    bar1.position.y = 0.75;
    bar1.castShadow = true;

    // Stripes on the hurdle
    const stripeCount = 4;
    for (let i = 0; i < stripeCount; i++) {
      const stripeGeo = new THREE.BoxGeometry(0.2, 0.26, 0.21);
      const stripe = new THREE.Mesh(stripeGeo, this.stripeBlackMat);
      stripe.position.set(-0.6 + i * 0.4, 0.75, 0);
      group.add(stripe);
    }

    // Posts
    const postGeo = new THREE.BoxGeometry(0.18, 0.9, 0.18);
    const postL = new THREE.Mesh(postGeo, this.woodMat);
    postL.position.set(-0.85, 0.45, 0);
    postL.castShadow = true;

    const postR = new THREE.Mesh(postGeo, this.woodMat);
    postR.position.set(0.85, 0.45, 0);
    postR.castShadow = true;

    // Feet
    const footGeo = new THREE.BoxGeometry(0.2, 0.1, 0.5);
    const footL = new THREE.Mesh(footGeo, this.darkWoodMat);
    footL.position.set(-0.85, 0.05, 0);
    const footR = new THREE.Mesh(footGeo, this.darkWoodMat);
    footR.position.set(0.85, 0.05, 0);

    group.add(bar1, postL, postR, footL, footR);

    // Bounding box size: width 1.8, height 0.9, depth 0.4
    group.userData = {
      type: 'hurdle',
      size: new THREE.Vector3(1.8, 0.85, 0.4),
      jumpable: true
    };

    return group;
  }

  createLog() {
    const group = new THREE.Group();

    // Fallen tree log
    const logGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.9, 8);
    logGeo.rotateZ(Math.PI / 2);
    const log = new THREE.Mesh(logGeo, this.darkWoodMat);
    log.position.y = 0.35;
    log.castShadow = true;
    group.add(log);

    // Moss patch on top
    const mossGeo = new THREE.BoxGeometry(1.2, 0.1, 0.4);
    const moss = new THREE.Mesh(mossGeo, this.mossMat);
    moss.position.set(0, 0.68, 0);
    group.add(moss);

    group.userData = {
      type: 'log',
      size: new THREE.Vector3(1.9, 0.75, 0.7),
      jumpable: true
    };

    return group;
  }

  createRock() {
    const group = new THREE.Group();

    const rockGeo = new THREE.DodecahedronGeometry(0.65, 1);
    const rock = new THREE.Mesh(rockGeo, this.rockMat);
    rock.position.y = 0.55;
    rock.scale.set(1.4, 0.9, 1.1);
    rock.castShadow = true;
    group.add(rock);

    group.userData = {
      type: 'rock',
      size: new THREE.Vector3(1.7, 0.85, 1.2),
      jumpable: true
    };

    return group;
  }

  spawnObstacle(zPos) {
    const types = ['hurdle', 'log', 'rock'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    let mesh;
    if (chosenType === 'hurdle') mesh = this.createHurdle();
    else if (chosenType === 'log') mesh = this.createLog();
    else mesh = this.createRock();

    // Random lane: -1, 0, 1
    const lane = Math.floor(Math.random() * 3) - 1;
    mesh.position.set(lane * this.laneWidth, 0, zPos);

    this.scene.add(mesh);
    this.obstacles.push({
      mesh,
      lane,
      collider: new THREE.Box3()
    });
  }

  update(delta, gameSpeed, playerZ) {
    // Move obstacles towards camera
    const distanceToMove = gameSpeed * delta;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.mesh.position.z += distanceToMove;

      // Update bounding box collider
      const pos = obs.mesh.position;
      const size = obs.mesh.userData.size;
      obs.collider.min.set(
        pos.x - size.x * 0.45,
        pos.y,
        pos.z - size.z * 0.5
      );
      obs.collider.max.set(
        pos.x + size.x * 0.45,
        pos.y + size.y,
        pos.z + size.z * 0.5
      );

      // Despawn once well behind player (z > 12)
      if (obs.mesh.position.z > 12) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    // Spawn new obstacles as track progresses
    // Adjust nextSpawnZ relative to moving road
    this.nextSpawnZ += distanceToMove;
    if (this.nextSpawnZ > -this.spawnDistance) {
      const spacing = this.minSpacing + Math.random() * (this.maxSpacing - this.minSpacing);
      const spawnZ = -this.spawnDistance - spacing;
      this.spawnObstacle(spawnZ);
      this.nextSpawnZ = spawnZ;
    }
  }

  checkCollision(playerCollider) {
    for (const obs of this.obstacles) {
      if (obs.collider.intersectsBox(playerCollider)) {
        return obs;
      }
    }
    return null;
  }

  clear() {
    for (const obs of this.obstacles) {
      this.scene.remove(obs.mesh);
    }
    this.obstacles = [];
    this.nextSpawnZ = -35;
  }
}
