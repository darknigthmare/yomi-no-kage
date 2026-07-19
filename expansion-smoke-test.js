"use strict";

/*
 * Test autonome de l'extension "jeu complet".
 *
 * Il charge les sources de données avant le moteur, comme le ferait index.html,
 * puis vérifie l'arsenal, le changement d'arme, les passages en profondeur,
 * la persistance par zone et le profil des boss massifs.
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
    this.value = "";
    this.offsetWidth = 640;
    this.width = 0;
    this.height = 0;
  }
  addEventListener() {}
  removeEventListener() {}
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
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

const gradient = { addColorStop() {} };
const context = new Proxy(
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

const elements = new Map();
const canvas = new StubElement("game-canvas");
canvas.width = 1280;
canvas.height = 720;
canvas.getContext = () => context;
canvas.requestPointerLock = undefined;
elements.set("game-canvas", canvas);

const storage = new Map();
global.window = global;
global.HTMLElement = StubElement;
global.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
};
global.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(String(key), String(value)); },
  removeItem(key) { storage.delete(String(key)); },
  clear() { storage.clear(); },
};
global.document = {
  body: new StubElement("body"),
  activeElement: null,
  pointerLockElement: null,
  createElement(tagName) { return new StubElement(tagName); },
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, new StubElement(id));
    return elements.get(id);
  },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {},
  removeEventListener() {},
  exitPointerLock() {},
};
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.dispatchEvent = () => true;
global.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};
global.fetch = async (url) => {
  if (String(url).startsWith("assets/modular/registry.json")) {
    return { ok: true, status: 200, json: async () => modularRegistry };
  }
  return { ok: false, status: 404, json: async () => ({}) };
};

function requireIfPresent(fileName) {
  const absolutePath = path.join(__dirname, fileName);
  if (!fs.existsSync(absolutePath)) return false;
  require(absolutePath);
  return true;
}

requireIfPresent("level-data.js");
requireIfPresent("arsenal.js");
requireIfPresent("save.js");
requireIfPresent("loadout.js");
require("./game.js");

function activeWeaponId(state) {
  return typeof state.activeWeapon === "string"
    ? state.activeWeapon
    : state.activeWeapon?.id || state.activeWeaponId || state.weapon;
}

function nearbyPortalId(state) {
  return typeof state.nearbyPortal === "string"
    ? state.nearbyPortal
    : state.nearbyPortal?.id || null;
}

function finishTransition() {
  for (let index = 0; index < 4; index += 1) {
    global.KageGame.debug.step(0.25);
  }
}

function warpAndTravel(portalId, expectedDestination) {
  const warpedPortal = global.KageGame.debug.warpToPortal(portalId);
  assert.equal(warpedPortal?.id, portalId, `Le portail ${portalId} doit être accessible au test`);
  let state = global.KageGame.getState();
  assert.equal(nearbyPortalId(state), portalId);
  const originAreaId = state.sideAreaId;

  // Une porte de profondeur n'est jamais automatique.
  global.KageGame.debug.step(0.2);
  state = global.KageGame.getState();
  assert.equal(state.sideAreaId, originAreaId);
  assert.equal(state.pendingTravel, null);

  global.KageGame.interact();
  state = global.KageGame.getState();
  assert.equal(state.sideAreaId, originAreaId);
  assert.equal(state.pendingTravel?.swapped, false);

  // La géographie change au milieu du fondu, pas au début de l'action.
  global.KageGame.debug.step(0.25);
  assert.equal(global.KageGame.getState().sideAreaId, originAreaId);
  global.KageGame.debug.step(0.25);
  state = global.KageGame.getState();
  assert.equal(state.sideAreaId, expectedDestination);
  assert.equal(state.pendingTravel?.swapped, true);

  global.KageGame.debug.step(0.25);
  global.KageGame.debug.step(0.25);
  assert.equal(global.KageGame.getState().pendingTravel, null);
}

async function settleRoster() {
  for (let index = 0; index < 8; index += 1) {
    if (global.KageGame.debug.assetStatus().roster.ready) return;
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.fail("Le registre modulaire n'a pas fini de charger");
}

async function measureSideAttack(weaponId, targetDistance) {
  await global.KageGame.start();
  global.KageGame.applyLoadout({
    ...global.KageArsenal.defaultLoadout,
    primary: weaponId,
  });
  assert.equal(global.KageGame.equipWeapon("primary"), true);
  global.KageGame.debug.setPlayer2d({
    x: 100,
    y: 273,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
  });
  const playerCenterX = 110;
  const enemyWidth = 19;
  global.KageGame.debug.setSideEnemy(0, {
    x: playerCenterX + targetDistance - enemyWidth / 2,
    y: 276,
    w: enemyWidth,
    hp: 20,
    maxHp: 20,
    dead: false,
    dying: false,
    attack: 0,
    attackCooldown: 99,
    hurtTimer: 0,
    deathTimer: 0,
    knockbackVx: 0,
    impactMaterial: "flesh",
  });
  global.KageGame.attack();
  global.KageGame.debug.step(0.25);
  return 20 - global.KageGame.debug.combatSnapshot().sideEnemies[0].hp;
}

(async () => {
  assert.ok(global.KageLevels, "level-data.js doit publier KageLevels");
  assert.ok(global.KageMassiveBossProfiles, "level-data.js doit publier les profils massifs");
  assert.ok(global.KageArsenal, "arsenal.js doit publier KageArsenal");
  assert.ok(global.KageSave, "save.js doit publier KageSave");

  global.KageSave.reset();
  assert.equal(global.KageSave.hasContinue(), false);
  const savedCheckpoint = global.KageSave.setCheckpoint("test-foyer", {
    chapter: 1,
    areaId: "castle-donjon",
    spawnId: "finalCheckpoint",
    health: 67,
    seals: 1,
  });
  assert.equal(global.KageSave.hasContinue(), true);
  assert.deepEqual(
    {
      checkpoint: savedCheckpoint.checkpoint,
      areaId: savedCheckpoint.areaId,
      spawnId: savedCheckpoint.spawnId,
      health: savedCheckpoint.health,
      seals: savedCheckpoint.seals,
    },
    {
      checkpoint: "test-foyer",
      areaId: "castle-donjon",
      spawnId: "finalCheckpoint",
      health: 67,
      seals: 1,
    },
    "La sauvegarde doit conserver foyer, zone, spawn, vie et sceaux",
  );
  await global.KageGame.continue();
  const resumedState = global.KageGame.getState();
  assert.equal(resumedState.sideAreaId, "castle-donjon");
  assert.equal(resumedState.health, 67);
  assert.equal(resumedState.seals, 1);
  assert.equal(resumedState.checkpoint, "test-foyer");
  global.KageSave.reset();

  const playableWeapons = global.KageArsenal.weapons.filter((weapon) => weapon.playable);
  assert.equal(playableWeapons.length, 53, "L'arsenal joueur doit contenir 53 armes");
  assert.deepEqual(
    [...global.KageArsenal.defaultUnlockedWeapons].sort(),
    ["01-kurokage", "kunai", "wakizashi"].sort(),
    "Une nouvelle chronique doit commencer avec trois armes lisibles, pas 53",
  );
  const indexSource = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  for (const action of ["attack", "heavy", "guard", "dodge", "ranged"]) {
    assert.ok(
      indexSource.includes(`data-action="${action}"`),
      `La commande tactile ${action} doit être présente`,
    );
  }
  assert.deepEqual(
    global.KageArsenal.slots.map((slot) => slot.id),
    ["primary", "secondary", "ranged"],
    "Le dojo doit proposer les trois emplacements complets",
  );
  for (const slot of global.KageArsenal.slots) {
    assert.ok(
      global.KageArsenal.isWeaponCompatibleWithSlot(
        global.KageArsenal.defaultLoadout[slot.id],
        slot.id,
      ),
      `L'arme par défaut de ${slot.id} doit être compatible`,
    );
    assert.ok(
      global.KageArsenal.weaponsForSlot(slot.id).length > 0,
      `L'emplacement ${slot.id} ne doit jamais être vide`,
    );
  }

  // Les chaînes sont composées en jeu : maillon et extrémités restent des
  // bitmaps indépendants, sans chaîne entière précuite dans une seule image.
  const segmentedWeapons = playableWeapons.filter(
    (weapon) => weapon.renderMode === "segmented-chain",
  );
  assert.ok(segmentedWeapons.length >= 6);
  for (const weapon of segmentedWeapons) {
    assert.ok(weapon.components?.link, `${weapon.id} doit déclarer un maillon séparé`);
    const components = Object.entries(weapon.components)
      .filter(([key]) => key !== "root")
      .map(([key, component]) => ({ key, component }));
    assert.ok(components.length >= 3, `${weapon.id} doit avoir au moins trois composants`);
    components.forEach(({ key, component }) => {
      assert.equal(
        typeof component?.file,
        "string",
        `${weapon.id}.${key} doit déclarer { file, anchor }`,
      );
      assert.ok(
        Array.isArray(component.anchor)
        && component.anchor.length === 2
        && component.anchor.every((value) =>
          Number.isFinite(value) && value >= 0 && value <= 1),
        `${weapon.id}.${key} doit avoir une ancre normalisée [x, y]`,
      );
      assert.ok(
        fs.existsSync(path.join(__dirname, component.file)),
        `Composant manquant : ${component.file}`,
      );
    });
  }

  const bokuto = global.KageArsenal.weaponById("bokuto");
  const odachi = global.KageArsenal.weaponById("odachi");
  assert.ok(bokuto && odachi);
  assert.notEqual(bokuto.stats.power, odachi.stats.power);
  assert.notEqual(bokuto.stats.reach, odachi.stats.reach);

  await global.KageGame.start();
  await settleRoster();
  assert.equal(global.KageGame.debug.assetStatus().roster.ready, true);
  const gameplayPortalIds = global.KageGame.debug.gameplayPortalIds();
  assert.equal(
    gameplayPortalIds.includes("forest-to-bamboo"),
    false,
    "Une nouvelle campagne ne doit pas exposer le raccourci de l'ancien prototype",
  );
  assert.ok(
    gameplayPortalIds.includes("campaign-route-01-forward"),
    "La première sortie doit suivre le graphe 28 zones",
  );
  const objectiveResolvers = global.KageGame.campaignObjectiveResolvers();
  const resolvedTypes = new Set([
    ...objectiveResolvers.boss,
    ...objectiveResolvers.clear,
    ...objectiveResolvers.interaction,
    ...objectiveResolvers.purify,
    ...objectiveResolvers.checkpoint,
  ]);
  const campaignObjectives = Object.values(global.KageLevels.campaignObjectives);
  assert.equal(campaignObjectives.length, 28);
  for (const objective of campaignObjectives) {
    assert.ok(
      resolvedTypes.has(objective.type),
      `${objective.id} (${objective.type}) doit posséder un déclencheur gameplay`,
    );
  }

  const initialArea = global.KageLevels.areas[global.KageLevels.startAreaId];
  const initialRoster = global.KageLevels.rosterPools[initialArea.rosterPoolId];
  const initialAllowList = new Set([
    ...initialRoster.regular,
    ...initialRoster.special,
    ...(initialRoster.miniboss || []),
  ]);
  const initialSnapshot = global.KageGame.debug.areaSnapshot();
  assert.equal(initialSnapshot.rosterPoolId, initialArea.rosterPoolId);
  initialSnapshot.enemies
    .filter((enemy) => !enemy.boss && enemy.rosterId)
    .forEach((enemy) => {
      assert.equal(enemy.rosterPoolId, initialArea.rosterPoolId);
      assert.ok(
        initialAllowList.has(enemy.rosterId),
        `${enemy.rosterId} doit appartenir au pool régional du niveau initial`,
      );
    });

  assert.equal(typeof global.KageGame.heavy, "function");
  assert.equal(typeof global.KageGame.guard, "function");
  assert.equal(typeof global.KageGame.dodge, "function");
  global.KageGame.debug.setPlayerCombat({
    attackTimer: 0,
    attackCooldown: 0,
    stamina: 100,
    playerStagger: 0,
    invulnerable: 0,
  });
  assert.equal(global.KageGame.attack(), true);
  assert.equal(global.KageGame.getState().comboStep, 1);
  global.KageGame.debug.setPlayerCombat({ attackTimer: 0, attackCooldown: 0 });
  assert.equal(global.KageGame.attack(), true);
  assert.equal(global.KageGame.getState().comboStep, 2);
  global.KageGame.debug.setPlayerCombat({ attackTimer: 0, attackCooldown: 0 });
  assert.equal(global.KageGame.heavy(), true);
  assert.equal(global.KageGame.getState().attackKind, "heavy");

  global.KageGame.debug.setPlayerCombat({
    attackTimer: 0,
    attackCooldown: 0,
    stamina: 80,
    playerStagger: 0,
    invulnerable: 0,
  });
  assert.equal(global.KageGame.guard(true), true);
  const playerBeforeParry = global.KageGame.getState();
  const parriedAttacker = {
    x: playerBeforeParry.player2d.x + 30,
    w: 16,
    boss: false,
    attack: 0.4,
    attackCooldown: 0,
    attackHitApplied: false,
    posture: 0,
    maxPosture: 36,
    hurtTimer: 0,
  };
  assert.equal(global.KageGame.debug.damagePlayer(18, {
    attacker: parriedAttacker,
    mode: "side",
    material: "armor",
    postureDamage: 28,
  }), false);
  const afterParry = global.KageGame.getState();
  assert.equal(afterParry.health, playerBeforeParry.health);
  assert.equal(afterParry.perfectParries, playerBeforeParry.perfectParries + 1);
  assert.equal(parriedAttacker.attack, 0);
  global.KageGame.releaseGuard();
  global.KageGame.debug.setPlayerCombat({
    attackTimer: 0,
    attackCooldown: 0,
    dodgeCooldown: 0,
    stamina: 100,
    playerStagger: 0,
    invulnerable: 0,
  });
  assert.equal(global.KageGame.dodge(), true);
  assert.ok(global.KageGame.getState().dodgeTimer > 0);

  const swappedLoadout = global.KageGame.applyLoadout({
    ...global.KageArsenal.defaultLoadout,
    primary: "bokuto",
    secondary: "wakizashi",
    ranged: "kunai",
  });
  assert.equal(swappedLoadout.primary, "bokuto");
  assert.equal(swappedLoadout.secondary, "wakizashi");
  assert.equal(global.KageGame.equipWeapon("primary"), true);
  let state = global.KageGame.getState();
  assert.equal(state.activeWeaponSlot, "primary");
  assert.equal(activeWeaponId(state), "bokuto");
  assert.equal(global.KageGame.swapWeapon(), true);
  state = global.KageGame.getState();
  assert.equal(state.activeWeaponSlot, "secondary");
  assert.equal(activeWeaponId(state), "wakizashi");
  assert.equal(global.KageGame.swapWeapon(), true);
  assert.equal(global.KageGame.getState().activeWeaponSlot, "primary");

  // Les statistiques ne sont pas seulement décoratives : elles modifient le
  // résultat réel d'un coup et sa portée dans le moteur.
  const bokutoCloseDamage = await measureSideAttack("bokuto", 30);
  const odachiCloseDamage = await measureSideAttack("odachi", 30);
  assert.ok(
    odachiCloseDamage > bokutoCloseDamage,
    "L'odachi doit infliger plus de dégâts que le bokuto",
  );
  assert.equal(await measureSideAttack("bokuto", 56), 0);
  assert.ok(
    await measureSideAttack("odachi", 56) > 0,
    "L'odachi doit toucher une cible hors de portée du bokuto",
  );

  await global.KageGame.start();
  global.KageGame.debug.setSideArea("kurokawa-main-street", "prologue");
  assert.equal(global.KageGame.getState().sideAreaId, "kurokawa-main-street");
  warpAndTravel("alley-to-back-street", "kurokawa-back-street");

  let area = global.KageGame.debug.areaSnapshot();
  const persistentEnemyId = area.aliveEnemyIds[0];
  const persistentPickupId = area.remainingPickupIds[0];
  const persistentPickup = global.KageLevels.areas[area.areaId].pickups.find(
    (pickup) => pickup.id === persistentPickupId,
  );
  assert.ok(persistentEnemyId && persistentPickup?.id);
  global.KageGame.debug.setSideEnemy(0, {
    hp: 0,
    dead: true,
    dying: false,
    attack: 0,
  });
  global.KageGame.debug.setPlayer2d({
    x: persistentPickup.x - 10,
    y: 273,
    vx: 0,
    vy: 0,
    grounded: true,
  });
  global.KageGame.debug.step(0.05);
  area = global.KageGame.debug.areaSnapshot();
  assert.equal(area.aliveEnemyIds.includes(persistentEnemyId), false);
  assert.equal(area.remainingPickupIds.includes(persistentPickupId), false);

  warpAndTravel("return-to-main-alley", "kurokawa-main-street");
  warpAndTravel("alley-to-back-street", "kurokawa-back-street");
  area = global.KageGame.debug.areaSnapshot();
  assert.equal(
    area.aliveEnemyIds.includes(persistentEnemyId),
    false,
    "Un ennemi vaincu ne doit pas réapparaître au retour dans la rue",
  );
  assert.equal(
    area.remainingPickupIds.includes(persistentPickupId),
    false,
    "Un objet ramassé doit rester pris au retour dans la rue",
  );
  assert.ok(global.KageGame.getState().visitedAreas.includes("kurokawa-back-street"));

  const areas = Object.values(global.KageLevels.areas);
  assert.equal(areas.length, 28, "La campagne complete doit exposer vingt-huit zones 2D");
  for (const level of areas) {
    assert.ok(
      String(level.routeMetrics?.mainRoute || "").startsWith("horizontal"),
      `${level.id} doit conserver une route obligatoire horizontale`,
    );
    assert.ok(level.width >= 2200, `${level.id} doit être une vraie zone longue`);
  }
  for (const level of areas.filter((entry) => entry.zoneKind === "outdoor")) {
    assert.equal(
      level.routeMetrics.requiredClimb,
      0,
      `${level.id} ne doit imposer aucune ascension artificielle`,
    );
  }

  // Le premier sceau ouvre l'accès narratif au marché. Aka-Ushi reste ensuite
  // le verrou de gameplay propre à la route du château.
  await global.KageGame.start();
  global.KageGame.debug.setSideArea("kurokawa-main-street", "prologue");
  global.KageGame.debug.warpToPortal("contaminated-torii");
  global.KageGame.interact();
  assert.equal(global.KageGame.getState().mode, "fps");
  global.KageGame.debug.clearFps();
  global.KageGame.debug.warpToAltar();
  global.KageGame.interact();
  finishTransition();
  assert.equal(global.KageGame.getState().chapter, 1);
  assert.equal(global.KageGame.getState().seals, 1);

  global.KageGame.debug.setSideArea("kurokawa-market-east", "bossCheckpoint");
  state = global.KageGame.getState();
  assert.equal(state.mode, "side", "Aka-Ushi doit être combattu dans la vue 2D");
  assert.equal(state.sideAreaId, "kurokawa-market-east");

  const marketDefinition = global.KageLevels.areas["kurokawa-market-east"];
  const massiveDefinitionIndex = marketDefinition.enemies.findIndex(
    (enemy) => enemy.id === "aka-ushi",
  );
  assert.ok(massiveDefinitionIndex >= 0, "Le marché doit déclarer Aka-Ushi");
  const massiveDefinition = marketDefinition.enemies[massiveDefinitionIndex];
  assert.deepEqual(
    {
      rosterId: massiveDefinition.rosterId,
      profileId: massiveDefinition.profileId,
      presentationClass: massiveDefinition.presentationClass,
      hp: massiveDefinition.hp,
    },
    {
      rosterId: "giant-02-aka-ushi",
      profileId: "giant-02-aka-ushi",
      presentationClass: "massive",
      hp: 42,
    },
    "La définition du boss 2D doit expliciter son roster, son profil et ses 42 HP",
  );
  assert.ok(massiveDefinition.w > 0 && massiveDefinition.h > 0);

  let massive = global.KageGame.debug.setSideEnemy(massiveDefinitionIndex, {});
  assert.equal(massive.sourceId, "aka-ushi");
  assert.equal(massive.rosterId, "giant-02-aka-ushi");
  assert.equal(massive.profileId, "giant-02-aka-ushi");
  assert.equal(massive.presentationClass, "massive");
  assert.equal(massive.boss, true);
  assert.equal(massive.hp, 42);
  assert.equal(massive.maxHp, 42);
  assert.equal(massive.w, massiveDefinition.w);
  assert.equal(massive.h, massiveDefinition.h);
  assert.equal(
    massive.y + massive.h,
    global.KageGame.debug.worldSnapshot().groundY,
    "Les pieds du boss massif doivent être posés exactement sur le sol 2D",
  );

  const profile = global.KageMassiveBossProfiles[massive.profileId];
  const render = profile.renderProfile || profile.render;
  assert.equal(profile.id, "giant-02-aka-ushi");
  assert.equal(profile.presentationClass, "massive");
  assert.equal(profile.modePreference, "side");
  assert.equal(profile.arena.zoneId, "kurokawa-market-east");
  assert.ok(render.maxHeightRatio <= 0.62, "Le boss ne doit pas dépasser 62 % de la hauteur");
  assert.ok(profile.phases.length >= 2, "Le boss massif doit posséder une phase 2");
  assert.ok(
    profile.detachableParts.some((part) => part.separateSprite),
    "Le boss massif doit posséder au moins une pièce détachable séparée",
  );
  assert.equal(massive.massivePhase, 1);
  assert.equal(massive.detachablePartAttached, true);

  let market = global.KageGame.debug.areaSnapshot();
  let castleRoad = market.portals.find((portal) => portal.id === "road-to-castle");
  assert.equal(castleRoad?.locked, true, "Aka-Ushi doit verrouiller la route du château");
  global.KageGame.debug.warpToPortal("road-to-castle");
  global.KageGame.interact();
  global.KageGame.debug.step(0.25);
  state = global.KageGame.getState();
  assert.equal(state.sideAreaId, "kurokawa-market-east");
  assert.equal(
    state.pendingTravel,
    null,
    "La route ne doit pas démarrer sa transition avant la mort du boss",
  );

  const phaseTwoHp = Math.max(1, Math.floor(massive.maxHp * 0.49));
  global.KageGame.debug.setMassiveBossHp(phaseTwoHp);
  global.KageGame.debug.step(0.05);
  massive = global.KageGame.debug.setSideEnemy(massiveDefinitionIndex, {});
  assert.equal(massive.massivePhase, 2);
  assert.equal(
    massive.detachablePartAttached,
    false,
    "Le joug séparé doit se détacher lors du passage en phase 2",
  );
  assert.equal(
    massive.detachedEquipment?.active,
    true,
    "Le joug détaché doit devenir un hazard persistant actif dans l'arène",
  );
  const massiveSnapshot = global.KageGame.debug.massiveBossSnapshot();
  assert.equal(
    massiveSnapshot?.detachedHazard?.active,
    true,
    "Le snapshot runtime doit exposer le hazard du joug après la transition",
  );

  global.KageGame.debug.setSideEnemy(massiveDefinitionIndex, {
    hp: 0,
    dead: true,
    dying: false,
    attack: 0,
  });
  market = global.KageGame.debug.areaSnapshot();
  castleRoad = market.portals.find((portal) => portal.id === "road-to-castle");
  assert.equal(castleRoad?.locked, false, "La mort d'Aka-Ushi doit ouvrir la route du château");
  assert.equal(market.aliveEnemyIds.includes("aka-ushi"), false);

  warpAndTravel("road-to-castle", "castle-lower-court");
  let castleArea = global.KageGame.debug.areaSnapshot();
  assert.equal(
    castleArea.portals.some((portal) =>
      portal.type === "fps" && Number(portal.mission) === 1),
    false,
    "La cour basse ne doit plus court-circuiter le château vers la mission FPS finale",
  );
  assert.equal(
    global.KageLevels.areas["castle-lower-court"].portals
      .some((portal) => portal.type === "fps" && Number(portal.mission) === 1),
    false,
  );

  const persistentCastleEnemyId = castleArea.aliveEnemyIds[0];
  assert.ok(persistentCastleEnemyId);
  global.KageGame.debug.setSideEnemy(0, {
    hp: 0,
    dead: true,
    dying: false,
    attack: 0,
  });

  warpAndTravel("door-to-residence", "castle-residence");
  warpAndTravel("corridor-to-donjon", "castle-donjon");
  castleArea = global.KageGame.debug.areaSnapshot();
  const finalFpsPortal = castleArea.portals.find(
    (portal) => portal.type === "fps" && Number(portal.mission) === 1,
  );
  assert.ok(finalFpsPortal, "La mission FPS 1 doit commencer au fond du donjon");
  assert.ok(
    global.KageLevels.areas["castle-donjon"].portals
      .some((portal) => portal.type === "fps" && Number(portal.mission) === 1),
  );

  const castleRoster = global.KageLevels.rosterPools["kai-kurokawa-castle"];
  const castleAllowList = new Set([
    ...castleRoster.regular,
    ...castleRoster.special,
    ...castleRoster.miniboss,
  ]);
  castleArea.enemies
    .filter((enemy) => !enemy.boss && enemy.rosterId)
    .forEach((enemy) => {
      assert.equal(enemy.rosterPoolId, "kai-kurokawa-castle");
      assert.ok(castleAllowList.has(enemy.rosterId));
    });

  const finalCheckpoint = global.KageLevels.areas["castle-donjon"].checkpoints[0];
  global.KageGame.debug.setPlayer2d({
    x: finalCheckpoint.x - 10,
    y: 273,
    vx: 0,
    vy: 0,
    grounded: true,
  });
  global.KageGame.debug.step(0.05);
  assert.equal(global.KageGame.getState().checkpoint, "donjon-final-checkpoint");
  assert.equal(global.KageSave.getProgress().checkpoint, "donjon-final-checkpoint");

  global.KageGame.debug.setMode("fps");
  const finalCombat = global.KageGame.debug.combatSnapshot();
  const finalBoss = finalCombat.fpsEnemies.find((enemy) => enemy.rosterId === "06-daimyo-corrupted");
  assert.ok(finalBoss, "Le boss FPS final doit être explicitement 06-daimyo-corrupted");
  assert.equal(global.KageGame.debug.assetStatus().fpsPlayerDeferred, false);
  assert.equal(global.KageGame.debug.worldSnapshot().fps.scheme, "kurokawa-donjon");
  global.KageGame.debug.setMode("side");
  finishTransition();

  warpAndTravel("return-to-residence", "castle-residence");
  warpAndTravel("return-to-lower-court", "castle-lower-court");
  castleArea = global.KageGame.debug.areaSnapshot();
  assert.equal(
    castleArea.aliveEnemyIds.includes(persistentCastleEnemyId),
    false,
    "La cour basse doit conserver l'état de ses ennemis après le détour par les pièces",
  );
  warpAndTravel("return-to-village", "kurokawa-market-east");
  market = global.KageGame.debug.areaSnapshot();
  assert.equal(
    market.aliveEnemyIds.includes("aka-ushi"),
    false,
    "Aka-Ushi ne doit pas réapparaître après le parcours du château",
  );
  for (const areaId of [
    "kurokawa-market-east",
    "castle-lower-court",
    "castle-residence",
    "castle-donjon",
  ]) {
    assert.ok(
      global.KageGame.getState().visitedAreas.includes(areaId),
      `${areaId} doit rester inscrit dans le parcours persistant`,
    );
  }

  // Une fermeture en plein combat doit restaurer Aka-Ushi avec sa vraie phase
  // et son joug déjà séparé, pas régénérer le boss à son état initial.
  global.KageSave.reset();
  global.KageSave.setCheckpoint("market-before-aka-ushi", {
    chapter: 1,
    areaId: "kurokawa-market-east",
    spawnId: "bossCheckpoint",
    health: 74,
    seals: 1,
  });
  global.KageSave.setBossRuntime("aka-ushi", {
    areaId: "kurokawa-market-east",
    hp: 18,
    maxHp: 42,
    phase: 2,
    dead: false,
    detachablePartAttached: false,
    detachedEquipment: {
      weaponId: "joug-tranchant-aka-ushi",
      x: 1920,
      bottomY: 300,
      width: 118,
      damage: 14,
      cooldown: 0.25,
      active: true,
    },
  });
  await global.KageGame.continue();
  const restoredBoss = global.KageGame.debug.massiveBossSnapshot();
  assert.equal(restoredBoss?.hp, 18, "La vie d'Aka-Ushi doit survivre au rechargement");
  assert.equal(restoredBoss?.phase, 2, "La phase 2 d'Aka-Ushi doit survivre au rechargement");
  assert.equal(restoredBoss?.detachablePartAttached, false, "Le joug ne doit pas se rattacher au rechargement");
  assert.equal(restoredBoss?.detachedHazard?.active, true, "Le joug au sol doit rester un hazard actif");

  console.log(
    "Expansion smoke test OK — arsenal ancré, Aka-Ushi 2D, château profond persistant et FPS final au donjon",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
