#!/usr/bin/env node
/**
 * Build the OpenAI ImageGen authoring manifest for the six missing authored
 * enemy views.
 *
 * This tool is intentionally data-only: it reads the current roster, identity
 * prompts and source PNG headers, then writes one JSON prompt manifest. It
 * never opens, edits or replaces a bitmap and it does not touch runtime data.
 *
 * Usage:
 *   node tools/build-directional-authoring-prompts.mjs
 *   node tools/build-directional-authoring-prompts.mjs --check
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const REGISTRY_PATH = path.join(ROOT, "assets", "modular", "registry.json");
const OUTPUT_PATH = path.join(
  ROOT,
  "assets",
  "modular",
  "manifests",
  "directional-authoring-prompts.json",
);
const OUTPUT_FOLDER_NAME = "sources-authored-six-way-v1";
const ANIMATIONS = ["idle", "move", "attack", "hurt", "death"];

const DIRECTIONS = [
  {
    id: "front",
    yawDegrees: 0,
    vector: [0, 1],
    viewPrompt:
      "strict orthographic FRONT view, character facing directly toward the camera; shoulders, head and pelvis centered, with the face readable and no lateral turn",
  },
  {
    id: "front-left",
    yawDegrees: -45,
    vector: [-1, 1],
    viewPrompt:
      "strict 45-degree FRONT-LEFT view: the movement and aim vector points toward the camera and screen-left; show one coherent three-quarter body, never a front half joined to a side half",
  },
  {
    id: "back-left",
    yawDegrees: -135,
    vector: [-1, -1],
    viewPrompt:
      "strict 45-degree BACK-LEFT view: the movement and aim vector points away from the camera and screen-left; the back of the costume dominates and the face is not turned toward the camera",
  },
  {
    id: "back",
    yawDegrees: 180,
    vector: [0, -1],
    viewPrompt:
      "strict orthographic BACK view, character facing directly away from the camera; back of head, torso and costume centered, with no face visible and no lateral turn",
  },
  {
    id: "back-right",
    yawDegrees: 135,
    vector: [1, -1],
    viewPrompt:
      "strict 45-degree BACK-RIGHT view: the movement and aim vector points away from the camera and screen-right; the back of the costume dominates and the face is not turned toward the camera",
  },
  {
    id: "front-right",
    yawDegrees: 45,
    vector: [1, 1],
    viewPrompt:
      "strict 45-degree FRONT-RIGHT view: the movement and aim vector points toward the camera and screen-right; show one coherent three-quarter body, never a front half joined to a side half",
  },
];

const PHASE_CONTRACT = {
  idle: [
    "neutral grounded loop pose",
    "small inhale or body rise",
    "breathing apex",
    "small exhale or body drop",
    "settling pose",
    "return pose that loops cleanly into column 1",
  ],
  move: [
    "left-foot contact or equivalent first locomotion contact",
    "first passing pose",
    "first recoil or lifted pose",
    "right-foot contact or equivalent opposite locomotion contact",
    "second passing pose",
    "second recoil or lifted pose that loops into column 1",
  ],
  attack: [
    "readable neutral guard with empty hands",
    "clear anticipation or wind-up with empty hands",
    "early unarmed strike body motion",
    "maximum unarmed extension or impact pose",
    "follow-through with empty hands",
    "recovery toward the neutral guard",
  ],
  hurt: [
    "first impact recognition",
    "strong recoil",
    "maximum displaced recoil",
    "balance recovery",
    "guard recovery",
    "stable hurt-end pose",
  ],
  death: [
    "fatal impact recognition",
    "loss of balance",
    "knees or body beginning to fall",
    "major fall phase",
    "ground contact",
    "final fully settled pose",
  ],
};

function webPath(absolutePath) {
  return path.relative(ROOT, absolutePath).split(path.sep).join("/");
}

function readJson(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function fileExists(webFile) {
  return typeof webFile === "string" && fs.existsSync(path.join(ROOT, webFile));
}

function pngHeader(webFile) {
  const absolutePath = path.join(ROOT, webFile);
  if (!fs.existsSync(absolutePath)) {
    return { valid: false, width: null, height: null, bytes: null };
  }
  const stat = fs.statSync(absolutePath);
  if (stat.size < 24) {
    return { valid: false, width: null, height: null, bytes: stat.size };
  }
  const handle = fs.openSync(absolutePath, "r");
  try {
    const header = Buffer.alloc(24);
    fs.readSync(handle, header, 0, header.length, 0);
    const signature = header.subarray(0, 8).toString("hex");
    return {
      valid: signature === "89504e470d0a1a0a",
      width: header.readUInt32BE(16),
      height: header.readUInt32BE(20),
      bytes: stat.size,
    };
  } finally {
    fs.closeSync(handle);
  }
}

function eraBucket(character) {
  const era = String(character.era || "").toLowerCase();
  if (
    era.includes("contemporary") ||
    era.includes("tokyo-2026") ||
    character.id.startsWith("new-modern-")
  ) {
    return "contemporary";
  }
  if (
    era.includes("cyber") ||
    era.includes("neo-tokyo") ||
    character.id.startsWith("new-cyber-")
  ) {
    return "cyberpunk";
  }
  return "historical";
}

function compactText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function identityBrief(character) {
  const sourcePrompt = String(character.prompt || "");
  const primary = sourcePrompt
    .split(/\r?\n/)
    .find((line) => /^Primary request:/i.test(line.trim()));
  if (primary) {
    return compactText(primary.replace(/^Primary request:\s*/i, ""));
  }

  const giantMatch = sourcePrompt.match(
    /poses of (.+?)(?:\.\s*Row 1|\.\s*No weapon)/i,
  );
  if (giantMatch) {
    return `Create the exact established ${character.name} identity: ${compactText(
      giantMatch[1],
    )}.`;
  }

  const crossEra = sourcePrompt
    .split(
      /,\s*(?:strictement en vue|en grille)|\.\s*Produire exactement|\.\s*Les cinq lignes/i,
    )[0]
    ?.trim();
  if (crossEra && crossEra.length >= 24) {
    return compactText(crossEra);
  }

  const firstSentence = sourcePrompt.match(/^(.+?\.)/s)?.[1];
  if (firstSentence) {
    return compactText(firstSentence);
  }

  return `${character.name}, ${character.subtitle || "infected enemy"}: ${compactText(
    character.lore,
  )}`;
}

function identitySourceFor(character) {
  const folder = path.dirname(path.join(ROOT, character.file));
  const candidates = [
    path.join(folder, "source-master.png"),
    path.join(folder, "source", "master-imagegen-raw.png"),
    path.join(folder, "master.png"),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(`${character.category}/${character.id}: identity source missing`);
  }
  return webPath(found);
}

function chromaFor(character) {
  const sprite = readJson(path.join(ROOT, character.sprite));
  return (
    sprite?.source?.sourceChroma ||
    sprite?.source?.sourceBackground ||
    "#ff00ff"
  ).toLowerCase();
}

function existingDirectionalSources(character) {
  const base = path.join(
    ROOT,
    "assets",
    "modular",
    "fps",
    "characters",
    character.category,
    character.id,
    "sources-directional",
  );
  const manifestPath = path.join(base, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return [];
  }
  const manifest = readJson(manifestPath);
  return ["front", "back"]
    .map((direction) => {
      const declared = manifest?.files?.[direction];
      if (!declared?.file) {
        return null;
      }
      const file = webPath(path.join(base, declared.file));
      const header = pngHeader(file);
      return {
        characterId: character.id,
        category: character.category,
        eraBucket: eraBucket(character),
        direction,
        file,
        callId: declared.callId || null,
        validPng: header.valid,
        width: header.width,
        height: header.height,
        bytes: header.bytes,
        used: declared.used === true,
        runtimeUse: declared.runtimeUse || null,
        usableAsIdentityReference: header.valid,
        runtimeReady:
          header.valid &&
          declared.used === true &&
          declared.runtimeUse === "runtime-authoritative",
        rejection:
          manifest.runtimeDecision ||
          "no runtime-authoring decision declared",
      };
    })
    .filter(Boolean);
}

function directionPrompt({
  character,
  direction,
  brief,
  chroma,
  identitySource,
  phaseReferences,
}) {
  const lore = compactText(character.lore);
  const sizeRule =
    character.category === "giant"
      ? "Keep the established massive boss scale, but fit the complete silhouette inside every cell with safe gutters."
      : character.category === "boss" || character.category === "miniboss"
        ? "Keep the established boss-tier proportions and readable silhouette, but fit the complete body inside every cell."
        : "Keep the exact established gameplay scale and proportions in every cell.";

  return [
    "Use case: stylized-concept",
    "Asset type: production direction-specific modular enemy animation atlas for Yomi no Kage",
    `Character: ${character.name} (${character.id}), ${character.subtitle || character.category}.`,
    `Identity authority: attach ${identitySource} for costume, anatomy, palette and face. Attach these five normalized six-frame lateral sheets as the timing authority: ${ANIMATIONS.map(
      (animation) => `${animation}=${phaseReferences[animation]}`,
    ).join("; ")}. Preserve identity only from any older directional reference, never its off-phase poses.`,
    `Exact identity brief: ${brief}`,
    lore ? `Lore anchor: ${lore}` : "",
    `Camera contract: ${direction.viewPrompt}. Logical yaw ${direction.yawDegrees} degrees; direction vector [${direction.vector.join(", ")}].`,
    "Generate ONE NEW atlas as a strict invisible grid of exactly 6 columns by 5 rows: exactly 30 isolated full-body poses of this one character. Rows top-to-bottom are idle, move, attack, hurt, death. Columns left-to-right are animation phases 1 through 6.",
    "Cross-direction phase lock is mandatory: cell row R, column C must depict the same body pose, limb contact, action timing, silhouette height and ground contact as row R, column C in the attached lateral phase reference, seen only from this requested camera angle. Do not invent, reorder, duplicate or interpolate phases.",
    `Column phase contract by row: ${ANIMATIONS.map(
      (animation) =>
        `${animation}=[${PHASE_CONTRACT[animation]
          .map((phase, index) => `${index + 1}:${phase}`)
          .join("; ")}]`,
    ).join(" | ")}.`,
    "Every cell must contain exactly ONE complete coherent silhouette. Never splice, fuse, blend, average, overlay or join mirrored/front/side half-bodies. No doubled torso, second head, duplicate limb, ghost limb, partial silhouette or pose leaking across cells.",
    "Modularity is mandatory: BOTH HANDS EMPTY in every frame. No weapon, blade, firearm, polearm, chain, shield, scabbard, sheath, holster, quiver, carried tool, held prop or detachable combat accessory. Preserve only permanent anatomy and identity-defining worn costume. For a non-human creature, draw no rider, harness or mounted/carried equipment.",
    sizeRule,
    "Grounding contract: identical camera height and scale across all 30 cells; complete body visible; feet, hooves or lowest anatomy on the same baseline; no transparent gap below the contact point; generous gutters; nothing crosses a cell boundary.",
    `Backdrop: one perfectly flat solid ${chroma} chroma-key field from edge to edge. Do not use ${chroma} on the character.`,
    "Style: authored crisp 16-bit pixel art, deliberate square pixel clusters, limited established palette, hard one-pixel contours, no antialiasing, no blur, no painterly softness, no smooth vector edge and no sub-pixel detail.",
    "Avoid text, labels, numbers, arrows, logo, watermark, border, visible grid, panels, scenery, floor, cast shadow, gradient, texture, particles, glow field, blood spray, extra character or cropped anatomy.",
  ]
    .filter(Boolean)
    .join("\n");
}

function fpsSpriteAudit(character) {
  const spritePath = path.join(
    ROOT,
    "assets",
    "modular",
    "fps",
    "characters",
    character.category,
    character.id,
    "sprite.json",
  );
  if (!fs.existsSync(spritePath)) {
    return {
      sprite: webPath(spritePath),
      present: false,
      directions: 0,
      sheets: 0,
      missingSheets: 0,
      frontBackAuthored: false,
      authoredDirections: [],
      runtimeSequence: null,
      lateralPhaseReferences: {},
    };
  }
  const sprite = readJson(spritePath);
  const directionEntries = Object.entries(sprite.fpsDirections || {});
  const banks = directionEntries.map(([, bank]) => bank);
  const sheets = banks.flatMap((bank) =>
    Object.values(bank.animations || {}),
  );
  const lateralPhaseReferences = Object.fromEntries(
    ANIMATIONS.map((animation) => [
      animation,
      sprite?.fpsDirections?.left?.animations?.[animation] || null,
    ]),
  );
  return {
    sprite: webPath(spritePath),
    present: true,
    directions: banks.length,
    sheets: sheets.length,
    missingSheets: sheets.filter((sheet) => !fileExists(sheet)).length,
    frontBackAuthored: sprite?.viewCoverage?.frontBackAuthored === true,
    authoredDirections: directionEntries
      .filter(
        ([direction, bank]) =>
          DIRECTIONS.some((entry) => entry.id === direction)
          && bank?.authoredDirection === true
          && bank?.sourceKind === "authored-directional-atlas",
      )
      .map(([direction]) => direction),
    runtimeSequence: sprite?.viewCoverage?.runtimeSequence || null,
    lateralPhaseReferences,
  };
}

function buildManifest() {
  const registry = readJson(REGISTRY_PATH);
  const roster = registry.characters.filter(
    (character) => character.category !== "player",
  );
  const eraCounts = { historical: 0, contemporary: 0, cyberpunk: 0 };
  const categoryCounts = {};

  const characters = roster.map((character) => {
    const era = eraBucket(character);
    eraCounts[era] += 1;
    categoryCounts[character.category] =
      (categoryCounts[character.category] || 0) + 1;

    const identitySource = identitySourceFor(character);
    const brief = identityBrief(character);
    const chroma = chromaFor(character);
    const existingSources = existingDirectionalSources(character);
    const fpsAudit = fpsSpriteAudit(character);
    const phaseReferences = fpsAudit.lateralPhaseReferences;
    const outputRoot = [
      "assets",
      "modular",
      "fps",
      "characters",
      character.category,
      character.id,
      OUTPUT_FOLDER_NAME,
    ].join("/");

    return {
      id: character.id,
      name: character.name,
      subtitle: character.subtitle || null,
      category: character.category,
      era: character.era || "Kanei-1638",
      eraBucket: era,
      weaponId: character.weaponId || null,
      weaponsBakedIntoBody: false,
      identity: {
        brief,
        lore: compactText(character.lore),
        originalSourcePrompt: character.prompt,
      },
      references: {
        identitySource,
        lateralPhaseReferences: phaseReferences,
        existingDirectionalSources: existingSources,
        usage:
          "Attach identitySource and all five normalized lateralPhaseReferences to every generation. Existing front/back raw sources are optional identity/angle references only and must never supply animation timing.",
      },
      currentRuntime: fpsAudit,
      keyColor: chroma,
      atlases: DIRECTIONS.map((direction) => ({
        direction: direction.id,
        status: fpsAudit.authoredDirections.includes(direction.id)
          ? "runtime-ready"
          : "to-author",
        yawDegrees: direction.yawDegrees,
        vector: direction.vector,
        output: `${outputRoot}/${direction.id}-imagegen-raw.png`,
        grid: { columns: 6, rows: 5, frames: 30 },
        handsEmpty: true,
        singleSilhouettePerCell: true,
        phaseLockedTo: phaseReferences,
        prompt: directionPrompt({
          character,
          direction,
          brief,
          chroma,
          identitySource,
          phaseReferences,
        }),
      })),
    };
  });

  const rawSources = characters.flatMap(
    (character) => character.references.existingDirectionalSources,
  );
  const runtimeDirections = characters.reduce(
    (total, character) => total + character.currentRuntime.directions,
    0,
  );
  const runtimeSheets = characters.reduce(
    (total, character) => total + character.currentRuntime.sheets,
    0,
  );
  const missingRuntimeSheets = characters.reduce(
    (total, character) => total + character.currentRuntime.missingSheets,
    0,
  );
  const sourcePairCharacters = characters.filter(
    (character) =>
      character.references.existingDirectionalSources.filter(
        (source) => source.validPng,
      ).length === 2,
  ).length;
  const sourcePairCountsByEra = {
    historical: 0,
    contemporary: 0,
    cyberpunk: 0,
  };
  for (const character of characters) {
    if (
      character.references.existingDirectionalSources.filter(
        (source) => source.validPng,
      ).length === 2
    ) {
      sourcePairCountsByEra[character.eraBucket] += 1;
    }
  }
  const runtimeAuthoredCharacters = characters.filter(
    (character) => character.currentRuntime.frontBackAuthored,
  ).length;
  const runtimeReadyAuthoredAtlases = characters.reduce(
    (total, character) =>
      total + character.currentRuntime.authoredDirections.length,
    0,
  );
  const totalAtlasJobs = characters.length * DIRECTIONS.length;

  return {
    schema: 1,
    id: "yomi-no-kage-enemy-six-way-authored-directions-v1",
    generatedFrom: "assets/modular/registry.json",
    generator: "tools/build-directional-authoring-prompts.mjs",
    purpose:
      "OpenAI ImageGen production queue for six genuinely authored non-lateral enemy views; no half-sprite fusion and no baked weapons.",
    scope: {
      includes: "all 105 world-enemy identities in the modular registry",
      excludes:
        "Akio's first-person arm/viewmodel sheets; those are not world-facing NPC direction banks",
    },
    atlasContract: {
      directions: DIRECTIONS,
      existingLateralDirections: ["left", "right"],
      grid: {
        columns: 6,
        rows: 5,
        framesPerAtlas: 30,
        rows: ANIMATIONS,
        phases: PHASE_CONTRACT,
      },
      phaseLock:
        "Every row/column coordinate represents the same authored animation phase in all eight directions.",
      silhouette:
        "Exactly one complete body per cell. Splicing, fusing, blending or overlaying directional half-silhouettes is forbidden.",
      modularity:
        "Hands empty and all weapons/scabbards/held props exported separately.",
    },
    audit: {
      roster: {
        enemies: characters.length,
        byEra: eraCounts,
        byCategory: categoryCounts,
      },
      currentRuntime: {
        charactersWithEightBanks: characters.filter(
          (character) => character.currentRuntime.directions === 8,
        ).length,
        directionBanks: runtimeDirections,
        animationSheets: runtimeSheets,
        missingAnimationSheets: missingRuntimeSheets,
        frontBackMarkedAuthored: runtimeAuthoredCharacters,
        provenance:
          `${runtimeAuthoredCharacters} characters use six authored non-lateral atlases; ${characters.length - runtimeAuthoredCharacters} retain the legacy frame-locked projected banks.`,
      },
      existingOpenAiDirectionalRaw: {
        charactersWithFrontBackPair: sourcePairCharacters,
        charactersWithFrontBackPairByEra: sourcePairCountsByEra,
        charactersWithoutFrontBackPair:
          characters.length - sourcePairCharacters,
        rawAtlases: rawSources.length,
        rawAtlasesByEra: {
          historical: rawSources.filter(
            (source) => source.eraBucket === "historical",
          ).length,
          contemporary: rawSources.filter(
            (source) => source.eraBucket === "contemporary",
          ).length,
          cyberpunk: rawSources.filter(
            (source) => source.eraBucket === "cyberpunk",
          ).length,
        },
        validPngIdentityReferences: rawSources.filter(
          (source) => source.usableAsIdentityReference,
        ).length,
        runtimeReadyAtlases: rawSources.filter((source) => source.runtimeReady)
          .length,
        declaredRejectedAtlases: rawSources.filter(
          (source) => !source.runtimeReady,
        ).length,
        limitation:
          "The existing 18 front/back files are usable as identity and angle references only. Their manifests reject runtime use because animation phases do not match across views.",
        files: rawSources,
      },
      authoringQueue: {
        characters: characters.length,
        directionsPerCharacter: DIRECTIONS.length,
        atlasJobs: totalAtlasJobs,
        framesPerAtlas: 30,
        totalAuthoredFrames:
          characters.length * DIRECTIONS.length * 30,
        existingRuntimeReadyAtlasCredit: runtimeReadyAuthoredAtlases,
        atlasesStillToAuthor: totalAtlasJobs - runtimeReadyAuthoredAtlases,
        remainingAuthoredFrames:
          (totalAtlasJobs - runtimeReadyAuthoredAtlases) * 30,
      },
    },
    characters,
  };
}

function validate(manifest) {
  const errors = [];
  const outputPaths = new Set();
  if (manifest.characters.length !== 105) {
    errors.push(`roster: ${manifest.characters.length}, expected 105`);
  }
  for (const character of manifest.characters) {
    if (!fileExists(character.references.identitySource)) {
      errors.push(`${character.id}: identity source missing`);
    }
    for (const animation of ANIMATIONS) {
      if (!fileExists(character.references.lateralPhaseReferences[animation])) {
        errors.push(
          `${character.id}: ${animation} lateral phase reference missing`,
        );
      }
    }
    if (character.atlases.length !== 6) {
      errors.push(`${character.id}: ${character.atlases.length} jobs, expected 6`);
    }
    for (const atlas of character.atlases) {
      if (
        atlas.grid.columns !== 6 ||
        atlas.grid.rows !== 5 ||
        atlas.grid.frames !== 30
      ) {
        errors.push(`${character.id}/${atlas.direction}: invalid 6x5 contract`);
      }
      if (!atlas.handsEmpty || !atlas.singleSilhouettePerCell) {
        errors.push(`${character.id}/${atlas.direction}: modularity contract lost`);
      }
      if (outputPaths.has(atlas.output)) {
        errors.push(`${character.id}/${atlas.direction}: duplicate output path`);
      }
      outputPaths.add(atlas.output);
    }
  }
  if (outputPaths.size !== 630) {
    errors.push(`unique output paths: ${outputPaths.size}, expected 630`);
  }
  return errors;
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const manifest = buildManifest();
  const errors = validate(manifest);
  if (errors.length) {
    console.error(JSON.stringify({ ok: false, errors }, null, 2));
    process.exitCode = 1;
    return;
  }

  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  if (checkOnly) {
    if (!fs.existsSync(OUTPUT_PATH)) {
      console.error(
        JSON.stringify(
          {
            ok: false,
            errors: [`${webPath(OUTPUT_PATH)} is missing`],
          },
          null,
          2,
        ),
      );
      process.exitCode = 1;
      return;
    }
    const current = fs.readFileSync(OUTPUT_PATH, "utf8");
    if (current !== serialized) {
      console.error(
        JSON.stringify(
          {
            ok: false,
            errors: [
              `${webPath(OUTPUT_PATH)} is stale; run the generator without --check`,
            ],
          },
          null,
          2,
        ),
      );
      process.exitCode = 1;
      return;
    }
  } else {
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, serialized, "utf8");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: checkOnly ? "check" : "write",
        output: webPath(OUTPUT_PATH),
        enemies: manifest.audit.roster.enemies,
        byEra: manifest.audit.roster.byEra,
        existingRawAtlases:
          manifest.audit.existingOpenAiDirectionalRaw.rawAtlases,
        existingRuntimeReady:
          manifest.audit.authoringQueue.existingRuntimeReadyAtlasCredit,
        atlasJobs: manifest.audit.authoringQueue.atlasJobs,
        atlasesStillToAuthor:
          manifest.audit.authoringQueue.atlasesStillToAuthor,
        authoredFrames: manifest.audit.authoringQueue.totalAuthoredFrames,
      },
      null,
      2,
    ),
  );
}

main();
