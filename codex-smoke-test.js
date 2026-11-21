"use strict";

/*
 * Contrat du codex jouable.
 *
 * Vérifie le fichier généré (`codex-data.js`), le module runtime (`codex.js`)
 * et sa bijection avec le canon machine. Comme les autres smoke tests du
 * dépôt, il agrège les erreurs au lieu de s'arrêter à la première.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");

const ROOT = __dirname;
const CANON_PATH = path.join(ROOT, "assets", "modular", "manifests", "yomi-no-kage-canon.json");
const DATA_PATH = path.join(ROOT, "codex-data.js");
const RUNTIME_PATH = path.join(ROOT, "codex.js");

const canon = JSON.parse(fs.readFileSync(CANON_PATH, "utf8"));
const dataSource = fs.readFileSync(DATA_PATH, "utf8");
const runtimeSource = fs.readFileSync(RUNTIME_PATH, "utf8");

const sandbox = { console };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(dataSource, sandbox, { filename: "codex-data.js" });
vm.runInContext(runtimeSource, sandbox, { filename: "codex.js" });

const DATA = sandbox.KageCodexData;
const Codex = sandbox.KageCodex;

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

const FAMILY_TOTALS = {
  creatures: canon.bestiary.entries.length,
  katana: canon.katanas.entries.length,
  places: canon.zones.entries.length,
  seals: canon.seals.acts.length + canon.seals.chronicleSeals.entries.length,
  chronicle: canon.codex.entries.filter((entry) => entry.text.trim()).length,
};

function canonIds() {
  return new Set([
    ...canon.bestiary.entries.map((entry) => entry.id),
    ...canon.katanas.entries.map((entry) => entry.id),
    ...canon.zones.entries.map((entry) => entry.id),
    ...canon.seals.acts.map((entry) => `act-seal-0${entry.act}`),
    ...canon.seals.chronicleSeals.entries.map((entry) => entry.id),
    ...canon.codex.entries.map((entry) => entry.id),
  ]);
}

check("le codex se charge sans DOM, sans fetch et sans require", () => {
  assert.equal(typeof sandbox.document, "undefined", "aucun DOM ne doit être nécessaire");
  assert.ok(DATA && Array.isArray(DATA.entries), "KageCodexData doit exposer ses fiches");
  assert.ok(Codex && typeof Codex.observe === "function", "KageCodex doit exposer observe()");
  assert.ok(!/\bfetch\s*\(/.test(runtimeSource), "codex.js ne doit pas appeler fetch()");
  assert.ok(!/\brequire\s*\(/.test(runtimeSource), "codex.js ne doit pas appeler require()");
});

check("les totaux sont la somme des familles, jamais recopiés", () => {
  let sum = 0;
  for (const [family, expected] of Object.entries(FAMILY_TOTALS)) {
    const entries = DATA.entries.filter((entry) => entry.family === family);
    assert.equal(entries.length, expected, `${family} : ${entries.length} fiches pour ${expected} attendues`);
    assert.equal(DATA.families[family].total, expected, `${family} : compteur d'enveloppe divergent`);
    assert.ok(DATA.families[family].label, `${family} : libellé absent`);
    sum += expected;
  }
  assert.equal(DATA.families.total, sum, "le total doit être la somme des familles");
  assert.equal(Codex.total, sum, "KageCodex.total doit valoir la somme des familles");
});

check("chaque id du canon a une fiche, et réciproquement", () => {
  const expected = canonIds();
  const actual = new Set(DATA.entries.map((entry) => entry.id));
  const missing = [...expected].filter((id) => !actual.has(id));
  const extra = [...actual].filter((id) => !expected.has(id));
  assert.deepEqual(missing, [], `ids du canon sans fiche : ${missing.slice(0, 5).join(", ")}`);
  assert.deepEqual(extra, [], `fiches hors canon : ${extra.slice(0, 5).join(", ")}`);
  assert.equal(actual.size, DATA.entries.length, "ids dupliqués dans le codex");
});

check("aucune fiche vide et aucun spoiler dans l'attente", () => {
  for (const entry of DATA.entries) {
    assert.ok(entry.title, `${entry.id} : titre absent`);
    assert.ok(typeof entry.body === "string" && entry.body.trim(), `${entry.id} : corps vide`);
    if (entry.family !== "creatures") {
      assert.ok(entry.body.length >= 40, `${entry.id} : corps trop court (${entry.body.length})`);
    }
    assert.ok(entry.unlock?.kind, `${entry.id} : déblocage absent`);
    assert.ok(entry.spoiler?.safeText, `${entry.id} : safeText absent`);
    assert.ok(entry.spoiler.safeText.length <= 60, `${entry.id} : safeText trop long`);
    if (entry.family === "seals") continue; // « Sceau » est le mot de la famille, pas un nom propre.
    const titleWords = entry.title.toLowerCase().split(/[^a-zà-ÿ0-9]+/).filter((word) => word.length > 4);
    for (const word of titleWords) {
      assert.ok(
        !entry.spoiler.safeText.toLowerCase().includes(word),
        `${entry.id} : safeText divulgue « ${word} »`,
      );
    }
  }
});

check("le fichier versionné est reproductible octet à octet", () => {
  const run = spawnSync(process.execPath, [path.join(ROOT, "tools", "build-codex-data.mjs"), "--stdout"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(run.status, 0, `générateur en échec : ${run.stderr || run.stdout}`);
  assert.equal(run.stdout, dataSource, "codex-data.js diverge du générateur");
});

check("une rencontre ouvre sa fiche une seule fois", () => {
  const profile = {};
  const first = Codex.observe(profile, "01-shibito-villager");
  assert.equal(first, 1, "la première rencontre doit ouvrir la fiche");
  for (let index = 0; index < 9; index += 1) {
    assert.equal(Codex.observe(profile, "01-shibito-villager"), 0, "les rencontres suivantes ne doivent rien ouvrir");
  }
  assert.equal(profile.codex.seen.filter((id) => id === "01-shibito-villager").length, 1);
  assert.equal(Codex.observe(profile, ["inconnu-99", "01-shibito-villager"]), 0, "un id inconnu est ignoré");
});

check("une fiche verrouillée ne révèle ni nom ni rumeur", () => {
  const profile = {};
  const locked = Codex.list(profile, "creatures").find((entry) => entry.id === "giant-03-take-mori");
  assert.ok(locked, "la fiche doit être listée");
  assert.equal(locked.unlocked, false);
  assert.equal(locked.title, undefined, "le titre doit rester caché");
  assert.equal(locked.body, undefined, "la rumeur doit rester cachée");
  assert.ok(locked.spoiler?.safeText, "l'attente doit rester lisible");
  assert.equal(locked.meta.tier, "massive");
  assert.equal(Codex.detail(profile, "giant-03-take-mori").title, undefined);
  assert.equal(Codex.detail(profile, "fiche-inconnue"), null);
});

check("un sceau de chronique ouvre son acte, pas les autres", () => {
  const profile = {};
  const opened = Codex.grantSeal(profile, 1);
  const actOne = canon.codex.entries.filter((entry) => entry.act === 1).map((entry) => entry.id);
  assert.equal(opened, actOne.length + 1, "le sceau et ses entrées doivent s'ouvrir");
  assert.ok(Codex.isUnlocked(profile, "chronicle-01"), "le sceau du Camp doit s'ouvrir");
  for (const id of actOne) {
    assert.ok(Codex.isUnlocked(profile, id), `${id} doit s'ouvrir avec l'acte I`);
  }
  for (const id of ["chronicle-02", "chronicle-03", "chronicle-04", "chronicle-05", "chronicle-06", "chronicle-07"]) {
    assert.ok(!Codex.isUnlocked(profile, id), `${id} ne doit pas s'ouvrir`);
  }
  assert.ok(!Codex.isUnlocked(profile, "act-seal-01"), "le sceau d'acte reste indépendant");
  assert.equal(Codex.grantSeal(profile, 1), 0, "un sceau déjà obtenu ne rouvre rien");
  assert.equal(Codex.grantSeal(profile, 42), 0, "un sceau inexistant ne fait rien");
});

check("le prologue ouvre ses cinq entrées", () => {
  const profile = {};
  const prologue = canon.codex.entries
    .filter((entry) => entry.unlock.type === "prologue")
    .map((entry) => entry.id);
  assert.equal(prologue.length, 5);
  assert.equal(Codex.openPrologue(profile), prologue.length, "toutes les entrées de prologue doivent s'ouvrir");
  assert.equal(Codex.openPrologue(profile), 0, "le prologue ne s'ouvre qu'une fois");
});

check("un profil sans codex est normalisé sans perte", () => {
  assert.equal(
    JSON.stringify(Codex.normalize(undefined)),
    JSON.stringify({ version: 1, seen: [], unlocked: [] }),
  );
  const profile = { progress: { health: 42 } };
  assert.equal(
    JSON.stringify(Codex.ensure(profile)),
    JSON.stringify({ version: 1, seen: [], unlocked: [] }),
  );
  assert.equal(profile.progress.health, 42, "le reste du profil doit être intact");
  assert.deepEqual(Codex.ensure(null), null);
  assert.equal(Codex.summary(profile).unlocked, 0);
  const flooded = Codex.normalize({ seen: [], unlocked: Array.from({ length: 600 }, (_, index) => `x-${index}`) });
  assert.ok(flooded.unlocked.length <= DATA.entries.length, "le codex doit rester borné par le catalogue");
});

if (failures.length) {
  console.error(
    `\nCodex smoke test : ${successes.length} contrat(s) valide(s), ${failures.length} manquant(s).`,
  );
  failures.forEach((failure, index) => {
    console.error(`${index + 1}. ${failure.name}`);
    console.error(`   ${failure.message}`);
  });
  process.exitCode = 1;
} else {
  const totals = Object.entries(FAMILY_TOTALS).map(([family, total]) => `${total} ${family}`).join(", ");
  console.log(`\nCodex smoke test OK — ${DATA.entries.length} fiches (${totals}), génération reproductible`);
}
