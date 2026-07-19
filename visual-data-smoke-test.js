"use strict";

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
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

function paethPredictor(left, up, upLeft) {
  const prediction = left + up - upLeft;
  const leftDistance = Math.abs(prediction - left);
  const upDistance = Math.abs(prediction - up);
  const upLeftDistance = Math.abs(prediction - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
}

function readRgbaPngAlphaMetrics(relativePath) {
  try {
    const png = fs.readFileSync(path.join(root, relativePath));
    const signature = "89504e470d0a1a0a";
    if (png.subarray(0, 8).toString("hex") !== signature) {
      throw new Error("signature PNG invalide");
    }

    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = -1;
    let interlace = -1;
    const idat = [];
    while (offset + 12 <= png.length) {
      const length = png.readUInt32BE(offset);
      const type = png.toString("ascii", offset + 4, offset + 8);
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      if (dataEnd + 4 > png.length) throw new Error(`chunk ${type} tronqué`);
      if (type === "IHDR") {
        width = png.readUInt32BE(dataStart);
        height = png.readUInt32BE(dataStart + 4);
        bitDepth = png[dataStart + 8];
        colorType = png[dataStart + 9];
        interlace = png[dataStart + 12];
      } else if (type === "IDAT") {
        idat.push(png.subarray(dataStart, dataEnd));
      } else if (type === "IEND") {
        break;
      }
      offset = dataEnd + 4;
    }

    if (!width || !height || !idat.length) throw new Error("IHDR/IDAT absent");
    if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
      throw new Error(`format RGBA8 non entrelacé attendu, reçu depth=${bitDepth} type=${colorType} interlace=${interlace}`);
    }

    const bytesPerPixel = 4;
    const stride = width * bytesPerPixel;
    const inflated = zlib.inflateSync(Buffer.concat(idat));
    if (inflated.length !== (stride + 1) * height) {
      throw new Error(`taille décompressée invalide (${inflated.length})`);
    }

    let cursor = 0;
    let previous = Buffer.alloc(stride);
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    const alphaValues = new Set();
    const opaqueByRow = Array(height).fill(0);
    const longestRunByRow = Array(height).fill(0);

    for (let y = 0; y < height; y += 1) {
      const filter = inflated[cursor];
      cursor += 1;
      const row = Buffer.alloc(stride);
      let currentRun = 0;
      for (let index = 0; index < stride; index += 1) {
        const raw = inflated[cursor + index];
        const left = index >= bytesPerPixel ? row[index - bytesPerPixel] : 0;
        const up = previous[index];
        const upLeft = index >= bytesPerPixel ? previous[index - bytesPerPixel] : 0;
        let predictor = 0;
        if (filter === 1) predictor = left;
        else if (filter === 2) predictor = up;
        else if (filter === 3) predictor = Math.floor((left + up) / 2);
        else if (filter === 4) predictor = paethPredictor(left, up, upLeft);
        else if (filter !== 0) throw new Error(`filtre PNG ${filter} non pris en charge`);
        row[index] = (raw + predictor) & 0xff;
      }
      cursor += stride;

      for (let x = 0; x < width; x += 1) {
        const alpha = row[x * bytesPerPixel + 3];
        alphaValues.add(alpha);
        if (alpha > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
        if (alpha === 255) {
          opaqueByRow[y] += 1;
          currentRun += 1;
          longestRunByRow[y] = Math.max(longestRunByRow[y], currentRun);
        } else {
          currentRun = 0;
        }
      }
      previous = row;
    }

    return {
      width,
      height,
      alphaValues,
      alphaBounds: maxX >= 0 ? [minX, minY, maxX + 1, maxY + 1] : null,
      opaqueByRow,
      longestRunByRow,
    };
  } catch (error) {
    errors.push(`${relativePath}: analyse alpha impossible (${error.message})`);
    return null;
  }
}

const canon = readJson(KageLevels.canonManifest);
const deployment = readJson(KageLevels.rosterManifest);
const areas = Object.values(KageLevels.areas || {});
const kurokawaPropsManifest = readJson("assets/modular/environments/kurokawa/props/manifest.json");
const environmentsManifest = readJson("assets/modular/manifests/environments.json");

const kurokawaSpriteById = new Map(
  (kurokawaPropsManifest?.sprites || []).map((sprite) => [sprite.id, sprite]),
);
const kurokawaZoneManifest = (environmentsManifest?.zones || [])
  .find((zone) => zone.id === "kurokawa");
const kurokawaProfileById = new Map(
  (kurokawaZoneManifest?.props?.profiles || []).map((profile) => [profile.id, profile]),
);
const kurokawaItemFiles = new Set(kurokawaZoneManifest?.props?.items || []);
const runtimeProps = areas.flatMap((area) =>
  (area.props || []).map((prop) => ({ areaId: area.id, ...prop })));

assert(kurokawaPropsManifest?.schema >= 2, "manifest Kurokawa: schema frontal absent");
assert(kurokawaPropsManifest?.count === 14, "manifest Kurokawa: 14 props/variantes attendus");
assert(environmentsManifest?.totals?.props === 86, "manifest environnements: total de 86 props attendu");
assert(kurokawaZoneManifest?.props?.renderPolicy?.gameplayProps === "front-orthographic", "Kurokawa: politique de projection frontale absente");
assert(kurokawaZoneManifest?.props?.renderPolicy?.threeQuarterVariants === "background-only", "Kurokawa: politique arrière-plan des vues 3/4 absente");

for (const spec of [
  {
    id: "tour-guet-kurokawa",
    file: "assets/modular/environments/kurokawa/props/tour-guet-kurokawa.png",
    size: [196, 320],
  },
  {
    id: "foyer-incendie",
    file: "assets/modular/environments/kurokawa/props/foyer-incendie.png",
    size: [274, 192],
  },
]) {
  const sprite = kurokawaSpriteById.get(spec.id);
  const profile = kurokawaProfileById.get(spec.id);
  const metadataRecords = [
    ["manifest local", sprite],
    ["manifest global", profile],
  ];
  for (const [label, metadata] of metadataRecords) {
    assert(metadata, `${spec.id}: ${label} absent`);
    assert(metadata?.projection === "front-orthographic", `${spec.id}: ${label}, projection frontale absente`);
    assert(metadata?.view === "front", `${spec.id}: ${label}, vue frontale absente`);
    assert(metadata?.depthUsage === "gameplay-plane" && metadata?.backgroundOnly === false, `${spec.id}: ${label}, usage gameplay invalide`);
    assert(metadata?.alphaMode === "binary", `${spec.id}: ${label}, alpha binaire non déclaré`);
    assert(metadata?.contactMode === "opaque-bottom", `${spec.id}: ${label}, contact opaque-bas absent`);
    assert(
      Array.isArray(metadata?.groundAnchor)
        && metadata.groundAnchor[0] === 0.5
        && metadata.groundAnchor[1] === 1,
      `${spec.id}: ${label}, ancre au sol invalide`,
    );
    assert(metadata?.baseline?.mode === "alpha-bottom", `${spec.id}: ${label}, baseline alpha absente`);
  }
  assert(kurokawaItemFiles.has(spec.file), `${spec.id}: sprite frontal absent de la liste globale`);

  const metrics = readRgbaPngAlphaMetrics(spec.file);
  if (!metrics || !sprite) continue;
  assert(
    metrics.width === spec.size[0] && metrics.height === spec.size[1],
    `${spec.id}: dimensions ${metrics.width}x${metrics.height}, ${spec.size.join("x")} attendues`,
  );
  assert(
    [...metrics.alphaValues].every((value) => value === 0 || value === 255),
    `${spec.id}: alpha intermédiaire détecté`,
  );
  const baselineY = sprite.baseline?.y;
  assert(
    metrics.alphaBounds?.[3] === baselineY + 1,
    `${spec.id}: bas alpha ${metrics.alphaBounds?.[3]}, baseline ${baselineY} attendue`,
  );
  assert(
    metrics.height - 1 - baselineY === sprite.transparentPadding,
    `${spec.id}: padding inférieur incohérent avec la baseline`,
  );
  assert(
    metrics.opaqueByRow[baselineY] >= sprite.baseline?.minimumOpaquePixels,
    `${spec.id}: contact au sol insuffisant (${metrics.opaqueByRow[baselineY]}px)`,
  );
  assert(
    metrics.longestRunByRow[baselineY] >= sprite.baseline?.minimumOpaqueRun,
    `${spec.id}: aucun appui continu assez large (${metrics.longestRunByRow[baselineY]}px)`,
  );

  const variantId = sprite.backgroundVariant;
  const variant = kurokawaSpriteById.get(variantId);
  const variantProfile = kurokawaProfileById.get(variantId);
  const variantFile = `assets/modular/environments/kurokawa/props/${variant?.file || ""}`;
  for (const [label, metadata] of [
    ["manifest local", variant],
    ["manifest global", variantProfile],
  ]) {
    assert(metadata, `${spec.id}: variante 3/4 ${label} absente`);
    assert(metadata?.variantOf === spec.id, `${spec.id}: variante 3/4 ${label} non reliée`);
    assert(metadata?.projection === "three-quarter", `${spec.id}: variante ${label} sans projection 3/4`);
    assert(metadata?.depthUsage === "background-only" && metadata?.backgroundOnly === true, `${spec.id}: variante ${label} non réservée à l'arrière-plan`);
    assert(metadata?.renderLayer === "background" && metadata?.collision === "none", `${spec.id}: variante ${label} peut encore entrer dans le gameplay`);
  }
  assert(kurokawaItemFiles.has(variantFile), `${spec.id}: variante 3/4 absente de la liste globale`);
  for (const runtimeProp of runtimeProps.filter((prop) => prop.file === variantId)) {
    assert(
      runtimeProp.layer === "back"
        && ["back-architecture", "distant-architecture"].includes(runtimeProp.depthBand),
      `${spec.id}: variante 3/4 hors couche arrière (${runtimeProp.areaId})`,
    );
    assert(
      runtimeProp.colliderProfile?.blocksMovement === false
        && runtimeProp.colliderProfile?.type === "visualOnly",
      `${spec.id}: variante 3/4 avec collision de gameplay (${runtimeProp.areaId})`,
    );
  }
}

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
  const isKurokawa = ["village", "castle"].includes(area.chapterId);
  const isHistoricalKai = ["forest", "bamboo", "fields", "village", "castle"]
    .includes(area.chapterId);
  if (isHistoricalKai) {
    assert(area.regionId === "kai", `${area.id}: regionId kai absent`);
    assert(area.settlementId === "tsuru", `${area.id}: settlementId tsuru absent`);
  }
  if (isKurokawa) {
    assert(area.districtId === "tsuru-kurokawa", `${area.id}: districtId Kurokawa incohérent`);
  } else if (["forest", "bamboo", "fields"].includes(area.chapterId)) {
    assert(area.districtId === area.id, `${area.id}: districtId naturel incohérent`);
  } else if (area.chapterId === "contemporary") {
    assert(
      area.regionId === "tokyo"
        && area.settlementId === "tokyo"
        && area.districtId === "rift-quarantine",
      `${area.id}: identité du Tokyo contemporain incohérente`,
    );
  } else if (area.chapterId === "cyberpunk") {
    assert(
      area.regionId === "neo-edo"
        && area.settlementId === "neo-tokyo"
        && area.districtId === "shogun-zero-sector",
      `${area.id}: identité du Neo-Edo cyberpunk incohérente`,
    );
  }
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

  // Les murs continus sont une règle de lisibilité urbaine propre à
  // Kurokawa et au château. Les biomes naturels et les deux failles
  // temporelles utilisent leurs propres silhouettes/parallaxes continues.
  if (isKurokawa) {
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
  }

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
const surfaceProfiles = KageLevels.visualStandards?.surfaceProfiles;
for (const [profileId, footstep] of [
  ["asphalt", "asphalt"],
  ["metal", "metal"],
  ["techMetal", "tech"],
  ["techStreet", "tech"],
]) {
  assert(
    surfaceProfiles?.[profileId]?.footstep === footstep,
    `profil de surface ${profileId}: SFX ${footstep} absent`,
  );
}
assert(fpsMaterials?.tiles?.length === 24, "bibliothèque FPS sémantique incomplète");
assert(
  ["feudal", "contemporary", "cyber"].every((atlasId) =>
    fpsMaterials?.atlases?.[atlasId]?.src),
  "banques de textures FPS par époque incomplètes",
);
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
  frontOrthographicProps: 2,
  backgroundOnlyThreeQuarterVariants: 2,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
