"use strict";

/*
 * Validation statique du contrat de campagne longue.
 *
 * Le test contrôle les références croisées et les graphes sans charger le
 * moteur. Une future zone ne peut donc pas être annoncée avec un portail,
 * un roster, une animation ou un objectif absent du registre.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

global.window = global;
require("./campaign-expansion.js");

const campaign = global.KageCampaignExpansion;
assert.ok(campaign, "KageCampaignExpansion doit être exposé");
assert.equal(campaign.schema, 1);
assert.equal(campaign.acts.length, 7, "La campagne doit contenir exactement sept actes");
assert.equal(Object.isFrozen(campaign), true, "Le contrat doit être immuable");

const expectedBiomes = [
  "forest",
  "bamboo-grove",
  "rice-fields",
  "fortified-city",
  "castle",
  "contemporary-japan",
  "cyberpunk-japan",
];
assert.deepEqual(campaign.acts.map((act) => act.biomeId), expectedBiomes);
assert.deepEqual(campaign.acts.map((act) => act.order), [1, 2, 3, 4, 5, 6, 7]);

function collectExistingEnemyIds() {
  const ids = new Set();
  for (const manifestName of ["regular", "special", "miniboss", "boss", "giant"]) {
    const manifestPath = path.join(
      __dirname,
      "assets",
      "modular",
      "manifests",
      `${manifestName}.json`,
    );
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    for (const entry of manifest.entries || []) ids.add(entry.id);
  }
  return ids;
}

function collectExistingWeaponIds() {
  const manifestPath = path.join(
    __dirname,
    "assets",
    "modular",
    "manifests",
    "weapons.json",
  );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return new Set((manifest.entries || []).map((entry) => entry.id));
}

function assertUnique(ids, label) {
  const seen = new Set();
  for (const id of ids) {
    assert.equal(typeof id, "string", `${label}: identifiant non textuel`);
    assert.ok(id.length > 0, `${label}: identifiant vide`);
    assert.equal(seen.has(id), false, `${label}: identifiant dupliqué ${id}`);
    seen.add(id);
  }
}

function reachableZones(startZoneId, portals) {
  const adjacency = new Map();
  function addEdge(from, to) {
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from).push(to);
  }
  for (const portal of portals) {
    addEdge(portal.fromZoneId, portal.toZoneId);
    if (portal.bidirectional) addEdge(portal.toZoneId, portal.fromZoneId);
  }
  const visited = new Set([startZoneId]);
  const queue = [startZoneId];
  while (queue.length) {
    const current = queue.shift();
    for (const next of adjacency.get(current) || []) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  return visited;
}

const environmentIds = Object.keys(campaign.environments);
const plannedWeaponIds = Object.keys(campaign.plannedWeapons);
const rosterIds = Object.keys(campaign.rosters);
const newEnemyIds = Object.keys(campaign.newEnemies);
const animationProfileIds = Object.keys(campaign.animationProfiles);
const actIds = campaign.acts.map((act) => act.id);
const zoneIds = campaign.acts.flatMap((act) => act.zones.map((zone) => zone.id));
const objectiveIds = Object.keys(campaign.objectives);
const progressionRuleIds = Object.keys(campaign.progressionRules);
const portalIds = campaign.portals.map((portal) => portal.id);

[
  [environmentIds, "environnements"],
  [plannedWeaponIds, "armes planifiées"],
  [rosterIds, "rosters"],
  [newEnemyIds, "nouveaux ennemis"],
  [animationProfileIds, "profils d'animation"],
  [actIds, "actes"],
  [zoneIds, "zones"],
  [objectiveIds, "objectifs"],
  [progressionRuleIds, "règles de progression"],
  [portalIds, "portails"],
].forEach(([ids, label]) => assertUnique(ids, label));

const environmentIdSet = new Set(environmentIds);
const plannedWeaponIdSet = new Set(plannedWeaponIds);
const rosterIdSet = new Set(rosterIds);
const newEnemyIdSet = new Set(newEnemyIds);
const animationProfileIdSet = new Set(animationProfileIds);
const actIdSet = new Set(actIds);
const zoneIdSet = new Set(zoneIds);
const objectiveIdSet = new Set(objectiveIds);
const progressionRuleIdSet = new Set(progressionRuleIds);
const existingEnemyIdSet = collectExistingEnemyIds();
const existingWeaponIdSet = collectExistingWeaponIds();
const allEnemyIdSet = new Set([...existingEnemyIdSet, ...newEnemyIdSet]);
const allWeaponIdSet = new Set([...existingWeaponIdSet, ...plannedWeaponIdSet]);

assert.equal(actIdSet.has(campaign.startActId), true);
assert.equal(actIdSet.has(campaign.finalActId), true);
assert.equal(zoneIdSet.has(campaign.startZoneId), true);
assert.equal(zoneIdSet.has(campaign.finalZoneId), true);

for (const [id, environment] of Object.entries(campaign.environments)) {
  assert.equal(environment.id, id, `Environnement incohérent ${id}`);
  assert.ok(expectedBiomes.includes(environment.biomeId), `Biome inconnu ${environment.biomeId}`);
  assert.ok(environment.groundMaterialIds.length >= 3, `${id}: matériaux de sol insuffisants`);
  assert.ok(environment.depthLayerIds.length >= 4, `${id}: profondeur visuelle insuffisante`);
  assert.ok(environment.propSetIds.length >= 3, `${id}: banque de props insuffisante`);
}

for (const [id, weapon] of Object.entries(campaign.plannedWeapons)) {
  assert.equal(weapon.id, id, `Arme planifiée incohérente ${id}`);
  assert.match(weapon.spritePolicy, /^separate/, `${id}: sprite modulaire obligatoire`);
  assert.ok(weapon.anchorProfileId, `${id}: profil d'ancrage absent`);
}

for (const [id, enemy] of Object.entries(campaign.newEnemies)) {
  assert.equal(enemy.id, id, `Nouvel ennemi incohérent ${id}`);
  assert.equal(
    animationProfileIdSet.has(enemy.animationProfileId),
    true,
    `${id}: profil d'animation absent`,
  );
  const profile = campaign.animationProfiles[enemy.animationProfileId];
  assert.equal(profile.weaponsBakedIntoBody, false, `${id}: arme intégrée au corps interdite`);
  assert.equal(profile.weaponAnchorTrackRequired, true, `${id}: piste d'ancrage main absente`);
  assert.equal(profile.fpsBillboard.directions.length, 8, `${id}: directions FPS incomplètes`);
  assert.ok(profile.sideView.sheets.length >= 5, `${id}: planches 2D incomplètes`);
  assert.ok(profile.fpsBillboard.sheets.length >= 5, `${id}: planches FPS incomplètes`);
  if (enemy.weaponId) {
    assert.equal(
      allWeaponIdSet.has(enemy.weaponId),
      true,
      `${id}: arme absente ${enemy.weaponId}`,
    );
  }
}

for (const [id, roster] of Object.entries(campaign.rosters)) {
  assert.equal(roster.id, id, `Roster incohérent ${id}`);
  assert.ok(roster.existingEnemyIds.length + roster.newEnemyIds.length >= 3, `${id}: roster trop court`);
  for (const enemyId of roster.existingEnemyIds) {
    assert.equal(
      existingEnemyIdSet.has(enemyId),
      true,
      `${id}: ennemi existant introuvable ${enemyId}`,
    );
  }
  for (const enemyId of roster.newEnemyIds) {
    assert.equal(newEnemyIdSet.has(enemyId), true, `${id}: nouvel ennemi introuvable ${enemyId}`);
  }
  assert.equal(allEnemyIdSet.has(roster.bossEnemyId), true, `${id}: boss introuvable`);
  assert.equal(
    roster.existingEnemyIds.includes(roster.bossEnemyId)
      || roster.newEnemyIds.includes(roster.bossEnemyId),
    true,
    `${id}: le boss doit appartenir au roster`,
  );
}

const durationKeys = ["criticalPath", "exploration", "completionist"];
const computedDurations = Object.fromEntries(durationKeys.map((key) => [key, 0]));
let computedTotalSeals = 0;

for (const act of campaign.acts) {
  assert.equal(environmentIdSet.has(act.environmentId), true, `${act.id}: environnement absent`);
  assert.equal(rosterIdSet.has(act.rosterId), true, `${act.id}: roster absent`);
  assert.equal(
    campaign.environments[act.environmentId].biomeId,
    act.biomeId,
    `${act.id}: environnement hors biome`,
  );
  assert.equal(campaign.rosters[act.rosterId].biomeId, act.biomeId, `${act.id}: roster hors biome`);
  assert.equal(zoneIdSet.has(act.entryZoneId), true, `${act.id}: entrée absente`);
  assert.equal(zoneIdSet.has(act.exitZoneId), true, `${act.id}: sortie absente`);
  assert.equal(
    progressionRuleIdSet.has(act.completionRuleId),
    true,
    `${act.id}: règle de fin absente`,
  );
  assert.ok(
    act.zones.length >= campaign.designRules.minimumZonesPerAct,
    `${act.id}: nombre de zones insuffisant`,
  );
  assert.ok(act.durationMinutes.criticalPath >= 25, `${act.id}: acte trop court`);
  assert.ok(
    act.durationMinutes.criticalPath <= act.durationMinutes.exploration,
    `${act.id}: durées incohérentes`,
  );
  assert.ok(
    act.durationMinutes.exploration <= act.durationMinutes.completionist,
    `${act.id}: durées incohérentes`,
  );
  durationKeys.forEach((key) => {
    computedDurations[key] += act.durationMinutes[key];
  });

  const localZoneIds = new Set(act.zones.map((zone) => zone.id));
  assert.equal(localZoneIds.has(act.entryZoneId), true, `${act.id}: entrée hors acte`);
  assert.equal(localZoneIds.has(act.exitZoneId), true, `${act.id}: sortie hors acte`);

  for (const zone of act.zones) {
    assert.equal(environmentIdSet.has(zone.environmentId), true, `${zone.id}: environnement absent`);
    assert.equal(rosterIdSet.has(zone.rosterId), true, `${zone.id}: roster absent`);
    assert.equal(zone.environmentId, act.environmentId, `${zone.id}: environnement hors biome`);
    assert.equal(zone.rosterId, act.rosterId, `${zone.id}: roster hors acte`);
    for (const objectiveId of zone.objectiveIds) {
      assert.equal(objectiveIdSet.has(objectiveId), true, `${zone.id}: objectif absent ${objectiveId}`);
      assert.equal(
        campaign.objectives[objectiveId].zoneId,
        zone.id,
        `${zone.id}: objectif affecté à une autre zone`,
      );
    }
  }

  for (const objectiveId of act.objectiveIds) {
    assert.equal(objectiveIdSet.has(objectiveId), true, `${act.id}: objectif absent ${objectiveId}`);
    assert.equal(campaign.objectives[objectiveId].actId, act.id, `${objectiveId}: acte incohérent`);
  }
  const sealSum = act.objectiveIds.reduce(
    (sum, objectiveId) => sum + campaign.objectives[objectiveId].sealReward,
    0,
  );
  assert.equal(sealSum, act.totalSeals, `${act.id}: somme de sceaux incohérente`);
  computedTotalSeals += act.totalSeals;
}

assert.deepEqual(computedDurations, campaign.estimatedDurationMinutes);
assert.ok(computedDurations.criticalPath >= 240, "La campagne critique doit dépasser quatre heures");
assert.equal(computedTotalSeals, campaign.totalSeals, "Total de sceaux incohérent");

for (const [id, objective] of Object.entries(campaign.objectives)) {
  assert.equal(objective.id, id, `Objectif incohérent ${id}`);
  assert.equal(actIdSet.has(objective.actId), true, `${id}: acte absent`);
  assert.equal(zoneIdSet.has(objective.zoneId), true, `${id}: zone absente`);
  assert.ok(Number.isInteger(objective.sealReward), `${id}: récompense de sceau non entière`);
  assert.ok(objective.sealReward >= 0, `${id}: récompense de sceau négative`);
  if (objective.targetEnemyId) {
    assert.equal(
      allEnemyIdSet.has(objective.targetEnemyId),
      true,
      `${id}: cible ennemie absente ${objective.targetEnemyId}`,
    );
  }
}

for (const [id, rule] of Object.entries(campaign.progressionRules)) {
  assert.equal(rule.id, id, `Règle incohérente ${id}`);
  if (rule.type !== "act-completion") continue;
  assert.equal(actIdSet.has(rule.actId), true, `${id}: acte absent`);
  assert.ok(rule.minimumCampaignSeals <= campaign.totalSeals, `${id}: seuil impossible`);
  for (const objectiveId of rule.requiredObjectiveIds) {
    assert.equal(objectiveIdSet.has(objectiveId), true, `${id}: objectif absent ${objectiveId}`);
    assert.equal(
      campaign.objectives[objectiveId].actId,
      rule.actId,
      `${id}: objectif d'un autre acte`,
    );
  }
}

for (const portal of campaign.portals) {
  assert.equal(zoneIdSet.has(portal.fromZoneId), true, `${portal.id}: origine absente`);
  assert.equal(zoneIdSet.has(portal.toZoneId), true, `${portal.id}: destination absente`);
  assert.notEqual(portal.fromZoneId, portal.toZoneId, `${portal.id}: boucle locale interdite`);
  assert.equal(
    progressionRuleIdSet.has(portal.unlockRuleId),
    true,
    `${portal.id}: règle absente ${portal.unlockRuleId}`,
  );
  assert.equal(portal.interaction, "manual", `${portal.id}: transition automatique interdite`);
  assert.equal(portal.interactionKey, "E", `${portal.id}: touche d'interaction incohérente`);
}

const reachable = reachableZones(campaign.startZoneId, campaign.portals);
assert.equal(reachable.size, zoneIds.length, "Le graphe de campagne doit relier toutes les zones");
assert.equal(reachable.has(campaign.finalZoneId), true, "La zone finale doit être accessible");

const warpPortals = campaign.portals.filter((portal) => portal.kind === "warp");
assert.deepEqual(
  warpPortals.map((portal) => portal.id),
  ["warp-castle-to-contemporary", "warp-contemporary-to-cyberpunk"],
);
for (const warp of warpPortals) {
  assert.equal(warp.bidirectional, false, `${warp.id}: le warp de récit doit être à sens unique`);
  assert.equal(
    warp.transitionPresentation,
    "temporal-rift-cinematic",
    `${warp.id}: présentation temporelle absente`,
  );
}

const scriptText = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
assert.doesNotMatch(
  scriptText,
  /<script src="campaign-expansion\.js\?v=\d+"><\/script>/,
  "Le plan 28 zones reste une donnée d'outillage tant que le runtime ne le consomme pas",
);

console.log("Campaign expansion smoke test passed.");
console.log(`  ${campaign.acts.length} actes / ${zoneIds.length} zones / ${campaign.portals.length} portails`);
console.log(`  ${newEnemyIds.length} nouveaux ennemis déclarés / ${campaign.totalSeals} sceaux`);
console.log(
  `  durée: ${computedDurations.criticalPath}-${computedDurations.completionist} minutes`,
);
