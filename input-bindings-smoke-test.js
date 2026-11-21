"use strict";

/*
 * Contrat des liaisons clavier/manette et de la navigation du refuge (P2.2).
 *
 * Partie A : module pur `input-bindings.js` (défauts, remap, persistance,
 *            edges de manette, zone morte).
 * Partie B : moteur chargé avec un `navigator.getGamepads` simulé ; on vérifie
 *            qu'un pavé ouvre le refuge, déplace le focus, confirme, revient,
 *            et que le clavier remappé et les flèches suffisent sans souris.
 *
 * Ce test ne juge ni le confort de la manette ni le rendu : il prouve la
 * plomberie des entrées et l'accessibilité clavier de l'écran de campagne.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const failures = [];
const successes = [];

function check(name, callback) {
  try {
    callback();
    successes.push(name);
    console.log(`✓ ${name}`);
  } catch (error) {
    failures.push({ name, message: String(error?.message || error) });
    console.log(`✗ ${name}`);
  }
}

async function checkAsync(name, callback) {
  try {
    await callback();
    successes.push(name);
    console.log(`✓ ${name}`);
  } catch (error) {
    failures.push({ name, message: String(error?.message || error) });
    console.log(`✗ ${name}`);
  }
}

/* ------------------------------------------------------------------ *
 * A. Module pur
 * ------------------------------------------------------------------ */
global.window = global;
require("./input-bindings.js");
const Input = global.KageInput;

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

check("les dix actions ont une touche et un bouton par défaut", () => {
  assert.equal(Input.actions.length, 10);
  const defaults = Input.normalize(null);
  const keys = new Set();
  const buttons = new Set();
  for (const action of Input.actions) {
    assert.ok(defaults.keyboard[action], `${action} sans touche`);
    assert.ok(Number.isInteger(defaults.gamepad[action]), `${action} sans bouton`);
    assert.ok(!keys.has(defaults.keyboard[action]), `touche dupliquée sur ${action}`);
    assert.ok(!buttons.has(defaults.gamepad[action]), `bouton dupliqué sur ${action}`);
    keys.add(defaults.keyboard[action]);
    buttons.add(defaults.gamepad[action]);
    const described = Input.describeAction(action);
    assert.ok(described?.label, `${action} sans libellé`);
  }
  assert.equal(Input.actionForKey(defaults, "j"), "attack");
  assert.equal(Input.actionForKey(defaults, "J"), "attack", "la casse ne doit pas compter");
  assert.equal(Input.actionForKey(defaults, "z"), null);
});

check("une sauvegarde corrompue ou conflictuelle est normalisée", () => {
  const repaired = Input.normalize({
    keyboard: { attack: "abc", heavy: "J", pause: 42 },
    gamepad: { attack: 2, heavy: 2, dodge: 99 },
  });
  assert.equal(repaired.keyboard.attack, "abc");
  assert.equal(repaired.keyboard.heavy, "j");
  assert.equal(repaired.keyboard.pause, "p", "valeur invalide → défaut");
  assert.equal(repaired.gamepad.heavy, 3, "bouton dupliqué → défaut");
  assert.equal(repaired.gamepad.dodge, 0, "bouton hors bornes → défaut");
  const keys = Input.actions.map((action) => repaired.keyboard[action]);
  assert.equal(new Set(keys).size, keys.length, "aucune touche ne doit être partagée");
});

check("le remap se persiste et se réinitialise", () => {
  const storage = new MemoryStorage();
  const saved = Input.save(
    { keyboard: { pause: "x", campaign: "y" }, gamepad: { attack: 7 } },
    storage,
  );
  assert.equal(saved.keyboard.pause, "x");
  assert.equal(saved.gamepad.attack, 7);
  const loaded = Input.load(storage);
  assert.equal(loaded.keyboard.pause, "x");
  assert.equal(loaded.gamepad.attack, 7);
  assert.equal(Input.actionForKey(loaded, "x"), "pause");
  assert.equal(Input.actionForKey(loaded, "y"), "campaign");
  const reset = Input.reset(storage);
  assert.equal(reset.keyboard.pause, "p");
  assert.equal(Input.load(storage).keyboard.campaign, "c");
  assert.equal(Input.setKeyboard(loaded, "pause", "  ").keyboard.pause, "x", "touche vide refusée");
  assert.equal(Input.setGamepad(loaded, "pause", 99).gamepad.pause, 9, "bouton hors bornes refusé");
});

check("la manette produit des fronts, une zone morte et une croix", () => {
  const state = Input.createPadState();
  const pad = {
    connected: true,
    buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })),
    axes: [0, 0, 0, 0],
  };
  const press = (index, down) => {
    pad.buttons[index] = { pressed: down, value: down ? 1 : 0 };
  };
  const bindings = Input.normalize(null);

  press(2, true);
  const first = Input.pollPad(state, pad, bindings);
  assert.deepEqual(first.pressed, ["attack"], "le front d'attaque doit être détecté");
  assert.ok(first.held.includes("attack"));

  const second = Input.pollPad(state, pad, bindings);
  assert.equal(second.pressed.length, 0, "un bouton maintenu ne doit pas se répéter");

  press(2, false);
  const released = Input.pollPad(state, pad, bindings);
  assert.deepEqual(released.released, ["attack"]);

  press(4, true);
  const guard = Input.pollPad(state, pad, bindings);
  assert.ok(guard.pressed.includes("guard"));
  assert.ok(guard.held.includes("guard"));
  press(4, false);
  Input.pollPad(state, pad, bindings);

  pad.axes = [0.1, -0.1, 0, 0];
  assert.equal(Input.pollPad(state, pad, bindings).axes.x, 0, "zone morte ignorée");
  pad.axes = [0.6, 0, 0, 0];
  const tilted = Input.pollPad(state, pad, bindings);
  assert.ok(tilted.axes.x > 0.4 && tilted.axes.x < 0.6, "axe gauche normalisé");
  assert.equal(tilted.axes.y, 0);

  pad.axes = [0, 0, 0, 0];
  press(13, true);
  const down = Input.pollPad(state, pad, bindings);
  assert.equal(down.nav.down, true, "croix bas = front de navigation");
  assert.equal(Input.pollPad(state, pad, bindings).nav.down, false);
  press(13, false);
  Input.pollPad(state, pad, bindings);

  press(0, true);
  const confirm = Input.pollPad(state, pad, bindings);
  assert.equal(confirm.nav.confirm, true, "A = confirmation");
  press(0, false);
  press(1, true);
  const back = Input.pollPad(state, pad, bindings);
  assert.equal(back.nav.back, true, "B = retour");
});

/* ------------------------------------------------------------------ *
 * B. Moteur headless + manette simulée
 * ------------------------------------------------------------------ */
class ClassList {
  constructor() { this.values = new Set(); }
  add(...values) { values.forEach((value) => this.values.add(value)); }
  remove(...values) { values.forEach((value) => this.values.delete(value)); }
  contains(value) { return this.values.has(value); }
  toggle(value, force) {
    const active = force === undefined ? !this.values.has(value) : Boolean(force);
    if (active) this.values.add(value);
    else this.values.delete(value);
    return active;
  }
}

const windowListeners = new Map();
const campaignButtons = [];

class StubElement {
  constructor(id = "") {
    this.id = id;
    this.classList = new ClassList();
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.hidden = false;
    this.disabled = false;
    this.textContent = "";
    this.innerHTML = "";
    this.value = "";
    this.offsetWidth = 640;
    this.width = 0;
    this.height = 0;
    this.clicks = 0;
    this.listeners = new Map();
  }
  addEventListener(type, callback) {
    const list = this.listeners.get(type) || [];
    list.push(callback);
    this.listeners.set(type, list);
  }
  removeEventListener() {}
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  focus() { document.activeElement = this; }
  click() {
    this.clicks += 1;
    for (const callback of this.listeners.get("click") || []) {
      callback({ target: this, currentTarget: this, preventDefault() {} });
    }
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) {
    if (this.id === "campaign-screen" && /button/.test(selector)) {
      return campaignButtons.filter((button) => !button.disabled);
    }
    return [];
  }
}

const canvas = new StubElement("game-canvas");
const gradient = { addColorStop() {} };
const drawing = new Proxy(
  { createLinearGradient: () => gradient },
  {
    get(target, property) {
      if (property in target) return target[property];
      return () => {};
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  },
);
canvas.getContext = () => drawing;
canvas.requestPointerLock = () => {};

const elements = new Map();
elements.set("game-canvas", canvas);
["campaign-rest", "campaign-upgrade", "campaign-close"].forEach((id) => {
  campaignButtons.push(new StubElement(id));
});

const document = {
  body: new StubElement("body"),
  pointerLockElement: null,
  activeElement: null,
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, new StubElement(id));
    return elements.get(id);
  },
  querySelector(selector) {
    return typeof selector === "string" && selector.startsWith("#")
      ? this.getElementById(selector.slice(1))
      : null;
  },
  querySelectorAll() { return []; },
  addEventListener() {},
  exitPointerLock() {},
};
global.document = document;
global.addEventListener = (type, callback) => {
  const list = windowListeners.get(type) || [];
  list.push(callback);
  windowListeners.set(type, list);
};
global.dispatchEvent = (event) => {
  for (const callback of windowListeners.get(event.type) || []) callback(event);
  return true;
};

class TestCustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
}
global.CustomEvent = TestCustomEvent;
global.matchMedia = () => ({ matches: false });
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};
const payloads = new Map();
global.localStorage = {
  getItem: (key) => (payloads.has(key) ? payloads.get(key) : null),
  setItem: (key, value) => payloads.set(key, String(value)),
  removeItem: (key) => payloads.delete(key),
};
const modularRegistry = JSON.parse(
  fs.readFileSync(path.join(__dirname, "assets", "modular", "registry.json"), "utf8"),
);
global.fetch = async (url) => {
  if (String(url).startsWith("assets/modular/registry.json")) {
    return { ok: true, status: 200, json: async () => modularRegistry };
  }
  return { ok: false, status: 404, json: async () => ({}) };
};

const pad = {
  connected: true,
  buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })),
  axes: [0, 0, 0, 0],
};
Object.defineProperty(globalThis, "navigator", {
  value: { getGamepads: () => [pad] },
  configurable: true,
  writable: true,
});

require("./level-data.js");
require("./game.js");
require("./campaign-ui.js");

const KageGame = global.KageGame;

function press(index, down = true) {
  pad.buttons[index] = { pressed: down, value: down ? 1 : 0 };
}
function poll() {
  return KageGame.debug.pollGamepad();
}
function dispatchKey(type, key) {
  const event = {
    key,
    type,
    repeat: false,
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; },
  };
  for (const callback of windowListeners.get(type) || []) callback(event);
  return event;
}
function focusedIndex() {
  return campaignButtons.indexOf(document.activeElement);
}

(async () => {
  await KageGame.start();
  await new Promise((resolve) => setImmediate(resolve));

  await checkAsync("la manette ouvre le refuge et place le focus", async () => {
    assert.equal(KageGame.getState().status, "playing");
    press(6, true);
    poll();
    assert.equal(KageGame.getState().status, "campaign", "le bouton refuge doit ouvrir l'écran");
    press(6, false);
    poll();
    assert.equal(focusedIndex(), 0, "le premier bouton doit recevoir le focus");
  });

  await checkAsync("la croix déplace le focus et A confirme sans souris", async () => {
    press(13, true);
    poll();
    press(13, false);
    poll();
    assert.equal(focusedIndex(), 1, "croix bas doit avancer le focus");
    const target = campaignButtons[1];
    const before = target.clicks;
    press(0, true);
    poll();
    press(0, false);
    poll();
    assert.equal(target.clicks, before + 1, "A doit activer le bouton focalisé");
    assert.equal(campaignButtons[0].clicks, 0, "aucun autre bouton ne doit être activé");
  });

  await checkAsync("B referme le refuge et rend le jeu", async () => {
    press(1, true);
    poll();
    press(1, false);
    poll();
    assert.equal(KageGame.getState().status, "playing");
  });

  await checkAsync("le clavier remappé déclenche la pause", async () => {
    const bindings = Input.load();
    Input.save({ ...bindings, keyboard: { ...bindings.keyboard, pause: "x" } });
    assert.equal(Input.load().keyboard.pause, "x");
    dispatchKey("keydown", "x");
    assert.equal(KageGame.getState().status, "paused", "la touche remappée doit mettre en pause");
    dispatchKey("keyup", "x");
    dispatchKey("keydown", "x");
    assert.equal(KageGame.getState().status, "playing", "la même touche doit reprendre");
    dispatchKey("keyup", "x");
    Input.reset();
    assert.equal(Input.load().keyboard.pause, "p");
  });

  await checkAsync("les flèches parcourent le refuge et Échap le referme", async () => {
    assert.equal(KageGame.openCampaign(), true);
    assert.equal(focusedIndex(), 0);
    const screen = document.getElementById("campaign-screen");
    const arrow = (key) => {
      const event = { key, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
      for (const callback of screen.listeners.get("keydown") || []) callback(event);
      return event;
    };
    const down = arrow("ArrowDown");
    assert.equal(down.defaultPrevented, true, "la flèche doit être consommée");
    assert.equal(focusedIndex(), 1, "flèche bas doit avancer le focus");
    arrow("ArrowDown");
    arrow("ArrowDown");
    assert.equal(focusedIndex(), 0, "le focus boucle sur le dernier bouton");
    arrow("ArrowUp");
    assert.equal(focusedIndex(), campaignButtons.length - 1, "flèche haut doit reculer");
    dispatchKey("keydown", "Escape");
    assert.equal(KageGame.getState().status, "playing", "Échap doit refermer le refuge");
  });

  await checkAsync("le pavé ne déclenche pas d'action de combat dans le refuge", async () => {
    KageGame.openCampaign();
    const state = KageGame.getState();
    const kills = state.kills;
    press(2, true);
    poll();
    press(2, false);
    poll();
    assert.equal(KageGame.getState().kills, kills, "X ne doit pas attaquer dans le refuge");
    assert.equal(KageGame.getState().status, "campaign");
    dispatchKey("keydown", "Escape");
  });

  if (failures.length) {
    console.error(
      `\nInput smoke test : ${successes.length} contrat(s) valide(s), ${failures.length} manquant(s).`,
    );
    failures.forEach((failure, index) => {
      console.error(`${index + 1}. ${failure.name}`);
      console.error(`   ${failure.message}`);
    });
    process.exitCode = 1;
  } else {
    console.log(
      "\nInput smoke test OK — 10 actions remappables, manette simulée, refuge navigable au clavier",
    );
  }
})();
