import { KEYS } from "../constants";

class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this.prevKeys = {};
    this.bound = false;
  }

  bind() {
    if (this.bound) return;
    this.bound = true;
    this._onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = true;
      e.preventDefault();
    };
    this._onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = false;
      e.preventDefault();
    };
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }

  unbind() {
    if (!this.bound) return;
    this.bound = false;
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    this.keys = {};
    this.justPressed = {};
    this.prevKeys = {};
  }

  update() {
    // Compute just-pressed (rising edge)
    for (const key of Object.keys(this.keys)) {
      this.justPressed[key] = this.keys[key] && !this.prevKeys[key];
    }
    this.prevKeys = { ...this.keys };
  }

  isDown(action) {
    const bindings = KEYS[action];
    if (!bindings) return false;
    return bindings.some((k) => this.keys[k]);
  }

  isJustPressed(action) {
    const bindings = KEYS[action];
    if (!bindings) return false;
    return bindings.some((k) => this.justPressed[k]);
  }

  getMovement() {
    let dx = 0;
    if (this.isDown("MOVE_LEFT")) dx -= 1;
    if (this.isDown("MOVE_RIGHT")) dx += 1;
    return dx;
  }

  getAttack() {
    if (this.isJustPressed("SPECIAL")) return "special";
    if (this.isJustPressed("PUNCH_HEAVY")) return "punch_heavy";
    if (this.isJustPressed("KICK_HEAVY")) return "kick_heavy";
    if (this.isJustPressed("PUNCH_LIGHT")) return "punch_light";
    if (this.isJustPressed("KICK_LIGHT")) return "kick_light";
    return null;
  }
}

export default InputManager;
