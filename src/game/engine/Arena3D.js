import * as THREE from "three";

export default class Arena3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this._build();
  }

  _build() {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(24, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: "#1a1a2e",
      roughness: 0.8,
      metalness: 0.2,
    });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.group.add(this.floor);

    // Grid lines on floor
    const gridHelper = new THREE.GridHelper(24, 24, 0x333355, 0x222244);
    gridHelper.position.y = 0.005;
    this.group.add(gridHelper);

    // Arena boundary walls (transparent with glow)
    this._buildWalls();

    // Arena ring / platform edge
    this._buildRing();

    // Background elements
    this._buildBackground();

    // Lighting
    this._buildLighting();

    // Particle floor glow
    this._buildFloorGlow();
  }

  _buildWalls() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: "#4444ff",
      transparent: true,
      opacity: 0.08,
      emissive: "#2222aa",
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
    });

    // Left wall
    const wallGeo = new THREE.PlaneGeometry(16, 5);
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-10, 2.5, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.group.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(10, 2.5, 0);
    rightWall.rotation.y = -Math.PI / 2;
    this.group.add(rightWall);

    // Wall edge lines
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x4444ff, linewidth: 2 });

    [-10, 10].forEach((x) => {
      const points = [
        new THREE.Vector3(x, 0, -8),
        new THREE.Vector3(x, 5, -8),
        new THREE.Vector3(x, 5, 8),
        new THREE.Vector3(x, 0, 8),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      this.group.add(new THREE.Line(geo, edgeMat));
    });
  }

  _buildRing() {
    // Elevated ring edge
    const ringGeo = new THREE.BoxGeometry(20.5, 0.15, 12.5);
    const ringMat = new THREE.MeshStandardMaterial({
      color: "#2a2a4e",
      roughness: 0.6,
      metalness: 0.4,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -0.075;
    ring.receiveShadow = true;
    this.group.add(ring);

    // Glowing ring border
    const borderMat = new THREE.MeshStandardMaterial({
      color: "#ff4444",
      emissive: "#ff2222",
      emissiveIntensity: 0.8,
    });

    // Front edge
    const edgeGeo = new THREE.BoxGeometry(20.5, 0.08, 0.08);
    const frontEdge = new THREE.Mesh(edgeGeo, borderMat);
    frontEdge.position.set(0, 0.005, 6.25);
    this.group.add(frontEdge);

    const backEdge = new THREE.Mesh(edgeGeo, borderMat);
    backEdge.position.set(0, 0.005, -6.25);
    this.group.add(backEdge);

    const sideGeo = new THREE.BoxGeometry(0.08, 0.08, 12.5);
    const leftEdge = new THREE.Mesh(sideGeo, borderMat);
    leftEdge.position.set(-10.25, 0.005, 0);
    this.group.add(leftEdge);

    const rightEdge = new THREE.Mesh(sideGeo, borderMat);
    rightEdge.position.set(10.25, 0.005, 0);
    this.group.add(rightEdge);
  }

  _buildBackground() {
    // Distant pillars for atmosphere
    const pillarGeo = new THREE.CylinderGeometry(0.3, 0.4, 8, 8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: "#222244",
      roughness: 0.7,
      metalness: 0.3,
    });

    [
      [-8, -7],
      [8, -7],
      [-12, -9],
      [12, -9],
    ].forEach(([x, z]) => {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(x, 4, z);
      p.castShadow = true;
      this.group.add(p);

      // Pillar top light
      const light = new THREE.PointLight(0x4444aa, 0.3, 5);
      light.position.set(x, 8.5, z);
      this.group.add(light);
    });

    // Skybox-like background (dark gradient sphere)
    const skyGeo = new THREE.SphereGeometry(50, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
      color: "#0a0a1a",
      side: THREE.BackSide,
    });
    this.group.add(new THREE.Mesh(skyGeo, skyMat));
  }

  _buildLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x334466, 0.6);
    this.scene.add(ambient);

    // Main directional (sun-like)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -12;
    dirLight.shadow.camera.right = 12;
    dirLight.shadow.camera.top = 8;
    dirLight.shadow.camera.bottom = -8;
    this.scene.add(dirLight);

    // Rim lights for dramatic effect
    const rimLeft = new THREE.PointLight(0xff4444, 0.4, 15);
    rimLeft.position.set(-8, 5, 5);
    this.scene.add(rimLeft);

    const rimRight = new THREE.PointLight(0x4444ff, 0.4, 15);
    rimRight.position.set(8, 5, 5);
    this.scene.add(rimRight);

    // Spot light from above (arena spotlight)
    const spot = new THREE.SpotLight(0xffffff, 0.5, 20, Math.PI / 4, 0.5);
    spot.position.set(0, 12, 2);
    spot.target.position.set(0, 0, 0);
    spot.castShadow = true;
    this.scene.add(spot);
    this.scene.add(spot.target);
  }

  _buildFloorGlow() {
    // Center circle glow
    const glowGeo = new THREE.CircleGeometry(2.5, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: "#ff4444",
      transparent: true,
      opacity: 0.06,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.01;
    this.group.add(glow);
    this._centerGlow = glow;
  }

  update(time) {
    // Pulse center glow
    if (this._centerGlow) {
      this._centerGlow.material.opacity = 0.04 + Math.sin(time * 2) * 0.02;
    }
  }

  dispose() {
    this.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    this.scene.remove(this.group);
  }
}
