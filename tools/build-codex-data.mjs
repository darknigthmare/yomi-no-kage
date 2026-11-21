#!/usr/bin/env node
/*
 * Génère `codex-data.js` depuis le canon machine.
 *
 * Le fichier produit (`window.KageCodexData`) est versionné : le module runtime
 * `codex.js` (`window.KageCodex`) ne lit jamais le canon au
 * démarrage, ne fait aucun `fetch` et fonctionne donc en `file://`. Toute
 * modification du canon doit être suivie de `node tools/build-codex-data.mjs`.
 *
 * Le générateur est déterministe : mêmes entrées, même ordre, même en-tête,
 * aucune date. Une régénération sans changement du canon produit un fichier
 * identique octet à octet (vérifié par `codex-smoke-test.js`).
 *
 * Usage :
 *   node tools/build-codex-data.mjs            # écrit codex-data.js
 *   node tools/build-codex-data.mjs --out tmp/codex-data.js
 *   node tools/build-codex-data.mjs --stdout   # écrit sur la sortie standard
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_REL = "assets/modular/manifests/yomi-no-kage-canon.json";
const CANON_PATH = path.join(ROOT, MANIFEST_REL);
const DEFAULT_OUT = path.join(ROOT, "codex-data.js");

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII"];
const FAMILIES = [
  ["creatures", "Créatures"],
  ["katana", "Lames"],
  ["places", "Lieux"],
  ["seals", "Sceaux"],
  ["chronicle", "Chronique"],
];

/* Palier de menace → silhouette d'attente. Aucun nom propre, 60 caractères au
 * plus : une fiche verrouillée ne doit rien divulguer du contenu. */
const SILHOUETTES = {
  legacy: "Silhouette ancienne non identifiée.",
  regular: "Silhouette commune non identifiée.",
  special: "Silhouette singulière non identifiée.",
  miniboss: "Silhouette imposante non identifiée.",
  boss: "Silhouette colossale non identifiée.",
  massive: "Silhouette massive non identifiée.",
};
const BLANK_SILHOUETTE = "Silhouette non identifiée.";
const SAFE_TEXT = {
  katana: "Lame non identifiée.",
  places: "Lieu non reconnu.",
  seals: "Sceau non obtenu.",
  chronicle: "Entrée non déverrouillée.",
};

function fail(message) {
  throw new Error(`codex : ${message}`);
}

function roman(act) {
  return ROMAN[act] || String(act);
}

function entry(fields) {
  const body = typeof fields.body === "string" ? fields.body.trim() : "";
  if (!fields.id) fail("fiche sans id");
  if (!fields.title) fail(`${fields.id} : titre absent`);
  if (!body) fail(`${fields.id} : corps vide`);
  if (!fields.unlock || !fields.unlock.kind) fail(`${fields.id} : déblocage absent`);
  return {
    id: fields.id,
    family: fields.family,
    title: fields.title,
    subtitle: fields.subtitle || "",
    body,
    meta: fields.meta || {},
    unlock: fields.unlock,
    spoiler: {
      beforeAct: Number.isInteger(fields.beforeAct) ? fields.beforeAct : null,
      safeText: fields.safeText,
    },
    refs: fields.refs || [],
  };
}

function creatureEntry(source) {
  const acts = Array.isArray(source.acts) ? [...source.acts] : [];
  return entry({
    id: source.id,
    family: "creatures",
    title: source.name,
    subtitle: source.subtitle,
    body: source.rumor,
    meta: {
      tier: source.tier,
      stage: source.stage,
      acts,
      zones: Array.isArray(source.zones) ? [...source.zones] : [],
      role: source.role,
    },
    unlock: { kind: "encounter", ids: [source.id] },
    beforeAct: acts.length ? Math.min(...acts) : null,
    safeText: SILHOUETTES[source.tier] || BLANK_SILHOUETTE,
    refs: ["LORE_BIBLE.md#11"],
  });
}

function katanaEntry(source) {
  const passive = source.passive || {};
  return entry({
    id: source.id,
    family: "katana",
    title: source.name,
    subtitle: source.subtitle,
    body: [source.lore, passive.name ? `${passive.name} : ${passive.description}` : ""]
      .filter(Boolean)
      .join(" "),
    meta: {
      rarity: source.rarity,
      act: source.act ?? null,
      passive: {
        id: passive.id || "",
        name: passive.name || "",
        description: passive.description || "",
        trigger: passive.trigger || "",
      },
      unlock: {
        type: source.unlock?.type || "",
        label: source.unlock?.label || "",
      },
    },
    unlock: { kind: "weapon", ids: [source.id] },
    beforeAct: source.act ?? null,
    safeText: SAFE_TEXT.katana,
    refs: [`LORE_BIBLE.md#${String(source.bibleRef || "").replace("§", "")}`],
  });
}

function placeEntry(source) {
  const objective = source.objective || null;
  const goal = objective ? objective.label : source.label;
  return entry({
    id: source.id,
    family: "places",
    title: source.label,
    subtitle: `Acte ${roman(source.act)}`,
    body: `${source.label} — ${goal} (acte ${roman(source.act)}).`,
    meta: {
      act: source.act,
      areaId: source.areaId,
      objective: objective
        ? { id: objective.id, type: objective.type, sealReward: objective.sealReward }
        : null,
      bossId: source.bossId || null,
    },
    unlock: { kind: "zone", ids: [source.id] },
    beforeAct: source.act,
    safeText: SAFE_TEXT.places,
    refs: ["LORE_BIBLE.md#12"],
  });
}

function actSealEntry(source) {
  const id = `act-seal-0${source.act}`;
  return entry({
    id,
    family: "seals",
    title: `Sceau de l'acte ${roman(source.act)}`,
    subtitle: source.label,
    body: `${source.label}. Brèches : ${source.breaks.join(", ")}.`,
    meta: {
      act: source.act,
      actId: source.actId,
      totalSeals: source.totalSeals,
      bossId: source.bossId || null,
      zoneIds: [...source.zoneIds],
    },
    unlock: { kind: "act", act: source.act, ids: [source.actId] },
    beforeAct: source.act,
    safeText: SAFE_TEXT.seals,
    refs: ["LORE_BIBLE.md#12"],
  });
}

function chronicleSealEntry(source) {
  const sealId = source.id || `chronicle-0${source.index}`;
  return entry({
    id: sealId,
    family: "seals",
    title: source.name,
    subtitle: `Acte ${roman(source.act)}`,
    body: `${source.name} : ${source.condition}. Sans lui, ${source.ifMissing}.`,
    meta: {
      act: source.act,
      index: source.index,
      condition: source.condition,
      ifMissing: source.ifMissing,
    },
    unlock: { kind: "chronicle-seal", seal: sealId, ids: [sealId] },
    beforeAct: source.act,
    safeText: SAFE_TEXT.seals,
    refs: ["LORE_BIBLE.md#12"],
  });
}

function chronicleEntry(source) {
  const prologue = source.unlock?.type === "prologue";
  return entry({
    id: source.id,
    family: "chronicle",
    title: source.title,
    subtitle: source.voice,
    body: source.text,
    meta: {
      era: source.era,
      act: source.act,
      condition: source.unlock?.condition || "",
      trigger: source.unlock?.trigger || "",
      sealName: source.unlock?.sealName || null,
    },
    unlock: prologue
      ? { kind: "prologue", ids: [source.id] }
      : { kind: "chronicle-seal", seal: source.unlock.seal, ids: [source.id] },
    beforeAct: source.act,
    safeText: SAFE_TEXT.chronicle,
    refs: ["LORE_BIBLE.md#14"],
  });
}

function build(canon, sha256) {
  const entries = [
    ...(canon.bestiary?.entries || []).map(creatureEntry),
    ...(canon.katanas?.entries || []).map(katanaEntry),
    ...(canon.zones?.entries || []).map(placeEntry),
    ...(canon.seals?.acts || []).map(actSealEntry),
    ...(canon.seals?.chronicleSeals?.entries || []).map(chronicleSealEntry),
    ...(canon.codex?.entries || [])
      .filter((source) => typeof source.text === "string" && source.text.trim())
      .map(chronicleEntry),
  ];

  const seen = new Set();
  for (const item of entries) {
    if (seen.has(item.id)) fail(`id dupliqué : ${item.id}`);
    seen.add(item.id);
  }

  const families = {};
  let total = 0;
  for (const [id, label] of FAMILIES) {
    const count = entries.filter((item) => item.family === id).length;
    families[id] = { label, total: count };
    total += count;
  }
  if (total !== entries.length) fail("total de familles incohérent");

  return {
    schema: 1,
    source: {
      manifest: MANIFEST_REL,
      sha256,
      bibleVersion: canon.bibleVersion || "",
    },
    families: { total, ...families },
    entries,
  };
}

function render(payload) {
  const header = [
    "/* GÉNÉRÉ PAR tools/build-codex-data.mjs — NE PAS ÉDITER.",
    ` * Source : ${payload.source.manifest}`,
    ` * Empreinte : ${payload.source.sha256}`,
    ` * ${payload.families.total} fiches — bible ${payload.source.bibleVersion}.`,
    " * Régénérer : node tools/build-codex-data.mjs",
    " */",
  ].join("\n");
  return `${header}\nwindow.KageCodexData = Object.freeze(${JSON.stringify(payload, null, 2)});\n`;
}

function parseArgs(argv) {
  const options = { out: DEFAULT_OUT, stdout: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--stdout") options.stdout = true;
    else if (arg === "--out") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) fail("--out attend un chemin");
      options.out = path.resolve(ROOT, value);
      index += 1;
    } else if (arg === "--help") {
      console.log("usage : node tools/build-codex-data.mjs [--out <chemin>] [--stdout]");
      process.exit(0);
    } else {
      fail(`drapeau inconnu : ${arg}`);
    }
  }
  return options;
}

const options = parseArgs(process.argv.slice(2));
const raw = fs.readFileSync(CANON_PATH);
const canon = JSON.parse(raw.toString("utf8"));
const sha256 = crypto.createHash("sha256").update(raw).digest("hex");
const payload = build(canon, sha256);
const output = render(payload);

if (options.stdout) {
  process.stdout.write(output);
} else {
  fs.mkdirSync(path.dirname(options.out), { recursive: true });
  fs.writeFileSync(options.out, output);
  const relative = path.relative(ROOT, options.out) || options.out;
  console.log(
    `${relative} : ${payload.families.total} fiches `
      + `(${FAMILIES.map(([id]) => `${payload.families[id].total} ${id}`).join(", ")}), `
      + `${Buffer.byteLength(output)} octets`,
  );
}
