import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const modularRoot = path.join(root, "assets", "modular");
const animationNames = ["idle", "move", "attack", "hurt", "death"];
const fpsDirections = [
  "front",
  "front-left",
  "left",
  "back-left",
  "back",
  "back-right",
  "right",
  "front-right",
];
const expectedCategories = {
  player: 1,
  legacy: 6,
  regular: 22,
  special: 24,
  miniboss: 21,
  boss: 22,
  giant: 10,
};
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

const errors = [];
const report = {
  categories: {},
  characters: 0,
  animationSheets: 0,
  framePngs: 0,
  weapons: 0,
  environmentSprites: 0,
  environmentLayers: 0,
  environmentProps: 0,
  environmentPlatforms: 0,
  fpsCharacterSheets: 0,
  fpsCharacterFramePngs: 0,
  fpsPlayerViewSheets: 0,
  fpsPlayerViewFramePngs: 0,
  fpsPlayerWeaponSprites: 0,
  staleFpsWeaponSets: 0,
  weaponRigFrames: 0,
  enemyWeaponRigFrames: 0,
  fpsEnemyWeaponRigFrames: 0,
  fpsDirectionalCharacters: 0,
  fpsDirectionalSheets: 0,
  fpsDirectionalFramePngs: 0,
  fpsDirectionalWeaponRigFrames: 0,
  fpsPlayerWeaponRigFrames: 0,
  akaUshiNeckRigFrames: 0,
};

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${path.relative(root, filePath)}: JSON invalide (${error.message})`);
    return null;
  }
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
}

function pngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function validateWeaponRig(rig, label) {
  assert(rig?.schema === 1, `${label}: weaponRig.schema invalide`);
  assert(rig?.coordinateSpace === "frame-normalized", `${label}: espace weaponRig invalide`);
  assert(
    Array.isArray(rig?.renderOrder)
      && rig.renderOrder.join(",") === "body,weapon",
    `${label}: ordre weapon/body invalide`,
  );
  let count = 0;
  const liveLayer = ["back-left", "back", "back-right"].includes(rig?.facing)
    ? "behind-body"
    : "front-body";
  for (const animation of animationNames) {
    const frames = rig?.animations?.[animation] || [];
    assert(frames.length === 6, `${label}: ${animation} n'a pas 6 weaponRig`);
    for (const [index, frame] of frames.entries()) {
      count += 1;
      for (const hand of ["primaryHand", "secondaryHand"]) {
        assert(
          Array.isArray(frame?.[hand])
            && frame[hand].length === 2
            && frame[hand].every((value) =>
              Number.isFinite(value) && value >= 0 && value <= 1),
          `${label}: ${animation}/${index} ${hand} invalide`,
        );
      }
      assert(Number.isFinite(frame?.angle), `${label}: ${animation}/${index} angle invalide`);
      assert(
        Number.isFinite(frame?.scale) && frame.scale >= 0 && frame.scale <= 2,
        `${label}: ${animation}/${index} scale invalide`,
      );
      assert(
        ["behind-body", "front-body", "hidden"].includes(frame?.layer),
        `${label}: ${animation}/${index} layer invalide`,
      );
      assert(
        animation === "death"
          ? frame?.layer === "hidden" && frame?.scale === 0
          : frame?.layer === liveLayer && frame?.scale > 0,
        `${label}: ${animation}/${index} couche/visibilite d'arme incoherente`,
      );
    }
  }
  return count;
}

function validateFpsDirections(entry, fpsSprite, label) {
  let sheets = 0;
  let frames = 0;
  let rigFrames = 0;
  for (const direction of fpsDirections) {
    const bank = fpsSprite?.fpsDirections?.[direction];
    const registryBank = entry?.fpsDirections?.[direction];
    const cardinal = ["front", "back", "left", "right"].includes(direction);
    const authored = bank?.authoredDirection === true;
    assert(bank, `${label}: fpsDirections.${direction} absent`);
    assert(
      bank?.singleSilhouetteSource === true,
      `${label}: ${direction} contient plusieurs silhouettes`,
    );
    assert(
      JSON.stringify(registryBank) === JSON.stringify(bank),
      `${label}: fpsDirections.${direction} désynchronisé`,
    );
    if (authored) {
      assert(
        bank?.sourceKind === "authored-directional-atlas"
          && bank?.derivedFrom === null
          && bank?.weaponsBakedIntoBody === false,
        `${label}: ${direction} contrat authored invalide`,
      );
      assert(
        bank?.pixelTransforms?.fusion === false
          && bank?.pixelTransforms?.mirror === false
          && bank?.pixelTransforms?.projection === false
          && bank?.pixelTransforms?.interpolation === false
          && bank?.pixelTransforms?.phaseSynthesis === false,
        `${label}: ${direction} transformation authored interdite`,
      );
    }
    if (!authored && !cardinal) {
      const expectedAxial = direction.startsWith("front") ? "front" : "back";
      const expectedSide = direction.endsWith("left") ? "left" : "right";
      assert(
        JSON.stringify(bank?.derivedFrom) === JSON.stringify([expectedAxial])
          && bank?.orientationToward === expectedSide,
        `${label}: ${direction} doit deriver d'une silhouette axiale unique`,
      );
    }
    const directionRig = fpsSprite?.weaponRig?.directions?.[direction];
    rigFrames += validateWeaponRig(
      directionRig,
      `${label}/fps/${direction}`,
    );
    for (const animation of animationNames) {
      const sheetPath = path.join(root, bank?.animations?.[animation] || "");
      assert(
        fs.existsSync(sheetPath),
        `${label}/${direction}: planche ${animation} absente`,
      );
      if (fs.existsSync(sheetPath)) sheets += 1;
      const declaredFrames = bank?.frames?.[animation] || [];
      assert(
        declaredFrames.length === 6,
        `${label}/${direction}: ${animation} n'a pas 6 frames`,
      );
      for (const frame of declaredFrames) {
        const framePath = path.join(root, frame);
        assert(
          fs.existsSync(framePath),
          `${label}/${direction}: frame absente ${frame}`,
        );
        if (fs.existsSync(framePath)) frames += 1;
      }
    }
  }
  return { sheets, frames, rigFrames };
}

function validateAttachmentRig(rig, label) {
  assert(rig?.schema === 1, `${label}: attachmentRig.schema invalide`);
  assert(rig?.coordinateSpace === "frame-normalized", `${label}: espace attachmentRig invalide`);
  assert(
    Array.isArray(rig?.renderOrder)
      && rig.renderOrder.join(",") === "body,attachment",
    `${label}: ordre body/attachment invalide`,
  );
  let count = 0;
  for (const animation of animationNames) {
    const frames = rig?.animations?.[animation] || [];
    assert(frames.length === 6, `${label}: ${animation} n'a pas 6 attachmentRig`);
    for (const [index, frame] of frames.entries()) {
      count += 1;
      assert(
        Array.isArray(frame?.anchor)
          && frame.anchor.length === 2
          && frame.anchor.every((value) =>
            Number.isFinite(value) && value >= 0 && value <= 1),
        `${label}: ${animation}/${index} anchor invalide`,
      );
      assert(Number.isFinite(frame?.angle), `${label}: ${animation}/${index} angle invalide`);
      assert(
        Number.isFinite(frame?.scale) && frame.scale >= 0 && frame.scale <= 2,
        `${label}: ${animation}/${index} scale invalide`,
      );
      assert(
        ["front-body", "hidden"].includes(frame?.layer),
        `${label}: ${animation}/${index} layer invalide`,
      );
      assert(
        animation === "death"
          ? frame?.layer === "hidden" && frame?.scale === 0
          : frame?.layer === "front-body" && frame?.scale > 0,
        `${label}: ${animation}/${index} visibilité incohérente`,
      );
    }
  }
  return count;
}

for (const [category, expectedCount] of Object.entries(expectedCategories)) {
  const categoryPath = path.join(modularRoot, "characters", category);
  const directories = fs.existsSync(categoryPath)
    ? fs.readdirSync(categoryPath, { withFileTypes: true }).filter((entry) => entry.isDirectory())
    : [];
  report.categories[category] = directories.length;
  assert(
    directories.length === expectedCount,
    `${category}: ${directories.length} personnage(s), ${expectedCount} attendu(s)`,
  );

  for (const entry of directories) {
    const folder = path.join(categoryPath, entry.name);
    const spritePath = path.join(folder, "sprite.json");
    const masterPath = path.join(folder, "master.png");
    assert(fs.existsSync(masterPath), `${category}/${entry.name}: master.png absent`);
    assert(fs.existsSync(spritePath), `${category}/${entry.name}: sprite.json absent`);
    if (!fs.existsSync(spritePath)) continue;

    const sprite = readJson(spritePath);
    if (!sprite) continue;
    if (crossEra2DIds.has(entry.name)) {
      assert(sprite.schema === 2, `${category}/${entry.name}: sprite.schema doit valoir 2`);
      assert(
        sprite.animationContract?.view === "2d-lateral-only"
          && sprite.animationContract?.fpsFourWay === true
          && sprite.animationContract?.fpsEightWay === true,
        `${category}/${entry.name}: contrat latéral 2D invalide`,
      );
      assert(
        sprite.weaponsBakedIntoBody === false
          && sprite.animationContract?.weaponsBakedIntoBody === false,
        `${category}/${entry.name}: arme intégrée au corps`,
      );
      assert(
        sprite.viewCoverage?.mode === "2d-lateral-plus-fps-eight-way"
          && sprite.viewCoverage?.directions?.join(",") === "left"
          && sprite.viewCoverage?.fpsDirections?.join(",")
            === fpsDirections.join(","),
        `${category}/${entry.name}: couverture de vue invalide`,
      );
    }
    const rigFrames = validateWeaponRig(sprite.weaponRig, `${category}/${entry.name}`);
    report.weaponRigFrames += rigFrames;
    if (category !== "player") report.enemyWeaponRigFrames += rigFrames;
    if (entry.name === "giant-02-aka-ushi") {
      report.akaUshiNeckRigFrames = validateAttachmentRig(
        sprite.attachmentRigs?.neckRig,
        `${category}/${entry.name}/neckRig`,
      );
    }
    assert(sprite.grid?.columns === 6 && sprite.grid?.rows === 5, `${category}/${entry.name}: grille autre que 6x5`);
    for (const animation of animationNames) {
      const sheetPath = path.join(folder, "sheets", `${animation}.png`);
      assert(fs.existsSync(sheetPath), `${category}/${entry.name}: planche ${animation} absente`);
      if (fs.existsSync(sheetPath)) report.animationSheets += 1;
      const frames = sprite.animations?.[animation];
      assert(Array.isArray(frames) && frames.length === 6, `${category}/${entry.name}: ${animation} n'a pas 6 frames`);
      for (let index = 0; index < 6; index += 1) {
        const framePath = path.join(folder, "frames", animation, `${String(index).padStart(2, "0")}.png`);
        assert(fs.existsSync(framePath), `${category}/${entry.name}: ${animation}/${index} absent`);
        if (fs.existsSync(framePath)) report.framePngs += 1;
      }
    }
    report.characters += 1;
  }
}
assert(report.weaponRigFrames === 3180, `weaponRig frames: ${report.weaponRigFrames}, 3180 attendues`);
assert(
  report.enemyWeaponRigFrames === 3150,
  `weaponRig ennemis: ${report.enemyWeaponRigFrames}, 3150 attendues`,
);

const weaponFiles = walkFiles(path.join(modularRoot, "weapons"))
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .filter((file) => !/(^|[\\/])(source|sources|tmp|atlases|components)([\\/]|$)/i.test(file))
  .filter((file) => !/(?:^|[-_.])(source|raw|alpha|contact|atlas|preview)(?:[-_.]|$)/i.test(path.basename(file)));
report.weapons = weaponFiles.length;
assert(report.weapons === 51, `armes séparées: ${report.weapons}, exactement 51 attendues`);

const environmentFiles = walkFiles(path.join(modularRoot, "environments"))
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .filter((file) => !/(^|[\\/])(source|sources|tmp|depth-portals)([\\/]|$)/i.test(file))
  .filter((file) => !/(?:^|[-_.])(source|raw|alpha|contact|atlas|preview)(?:[-_.]|$)/i.test(path.basename(file)));
report.environmentSprites = environmentFiles.length;
report.environmentLayers = environmentFiles.filter((file) => /[\\/]layers[\\/]/i.test(file)).length;
report.environmentProps = environmentFiles.filter((file) => /[\\/]props[\\/]/i.test(file)).length;
report.environmentPlatforms = environmentFiles.filter((file) => /[\\/]platforms[\\/]/i.test(file)).length;
assert(report.environmentSprites === 218, `sprites de décor: ${report.environmentSprites}, exactement 218 attendus`);
assert(report.environmentLayers === 28, `couches de parallaxe: ${report.environmentLayers}, exactement 28 attendues`);
assert(report.environmentProps === 86, `accessoires de décor: ${report.environmentProps}, exactement 86 attendus`);
assert(report.environmentPlatforms === 84, `tuiles de plateforme: ${report.environmentPlatforms}, exactement 84 attendues`);

const registryPath = path.join(modularRoot, "registry.json");
const catalogPath = path.join(modularRoot, "catalog.json");
assert(fs.existsSync(registryPath), "registry.json absent");
assert(fs.existsSync(catalogPath), "catalog.json absent");
if (fs.existsSync(registryPath)) {
  const registry = readJson(registryPath);
  assert(registry?.characters?.length === report.characters, "registry.json ne contient pas tous les personnages");
  const crossEra2DCharacters = (registry?.characters || [])
    .filter((entry) => crossEra2DIds.has(entry.id));
  assert(
    crossEra2DCharacters.length === crossEra2DIds.size,
    `registre: ${crossEra2DCharacters.length} ennemis inter-époques, ${crossEra2DIds.size} attendus`,
  );
  for (const entry of crossEra2DCharacters) {
    assert(entry.viewCoverage === "2d-lateral-plus-fps-eight-way", `${entry.id}: registre sans contrat FPS 8 directions`);
    assert(entry.animationContract?.fpsEightWay === true, `${entry.id}: fpsEightWay doit valoir true`);
    assert(entry.weaponsBakedIntoBody === false, `${entry.id}: arme intégrée au corps dans le registre`);
    assert(entry.fpsSprite, `${entry.id}: sprite FPS 8 directions absent`);
  }
  const akaUshi = (registry?.characters || [])
    .find((entry) => entry.id === "giant-02-aka-ushi");
  const akaUshiSprite = akaUshi
    ? readJson(path.join(root, akaUshi.sprite))
    : null;
  const akaUshiCatalog = (readJson(catalogPath)?.assets || [])
    .find((entry) => entry.id === "giant-02-aka-ushi");
  assert(report.akaUshiNeckRigFrames === 30, "Aka-Ushi: 30 ancres neckRig attendues");
  assert(
    JSON.stringify(akaUshi?.attachmentRigs?.neckRig)
      === JSON.stringify(akaUshiSprite?.attachmentRigs?.neckRig),
    "Aka-Ushi: neckRig du registre désynchronisé",
  );
  assert(
    JSON.stringify(akaUshiCatalog?.attachmentRigs?.neckRig)
      === JSON.stringify(akaUshi?.attachmentRigs?.neckRig),
    "Aka-Ushi: neckRig du catalogue désynchronisé",
  );
  const fpsCharacters = (registry?.characters || [])
    .filter((entry) => entry.category !== "player" && entry.fpsSprite);
  for (const entry of fpsCharacters) {
    report.fpsEnemyWeaponRigFrames += validateWeaponRig(
      entry.fpsWeaponRig,
      `${entry.category}/${entry.id}/fps`,
    );
    const fpsSprite = readJson(path.join(root, entry.fpsSprite));
    assert(
      JSON.stringify(entry.fpsWeaponRig) === JSON.stringify(fpsSprite?.weaponRig),
      `${entry.category}/${entry.id}: weaponRig FPS désynchronisé`,
    );
    const directional = validateFpsDirections(
      entry,
      fpsSprite,
      `${entry.category}/${entry.id}`,
    );
    report.fpsDirectionalCharacters += 1;
    report.fpsDirectionalSheets += directional.sheets;
    report.fpsDirectionalFramePngs += directional.frames;
    report.fpsDirectionalWeaponRigFrames += directional.rigFrames;
    for (const animation of animationNames) {
      const sheetPath = path.join(root, entry.fpsAnimations?.[animation] || "");
      assert(fs.existsSync(sheetPath), `${entry.category}/${entry.id}: planche FPS ${animation} absente`);
      if (fs.existsSync(sheetPath)) report.fpsCharacterSheets += 1;
      const frames = entry.fpsFrames?.[animation] || [];
      assert(frames.length === 6, `${entry.category}/${entry.id}: FPS ${animation} n'a pas 6 frames`);
      for (const frame of frames) {
        const framePath = path.join(root, frame);
        assert(fs.existsSync(framePath), `${entry.category}/${entry.id}: frame FPS absente ${frame}`);
        if (fs.existsSync(framePath)) report.fpsCharacterFramePngs += 1;
      }
    }
  }
  assert(
    report.fpsEnemyWeaponRigFrames === 3150,
    `weaponRig ennemis FPS: ${report.fpsEnemyWeaponRigFrames}, 3150 attendues`,
  );
  assert(report.fpsDirectionalCharacters === 105, `personnages FPS 8 directions: ${report.fpsDirectionalCharacters}, 105 attendus`);
  assert(report.fpsDirectionalSheets === 4200, `planches FPS directionnelles: ${report.fpsDirectionalSheets}, 4200 attendues`);
  assert(report.fpsDirectionalFramePngs === 25200, `frames FPS directionnelles: ${report.fpsDirectionalFramePngs}, 25200 attendues`);
  assert(report.fpsDirectionalWeaponRigFrames === 25200, `sockets FPS directionnels: ${report.fpsDirectionalWeaponRigFrames}, 25200 attendus`);
  const loreKatanas = (registry?.weapons || []).filter((weapon) =>
    /^\d{2}-/.test(String(weapon.id || "")) && String(weapon.file || "").startsWith("assets/generated/weapons/"));
  report.staleFpsWeaponSets = (registry?.weapons || [])
    .filter((weapon) => weapon.fpsAnimations).length;
  assert(
    report.staleFpsWeaponSets === 0,
    `anciens composites FPS d'arme encore référencés: ${report.staleFpsWeaponSets}`,
  );
  const player = (registry?.characters || []).find((entry) => entry.category === "player");
  report.fpsPlayerWeaponRigFrames = validateWeaponRig(
    player?.fpsWeaponRig,
    "player/akio/fps",
  );
  assert(
    report.fpsPlayerWeaponRigFrames === 30,
    `weaponRig joueur FPS: ${report.fpsPlayerWeaponRigFrames}, 30 attendues`,
  );
  for (const animation of animationNames) {
    const sheetPath = path.join(root, player?.fpsAnimations?.[animation] || "");
    assert(fs.existsSync(sheetPath), `player/akio: planche FPS ${animation} absente`);
    if (fs.existsSync(sheetPath)) {
      report.fpsPlayerViewSheets += 1;
      const size = pngSize(sheetPath);
      assert(
        size?.width === 5760 && size?.height === 640,
        `player/akio: planche FPS ${animation} doit faire 5760x640`,
      );
    }
    const frames = player?.fpsFrames?.[animation] || [];
    assert(frames.length === 6, `player/akio: FPS ${animation} n'a pas 6 frames`);
    for (const frame of frames) {
      const framePath = path.join(root, frame);
      assert(fs.existsSync(framePath), `player/akio: frame FPS absente ${frame}`);
      if (fs.existsSync(framePath)) {
        report.fpsPlayerViewFramePngs += 1;
        const size = pngSize(framePath);
        assert(
          size?.width === 960 && size?.height === 640,
          `player/akio: frame FPS ${frame} doit faire 960x640`,
        );
      }
    }
  }
  for (const weapon of loreKatanas) {
    const spritePath = path.join(root, weapon.fpsSprite || "");
    assert(fs.existsSync(spritePath), `${weapon.id}: sprite FPS d'arme séparé absent`);
    assert(!weapon.fpsAnimations, `${weapon.id}: conserve des composites bras/arme obsolètes`);
    if (fs.existsSync(spritePath)) {
      report.fpsPlayerWeaponSprites += 1;
      const size = pngSize(spritePath);
      assert(
        size && size.width <= 640 && size.height <= 160,
        `${weapon.id}: sprite FPS d'arme hors format 640x160 maximum`,
      );
    }
  }
  assert(report.fpsCharacterSheets === 525, `planches FPS ennemis: ${report.fpsCharacterSheets}, 525 attendues`);
  assert(report.fpsCharacterFramePngs === 3150, `frames FPS ennemis: ${report.fpsCharacterFramePngs}, 3150 attendues`);
  assert(report.fpsPlayerViewSheets === 5, `planches FPS joueur: ${report.fpsPlayerViewSheets}, 5 attendues`);
  assert(report.fpsPlayerViewFramePngs === 30, `frames FPS joueur: ${report.fpsPlayerViewFramePngs}, 30 attendues`);
  assert(report.fpsPlayerWeaponSprites === 10, `sprites FPS d'arme: ${report.fpsPlayerWeaponSprites}, 10 attendus`);
}

report.errors = errors;
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
