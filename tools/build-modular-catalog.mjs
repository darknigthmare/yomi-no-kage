import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const modularRoot = path.join(root, "assets", "modular");
const manifestsRoot = path.join(modularRoot, "manifests");
const characterRoot = path.join(modularRoot, "characters");
const fpsRoot = path.join(modularRoot, "fps");
const fpsCharacterRoot = path.join(fpsRoot, "characters");
const fpsPlayerRoot = path.join(fpsRoot, "player", "akio");
const fpsPlayerBodyRoot = path.join(fpsPlayerRoot, "body");
const fpsPlayerWeaponsRoot = path.join(fpsPlayerRoot, "weapons");
const outputCatalog = path.join(modularRoot, "catalog.json");
const outputRegistry = path.join(modularRoot, "registry.json");

const animationNames = ["idle", "move", "attack", "hurt", "death"];
const loreKatanaIdPattern = /^(?:0[1-9]|10)-/;
const categoryOrder = ["player", "legacy", "regular", "special", "miniboss", "boss", "giant"];
const categoryLabels = {
  player: "Joueur",
  legacy: "Bestiaire historique",
  regular: "Ennemi",
  special: "Ennemi spécial",
  miniboss: "Sous-boss",
  boss: "Boss",
  giant: "Boss massif",
};

function toWebPath(filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function fpsAnimationPaths(folder) {
  return Object.fromEntries(
    animationNames.map((animation) => [animation, toWebPath(path.join(folder, "sheets", `${animation}.png`))]),
  );
}

function fpsFramePaths(folder, sprite) {
  return Object.fromEntries(animationNames.map((animation) => {
    const declaredFrames = sprite?.animations?.[animation];
    if (Array.isArray(declaredFrames) && declaredFrames.length > 0) {
      return [
        animation,
        declaredFrames
          .map((frame) => (typeof frame === "string" ? frame : frame?.file))
          .filter(Boolean)
          .map((file) => toWebPath(path.join(folder, file))),
      ];
    }

    const frameFolder = path.join(folder, "frames", animation);
    const discoveredFrames = fs.existsSync(frameFolder)
      ? fs.readdirSync(frameFolder, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"))
        .sort((a, b) => a.name.localeCompare(b.name, "fr"))
        .map((entry) => toWebPath(path.join(frameFolder, entry.name)))
      : [];
    return [animation, discoveredFrames];
  }));
}

function fpsWeaponMounts(sprite) {
  return Object.fromEntries(animationNames.map((animation) => [
    animation,
    (sprite?.animations?.[animation] || []).map((frame) => frame?.weaponMount || null),
  ]));
}

function loreKatanaFpsSprites() {
  if (!fs.existsSync(fpsPlayerWeaponsRoot)) return {};
  return Object.fromEntries(
    fs.readdirSync(fpsPlayerWeaponsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && loreKatanaIdPattern.test(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"))
      .flatMap((entry) => {
        const spriteMetaFile = path.join(fpsPlayerWeaponsRoot, entry.name, "sprite.json");
        const spriteMeta = readJsonIfExists(spriteMetaFile);
        const spriteFile = path.join(fpsPlayerWeaponsRoot, entry.name, spriteMeta?.file || "weapon.png");
        return fs.existsSync(spriteFile) ? [[entry.name, toWebPath(spriteFile)]] : [];
      }),
  );
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
          ...metadataByFile.get(file),
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
    const character = {
      id: entry.name,
      category,
      name: metadata.name || titleFromId(entry.name),
      subtitle: metadata.subtitle || categoryLabels[category],
      lore: asText(metadata.lore) || `Créature originale du bestiaire ${categoryLabels[category].toLowerCase()} de Kurokawa.`,
      gameplay: metadata.gameplay || "Cinq animations modulaires et arme indépendante.",
      prompt: metadata.prompt || "",
      stats: metadata.stats || null,
      pattern: metadata.pattern || null,
      weaponId: metadata.weaponId || metadata.weapon || metadata.equipment?.weaponId || metadata.weaponRole || null,
      weaponRoleOriginal: metadata.weaponRoleOriginal || null,
      era: metadata.era || null,
      zoneAffinity: metadata.zoneAffinity || null,
      viewCoverage: metadata.viewCoverage || sprite.viewCoverage?.mode || sprite.animationContract?.view || null,
      animationContract: metadata.animationContract || sprite.animationContract || null,
      weaponsBakedIntoBody: sprite.weaponsBakedIntoBody === true,
      sourceGeneration: metadata.sourceGeneration || null,
      file: toWebPath(masterFile),
      sprite: toWebPath(spriteFile),
      animations,
      frames: Object.fromEntries(
        animationNames.map((animation) => [
          animation,
          sprite.animations?.[animation]?.map((frame) => toWebPath(path.join(folder, frame.file))) || [],
        ]),
      ),
      weaponRig: sprite.weaponRig || null,
      attachmentRigs: sprite.attachmentRigs || null,
      weaponRenderOrder: sprite.weaponRig?.renderOrder
        || sprite.renderOrder
        || ["weapon", "body"],
      generationTool: metadata.generationTool || "OpenAI ImageGen built-in",
      manifest: metadata.sourceFile || null,
    };

    const fpsFolder = category === "player" && entry.name === "akio"
      ? fpsPlayerBodyRoot
      : path.join(fpsCharacterRoot, category, entry.name);
    const fpsSpriteFile = path.join(fpsFolder, "sprite.json");
    const fpsSprite = readJsonIfExists(fpsSpriteFile);
    if (fpsSprite) {
      Object.assign(character, {
        fpsAnimations: fpsAnimationPaths(fpsFolder),
        fpsFrames: fpsFramePaths(fpsFolder, fpsSprite),
        fpsSprite: toWebPath(fpsSpriteFile),
        fpsGeneration: metadata.fpsPrompt || fpsSprite.generationTool || fpsSprite.sourceView || "FPS billboard sprites",
        fpsWeaponRig: fpsSprite.weaponRig || null,
        fpsRenderOrder: fpsSprite.weaponRig?.renderOrder
          || fpsSprite.renderOrder
          || ["body", "weapon"],
      });
    }

    if (category === "player" && entry.name === "akio" && fpsSprite) {
      Object.assign(character, {
        fpsWeaponMounts: fpsWeaponMounts(fpsSprite),
        fpsWeaponsBakedIntoBody: fpsSprite.weaponsBakedIntoBody === true,
        fpsWeaponSprites: loreKatanaFpsSprites(),
      });
    }

    characters.push(character);
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
    projection: metadata.projection || undefined,
    view: metadata.view || undefined,
    depthUsage: metadata.depthUsage || undefined,
    backgroundOnly: typeof metadata.backgroundOnly === "boolean" ? metadata.backgroundOnly : undefined,
    renderLayer: metadata.renderLayer || undefined,
    collision: metadata.collision || undefined,
    alphaMode: metadata.alphaMode || undefined,
    transparentPadding: Number.isFinite(metadata.transparentPadding) ? metadata.transparentPadding : undefined,
    groundAnchor: metadata.groundAnchor || undefined,
    contactMode: metadata.contactMode || undefined,
    baseline: metadata.baseline || undefined,
    variantOf: metadata.variantOf || undefined,
    backgroundVariant: metadata.backgroundVariant || undefined,
  };
}

const weaponPngs = [
  ...walkFiles(path.join(modularRoot, "weapons")),
  ...walkFiles(path.join(root, "assets", "generated", "weapons")),
]
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .filter((file) => !/(^|[\\/])(source|sources|tmp|atlases|components)([\\/]|$)/i.test(file))
  .filter((file) => !/(?:^|[-_.])(source|raw|alpha|contact|atlas|preview)(?:[-_.]|$)/i.test(path.basename(file)));
const weapons = weaponPngs.map((file) => {
  const weapon = assetFromPng(file, "weapon");
  const isGeneratedLoreKatana = loreKatanaIdPattern.test(weapon.id)
    && toWebPath(file).startsWith("assets/generated/weapons/");
  if (!isGeneratedLoreKatana) return weapon;

  const fpsWeaponFolder = path.join(fpsPlayerWeaponsRoot, weapon.id);
  const fpsSpriteMetaFile = path.join(fpsWeaponFolder, "sprite.json");
  const fpsSpriteMeta = readJsonIfExists(fpsSpriteMetaFile);
  if (!fpsSpriteMeta) return weapon;

  const fpsSpriteFile = path.join(fpsWeaponFolder, fpsSpriteMeta.file || "weapon.png");
  if (!fs.existsSync(fpsSpriteFile)) return weapon;
  return {
    ...weapon,
    fpsSprite: toWebPath(fpsSpriteFile),
    fpsSpriteMeta: toWebPath(fpsSpriteMetaFile),
    fpsGripAnchor: fpsSpriteMeta.gripAnchor || null,
  };
});

const environmentPngs = walkFiles(path.join(modularRoot, "environments"))
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .filter((file) => !/(^|[\\/])(source|sources|tmp|depth-portals)([\\/]|$)/i.test(file))
  .filter((file) => !/(?:^|[-_.])(source|raw|alpha|contact|atlas|preview)(?:[-_.]|$)/i.test(path.basename(file)));
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
  stats: character.stats,
  pattern: character.pattern,
  animations: character.animations,
  frames: character.frames,
  weaponId: character.weaponId,
  weaponRoleOriginal: character.weaponRoleOriginal,
  era: character.era,
  zoneAffinity: character.zoneAffinity,
  viewCoverage: character.viewCoverage,
  animationContract: character.animationContract,
  weaponsBakedIntoBody: character.weaponsBakedIntoBody,
  sourceGeneration: character.sourceGeneration,
  weaponRig: character.weaponRig,
  attachmentRigs: character.attachmentRigs,
  weaponRenderOrder: character.weaponRenderOrder,
  generationTool: character.generationTool,
  manifest: character.manifest,
  fpsAnimations: character.fpsAnimations,
  fpsFrames: character.fpsFrames,
  fpsSprite: character.fpsSprite,
  fpsGeneration: character.fpsGeneration,
  fpsWeaponRig: character.fpsWeaponRig,
  fpsWeaponMounts: character.fpsWeaponMounts,
  fpsRenderOrder: character.fpsRenderOrder,
  fpsWeaponsBakedIntoBody: character.fpsWeaponsBakedIntoBody,
  fpsWeaponSprites: character.fpsWeaponSprites,
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

const fpsPlayer = characters.find((entry) => entry.category === "player" && entry.id === "akio");
const fpsEnemies = characters.filter((entry) => entry.category !== "player" && entry.fpsSprite);
const fpsCharacters = characters.filter((entry) => entry.fpsSprite);
const fpsPlayerSprite = readJsonIfExists(path.join(fpsPlayerBodyRoot, "sprite.json"));
const firstEnemyFpsSprite = fpsEnemies.length > 0
  ? readJsonIfExists(path.join(root, fpsEnemies[0].fpsSprite))
  : null;
const fpsPipeline = {
  schema: 1,
  root: toWebPath(fpsRoot),
  animations: animationNames,
  characterCount: fpsCharacters.length,
  weaponCount: weapons.length,
  cell: [
    firstEnemyFpsSprite?.frameWidth || 96,
    firstEnemyFpsSprite?.frameHeight || 128,
  ],
  note: "FPS assets are separate files and are loaded through fpsAnimations/fpsFrames.",
};
const fps = {
  characters: fpsEnemies.length,
  animations: animationNames,
  framesPerAnimation: 6,
  source: "OpenAI ImageGen player arms master with independent weapon sprites",
  playerViewModels: fpsPlayer?.fpsSprite ? 1 : 0,
  playerWeaponSprites: Object.keys(fpsPlayer?.fpsWeaponSprites || {}).length,
  playerFrameSize: [
    fpsPlayerSprite?.frameWidth || 960,
    fpsPlayerSprite?.frameHeight || 640,
  ],
  enemySource: "Detailed OpenAI 2D masters normalized as grounded Doom billboards",
};

fs.writeFileSync(outputRegistry, `${JSON.stringify({
  schema: 1,
  generatedAt: new Date().toISOString(),
  animationStandard: { animations: animationNames, framesPerAnimation: 6, weaponsBakedIntoBodies: false },
  weaponRigStandard: {
    schema: 1,
    coordinateSpace: "frame-normalized",
    fields: ["primaryHand", "secondaryHand", "angle", "scale", "layer"],
    layers: ["behind-body", "front-body", "hidden"],
    renderOrder: ["body", "weapon"],
  },
  counts,
  characters,
  weapons,
  environments,
  fpsPipeline,
  fps,
}, null, 2)}\n`, "utf8");

fs.writeFileSync(outputCatalog, `${JSON.stringify({
  schema: 2,
  generatedAt: new Date().toISOString(),
  counts,
  assets,
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify(counts, null, 2));
