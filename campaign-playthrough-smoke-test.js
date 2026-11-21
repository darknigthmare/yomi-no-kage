"use strict";

/*
 * Preuve de parcours séquentiel de la campagne (P0.3, partie automatisable).
 *
 * `campaign-runtime-smoke-test.js` valide la forme des données — portes,
 * objectifs, bosses, assets — et le codex a son propre contrat. Ce test ne
 * vérifie donc que ce qu'un playthrough ajoute : l'état de sauvegarde après
 * 28 zones jouées dans l'ordre, et l'absence de double récompense.
 *
 * Il ne simule ni le combat ni le rendu : un playthrough humain reste requis
 * pour les critères visuels et de difficulté.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const { KageLevels } = require("./level-data.js");

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

const payloads = new Map();
class TestCustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
}
const window = {
  localStorage: {
    getItem: (key) => payloads.get(key) || null,
    setItem: (key, value) => payloads.set(key, String(value)),
    removeItem: (key) => payloads.delete(key),
  },
  CustomEvent: TestCustomEvent,
  dispatchEvent: () => {},
};
const context = { window, CustomEvent: TestCustomEvent, console };
context.globalThis = context;
vm.createContext(context);
for (const file of ["codex-data.js", "codex.js", "save.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), "utf8"), context, {
    filename: file,
  });
}

const save = window.KageSave;
const codex = window.KageCodex;
const acts = Object.values(KageLevels.campaignActs).sort(
  (left, right) => left.order - right.order,
);
const routeZoneIds = KageLevels.campaignRuntime.linearRoute.map(
  (areaId) => KageLevels.areas[areaId].campaignZoneId,
);

const PROLOGUE_ENTRIES = 5;
const CHRONICLE_SEALS = 7;

function objectivePatch(area, act, isLastArea, nextAct) {
  return {
    reason: "playthrough",
    actId: act.id,
    zoneId: area.campaignZoneId,
    completeZone: true,
    completeAct: isLastArea,
    nextActId: isLastArea ? nextAct?.id || "" : "",
    reward: { mon: 10, tamahagane: 1, yomiAsh: 1, supplies: 1, reputation: 2 },
    actCompletionReward: isLastArea
      ? { mon: 90, tamahagane: 1, yomiAsh: 1, supplies: 1, reputation: 20 }
      : undefined,
  };
}

function completeArea(area, act) {
  const index = act.areaIds.indexOf(area.id);
  const isLastArea = index === act.areaIds.length - 1;
  const nextAct = acts.find((candidate) => candidate.order === act.order + 1);
  save.completeCampaignObjective(
    area.objectives[0].id,
    objectivePatch(area, act, isLastArea, nextAct),
  );
}

function playCampaign() {
  save.reset();
  const start = save.load();
  assert.equal(start.campaign.completedZoneIds.length, 0);
  assert.equal(start.campaign.unlockedActs.length, 1, "un seul acte ouvert au départ");
  assert.equal(codex.openPrologue(start), PROLOGUE_ENTRIES);
  save.save(start);

  for (const act of acts) {
    for (const areaId of act.areaIds) {
      const area = KageLevels.areas[areaId];
      assert.ok(area, `acte ${act.order} : aire absente ${areaId}`);
      save.visitCampaignZone(area.campaignZoneId, act.id, act.order);
      completeArea(area, act);
    }
    // Rechargement réel entre deux actes : l'accomplissement et le sceau
    // doivent déjà être sur le disque, pas seulement en mémoire.
    const profile = save.load();
    assert.ok(codex.grantSeal(profile, act.order) > 0, `acte ${act.order} : sceau non ouvert`);
    save.save(profile);
    const reloaded = save.load();
    assert.ok(
      reloaded.campaign.completedActs.includes(act.id),
      `acte ${act.order} : accomplissement perdu au rechargement`,
    );
    assert.ok(
      reloaded.codex.unlocked.includes(`chronicle-0${act.order}`),
      `acte ${act.order} : sceau perdu au rechargement`,
    );
  }
  return save.load();
}

let profile = null;

check("le parcours accomplit 28 zones, 28 objectifs, 7 actes et 7 sceaux", () => {
  profile = playCampaign();
  assert.equal(profile.campaign.visitedZoneIds.length, 28, "28 zones visitées");
  assert.equal(profile.campaign.completedZoneIds.length, 28, "28 zones nettoyées");
  assert.equal(profile.campaign.completedObjectiveIds.length, 28, "28 objectifs persistés");
  assert.equal(profile.campaign.completedActs.length, 7, "7 actes accomplis");
  // Comparaison JSON : les objets du contexte VM n'ont pas le prototype de l'hôte.
  assert.equal(
    JSON.stringify(profile.campaign.completedActs),
    JSON.stringify(acts.map((act) => act.id)),
    "les actes sont accomplis dans l'ordre",
  );
  assert.equal(
    JSON.stringify(profile.campaign.visitedZoneIds),
    JSON.stringify(routeZoneIds),
    "la route suit exactement l'ordre canonique",
  );
  const summary = codex.summary(profile);
  assert.equal(summary.families.seals.unlocked, CHRONICLE_SEALS, "7 sceaux de chronique");
  // 80 fiches de chronique (5 prologue + 75 par acte) et 7 sceaux.
  assert.equal(
    profile.codex.unlocked.length,
    summary.families.chronicle.total + CHRONICLE_SEALS,
    "toutes les fiches de chronique doivent être ouvertes",
  );
});

check("aucune récompense n'est versée deux fois et une zone ne se rejoue pas", () => {
  const before = save.load();
  for (const act of acts) {
    for (const areaId of act.areaIds) completeArea(KageLevels.areas[areaId], act);
  }

  const after = save.load();
  assert.equal(
    JSON.stringify(after.currencies),
    JSON.stringify(before.currencies),
    "les monnaies ont été reversées",
  );
  assert.equal(after.hub.supplies, before.hub.supplies, "les provisions ont été reversées");
  assert.equal(after.hub.reputation, before.hub.reputation, "la réputation a été reversée");
  assert.equal(after.campaign.completedObjectiveIds.length, 28, "objectif compté deux fois");
  assert.equal(after.campaign.completedActs.length, 7, "acte compté deux fois");
  assert.equal(after.campaign.completedZoneIds.length, 28, "zone nettoyée dupliquée");
});

if (failures.length) {
  console.error(
    `\nPlaythrough smoke test : ${successes.length} contrat(s) valide(s), ${failures.length} manquant(s).`,
  );
  failures.forEach((failure, index) => {
    console.error(`${index + 1}. ${failure.name}`);
    console.error(`   ${failure.message}`);
  });
  process.exitCode = 1;
} else {
  console.log(
    `\nPlaythrough smoke test OK — 28 zones, 28 objectifs, 7 actes, 7 sceaux, `
      + `${profile?.codex?.unlocked?.length || 0} entrées de codex`,
  );
}
