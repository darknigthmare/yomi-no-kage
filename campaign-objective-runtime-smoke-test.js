"use strict";

/*
 * Contrat VM des objectifs de campagne non combattants.
 *
 * Le test joue les interactions réelles au clavier simulé : une sortie ne
 * valide jamais son objectif, les cibles sont dédupliquées, les compteurs
 * survivent à Continue et le passage vers la zone suivante ne s'ouvre
 * qu'après objectif + sécurisation de la zone.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modularRegistry = JSON.parse(
  fs.readFileSync(path.join(__dirname, "assets", "modular", "registry.json"), "utf8"),
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
  getItem(key) { return storage.has(String(key)) ? storage.get(String(key)) : null; },
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
global.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};
global.fetch = async (url) => {
  if (String(url).startsWith("assets/modular/registry.json")) {
    return { ok: true, status: 200, json: async () => modularRegistry };
  }
  return { ok: false, status: 404, json: async () => ({}) };
};

require("./level-data.js");
require("./arsenal.js");
require("./save.js");
require("./game.js");

function objectiveState(objectiveId) {
  return global.KageSave.load().campaign.objectiveStates[objectiveId] || {};
}

function areaSnapshot() {
  return global.KageGame.debug.areaSnapshot();
}

function portalSnapshot(portalId) {
  return areaSnapshot().portals.find((portal) => portal.id === portalId);
}

function warpAndInteract(portalId) {
  const portal = global.KageGame.debug.warpToPortal(portalId);
  assert.ok(portal, `${portalId}: portail introuvable`);
  global.KageGame.interact();
}

function clearArea() {
  global.KageGame.debug.clearSide();
}

function targetPortals(areaId) {
  const area = global.KageLevels.areas[areaId];
  return area.objectiveTargets.map((target) => target.portalId);
}

function completeManualObjective(areaId, options = {}) {
  const area = global.KageLevels.areas[areaId];
  const objective = area.objectives[0];
  global.KageGame.debug.setSideArea(areaId, "campaignWest");
  if (options.clear) clearArea();
  for (const portalId of targetPortals(areaId)) {
    warpAndInteract(portalId);
  }
  const state = objectiveState(objective.id);
  assert.equal(state.completed, true, `${objective.id}: objectif manuel non terminé`);
  assert.equal(state.progress, objective.targetCount, `${objective.id}: compteur final incorrect`);
  assert.equal(
    new Set(state.interactedTargetIds).size,
    objective.targetCount,
    `${objective.id}: cibles non dédupliquées`,
  );
  return { area, objective, state };
}

(async () => {
  global.KageSave.reset();
  await global.KageGame.start();

  const destroyArea = global.KageLevels.areas["shigure-bamboo-grove"];
  const destroyObjective = destroyArea.objectives[0];
  const destroyForwardId = destroyArea.objectivePortalId;
  global.KageGame.debug.setSideArea(destroyArea.id, "campaignWest");
  clearArea();

  assert.equal(
    portalSnapshot(destroyForwardId).locked,
    true,
    "La sortie doit être verrouillée avant les trois cibles",
  );
  warpAndInteract(destroyForwardId);
  assert.equal(
    objectiveState(destroyObjective.id).completed,
    undefined,
    "La sortie ne doit jamais compléter elle-même l'objectif",
  );
  assert.equal(global.KageGame.getState().sideAreaId, destroyArea.id);

  const destroyTargets = targetPortals(destroyArea.id);
  warpAndInteract(destroyTargets[0]);
  let destroyState = objectiveState(destroyObjective.id);
  assert.equal(destroyState.progress, 1);
  assert.equal(destroyState.target, 3);

  await global.KageGame.start({ continue: true });
  assert.equal(
    global.KageGame.getState().sideAreaId,
    destroyArea.id,
    "Continue doit reprendre dans la zone de l'objectif",
  );
  destroyState = objectiveState(destroyObjective.id);
  assert.equal(destroyState.progress, 1, "Continue doit conserver le compteur partiel");
  assert.deepEqual(
    destroyState.interactedTargetIds,
    [destroyObjective.targetIds[0]],
    "Continue doit conserver l'identité de la cible déjà détruite",
  );

  warpAndInteract(destroyTargets[0]);
  assert.equal(
    objectiveState(destroyObjective.id).progress,
    1,
    "Une même cible ne doit pas compter deux fois",
  );
  warpAndInteract(destroyTargets[1]);
  warpAndInteract(destroyTargets[2]);
  assert.equal(objectiveState(destroyObjective.id).completed, true);
  clearArea();
  assert.equal(portalSnapshot(destroyForwardId).locked, false);

  warpAndInteract(destroyForwardId);
  for (let index = 0; index < 32; index += 1) {
    global.KageGame.debug.step(1 / 60);
  }
  assert.equal(
    global.KageGame.getState().sideAreaId,
    "bamboo-hollow-path",
    "Le passage doit fonctionner après l'objectif",
  );

  const rescue = completeManualObjective("bamboo-hollow-path");
  assert.equal(rescue.objective.type, "rescue");
  assert.equal(rescue.state.target, 2);
  assert.equal(
    global.KageSave.load().campaign.completedZoneIds.includes(
      rescue.area.campaignZoneId,
    ),
    false,
    "Un objectif accompli ne doit pas effacer les ennemis encore vivants au rechargement",
  );
  await global.KageGame.start({ continue: true });
  global.KageGame.debug.setSideArea(rescue.area.id, "campaignWest");
  assert.ok(
    areaSnapshot().aliveEnemyIds.length > 0,
    "Les ennemis vivants doivent survivre au rechargement tant que la zone n'est pas sécurisée",
  );
  clearArea();
  global.KageGame.debug.campaignEvaluate("clear", { id: rescue.area.id });
  assert.ok(
    global.KageSave.load().campaign.completedZoneIds.includes(
      rescue.area.campaignZoneId,
    ),
    "La zone doit devenir persistante dès que l'objectif et le nettoyage sont tous deux accomplis",
  );

  const worldState = completeManualObjective("modern-subway-station");
  assert.equal(worldState.objective.type, "world-state");
  assert.equal(worldState.state.target, 2);

  const retrieval = completeManualObjective("modern-quarantine-hospital");
  assert.equal(retrieval.objective.type, "retrieval");
  assert.equal(retrieval.state.target, 1);

  const purifyArea = global.KageLevels.areas["forest-abandoned-camp"];
  const purifyObjective = purifyArea.objectives[0];
  global.KageGame.debug.setSideArea(purifyArea.id, "campaignWest");
  warpAndInteract(targetPortals(purifyArea.id)[0]);
  assert.equal(
    objectiveState(purifyObjective.id).progress,
    undefined,
    "La purification gardée ne doit pas progresser avant sécurisation",
  );
  const purify = completeManualObjective(purifyArea.id, { clear: true });
  assert.equal(purify.objective.type, "purify");
  assert.equal(purify.state.target, 1);

  /*
   * Parcours contractuel exhaustif : les 28 zones sont résolues avec leur
   * déclencheur réel, les sept intérieurs FPS sont purifiés, puis chaque porte
   * avant est franchie. Cela détecte un objectif isolé, une sortie qui se
   * déverrouille trop tôt ou une transition qui mène dans la mauvaise aire.
   */
  global.KageSave.reset();
  await global.KageGame.start();
  const route = global.KageLevels.campaignRuntime.linearRoute;
  for (const [routeIndex, areaId] of route.entries()) {
    const area = global.KageLevels.areas[areaId];
    const objective = area.objectives[0];
    global.KageGame.debug.setSideArea(area.id, "campaignWest");

    if (objective.completionMethod === "checkpoint-reach") {
      const checkpoint = area.checkpoints.find((entry) =>
        objective.targetIds.includes(entry.id));
      assert.ok(checkpoint, `${area.id}: foyer objectif introuvable`);
      global.KageGame.debug.setPlayer2d({
        x: checkpoint.x - global.KageGame.getState().player2d.w / 2,
        y: 273,
        vx: 0,
        vy: 0,
        grounded: true,
      });
      global.KageGame.debug.step(1 / 60);
    } else if (objective.completionMethod === "manual-targets") {
      if (area.objectiveTargets.some((target) => target.requiresAreaClear)) clearArea();
      for (const portalId of targetPortals(area.id)) warpAndInteract(portalId);
    } else if (objective.completionMethod === "enemy-death") {
      clearArea();
      global.KageGame.debug.campaignEvaluate("boss", {
        id: objective.targetEnemyId,
        aliases: [objective.targetEnemyId],
      });
    } else if (objective.completionMethod === "area-clear") {
      clearArea();
      global.KageGame.debug.campaignEvaluate("clear", { id: area.id });
    } else {
      assert.fail(`${area.id}: méthode d'objectif sans résolveur`);
    }

    if (areaSnapshot().aliveEnemyIds.length) clearArea();
    global.KageGame.debug.campaignEvaluate("clear", { id: area.id });
    assert.equal(
      objectiveState(objective.id).completed,
      true,
      `${area.id}: objectif non résolu pendant le parcours complet`,
    );
    assert.ok(
      global.KageSave.load().campaign.completedZoneIds.includes(area.campaignZoneId),
      `${area.id}: zone sécurisée non persistée`,
    );

    if (area.requiredFpsMissionId) {
      const fpsPortalId = `campaign-fps-${area.requiredFpsMissionId}`;
      warpAndInteract(fpsPortalId);
      assert.equal(global.KageGame.getState().mode, "fps", `${area.id}: entrée FPS impossible`);
      global.KageGame.debug.clearFps();
      global.KageGame.debug.warpToAltar();
      global.KageGame.interact();
      assert.equal(global.KageGame.getState().mode, "side", `${area.id}: retour FPS impossible`);
      assert.equal(
        global.KageSave.load().secrets[
          global.KageLevels.campaignFpsMissions.find(
            (mission) => mission.id === area.requiredFpsMissionId,
          ).secretId
        ],
        true,
        `${area.id}: purification FPS non persistée`,
      );
    }

    const forward = portalSnapshot(area.objectivePortalId);
    assert.equal(
      forward.locked,
      false,
      `${area.id}: sortie encore verrouillée (${forward.lockMessage || "sans motif"})`,
    );
    if (routeIndex === route.length - 1) continue;
    const authoredForward = area.portals.find((portal) => portal.id === area.objectivePortalId);
    warpAndInteract(authoredForward.id);
    if (authoredForward.requiresConfirmation) global.KageGame.interact();
    for (let frame = 0; frame < 36; frame += 1) {
      global.KageGame.debug.step(1 / 60);
    }
    assert.equal(
      global.KageGame.getState().sideAreaId,
      route[routeIndex + 1],
      `${area.id}: la sortie ne rejoint pas ${route[routeIndex + 1]}`,
    );
  }

  console.log("Campaign objective runtime smoke test passed.");
  console.log(JSON.stringify({
    coveredTypes: ["destroy-nodes", "rescue", "world-state", "retrieval", "purify"],
    persistedAfterContinue: true,
    duplicateTargetsRejected: true,
    reloadBypassRejected: true,
    forwardTraversalVerified: true,
    fullRouteZonesTraversed: route.length,
    campaignFpsPurified: global.KageLevels.campaignFpsMissions.length,
    completedObjectiveIds: global.KageSave.load().campaign.completedObjectiveIds.length,
  }, null, 2));
})();
