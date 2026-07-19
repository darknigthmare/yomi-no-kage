"use strict";

/*
 * Contrat executable des banques de materiaux FPS de fin de jeu.
 *
 * Tokyo contemporain et Neo-Edo doivent utiliser deux atlas dedies, jamais
 * l'atlas feodal. Chaque role visuel est fixe par le profil (sol, enceinte,
 * circulation, chambre, porte et objectif), et les positions de portes sont
 * posees sur de vrais murs de la carte composee.
 */

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const { KageLevels } = require("./level-data.js");
const root = __dirname;
const materials = KageLevels.visualStandards.fpsMaterials;
const gameSource = fs.readFileSync(path.join(root, "game.js"), "utf8");

function pngSize(relativePath) {
  const bytes = fs.readFileSync(path.join(root, relativePath));
  assert.equal(bytes.toString("ascii", 1, 4), "PNG", `${relativePath}: PNG invalide`);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bytes,
  };
}

function extractMaps() {
  const declaration = "const MAPS = ";
  const start = gameSource.indexOf(declaration);
  const end = gameSource.indexOf("\n  const FPS_DEFS", start);
  assert.ok(start >= 0 && end > start, "Impossible d'extraire les cartes FPS composees");
  const literal = gameSource
    .slice(start + declaration.length, end)
    .trim()
    .replace(/;\s*$/, "");
  return vm.runInNewContext(literal, Object.create(null));
}

const maps = extractMaps();
const tileById = new Map(materials.tiles.map((tile) => [tile.id, tile]));
const targetMissions = [
  {
    mission: KageLevels.campaignFpsMissions.find(
      (candidate) => candidate.id === "modern-lab-containment",
    ),
    profileId: "modern-metropolitan-lab",
    atlasId: "contemporary",
    era: "tokyo-contemporary",
  },
  {
    mission: KageLevels.campaignFpsMissions.find(
      (candidate) => candidate.id === "cyber-yomi-mainframe",
    ),
    profileId: "cyber-yomi-mainframe",
    atlasId: "cyber",
    era: "neo-edo-cyberpunk",
  },
];

const feudalTileIds = new Set(
  materials.tiles.filter((tile) => (tile.atlas || "feudal") === "feudal")
    .map((tile) => tile.id),
);
const hashes = new Set();

for (const target of targetMissions) {
  const { mission, profileId, atlasId, era } = target;
  assert.ok(mission, `${profileId}: mission FPS absente`);
  assert.equal(mission.missionIndex, atlasId === "contemporary" ? 10 : 11);
  assert.equal(mission.materialProfile, profileId);

  const profile = materials.profiles[profileId];
  const atlas = materials.atlases[atlasId];
  assert.ok(profile, `${profileId}: profil absent`);
  assert.ok(atlas, `${profileId}: atlas absent`);
  assert.equal(profile.atlas, atlasId);
  assert.equal(profile.era, era);
  assert.equal(atlas.era, era);
  assert.notEqual(atlas.src, materials.atlas, `${profileId}: atlas feodal reutilise`);
  assert.ok(fs.existsSync(path.join(root, atlas.src)), `${atlas.src}: atlas runtime absent`);
  assert.ok(fs.existsSync(path.join(root, atlas.source)), `${atlas.source}: source OpenAI absente`);

  const runtimeAtlas = pngSize(atlas.src);
  assert.deepEqual(
    [runtimeAtlas.width, runtimeAtlas.height],
    [1536, 768],
    `${profileId}: atlas normalise 4x2 attendu`,
  );
  assert.ok(runtimeAtlas.bytes.length > 250_000, `${profileId}: atlas anormalement vide`);
  hashes.add(crypto.createHash("sha256").update(runtimeAtlas.bytes).digest("hex"));

  const eraTiles = materials.tiles.filter((tile) => tile.atlas === atlasId);
  assert.equal(eraTiles.length, 8, `${profileId}: huit tuiles dediees attendues`);
  assert.deepEqual(
    eraTiles.map((tile) => tile.index).sort((left, right) => left - right),
    [0, 1, 2, 3, 4, 5, 6, 7],
    `${profileId}: indices d'atlas incomplets`,
  );

  const roles = ["floor", "boundary", "circulation", "chamber", "door", "altar"];
  for (const role of roles) {
    const tileId = profile[role];
    const tile = tileById.get(tileId);
    assert.ok(tile, `${profileId}/${role}: tuile inconnue ${tileId}`);
    assert.equal(tile.atlas, atlasId, `${profileId}/${role}: melange d'epoque`);
    assert.equal(feudalTileIds.has(tileId), false, `${profileId}/${role}: materiau feodal`);
  }
  assert.ok(tileById.get(profile.floor).use.includes("floor"));
  assert.ok(tileById.get(profile.floor).use.includes("walkable"));
  assert.ok(tileById.get(profile.door).use.includes("door"));
  assert.ok(tileById.get(profile.altar).use.includes("altar"));
  assert.equal(profile.floorProjection, "world-uv-floor-cast");
  assert.ok(profile.floorScale >= 0.5 && profile.floorScale <= 1.25);
  assert.deepEqual(profile.walkableCellValues, ["0", "3"]);
  assert.equal(
    profile.forbiddenInteriorMaterials.some((tileId) => !feudalTileIds.has(tileId)),
    false,
    `${profileId}: la liste d'interdiction doit couvrir uniquement les restes feodaux`,
  );
  assert.ok(profile.forbiddenInteriorMaterials.length >= 7);

  const map = maps[mission.mapIndex];
  assert.ok(Array.isArray(map) && map.length >= 15, `${profileId}: carte composee absente`);
  assert.equal(new Set(map.map((row) => row.length)).size, 1, `${profileId}: carte non rectangulaire`);
  const walkable = new Set(profile.walkableCellValues);
  assert.ok(
    walkable.has(map[Math.floor(mission.start[1])][Math.floor(mission.start[0])]),
    `${profileId}: depart non marchable`,
  );
  assert.ok(
    walkable.has(map[Math.floor(mission.altar[1])][Math.floor(mission.altar[0])]),
    `${profileId}: autel non marchable`,
  );
  assert.ok(
    map.join("").split("").filter((cell) => walkable.has(cell)).length >= 120,
    `${profileId}: surface marchable insuffisante`,
  );
  for (const [enemyX, enemyY] of mission.enemies) {
    assert.ok(
      walkable.has(map[Math.floor(enemyY)][Math.floor(enemyX)]),
      `${profileId}: ennemi pose hors sol en ${enemyX},${enemyY}`,
    );
  }
  assert.equal(mission.doorCells.length, 4, `${profileId}: quatre seuils fixes attendus`);
  for (const [doorX, doorY] of mission.doorCells) {
    assert.equal(map[doorY]?.[doorX], "1", `${profileId}: porte sans mur en ${doorX},${doorY}`);
  }
}

assert.equal(hashes.size, 2, "Les atlas contemporain et cyber doivent etre visuellement distincts");
assert.match(gameSource, /fpsAtlasBitmap\(scheme\.atlasId\)/);
assert.match(gameSource, /fpsFloorSource\(scheme\.atlasId, scheme\.floorTile\)/);
assert.match(gameSource, /fpsAtlasTileRect\(\s*scheme\.atlasId,/);
assert.match(gameSource, /eraObjective[\s\S]*scheme\.altarWall/);
assert.match(gameSource, /definition\.doorCells/);
assert.match(
  gameSource,
  /const isCrossEraEntry = \(entry\) => \/\^\(new-modern\|new-cyber\)-\//,
  "Le runtime doit identifier les rosters moderne/cyber avant les missions historiques",
);
assert.match(
  gameSource,
  /missionIndex === 0[\s\S]*\? feudalSpecial[\s\S]*feudalMiniboss/,
  "Le sanctuaire historique ne doit jamais piocher dans les ennemis moderne/cyber",
);
assert.doesNotMatch(
  targetMissions.map(({ mission }) => mission.materialProfile).join(","),
  /daimyo|kurokawa|tatami|shoji|cedar|stone/,
);

console.log("FPS era materials smoke test passed.");
console.log(JSON.stringify({
  missions: targetMissions.map(({ mission }) => mission.id),
  profiles: targetMissions.map(({ profileId }) => profileId),
  atlases: targetMissions.map(({ atlasId }) => materials.atlases[atlasId].src),
  dedicatedTiles: targetMissions.reduce(
    (total, { atlasId }) => total + materials.tiles.filter((tile) => tile.atlas === atlasId).length,
    0,
  ),
  floorProjection: "world-uv-floor-cast",
  semanticDoorCells: targetMissions.reduce(
    (total, { mission }) => total + mission.doorCells.length,
    0,
  ),
}, null, 2));
