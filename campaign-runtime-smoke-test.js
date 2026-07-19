"use strict";

/*
 * Contrat executable de la campagne 7 actes / 28 zones.
 *
 * Ce test ne simule pas le combat : il verifie que chaque objectif annonce
 * une aire chargeable, un checkpoint, des assets livres, des ennemis reels et
 * deux passages manuels. Les objectifs de boss doivent en plus pointer vers
 * une definition `boss: true` presente dans la meme aire.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { KageLevels } = require("./level-data.js");

global.window = global;
require("./campaign-expansion.js");
const campaign = global.KageCampaignExpansion;

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, relativePath), "utf8"));
}

function collectManifestIds(relativePaths, collectionKey = "sprites") {
  const ids = new Set();
  for (const relativePath of relativePaths) {
    const manifest = readJson(relativePath);
    for (const entry of manifest[collectionKey] || manifest.entries || []) {
      ids.add(entry.id);
    }
  }
  return ids;
}

const environmentIds = collectManifestIds([
  "assets/modular/environments/kai-forest/props/manifest.json",
  "assets/modular/environments/bamboo-shrine/props/manifest.json",
  "assets/modular/environments/tsuru-fields/props/manifest.json",
  "assets/modular/environments/kurokawa/props/manifest.json",
  "assets/modular/environments/daimyo-castle/props/manifest.json",
  "assets/modular/environments/contemporary-japan/props/manifest.json",
  "assets/modular/environments/cyberpunk-japan/props/manifest.json",
  "assets/modular/environments/kurokawa/alley-walls/sprites/manifest.json",
]);

const enemyIds = collectManifestIds([
  "assets/modular/manifests/regular.json",
  "assets/modular/manifests/special.json",
  "assets/modular/manifests/miniboss.json",
  "assets/modular/manifests/boss.json",
  "assets/modular/manifests/giant.json",
  "assets/modular/manifests/legacy.json",
], "entries");

const runtimeBossEntries = new Map(
  [
    ...readJson("assets/modular/manifests/boss.json").entries,
    ...readJson("assets/modular/manifests/miniboss.json").entries,
  ].map((entry) => [entry.id, entry]),
);
for (const id of [
  "new-modern-metro-colossus",
  "new-cyber-yomi-hacker",
  "new-cyber-shogun-zero",
]) {
  const entry = runtimeBossEntries.get(id);
  assert.ok(entry, `${id}: manifeste de personnage absent`);
  assert.ok(entry.paths?.sprite, `${id}: sprite.json non reference`);
  assert.ok(fs.existsSync(path.join(__dirname, entry.paths.sprite)), `${id}: sprite.json absent`);
  const sprite = readJson(entry.paths.sprite);
  assert.deepEqual(
    Object.keys(sprite.animations || {}),
    ["idle", "move", "attack", "hurt", "death"],
    `${id}: les cinq planches runtime sont incompletes`,
  );
  for (const [animation, frames] of Object.entries(sprite.animations)) {
    assert.equal(frames.length, 6, `${id}/${animation}: six frames attendues`);
    for (const frame of frames) {
      assert.ok(
        fs.existsSync(path.join(__dirname, entry.folder, frame.file)),
        `${id}/${animation}: frame absente ${frame.file}`,
      );
    }
  }
  assert.equal(sprite.weaponsBakedIntoBody, false, `${id}: arme integree au corps interdite`);
}

const runtime = KageLevels.campaignRuntime;
const acts = Object.values(KageLevels.campaignActs || {})
  .sort((left, right) => left.order - right.order);
const route = runtime.linearRoute.map((areaId) => KageLevels.areas[areaId]);
const manualObjectiveTypes = new Set([
  "destroy-nodes",
  "purify",
  "refuge",
  "rescue",
  "retrieval",
  "upgrade",
  "world-state",
]);

assert.equal(KageLevels.schema, 2);
assert.equal(runtime.schema, 2);
assert.equal(runtime.status, "playable-data");
assert.equal(runtime.totalActs, 7);
assert.equal(runtime.totalZones, 28);
assert.equal(runtime.routeLinks.length, 27);
assert.equal(Object.keys(KageLevels.areas).length, 28);
assert.equal(new Set(runtime.linearRoute).size, 28);
assert.equal(acts.length, 7);
assert.deepEqual(acts.map((act) => act.order), [1, 2, 3, 4, 5, 6, 7]);
assert.equal(route[0].id, KageLevels.startAreaId);
assert.equal(route.at(-1).id, runtime.finalAreaId);

for (const [routeIndex, area] of route.entries()) {
  assert.ok(area, `Route ${routeIndex}: aire absente`);
  assert.equal(area.campaignRouteIndex, routeIndex, `${area.id}: index de route incoherent`);
  assert.ok(area.actId, `${area.id}: actId absent`);
  assert.ok(area.campaignZoneId, `${area.id}: campaignZoneId absent`);
  assert.equal(
    runtime.zoneToAreaId[area.campaignZoneId],
    area.id,
    `${area.id}: crosswalk zone/aire incoherent`,
  );
  assert.equal(
    runtime.areaToZoneId[area.id],
    area.campaignZoneId,
    `${area.id}: crosswalk aire/zone incoherent`,
  );
  assert.ok(area.width >= 2400, `${area.id}: zone trop courte`);
  assert.ok(area.routeMetrics?.mainRoute.startsWith("horizontal"), `${area.id}: route non horizontale`);
  if (!["building", "castle"].includes(area.zoneKind)) {
    assert.equal(area.routeMetrics?.requiredClimb, 0, `${area.id}: ascension obligatoire interdite`);
  }
  assert.ok(area.groundSegments?.length >= 1, `${area.id}: sol absent`);
  assert.ok(area.props?.length >= 10, `${area.id}: composition de props trop pauvre`);
  assert.ok(area.platforms?.length >= 2, `${area.id}: plateformes jouables insuffisantes`);
  assert.ok(area.enemies?.length >= 4, `${area.id}: rencontre trop courte`);
  assert.ok(area.checkpoints?.length >= 1, `${area.id}: checkpoint absent`);
  assert.ok(area.objectives?.length === 1, `${area.id}: objectif runtime absent`);
  assert.equal(area.objectiveIds[0], area.objectives[0].id, `${area.id}: objectif desynchronise`);
  assert.ok(area.completionGate?.objectiveId, `${area.id}: completionGate absent`);
  assert.equal(area.checkpointPolicy?.mode, "persistent-area", `${area.id}: checkpoint non persistant`);

  const objective = area.objectives[0];
  assert.equal(KageLevels.campaignObjectives[objective.id].areaId, area.id);
  assert.equal(campaign.objectives[objective.id].runtimeAreaId, area.id);
  const expectedCompletionMethod = objective.type === "boss"
    ? "enemy-death"
    : (["investigate", "breach"].includes(objective.type)
      ? "checkpoint-reach"
      : (objective.type === "defense" ? "area-clear" : "manual-targets"));
  assert.equal(
    objective.completionMethod,
    expectedCompletionMethod,
    `${area.id}: méthode d'objectif encore générique`,
  );
  assert.ok(objective.targetCount >= 1, `${area.id}: compteur cible absent`);
  assert.equal(
    objective.targetIds.length,
    objective.targetCount,
    `${area.id}: identités de cibles incomplètes`,
  );
  if (manualObjectiveTypes.has(objective.type)) {
    assert.equal(
      area.objectiveTargets.length,
      objective.targetCount,
      `${area.id}: cibles manuelles visibles absentes`,
    );
    for (const target of area.objectiveTargets) {
      const prop = area.props.find((entry) => entry.id === target.propId);
      const portal = area.portals.find((entry) => entry.id === target.portalId);
      assert.ok(prop, `${area.id}/${target.id}: sprite objectif absent`);
      assert.equal(prop.objectiveTargetId, target.id);
      assert.equal(prop.colliderProfile?.blocksMovement, false);
      assert.ok(portal, `${area.id}/${target.id}: interaction manuelle absente`);
      assert.equal(portal.type, "objective");
      assert.equal(portal.objectiveTarget, true);
      assert.equal(portal.objectiveTargetId, target.id);
      assert.equal(portal.interaction, "manual");
      assert.equal(portal.interactionKey, "E");
      assert.equal(portal.destination, undefined, `${target.id}: une cible ne doit pas être une sortie`);
      for (const otherPortal of area.portals.filter((entry) => entry.id !== portal.id)) {
        assert.ok(
          Math.abs(Number(otherPortal.x) - Number(portal.x)) >= 120,
          `${area.id}: interaction ambiguë entre ${portal.id} et ${otherPortal.id}`,
        );
      }
    }
  } else {
    assert.equal(
      area.objectiveTargets?.length || 0,
      0,
      `${area.id}: cible manuelle inattendue`,
    );
  }
  if (objective.type === "destroy-nodes") {
    assert.equal(objective.targetCount, 3, `${area.id}: trois noeuds requis`);
  }
  if (objective.type === "rescue") {
    assert.equal(objective.targetCount, 2, `${area.id}: deux survivants requis`);
  }
  if (objective.targetEnemyId) {
    const target = area.enemies.find(
      (enemy) => enemy.rosterId === objective.targetEnemyId && enemy.boss,
    );
    assert.ok(target, `${area.id}: cible ${objective.targetEnemyId} absente`);
    assert.equal(target.boss, true, `${area.id}: cible ${objective.targetEnemyId} non marquee boss`);
    assert.ok(target.encounterId, `${area.id}: cible boss sans encounterId`);
    assert.ok(
      area.encounters.some((encounter) => encounter.id === target.encounterId),
      `${area.id}: rencontre ${target.encounterId} absente`,
    );
  }

  for (const portal of (area.portals || []).filter((entry) =>
    String(entry.id).startsWith("campaign-"))) {
    assert.equal(portal.interaction, "manual", `${area.id}/${portal.id}: interaction non manuelle`);
    assert.equal(portal.interactionKey, "E", `${area.id}/${portal.id}: touche manuelle absente`);
  }

  if (area.chapterTags?.includes("campaign-runtime")) {
    for (const prop of area.props) {
      assert.ok(environmentIds.has(prop.file), `${area.id}: sprite de prop absent ${prop.file}`);
      assert.equal(
        prop.colliderProfile?.blocksMovement,
        false,
        `${area.id}/${prop.id}: un decor hors portail bloque la route`,
      );
    }
    for (const enemy of area.enemies) {
      assert.ok(enemyIds.has(enemy.rosterId), `${area.id}: sprite ennemi absent ${enemy.rosterId}`);
    }
  }
}

for (const link of runtime.routeLinks) {
  const fromArea = KageLevels.areas[link.fromAreaId];
  const toArea = KageLevels.areas[link.toAreaId];
  const forward = fromArea.portals.find((portal) => portal.id === link.forwardPortalId);
  const backward = toArea.portals.find((portal) => portal.id === link.backwardPortalId);
  assert.ok(forward, `${link.id}: portail aller absent`);
  assert.ok(backward, `${link.id}: portail retour absent`);
  assert.equal(forward.destination?.areaId, toArea.id, `${link.id}: destination aller invalide`);
  assert.equal(backward.destination?.areaId, fromArea.id, `${link.id}: destination retour invalide`);
  assert.equal(forward.interaction, "manual", `${link.id}: aller automatique interdit`);
  assert.equal(backward.interaction, "manual", `${link.id}: retour automatique interdit`);
  assert.equal(forward.requiresAreaClear, true, `${link.id}: objectif contournable`);
  assert.equal(
    forward.requiresObjectiveId,
    fromArea.objectives[0].id,
    `${link.id}: sortie non verrouillée par l'objectif distinct`,
  );
  assert.notEqual(forward.type, "objective", `${link.id}: la sortie ne doit pas être une cible`);
  assert.equal(link.bidirectional, true, `${link.id}: passage non bidirectionnel`);
  if (fromArea.completionGate.type === "boss") {
    assert.equal(
      forward.unlockEncounterId,
      fromArea.completionGate.encounterId,
      `${link.id}: boss non relie a la porte de sortie`,
    );
  }
}

const canonicalRoutePortalIds = new Set(
  runtime.routeLinks.flatMap((link) => [
    link.forwardPortalId,
    link.backwardPortalId,
  ]),
);
for (const area of route) {
  for (const portal of area.portals || []) {
    if (!portal.destination?.areaId || canonicalRoutePortalIds.has(portal.id)) continue;
    assert.equal(
      portal.excludedFromCampaignRoute,
      true,
      `${area.id}/${portal.id}: passage historique susceptible de contourner la campagne`,
    );
    assert.equal(
      portal.campaignCompatibility,
      "legacy-shortcut",
      `${area.id}/${portal.id}: raccourci sans balise de compatibilite`,
    );
  }
}

for (const portalId of runtime.legacyShortcutPortalIds) {
  const portal = Object.values(KageLevels.areas)
    .flatMap((area) => area.portals || [])
    .find((candidate) => candidate.id === portalId);
  assert.ok(portal, `${portalId}: raccourci historique absent`);
  assert.equal(portal.campaignCompatibility, "legacy-shortcut");
  assert.equal(portal.excludedFromCampaignRoute, true);
}

for (const act of acts) {
  assert.ok(act.areaIds.length >= 3, `${act.id}: acte trop court`);
  assert.equal(act.entryAreaId, act.areaIds[0], `${act.id}: entree incoherente`);
  assert.equal(act.exitAreaId, act.areaIds.at(-1), `${act.id}: sortie incoherente`);
  assert.ok(KageLevels.areas[act.bossAreaId], `${act.id}: aire de boss absente`);
}

const castleAct = KageLevels.campaignActs["act-05-castle"];
assert.deepEqual(
  castleAct.phaseBossEnemyIds,
  ["06-daimyo-corrupted", "giant-10-yomi-no-kanrei"],
  "Le daimyo et Yomi-no-Kanrei doivent former deux phases runtime successives",
);
assert.ok(
  KageLevels.areas["castle-donjon"].enemies.some(
    (enemy) => enemy.boss && enemy.rosterId === "06-daimyo-corrupted",
  ),
);
assert.ok(
  KageLevels.areas["castle-yomi-rift"].enemies.some(
    (enemy) => enemy.boss && enemy.rosterId === "giant-10-yomi-no-kanrei",
  ),
);

const metroArea = KageLevels.areas["modern-metropolitan-lab"];
const metroColossus = metroArea.enemies.find(
  (enemy) => enemy.boss && enemy.rosterId === "new-modern-metro-colossus",
);
assert.ok(metroColossus, "Le Colosse de la ligne Yomi est absent");
assert.equal(metroColossus.presentationClass, "massive");
assert.equal(metroColossus.w, 168);
assert.equal(metroColossus.h, 108);
assert.equal(metroColossus.hp, 96);
assert.ok(
  metroArea.encounters.some(
    (encounter) => encounter.id === metroColossus.encounterId
      && encounter.kind === "massiveBoss",
  ),
  "Le Colosse doit verrouiller une arene massive",
);
const metroProfile = global.KageMassiveBossProfiles?.["new-modern-metro-colossus"]
  || require("./level-data.js").KageMassiveBossProfiles["new-modern-metro-colossus"];
assert.equal(metroProfile.presentationClass, "massive");
assert.ok(metroProfile.render.targetWidthRatio >= 0.5);
assert.ok(metroProfile.render.targetHeightRatio >= 0.55);
assert.ok(
  metroProfile.detachableParts.some((part) =>
    part.weaponId === "metro-car-door" && part.separateSprite),
);

const finalArea = KageLevels.areas[runtime.finalAreaId];
const shogunZero = finalArea.enemies.find(
  (enemy) => enemy.boss && enemy.narrativeId === "new-cyber-shogun-zero",
);
assert.ok(shogunZero, "Le Shogun Zero runtime est absent");
assert.equal(shogunZero.rosterId, "new-cyber-shogun-zero");
const ending = finalArea.portals.find(
  (portal) => portal.id === runtime.finalEndingPortalId,
);
assert.ok(ending, "Le portail final est absent");
assert.equal(ending.type, "ending");
assert.equal(ending.unlockEncounterId, shogunZero.encounterId);
assert.equal(ending.requiresAreaClear, true);
assert.equal(ending.requiresConfirmation, true);

const report = {
  acts: acts.length,
  zones: route.length,
  routeLinks: runtime.routeLinks.length,
  runtimePortals: route.reduce(
    (sum, area) => sum + area.portals.filter((portal) =>
      String(portal.id).startsWith("campaign-")).length,
    0,
  ),
  objectives: Object.keys(KageLevels.campaignObjectives).length,
  checkpoints: route.reduce((sum, area) => sum + area.checkpoints.length, 0),
  props: route.reduce((sum, area) => sum + area.props.length, 0),
  platforms: route.reduce((sum, area) => sum + area.platforms.length, 0),
  enemies: route.reduce((sum, area) => sum + area.enemies.length, 0),
  bossObjectives: route.filter((area) => area.objectives[0].targetEnemyId).length,
  authoredNonBossObjectives: route.filter(
    (area) => area.objectives[0].completionMethod !== "enemy-death",
  ).length,
  manualObjectiveTargets: route.reduce(
    (sum, area) => sum + (area.objectiveTargets?.length || 0),
    0,
  ),
};

assert.equal(report.authoredNonBossObjectives, 19);

console.log("Campaign runtime smoke test passed.");
console.log(JSON.stringify(report, null, 2));
