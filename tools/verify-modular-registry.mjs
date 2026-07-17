import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalogPath = path.join(root, "assets", "modular", "catalog.json");
const registryPath = path.join(root, "assets", "modular", "registry.json");
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${path.relative(root, filePath)}: ${error.message}`);
    return null;
  }
}

function localFile(webPath) {
  return path.resolve(root, ...String(webPath || "").split("/"));
}

function assertPng(webPath, label) {
  const filePath = localFile(webPath);
  assert(filePath.startsWith(root), `${label}: chemin hors projet`);
  assert(fs.existsSync(filePath), `${label}: fichier absent (${webPath})`);
  if (!fs.existsSync(filePath)) return;
  const header = fs.readFileSync(filePath).subarray(0, 8).toString("hex");
  assert(header === "89504e470d0a1a0a", `${label}: signature PNG invalide (${webPath})`);
  assert(fs.statSync(filePath).size > 80, `${label}: fichier vide ou tronqué (${webPath})`);
}

const catalog = readJson(catalogPath);
const registry = readJson(registryPath);
if (!catalog || !registry) process.exit(1);

const expectedCounts = {
  characters: 97,
  players: 1,
  enemies: 96,
  regular: 20,
  special: 20,
  miniboss: 20,
  boss: 20,
  giant: 10,
  animationSheets: 485,
  framePngs: 2910,
  weapons: 58,
  environmentSprites: 84,
  catalogAssets: 239,
};

for (const [key, expected] of Object.entries(expectedCounts)) {
  assert(catalog.counts?.[key] === expected, `catalog.counts.${key}: ${catalog.counts?.[key]}, ${expected} attendu`);
  assert(registry.counts?.[key] === expected, `registry.counts.${key}: ${registry.counts?.[key]}, ${expected} attendu`);
}

assert(Array.isArray(catalog.assets), "catalog.assets absent");
assert(Array.isArray(registry.characters), "registry.characters absent");
assert(Array.isArray(registry.weapons), "registry.weapons absent");
assert(Array.isArray(registry.environments), "registry.environments absent");

const ids = new Set();
const files = new Set();
for (const asset of catalog.assets || []) {
  assert(asset.id && !ids.has(asset.id), `ID absent ou dupliqué: ${asset.id}`);
  ids.add(asset.id);
  assert(asset.file && !files.has(asset.file), `fichier absent ou dupliqué dans le catalogue: ${asset.file}`);
  files.add(asset.file);
  assertPng(asset.file, asset.id);
}

const animationNames = ["idle", "move", "attack", "hurt", "death"];
for (const character of registry.characters || []) {
  assertPng(character.file, `${character.id}/master`);
  const sprite = readJson(localFile(character.sprite));
  assert(sprite?.grid?.columns === 6 && sprite?.grid?.rows === 5, `${character.id}: grille autre que 6x5`);
  assert(sprite?.weaponMount?.normalized === true, `${character.id}: point de prise normalisé absent`);
  for (const animation of animationNames) {
    assertPng(character.animations?.[animation], `${character.id}/${animation}`);
    const frames = character.frames?.[animation];
    assert(Array.isArray(frames) && frames.length === 6, `${character.id}/${animation}: 6 frames attendues`);
    for (const [index, frame] of (frames || []).entries()) {
      assertPng(frame, `${character.id}/${animation}/${index}`);
    }
  }
  if (!["player", "legacy"].includes(character.category)) {
    assert(String(character.lore || "").length >= 24, `${character.id}: lore manquant`);
    assert(String(character.prompt || "").length >= 80, `${character.id}: prompt ImageGen manquant`);
    assert(character.manifest, `${character.id}: manifest manquant`);
  }
}

const modularWeapons = (registry.weapons || []).filter((weapon) =>
  String(weapon.file || "").startsWith("assets/modular/weapons/"),
);
assert(modularWeapons.length === 48, `armes modulaires: ${modularWeapons.length}, 48 attendues`);
const modularWeaponIds = new Set(modularWeapons.map((weapon) => weapon.id));
for (const weapon of modularWeapons) {
  assert(String(weapon.lore || "").length >= 20, `${weapon.id}: lore d'arme manquant`);
  assert(Array.isArray(weapon.anchor) && weapon.anchor.length === 2, `${weapon.id}: anchor [x,y] absent`);
  assert(weapon.anchor?.every((value) => Number.isFinite(value) && value >= 0 && value <= 1), `${weapon.id}: anchor invalide`);
  assert(weapon.manifest, `${weapon.id}: manifest d'arme manquant`);
}

for (const character of registry.characters || []) {
  if (["player", "legacy"].includes(character.category)) continue;
  assert(character.weaponId, `${character.id}: weaponId manquant`);
  assert(modularWeaponIds.has(character.weaponId), `${character.id}: weaponId non résolu (${character.weaponId})`);
}

const report = {
  catalogAssets: catalog.assets?.length || 0,
  uniqueIds: ids.size,
  uniqueFiles: files.size,
  characters: registry.characters?.length || 0,
  modularWeapons: modularWeapons.length,
  environments: registry.environments?.length || 0,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
