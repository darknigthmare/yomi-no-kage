"use strict";

/*
 * Test de progression sans navigateur. Il fournit juste assez de DOM/Canvas
 * pour charger le moteur, puis vérifie les portes, le combat, les deux
 * purifications et la victoire.
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

  // L'arche signale l'entrée sans changer de vue et sans former un mur
  // invisible : le joueur reste libre d'explorer derrière.
  global.KageGame.debug.warpToGate();
  state = global.KageGame.getState();
  assert.equal(state.nearEntrance, true);
  global.KageGame.debug.step(0.25);
  state = global.KageGame.getState();
  assert.equal(state.mode, "side");
  assert.equal(state.chapter, 0);

  global.KageGame.debug.setPlayer2d({
    x: state.entrance.x - 30,
    y: 273,
    vx: 800,
    vy: 0,
    grounded: true,
  });
  global.KageGame.debug.step(0.1);
  state = global.KageGame.getState();
  assert.ok(
    state.player2d.x > state.entrance.x + 20,
    "Akio doit franchir le plan du torii en mouvement, sans mur invisible",
  );
  assert.equal(state.mode, "side");

  const villageWorld = global.KageGame.debug.worldSnapshot();
  assert.equal(villageWorld.entrancePassThrough, true);
  assert.equal(villageWorld.groundY, 300);
  assert.equal(villageWorld.fps.floorTile, 2);
  assert.equal(villageWorld.fps.floorProjection, "world-uv-floor-cast");
  assert.notEqual(
    villageWorld.fps.wallTiles.boundary,
    villageWorld.fps.wallTiles.core,
    "L'enceinte et les cloisons FPS doivent suivre des matériaux fixes distincts",
  );
  assert.ok(
    villageWorld.platforms.every((platform) =>
      platform.y < villageWorld.groundY
      && platform.visualHeight >= 24
      && platform.h <= platform.visualHeight),
    "Le rendu et le sommet de collision des plateformes doivent rester cohérents",
  );
  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x;
  assert.ok(
    villageWorld.platforms.every((platform) =>
      villageWorld.frontPropFootprints.every((prop) => !overlaps(platform, prop))),
    "Les plateformes du village ne doivent pas couper les props de premier plan",
  );
  assert.ok(
    villageWorld.enemies.every((enemy) =>
      villageWorld.platforms.every((platform) => !overlaps(enemy, platform))
      && villageWorld.frontPropFootprints.every((prop) => !overlaps(enemy, prop))),
    "Les ennemis du village doivent apparaître sur une zone de sol libre",
  );

  // Une chute rapide doit toucher la plateforme haute avant le sol.
  const firstPlatform = villageWorld.platforms[0];
  global.KageGame.debug.setPlayer2d({
    x: firstPlatform.x + 12,
    y: firstPlatform.y - 42,
    vx: 0,
    vy: 120,
    grounded: false,
  });
  global.KageGame.debug.step(0.25);
  state = global.KageGame.getState();
  assert.equal(
    state.player2d.y + state.player2d.h,
    firstPlatform.y,
    "La collision balayée doit poser Akio sur le même bord que le sprite",
  );

  global.KageGame.debug.warpToGate();
  global.KageGame.interact();
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
  const castleInitialWorld = global.KageGame.debug.worldSnapshot();
  const castleSpawnOverlaps = castleInitialWorld.enemies.flatMap((enemy, enemyIndex) => [
    ...castleInitialWorld.platforms
      .filter((platform) => overlaps(enemy, platform))
      .map((platform) => ({ enemyIndex, enemy, kind: "platform", target: platform })),
    ...castleInitialWorld.frontPropFootprints
      .filter((prop) => overlaps(enemy, prop))
      .map((prop) => ({ enemyIndex, enemy, kind: "prop", target: prop })),
  ]);
  assert.deepEqual(
    castleSpawnOverlaps,
    [],
    "Les gardes du château doivent apparaître sur une zone de sol libre",
  );

  // La seconde porte suit le même flux manuel après la transition.
  for (let i = 0; i < 4; i += 1) global.KageGame.debug.step(0.25);
  global.KageGame.debug.warpToGate();
  global.KageGame.debug.step(0.25);
  state = global.KageGame.getState();
  assert.equal(state.mode, "side");
  assert.equal(state.chapter, 1);
  assert.equal(state.nearEntrance, true);

  global.KageGame.debug.setPlayer2d({
    x: state.entrance.x + 80,
    y: 273,
    vx: 0,
    vy: 0,
    grounded: true,
  });
  global.KageGame.debug.step(0.05);
  state = global.KageGame.getState();
  assert.equal(
    state.player2d.x,
    state.entrance.blockX,
    "La porte matérielle du donjon ne doit pas être traversée fermée",
  );

  global.KageGame.debug.warpToGate();
  global.KageGame.interact();
  state = global.KageGame.getState();
  assert.equal(state.mode, "fps");
  const castleWorld = global.KageGame.debug.worldSnapshot();
  assert.equal(
    castleWorld.entrancePassThrough,
    false,
    "La porte fermée du donjon doit rester solide jusqu'à l'action E",
  );
  assert.equal(castleWorld.fps.floorTile, 3);
  assert.notEqual(
    castleWorld.fps.scheme,
    villageWorld.fps.scheme,
    "Le sanctuaire et le donjon doivent conserver leur propre palette de sol",
  );
  assert.equal(castleWorld.bounds.minX, 960);
  assert.ok(
    castleWorld.platforms.every((platform) =>
      castleWorld.frontPropFootprints.every((prop) => !overlaps(platform, prop))),
    "Les plateformes du château ne doivent pas couper les props de premier plan",
  );
  global.KageGame.debug.clearFps();
  global.KageGame.debug.warpToAltar();
  global.KageGame.interact();
  state = global.KageGame.getState();
  assert.equal(state.status, "ended");
  assert.equal(state.seals, 2);

  // Partie fraîche : le coup ne porte qu'à sa frame active, une seule fois.
  await global.KageGame.start();
  global.KageGame.debug.setPlayer2d({
    x: 56,
    y: 272,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
  });
  global.KageGame.debug.setSideEnemy(0, {
    x: 82,
    y: 276,
    hp: 5,
    maxHp: 5,
    dead: false,
    dying: false,
    attack: 0,
    attackCooldown: 99,
    hurtTimer: 0,
    deathTimer: 0,
    knockbackVx: 0,
    impactMaterial: "armor",
  });

  const hpBeforeAttack = global.KageGame.debug.combatSnapshot().sideEnemies[0].hp;
  global.KageGame.attack();
  assert.equal(global.KageGame.debug.combatSnapshot().sideEnemies[0].hp, hpBeforeAttack);

  global.KageGame.debug.step(0.1);
  assert.equal(
    global.KageGame.debug.combatSnapshot().sideEnemies[0].hp,
    hpBeforeAttack,
    "Le sabre ne doit pas infliger de dégâts avant sa frame active",
  );

  global.KageGame.debug.step(0.04);
  let combat = global.KageGame.debug.combatSnapshot();
  assert.equal(combat.sideEnemies[0].hp, hpBeforeAttack - 2);
  assert.equal(combat.hitConfirmMaterial, "armor");
  assert.ok(combat.particles.includes("spark"), "Un impact d'armure doit produire des étincelles");

  global.KageGame.debug.step(0.2);
  combat = global.KageGame.debug.combatSnapshot();
  assert.equal(
    combat.sideEnemies[0].hp,
    hpBeforeAttack - 2,
    "Une attaque ne doit appliquer ses dégâts qu'une seule fois",
  );

  // En FPS, trois poursuivants collinéaires doivent prendre des angles
  // d'engagement distincts et conserver une collision cohérente.
  await global.KageGame.start();
  global.KageGame.debug.setMode("fps");
  global.KageGame.debug.clearFps();
  global.KageGame.debug.setFpsPlayer({ x: 12, y: 12, angle: 0 });
  const formationSetup = [
    { x: 12.45, y: 12.45, engagementAngle: 0 },
    { x: 12.9, y: 12.9, engagementAngle: Math.PI / 2 },
    { x: 13.35, y: 13.35, engagementAngle: Math.PI },
  ];
  formationSetup.forEach((patch, index) => {
    global.KageGame.debug.setFpsEnemy(index, {
      ...patch,
      engagementSlot: index,
      hp: 4,
      maxHp: 4,
      dead: false,
      dying: false,
      attack: 0,
      attackCooldown: 99,
      attackHitApplied: false,
      hurtTimer: 0,
      deathTimer: 0,
      knockbackX: 0,
      knockbackY: 0,
    });
  });
  for (let i = 0; i < 50; i += 1) global.KageGame.debug.step(0.05);
  combat = global.KageGame.debug.combatSnapshot();
  const formationEnemies = combat.fpsEnemies.slice(0, 3);
  const bearings = formationEnemies.map((enemy) => Math.atan2(enemy.y - 12, enemy.x - 12));
  assert.ok(
    Math.max(...bearings) - Math.min(...bearings) > 0.8,
    "Les ennemis FPS doivent se répartir autour du joueur au lieu de s'empiler",
  );
  for (let i = 0; i < formationEnemies.length; i += 1) {
    for (let j = i + 1; j < formationEnemies.length; j += 1) {
      const a = formationEnemies[i];
      const b = formationEnemies[j];
      assert.ok(
        Math.hypot(a.x - b.x, a.y - b.y) >= a.radius + b.radius - 0.02,
        "Les collisions FPS doivent garder les billboards séparés",
      );
    }
  }

  console.log("Smoke test OK — arches traversables, sols cohérents, impacts, formation FPS et progression complète");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
