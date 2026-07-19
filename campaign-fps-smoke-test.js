"use strict";

/*
 * Contrat executable de l'alternance 2D/FPS sur la campagne complete.
 *
 * Le test verifie les donnees (sept actes, cartes et profils semantiques),
 * puis joue la boucle minimale de chaque fin d'acte : sortie verrouillee,
 * entree manuelle, purification, retour dans la zone source et sauvegarde.
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

function findPortal(snapshot, portalId) {
  return snapshot.portals.find((portal) => portal.id === portalId);
}

(async () => {
  const missions = global.KageLevels.campaignFpsMissions;
  const profiles = global.KageLevels.visualStandards.fpsMaterials.profiles;
  const acts = Object.values(global.KageLevels.campaignActs)
    .sort((left, right) => left.order - right.order);

  assert.equal(missions.length, 7, "Une mission FPS obligatoire est attendue par acte");
  assert.deepEqual(
    missions.map((mission) => mission.missionIndex),
    [5, 6, 7, 8, 9, 10, 11],
    "Les cinq missions historiques doivent conserver les indices 0..4",
  );
  assert.deepEqual(
    [...new Set(missions.map((mission) => mission.actId))],
    acts.map((act) => act.id),
    "L'alternance FPS doit couvrir les sept actes",
  );

  for (const mission of missions) {
    assert.ok(
      Number.isInteger(mission.mapIndex) && mission.mapIndex >= 0 && mission.mapIndex < 5,
      `${mission.id}: mapIndex doit reutiliser une des cinq cartes composees`,
    );
    assert.ok(profiles[mission.materialProfile], `${mission.id}: profil semantique inconnu`);
    assert.equal(mission.required, true, `${mission.id}: mission non obligatoire`);
    assert.equal(mission.optional, false, `${mission.id}: mission marquee optionnelle`);

    const area = global.KageLevels.areas[mission.sourceAreaId];
    const fpsPortal = area.portals.find(
      (portal) => portal.id === `campaign-fps-${mission.id}`,
    );
    const forwardPortal = area.portals.find(
      (portal) => portal.id === area.objectivePortalId,
    );
    assert.ok(fpsPortal, `${mission.id}: portail FPS absent`);
    assert.equal(fpsPortal.type, "fps");
    assert.equal(fpsPortal.interaction, "manual");
    assert.equal(fpsPortal.interactionKey, "E");
    assert.equal(fpsPortal.missionIndex, mission.missionIndex);
    assert.equal(fpsPortal.returnAreaId, area.id);
    assert.equal(forwardPortal.requiresFpsMissionId, mission.id);
    assert.equal(forwardPortal.requiresFpsPurification, true);
  }

  global.KageSave.reset();
  await global.KageGame.start();

  for (const mission of missions) {
    const area = global.KageLevels.areas[mission.sourceAreaId];
    const fpsPortalId = `campaign-fps-${mission.id}`;
    const forwardPortalId = area.objectivePortalId;

    global.KageGame.debug.setSideArea(area.id, "campaignFpsReturn");
    global.KageGame.debug.clearSide();
    const sideObjective = area.objectives[0];
    if (sideObjective.completionMethod === "enemy-death") {
      global.KageGame.debug.campaignEvaluate("boss", {
        id: sideObjective.targetEnemyId,
        aliases: [sideObjective.targetEnemyId],
      });
    } else if (sideObjective.completionMethod === "area-clear") {
      global.KageGame.debug.campaignEvaluate("clear", { id: area.id });
    }
    let snapshot = global.KageGame.debug.areaSnapshot();
    assert.equal(
      findPortal(snapshot, forwardPortalId)?.locked,
      true,
      `${mission.id}: la sortie doit rester fermee apres le combat 2D`,
    );

    const fpsPortal = global.KageGame.debug.warpToPortal(fpsPortalId);
    assert.equal(fpsPortal?.id, fpsPortalId, `${mission.id}: portail manuel inaccessible`);
    assert.equal(global.KageGame.getState().mode, "side");
    global.KageGame.interact();

    let state = global.KageGame.getState();
    assert.equal(state.mode, "fps", `${mission.id}: la vue FPS ne s'active pas`);
    assert.equal(state.fpsMissionId, mission.id);
    assert.equal(state.fpsCampaignMission, true);
    assert.equal(state.fpsMapIndex, mission.mapIndex);
    const mapSnapshot = global.KageGame.debug.fpsMissionSnapshot();
    assert.ok(mapSnapshot.rows >= 15 && mapSnapshot.columns >= 15);
    assert.equal(mapSnapshot.startWalkable, true, `${mission.id}: depart hors carte`);
    assert.equal(mapSnapshot.altarWalkable, true, `${mission.id}: autel hors carte`);
    assert.deepEqual(
      mapSnapshot.invalidEnemyPositions,
      [],
      `${mission.id}: ennemi place dans un mur`,
    );

    global.KageGame.debug.clearFps();
    global.KageGame.debug.warpToAltar();
    global.KageGame.interact();

    state = global.KageGame.getState();
    assert.equal(state.mode, "side", `${mission.id}: la mission ne rend pas la vue 2D`);
    assert.equal(state.sideAreaId, area.id, `${mission.id}: retour dans la mauvaise zone`);
    assert.equal(state.fpsPurified, true, `${mission.id}: purification non enregistree`);
    assert.equal(
      global.KageSave.load().secrets[mission.secretId],
      true,
      `${mission.id}: purification absente de la sauvegarde`,
    );

    snapshot = global.KageGame.debug.areaSnapshot();
    const unlockedForward = findPortal(snapshot, forwardPortalId);
    assert.equal(
      unlockedForward?.locked,
      false,
      `${mission.id}: la sortie reste fermee apres purification (${unlockedForward?.lockMessage || "sans message"})`,
    );
  }

  /*
   * Un rechargement reconstruit les missions depuis les secrets sauvegardes.
   * La premiere sortie doit donc rester ouverte sans rejouer son interieur.
   */
  await global.KageGame.start({ continue: true });
  const first = missions[0];
  global.KageGame.debug.setSideArea(first.sourceAreaId, "campaignFpsReturn");
  global.KageGame.debug.clearSide();
  const persistedSnapshot = global.KageGame.debug.areaSnapshot();
  assert.equal(
    findPortal(
      persistedSnapshot,
      global.KageLevels.areas[first.sourceAreaId].objectivePortalId,
    )?.locked,
    false,
    "La purification FPS doit survivre au rechargement",
  );

  console.log("Campaign FPS smoke test passed.");
  console.log(JSON.stringify({
    legacyMissionsPreserved: 5,
    campaignMissions: missions.length,
    coveredActs: new Set(missions.map((mission) => mission.actId)).size,
    semanticProfiles: new Set(missions.map((mission) => mission.materialProfile)).size,
    persistedPurifications: missions.filter(
      (mission) => global.KageSave.load().secrets[mission.secretId],
    ).length,
  }, null, 2));
})();
