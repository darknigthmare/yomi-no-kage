"use strict";

/*
 * Contrat VM de progression longue.
 *
 * Il valide les effets réellement consommés par le moteur (armes, dojo,
 * contamination et services), le budget garanti, la persistance d'une zone
 * nettoyée au rechargement et la séparation 7 sceaux campagne / 2 sceaux
 * historiques jusqu'à la fin cyber.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { performance } = require("node:perf_hooks");

const ROOT = __dirname;
const modularRegistry = JSON.parse(
  fs.readFileSync(path.join(ROOT, "assets", "modular", "registry.json"), "utf8"),
);

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

function canvasContext() {
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

function bootVm() {
  const elements = new Map();
  const storage = new Map();
  const canvas = new StubElement("game-canvas");
  canvas.width = 1280;
  canvas.height = 720;
  canvas.getContext = () => canvasContext();
  elements.set("game-canvas", canvas);

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
      getItem(key) { return storage.get(String(key)) || null; },
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
  for (const file of ["level-data.js", "arsenal.js", "save.js", "loadout.js", "game.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, {
      filename: file,
    });
  }
  return { context, elements };
}

function almostEqual(actual, expected, tolerance = 1e-8) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} diffère de ${expected} (tolérance ${tolerance})`,
  );
}

(async () => {
  const { context, elements } = bootVm();
  const { KageGame, KageLevels, KageSave } = context;

  for (const [areaId, enemyId] of [
    ["kurokawa-back-street", "back-regular-04"],
    ["castle-lower-court", "court-guard-05"],
  ]) {
    const area = KageLevels.areas[areaId];
    const enemy = area.enemies.find((entry) => entry.id === enemyId);
    const forwardDoor = area.portals.find((portal) =>
      portal.collision === "solidDoor"
      && String(portal.id).startsWith("campaign-route-"));
    const doorLeft = Number(forwardDoor.blockX);
    const doorRight = doorLeft + Number(forwardDoor.blockWidth);
    const patrolLeft = Number(enemy.ai.patrol.minX);
    const patrolRight = Number(enemy.ai.patrol.maxX) + Number(enemy.w || 16);
    assert.ok(
      patrolRight <= doorLeft || patrolLeft >= doorRight,
      `${areaId}/${enemyId}: la patrouille traverse encore ${forwardDoor.id}`,
    );
  }
  const backStreet = KageLevels.areas["kurokawa-back-street"];
  const backGuard = backStreet.enemies.find((entry) => entry.id === "back-regular-04");
  const backBarrier = backStreet.props.find((entry) => entry.id === "back-barrier");
  assert.ok(
    Number(backGuard.ai.patrol.maxX) + Number(backGuard.w || 16) <= backBarrier.x,
    "back-regular-04 doit rester devant la barrière visuelle, sans la traverser.",
  );
  assert.match(
    fs.readFileSync(path.join(ROOT, "tools", "validate-2d-spatial.py"), "utf8"),
    /enemy\.door\.(?:spawn|patrol)/,
  );

  KageSave.reset();
  await KageGame.start();
  let base = KageGame.debug.progressionSnapshot();
  assert.equal(base.melee.upgradeLevel, 0);
  assert.equal(base.ranged.upgradeLevel, 0);
  assert.equal(base.mastery.ordinaryKill, 6);
  assert.equal(base.services.checkpointHealing, 20);
  assert.equal(base.services.restPurification, 11);
  assert.equal(base.seals.total, 7);

  let profile = KageSave.load();
  profile.progress.started = true;
  profile.progress.completed = false;
  profile.progress.areaId = KageLevels.campaignRuntime.startAreaId;
  profile.progress.spawnId = "prologue";
  profile.mastery.upgradeLevels[profile.loadout.primary] = 4;
  profile.mastery.upgradeLevels[profile.loadout.ranged] = 4;
  profile.hub.facilities.dojo.level = 5;
  profile.hub.facilities.infirmary.level = 5;
  profile.hub.facilities.shrine.level = 5;
  profile.contamination = 80;
  KageSave.save(profile);
  await KageGame.start({ continue: true });

  const upgraded = KageGame.debug.progressionSnapshot();
  assert.equal(upgraded.melee.upgradeLevel, 4);
  assert.ok(upgraded.melee.lightDamage > base.melee.lightDamage);
  assert.ok(upgraded.melee.postureDamage > base.melee.postureDamage);
  assert.ok(upgraded.melee.staminaCost < base.melee.staminaCost);
  assert.ok(upgraded.melee.sideReach > base.melee.sideReach);
  assert.equal(upgraded.ranged.upgradeLevel, 4);
  assert.ok(upgraded.ranged.damage > base.ranged.damage);
  assert.ok(upgraded.ranged.postureDamage > base.ranged.postureDamage);
  assert.ok(upgraded.ranged.cooldown < base.ranged.cooldown);
  assert.ok(upgraded.ranged.maxDistance > base.ranged.maxDistance);
  assert.equal(upgraded.mastery.ordinaryKill, 12);
  assert.equal(upgraded.mastery.bossKill, 90);
  assert.equal(upgraded.services.checkpointHealing, 52);
  assert.equal(upgraded.services.checkpointPurification, 11);
  assert.equal(upgraded.services.restPurification, 39);
  almostEqual(upgraded.services.contaminationGainMultiplier, 0.625);
  almostEqual(upgraded.staminaRegenMultiplier, 0.68);

  // Le sanctuaire réduit vraiment la contamination gagnée sur le même coup.
  profile = KageSave.load();
  profile.contamination = 10;
  profile.hub.facilities.shrine.level = 1;
  KageSave.save(profile);
  await KageGame.start({ continue: true });
  KageGame.debug.damagePlayer(20, {
    attacker: { id: "infected-test" },
    material: "flesh",
    mode: "side",
  });
  const lowShrineGain = KageSave.load().contamination - 10;
  almostEqual(lowShrineGain, 1.4504);

  profile = KageSave.load();
  profile.contamination = 10;
  profile.hub.facilities.shrine.level = 5;
  KageSave.save(profile);
  await KageGame.start({ continue: true });
  KageGame.debug.damagePlayer(20, {
    attacker: { id: "infected-test" },
    material: "flesh",
    mode: "side",
  });
  const highShrineGain = KageSave.load().contamination - 10;
  almostEqual(highShrineGain, 0.98);
  assert.ok(highShrineGain < lowShrineGain);

  // Infirmerie et sanctuaire haut niveau transforment réellement le repos.
  profile = KageSave.load();
  profile.contamination = 80;
  profile.hub.supplies = 2;
  profile.hub.facilities.infirmary.level = 5;
  profile.hub.facilities.shrine.level = 5;
  KageSave.save(profile);
  await KageGame.start({ continue: true });
  KageGame.debug.setHealth(20);
  KageGame.debug.setActiveCheckpoint("vm-refuge");
  const rested = KageGame.campaignAction("rest");
  assert.equal(rested.ok, true);
  assert.equal(KageSave.load().contamination, 41);
  assert.equal(KageSave.load().hub.supplies, 1);
  assert.equal(KageGame.getState().health, 100);

  // Un foyer consommé ne peut pas être exploité par un aller-retour/reload.
  KageSave.reset();
  await KageGame.start();
  const checkpointArea = KageLevels.areas[KageLevels.campaignRuntime.startAreaId];
  const checkpoint = checkpointArea.checkpoints[0];
  KageGame.debug.setSideArea(checkpointArea.id, "prologue");
  KageGame.debug.setHealth(20);
  KageGame.debug.setPlayer2d({
    x: checkpoint.x - KageGame.getState().player2d.w / 2,
    y: 273,
    vx: 0,
    vy: 0,
    grounded: true,
  });
  KageGame.debug.step(1 / 60);
  const firstCheckpointHealth = KageGame.getState().health;
  assert.ok(firstCheckpointHealth > 20);
  assert.ok(KageGame.getState().consumedCheckpoints.includes(checkpoint.id));

  const neighborAreaId = KageLevels.campaignRuntime.linearRoute[1];
  KageGame.debug.setSideArea(neighborAreaId, "campaignWest");
  KageGame.debug.setSideArea(checkpointArea.id, "prologue");
  KageGame.debug.setHealth(10);
  KageGame.debug.setPlayer2d({
    x: checkpoint.x - KageGame.getState().player2d.w / 2,
    y: 273,
    vx: 0,
    vy: 0,
    grounded: true,
  });
  KageGame.debug.step(1 / 60);
  assert.equal(KageGame.getState().health, 10);
  const checkpointIdempotent = KageGame.getState().consumedCheckpoints.includes(
    checkpoint.id,
  );
  assert.equal(checkpointIdempotent, true);

  await KageGame.start({ continue: true });
  KageGame.debug.setSideArea(checkpointArea.id, "prologue");
  KageGame.debug.setHealth(10);
  KageGame.debug.setPlayer2d({
    x: checkpoint.x - KageGame.getState().player2d.w / 2,
    y: 273,
    vx: 0,
    vy: 0,
    grounded: true,
  });
  KageGame.debug.step(1 / 60);
  assert.equal(KageGame.getState().health, 10);

  // Migration : un foyer déjà consommé doit encore résoudre son nouvel objectif.
  KageSave.reset();
  profile = KageSave.load();
  const migratedCheckpointArea = KageLevels.areas["kurokawa-main-street"];
  const migratedCheckpoint = migratedCheckpointArea.checkpoints[0];
  const migratedObjective = migratedCheckpointArea.objectives[0];
  profile.progress.started = true;
  profile.progress.completed = false;
  profile.progress.areaId = migratedCheckpointArea.id;
  profile.progress.spawnId = "campaignWest";
  profile.progress.checkpoint = "older-area-checkpoint";
  profile.progress.consumedCheckpointIds = [migratedCheckpoint.id];
  KageSave.save(profile);
  await KageGame.start({ continue: true });
  KageGame.debug.setPlayer2d({
    x: migratedCheckpoint.x - KageGame.getState().player2d.w / 2,
    y: 273,
    vx: 0,
    vy: 0,
    grounded: true,
  });
  KageGame.debug.step(1 / 60);
  assert.ok(
    KageSave.load().campaign.completedObjectiveIds.includes(migratedObjective.id),
    "Un checkpoint consommé par une ancienne sauvegarde ne doit pas bloquer la campagne.",
  );

  // Une zone réellement nettoyée reste vide après reconstruction du runtime.
  KageSave.reset();
  await KageGame.start();
  const clearedArea = KageLevels.campaignRuntime.linearRoute
    .map((areaId) => KageLevels.areas[areaId])
    .find((area) => ["boss", "defeat-boss"].includes(area.objectives[0].type));
  const clearedObjective = clearedArea.objectives[0];
  KageGame.debug.setSideArea(clearedArea.id, "campaignWest");
  KageGame.debug.clearSide();
  assert.equal(
    KageGame.debug.campaignEvaluate("boss", {
      id: clearedObjective.targetEnemyId,
      aliases: [clearedObjective.targetEnemyId],
    }),
    1,
  );
  assert.ok(
    KageSave.load().campaign.completedZoneIds.includes(clearedArea.campaignZoneId),
  );
  const firstObjectiveReward = { ...KageSave.load().currencies };
  assert.equal(
    KageGame.debug.campaignEvaluate("boss", {
      id: clearedObjective.targetEnemyId,
      aliases: [clearedObjective.targetEnemyId],
    }),
    0,
  );
  assert.deepEqual(
    { ...KageSave.load().currencies },
    firstObjectiveReward,
    "Une récompense d'objectif ne doit jamais être versée deux fois.",
  );
  KageSave.setProgress({
    started: true,
    completed: false,
    areaId: clearedArea.id,
    spawnId: "campaignWest",
  });
  await KageGame.start({ continue: true });
  const reloadedArea = KageGame.debug.areaSnapshot();
  assert.equal(reloadedArea.areaId, clearedArea.id);
  assert.equal(reloadedArea.aliveEnemyIds.length, 0);
  assert.ok(reloadedArea.enemies.every((enemy) => enemy.dead));

  // Les récompenses garanties suffisent à rendre les services atteignables.
  const budget = KageGame.debug.progressionSnapshot().budget;
  assert.ok(budget.guaranteed.mon >= budget.facilityCosts.mon);
  assert.ok(
    budget.guaranteed.tamahagane
      >= budget.facilityCosts.tamahagane
        + budget.facilityCosts.weaponRankFiveTamahagane,
  );
  assert.ok(budget.guaranteed.yomiAsh >= budget.facilityCosts.yomiAsh);
  assert.ok(budget.contracts.mon > 0 && budget.contracts.tamahagane > 0);
  assert.equal(KageGame.debug.progressionSnapshot().rankSMaxSeconds, 10800);

  // Un contrat de boss accepté tard reste solvable sans faire réapparaître le boss.
  profile = KageSave.load();
  profile.bosses["giant-02-aka-ushi"] = true;
  KageSave.save(profile);
  const lateBossQuest = KageGame.campaignAction(
    "accept-quest",
    "contract-broken-yoke",
  );
  assert.equal(lateBossQuest.ok, true);
  assert.equal(lateBossQuest.quest.status, "ready");
  assert.equal(lateBossQuest.quest.progress, 1);
  const lateBossReward = KageGame.campaignAction(
    "claim-quest",
    "contract-broken-yoke",
  );
  assert.equal(lateBossReward.ok, true);

  // Tuer le boss avant ses derniers gardes ne doit ni effacer ces gardes au
  // reload, ni perdre la prime de fin d'acte quand la zone est enfin sécurisée.
  KageSave.reset();
  const actOne = KageLevels.campaignActs["act-01-forest"];
  for (const areaId of actOne.areaIds.slice(0, -1)) {
    const area = KageLevels.areas[areaId];
    KageSave.completeCampaignObjective(area.objectives[0].id, {
      actId: area.actId,
      zoneId: area.campaignZoneId,
      completeZone: true,
    });
  }
  const delayedArea = KageLevels.areas[actOne.areaIds.at(-1)];
  KageSave.setProgress({
    started: true,
    completed: false,
    areaId: delayedArea.id,
    spawnId: "campaignWest",
  });
  await KageGame.start({ continue: true });
  const delayedBossIndex = KageGame.debug.areaSnapshot().enemies.findIndex(
    (enemy) => enemy.boss,
  );
  assert.ok(delayedBossIndex >= 0);
  KageGame.debug.setSideEnemy(delayedBossIndex, {
    hp: 0,
    dying: true,
    dead: false,
  });
  assert.equal(
    KageGame.debug.campaignEvaluate("boss", {
      id: delayedArea.objectives[0].targetEnemyId,
      aliases: [delayedArea.objectives[0].targetEnemyId],
    }),
    1,
  );
  let delayedProfile = KageSave.load();
  assert.equal(
    delayedProfile.campaign.completedZoneIds.includes(delayedArea.campaignZoneId),
    false,
  );
  assert.equal(delayedProfile.campaign.completedActs.includes(actOne.id), false);
  const beforeDelayedClear = {
    currencies: { ...delayedProfile.currencies },
    supplies: delayedProfile.hub.supplies,
    reputation: delayedProfile.hub.reputation,
  };
  KageGame.debug.clearSide();
  KageGame.debug.campaignEvaluate("clear", { id: delayedArea.id });
  delayedProfile = KageSave.load();
  assert.ok(delayedProfile.campaign.completedZoneIds.includes(delayedArea.campaignZoneId));
  assert.ok(delayedProfile.campaign.completedActs.includes(actOne.id));
  assert.equal(delayedProfile.currencies.mon - beforeDelayedClear.currencies.mon, 90);
  assert.equal(
    delayedProfile.currencies.tamahagane - beforeDelayedClear.currencies.tamahagane,
    1,
  );
  assert.equal(delayedProfile.currencies.yomiAsh - beforeDelayedClear.currencies.yomiAsh, 1);
  assert.equal(delayedProfile.hub.supplies - beforeDelayedClear.supplies, 1);
  assert.equal(delayedProfile.hub.reputation - beforeDelayedClear.reputation, 20);
  KageGame.debug.campaignEvaluate("clear", { id: delayedArea.id });
  assert.deepEqual(
    { ...KageSave.load().currencies },
    { ...delayedProfile.currencies },
    "La prime de fin d'acte différée doit rester idempotente.",
  );

  // Les sept sceaux de mission ouvrent la vraie fin sans gonfler le compteur legacy.
  profile = KageSave.load();
  for (const mission of KageLevels.campaignFpsMissions) {
    profile.secrets[mission.secretId] = true;
  }
  const finalArea = KageLevels.areas[KageLevels.campaignRuntime.finalAreaId];
  const finalObjective = finalArea.objectives[0];
  if (!profile.campaign.completedObjectiveIds.includes(finalObjective.id)) {
    profile.campaign.completedObjectiveIds.push(finalObjective.id);
  }
  if (!profile.campaign.completedZoneIds.includes(finalArea.campaignZoneId)) {
    profile.campaign.completedZoneIds.push(finalArea.campaignZoneId);
  }
  profile.progress.started = true;
  profile.progress.completed = false;
  profile.progress.areaId = finalArea.id;
  profile.progress.spawnId = "campaignWest";
  profile.progress.seals = 0;
  KageSave.save(profile);
  await KageGame.start({ continue: true });
  KageGame.debug.setSideArea(finalArea.id, "campaignWest");
  KageGame.debug.clearSide();
  KageGame.debug.step(1 / 60);
  let endingState = KageGame.getState();
  assert.equal(endingState.campaignSeals, 7);
  assert.equal(endingState.campaignSealTotal, 7);
  assert.equal(endingState.legacySeals, 0);
  assert.equal(elements.get("hud-seals").textContent, "7/7");
  const endingPortal = KageGame.debug.warpToPortal(
    KageLevels.campaignRuntime.finalEndingPortalId,
  );
  assert.equal(endingPortal.id, KageLevels.campaignRuntime.finalEndingPortalId);
  KageGame.interact();
  KageGame.interact();
  endingState = KageGame.getState();
  assert.equal(endingState.status, "ended");
  assert.match(elements.get("end-title").textContent, /NEO-EDO/);

  console.log("Progression integrity smoke test passed.");
  console.log(JSON.stringify({
    clearedArea: clearedArea.id,
    upgradeLevel: upgraded.melee.upgradeLevel,
    dojoMultiplier: upgraded.services.masteryGainMultiplier,
    shrineGainReduction: lowShrineGain - highShrineGain,
    checkpointIdempotent,
    guaranteedBudget: budget.guaranteed,
    campaignSeals: endingState.campaignSeals,
    legacySeals: endingState.legacySeals,
    finalArea: KageLevels.campaignRuntime.finalAreaId,
  }, null, 2));
})();
