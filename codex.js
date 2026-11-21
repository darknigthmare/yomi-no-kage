(function defineKageCodex(global) {
  "use strict";

  /*
   * Codex jouable : lectures et déblocages, sans DOM, sans fetch, sans require.
   *
   * Les fiches viennent de `codex-data.js` (généré depuis le canon machine).
   * Le profil porte l'état : `{ version, seen, unlocked }`. Aucune écriture de
   * sauvegarde ici — les appelants décident quand persister.
   *
   * Règles : voir la fiche suffit (pas de mise à mort requise), un id ne
   * s'ouvre qu'une fois, une fiche verrouillée ne révèle ni nom ni rumeur.
   */

  const VERSION = 1;
  const FALLBACK_LIMIT = 512;
  const FAMILY_IDS = ["creatures", "katana", "places", "seals", "chronicle"];
  const DATA = global.KageCodexData
    && Array.isArray(global.KageCodexData.entries)
    && global.KageCodexData.entries.length
    ? global.KageCodexData
    : null;
  const ENTRIES = DATA ? DATA.entries : [];
  const BY_ID = new Map(ENTRIES.map((entry) => [entry.id, entry]));

  const PROLOGUE_IDS = ENTRIES
    .filter((entry) => entry.family === "chronicle" && entry.unlock.kind === "prologue")
    .map((entry) => entry.id);

  const CHRONICLE_BY_SEAL = new Map();
  for (const entry of ENTRIES) {
    if (entry.family !== "chronicle" || entry.unlock.kind !== "chronicle-seal") continue;
    const ids = CHRONICLE_BY_SEAL.get(entry.unlock.seal) || [];
    ids.push(entry.id);
    CHRONICLE_BY_SEAL.set(entry.unlock.seal, ids);
  }

  function limit() {
    return ENTRIES.length || FALLBACK_LIMIT;
  }

  function uniqueSorted(value, max) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id) => typeof id === "string" && id.length > 0))]
      .sort()
      .slice(0, max ?? limit());
  }

  function normalize(value) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    return {
      version: VERSION,
      seen: uniqueSorted(source.seen),
      unlocked: uniqueSorted(source.unlocked),
    };
  }

  function ensure(profile) {
    if (!profile || typeof profile !== "object") return null;
    profile.codex = normalize(profile.codex);
    return profile.codex;
  }

  function add(codex, id) {
    if (!BY_ID.has(id) || codex.unlocked.includes(id)) return false;
    codex.unlocked.push(id);
    codex.unlocked.sort();
    return true;
  }

  function isUnlocked(profile, id) {
    if (!profile || !profile.codex || !Array.isArray(profile.codex.unlocked)) return false;
    return profile.codex.unlocked.includes(String(id || ""));
  }

  function observe(profile, ids) {
    const codex = ensure(profile);
    if (!codex) return 0;
    const candidates = Array.isArray(ids) ? ids : [ids];
    let opened = 0;
    for (const id of candidates) {
      const entry = BY_ID.get(id);
      if (!entry || entry.family !== "creatures") continue;
      if (!codex.seen.includes(id)) {
        codex.seen.push(id);
        codex.seen.sort();
      }
      if (add(codex, id)) opened += 1;
    }
    return opened;
  }

  function grantSeal(profile, sealIndex) {
    const codex = ensure(profile);
    const index = Number(sealIndex);
    if (!codex || !Number.isInteger(index) || index < 1 || index > 99) return 0;
    const sealId = `chronicle-${String(index).padStart(2, "0")}`;
    if (!BY_ID.has(sealId)) return 0;
    let opened = add(codex, sealId) ? 1 : 0;
    for (const id of CHRONICLE_BY_SEAL.get(sealId) || []) {
      if (add(codex, id)) opened += 1;
    }
    return opened;
  }

  function openPrologue(profile) {
    const codex = ensure(profile);
    if (!codex) return 0;
    let opened = 0;
    for (const id of PROLOGUE_IDS) {
      if (add(codex, id)) opened += 1;
    }
    return opened;
  }

  function sealTitle(sealId) {
    const seal = BY_ID.get(sealId);
    return seal ? seal.title : "";
  }

  function hintFor(entry) {
    switch (entry.unlock.kind) {
      case "encounter": return "À rencontrer";
      case "weapon": return "À obtenir";
      case "zone": return "À visiter";
      case "act": return `Acte ${entry.meta.act} terminé`;
      case "chronicle-seal": return `${sealTitle(entry.unlock.seal)} requis`;
      case "prologue": return "Fin du prologue";
      default: return "Déblocage inconnu";
    }
  }

  function fullEntry(entry) {
    return JSON.parse(JSON.stringify({ ...entry, unlocked: true, hint: "" }));
  }

  function lockedEntry(entry) {
    return {
      id: entry.id,
      family: entry.family,
      unlocked: false,
      meta: {
        tier: entry.meta.tier ?? null,
        act: entry.spoiler.beforeAct ?? null,
      },
      spoiler: {
        beforeAct: entry.spoiler.beforeAct ?? null,
        safeText: entry.spoiler.safeText,
      },
      hint: hintFor(entry),
    };
  }

  function list(profile, family) {
    const unlocked = new Set(profile && profile.codex ? normalize(profile.codex).unlocked : []);
    return ENTRIES
      .filter((entry) => !family || entry.family === family)
      .map((entry) => (unlocked.has(entry.id) ? fullEntry(entry) : lockedEntry(entry)));
  }

  function detail(profile, id) {
    const entry = BY_ID.get(String(id || ""));
    if (!entry) return null;
    const unlocked = profile && profile.codex
      ? normalize(profile.codex).unlocked.includes(entry.id)
      : false;
    return unlocked ? fullEntry(entry) : lockedEntry(entry);
  }

  function summary(profile) {
    const unlocked = new Set(profile && profile.codex ? normalize(profile.codex).unlocked : []);
    const families = {};
    let total = 0;
    let opened = 0;
    for (const family of FAMILY_IDS) {
      const items = ENTRIES.filter((entry) => entry.family === family);
      const count = items.filter((entry) => unlocked.has(entry.id)).length;
      families[family] = {
        label: DATA?.families?.[family]?.label || family,
        total: items.length,
        unlocked: count,
      };
      total += items.length;
      opened += count;
    }
    return { total, unlocked: opened, families };
  }

  global.KageCodex = Object.freeze({
    schema: VERSION,
    total: ENTRIES.length,
    families: FAMILY_IDS.slice(),
    normalize,
    ensure,
    isUnlocked,
    observe,
    grantSeal,
    openPrologue,
    list,
    detail,
    summary,
  });
})(typeof window !== "undefined" ? window : globalThis);
