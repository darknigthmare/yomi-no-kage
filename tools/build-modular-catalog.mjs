import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const modularRoot = path.join(root, "assets", "modular");
const manifestsRoot = path.join(modularRoot, "manifests");
const characterRoot = path.join(modularRoot, "characters");
const outputCatalog = path.join(modularRoot, "catalog.json");
const outputRegistry = path.join(modularRoot, "registry.json");

const animationNames = ["idle", "move", "attack", "hurt", "death"];
const categoryOrder = ["player", "legacy", "regular", "special", "miniboss", "boss", "giant"];
const categoryLabels = {
  player: "Joueur",
  legacy: "Bestiaire historique",
  regular: "Ennemi",
  special: "Ennemi spécial",
  miniboss: "Sous-boss",
  boss: "Boss",
  giant: "Boss géant",
};

function toWebPath(filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function asText(value) {
  return Array.isArray(value) ? value.join(" ") : (value || "");
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
}

function titleFromId(id) {
  return id
    .replace(/^(r|sp|mb|b|giant|wp|env)[-_]?\d+[-_]?/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

const metadataById = new Map();
const metadataByFile = new Map();
const manifestFiles = [
  path.join(root, "assets", "generated", "catalog.json"),
  ...walkFiles(manifestsRoot),
  ...walkFiles(path.join(modularRoot, "environments")),
  ...walkFiles(path.join(modularRoot, "weapons")),
].filter((file) => file.endsWith(".json") && fs.existsSync(file));

function indexMetadata(value, sourceFile) {
  if (Array.isArray(value)) {
    value.forEach((entry) => indexMetadata(entry, sourceFile));
    return;
  }
  if (!value || typeof value !== "object") return;
  if (typeof value.file === "string") {
    metadataByFile.set(value.file, {
      ...metadataByFile.get(value.file),
      ...value,
      sourceFile,
    });
  }
  const candidateId = value.id || value.slug || value.assetId;
  if (candidateId && (value.name || value.file || value.folder || value.lore || value.prompt)) {
    const existing = metadataById.get(String(candidateId)) || {};
    const richMetadata = Boolean(
      value.name || value.lore || value.gameplay || value.prompt || value.anchor || value.weaponId || value.equipment,
    );
    metadataById.set(String(candidateId), {
      ...existing,
      ...value,
      sourceFile: richMetadata || !existing.sourceFile ? sourceFile : existing.sourceFile,
    });
  }
  Object.values(value).forEach((entry) => indexMetadata(entry, sourceFile));
}

for (const manifestFile of manifestFiles) {
  indexMetadata(readJson(manifestFile), toWebPath(manifestFile));
}

const environmentManifestPath = path.join(manifestsRoot, "environments.json");
if (fs.existsSync(environmentManifestPath)) {
  const environmentManifest = readJson(environmentManifestPath);
  const sourceFile = toWebPath(environmentManifestPath);
  const layerLabels = { sky: "Ciel", far: "Lointain", mid: "Intermédiaire", near: "Premier plan" };
  for (const zone of environmentManifest.zones || []) {
    for (const [layerId, layer] of Object.entries(zone.layers || {})) {
      if (!layer?.file) continue;
      metadataByFile.set(layer.file, {
        name: `${zone.name} — ${layerLabels[layerId] || titleFromId(layerId)}`,
        lore: zone.lore || "",
        gameplay: zone.gameplay || "",
        prompt: layer.prompt || "",
        sourceFile,
      });
    }
    for (const groupName of ["props", "platforms"]) {
      const group = zone[groupName] || {};
      for (const file of group.items || []) {
        metadataByFile.set(file, {
          lore: zone.lore || "",
          gameplay: zone.gameplay || "",
          prompt: group.prompt || "",
          sourceFile,
        });
      }
    }
  }
}

const weaponsManifestPath = path.join(manifestsRoot, "weapons.json");
if (fs.existsSync(weaponsManifestPath)) {
  const weaponsManifest = readJson(weaponsManifestPath);
  const sourceFile = toWebPath(weaponsManifestPath);
  for (const entry of weaponsManifest.entries || []) {
    const familyId = String(entry.file || "").split("/").at(-2);
    const family = (weaponsManifest.packs || []).find((pack) => pack.id === familyId);
    if (!entry.file) continue;
    metadataByFile.set(entry.file, {
      ...metadataByFile.get(entry.file),
      ...entry,
      family: family?.name || familyId || null,
      prompt: family?.prompt || "",
      generationTool: weaponsManifest.generationTool || "OpenAI ImageGen built-in",
      sourceFile,
    });
  }
}

const characters = [];
for (const category of categoryOrder) {
  const categoryPath = path.join(characterRoot, category);
  if (!fs.existsSync(categoryPath)) continue;
  const entries = fs.readdirSync(categoryPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  for (const entry of entries) {
    const folder = path.join(categoryPath, entry.name);
    const spriteFile = path.join(folder, "sprite.json");
    const masterFile = path.join(folder, "master.png");
    if (!fs.existsSync(spriteFile) || !fs.existsSync(masterFile)) continue;
    const sprite = readJson(spriteFile);
    const metadata = metadataById.get(entry.name) || {};
    const animations = Object.fromEntries(
      animationNames.map((animation) => [animation, toWebPath(path.join(folder, "sheets", `${animation}.png`))]),
    );
    characters.push({
      id: entry.name,
      category,
      name: metadata.name || titleFromId(entry.name),
      subtitle: metadata.subtitle || categoryLabels[category],
      lore: asText(metadata.lore) || `Créature originale du bestiaire ${categoryLabels[category].toLowerCase()} de Kurokawa.`,
      gameplay: metadata.gameplay || "Cinq animations modulaires et arme indépendante.",
      prompt: metadata.prompt || "",
      weaponId: metadata.weaponId || metadata.weapon || metadata.equipment?.weaponId || metadata.weaponRole || null,
      file: toWebPath(masterFile),
      sprite: toWebPath(spriteFile),
      animations,
      frames: Object.fromEntries(
        animationNames.map((animation) => [
          animation,
          sprite.animations?.[animation]?.map((frame) => toWebPath(path.join(folder, frame.file))) || [],
        ]),
      ),
      generationTool: metadata.generationTool || "OpenAI ImageGen built-in",
      manifest: metadata.sourceFile || null,
    });
  }
}

function metadataForFile(filePath) {
  const webPath = toWebPath(filePath);
  const basename = path.basename(filePath, path.extname(filePath));
  const parent = path.basename(path.dirname(filePath));
  return metadataByFile.get(webPath) || metadataById.get(basename) || metadataById.get(parent) || {};
}

function assetFromPng(filePath, type) {
  const metadata = metadataForFile(filePath);
  const basename = path.basename(filePath, path.extname(filePath));
  return {
    type,
    id: metadata.id || `${type}-${toWebPath(filePath).replace(/[/.]/g, "-")}`,
    name: metadata.name || titleFromId(basename),
    subtitle: metadata.subtitle || (
      type === "weapon" ? "Arme interchangeable" :
      type === "platform" ? "Tuile de plateforme" :
      type === "prop" ? "Sprite de décor indépendant" :
      "Couche de parallaxe indépendante"
    ),
    file: toWebPath(filePath),
    lore: asText(metadata.lore),
    gameplay: metadata.gameplay || "Sprite autonome, repositionnable sans recoller le décor.",
    prompt: metadata.prompt || "",
    anchor: metadata.anchor || metadata.gripAnchor || null,
    defaultRotation: Number.isFinite(metadata.defaultRotation) ? metadata.defaultRotation : null,
    family: metadata.family || metadata.group || null,
    generationTool: metadata.generationTool || "OpenAI ImageGen built-in",
    manifest: metadata.sourceFile || null,
  };
}

const weaponPngs = [
  ...walkFiles(path.join(modularRoot, "weapons")),
  ...walkFiles(path.join(root, "assets", "generated", "weapons")),
]
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .filter((file) => !/(^|[\\/])(source|sources|tmp|atlases)([\\/]|$)/i.test(file))
  .filter((file) => !/(source|raw|alpha|contact|atlas|preview)/i.test(path.basename(file)));
const weapons = weaponPngs.map((file) => assetFromPng(file, "weapon"));

const environmentPngs = walkFiles(path.join(modularRoot, "environments"))
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .filter((file) => !/(^|[\\/])(source|sources|tmp)([\\/]|$)/i.test(file))
  .filter((file) => !/(source|raw|alpha|contact|atlas|preview)/i.test(path.basename(file)));
const environments = environmentPngs.map((file) => {
  const normalized = toWebPath(file).toLowerCase();
  const type = /\/layers\//.test(normalized)
    ? "environment-layer"
    : (/(platform|tile|ground|ledge|bridge|roof)/.test(normalized)
    ? "platform"
    : (/(prop|house|maison|torii|bamboo|bambou|tree|lantern|cart|well|shrine|gate)/.test(normalized)
      ? "prop"
      : "environment-layer"));
  const asset = assetFromPng(file, type);
  const relativeParts = path.relative(path.join(modularRoot, "environments"), file).split(path.sep);
  const zoneId = relativeParts[0];
  asset.id = `${type}-${zoneId}-${metadataForFile(file).id || path.basename(file, ".png")}`;
  if (type === "environment-layer" && !metadataForFile(file).name) {
    const zone = titleFromId(relativeParts[0]);
    const layerNames = { sky: "Ciel", far: "Lointain", mid: "Intermédiaire", near: "Premier plan" };
    asset.name = `${zone} — ${layerNames[path.basename(file, ".png")] || titleFromId(path.basename(file, ".png"))}`;
  }
  return asset;
});

const characterAssets = characters.map((character) => ({
  type: character.category,
  id: character.id,
  name: character.name,
  subtitle: character.subtitle,
  file: character.file,
  lore: character.lore,
  gameplay: character.gameplay,
  prompt: character.prompt,
  animations: character.animations,
  frames: character.frames,
  weaponId: character.weaponId,
  generationTool: character.generationTool,
  manifest: character.manifest,
}));

const assets = [...characterAssets, ...weapons, ...environments];
const counts = {
  characters: characters.length,
  players: characters.filter((entry) => entry.category === "player").length,
  enemies: characters.filter((entry) => entry.category !== "player").length,
  regular: characters.filter((entry) => entry.category === "regular").length,
  special: characters.filter((entry) => entry.category === "special").length,
  miniboss: characters.filter((entry) => entry.category === "miniboss").length,
  boss: characters.filter((entry) => entry.category === "boss").length,
  giant: characters.filter((entry) => entry.category === "giant").length,
  animationSheets: characters.length * animationNames.length,
  framePngs: characters.length * animationNames.length * 6,
  weapons: weapons.length,
  environmentSprites: environments.length,
  catalogAssets: assets.length,
};

fs.writeFileSync(outputRegistry, `${JSON.stringify({
  schema: 1,
  generatedAt: new Date().toISOString(),
  animationStandard: { animations: animationNames, framesPerAnimation: 6, weaponsBakedIntoBodies: false },
  counts,
  characters,
  weapons,
  environments,
}, null, 2)}\n`, "utf8");

fs.writeFileSync(outputCatalog, `${JSON.stringify({
  schema: 2,
  generatedAt: new Date().toISOString(),
  counts,
  assets,
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify(counts, null, 2));
