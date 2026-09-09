import * as THREE from 'three';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x93c5fd); // clean sky blue
    this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.012);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );
    this.camera.position.set(0, 3.8, 6.8);
    this.camera.lookAt(0, 1.4, -6);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lights
    this.setupLights();

    // 5. Infinite Environment (Road, Landscape, Trees, Clouds)
    this.environmentProps = [];
    this.setupEnvironment();

    // 6. Resize listener
    window.addEventListener('resize', () => this.onResize());
  }

  setupLights() {
    // Hemisphere light: sky blue from above, green bounce from below
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x445522, 0.7);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // Sun directional light
    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    dirLight.position.set(20, 35, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;

    const d = 25;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;

    this.scene.add(dirLight);
    this.dirLight = dirLight;

    // Soft ambient
    const ambLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambLight);
  }

  setupEnvironment() {
    // Road dimensions
    const roadWidth = 8.5;
    const roadLength = 180;

    // Road Pavement
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // slate asphalt
      roughness: 0.8
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.01, -roadLength / 2 + 15);
    road.receiveShadow = true;
    this.scene.add(road);
    this.roadMesh = road;

    // Curbs on edges of road
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
    const curbGeo = new THREE.BoxGeometry(0.4, 0.2, roadLength);
    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-roadWidth / 2 - 0.2, 0.1, -roadLength / 2 + 15);
    leftCurb.receiveShadow = true;
    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(roadWidth / 2 + 0.2, 0.1, -roadLength / 2 + 15);
    rightCurb.receiveShadow = true;
    this.scene.add(leftCurb, rightCurb);

    // Grass terrain
    const terrainGeo = new THREE.PlaneGeometry(200, roadLength);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // lush grass
      roughness: 0.9
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.set(0, -0.05, -roadLength / 2 + 15);
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    // Lane dashes (dashed stripes separating the 3 lanes)
    this.laneDashes = [];
    const dashGeo = new THREE.PlaneGeometry(0.18, 2.5);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let z = -roadLength + 15; z < 15; z += 5) {
      // Left divider (-1.2)
      const dashL = new THREE.Mesh(dashGeo, dashMat);
      dashL.rotation.x = -Math.PI / 2;
      dashL.position.set(-1.2, 0.01, z);
      this.scene.add(dashL);
      this.laneDashes.push(dashL);

      // Right divider (+1.2)
      const dashR = new THREE.Mesh(dashGeo, dashMat);
      dashR.rotation.x = -Math.PI / 2;
      dashR.position.set(1.2, 0.01, z);
      this.scene.add(dashR);
      this.laneDashes.push(dashR);
    }

    // Scenery Props: Low-poly Trees and Clouds along the sides
    const treeTypes = ['pine', 'leafy'];
    for (let i = 0; i < 35; i++) {
      const isLeft = i % 2 === 0;
      const x = isLeft ? - (6.5 + Math.random() * 20) : (6.5 + Math.random() * 20);
      const z = - (Math.random() * roadLength);
      const type = treeTypes[Math.floor(Math.random() * treeTypes.length)];

      const tree = this.createTree(type);
      tree.position.set(x, 0, z);
      this.scene.add(tree);
      this.environmentProps.push(tree);
    }

    // Clouds in sky
    for (let i = 0; i < 12; i++) {
      const cloud = this.createCloud();
      cloud.position.set(
        (Math.random() - 0.5) * 80,
        15 + Math.random() * 12,
        - (Math.random() * roadLength)
      );
      this.scene.add(cloud);
      this.environmentProps.push(cloud);
    }
  }

  createTree(type) {
    const group = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({
      color: type === 'pine' ? 0x15803d : 0x16a34a,
      roughness: 0.8,
      flatShading: true
    });

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 1.8, 6);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.9;
    trunk.castShadow = true;
    group.add(trunk);

    if (type === 'pine') {
      // 3 Cones
      for (let i = 0; i < 3; i++) {
        const coneGeo = new THREE.ConeGeometry(1.6 - i * 0.35, 1.6, 6);
        const cone = new THREE.Mesh(coneGeo, leafMat);
        cone.position.y = 1.8 + i * 1.0;
        cone.castShadow = true;
        group.add(cone);
      }
    } else {
      // Rounded low-poly foliage
      const sphereGeo = new THREE.DodecahedronGeometry(1.5, 1);
      const foliage = new THREE.Mesh(sphereGeo, leafMat);
      foliage.position.y = 2.8;
      foliage.scale.set(1, 1.2, 1);
      foliage.castShadow = true;
      group.add(foliage);
    }

    const scale = 0.7 + Math.random() * 0.6;
    group.scale.set(scale, scale, scale);
    return group;
  }

  createCloud() {
    const group = new THREE.Group();
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85
    });

    const puffCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < puffCount; i++) {
      const size = 2 + Math.random() * 2;
      const puffGeo = new THREE.SphereGeometry(size, 7, 7);
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(
        (i - puffCount / 2) * 2.2,
        Math.random() * 0.5,
        Math.random() * 1.5
      );
      group.add(puff);
    }

    return group;
  }

  update(delta, gameSpeed, playerPos) {
    const distanceToMove = gameSpeed * delta;

    // Animate lane dashes towards camera to create speed effect
    for (const dash of this.laneDashes) {
      dash.position.z += distanceToMove;
      if (dash.position.z > 15) {
        dash.position.z -= 160;
      }
    }

    // Move roadside props towards camera and recycle to front
    for (const prop of this.environmentProps) {
      prop.position.z += distanceToMove;
      if (prop.position.z > 18) {
        prop.position.z -= 180;
      }
    }

    // Dynamic camera follow with smooth dampening
    const targetCamX = playerPos.x * 0.45;
    this.camera.position.x += (targetCamX - this.camera.position.x) * delta * 5;
    this.camera.lookAt(this.camera.position.x * 0.6, 1.4, -6);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
