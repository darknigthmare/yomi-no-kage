import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const modularRoot = path.join(root, "assets", "modular");
const animationNames = ["idle", "move", "attack", "hurt", "death"];
const expectedCategories = {
  player: 1,
  legacy: 6,
  regular: 20,
  special: 20,
  miniboss: 20,
  boss: 20,
  giant: 10,
};

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

const weaponFiles = walkFiles(path.join(modularRoot, "weapons"))
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .filter((file) => !/(^|[\\/])(source|sources|tmp|atlases)([\\/]|$)/i.test(file))
  .filter((file) => !/(source|raw|alpha|contact|atlas|preview)/i.test(path.basename(file)));
report.weapons = weaponFiles.length;
assert(report.weapons === 48, `armes séparées: ${report.weapons}, exactement 48 attendues`);

const environmentFiles = walkFiles(path.join(modularRoot, "environments"))
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .filter((file) => !/(^|[\\/])(source|sources|tmp)([\\/]|$)/i.test(file))
  .filter((file) => !/(source|raw|alpha|contact|atlas|preview)/i.test(path.basename(file)));
report.environmentSprites = environmentFiles.length;
report.environmentLayers = environmentFiles.filter((file) => /[\\/]layers[\\/]/i.test(file)).length;
report.environmentProps = environmentFiles.filter((file) => /[\\/]props[\\/]/i.test(file)).length;
report.environmentPlatforms = environmentFiles.filter((file) => /[\\/]platforms[\\/]/i.test(file)).length;
assert(report.environmentSprites === 84, `sprites de décor: ${report.environmentSprites}, exactement 84 attendus`);
assert(report.environmentLayers === 12, `couches de parallaxe: ${report.environmentLayers}, exactement 12 attendues`);
assert(report.environmentProps === 36, `accessoires de décor: ${report.environmentProps}, exactement 36 attendus`);
assert(report.environmentPlatforms === 36, `tuiles de plateforme: ${report.environmentPlatforms}, exactement 36 attendues`);

const registryPath = path.join(modularRoot, "registry.json");
const catalogPath = path.join(modularRoot, "catalog.json");
assert(fs.existsSync(registryPath), "registry.json absent");
assert(fs.existsSync(catalogPath), "catalog.json absent");
if (fs.existsSync(registryPath)) {
  const registry = readJson(registryPath);
  assert(registry?.characters?.length === report.characters, "registry.json ne contient pas tous les personnages");
  const fpsCharacters = (registry?.characters || []).filter((entry) => entry.category !== "player");
  for (const entry of fpsCharacters) {
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
  const loreKatanas = (registry?.weapons || []).filter((weapon) =>
    /^\d{2}-/.test(String(weapon.id || "")) && String(weapon.file || "").startsWith("assets/generated/weapons/"));
  report.staleFpsWeaponSets = (registry?.weapons || [])
    .filter((weapon) => weapon.fpsAnimations).length;
  assert(
    report.staleFpsWeaponSets === 0,
    `anciens composites FPS d'arme encore référencés: ${report.staleFpsWeaponSets}`,
  );
  const player = (registry?.characters || []).find((entry) => entry.category === "player");
  for (const animation of animationNames) {
    const sheetPath = path.join(root, player?.fpsAnimations?.[animation] || "");
    assert(fs.existsSync(sheetPath), `player/akio: planche FPS ${animation} absente`);
    if (fs.existsSync(sheetPath)) {
      report.fpsPlayerViewSheets += 1;
      const size = pngSize(sheetPath);
      assert(
        size?.width === 1440 && size?.height === 160,
        `player/akio: planche FPS ${animation} doit faire 1440x160`,
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
          size?.width === 240 && size?.height === 160,
          `player/akio: frame FPS ${frame} doit faire 240x160`,
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
  assert(report.fpsCharacterSheets === 480, `planches FPS ennemis: ${report.fpsCharacterSheets}, 480 attendues`);
  assert(report.fpsCharacterFramePngs === 2880, `frames FPS ennemis: ${report.fpsCharacterFramePngs}, 2880 attendues`);
  assert(report.fpsPlayerViewSheets === 5, `planches FPS joueur: ${report.fpsPlayerViewSheets}, 5 attendues`);
  assert(report.fpsPlayerViewFramePngs === 30, `frames FPS joueur: ${report.fpsPlayerViewFramePngs}, 30 attendues`);
  assert(report.fpsPlayerWeaponSprites === 10, `sprites FPS d'arme: ${report.fpsPlayerWeaponSprites}, 10 attendus`);
}

report.errors = errors;
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
