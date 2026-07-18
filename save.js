(function defineKageSave(global) {
  "use strict";

  const SAVE_KEY = "yomi-no-kage-save-v1";
  const SAVE_SCHEMA = 1;
  let memoryPayload = "";
  let lastStorageError = null;
  let lastDataError = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function number(value, fallback = 0, min = -Infinity, max = Infinity) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
  }

  function string(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
  }

  function stringMap(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => typeof key === "string")
        .map(([key, entry]) => [key, Boolean(entry)]),
    );
  }

  function uniqueStrings(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((entry) => typeof entry === "string"))];
  }

  function arsenal() {
    return global.KageArsenal || null;
  }

  function defaultProfile() {
    const catalog = arsenal();
    const defaultLoadout = catalog?.defaultLoadout || {
      primary: "01-kurokage",
      secondary: "wakizashi",
      ranged: "kunai",
    };
    const unlockedWeapons = catalog?.defaultUnlockedWeapons || [
      "01-kurokage",
      "wakizashi",
      "kunai",
    ];
    return {
      schema: SAVE_SCHEMA,
      updatedAt: 0,
      progress: {
        chapter: 0,
        checkpoint: "kurokawa-entry",
        highestChapter: 0,
      },
      unlocks: {
        weapons: [...unlockedWeapons],
        techniques: ["iai-kage"],
        armor: ["do-maru-voyage"],
        omamori: ["ombre", "cendre"],
      },
      loadout: {
        ...defaultLoadout,
        armor: "do-maru-voyage",
        omamori: ["ombre", "cendre"],
        technique: "iai-kage",
        quickItems: ["ofuda-purification", "yomogi"],
      },
      currencies: {
        mon: 0,
        tamahagane: 0,
        yomiAsh: 0,
        yomogi: 2,
      },
      ammo: {
        ofuda: 8,
        kunai: 8,
        shuriken: 16,
        boShuriken: 12,
        makibishi: 5,
        uchine: 5,
        ya: 28,
        tamade: 10,
      },
      bosses: {},
      secrets: {},
      recipes: [],
      artisans: [],
      decisions: {},
      contamination: 0,
      mission: {
        active: false,
        unsecuredLoot: [],
      },
      settings: {
        reducedMotion: false,
        screenShake: true,
      },
    };
  }

  function normalizeWeaponUnlocks(value) {
    const catalog = arsenal();
    const knownIds = new Set((catalog?.weapons || []).map((entry) => entry.id));
    const defaults = catalog?.defaultUnlockedWeapons || [
      "01-kurokage",
      "wakizashi",
      "kunai",
    ];
    const requested = uniqueStrings(value).filter((id) => !knownIds.size || knownIds.has(id));
    return [...new Set([...defaults, ...requested])];
  }

  function normalizeLoadout(value, unlockedWeaponIds) {
    const catalog = arsenal();
    const defaults = catalog?.defaultLoadout || {
      primary: "01-kurokage",
      secondary: "wakizashi",
      ranged: "kunai",
    };
    const requested = catalog?.normalizeLoadout
      ? catalog.normalizeLoadout(value)
      : { ...defaults, ...(value || {}) };
    const unlocked = new Set(unlockedWeaponIds);
    const weaponSlots = {};

    for (const slotId of ["primary", "secondary", "ranged"]) {
      const weaponId = requested[slotId];
      const valid = catalog?.isWeaponCompatibleWithSlot
        ? catalog.isWeaponCompatibleWithSlot(weaponId, slotId)
        : typeof weaponId === "string";
      weaponSlots[slotId] = valid && unlocked.has(weaponId)
        ? weaponId
        : defaults[slotId];
    }

    const source = value && typeof value === "object" ? value : {};
    return {
      ...weaponSlots,
      armor: string(source.armor, "do-maru-voyage"),
      omamori: uniqueStrings(source.omamori).slice(0, 2).length
        ? uniqueStrings(source.omamori).slice(0, 2)
        : ["ombre", "cendre"],
      technique: string(source.technique, "iai-kage"),
      quickItems: uniqueStrings(source.quickItems).slice(0, 2).length
        ? uniqueStrings(source.quickItems).slice(0, 2)
        : ["ofuda-purification", "yomogi"],
    };
  }

  function migrate(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaultProfile();
    const schema = number(raw.schema, 0, 0, SAVE_SCHEMA);
    if (schema === SAVE_SCHEMA) return raw;

    // Les premières versions de développement ne conservaient parfois que
    // weapon/weaponIndex. Leur valeur ne doit jamais faire perdre le profil.
    if (schema === 0) {
      const migrated = {
        ...raw,
        schema: SAVE_SCHEMA,
        loadout: {
          ...(raw.loadout || {}),
          primary: raw.loadout?.primary || raw.weapon || "01-kurokage",
        },
      };
      return migrated;
    }

    return defaultProfile();
  }

  function normalizeProfile(raw) {
    const defaults = defaultProfile();
    const source = migrate(raw);
    const unlockedWeapons = normalizeWeaponUnlocks(source.unlocks?.weapons);
    return {
      schema: SAVE_SCHEMA,
      updatedAt: number(source.updatedAt, 0, 0),
      progress: {
        chapter: number(source.progress?.chapter, defaults.progress.chapter, 0, 99),
        checkpoint: string(source.progress?.checkpoint, defaults.progress.checkpoint),
        highestChapter: number(
          source.progress?.highestChapter,
          source.progress?.chapter ?? defaults.progress.highestChapter,
          0,
          99,
        ),
      },
      unlocks: {
        weapons: unlockedWeapons,
        techniques: uniqueStrings(source.unlocks?.techniques).length
          ? uniqueStrings(source.unlocks?.techniques)
          : [...defaults.unlocks.techniques],
        armor: uniqueStrings(source.unlocks?.armor).length
          ? uniqueStrings(source.unlocks?.armor)
          : [...defaults.unlocks.armor],
        omamori: uniqueStrings(source.unlocks?.omamori).length
          ? uniqueStrings(source.unlocks?.omamori)
          : [...defaults.unlocks.omamori],
      },
      loadout: normalizeLoadout(source.loadout, unlockedWeapons),
      currencies: {
        mon: number(source.currencies?.mon, 0, 0, 9999999),
        tamahagane: number(source.currencies?.tamahagane, 0, 0, 999999),
        yomiAsh: number(source.currencies?.yomiAsh, 0, 0, 999999),
        yomogi: number(source.currencies?.yomogi, defaults.currencies.yomogi, 0, 9999),
      },
      ammo: Object.fromEntries(
        Object.entries(defaults.ammo).map(([ammoId, fallback]) => [
          ammoId,
          number(source.ammo?.[ammoId], fallback, 0, 9999),
        ]),
      ),
      bosses: stringMap(source.bosses),
      secrets: stringMap(source.secrets),
      recipes: uniqueStrings(source.recipes),
      artisans: uniqueStrings(source.artisans),
      decisions: source.decisions && typeof source.decisions === "object" && !Array.isArray(source.decisions)
        ? clone(source.decisions)
        : {},
      contamination: number(source.contamination, 0, 0, 100),
      mission: {
        active: Boolean(source.mission?.active),
        unsecuredLoot: Array.isArray(source.mission?.unsecuredLoot)
          ? clone(source.mission.unsecuredLoot).slice(0, 250)
          : [],
      },
      settings: {
        reducedMotion: Boolean(source.settings?.reducedMotion),
        screenShake: source.settings?.screenShake !== false,
      },
    };
  }

  function readPayload() {
    try {
      const payload = global.localStorage?.getItem(SAVE_KEY);
      lastStorageError = null;
      return payload || memoryPayload;
    } catch (error) {
      lastStorageError = error;
      return memoryPayload;
    }
  }

  function writePayload(payload) {
    memoryPayload = payload;
    try {
      global.localStorage?.setItem(SAVE_KEY, payload);
      lastStorageError = null;
      return true;
    } catch (error) {
      lastStorageError = error;
      return false;
    }
  }

  function dispatchUpdated(profile, persisted) {
    if (typeof global.CustomEvent !== "function" || typeof global.dispatchEvent !== "function") return;
    global.dispatchEvent(new CustomEvent("yomi:save-updated", {
      detail: {
        profile: clone(profile),
        persisted,
        storage: persisted ? "localStorage" : "memory",
      },
    }));
  }

  function load() {
    const payload = readPayload();
    if (!payload) {
      lastDataError = null;
      return defaultProfile();
    }
    try {
      const profile = normalizeProfile(JSON.parse(payload));
      lastDataError = null;
      return profile;
    } catch (error) {
      lastDataError = error;
      return defaultProfile();
    }
  }

  function save(profile = load()) {
    const normalized = normalizeProfile(profile);
    normalized.updatedAt = Date.now();
    const persisted = writePayload(JSON.stringify(normalized));
    dispatchUpdated(normalized, persisted);
    return clone(normalized);
  }

  function getLoadout() {
    return clone(load().loadout);
  }

  function setLoadout(loadout) {
    const profile = load();
    profile.loadout = normalizeLoadout(loadout, profile.unlocks.weapons);
    return clone(save(profile).loadout);
  }

  function unlockWeapon(weaponId) {
    const id = string(weaponId);
    const catalog = arsenal();
    if (!id || (catalog && !catalog.weaponById(id))) return false;
    const profile = load();
    if (!profile.unlocks.weapons.includes(id)) profile.unlocks.weapons.push(id);
    save(profile);
    return true;
  }

  function isWeaponUnlocked(weaponId) {
    return load().unlocks.weapons.includes(String(weaponId || ""));
  }

  function reset() {
    const profile = defaultProfile();
    const persisted = writePayload(JSON.stringify(profile));
    dispatchUpdated(profile, persisted);
    return clone(profile);
  }

  function clear() {
    memoryPayload = "";
    try {
      global.localStorage?.removeItem(SAVE_KEY);
      lastStorageError = null;
      return true;
    } catch (error) {
      lastStorageError = error;
      return false;
    }
  }

  function storageStatus() {
    return {
      key: SAVE_KEY,
      schema: SAVE_SCHEMA,
      persistent: !lastStorageError,
      fallback: Boolean(lastStorageError),
      error: lastStorageError ? String(lastStorageError.message || lastStorageError) : "",
      dataRecovered: Boolean(lastDataError),
      dataError: lastDataError ? String(lastDataError.message || lastDataError) : "",
    };
  }

  global.KageSave = Object.freeze({
    key: SAVE_KEY,
    schema: SAVE_SCHEMA,
    defaults: defaultProfile,
    normalize: normalizeProfile,
    load,
    save,
    getLoadout,
    setLoadout,
    unlockWeapon,
    isWeaponUnlocked,
    reset,
    clear,
    storageStatus,
  });
})(window);
