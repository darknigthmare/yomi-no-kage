"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { KageLevels } = require("./level-data.js");

const root = __dirname;
const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

function readJson(relativePath) {
  const file = path.join(root, relativePath);
  assert(fs.existsSync(file), `${relativePath}: fichier absent`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`${relativePath}: JSON invalide (${error.message})`);
    return null;
  }
}

const canon = readJson(KageLevels.canonManifest);
const deployment = readJson(KageLevels.rosterManifest);
const areas = Object.values(KageLevels.areas || {});

assert(KageLevels.schema >= 2, "KageLevels.schema doit déclarer les données visuelles V2");
assert(KageLevels.canon?.geography?.district === "Kurokawa", "district canonique Kurokawa absent");
assert(KageLevels.canon?.geography?.settlement === "Tsuru", "rattachement de Kurokawa à Tsuru absent");
assert(KageLevels.canon?.contamination?.phase1?.nature === "biological", "phase biologique absente");
assert(
  KageLevels.canon?.finalBoss?.id === "giant-10-yomi-no-kanrei"
    && KageLevels.canon?.finalBoss?.identityRule?.includes("phase 2"),
  "Yomi-no-Kanrei doit être la phase 2 du daimyō",
);
assert(canon?.finalBoss?.phase === 2, "manifest canon: phase finale incorrecte");

const forbiddenBackdrops = new Set(["castle-residence", "castle-donjon"]);
for (const area of areas) {
  assert(area.regionId === "kai", `${area.id}: regionId kai absent`);
  assert(area.settlementId === "tsuru", `${area.id}: settlementId tsuru absent`);
  assert(area.districtId === "tsuru-kurokawa", `${area.id}: districtId incohérent`);
  assert(KageLevels.rosterPools[area.rosterPoolId], `${area.id}: rosterPoolId non résolu`);
  assert(!forbiddenBackdrops.has(area.backdropProfile), `${area.id}: ancien fond FPS encore actif en 2D`);
  for (const forbidden of area.sideBackdrop?.forbiddenAssets || []) {
    assert(forbidden.includes("03-daimyo-castle-interior.png"), `${area.id}: asset interdit inattendu`);
  }

  for (const prop of area.props || []) {
    assert(prop.depthBand, `${area.id}/${prop.id}: depthBand absent`);
    assert(Number.isFinite(prop.bottomY), `${area.id}/${prop.id}: bottomY absent`);
    assert(Number.isFinite(prop.baselineY), `${area.id}/${prop.id}: baselineY absent`);
    assert(Number.isFinite(prop.perspectiveScale), `${area.id}/${prop.id}: perspectiveScale absent`);
    assert(Number.isFinite(prop.depthBias), `${area.id}/${prop.id}: depthBias absent`);
    assert(
      Array.isArray(prop.groundAnchor)
        && prop.groundAnchor.length === 2
        && prop.groundAnchor[0] === 0.5
        && prop.groundAnchor[1] === 1,
      `${area.id}/${prop.id}: groundAnchor invalide`,
    );
    assert(prop.contactMode === "opaque-bottom", `${area.id}/${prop.id}: contactMode invalide`);
    assert(prop.surfaceProfile, `${area.id}/${prop.id}: surfaceProfile absent`);
    assert(prop.colliderProfile?.type, `${area.id}/${prop.id}: colliderProfile absent`);
  }

  const wallIntervals = (area.props || [])
    .filter((prop) => /^(mur-|angle-ruelle-)/.test(String(prop.file || "")))
    .map((prop) => [prop.x, prop.x + prop.width * prop.perspectiveScale])
    .sort((left, right) => left[0] - right[0]);
  assert(wallIntervals.length > 0, `${area.id}: aucun mur de fond`);
  let coveredUntil = area.minX;
  let coveredLength = 0;
  let widestGap = 0;
  for (const [rawStart, rawEnd] of wallIntervals) {
    const start = Math.max(area.minX, rawStart);
    const end = Math.min(area.maxX, rawEnd);
    if (end <= start) continue;
    if (start > coveredUntil) widestGap = Math.max(widestGap, start - coveredUntil);
    const visibleStart = Math.max(start, coveredUntil);
    if (end > visibleStart) coveredLength += end - visibleStart;
    coveredUntil = Math.max(coveredUntil, end);
  }
  widestGap = Math.max(widestGap, area.maxX - coveredUntil);
  const coverage = coveredLength / Math.max(1, area.maxX - area.minX);
  assert(coverage >= 0.95, `${area.id}: murs couvrent seulement ${(coverage * 100).toFixed(1)}%`);
  assert(widestGap <= 12, `${area.id}: trou de mur de ${widestGap.toFixed(1)}px`);

  for (const platform of area.platforms || []) {
    assert(platform.surfaceProfile, `${area.id}/${platform.id}: surfaceProfile absent`);
    assert(platform.colliderProfile?.type, `${area.id}/${platform.id}: colliderProfile absent`);
    if (platform.visual === false) {
      assert(platform.ownerPropId, `${area.id}/${platform.id}: plateforme invisible sans prop propriétaire`);
    }
  }

  const groundEnemies = (area.enemies || [])
    .filter((enemy) => !enemy.platformId)
    .slice()
    .sort((left, right) => left.x - right.x);
  for (let index = 1; index < groundEnemies.length; index += 1) {
    const gap = groundEnemies[index].x - groundEnemies[index - 1].x;
    assert(gap >= 72, `${area.id}: ennemis ${groundEnemies[index - 1].id}/${groundEnemies[index].id} trop proches (${gap}px)`);
  }
}

const court = KageLevels.areas["castle-lower-court"];
const courtFiles = new Set((court.props || []).map((prop) => prop.file));
for (const indoorOnly of ["mur-shoji", "alcove-tatami", "armure-vide", "ratelier-vide", "escalier-bois"]) {
  assert(!courtFiles.has(indoorOnly), `castle-lower-court: prop intérieur ${indoorOnly} encore présent`);
}
assert(court.platforms.some((platform) => platform.id === "court-stone-gallery" && platform.visual !== false), "coursive extérieure visible absente");

const main = KageLevels.areas["kurokawa-main-street"];
for (const id of [
  "barrel-access-top",
  "intact-house-roof",
  "rice-storehouse-awning",
  "burned-quarter-barrel-top",
  "burned-house-east-roof",
  "east-watch-balcony",
]) {
  assert(main.platforms.some((platform) => platform.id === id), `kurokawa-main-street: surface ${id} absente`);
}

const fpsMaterials = KageLevels.visualStandards?.fpsMaterials;
assert(fpsMaterials?.tiles?.length === 8, "bibliothèque FPS sémantique incomplète");
assert(fpsMaterials?.profiles?.["kurokawa-donjon"]?.circulation === "castle-wall", "matériau du donjon non sémantique");
assert(
  fpsMaterials?.profiles?.["kurokawa-donjon"]?.forbiddenInteriorMaterials?.includes("quarantine-palisade"),
  "palissade extérieure non interdite dans le donjon",
);

const excludedIds = new Set((deployment?.explicitExclusions || []).map((entry) => entry.id));
for (const id of ["r01-nureta-fisher", "r07-shio-worker", "s14-mizuchi-diver", "mb-14-pirate-shioyake"]) {
  assert(excludedIds.has(id), `deployment: exclusion contextuelle absente pour ${id}`);
}

const report = {
  areas: areas.length,
  props: areas.reduce((total, area) => total + (area.props?.length || 0), 0),
  platforms: areas.reduce((total, area) => total + (area.platforms?.length || 0), 0),
  semanticFpsMaterials: fpsMaterials?.tiles?.length || 0,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
