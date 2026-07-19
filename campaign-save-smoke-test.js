const fs = require("fs");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const payloads = new Map();
const events = [];
class TestCustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
}

const weapons = [
  "01-kurokage",
  "wakizashi",
  "kunai",
  "hira-shuriken",
  "naginata-lourde",
].map((id) => ({ id }));
const arsenal = {
  weapons,
  defaultLoadout: {
    primary: "01-kurokage",
    secondary: "wakizashi",
    ranged: "kunai",
  },
  defaultUnlockedWeapons: ["01-kurokage", "wakizashi", "kunai"],
  weaponById: (id) => weapons.find((entry) => entry.id === id) || null,
  normalizeLoadout: (loadout = {}) => ({
    primary: loadout.primary || "01-kurokage",
    secondary: loadout.secondary || "wakizashi",
    ranged: loadout.ranged || "kunai",
  }),
  isWeaponCompatibleWithSlot: (id) => weapons.some((entry) => entry.id === id),
};
const window = {
  KageArsenal: arsenal,
  localStorage: {
    getItem: (key) => payloads.get(key) || null,
    setItem: (key, value) => payloads.set(key, String(value)),
    removeItem: (key) => payloads.delete(key),
  },
  CustomEvent: TestCustomEvent,
  dispatchEvent: (event) => events.push(event),
};
const context = {
  window,
  CustomEvent: TestCustomEvent,
  console,
};
vm.createContext(context);
vm.runInContext(fs.readFileSync("save.js", "utf8"), context, { filename: "save.js" });

const save = window.KageSave;
assert(save.schema === 2, "Le schéma de sauvegarde doit être en version 2.");

const defaults = save.defaults();
assert(defaults.campaign.currentActOrder === 1, "La campagne doit démarrer à l'acte I.");
assert(defaults.hub.facilities.forge.level === 1, "La forge doit être utilisable dès le départ.");
assert(defaults.bossRuntime && typeof defaults.bossRuntime === "object", "Le runtime des boss doit exister.");

const migrated = save.normalize({
  schema: 1,
  progress: { started: true, areaId: "legacy-area", health: 82 },
  loadout: defaults.loadout,
  unlocks: defaults.unlocks,
});
assert(migrated.schema === 2, "Une sauvegarde v1 doit migrer vers v2.");
assert(migrated.progress.health === 82, "La migration ne doit pas perdre la vie.");
assert(migrated.campaign.unlockedActs.includes("act-01-forest"), "La migration doit créer la campagne.");
assert(
  migrated.campaign.compatibilityMode === true,
  "Une sauvegarde v1 doit conserver temporairement les anciens raccourcis.",
);

let profile = save.reset();
profile.currencies.tamahagane = 12;
profile.currencies.mon = 500;
profile.currencies.yomiAsh = 10;
profile = save.save(profile);

const visit = save.visitCampaignZone("fields-west-dikes", "act-03-fields", 3);
assert(visit.currentActOrder === 3, "L'ordre d'acte doit être persisté.");
assert(visit.visitedZoneIds.includes("fields-west-dikes"), "La zone visitée doit être persistée.");

save.completeCampaignObjective("obj-fields-open-irrigation", {
  actId: "act-03-fields",
  zoneId: "fields-west-dikes",
  completeZone: true,
});
assert(
  save.load().campaign.completedZoneIds.includes("fields-west-dikes"),
  "Une zone ne doit être terminée qu'après un objectif réellement accompli.",
);

save.setQuestState("contract-road-cleansing", {
  status: "active",
  progress: 7,
  target: 8,
});
assert(
  save.load().campaign.quests["contract-road-cleansing"].progress === 7,
  "La progression d'un contrat doit être persistée.",
);

save.recordWeaponMastery("01-kurokage", 45);
assert(save.load().mastery.weapons["01-kurokage"] === 45, "La maîtrise d'arme doit progresser.");

const facility = save.upgradeFacility("forge", {
  currencyId: "tamahagane",
  cost: 2,
});
assert(facility.ok, "La forge doit pouvoir être améliorée avec assez de ressources.");
assert(facility.profile.hub.facilities.forge.level === 2, "Le niveau de forge doit être sauvegardé.");

save.setBossRuntime("aka-ushi-market", {
  areaId: "kurokawa-market-east",
  hp: 18,
  maxHp: 42,
  phase: 2,
  detachablePartAttached: false,
  detachedEquipment: {
    weaponId: "joug-tranchant-aka-ushi",
    x: 1542,
    bottomY: 650,
    width: 118,
    damage: 14,
    cooldown: 0.35,
    active: true,
  },
});
const boss = save.getBossRuntime("missing", "aka-ushi-market");
assert(boss.hp === 18 && boss.phase === 2, "La vie et la phase du boss doivent être restaurables.");
assert(boss.detachablePartAttached === false, "Le joug doit rester détaché.");
assert(
  boss.detachedEquipment?.weaponId === "joug-tranchant-aka-ushi"
    && boss.detachedEquipment.active,
  "Le danger du joug détaché doit être sauvegardé.",
);

const beforeCorruption = save.load();
beforeCorruption.currencies.mon = 777;
save.save(beforeCorruption);
const expectedBackupRevision = save.load().revision;
const newer = save.load();
newer.currencies.mon = 888;
save.save(newer);
payloads.set(save.key, "{corrupted-json");
const recovered = save.load();
assert(recovered.revision === expectedBackupRevision, "La copie précédente doit restaurer la révision saine.");
assert(save.storageStatus().recoverySource === "backup", "La restauration doit signaler la copie de secours.");
assert(save.storageStatus().dataRecovered, "Le diagnostic doit signaler la corruption récupérée.");

const gameSource = fs.readFileSync("game.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
const uiSource = fs.readFileSync("campaign-ui.js", "utf8");
assert(gameSource.includes("persistBossRuntime(enemy"), "Le moteur doit persister les boss pendant le combat.");
assert(
  gameSource.includes("enemy.detachedEquipment = runtime.detachedEquipment"),
  "Le moteur doit restaurer le joug.",
);
assert(gameSource.includes("evaluateCampaignObjectives(\"clear\""), "Le clear réel doit piloter les objectifs.");
assert(gameSource.includes("openCampaign: openCampaignScreen"), "L'API du refuge doit être publique.");
assert(html.includes('id="campaign-screen"'), "L'écran de refuge doit exister.");
assert(html.includes('data-action="campaign"'), "Le refuge doit être accessible au clavier et au tactile.");
assert(
  html.includes('data-action="interact"') && html.includes('id="touch-look"'),
  "Les objectifs et missions FPS doivent rester accessibles sur mobile.",
);
assert(uiSource.includes('data-campaign-action="upgrade-facility"'), "Les améliorations doivent être interactives.");
const styles = fs.readFileSync("styles.css", "utf8");
assert(
  /body\[data-state="campaign"\]\s+\.touch-controls/.test(styles),
  "Les contrôles de jeu doivent s'effacer derrière l'écran de campagne.",
);
assert(
  /@media \(max-width: 520px\)[\s\S]*?\.campaign-layout\s*\{[\s\S]*?overflow:\s*auto;[\s\S]*?touch-action:\s*pan-y;/m.test(styles),
  "Le journal de campagne doit défiler verticalement en portrait.",
);
assert(events.some((event) => event.type === "yomi:save-updated"), "La sauvegarde doit notifier l'interface.");

console.log(JSON.stringify({
  ok: true,
  schema: save.schema,
  recoveredFrom: save.storageStatus().recoverySource,
  campaign: {
    actsSupported: 7,
    zonesSupported: 28,
    visited: recovered.campaign.visitedZoneIds.length,
  },
  hub: {
    level: recovered.hub.level,
    forge: recovered.hub.facilities.forge.level,
  },
  bossRuntime: {
    phase: recovered.bossRuntime["aka-ushi-market"].phase,
    detached: recovered.bossRuntime["aka-ushi-market"].detachablePartAttached === false,
    hazardActive: recovered.bossRuntime["aka-ushi-market"].detachedEquipment.active,
  },
}, null, 2));
