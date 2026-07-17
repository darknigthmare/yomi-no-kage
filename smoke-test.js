"use strict";

/*
 * Test de progression sans navigateur. Il fournit juste assez de DOM/Canvas
 * pour charger le moteur, puis vérifie les deux purifications et la victoire.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const modularRegistry = JSON.parse(
  fs.readFileSync(path.join(__dirname, "assets", "modular", "registry.json"), "utf8"),
);

class ClassList {
  constructor() {
    this.values = new Set();
  }
  add(...values) { values.forEach((value) => this.values.add(value)); }
  remove(...values) { values.forEach((value) => this.values.delete(value)); }
  contains(value) { return this.values.has(value); }
  toggle(value, force) {
    const shouldAdd = force === undefined ? !this.values.has(value) : Boolean(force);
    if (shouldAdd) this.values.add(value);
    else this.values.delete(value);
    return shouldAdd;
  }
}

class StubElement {
  constructor() {
    this.classList = new ClassList();
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.hidden = false;
    this.textContent = "";
    this.offsetWidth = 640;
  }
  addEventListener() {}
  setAttribute(name, value) { this.attributes[name] = String(value); }
  focus() {}
}

const gradient = { addColorStop() {} };
const context = new Proxy(
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

const elements = new Map();
const canvas = new StubElement();
canvas.width = 640;
canvas.height = 360;
canvas.getContext = () => context;
canvas.requestPointerLock = undefined;
elements.set("game-canvas", canvas);

global.window = global;
global.document = {
  body: new StubElement(),
  pointerLockElement: null,
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, new StubElement());
    return elements.get(id);
  },
  querySelectorAll() { return []; },
  addEventListener() {},
  exitPointerLock() {},
};
global.addEventListener = () => {};
global.matchMedia = () => ({ matches: false });
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};
global.fetch = async (url) => {
  if (String(url).startsWith("assets/modular/registry.json")) {
    return { ok: true, status: 200, json: async () => modularRegistry };
  }
  return { ok: false, status: 404, json: async () => ({}) };
};

require("./game.js");

(async () => {
  await global.KageGame.start();
  await new Promise((resolve) => setImmediate(resolve));

  let state = global.KageGame.getState();
  assert.equal(state.status, "playing");
  assert.equal(state.mode, "side");
  assert.equal(state.chapter, 0);
  assert.equal(state.seals, 0);
  assert.equal(global.KageGame.debug.assetStatus().roster.ready, true);
  assert.equal(
    global.KageGame.debug.assetStatus().roster.characters,
    modularRegistry.counts.characters,
  );

  global.KageGame.debug.setMode("fps");
  state = global.KageGame.getState();
  assert.equal(state.mode, "fps");
  assert.equal(state.fpsRemaining, 7);

  global.KageGame.debug.clearFps();
  global.KageGame.debug.warpToAltar();
  global.KageGame.interact();
  state = global.KageGame.getState();
  assert.equal(state.mode, "side");
  assert.equal(state.chapter, 1);
  assert.equal(state.seals, 1);

  // La transition cinématique bloque volontairement V pendant 0,85 s.
  // Le hook de test entre directement dans la seconde zone.
  global.KageGame.debug.setMode("fps");
  global.KageGame.debug.clearFps();
  global.KageGame.debug.warpToAltar();
  global.KageGame.interact();
  state = global.KageGame.getState();
  assert.equal(state.status, "ended");
  assert.equal(state.seals, 2);

  console.log("Smoke test OK — 2D -> FPS -> 2D -> FPS -> victoire");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
