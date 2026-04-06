import * as THREE from "three";
import { CHARACTERS } from "../constants";

// Build a segmented humanoid from basic geometries
export default class Fighter3D {
  constructor(characterId, facing) {
    this.characterId = characterId;
    this.character = CHARACTERS[characterId];
    this.facing = facing;
    this.animState = "idle";
    this.animFrame = 0;
    this.prevAnimState = "idle";
    this.blendFactor = 1;

    this.group = new THREE.Group();
    this._build();
  }

  _mat(color, emissive) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: emissive || color,
      emissiveIntensity: 0.15,
      roughness: 0.5,
      metalness: 0.3,
    });
  }

  _build() {
    const c = this.character.color;
    const ac = this.character.accentColor;
    const skin = "#ffccaa";
    const matBody = this._mat(c);
    const matAccent = this._mat(ac);
    const matSkin = this._mat(skin, "#cc9977");
    const matShoe = this._mat("#222222");
    const matHair = this._mat("#331111");

    // Root pivot at feet level
    this.root = new THREE.Group();
    this.group.add(this.root);

    // Hips
    this.hips = new THREE.Group();
    this.hips.position.y = 0.55;
    this.root.add(this.hips);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.55, 0.3);
    this.torso = new THREE.Mesh(torsoGeo, matBody);
    this.torso.position.y = 0.3;
    this.torso.castShadow = true;
    this.hips.add(this.torso);

    // Chest / Shoulders
    this.chest = new THREE.Group();
    this.chest.position.y = 0.3;
    this.torso.add(this.chest);

    // Head
    const headGeo = new THREE.SphereGeometry(0.16, 12, 10);
    this.head = new THREE.Mesh(headGeo, matSkin);
    this.head.position.y = 0.25;
    this.head.castShadow = true;
    this.chest.add(this.head);

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.17, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6);
    this.hair = new THREE.Mesh(hairGeo, matHair);
    this.hair.position.y = 0.04;
    this.head.add(this.hair);

    // Eyes (simple small spheres)
    const eyeGeo = new THREE.SphereGeometry(0.03, 6, 6);
    const eyeMat = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.5 });
    const pupilGeo = new THREE.SphereGeometry(0.018, 6, 6);
    const pupilMat = new THREE.MeshStandardMaterial({ color: "#111111" });

    [-0.06, 0.06].forEach((xOff) => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(xOff, 0.02, 0.14);
      this.head.add(eye);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(0, 0, 0.025);
      eye.add(pupil);
    });

    // Arms
    this.leftArm = this._buildArm(matBody, matSkin, matAccent, -1);
    this.leftArm.group.position.set(-0.32, 0.22, 0);
    this.chest.add(this.leftArm.group);

    this.rightArm = this._buildArm(matBody, matSkin, matAccent, 1);
    this.rightArm.group.position.set(0.32, 0.22, 0);
    this.chest.add(this.rightArm.group);

    // Belt
    const beltGeo = new THREE.BoxGeometry(0.52, 0.06, 0.32);
    const belt = new THREE.Mesh(beltGeo, matAccent);
    belt.position.y = -0.01;
    this.hips.add(belt);

    // Legs
    this.leftLeg = this._buildLeg(matBody, matSkin, matShoe, -1);
    this.leftLeg.group.position.set(-0.12, -0.02, 0);
    this.hips.add(this.leftLeg.group);

    this.rightLeg = this._buildLeg(matBody, matSkin, matShoe, 1);
    this.rightLeg.group.position.set(0.12, -0.02, 0);
    this.hips.add(this.rightLeg.group);

    // Glow point light on character
    this.glow = new THREE.PointLight(c, 0.6, 3);
    this.glow.position.y = 1.0;
    this.root.add(this.glow);

    // Shadow
    this.shadowMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.35, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 })
    );
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.01;
    this.group.add(this.shadowMesh);
  }

  _buildArm(matBody, matSkin, matAccent, side) {
    const group = new THREE.Group();

    // Upper arm
    const upperGeo = new THREE.BoxGeometry(0.12, 0.22, 0.12);
    const upper = new THREE.Mesh(upperGeo, matBody);
    upper.position.y = -0.11;
    upper.castShadow = true;
    group.add(upper);

    // Lower arm pivot
    const lowerPivot = new THREE.Group();
    lowerPivot.position.y = -0.24;
    group.add(lowerPivot);

    const lowerGeo = new THREE.BoxGeometry(0.1, 0.2, 0.1);
    const lower = new THREE.Mesh(lowerGeo, matSkin);
    lower.position.y = -0.1;
    lower.castShadow = true;
    lowerPivot.add(lower);

    // Fist
    const fistGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const fist = new THREE.Mesh(fistGeo, matAccent);
    fist.position.y = -0.22;
    fist.castShadow = true;
    lowerPivot.add(fist);

    return { group, upper, lowerPivot, lower, fist };
  }

  _buildLeg(matBody, matSkin, matShoe, side) {
    const group = new THREE.Group();

    // Upper leg
    const upperGeo = new THREE.BoxGeometry(0.14, 0.25, 0.14);
    const upper = new THREE.Mesh(upperGeo, matBody);
    upper.position.y = -0.15;
    upper.castShadow = true;
    group.add(upper);

    // Lower leg pivot
    const lowerPivot = new THREE.Group();
    lowerPivot.position.y = -0.28;
    group.add(lowerPivot);

    const lowerGeo = new THREE.BoxGeometry(0.12, 0.24, 0.12);
    const lower = new THREE.Mesh(lowerGeo, matSkin);
    lower.position.y = -0.12;
    lower.castShadow = true;
    lowerPivot.add(lower);

    // Foot
    const footGeo = new THREE.BoxGeometry(0.13, 0.06, 0.2);
    const foot = new THREE.Mesh(footGeo, matShoe);
    foot.position.set(0, -0.26, 0.04);
    foot.castShadow = true;
    lowerPivot.add(foot);

    return { group, upper, lowerPivot, lower, foot };
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
    // Shadow stays on ground
    this.shadowMesh.position.set(0, -y + 0.01, 0);
    const shadowScale = Math.max(0.3, 1 - y * 0.3);
    this.shadowMesh.scale.set(shadowScale, shadowScale, 1);
  }

  setFacing(facing) {
    this.facing = facing;
    this.root.rotation.y = facing === 1 ? 0 : Math.PI;
  }

  setAnimState(state) {
    if (state !== this.animState) {
      this.prevAnimState = this.animState;
      this.animState = state;
      this.blendFactor = 0;
    }
  }

  update(dt) {
    this.animFrame += dt * 60;
    this.blendFactor = Math.min(1, this.blendFactor + dt * 8);
    this._animate();
  }

  _animate() {
    const t = this.animFrame * 0.05;
    const blend = this.blendFactor;

    // Reset to default pose
    this._resetPose();

    switch (this.animState) {
      case "idle":
        this._animIdle(t, blend);
        break;
      case "walk_forward":
      case "walk_backward":
        this._animWalk(t, blend);
        break;
      case "jump":
        this._animJump(t, blend);
        break;
      case "crouch":
        this._animCrouch(blend);
        break;
      case "block":
        this._animBlock(blend);
        break;
      case "punch_light":
        this._animPunchLight(t, blend);
        break;
      case "punch_heavy":
        this._animPunchHeavy(t, blend);
        break;
      case "kick_light":
        this._animKickLight(t, blend);
        break;
      case "kick_heavy":
        this._animKickHeavy(t, blend);
        break;
      case "special":
        this._animSpecial(t, blend);
        break;
      case "uppercut":
        this._animUppercut(t, blend);
        break;
      case "hit":
        this._animHit(t, blend);
        break;
      case "knockout":
        this._animKnockout(t, blend);
        break;
      default:
        this._animIdle(t, blend);
    }
  }

  _resetPose() {
    this.hips.position.y = 0.55;
    this.torso.rotation.set(0, 0, 0);
    this.chest.rotation.set(0, 0, 0);
    this.leftArm.group.rotation.set(0, 0, 0);
    this.leftArm.lowerPivot.rotation.set(0, 0, 0);
    this.rightArm.group.rotation.set(0, 0, 0);
    this.rightArm.lowerPivot.rotation.set(0, 0, 0);
    this.leftLeg.group.rotation.set(0, 0, 0);
    this.leftLeg.lowerPivot.rotation.set(0, 0, 0);
    this.rightLeg.group.rotation.set(0, 0, 0);
    this.rightLeg.lowerPivot.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
  }

  _animIdle(t, b) {
    const bob = Math.sin(t * 2) * 0.02;
    this.hips.position.y = 0.55 + bob * b;
    // Slight fighting stance
    this.leftArm.group.rotation.x = -0.8 * b;
    this.leftArm.lowerPivot.rotation.x = -1.2 * b;
    this.rightArm.group.rotation.x = -0.6 * b;
    this.rightArm.lowerPivot.rotation.x = -1.0 * b;
    // Slight leg bend
    this.leftLeg.group.rotation.x = 0.1 * b;
    this.rightLeg.group.rotation.x = -0.1 * b;
    // Breathing
    this.torso.rotation.x = Math.sin(t * 1.5) * 0.02 * b;
  }

  _animWalk(t, b) {
    const swing = Math.sin(t * 6) * 0.4 * b;
    this.leftLeg.group.rotation.x = swing;
    this.rightLeg.group.rotation.x = -swing;
    this.leftLeg.lowerPivot.rotation.x = Math.max(0, -swing) * 0.5;
    this.rightLeg.lowerPivot.rotation.x = Math.max(0, swing) * 0.5;
    this.leftArm.group.rotation.x = (-0.6 - swing * 0.3) * b;
    this.leftArm.lowerPivot.rotation.x = -1.0 * b;
    this.rightArm.group.rotation.x = (-0.6 + swing * 0.3) * b;
    this.rightArm.lowerPivot.rotation.x = -1.0 * b;
    this.hips.position.y = 0.55 + Math.abs(Math.sin(t * 6)) * 0.02 * b;
    this.torso.rotation.y = Math.sin(t * 6) * 0.05 * b;
  }

  _animJump(t, b) {
    this.leftArm.group.rotation.x = -1.2 * b;
    this.rightArm.group.rotation.x = -1.2 * b;
    this.leftArm.group.rotation.z = -0.4 * b;
    this.rightArm.group.rotation.z = 0.4 * b;
    this.leftLeg.group.rotation.x = -0.3 * b;
    this.rightLeg.group.rotation.x = 0.2 * b;
    this.rightLeg.lowerPivot.rotation.x = -0.5 * b;
  }

  _animCrouch(b) {
    this.hips.position.y = 0.35 * b + 0.55 * (1 - b);
    this.leftLeg.group.rotation.x = 0.4 * b;
    this.leftLeg.lowerPivot.rotation.x = -0.8 * b;
    this.rightLeg.group.rotation.x = 0.4 * b;
    this.rightLeg.lowerPivot.rotation.x = -0.8 * b;
    this.leftArm.group.rotation.x = -0.5 * b;
    this.leftArm.lowerPivot.rotation.x = -0.8 * b;
    this.rightArm.group.rotation.x = -0.5 * b;
    this.rightArm.lowerPivot.rotation.x = -0.8 * b;
  }

  _animBlock(b) {
    this.leftArm.group.rotation.x = -1.4 * b;
    this.leftArm.group.rotation.z = 0.5 * b;
    this.leftArm.lowerPivot.rotation.x = -0.6 * b;
    this.rightArm.group.rotation.x = -1.4 * b;
    this.rightArm.group.rotation.z = -0.5 * b;
    this.rightArm.lowerPivot.rotation.x = -0.6 * b;
    this.torso.rotation.x = 0.15 * b;
    this.hips.position.y = 0.5 * b + 0.55 * (1 - b);
  }

  _animPunchLight(t, b) {
    // Quick right jab
    const progress = Math.min(1, (this.animFrame % 16) / 8);
    const extend = progress < 0.5 ? progress * 2 : 2 - progress * 2;
    this.rightArm.group.rotation.x = (-0.6 - extend * 1.0) * b;
    this.rightArm.lowerPivot.rotation.x = (-1.0 + extend * 0.8) * b;
    this.rightArm.group.rotation.z = extend * -0.2 * b;
    this.torso.rotation.y = extend * -0.15 * b;
    this.leftArm.group.rotation.x = -0.8 * b;
    this.leftArm.lowerPivot.rotation.x = -1.2 * b;
  }

  _animPunchHeavy(t, b) {
    const progress = Math.min(1, (this.animFrame % 30) / 15);
    const windup = progress < 0.3 ? progress / 0.3 : 1;
    const extend = progress < 0.3 ? 0 : Math.min(1, (progress - 0.3) / 0.35);
    const recover = progress < 0.65 ? 0 : (progress - 0.65) / 0.35;

    const armAngle = -0.6 + windup * 0.3 - extend * 1.5 + recover * 0.9;
    this.rightArm.group.rotation.x = armAngle * b;
    this.rightArm.lowerPivot.rotation.x = (-1.0 + extend * 1.0 - recover * 0.2) * b;
    this.torso.rotation.y = (windup * 0.3 - extend * 0.3) * b;
    this.torso.rotation.x = (-windup * 0.1 + extend * 0.15) * b;
    this.leftArm.group.rotation.x = -0.8 * b;
    this.leftArm.lowerPivot.rotation.x = -1.2 * b;
  }

  _animKickLight(t, b) {
    const progress = Math.min(1, (this.animFrame % 20) / 10);
    const extend = progress < 0.5 ? progress * 2 : 2 - progress * 2;
    this.rightLeg.group.rotation.x = -extend * 1.2 * b;
    this.rightLeg.lowerPivot.rotation.x = extend * 0.4 * b;
    this.hips.position.y = 0.55 + extend * 0.05;
    this.torso.rotation.x = extend * 0.1 * b;
    this.leftArm.group.rotation.x = -0.8 * b;
    this.leftArm.lowerPivot.rotation.x = -1.2 * b;
    this.rightArm.group.rotation.x = (-0.6 + extend * 0.3) * b;
  }

  _animKickHeavy(t, b) {
    const progress = Math.min(1, (this.animFrame % 36) / 18);
    const windup = progress < 0.3 ? progress / 0.3 : 1;
    const extend = progress < 0.3 ? 0 : Math.min(1, (progress - 0.3) / 0.35);
    const recover = progress < 0.65 ? 0 : (progress - 0.65) / 0.35;

    this.rightLeg.group.rotation.x = (windup * 0.3 - extend * 1.8 + recover * 1.2) * b;
    this.rightLeg.lowerPivot.rotation.x = (extend * 0.6 - recover * 0.4) * b;
    this.torso.rotation.x = (extend * 0.2 - recover * 0.1) * b;
    this.hips.position.y = 0.55 + extend * 0.08;
    this.leftArm.group.rotation.x = -0.8 * b;
    this.leftArm.lowerPivot.rotation.x = -1.2 * b;
  }

  _animSpecial(t, b) {
    const progress = Math.min(1, (this.animFrame % 48) / 24);
    const charge = progress < 0.3 ? progress / 0.3 : 1;
    const release = progress < 0.3 ? 0 : Math.min(1, (progress - 0.3) / 0.3);
    const recover = progress < 0.6 ? 0 : (progress - 0.6) / 0.4;

    // Both arms thrust forward
    const armX = -0.6 + charge * 0.4 - release * 2.0 + recover * 1.6;
    this.rightArm.group.rotation.x = armX * b;
    this.leftArm.group.rotation.x = (armX + 0.2) * b;
    this.rightArm.lowerPivot.rotation.x = (-1.0 + release * 1.0) * b;
    this.leftArm.lowerPivot.rotation.x = (-1.0 + release * 1.0) * b;
    this.torso.rotation.x = (-charge * 0.2 + release * 0.3) * b;
    this.hips.position.y = 0.55 - charge * 0.1 + release * 0.05;

    // Glow intensity on special
    this.glow.intensity = 0.6 + release * 2.0 - recover * 2.0;
  }

  _animUppercut(t, b) {
    const progress = Math.min(1, (this.animFrame % 33) / 16);
    const crouch = progress < 0.25 ? progress / 0.25 : Math.max(0, 1 - (progress - 0.25) / 0.3);
    const rise = progress < 0.25 ? 0 : Math.min(1, (progress - 0.25) / 0.3);
    const recover = progress < 0.55 ? 0 : (progress - 0.55) / 0.45;

    this.hips.position.y = 0.55 - crouch * 0.15 + rise * 0.2 - recover * 0.05;
    this.rightArm.group.rotation.x = (crouch * 0.3 - rise * 2.2 + recover * 1.6) * b;
    this.rightArm.lowerPivot.rotation.x = (-1.0 + rise * 0.5) * b;
    this.torso.rotation.x = (crouch * 0.2 - rise * 0.3 + recover * 0.1) * b;
    this.leftArm.group.rotation.x = -0.8 * b;
    this.leftArm.lowerPivot.rotation.x = -1.2 * b;
  }

  _animHit(t, b) {
    const progress = Math.min(1, (this.animFrame % 20) / 10);
    const recoil = progress < 0.3 ? progress / 0.3 : Math.max(0, 1 - (progress - 0.3) / 0.7);
    this.torso.rotation.x = -recoil * 0.3 * b;
    this.head.rotation.x = -recoil * 0.2 * b;
    this.hips.position.y = 0.55 - recoil * 0.05;
    this.leftArm.group.rotation.x = (-0.8 + recoil * 0.5) * b;
    this.rightArm.group.rotation.x = (-0.6 + recoil * 0.5) * b;
  }

  _animKnockout(t, b) {
    const progress = Math.min(1, (this.animFrame % 60) / 30);
    const fallAngle = Math.min(Math.PI / 2, progress * Math.PI / 2);
    this.root.rotation.x = -fallAngle * b;
    this.root.position.y = -Math.sin(fallAngle) * 0.4 * b;
    this.leftArm.group.rotation.z = -progress * 0.8 * b;
    this.rightArm.group.rotation.z = progress * 0.8 * b;
  }

  setInvincibleFlash(active) {
    if (active) {
      const flash = Math.sin(this.animFrame * 0.5) > 0;
      this.group.visible = flash;
    } else {
      this.group.visible = true;
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
  }
}
