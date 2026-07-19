"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const targetSize = [1664, 936];
const packs = {
  "contemporary-japan": {
    props: [
      "metro-entrance",
      "koban",
      "vending-machine",
      "utility-pole",
      "quarantine-barrier",
      "city-bicycle",
      "emergency-car",
      "neighborhood-shrine",
      "construction-scaffold",
      "emergency-generator",
      "rainwater-pump",
      "yomi-warp-arch",
    ],
    platforms: [
      "asphalt-left",
      "asphalt-center",
      "asphalt-right",
      "asphalt-cracked",
      "concrete-curb-long",
      "concrete-curb-short",
      "footbridge-platform",
      "station-canopy",
      "scaffold-platform",
      "concrete-step",
      "rubble-ramp",
      "drainage-hazard",
    ],
  },
  "cyberpunk-japan": {
    props: [
      "temporal-torii",
      "shrine-tech-altar",
      "ventilation-tower",
      "energy-barrier-post",
      "maglev-maintenance-car",
      "drone-charging-dock",
      "sealed-cargo-crate",
      "vending-terminal",
      "coolant-pipe",
      "cyber-shrine-lantern",
      "transit-access-gate",
      "damaged-power-relay",
    ],
    platforms: [
      "tech-street-left",
      "tech-street-center",
      "tech-street-right",
      "tech-street-cracked",
      "service-platform-long",
      "service-platform-short",
      "transit-platform",
      "shrine-tech-roof",
      "coolant-catwalk",
      "illuminated-step",
      "debris-ramp",
      "energy-trench",
    ],
  },
  "kai-forest": {
    props: [
      "ancient-cedar-trunk",
      "hollow-fallen-log",
      "charcoal-burner-shelter",
      "moss-stone-lantern",
      "woodcutter-cart",
      "stacked-logs",
      "rope-ward-gate",
      "forest-spring-basin",
      "collapsed-quarantine-tent",
      "infected-root-cluster",
      "campfire-ring",
      "yomi-cave-arch",
    ],
    platforms: [
      "forest-earth-center",
      "forest-earth-left",
      "forest-earth-right",
      "root-cracked",
      "long-fallen-log",
      "short-fallen-log",
      "thick-root-platform",
      "moss-stone-platform",
      "moss-stone-steps",
      "root-earth-slope",
      "stream-stone-ledge",
      "fungus-pit",
    ],
  },
  "tsuru-fields": {
    props: [
      "field-hut",
      "irrigation-water-wheel",
      "farm-cart",
      "bound-rice-sheaf",
      "irrigation-sluice",
      "field-footbridge",
      "scarecrow",
      "wooden-granary",
      "straw-bales",
      "field-marker",
      "burning-crop-pile",
      "yomi-warp-torii",
    ],
    platforms: [
      "paddy-dike-center",
      "paddy-dike-left",
      "paddy-dike-right",
      "muddy-cracked",
      "long-plank",
      "short-plank",
      "straw-bale-platform",
      "field-hut-roof",
      "irrigation-stone-steps",
      "muddy-dike-slope",
      "drainage-stone-ledge",
      "flooded-plague-ditch",
    ],
  },
};

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

function pngHeader(relativePath) {
  const buffer = fs.readFileSync(absolute(relativePath));
  assert.equal(buffer.subarray(1, 4).toString("ascii"), "PNG", `${relativePath}: PNG invalide`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
  };
}

const environmentManifest = readJson("assets/modular/manifests/environments.json");
assert.equal(environmentManifest.count, 7);
assert.deepEqual(environmentManifest.totals, {
  layers: 28,
  props: 86,
  platforms: 84,
});

const manifestZones = new Map(
  environmentManifest.zones.map((zone) => [zone.id, zone]),
);
const allFinalFiles = new Set();

for (const [zoneId, expected] of Object.entries(packs)) {
  const packRoot = `assets/modular/environments/${zoneId}`;
  const packManifest = readJson(`${packRoot}/manifest.json`);
  assert.equal(packManifest.id, zoneId);
  assert.deepEqual(packManifest.renderStandard.resolution, targetSize);
  assert.deepEqual(packManifest.totals, {
    layers: 4,
    props: 12,
    platforms: 12,
  });

  const globalZone = manifestZones.get(zoneId);
  assert.ok(globalZone, `${zoneId}: zone absente du manifeste global`);
  assert.equal(globalZone.packManifest, `${packRoot}/manifest.json`);

  for (const layerId of ["sky", "far", "mid", "near"]) {
    const relativePath = `${packRoot}/layers/${layerId}.png`;
    const sourcePath = `${packRoot}/layers/source/${layerId}-imagegen-raw.png`;
    assert.equal(fs.existsSync(absolute(relativePath)), true, `${relativePath}: absent`);
    assert.equal(fs.existsSync(absolute(sourcePath)), true, `${sourcePath}: raw absent`);
    const header = pngHeader(relativePath);
    assert.deepEqual([header.width, header.height], targetSize, `${relativePath}: taille`);
    assert.equal(header.bitDepth, 8, `${relativePath}: profondeur PNG`);
    assert.equal(
      header.colorType,
      layerId === "sky" ? 2 : 6,
      `${relativePath}: ${layerId === "sky" ? "RGB opaque" : "RGBA"} attendu`,
    );
    assert.equal(allFinalFiles.has(relativePath), false, `${relativePath}: doublon`);
    allFinalFiles.add(relativePath);
  }

  for (const groupName of ["props", "platforms"]) {
    const localManifest = readJson(`${packRoot}/${groupName}/manifest.json`);
    const expectedIds = expected[groupName];
    assert.equal(localManifest.schema, 2);
    assert.equal(localManifest.count, 12);
    assert.deepEqual(localManifest.grid, { columns: 4, rows: 3 });
    assert.equal(localManifest.alphaSourceDerivedAtBuild, true);
    assert.equal(fs.existsSync(absolute(localManifest.source)), true);
    assert.deepEqual(
      localManifest.sprites.map((sprite) => sprite.id),
      expectedIds,
      `${zoneId}/${groupName}: ordre des sprites`,
    );

    const globalItems = globalZone[groupName].items;
    assert.equal(globalItems.length, 12);
    for (const sprite of localManifest.sprites) {
      assert.equal(sprite.transparentPadding, 8, `${sprite.id}: padding`);
      assert.deepEqual(sprite.groundAnchor, [0.5, 1], `${sprite.id}: ancre sol`);
      const relativePath = `${packRoot}/${groupName}/${sprite.file}`;
      assert.equal(fs.existsSync(absolute(relativePath)), true, `${relativePath}: absent`);
      assert.equal(globalItems.includes(relativePath), true, `${relativePath}: manifeste global`);
      const header = pngHeader(relativePath);
      assert.equal(header.colorType, 6, `${relativePath}: RGBA attendu`);
      assert.equal(allFinalFiles.has(relativePath), false, `${relativePath}: doublon`);
      allFinalFiles.add(relativePath);
    }
  }
}

assert.equal(allFinalFiles.size, 112, "112 sprites finaux d'expansion attendus");

const gameSource = fs.readFileSync(absolute("game.js"), "utf8");
for (const marker of [
  'loadParallaxSet("assets/modular/environments/contemporary-japan")',
  'loadParallaxSet("assets/modular/environments/cyberpunk-japan")',
  'loadParallaxSet("assets/modular/environments/kai-forest")',
  'loadParallaxSet("assets/modular/environments/tsuru-fields")',
  '"contemporary"',
  '"cyberpunk"',
  '"forest"',
  '"fields"',
  "previewEnvironmentIndex",
  '"tour-guet-kurokawa-3q-arriere-plan"',
  '"foyer-incendie-3q-arriere-plan"',
]) {
  assert.equal(gameSource.includes(marker), true, `game.js: marqueur absent ${marker}`);
}

const indexSource = fs.readFileSync(absolute("index.html"), "utf8");
assert.match(indexSource, /game\.js\?v=41/);

console.log("Expansion environment smoke test passed.");
console.log("  4 packs / 16 layers / 48 props / 48 platforms");
console.log("  previews: ?preview=contemporary, ?preview=cyberpunk, ?preview=forest, ?preview=fields");
