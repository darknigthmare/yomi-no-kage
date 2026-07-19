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

function assertWeaponRig(rig, label) {
  assert(rig?.schema === 1, `${label}: weaponRig.schema doit valoir 1`);
  assert(
    rig?.coordinateSpace === "frame-normalized",
    `${label}: weaponRig.coordinateSpace invalide`,
  );
  assert(
    Array.isArray(rig?.renderOrder)
      && rig.renderOrder.join(",") === "body,weapon",
    `${label}: ordre weapon/body invalide`,
  );
  let frameCount = 0;
  for (const animation of ["idle", "move", "attack", "hurt", "death"]) {
    const frames = rig?.animations?.[animation];
    assert(Array.isArray(frames) && frames.length === 6, `${label}/${animation}: 6 rigs attendus`);
    for (const [index, frame] of (frames || []).entries()) {
      frameCount += 1;
      for (const hand of ["primaryHand", "secondaryHand"]) {
        assert(
          Array.isArray(frame?.[hand])
            && frame[hand].length === 2
            && frame[hand].every((value) =>
              Number.isFinite(value) && value >= 0 && value <= 1),
          `${label}/${animation}/${index}: ${hand} invalide`,
        );
      }
      assert(Number.isFinite(frame?.angle), `${label}/${animation}/${index}: angle invalide`);
      assert(
        Number.isFinite(frame?.scale) && frame.scale >= 0 && frame.scale <= 2,
        `${label}/${animation}/${index}: scale invalide`,
      );
      assert(
        ["behind-body", "front-body", "hidden"].includes(frame?.layer),
        `${label}/${animation}/${index}: layer invalide`,
      );
      if (animation === "death") {
        assert(frame?.layer === "hidden", `${label}/${animation}/${index}: arme de mort visible`);
      } else {
        assert(frame?.scale > 0, `${label}/${animation}/${index}: arme vivante masquee`);
        assert(
          frame?.layer === "front-body",
          `${label}/${animation}/${index}: arme vivante pas au premier plan`,
        );
      }
    }
  }
  return frameCount;
}

function assertAttachmentRig(rig, label) {
  assert(rig?.schema === 1, `${label}: attachmentRig.schema doit valoir 1`);
  assert(
    rig?.coordinateSpace === "frame-normalized",
    `${label}: attachmentRig.coordinateSpace invalide`,
  );
  assert(
    Array.isArray(rig?.renderOrder)
      && rig.renderOrder.join(",") === "body,attachment",
    `${label}: ordre body/attachment invalide`,
  );
  let frameCount = 0;
  for (const animation of ["idle", "move", "attack", "hurt", "death"]) {
    const frames = rig?.animations?.[animation];
    assert(Array.isArray(frames) && frames.length === 6, `${label}/${animation}: 6 ancres attendues`);
    for (const [index, frame] of (frames || []).entries()) {
      frameCount += 1;
      assert(
        Array.isArray(frame?.anchor)
          && frame.anchor.length === 2
          && frame.anchor.every((value) =>
            Number.isFinite(value) && value >= 0 && value <= 1),
        `${label}/${animation}/${index}: anchor invalide`,
      );
      assert(Number.isFinite(frame?.angle), `${label}/${animation}/${index}: angle invalide`);
      assert(
        Number.isFinite(frame?.scale) && frame.scale >= 0 && frame.scale <= 2,
        `${label}/${animation}/${index}: scale invalide`,
      );
      if (animation === "death") {
        assert(
          frame?.layer === "hidden" && frame?.scale === 0,
          `${label}/${animation}/${index}: pièce de mort visible`,
        );
      } else {
        assert(
          frame?.layer === "front-body" && frame?.scale > 0,
          `${label}/${animation}/${index}: pièce vivante mal placée`,
        );
      }
    }
  }
  return frameCount;
}

const catalog = readJson(catalogPath);
const registry = readJson(registryPath);
if (!catalog || !registry) process.exit(1);

const expectedCounts = {
  characters: 106,
  players: 1,
  enemies: 105,
  regular: 22,
  special: 24,
  miniboss: 21,
  boss: 22,
  giant: 10,
  animationSheets: 530,
  framePngs: 3180,
  weapons: 61,
  environmentSprites: 218,
  catalogAssets: 385,
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
const fpsDirectionNames = [
  "front",
  "front-left",
  "left",
  "back-left",
  "back",
  "back-right",
  "right",
  "front-right",
];
const crossEra2DIds = new Set([
  "new-modern-commuter",
  "new-modern-riot-host",
  "new-modern-response-officer",
  "new-cyber-neon-shinobi",
  "new-cyber-drone-corpse",
  "new-cyber-oni-frame",
  "new-modern-metro-colossus",
  "new-cyber-yomi-hacker",
  "new-cyber-shogun-zero",
]);
const catalogById = new Map((catalog.assets || []).map((asset) => [asset.id, asset]));
let weaponRigFrames = 0;
let enemyWeaponRigFrames = 0;
let fpsEnemyWeaponRigFrames = 0;
let fpsDirectionalCharacters = 0;
let fpsDirectionalSheets = 0;
let fpsDirectionalFrames = 0;
let fpsDirectionalRigFrames = 0;
for (const character of registry.characters || []) {
  assertPng(character.file, `${character.id}/master`);
  const sprite = readJson(localFile(character.sprite));
  const characterRigFrames = assertWeaponRig(character.weaponRig, character.id);
  weaponRigFrames += characterRigFrames;
  if (character.category !== "player") enemyWeaponRigFrames += characterRigFrames;
  assert(
    JSON.stringify(character.weaponRig) === JSON.stringify(sprite?.weaponRig),
    `${character.id}: weaponRig du registre desynchronise`,
  );
  assert(
    JSON.stringify(catalogById.get(character.id)?.weaponRig)
      === JSON.stringify(character.weaponRig),
    `${character.id}: weaponRig du catalogue desynchronise`,
  );
  if (character.category !== "player" && character.fpsSprite) {
    const fpsSprite = readJson(localFile(character.fpsSprite));
    fpsEnemyWeaponRigFrames += assertWeaponRig(
      character.fpsWeaponRig,
      `${character.id}/fps`,
    );
    assert(
      JSON.stringify(character.fpsWeaponRig) === JSON.stringify(fpsSprite?.weaponRig),
      `${character.id}/fps: weaponRig du registre desynchronise`,
    );
    assert(
      JSON.stringify(catalogById.get(character.id)?.fpsWeaponRig)
        === JSON.stringify(character.fpsWeaponRig),
      `${character.id}/fps: weaponRig du catalogue desynchronise`,
    );
    assert(
      JSON.stringify(character.fpsDirections)
        === JSON.stringify(fpsSprite?.fpsDirections),
      `${character.id}/fps: fpsDirections du registre désynchronisé`,
    );
    assert(
      JSON.stringify(catalogById.get(character.id)?.fpsDirections)
        === JSON.stringify(character.fpsDirections),
      `${character.id}/fps: fpsDirections du catalogue désynchronisé`,
    );
    fpsDirectionalCharacters += 1;
    for (const direction of fpsDirectionNames) {
      const bank = character.fpsDirections?.[direction];
      assert(bank, `${character.id}/fps/${direction}: banque absente`);
      assert(
        bank?.singleSilhouetteSource === true,
        `${character.id}/fps/${direction}: source multi-silhouette interdite`,
      );
      const cardinal = ["front", "back", "left", "right"].includes(direction);
      assert(
        bank?.sourceKind === (
          cardinal ? "cardinal-bitmap-source" : "derived-diagonal-bitmap"
        ),
        `${character.id}/fps/${direction}: type de source invalide`,
      );
      if (!cardinal) {
        const expectedAxial = direction.startsWith("front") ? "front" : "back";
        const expectedSide = direction.endsWith("left") ? "left" : "right";
        assert(
          JSON.stringify(bank?.derivedFrom) === JSON.stringify([expectedAxial])
            && bank?.orientationToward === expectedSide,
          `${character.id}/fps/${direction}: derivation mono-silhouette invalide`,
        );
      }
      fpsDirectionalRigFrames += assertWeaponRig(
        character.fpsWeaponRig?.directions?.[direction],
        `${character.id}/fps/${direction}`,
      );
      for (const animation of animationNames) {
        assertPng(
          bank?.animations?.[animation],
          `${character.id}/fps/${direction}/${animation}`,
        );
        fpsDirectionalSheets += 1;
        const frames = bank?.frames?.[animation];
        assert(
          Array.isArray(frames) && frames.length === 6,
          `${character.id}/fps/${direction}/${animation}: 6 frames attendues`,
        );
        for (const [index, frame] of (frames || []).entries()) {
          assertPng(
            frame,
            `${character.id}/fps/${direction}/${animation}/${index}`,
          );
          fpsDirectionalFrames += 1;
        }
      }
    }
  }
  if (crossEra2DIds.has(character.id)) {
    assert(character.viewCoverage === "2d-lateral-plus-fps-eight-way", `${character.id}: couverture FPS 8 directions absente`);
    assert(character.animationContract?.fpsEightWay === true, `${character.id}: fpsEightWay doit valoir true`);
    assert(character.animationContract?.weaponsBakedIntoBody === false, `${character.id}: arme intégrée au contrat`);
    assert(character.weaponsBakedIntoBody === false, `${character.id}: arme intégrée au corps`);
    assert(character.fpsSprite, `${character.id}: couverture FPS absente`);
    assert(sprite?.schema === 2, `${character.id}: sprite.schema doit valoir 2`);
  }
  if (character.id === "giant-02-aka-ushi") {
    const neckRigFrames = assertAttachmentRig(
      character.attachmentRigs?.neckRig,
      `${character.id}/neckRig`,
    );
    assert(neckRigFrames === 30, `${character.id}/neckRig: 30 ancres attendues`);
    assert(
      JSON.stringify(character.attachmentRigs?.neckRig)
        === JSON.stringify(sprite?.attachmentRigs?.neckRig),
      `${character.id}: neckRig du registre désynchronisé`,
    );
    assert(
      JSON.stringify(catalogById.get(character.id)?.attachmentRigs?.neckRig)
        === JSON.stringify(character.attachmentRigs?.neckRig),
      `${character.id}: neckRig du catalogue désynchronisé`,
    );
  }
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

assert(weaponRigFrames === 3180, `weaponRig frames: ${weaponRigFrames}, 3180 attendues`);
assert(enemyWeaponRigFrames === 3150, `weaponRig ennemis: ${enemyWeaponRigFrames}, 3150 attendues`);
assert(
  fpsEnemyWeaponRigFrames === 3150,
  `weaponRig ennemis FPS: ${fpsEnemyWeaponRigFrames}, 3150 attendues`,
);
assert(fpsDirectionalCharacters === 105, `personnages FPS directionnels: ${fpsDirectionalCharacters}, 105 attendus`);
assert(fpsDirectionalSheets === 4200, `planches FPS directionnelles: ${fpsDirectionalSheets}, 4200 attendues`);
assert(fpsDirectionalFrames === 25200, `frames FPS directionnelles: ${fpsDirectionalFrames}, 25200 attendues`);
assert(fpsDirectionalRigFrames === 25200, `sockets FPS directionnels: ${fpsDirectionalRigFrames}, 25200 attendus`);

const player = (registry.characters || []).find((character) => character.category === "player");
const fpsPlayerSprite = player?.fpsSprite ? readJson(localFile(player.fpsSprite)) : null;
const fpsPlayerRigFrames = assertWeaponRig(player?.fpsWeaponRig, "player/akio/fps");
assert(fpsPlayerRigFrames === 30, `weaponRig joueur FPS: ${fpsPlayerRigFrames}, 30 attendues`);
assert(
  JSON.stringify(player?.fpsWeaponRig) === JSON.stringify(fpsPlayerSprite?.weaponRig),
  "player/akio/fps: weaponRig du registre desynchronise",
);

const modularWeapons = (registry.weapons || []).filter((weapon) =>
  String(weapon.file || "").startsWith("assets/modular/weapons/"),
);
assert(modularWeapons.length === 51, `armes modulaires: ${modularWeapons.length}, 51 attendues`);
const modularWeaponIds = new Set(modularWeapons.map((weapon) => weapon.id));
for (const weapon of modularWeapons) {
  assert(String(weapon.lore || "").length >= 20, `${weapon.id}: lore d'arme manquant`);
  assert(Array.isArray(weapon.anchor) && weapon.anchor.length === 2, `${weapon.id}: anchor [x,y] absent`);
  assert(weapon.anchor?.every((value) => Number.isFinite(value) && value >= 0 && value <= 1), `${weapon.id}: anchor invalide`);
  assert(weapon.manifest, `${weapon.id}: manifest d'arme manquant`);
}

for (const character of registry.characters || []) {
  if (character.category === "player") continue;
  assert(character.weaponId, `${character.id}: weaponId manquant`);
  assert(modularWeaponIds.has(character.weaponId), `${character.id}: weaponId non résolu (${character.weaponId})`);
}

const environmentByFile = new Map(
  (registry.environments || []).map((asset) => [asset.file, asset]),
);
for (const [id, file, variantFile] of [
  [
    "tour-guet-kurokawa",
    "assets/modular/environments/kurokawa/props/tour-guet-kurokawa.png",
    "assets/modular/environments/kurokawa/props/tour-guet-kurokawa-3q-arriere-plan.png",
  ],
  [
    "foyer-incendie",
    "assets/modular/environments/kurokawa/props/foyer-incendie.png",
    "assets/modular/environments/kurokawa/props/foyer-incendie-3q-arriere-plan.png",
  ],
]) {
  const front = environmentByFile.get(file);
  const background = environmentByFile.get(variantFile);
  assert(front?.projection === "front-orthographic", `${id}: projection frontale absente du registre`);
  assert(front?.alphaMode === "binary", `${id}: alpha binaire absent du registre`);
  assert(front?.depthUsage === "gameplay-plane" && front?.backgroundOnly === false, `${id}: usage gameplay invalide`);
  assert(front?.contactMode === "opaque-bottom" && front?.baseline?.mode === "alpha-bottom", `${id}: contrat de contact absent`);
  assert(background?.projection === "three-quarter", `${id}: projection 3/4 absente`);
  assert(
    background?.depthUsage === "background-only"
      && background?.backgroundOnly === true
      && background?.renderLayer === "background"
      && background?.collision === "none",
    `${id}: variante 3/4 non reservee a l'arriere-plan`,
  );
}

const report = {
  catalogAssets: catalog.assets?.length || 0,
  uniqueIds: ids.size,
  uniqueFiles: files.size,
  characters: registry.characters?.length || 0,
  modularWeapons: modularWeapons.length,
  environments: registry.environments?.length || 0,
  weaponRigFrames,
  enemyWeaponRigFrames,
  fpsEnemyWeaponRigFrames,
  fpsDirectionalCharacters,
  fpsDirectionalSheets,
  fpsDirectionalFrames,
  fpsDirectionalRigFrames,
  fpsPlayerRigFrames,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
