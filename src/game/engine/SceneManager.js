import * as THREE from "three";
import Arena3D from "./Arena3D";
import Fighter3D from "./Fighter3D";

export default class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.fighters = {};
    this.particles = [];
    this.cameraShake = { intensity: 0, decay: 0.92 };
    this.slowmo = 1;
    this.time = 0;

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this.arena = new Arena3D(this.scene);
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setClearColor(0x0a0a1a);
    this._resize();
    this._resizeHandler = () => this._resize();
    window.addEventListener("resize", this._resizeHandler);
  }

  _resize() {
    const w = this.canvas.parentElement?.clientWidth || window.innerWidth;
    const h = this.canvas.parentElement?.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.02);
  }

  _initCamera() {
    const w = this.canvas.parentElement?.clientWidth || window.innerWidth;
    const h = this.canvas.parentElement?.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    this.camera.position.set(0, 4, 10);
    this.camera.lookAt(0, 1.2, 0);
    this.cameraTarget = new THREE.Vector3(0, 1.2, 0);
    this.cameraOffset = new THREE.Vector3(0, 4, 10);
  }

  addFighter(id, characterId, facing) {
    const fighter = new Fighter3D(characterId, facing);
    this.fighters[id] = fighter;
    this.scene.add(fighter.group);
    return fighter;
  }

  removeFighter(id) {
    const f = this.fighters[id];
    if (f) {
      f.dispose();
      this.scene.remove(f.group);
      delete this.fighters[id];
    }
  }

  updateCamera(player1, player2) {
    if (!player1 || !player2) return;

    // Midpoint between fighters (including Z)
    const midX = (player1.x + player2.x) / 2;
    const midY = Math.max(player1.y, player2.y) / 2 + 1.2;
    const midZ = ((player1.z || 0) + (player2.z || 0)) / 2;

    // 3D distance-based zoom
    const dx = player1.x - player2.x;
    const dz = (player1.z || 0) - (player2.z || 0);
    const dist = Math.sqrt(dx * dx + dz * dz);
    const zoomBack = Math.max(7, Math.min(13, dist * 1.2 + 4));
    const zoomY = Math.max(3, Math.min(5.5, dist * 0.3 + 2.5));

    // Smooth camera tracking — look at midpoint, offset behind Z
    this.cameraTarget.lerp(new THREE.Vector3(midX, midY, midZ), 0.05);
    this.cameraOffset.lerp(new THREE.Vector3(midX, zoomY, midZ + zoomBack), 0.05);

    // Apply camera shake
    let shakeX = 0, shakeY = 0;
    if (this.cameraShake.intensity > 0.01) {
      shakeX = (Math.random() - 0.5) * this.cameraShake.intensity;
      shakeY = (Math.random() - 0.5) * this.cameraShake.intensity;
      this.cameraShake.intensity *= this.cameraShake.decay;
    }

    this.camera.position.set(
      this.cameraOffset.x + shakeX,
      this.cameraOffset.y + shakeY,
      this.cameraOffset.z
    );
    this.camera.lookAt(this.cameraTarget);
  }

  shake(intensity) {
    this.cameraShake.intensity = Math.max(this.cameraShake.intensity, intensity);
  }

  setSlowmo(factor) {
    this.slowmo = factor;
  }

  // Particle effects
  spawnHitParticles(x, y, z, color, count = 12) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });

    for (let i = 0; i < count; i++) {
      const size = 0.03 + Math.random() * 0.06;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.position.set(x, y, z);

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.05 + Math.random() * 0.1;
      const vy = 0.03 + Math.random() * 0.08;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy,
        vz: Math.sin(angle) * speed * 0.5,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
      });
    }
  }

  spawnSpecialEffect(x, y, z, color) {
    // Ring burst
    const ringGeo = new THREE.RingGeometry(0.1, 0.15, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(x, y, z);
    ring.lookAt(this.camera.position);
    this.scene.add(ring);

    this.particles.push({
      mesh: ring,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 1,
      decay: 0.03,
      scaleSpeed: 0.15,
    });

    this.spawnHitParticles(x, y, z, color, 20);
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.x += (p.vx || 0) * dt * 60;
      p.mesh.position.y += (p.vy || 0) * dt * 60;
      p.mesh.position.z += (p.vz || 0) * dt * 60;
      if (p.vy !== undefined) p.vy -= 0.002 * dt * 60;
      p.life -= p.decay * dt * 60;

      if (p.scaleSpeed) {
        const s = p.mesh.scale.x + p.scaleSpeed * dt * 60;
        p.mesh.scale.set(s, s, s);
      }

      if (p.mesh.material) {
        p.mesh.material.opacity = Math.max(0, p.life);
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  render(dt) {
    this.time += dt;
    this.arena.update(this.time);

    // Update fighter animations
    for (const f of Object.values(this.fighters)) {
      f.update(dt * this.slowmo);
    }

    this.updateParticles(dt * this.slowmo);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener("resize", this._resizeHandler);
    for (const id of Object.keys(this.fighters)) {
      this.removeFighter(id);
    }
    this.arena.dispose();
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      if (p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mesh.material) p.mesh.material.dispose();
    }
    this.particles = [];
    this.renderer.dispose();
  }
}
