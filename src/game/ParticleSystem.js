import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    // Particle geometries & materials
    this.sparkleGeo = new THREE.SphereGeometry(0.08, 6, 6);
    this.dustGeo = new THREE.SphereGeometry(0.12, 6, 6);
  }

  createFruitBurst(position, colorHex = 0xffe600) {
    const count = 16;
    const material = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 1
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkleGeo, material);
      mesh.position.copy(position);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      const vy = 2 + Math.random() * 4;

      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        vy,
        Math.sin(angle) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        gravity: -9.8,
        life: 1.0,
        decay: 1.8 + Math.random() * 0.8
      });
    }
  }

  createObstacleHitBurst(position) {
    const count = 20;
    const material = new THREE.MeshStandardMaterial({
      color: 0xff3b30,
      roughness: 0.5,
      transparent: true,
      opacity: 1
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.dustGeo, material);
      mesh.position.copy(position);

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      const vy = 3 + Math.random() * 5;

      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        vy,
        Math.sin(angle) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        gravity: -14,
        life: 1.0,
        decay: 1.5
      });
    }
  }

  createRunningDust(position) {
    if (Math.random() > 0.4) return;
    const material = new THREE.MeshBasicMaterial({
      color: 0xd4c2a5,
      transparent: true,
      opacity: 0.6
    });

    const mesh = new THREE.Mesh(this.dustGeo, material);
    mesh.position.set(
      position.x + (Math.random() - 0.5) * 0.4,
      position.y + 0.05,
      position.z - 0.4
    );
    mesh.scale.setScalar(0.4 + Math.random() * 0.5);

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      0.3 + Math.random() * 0.4,
      -1 - Math.random() * 1.5
    );

    this.scene.add(mesh);
    this.particles.push({
      mesh,
      velocity,
      gravity: -0.2,
      life: 0.5,
      decay: 1.6
    });
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay * delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (p.mesh.material) p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y += p.gravity * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.mesh.scale.multiplyScalar(0.97);
      if (p.mesh.material) {
        p.mesh.material.opacity = Math.max(0, p.life);
      }
    }
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles = [];
  }
}
