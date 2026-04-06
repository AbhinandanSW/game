import {
  ATTACKS,
  COMBOS,
  COMBO_WINDOW,
  MAX_HP,
  MAX_STAMINA,
  STAMINA_REGEN,
  MOVE_SPEED,
  JUMP_FORCE,
  GRAVITY,
  GROUND_Y,
  ARENA_BOUNDARY,
  KNOCKBACK_FRICTION,
  BLOCK_DAMAGE_MULT,
  BLOCK_STAMINA_COST,
  CHARACTERS,
} from "../constants";

export default class CombatSystem {
  constructor(store) {
    this.store = store;
    this.comboHistory = {};
    this.hitThisAttack = {};
  }

  processInput(playerId, input, frameCount) {
    const state = this.store.getState();
    const player = state.players[playerId];
    if (!player || player.dead) return;
    if (player.hitstun > 0) return;

    const char = CHARACTERS[player.characterId];
    const speedMult = char?.speedMultiplier || 1;

    // Block
    if (input.block && !player.attackState && player.grounded) {
      this.store.getState().updatePlayer(playerId, { blocking: true });
    } else if (player.blocking && !input.block) {
      this.store.getState().updatePlayer(playerId, { blocking: false });
    }

    if (player.blocking) return;

    // Crouch
    if (input.crouch && player.grounded && !player.attackState) {
      this.store.getState().updatePlayer(playerId, { crouching: true });
      return;
    } else if (player.crouching && !input.crouch) {
      this.store.getState().updatePlayer(playerId, { crouching: false });
    }

    // Attack
    if (input.attack && !player.attackState) {
      const attackKey = input.attack;
      const attack = ATTACKS[attackKey];
      if (attack && player.stamina >= attack.staminaCost) {
        this.startAttack(playerId, attackKey, frameCount);
        return;
      }
    }

    if (player.attackState) return;

    // Movement
    if (input.moveX !== 0) {
      const vx = input.moveX * MOVE_SPEED * speedMult;
      const facing = input.moveX > 0 ? 1 : -1;
      this.store.getState().updatePlayer(playerId, { vx, facing });
    } else {
      this.store.getState().updatePlayer(playerId, { vx: 0 });
    }

    // Jump
    if (input.jump && player.grounded) {
      this.store.getState().updatePlayer(playerId, {
        vy: JUMP_FORCE,
        grounded: false,
      });
    }

    // Dash
    if (input.dash && player.dashCooldown <= 0 && player.stamina >= 15) {
      const dashVx = player.facing * 0.25 * speedMult;
      this.store.getState().updatePlayer(playerId, {
        vx: dashVx,
        dashCooldown: 30,
        invincible: 8,
        stamina: player.stamina - 15,
      });
    }
  }

  startAttack(playerId, attackKey, frameCount) {
    const attack = ATTACKS[attackKey];
    const state = this.store.getState();
    const player = state.players[playerId];
    const char = CHARACTERS[player.characterId];
    const speedMult = char?.speedMultiplier || 1;
    const timeScale = 1 / speedMult;

    this.store.getState().updatePlayer(playerId, {
      attackState: {
        attack: attackKey,
        frame: 0,
        phase: "startup",
        startup: Math.round(attack.startup * timeScale),
        active: Math.round(attack.active * timeScale),
        recovery: Math.round(attack.recovery * timeScale),
        hitConnected: false,
      },
      stamina: player.stamina - attack.staminaCost,
      vx: player.facing * 0.02,
    });

    this.hitThisAttack[playerId] = false;

    if (!this.comboHistory[playerId]) this.comboHistory[playerId] = [];
    this.comboHistory[playerId].push({ attack: attackKey, time: frameCount });
    this.comboHistory[playerId] = this.comboHistory[playerId].filter(
      (e) => frameCount - e.time < COMBO_WINDOW * 5
    );
  }

  updateAttackState(playerId) {
    const state = this.store.getState();
    const player = state.players[playerId];
    if (!player || !player.attackState) return;

    const as = { ...player.attackState };
    as.frame++;

    if (as.phase === "startup" && as.frame >= as.startup) {
      as.phase = "active";
      as.frame = 0;
    } else if (as.phase === "active" && as.frame >= as.active) {
      as.phase = "recovery";
      as.frame = 0;
    } else if (as.phase === "recovery" && as.frame >= as.recovery) {
      this.store.getState().updatePlayer(playerId, { attackState: null });
      return;
    }

    this.store.getState().updatePlayer(playerId, { attackState: as });
  }

  checkHit(attackerId, defenderId) {
    const state = this.store.getState();
    const attacker = state.players[attackerId];
    const defender = state.players[defenderId];

    if (!attacker || !defender) return null;
    if (!attacker.attackState || attacker.attackState.phase !== "active") return null;
    if (this.hitThisAttack[attackerId]) return null;
    if (defender.dead) return null;
    if (defender.invincible > 0) return null;

    const attack = ATTACKS[attacker.attackState.attack];
    if (!attack) return null;

    const char = CHARACTERS[attacker.characterId];
    const reachMult = char?.reachMultiplier || 1;

    // Hitbox
    const hbX = attacker.x + attack.hitboxOffset.x * attacker.facing * reachMult;
    const hbY = attacker.y + attack.hitboxOffset.y;
    const hbSize = attack.hitboxSize;

    // Defender hurtbox
    const dX = defender.x;
    const dY = defender.y + 0.8;
    const dW = 0.4;
    const dH = 0.8;

    // 2D AABB collision
    const hit =
      Math.abs(hbX - dX) < (hbSize.x + dW) / 2 &&
      Math.abs(hbY - dY) < (hbSize.y + dH) / 2;

    if (!hit) return null;

    this.hitThisAttack[attackerId] = true;

    const damageMult = char?.damageMultiplier || 1;
    const defChar = CHARACTERS[defender.characterId];
    const defMult = defChar?.defenseMultiplier || 1;

    let damage = attack.damage * damageMult;
    let knockback = attack.knockback;
    let knockUp = attack.knockUp || 0;
    let hitstun = attack.hitstun;

    const comboResult = this.checkCombo(attackerId);
    if (comboResult) {
      damage += comboResult.bonusDamage;
      knockback += comboResult.bonusKnockback || 0;
      knockUp += comboResult.bonusKnockUp || 0;
    }

    if (defender.blocking && defender.grounded) {
      damage *= BLOCK_DAMAGE_MULT;
      knockback *= 0.3;
      knockUp = 0;
      hitstun = Math.floor(hitstun * 0.4);
      const newStamina = Math.max(0, defender.stamina - BLOCK_STAMINA_COST);
      if (newStamina <= 0) {
        hitstun = Math.floor(hitstun * 3);
        damage *= 2;
      }
    }

    damage = Math.round(damage / defMult);
    const newHp = Math.max(0, defender.hp - damage);
    const kbDir = attacker.facing;

    if (!defender.grounded) {
      hitstun = Math.floor(hitstun * 1.3);
      knockUp = Math.max(knockUp, 0.08);
    }

    this.store.getState().updatePlayer(defenderId, {
      hp: newHp,
      hitstun,
      vx: kbDir * knockback,
      vy: knockUp,
      grounded: knockUp > 0 ? false : defender.grounded,
      blocking: false,
      dead: newHp <= 0,
    });

    const prevCombo = state.comboDisplay;
    const newCount = (prevCombo.timer > 0 ? prevCombo.count : 0) + 1;
    this.store.getState().setComboDisplay({
      count: newCount,
      timer: 90,
      text: comboResult ? comboResult.name : newCount > 1 ? `${newCount} HIT COMBO` : "",
    });

    return {
      damage,
      hitX: (attacker.x + defender.x) / 2,
      hitY: hbY,
      blocked: defender.blocking,
      comboName: comboResult?.name,
      isKO: newHp <= 0,
      attackKey: attacker.attackState.attack,
    };
  }

  checkCombo(playerId) {
    const history = this.comboHistory[playerId];
    if (!history || history.length < 2) return null;

    for (const combo of COMBOS) {
      const seq = combo.sequence;
      if (history.length < seq.length) continue;

      const recent = history.slice(-seq.length);
      let match = true;
      for (let i = 0; i < seq.length; i++) {
        if (recent[i].attack !== seq[i]) { match = false; break; }
      }

      if (match) {
        const firstTime = recent[0].time;
        const lastTime = recent[recent.length - 1].time;
        if (lastTime - firstTime < COMBO_WINDOW * seq.length) {
          this.comboHistory[playerId] = [];
          return combo;
        }
      }
    }
    return null;
  }

  updatePhysics(playerId) {
    const state = this.store.getState();
    const player = state.players[playerId];
    if (!player || player.dead) return;

    let { x, y, vx, vy, grounded, hitstun, dashCooldown, invincible, stamina } = player;

    if (!grounded) vy -= GRAVITY;

    x += vx;
    y += vy;

    if (y <= GROUND_Y) { y = GROUND_Y; vy = 0; grounded = true; }
    if (x < -ARENA_BOUNDARY) { x = -ARENA_BOUNDARY; vx = 0; }
    if (x > ARENA_BOUNDARY) { x = ARENA_BOUNDARY; vx = 0; }

    if (hitstun > 0) {
      vx *= KNOCKBACK_FRICTION;
    } else if (Math.abs(vx) < 0.001 && !player.attackState) {
      vx = 0;
    }

    if (hitstun > 0) hitstun--;
    if (dashCooldown > 0) dashCooldown--;
    if (invincible > 0) invincible--;

    if (!player.attackState && !player.blocking) {
      stamina = Math.min(MAX_STAMINA, stamina + STAMINA_REGEN);
    }

    this.store.getState().updatePlayer(playerId, {
      x, y, vx, vy, grounded, hitstun, dashCooldown, invincible, stamina,
    });
  }

  getAnimState(playerId) {
    const state = this.store.getState();
    const player = state.players[playerId];
    if (!player) return "idle";

    if (player.dead) return "knockout";
    if (player.hitstun > 0 && !player.attackState) return "hit";
    if (player.attackState) return player.attackState.attack;
    if (player.blocking) return "block";
    if (player.crouching) return "crouch";
    if (!player.grounded) return "jump";
    if (Math.abs(player.vx) > 0.01) {
      return player.vx * player.facing > 0 ? "walk_forward" : "walk_backward";
    }
    return "idle";
  }

  autoFace(playerId, opponentId) {
    const state = this.store.getState();
    const player = state.players[playerId];
    const opponent = state.players[opponentId];
    if (!player || !opponent || player.attackState || player.hitstun > 0) return;

    const facing = opponent.x > player.x ? 1 : -1;
    if (facing !== player.facing) {
      this.store.getState().updatePlayer(playerId, { facing });
    }
  }
}
