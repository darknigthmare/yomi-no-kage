"use strict";

/*
 * Contrat de cohérence gameplay.
 *
 * Ce test agrège volontairement toutes les erreurs au lieu de s'arrêter à la
 * première. Il combine des assertions statiques sur le moteur et des scénarios
 * exécutés dans un contexte VM avec un DOM/Canvas minimal.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { performance } = require("node:perf_hooks");

const ROOT = __dirname;
const GAME_PATH = path.join(ROOT, "game.js");
const LEVEL_PATH = path.join(ROOT, "level-data.js");
const WALL_ROOT = path.join(
  ROOT,
  "assets",
  "modular",
  "environments",
  "kurokawa",
  "alley-walls",
  "sprites",
);
const WALL_MANIFEST_PATH = path.join(WALL_ROOT, "manifest.json");
const gameSource = fs.readFileSync(GAME_PATH, "utf8");
const levelSource = fs.readFileSync(LEVEL_PATH, "utf8");
const modularRegistry = JSON.parse(
  fs.readFileSync(path.join(ROOT, "assets", "modular", "registry.json"), "utf8"),
);
const { KageLevels } = require("./level-data.js");

const failures = [];
const successes = [];

async function check(name, callback) {
  try {
    await callback();
    successes.push(name);
    console.log(`✓ ${name}`);
  } catch (error) {
    failures.push({
      name,
      message: String(error?.message || error),
    });
    console.log(`✗ ${name}`);
  }
}

function functionSource(name) {
  const marker = `function ${name}(`;
  const start = gameSource.indexOf(marker);
  assert.ok(start >= 0, `Fonction absente : ${name}()`);
  const next = gameSource.indexOf("\n  function ", start + marker.length);
  return gameSource.slice(start, next >= 0 ? next : gameSource.length);
}

class ClassList {
  constructor() {
    this.values = new Set();
  }
  add(...values) { values.forEach((value) => this.values.add(value)); }
  remove(...values) { values.forEach((value) => this.values.delete(value)); }
  contains(value) { return this.values.has(value); }
  toggle(value, force) {
    const add = force === undefined ? !this.values.has(value) : Boolean(force);
    if (add) this.values.add(value);
    else this.values.delete(value);
    return add;
  }
}

class StubElement {
  constructor(id = "") {
    this.id = id;
    this.classList = new ClassList();
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.children = [];
    this.hidden = false;
    this.disabled = false;
    this.textContent = "";
    this.innerHTML = "";
    this.offsetWidth = 640;
    this.width = 0;
    this.height = 0;
  }
  addEventListener() {}
  removeEventListener() {}
  setAttribute(name, value) { this.attributes[name] = String(value); }
  querySelector(selector) { return new StubElement(selector); }
  querySelectorAll() { return []; }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(node) { this.children.push(node); return node; }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  closest() { return null; }
  focus() {}
  setPointerCapture() {}
  releasePointerCapture() {}
  getBoundingClientRect() {
    return { x: 0, y: 0, left: 0, top: 0, width: this.offsetWidth, height: 360 };
  }
}

function createCanvasContext() {
  const gradient = { addColorStop() {} };
  return new Proxy(
    {
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
      measureText: (text) => ({ width: String(text || "").length * 6 }),
    },
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
}

async function bootRuntime() {
  const elements = new Map();
  const canvas = new StubElement("game-canvas");
  canvas.width = 1280;
  canvas.height = 720;
  canvas.getContext = () => createCanvasContext();
  canvas.requestPointerLock = undefined;
  elements.set("game-canvas", canvas);

  const storage = new Map();
  const sandbox = {
    console,
    performance,
    setTimeout,
    clearTimeout,
    setImmediate,
    clearImmediate,
    HTMLElement: StubElement,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
    localStorage: {
      getItem(key) { return storage.has(String(key)) ? storage.get(String(key)) : null; },
      setItem(key, value) { storage.set(String(key), String(value)); },
      removeItem(key) { storage.delete(String(key)); },
      clear() { storage.clear(); },
    },
    document: {
      body: new StubElement("body"),
      activeElement: null,
      pointerLockElement: null,
      createElement(tag) { return new StubElement(tag); },
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, new StubElement(id));
        return elements.get(id);
      },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      addEventListener() {},
      removeEventListener() {},
      exitPointerLock() {},
    },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true; },
    matchMedia() {
      return { matches: false, addEventListener() {}, removeEventListener() {} };
    },
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {},
    fetch: async (url) => {
      if (String(url).startsWith("assets/modular/registry.json")) {
        return { ok: true, status: 200, json: async () => modularRegistry };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const context = vm.createContext(sandbox);
  for (const file of [
    "level-data.js",
    "arsenal.js",
    "save.js",
    "loadout.js",
    "game.js",
  ]) {
    const absolute = path.join(ROOT, file);
    if (!fs.existsSync(absolute)) continue;
    vm.runInContext(fs.readFileSync(absolute, "utf8"), context, {
      filename: file,
    });
  }
  await context.KageGame.start();
  for (let index = 0; index < 8; index += 1) {
    if (context.KageGame.debug.assetStatus().roster.ready) break;
    await new Promise((resolve) => setImmediate(resolve));
  }
  return context;
}

function findAreaProp(propId) {
  for (const area of Object.values(KageLevels.areas)) {
    const prop = (area.props || []).find((entry) => entry.id === propId);
    if (prop) return { area, prop };
  }
  return null;
}

(async () => {
  await check("FSM 2D déclarée avec patrol/pursue/investigate/returnHome", () => {
    for (const state of ["patrol", "pursue", "investigate", "returnHome"]) {
      assert.match(
        gameSource,
        new RegExp(`["'\`]${state}["'\`]`),
        `État FSM manquant : ${state}`,
      );
    }
    assert.match(
      gameSource,
      /(?:enemy|e)\.ai\.state|transition(?:Side)?EnemyAi|set(?:Side)?EnemyAiState/,
      "Le moteur doit lire ou modifier explicitement enemy.ai.state",
    );
  });

  await check("platformId, home et bornes de patrouille conservés à l'instanciation", () => {
    const constructor = functionSource("makeSideEnemiesForArea");
    assert.match(
      constructor,
      /\bplatformId\b/,
      "makeSideEnemiesForArea() doit conserver platformId sur l'ennemi",
    );
    const aiConstructor = functionSource("createSideEnemyAi");
    for (const field of [
      "homeX",
      "homeY",
      "patrolMinX",
      "patrolMaxX",
    ]) {
      assert.match(
        aiConstructor,
        new RegExp(`\\b${field}\\b`),
        `createSideEnemyAi() doit conserver ${field}`,
      );
    }
  });

  await check("hitEnemy() produit un stimulus d'aggro", () => {
    const hitEnemy = functionSource("hitEnemy");
    assert.match(
      hitEnemy,
      /recordEnemyStimulus|aggro|alerted|transition(?:Side)?EnemyAi|set(?:Side)?EnemyAiState/,
      "hitEnemy() doit enregistrer le joueur comme stimulus hostile",
    );
    assert.match(
      hitEnemy,
      /pursue|investigate|hurt/,
      "Le stimulus de hitEnemy() doit mener vers hurt/pursue/investigate",
    );
  });

  await check("attaque 2D limitée au demi-plan regardé par l'ennemi", async () => {
    const updateSideEnemies = functionSource("updateSideEnemies");
    assert.match(
      updateSideEnemies,
      /isPlayerInFront|isTargetInFront|dx\s*\*\s*enemy\.facing|Math\.sign\(dx\)\s*===?\s*enemy\.facing/,
      "La résolution d'attaque doit vérifier la direction enemy.facing",
    );

    const runtime = await bootRuntime();
    runtime.KageGame.debug.setHealth(100);
    runtime.KageGame.debug.setPlayer2d({
      x: 100,
      y: 273,
      vx: 0,
      vy: 0,
      grounded: true,
    });
    const initialArea = runtime.KageGame.debug.areaSnapshot();
    const currentAi = initialArea.enemies[0]?.ai || {};
    runtime.KageGame.debug.setSideEnemy(0, {
      x: 125,
      y: 276,
      w: 16,
      h: 24,
      hp: 20,
      maxHp: 20,
      dead: false,
      dying: false,
      facing: 1,
      attack: 0.5,
      attackDuration: 0.56,
      attackCooldown: 1,
      attackHitApplied: false,
      hurtTimer: 0,
      ai: { ...currentAi, state: "attackActive" },
    });
    runtime.KageGame.debug.step(0.25);
    assert.equal(
      runtime.KageGame.getState().health,
      100,
      "Un ennemi regardant à droite ne doit pas toucher Akio placé derrière lui",
    );
  });

  await check("portes solidDoor bloquantes pour joueur et navigation ennemie", async () => {
    const occupancy = functionSource("canOccupySideEnemy");
    assert.match(
      occupancy,
      /solidDoor/,
      "canOccupySideEnemy() doit refuser le franchissement d'une solidDoor fermée",
    );

    const runtime = await bootRuntime();
    runtime.KageGame.debug.setSideArea("castle-residence", "lowerCourtReturn");
    const door = KageLevels.areas["castle-residence"].portals.find(
      (portal) => portal.id === "corridor-to-donjon",
    );
    assert.equal(door.collision, "solidDoor");
    runtime.KageGame.debug.setPlayer2d({
      x: door.x - 40,
      y: 273,
      vx: 800,
      vy: 0,
      grounded: true,
      facing: 1,
    });
    runtime.KageGame.debug.step(0.1);
    const player = runtime.KageGame.getState().player2d;
    assert.ok(
      player.x + player.w <= door.x + 1,
      `Le joueur a traversé ${door.id} sans action (${player.x + player.w} > ${door.x})`,
    );
  });

  await check("portes FPS secondaires non jouables sans mur invisible", async () => {
    const runtime = await bootRuntime();
    runtime.KageGame.debug.setSideArea("kurokawa-market-east", "marketWest");
    const door = KageLevels.areas["kurokawa-market-east"].portals.find(
      (portal) => portal.id === "market-shrine-fps",
    );
    assert.equal(door.collision, "solidDoor");
    assert.equal(typeof door.mission, "string");
    runtime.KageGame.debug.setPlayer2d({
      x: door.x - 25,
      y: 273,
      vx: 800,
      vy: 0,
      grounded: true,
      facing: 1,
    });
    runtime.KageGame.debug.step(0.1);
    const player = runtime.KageGame.getState().player2d;
    assert.ok(
      player.x > door.x,
      `La mission secondaire ${door.id} crée encore un mur invisible`,
    );
  });

  await check("ennemis au sol capables de poursuivre sous les plateformes one-way", async () => {
    const runtime = await bootRuntime();
    runtime.KageGame.debug.setSideArea("kurokawa-main-street", "prologue");
    runtime.KageGame.debug.setPlayer2d({
      x: 990,
      y: 273,
      vx: 0,
      vy: 0,
      grounded: true,
    });
    const before = runtime.KageGame.debug.areaSnapshot();
    const targetIndex = before.enemies.findIndex(
      (enemy) => enemy.sourceId === "main-regular-03",
    );
    assert.ok(targetIndex >= 0);
    before.enemies.forEach((enemy, index) => {
      if (index !== targetIndex) {
        runtime.KageGame.debug.setSideEnemy(index, {
          hp: 0,
          dead: true,
          dying: false,
        });
      }
    });
    runtime.KageGame.debug.setSideEnemy(targetIndex, {
      x: 1260,
      y: 276,
      w: 16,
      h: 24,
      hp: 20,
      maxHp: 20,
      dead: false,
      dying: false,
      facing: -1,
      attack: 0,
      attackCooldown: 99,
      hurtTimer: 0,
      ai: {
        ...(before.enemies[targetIndex].ai || {}),
        state: "pursue",
        lastKnownX: 990,
        memoryTime: 99,
      },
    });
    for (let index = 0; index < 30; index += 1) {
      runtime.KageGame.debug.step(0.1);
    }
    const target = runtime.KageGame.debug.areaSnapshot().enemies[targetIndex];
    assert.ok(
      target.x < 1198,
      `L'ennemi reste bloqué au bord invisible du toit (${target.x})`,
    );
  });

  await check("rendu FPS différencie réellement face, dos et profils", () => {
    const renderer = functionSource("drawFpsEnemy");
    const directional = functionSource("drawDirectionalAnimationSprite");
    assert.match(
      renderer,
      /drawDirectionalAnimationSprite/,
      "drawFpsEnemy() doit utiliser le renderer directionnel",
    );
    for (const direction of ["front", "back"]) {
      assert.match(
        directional,
        new RegExp(`["'\`]${direction}["'\`]`),
        `Le renderer directionnel doit traiter ${direction}`,
      );
    }
    assert.match(
      directional,
      /clip\(\)/,
      "Les vues face/dos doivent recomposer la silhouette par demi-planches",
    );
  });

  await check("tir FPS remplace le viewmodel de mêlée", () => {
    const renderer = functionSource("drawFps");
    assert.match(renderer, /rangedViewTimer\s*>\s*0/);
    assert.match(renderer, /drawFpsPlayerBody/);
    assert.match(renderer, /drawFpsRangedProjectile/);
    assert.match(
      renderer,
      /else\s*\{\s*drawFpsWeapon\(\)/,
      "Le katana ne doit pas être dessiné en même temps que le tir",
    );
  });

  await check("équipement massif respecte attachPhase et detachTransition", () => {
    const phaseUpdate = functionSource("updateMassiveEnemyPhase");
    assert.match(phaseUpdate, /attachPhase/);
    assert.match(phaseUpdate, /detachTransition/);
    assert.match(
      phaseUpdate,
      /massiveProfile\?\.name|modularEntry\?\.name/,
      "Les annonces de phase ne doivent pas nommer tous les boss Aka-Ushi",
    );
  });

  await check("20 murs de ruelle distincts déclarés et présents", () => {
    assert.ok(fs.existsSync(WALL_MANIFEST_PATH), "Manifest des murs absent");
    const manifest = JSON.parse(fs.readFileSync(WALL_MANIFEST_PATH, "utf8"));
    assert.deepEqual(manifest.grid, { columns: 5, rows: 4 });
    assert.equal(manifest.sprites.length, 20, "Le pack doit contenir exactement 20 murs");
    assert.equal(new Set(manifest.sprites.map((entry) => entry.id)).size, 20);
    assert.equal(new Set(manifest.sprites.map((entry) => entry.file)).size, 20);
    for (const wall of manifest.sprites) {
      assert.equal(wall.nonEmpty, true, `${wall.id} est déclaré vide`);
      const file = path.join(WALL_ROOT, wall.file);
      assert.ok(fs.existsSync(file), `Fichier de mur absent : ${wall.file}`);
      assert.ok(fs.statSync(file).size > 0, `Fichier de mur vide : ${wall.file}`);
    }
    const fallbackStart = gameSource.indexOf("const ALLEY_WALL_GROUND_BOUNDS");
    const fallbackEnd = gameSource.indexOf("const KATANA_NAMES", fallbackStart);
    assert.ok(fallbackStart >= 0 && fallbackEnd > fallbackStart);
    const fallbackSource = gameSource.slice(fallbackStart, fallbackEnd);
    for (const wall of manifest.sprites) {
      assert.ok(
        fallbackSource.includes(`"${wall.id}": [`),
        `Recadrage file:// absent pour ${wall.id}`,
      );
    }
    assert.match(functionSource("opaqueGroundFallbackForImage"), /ALLEY_WALL_GROUND_BOUNDS/);
  });

  await check("murs continus derrière les bâtiments et portes chargées", () => {
    const marketProps = KageLevels.areas["kurokawa-market-east"].props;
    const watchtower = marketProps.find((prop) => prop.id === "castle-road-watch");
    const wallRun = marketProps.filter((prop) =>
      prop.id.startsWith("market-castle-road-line-"));
    assert.ok(watchtower, "Tour de la route du château absente");
    assert.ok(wallRun.length > 0, "Bande murale de la route du château absente");
    for (const wall of wallRun) {
      assert.ok(
        wall.depthBias < watchtower.depthBias,
        `${wall.id} peut repeindre la tour au lieu de rester derrière`,
      );
    }
    assert.match(
      functionSource("worldPropImageByFile"),
      /bitmapAssets\.depthPortals\[file\]/,
      "Les portes spatiales utilisées comme décor doivent être résolues",
    );
  });

  await check("layers et bottomY des props de profondeur cohérents", () => {
    const expected = {
      "main-well": {
        layer: "world", bottomY: 302, depthBand: "world-near", depthBias: 10,
      },
      "back-well": {
        layer: "world", bottomY: 302, depthBand: "world-near", depthBias: 10,
      },
      "market-well": {
        layer: "world", bottomY: 302, depthBand: "world-near", depthBias: 10,
      },
      "road-altar": {
        layer: "world", bottomY: 302, depthBand: "world-near", depthBias: 10,
      },
      "lower-court-brazier": {
        layer: "front", bottomY: 304, depthBand: "foreground", depthBias: 20,
      },
      "residence-brazier": {
        layer: "front", bottomY: 304, depthBand: "foreground", depthBias: 20,
      },
      "donjon-brazier": {
        layer: "front", bottomY: 304, depthBand: "foreground", depthBias: 20,
      },
      "residence-screen": {
        layer: "front", bottomY: 304, depthBand: "foreground", depthBias: 20,
      },
      "donjon-screen": {
        layer: "front", bottomY: 304, depthBand: "foreground", depthBias: 20,
      },
    };
    for (const [id, contract] of Object.entries(expected)) {
      const found = findAreaProp(id);
      assert.ok(found, `Prop attendu absent : ${id}`);
      assert.deepEqual(
        {
          layer: found.prop.layer,
          bottomY: found.prop.bottomY,
          depthBand: found.prop.depthBand,
          depthBias: found.prop.depthBias,
        },
        contract,
        `Perspective incorrecte pour ${found.area.id}/${id}`,
      );
    }
    for (const area of Object.values(KageLevels.areas)) {
      for (const prop of area.props || []) {
        assert.ok(
          ["back", "world", "front"].includes(prop.layer),
          `${area.id}/${prop.id} possède un layer invalide`,
        );
        assert.ok(
          Number.isFinite(prop.depthBias),
          `${area.id}/${prop.id} n'a pas de depthBias numérique`,
        );
        assert.deepEqual(
          Array.from(prop.groundAnchor || []),
          [0.5, 1],
          `${area.id}/${prop.id} n'a pas d'ancre de contact au sol`,
        );
        assert.equal(
          prop.contactMode,
          "opaque-bottom",
          `${area.id}/${prop.id} n'utilise pas le contact opaque`,
        );
        if (prop.bottomY !== undefined) {
          assert.ok(Number.isFinite(prop.bottomY), `${area.id}/${prop.id} a un bottomY invalide`);
          assert.ok(
            prop.bottomY >= 300 && prop.bottomY <= 304,
            `${area.id}/${prop.id} est hors de la profondeur de sol`,
          );
        }
      }
    }
  });

  await check("scène 2D triée par baseline et profondeur réelle", () => {
    const renderer = functionSource("drawSide");
    const depthScene = functionSource("drawSideDepthScene");
    assert.match(
      renderer,
      /drawSideDepthScene/,
      "drawSide() doit déléguer les acteurs et props au tri de profondeur",
    );
    assert.match(depthScene, /baseline/);
    assert.match(depthScene, /depthBias/);
    assert.match(depthScene, /sceneEntries\.sort/);
    assert.match(depthScene, /drawModularWorldProp/);
    assert.match(depthScene, /drawZombie2d/);
    assert.match(depthScene, /drawSamurai2d/);
  });

  await check("barrières d'arène Aka-Ushi retirées après sa mort", async () => {
    const runtime = await bootRuntime();
    runtime.KageGame.debug.setSideArea("kurokawa-market-east", "bossCheckpoint");
    const barrierXs = new Set([1160, 2110]);
    let props = runtime.KageGame.debug.worldSnapshot().props;
    assert.equal(
      props.filter((prop) => barrierXs.has(prop.x)).length,
      2,
      "Les deux barrières doivent être visibles avant le combat",
    );
    const bossIndex = KageLevels.areas["kurokawa-market-east"].enemies.findIndex(
      (enemy) => enemy.id === "aka-ushi",
    );
    runtime.KageGame.debug.setSideEnemy(bossIndex, {
      hp: 0,
      dead: true,
      dying: false,
      attack: 0,
    });
    runtime.KageGame.debug.step(0.05);
    props = runtime.KageGame.debug.worldSnapshot().props;
    assert.equal(
      props.filter((prop) => barrierXs.has(prop.x)).length,
      0,
      "Les barrières ouest/est doivent disparaître quand Aka-Ushi est vaincu",
    );
  });

  await check("snapshot debug expose ai.state, home et patrol bounds", async () => {
    const runtime = await bootRuntime();
    runtime.KageGame.debug.setSideArea("castle-residence", "lowerCourtReturn");
    const snapshot = runtime.KageGame.debug.areaSnapshot();
    const guard = snapshot.enemies.find(
      (enemy) => enemy.sourceId === "residence-guard-02",
    );
    assert.ok(guard, "Le garde de la galerie ouest doit être exposé");
    assert.equal(guard.platformId, "residence-upper-floor-west");
    assert.equal(typeof guard.ai, "object", "Le snapshot doit exposer enemy.ai");
    assert.equal(typeof guard.ai.state, "string", "Le snapshot doit exposer ai.state");
    for (const field of ["homeX", "homeY", "patrolMinX", "patrolMaxX"]) {
      assert.ok(Number.isFinite(guard.ai[field]), `Le snapshot doit exposer ai.${field}`);
    }
    assert.ok(guard.ai.patrolMinX < guard.ai.patrolMaxX);

    const platform = KageLevels.areas["castle-residence"].platforms.find(
      (entry) => entry.id === guard.platformId,
    );
    assert.ok(platform);
    assert.ok(guard.ai.homeX >= platform.x && guard.ai.homeX <= platform.x + platform.w);
    assert.ok(guard.ai.patrolMinX >= platform.x);
    assert.ok(guard.ai.patrolMaxX <= platform.x + platform.w);
  });

  await check("un impact à distance réveille l'IA hors perception immédiate", async () => {
    const runtime = await bootRuntime();
    runtime.KageGame.debug.setPlayer2d({
      x: 100,
      y: 273,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: true,
    });
    const before = runtime.KageGame.debug.areaSnapshot();
    for (let index = 1; index < before.enemies.length; index += 1) {
      runtime.KageGame.debug.setSideEnemy(index, {
        hp: 0,
        dead: true,
        dying: false,
      });
    }
    const initialAi = before.enemies[0]?.ai || {};
    runtime.KageGame.debug.setSideEnemy(0, {
      x: 360,
      y: 276,
      w: 16,
      h: 24,
      hp: 20,
      maxHp: 20,
      dead: false,
      dying: false,
      facing: -1,
      attack: 0,
      attackCooldown: 99,
      hurtTimer: 0,
      ai: { ...initialAi, state: "patrol" },
    });
    runtime.KageGame.ranged();
    let target = null;
    for (let index = 0; index < 18; index += 1) {
      runtime.KageGame.debug.step(0.1);
      target = runtime.KageGame.debug.areaSnapshot().enemies[0];
      if (target.hp < 20) break;
    }
    assert.ok(target.hp < 20, "Le projectile de test doit atteindre la cible éloignée");
    assert.ok(
      ["hurt", "pursue", "investigate"].includes(target.ai?.state),
      `État attendu après impact : hurt/pursue/investigate, reçu ${target.ai?.state}`,
    );
    assert.ok(
      Number.isFinite(target.ai?.lastKnownX),
      "hitEnemy() doit mémoriser la position hostile dans ai.lastKnownX",
    );
  });

  if (failures.length) {
    console.error(`\nCoherence smoke test : ${successes.length} contrat(s) valide(s), ${failures.length} manquant(s).`);
    failures.forEach((failure, index) => {
      console.error(`${index + 1}. ${failure.name}`);
      console.error(`   ${failure.message}`);
    });
    process.exitCode = 1;
    return;
  }

  console.log("\nCoherence smoke test OK — FSM, collisions, murs, profondeur et arène cohérents");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
