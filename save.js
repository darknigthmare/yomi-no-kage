(function defineKageSave(global) {
  "use strict";

  const SAVE_KEY = "yomi-no-kage-save-v1";
  const BACKUP_KEY = `${SAVE_KEY}-backup`;
  const SAVE_SCHEMA = 2;
  let memoryPayload = "";
  let memoryBackupPayload = "";
  let lastStorageError = null;
  let lastDataError = null;
  let recoverySource = "none";

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

  function objectMap(value, limit = 256) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, entry]) =>
          typeof key === "string"
          && entry
          && typeof entry === "object"
          && !Array.isArray(entry))
        .slice(0, limit)
        .map(([key, entry]) => [key, clone(entry)]),
    );
  }

  function normalizeFacility(value, fallbackLevel = 1) {
    return {
      level: number(value?.level, fallbackLevel, 0, 5),
      xp: number(value?.xp, 0, 0, 999999),
      lastUsedAt: number(value?.lastUsedAt, 0, 0),
    };
  }

  function normalizeDetachedEquipment(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return {
      weaponId: string(value.weaponId),
      x: number(value.x, 0, -100000, 100000),
      bottomY: number(value.bottomY, 0, -10000, 10000),
      width: number(value.width, 112, 1, 2000),
      damage: number(value.damage, 14, 0, 999),
      cooldown: number(value.cooldown, 0, 0, 60),
      active: value.active !== false,
    };
  }

  function normalizeBossRuntimeMap(value) {
    const normalized = {};
    for (const [bossId, state] of Object.entries(objectMap(value, 128))) {
      normalized[bossId] = {
        areaId: string(state.areaId),
        hp: number(state.hp, 1, 0, 999999),
        maxHp: number(state.maxHp, state.hp || 1, 1, 999999),
        phase: number(state.phase, 1, 1, 12),
        dead: Boolean(state.dead),
        detachablePartAttached: state.detachablePartAttached !== false,
        detachedEquipment: normalizeDetachedEquipment(state.detachedEquipment),
        updatedAt: number(state.updatedAt, 0, 0),
      };
    }
    return normalized;
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
      revision: 0,
      updatedAt: 0,
      progress: {
        chapter: 0,
        checkpoint: "kai-forest-entry",
        highestChapter: 0,
        areaId: "kai-forest-pass",
        spawnId: "prologue",
        health: 100,
        seals: 0,
        kills: 0,
        score: 0,
        elapsed: 0,
        visitedAreas: [],
        takenPickupIds: [],
        consumedCheckpointIds: [],
        started: false,
        completed: false,
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
      bossRuntime: {},
      secrets: {},
      recipes: [],
      artisans: [],
      decisions: {},
      contamination: 0,
      mission: {
        active: false,
        unsecuredLoot: [],
      },
      campaign: {
        compatibilityMode: false,
        currentActId: "act-01-forest",
        currentActOrder: 1,
        currentZoneId: "forest-kaido-trail",
        unlockedActs: ["act-01-forest"],
        completedActs: [],
        visitedZoneIds: [],
        completedZoneIds: [],
        completedObjectiveIds: [],
        objectiveStates: {},
        quests: {},
        acceptedQuestIds: [],
        completedQuestIds: [],
      },
      hub: {
        id: "refuge-pin-noir",
        level: 1,
        reputation: 0,
        supplies: 2,
        visitCount: 0,
        lastVisitedAt: 0,
        residents: ["chiyo-apothicaire"],
        facilities: {
          forge: { level: 1, xp: 0, lastUsedAt: 0 },
          infirmary: { level: 1, xp: 0, lastUsedAt: 0 },
          dojo: { level: 1, xp: 0, lastUsedAt: 0 },
          shrine: { level: 1, xp: 0, lastUsedAt: 0 },
        },
      },
      mastery: {
        totalXp: 0,
        weapons: {},
        upgradeLevels: {},
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

    if (schema === 1) {
      return {
        ...raw,
        schema: SAVE_SCHEMA,
        campaign: {
          ...(raw.campaign || {}),
          compatibilityMode: raw.campaign?.compatibilityMode !== false,
        },
      };
    }

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
      revision: number(source.revision, 0, 0, 999999999),
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
        areaId: string(source.progress?.areaId, defaults.progress.areaId),
        spawnId: string(source.progress?.spawnId, defaults.progress.spawnId),
        health: number(source.progress?.health, defaults.progress.health, 1, 100),
        seals: number(source.progress?.seals, defaults.progress.seals, 0, 99),
        kills: number(source.progress?.kills, defaults.progress.kills, 0, 99999),
        score: number(source.progress?.score, defaults.progress.score, 0, 999999999),
        elapsed: number(source.progress?.elapsed, defaults.progress.elapsed, 0, 99999999),
        visitedAreas: uniqueStrings(source.progress?.visitedAreas).slice(0, 64),
        takenPickupIds: uniqueStrings(source.progress?.takenPickupIds).slice(0, 512),
        consumedCheckpointIds: uniqueStrings(source.progress?.consumedCheckpointIds).slice(0, 128),
        started: Boolean(source.progress?.started),
        completed: Boolean(source.progress?.completed),
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
      bossRuntime: normalizeBossRuntimeMap(source.bossRuntime),
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
      campaign: {
        compatibilityMode: Boolean(source.campaign?.compatibilityMode),
        currentActId: string(source.campaign?.currentActId, defaults.campaign.currentActId),
        currentActOrder: number(
          source.campaign?.currentActOrder,
          defaults.campaign.currentActOrder,
          1,
          7,
        ),
        currentZoneId: string(source.campaign?.currentZoneId, defaults.campaign.currentZoneId),
        unlockedActs: uniqueStrings(source.campaign?.unlockedActs).slice(0, 7).length
          ? uniqueStrings(source.campaign?.unlockedActs).slice(0, 7)
          : [...defaults.campaign.unlockedActs],
        completedActs: uniqueStrings(source.campaign?.completedActs).slice(0, 7),
        visitedZoneIds: uniqueStrings(source.campaign?.visitedZoneIds).slice(0, 64),
        completedZoneIds: uniqueStrings(source.campaign?.completedZoneIds).slice(0, 64),
        completedObjectiveIds: uniqueStrings(source.campaign?.completedObjectiveIds).slice(0, 256),
        objectiveStates: objectMap(source.campaign?.objectiveStates, 256),
        quests: objectMap(source.campaign?.quests, 128),
        acceptedQuestIds: uniqueStrings(source.campaign?.acceptedQuestIds).slice(0, 128),
        completedQuestIds: uniqueStrings(source.campaign?.completedQuestIds).slice(0, 128),
      },
      hub: {
        id: string(source.hub?.id, defaults.hub.id),
        level: number(source.hub?.level, defaults.hub.level, 1, 5),
        reputation: number(source.hub?.reputation, 0, 0, 999999),
        supplies: number(source.hub?.supplies, defaults.hub.supplies, 0, 9999),
        visitCount: number(source.hub?.visitCount, 0, 0, 999999),
        lastVisitedAt: number(source.hub?.lastVisitedAt, 0, 0),
        residents: uniqueStrings(source.hub?.residents).slice(0, 64).length
          ? uniqueStrings(source.hub?.residents).slice(0, 64)
          : [...defaults.hub.residents],
        facilities: Object.fromEntries(
          Object.entries(defaults.hub.facilities).map(([facilityId, fallback]) => [
            facilityId,
            normalizeFacility(source.hub?.facilities?.[facilityId], fallback.level),
          ]),
        ),
      },
      mastery: {
        totalXp: number(source.mastery?.totalXp, 0, 0, 999999999),
        weapons: Object.fromEntries(
          Object.entries(source.mastery?.weapons || {})
            .filter(([weaponId]) => typeof weaponId === "string")
            .slice(0, 256)
            .map(([weaponId, xp]) => [weaponId, number(xp, 0, 0, 9999999)]),
        ),
        upgradeLevels: Object.fromEntries(
          Object.entries(source.mastery?.upgradeLevels || {})
            .filter(([weaponId]) => typeof weaponId === "string")
            .slice(0, 256)
            .map(([weaponId, level]) => [weaponId, number(level, 0, 0, 5)]),
        ),
      },
      settings: {
        reducedMotion: Boolean(source.settings?.reducedMotion),
        screenShake: source.settings?.screenShake !== false,
      },
    };
  }

  function readStorageKey(key, memoryFallback = "") {
    try {
      const payload = global.localStorage?.getItem(key);
      lastStorageError = null;
      return payload || memoryFallback;
    } catch (error) {
      lastStorageError = error;
      return memoryFallback;
    }
  }

  function writePayload(payload) {
    const previousPayload = readStorageKey(SAVE_KEY, memoryPayload);
    if (previousPayload) {
      try {
        JSON.parse(previousPayload);
        memoryBackupPayload = previousPayload;
        global.localStorage?.setItem(BACKUP_KEY, previousPayload);
      } catch (_) {
        // Une sauvegarde principale corrompue ne remplace jamais la copie saine.
      }
    }
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
    const payload = readStorageKey(SAVE_KEY, memoryPayload);
    if (!payload) {
      lastDataError = null;
      recoverySource = "none";
      return defaultProfile();
    }
    try {
      const profile = normalizeProfile(JSON.parse(payload));
      lastDataError = null;
      recoverySource = "primary";
      return profile;
    } catch (error) {
      lastDataError = error;
      const backupPayload = readStorageKey(BACKUP_KEY, memoryBackupPayload);
      if (backupPayload) {
        try {
          const recovered = normalizeProfile(JSON.parse(backupPayload));
          recoverySource = "backup";
          memoryPayload = JSON.stringify(recovered);
          try { global.localStorage?.setItem(SAVE_KEY, memoryPayload); } catch (_) { /* mémoire seulement */ }
          return recovered;
        } catch (_) {
          // Les deux copies sont inutilisables : retour sûr au profil par défaut.
        }
      }
      recoverySource = "defaults";
      return defaultProfile();
    }
  }

  function save(profile = load()) {
    const normalized = normalizeProfile(profile);
    normalized.revision = number(normalized.revision, 0, 0, 999999999) + 1;
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

  function getProgress() {
    return clone(load().progress);
  }

  function setProgress(patch = {}) {
    const profile = load();
    const candidate = patch && typeof patch === "object" && !Array.isArray(patch)
      ? patch
      : {};
    profile.progress = {
      ...profile.progress,
      ...candidate,
      highestChapter: Math.max(
        number(profile.progress?.highestChapter, 0, 0, 99),
        number(candidate.highestChapter ?? candidate.chapter, 0, 0, 99),
      ),
    };
    return clone(save(profile).progress);
  }

  function setCheckpoint(checkpointId, patch = {}) {
    const checkpoint = string(checkpointId);
    if (!checkpoint) return getProgress();
    return setProgress({
      ...patch,
      checkpoint,
      started: true,
      completed: false,
    });
  }

  function hasContinue() {
    const progress = load().progress;
    return Boolean(progress.started && !progress.completed);
  }

  function markBossDefeated(bossId, defeated = true) {
    const id = string(bossId);
    if (!id) return false;
    const profile = load();
    profile.bosses[id] = Boolean(defeated);
    if (profile.bossRuntime[id]) {
      profile.bossRuntime[id].dead = Boolean(defeated);
      if (defeated) profile.bossRuntime[id].hp = 0;
      profile.bossRuntime[id].updatedAt = Date.now();
    }
    save(profile);
    return true;
  }

  function setBossRuntime(bossId, state = {}) {
    const id = string(bossId);
    if (!id || !state || typeof state !== "object" || Array.isArray(state)) return null;
    const profile = load();
    profile.bossRuntime[id] = {
      ...(profile.bossRuntime[id] || {}),
      ...clone(state),
      updatedAt: Date.now(),
    };
    const saved = save(profile);
    return clone(saved.bossRuntime[id]);
  }

  function getBossRuntime(...bossIds) {
    const states = load().bossRuntime;
    for (const bossId of bossIds.flat()) {
      const id = string(bossId);
      if (id && states[id]) return clone(states[id]);
    }
    return null;
  }

  function visitCampaignZone(zoneId, actId = "", actOrder = 1) {
    const zone = string(zoneId);
    if (!zone) return clone(load().campaign);
    const profile = load();
    const act = string(actId, profile.campaign.currentActId);
    profile.campaign.currentZoneId = zone;
    profile.campaign.currentActId = act;
    profile.campaign.currentActOrder = number(actOrder, profile.campaign.currentActOrder, 1, 7);
    if (!profile.campaign.visitedZoneIds.includes(zone)) {
      profile.campaign.visitedZoneIds.push(zone);
    }
    if (act && !profile.campaign.unlockedActs.includes(act)) {
      profile.campaign.unlockedActs.push(act);
    }
    return clone(save(profile).campaign);
  }

  function getCampaignObjectiveState(objectiveId) {
    const id = string(objectiveId);
    if (!id) return null;
    const state = load().campaign.objectiveStates[id];
    return state ? clone(state) : null;
  }

  function setCampaignObjectiveState(objectiveId, patch = {}) {
    const id = string(objectiveId);
    if (!id) return null;
    const profile = load();
    const previous = profile.campaign.objectiveStates[id] || {};
    const next = {
      ...previous,
      ...(patch && typeof patch === "object" && !Array.isArray(patch)
        ? clone(patch)
        : {}),
      updatedAt: Date.now(),
    };
    next.progress = number(next.progress, 0, 0, 99);
    next.target = number(next.target, Math.max(1, next.progress), 1, 99);
    next.interactedTargetIds = uniqueStrings(next.interactedTargetIds).slice(0, 16);
    if (previous.completed) next.completed = true;
    profile.campaign.objectiveStates[id] = next;
    return clone(save(profile).campaign.objectiveStates[id]);
  }

  function completeCampaignObjective(objectiveId, patch = {}) {
    const id = string(objectiveId);
    if (!id) return clone(load().campaign);
    const profile = load();
    const newlyCompleted = !profile.campaign.completedObjectiveIds.includes(id);
    if (newlyCompleted) {
      profile.campaign.completedObjectiveIds.push(id);
    }
    profile.campaign.objectiveStates[id] = {
      ...(profile.campaign.objectiveStates[id] || {}),
      ...clone(patch),
      completed: true,
      completedAt: Date.now(),
    };
    const zoneId = string(patch.zoneId);
    if (zoneId && patch.completeZone && !profile.campaign.completedZoneIds.includes(zoneId)) {
      profile.campaign.completedZoneIds.push(zoneId);
    }
    const actId = string(patch.actId);
    const newlyCompletedAct = Boolean(
      actId
      && patch.completeAct
      && !profile.campaign.completedActs.includes(actId),
    );
    if (newlyCompletedAct) {
      profile.campaign.completedActs.push(actId);
    }
    const nextActId = string(patch.nextActId);
    if (nextActId && !profile.campaign.unlockedActs.includes(nextActId)) {
      profile.campaign.unlockedActs.push(nextActId);
    }
    if (newlyCompleted && patch.reward && typeof patch.reward === "object") {
      for (const currencyId of ["mon", "tamahagane", "yomiAsh"]) {
        profile.currencies[currencyId] = number(
          profile.currencies[currencyId],
          0,
          0,
          9999999,
        ) + number(patch.reward[currencyId], 0, 0, 999999);
      }
      profile.hub.supplies = number(
        profile.hub.supplies,
        0,
        0,
        9999,
      ) + number(patch.reward.supplies, 0, 0, 9999);
      profile.hub.reputation = number(
        profile.hub.reputation,
        0,
        0,
        999999,
      ) + number(patch.reward.reputation, 0, 0, 999999);
    }
    if (
      newlyCompletedAct
      && !newlyCompleted
      && patch.actCompletionReward
      && typeof patch.actCompletionReward === "object"
    ) {
      for (const currencyId of ["mon", "tamahagane", "yomiAsh"]) {
        profile.currencies[currencyId] = number(
          profile.currencies[currencyId],
          0,
          0,
          9999999,
        ) + number(patch.actCompletionReward[currencyId], 0, 0, 999999);
      }
      profile.hub.supplies = number(
        profile.hub.supplies,
        0,
        0,
        9999,
      ) + number(patch.actCompletionReward.supplies, 0, 0, 9999);
      profile.hub.reputation = number(
        profile.hub.reputation,
        0,
        0,
        999999,
      ) + number(patch.actCompletionReward.reputation, 0, 0, 999999);
    }
    return clone(save(profile).campaign);
  }

  function setQuestState(questId, patch = {}) {
    const id = string(questId);
    if (!id) return null;
    const profile = load();
    const previous = profile.campaign.quests[id] || {
      status: "available",
      progress: 0,
      target: 1,
    };
    const next = {
      ...previous,
      ...clone(patch),
      progress: number(patch.progress, previous.progress, 0, 999999),
      target: number(patch.target, previous.target, 1, 999999),
      updatedAt: Date.now(),
    };
    profile.campaign.quests[id] = next;
    if (next.status === "active" && !profile.campaign.acceptedQuestIds.includes(id)) {
      profile.campaign.acceptedQuestIds.push(id);
    }
    if (next.status === "completed" && !profile.campaign.completedQuestIds.includes(id)) {
      profile.campaign.completedQuestIds.push(id);
    }
    return clone(save(profile).campaign.quests[id]);
  }

  function recordWeaponMastery(weaponId, xp = 0) {
    const id = string(weaponId);
    const amount = number(xp, 0, 0, 999999);
    if (!id || amount <= 0) return clone(load().mastery);
    const profile = load();
    profile.mastery.weapons[id] = number(profile.mastery.weapons[id], 0, 0, 9999999) + amount;
    profile.mastery.totalXp += amount;
    return clone(save(profile).mastery);
  }

  function upgradeFacility(facilityId, payment = {}) {
    const id = string(facilityId);
    const profile = load();
    const facility = profile.hub.facilities[id];
    if (!facility || facility.level >= 5) return { ok: false, reason: "max", profile: clone(profile) };
    const currencyId = string(payment.currencyId, "mon");
    const cost = number(payment.cost, 0, 0, 999999);
    if (!(currencyId in profile.currencies)) {
      return { ok: false, reason: "currency", profile: clone(profile) };
    }
    if (profile.currencies[currencyId] < cost) {
      return { ok: false, reason: "funds", profile: clone(profile) };
    }
    profile.currencies[currencyId] -= cost;
    facility.level += 1;
    facility.lastUsedAt = Date.now();
    profile.hub.level = Math.max(
      1,
      Math.min(5, Math.floor(
        Object.values(profile.hub.facilities)
          .reduce((sum, entry) => sum + entry.level, 0) / 4,
      )),
    );
    profile.hub.reputation += 25 * facility.level;
    return { ok: true, reason: "", profile: save(profile) };
  }

  function setSetting(settingId, value) {
    const id = string(settingId);
    if (!id) return clone(load().settings);
    const profile = load();
    profile.settings[id] = Boolean(value);
    return clone(save(profile).settings);
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
    memoryBackupPayload = "";
    try {
      global.localStorage?.removeItem(SAVE_KEY);
      global.localStorage?.removeItem(BACKUP_KEY);
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
      backupKey: BACKUP_KEY,
      schema: SAVE_SCHEMA,
      persistent: !lastStorageError,
      fallback: Boolean(lastStorageError),
      error: lastStorageError ? String(lastStorageError.message || lastStorageError) : "",
      dataRecovered: Boolean(lastDataError),
      recoverySource,
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
    getProgress,
    setProgress,
    setCheckpoint,
    hasContinue,
    getLoadout,
    setLoadout,
    unlockWeapon,
    isWeaponUnlocked,
    markBossDefeated,
    getBossRuntime,
    setBossRuntime,
    visitCampaignZone,
    getCampaignObjectiveState,
    setCampaignObjectiveState,
    completeCampaignObjective,
    setQuestState,
    recordWeaponMastery,
    upgradeFacility,
    setSetting,
    reset,
    clear,
    storageStatus,
  });
})(window);
