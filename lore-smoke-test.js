"use strict";

/*
 * Contrat de couverture du lore.
 *
 * Le canon machine (assets/modular/manifests/yomi-no-kage-canon.json) doit
 * couvrir tout ce que le runtime peut montrer : chaque zone jouable, chaque
 * boss d'acte, chaque ennemi des manifests modulaires et chaque katana du
 * registre d'armes. Ce test agrège toutes les erreurs au lieu de s'arrêter à la
 * première, comme coherence-smoke-test.js.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = __dirname;
const MANIFEST_DIR = path.join(ROOT, "assets", "modular", "manifests");
const CANON_PATH = path.join(MANIFEST_DIR, "yomi-no-kage-canon.json");
const BIBLE_PATH = path.join(ROOT, "LORE_BIBLE.md");

const canon = JSON.parse(fs.readFileSync(CANON_PATH, "utf8"));
const bibleSource = fs.readFileSync(BIBLE_PATH, "utf8");
const { KageLevels } = require("./level-data.js");

const arsenalSandbox = { console };
arsenalSandbox.window = arsenalSandbox;
arsenalSandbox.globalThis = arsenalSandbox;
vm.createContext(arsenalSandbox);
vm.runInContext(
  fs.readFileSync(path.join(ROOT, "arsenal.js"), "utf8"),
  arsenalSandbox,
  { filename: "arsenal.js" },
);
const arsenal = arsenalSandbox.KageArsenal;

const failures = [];
const successes = [];

function check(name, callback) {
  try {
    callback();
    successes.push(name);
    console.log(`✓ ${name}`);
  } catch (error) {
    failures.push({ name, message: String(error?.message || error) });
    console.log(`✗ ${name}`);
  }
}

const TIER_BY_MANIFEST = {
  legacy: "legacy",
  regular: "regular",
  special: "special",
  miniboss: "miniboss",
  boss: "boss",
  giant: "massive",
};
const EXPECTED_TIERS = {
  legacy: 6,
  regular: 22,
  special: 24,
  miniboss: 21,
  boss: 22,
  massive: 10,
};

const manifestEntries = [];
for (const [file, tier] of Object.entries(TIER_BY_MANIFEST)) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(MANIFEST_DIR, `${file}.json`), "utf8"),
  );
  assert.ok(Array.isArray(manifest.entries), `${file}.json sans tableau entries`);
  for (const entry of manifest.entries) {
    manifestEntries.push({ ...entry, tier, manifest: file });
  }
}

const bestiary = canon.bestiary?.entries || [];
const bestiaryById = new Map(bestiary.map((entry) => [entry.id, entry]));
const zones = canon.zones?.entries || [];
const zonesById = new Map(zones.map((entry) => [entry.id, entry]));
const katanas = canon.katanas?.entries || [];
const katanasById = new Map(katanas.map((entry) => [entry.id, entry]));

const objectives = Object.values(KageLevels.campaignObjectives);
const acts = Object.values(KageLevels.campaignActs).sort(
  (left, right) => left.order - right.order,
);
const zoneToArea = KageLevels.campaignRuntime.zoneToAreaId;

function placeholders(value, trail = "canon") {
  if (typeof value === "string") {
    if (/\b(TBD|TODO|FIXME|XXX|lorem ipsum)\b/i.test(value)) return [`${trail}: ${value}`];
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => placeholders(item, `${trail}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => placeholders(item, `${trail}.${key}`));
  }
  return [];
}

check("canon lisible avec index déclarés", () => {
  assert.equal(typeof canon.schema, "number", "schema manquant");
  assert.equal(canon.bible, "LORE_BIBLE.md");
  assert.equal(typeof canon.bibleVersion, "string");
  assert.equal(canon.seals.actSeals.total, 22, "22 sceaux d'acte attendus");
  assert.equal(
    canon.seals.actSeals.perAct.reduce((sum, value) => sum + value, 0),
    22,
    "la somme de perAct doit valoir 22",
  );
  assert.equal(canon.seals.chronicleSeals.total, 7, "7 sceaux de chronique attendus");
  assert.equal(zones.length, 28, `28 zones attendues, reçu ${zones.length}`);
  assert.equal(bestiary.length, 105, `105 entrées de bestiaire attendues, reçu ${bestiary.length}`);
  assert.equal(katanas.length, 10, `10 katanas attendus, reçu ${katanas.length}`);
  assert.equal(canon.bestiary.total, bestiary.length);
  assert.equal(canon.zones.total, zones.length);
  assert.equal(canon.katanas.total, katanas.length);
  assert.ok(fs.readFileSync(BIBLE_PATH, "utf8").includes("## 11. Bestiaire canon"));
});

check("les 28 zones du runtime possèdent une entrée", () => {
  const runtimeZones = Object.keys(zoneToArea);
  assert.equal(runtimeZones.length, 28);
  for (const zoneId of runtimeZones) {
    const entry = zonesById.get(zoneId);
    assert.ok(entry, `zone runtime sans entrée canon : ${zoneId}`);
    assert.equal(entry.areaId, zoneToArea[zoneId], `${zoneId} pointe la mauvaise aire`);
    const runtimeObjective = objectives.find((objective) => objective.zoneId === zoneId);
    if (runtimeObjective) {
      assert.ok(entry.objective, `${zoneId} n'a pas d'objectif canon`);
      assert.equal(entry.objective.id, runtimeObjective.id, `${zoneId} : objectif divergent`);
      assert.equal(entry.objective.type, runtimeObjective.type, `${zoneId} : type divergent`);
      assert.equal(
        entry.objective.sealReward,
        runtimeObjective.sealReward,
        `${zoneId} : récompense de sceau divergente`,
      );
    }
    const runtimeAct = acts.find((act) => act.zoneIds.includes(zoneId));
    if (runtimeAct) {
      assert.equal(entry.act, runtimeAct.order, `${zoneId} : acte divergent`);
    }
  }
  assert.equal(new Set(zones.map((entry) => entry.id)).size, zones.length, "zones dupliquées");
});

check("chaque boss du runtime possède une entrée de bestiaire", () => {
  const actBosses = acts.map((act) => act.bossEnemyId).filter(Boolean);
  const objectiveBosses = objectives
    .filter((objective) => objective.type === "boss" && objective.targetEnemyId)
    .map((objective) => objective.targetEnemyId);
  const expected = new Set([...actBosses, ...objectiveBosses]);
  assert.equal(expected.size, 9, `9 boss d'acte attendus, reçu ${expected.size}`);
  for (const bossId of expected) {
    const entry = bestiaryById.get(bossId);
    assert.ok(entry, `boss runtime sans entrée : ${bossId}`);
    assert.equal(entry.role, "act-boss", `${bossId} doit être marqué act-boss`);
    assert.ok(entry.stage !== null, `${bossId} doit déclarer un stade`);
    const act = acts.find((candidate) => candidate.bossEnemyId === bossId);
    if (act) {
      assert.ok(
        entry.acts.includes(act.order),
        `${bossId} n'est rattaché à aucun placement de l'acte ${act.order}`,
      );
    }
  }
});

check("chaque ennemi des manifests possède une entrée", () => {
  const ids = new Set();
  const counts = {};
  for (const entry of manifestEntries) {
    assert.ok(entry.id, `${entry.manifest}.json : entrée sans id`);
    assert.ok(!ids.has(entry.id), `id dupliqué entre manifests : ${entry.id}`);
    ids.add(entry.id);
    counts[entry.tier] = (counts[entry.tier] || 0) + 1;
    const lore = bestiaryById.get(entry.id);
    assert.ok(lore, `ennemi sans entrée de bestiaire : ${entry.id}`);
    assert.equal(lore.name, entry.name, `${entry.id} : nom divergent`);
    assert.equal(lore.tier, entry.tier, `${entry.id} : palier divergent`);
  }
  assert.equal(ids.size, 105, `105 ennemis attendus, reçu ${ids.size}`);
  assert.deepEqual(counts, EXPECTED_TIERS, "répartition des paliers divergente");
  assert.deepEqual(canon.bestiary.tiers, EXPECTED_TIERS);
});

check("chaque katana du runtime possède une entrée", () => {
  const runtimeKatanas = arsenal.weapons.filter(
    (weapon) => weapon.family === "katana" && /^\d{2}-/.test(weapon.id),
  );
  assert.equal(runtimeKatanas.length, 10, `10 katanas runtime attendus, reçu ${runtimeKatanas.length}`);
  for (const weapon of runtimeKatanas) {
    const entry = katanasById.get(weapon.id);
    assert.ok(entry, `katana sans entrée canon : ${weapon.id}`);
    assert.equal(entry.name, weapon.name, `${weapon.id} : nom divergent`);
    assert.ok(entry.lore && entry.lore.length > 20, `${weapon.id} : lore absent`);
    assert.equal(entry.passive?.id, weapon.passive.id, `${weapon.id} : passif divergent`);
    assert.ok(entry.passive?.description, `${weapon.id} : description de passif absente`);
    assert.equal(entry.unlock?.type, weapon.unlock.type, `${weapon.id} : déverrouillage divergent`);
    assert.match(entry.bibleRef || "", /^§10\.\d+$/, `${weapon.id} : référence biblique absente`);
  }
  assert.equal(new Set(katanas.map((entry) => entry.id)).size, katanas.length);
});

check("sceaux d'acte et sceaux de chronique cohérents", () => {
  const sealActs = canon.seals.acts || [];
  assert.equal(sealActs.length, 7, `7 actes attendus, reçu ${sealActs.length}`);
  sealActs.forEach((entry, index) => {
    const act = acts[index];
    assert.equal(entry.act, act.order, `sceaux : acte ${act.order} mal indexé`);
    assert.equal(entry.totalSeals, act.totalSeals, `acte ${act.order} : total de sceaux divergent`);
    assert.equal(
      entry.breaks.length,
      entry.totalSeals,
      `acte ${act.order} : ${entry.breaks.length} brèches pour ${entry.totalSeals} sceaux`,
    );
    assert.ok(bestiaryById.has(entry.bossId), `acte ${act.order} : boss inconnu ${entry.bossId}`);
    assert.match(entry.chronicle.name, /^Sceau /, `acte ${act.order} : sceau de chronique sans nom`);
  });
  const chronicle = canon.seals.chronicleSeals.entries || [];
  assert.deepEqual(
    chronicle.map((entry) => entry.index),
    [1, 2, 3, 4, 5, 6, 7],
    "les sept sceaux de chronique doivent être numérotés de 1 à 7",
  );
  for (const entry of chronicle) {
    assert.ok(entry.name && entry.condition, `sceau ${entry.index} incomplet`);
  }
});

check("entrées de bestiaire complètes et exemptes de brouillon", () => {
  const validRoles = new Set(["act-boss", "optional-boss", "legacy", "regular", "special", "miniboss", "boss", "massive"]);
  for (const entry of bestiary) {
    assert.ok(entry.name, `${entry.id} : nom absent`);
    assert.ok(validRoles.has(entry.role), `${entry.id} : rôle invalide ${entry.role}`);
    assert.ok(
      entry.stage === null || (Number.isInteger(entry.stage) && entry.stage >= 0 && entry.stage <= 4),
      `${entry.id} : stade invalide`,
    );
    assert.ok(entry.rumor && entry.rumor.length > 10, `${entry.id} : rumeur absente`);
    for (const act of entry.acts) {
      assert.ok(act >= 1 && act <= 7, `${entry.id} : acte hors bornes`);
    }
    for (const zoneId of entry.zones) {
      assert.ok(zonesById.has(zoneId), `${entry.id} : zone inconnue ${zoneId}`);
    }
  }
  const drafts = placeholders(canon);
  assert.deepEqual(drafts, [], `brouillons détectés : ${drafts.slice(0, 5).join(" | ")}`);
});

check("la bible couvre les mêmes identifiants que le canon", () => {
  const missing = bestiary
    .map((entry) => entry.id)
    .filter((id) => !bibleSource.includes(`\`${id}\``));
  assert.deepEqual(missing, [], `entrées absentes de LORE_BIBLE.md : ${missing.slice(0, 5).join(", ")}`);
  for (const entry of katanas) {
    const sectionTitle = bibleSource.includes(`### ${entry.bibleRef.slice(1)}`);
    assert.ok(sectionTitle, `${entry.id} : section ${entry.bibleRef} absente`);
  }
});

check("bloc codex : totaux, sceaux et chronologie cohérents", () => {
  const codex = canon.codex;
  assert.ok(codex && Array.isArray(codex.entries), "bloc codex absent du canon");
  assert.equal(codex.total, codex.entries.length, "codex.total divergent");
  const written = codex.entries.filter(
    (entry) => typeof entry.text === "string" && entry.text.trim().length > 0,
  );
  assert.equal(codex.written, written.length, "codex.written divergent");
  const ids = codex.entries.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length, "ids de codex dupliqués");
  assert.deepEqual(ids, ids.slice().sort(), "entrées de codex non triées par id");

  const seals = canon.seals.chronicleSeals.entries;
  const sealsById = new Map(seals.map((seal) => [seal.id, seal]));
  assert.deepEqual(
    seals.map((seal) => seal.id),
    seals.map((seal) => `chronicle-0${seal.index}`),
    "chaque sceau de chronique doit porter l'id chronicle-0N de son index",
  );

  const eras = {};
  for (const entry of written) {
    assert.ok(entry.title && entry.voice, `${entry.id} : fiche incomplète`);
    assert.ok(
      [0, 1, 2, 3, 4, 5, 6, 7].includes(entry.act),
      `${entry.id} : acte hors bornes`,
    );
    assert.ok([1638, 2026, 2188].includes(entry.era), `${entry.id} : époque inconnue`);
    eras[String(entry.era)] = (eras[String(entry.era)] || 0) + 1;
    if (entry.unlock?.type === "chronicle-seal") {
      const seal = sealsById.get(entry.unlock.seal);
      assert.ok(seal, `${entry.id} : sceau inconnu ${entry.unlock.seal}`);
      assert.equal(entry.unlock.sealName, seal.name, `${entry.id} : sceau mal nommé`);
      assert.equal(entry.act, seal.act, `${entry.id} : sceau d'un autre acte`);
    } else {
      assert.equal(entry.unlock?.type, "prologue", `${entry.id} : déblocage inconnu`);
      assert.equal(entry.unlock.seal, null, `${entry.id} : prologue avec sceau`);
      assert.equal(entry.act, 0, `${entry.id} : prologue hors acte 0`);
    }
  }
  assert.deepEqual(eras, canon.codex.eras, "répartition par époque divergente");
});

check("chaque entrée du codex est rédigée dans la bible", () => {
  const start = bibleSource.indexOf("## 14. Codex");
  const end = bibleSource.indexOf("## 15.");
  assert.ok(start > 0 && end > start, "section 14 de la bible introuvable");
  const section = bibleSource.slice(start, end);
  const missing = canon.codex.entries
    .filter((entry) => !section.includes(`#### ${entry.id} —`))
    .map((entry) => entry.id);
  assert.deepEqual(
    missing,
    [],
    `entrées absentes du §14 : ${missing.slice(0, 5).join(", ")}`,
  );
});

check("les entrées de chronique tiennent en 120 à 220 mots", () => {
  const outliers = canon.codex.entries
    .map((entry) => ({ id: entry.id, words: entry.text.trim().split(/\s+/).length }))
    .filter((entry) => entry.words < 120 || entry.words > 220);
  assert.deepEqual(
    outliers,
    [],
    `entrées hors format : ${outliers.map((entry) => `${entry.id} (${entry.words})`).slice(0, 5).join(", ")}`,
  );
});

if (failures.length) {
  console.error(
    `\nLore smoke test : ${successes.length} contrat(s) valide(s), ${failures.length} manquant(s).`,
  );
  failures.forEach((failure, index) => {
    console.error(`${index + 1}. ${failure.name}`);
    console.error(`   ${failure.message}`);
  });
  process.exitCode = 1;
} else {
  console.log(
    "\nLore smoke test OK — 28 zones, 9 boss, 105 ennemis, 10 katanas et 80 entrées de codex couverts par le canon",
  );
}
