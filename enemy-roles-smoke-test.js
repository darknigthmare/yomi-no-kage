"use strict";

/*
 * Contrat des rôles IA et des seconds patterns de boss (P1.5).
 *
 * Vérifie le module pur `enemy-roles.js` (classification, profils, soutien,
 * alarme, chasse, patterns), sa couverture des neuf boss de campagne et son
 * branchement dans le moteur. Le ressenti de combat reste à valider en jeu.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const { KageLevels } = require("./level-data.js");

const ROOT = __dirname;
const gameSource = fs.readFileSync(path.join(ROOT, "game.js"), "utf8");
const registry = JSON.parse(
  fs.readFileSync(path.join(ROOT, "assets", "modular", "registry.json"), "utf8"),
);
const roster = (registry.characters || []).filter((entry) => entry.category !== "player");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const moduleSource = fs.readFileSync(path.join(ROOT, "enemy-roles.js"), "utf8");

const sandbox = { console };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(moduleSource, sandbox, { filename: "enemy-roles.js" });
const roles = sandbox.KageEnemyRoles;

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

const acts = Object.values(KageLevels.campaignActs).sort(
  (left, right) => left.order - right.order,
);
const bossObjectives = Object.values(KageLevels.campaignObjectives).filter(
  (objective) => objective.type === "boss" && objective.targetEnemyId,
);
const campaignBossIds = [...new Set([
  ...acts.map((act) => act.bossEnemyId),
  ...bossObjectives.map((objective) => objective.targetEnemyId),
])].sort();

check("le module charge huit rôles sans DOM ni dépendance", () => {
  assert.equal(typeof sandbox.document, "undefined");
  assert.equal(roles.roles.length, 8, "huit rôles attendus");
  for (const role of ["ranged", "support", "alarm", "hunter"]) {
    assert.ok(roles.roles.includes(role), `${role} absent`);
    assert.ok(roles.labels[role], `${role} sans libellé`);
    assert.equal(roles.isNewRole(role), true, `${role} non déclaré comme nouveau`);
  }
  assert.equal(roles.labels.ranged, "Tireur");
  assert.equal(roles.labels.support, "Soutien");
  assert.equal(roles.labels.alarm, "Alarme");
  assert.equal(roles.labels.hunter, "Chasseur");
  assert.ok(!/\bfetch\s*\(/.test(moduleSource), "aucun fetch attendu");
  assert.ok(!/\brequire\s*\(/.test(moduleSource), "aucun require attendu");
});

check("les quatre rôles sont reconnaissables par leurs mots-clés", () => {
  const cases = [
    [{ id: "r01-teppo-ashigaru", name: "Teppo ashigaru" }, "ranged"],
    [{ id: "mb-02-moine-soigneur", name: "Moine soigneur" }, "support"],
    [{ id: "r03-guetteur-cloche", name: "Guetteur à la cloche" }, "alarm"],
    [{ id: "s04-chasseur-meute", name: "Chasseur de la meute" }, "hunter"],
    [{ id: "r05-kabuto-brute", name: "Kabuto brute" }, "shield"],
    [{ id: "s01-onibi", name: "Onibi" }, "spirit"],
    [{ id: "01-shibito-villager", name: "Shibito des rizières" }, "melee"],
  ];
  for (const [entry, expected] of cases) {
    assert.equal(roles.classify(entry, {}), expected, `${entry.id} mal classé`);
  }
  assert.equal(
    roles.classify({ id: "x-arquebusier", name: "Arquebusier" }, {}),
    "ranged",
  );
  assert.equal(
    roles.classify({ id: "x-infirmier-de-camp", name: "Infirmier de camp" }, {}),
    "support",
  );
});

check("chaque nouveau rôle possède un profil 2D et FPS distinct", () => {
  const kinds = new Set();
  for (const role of ["ranged", "support", "alarm", "hunter"]) {
    const side = roles.behavior(role, "side");
    const fps = roles.behavior(role, "fps");
    assert.ok(side && fps, `${role} sans profil`);
    assert.equal(side.attackKind, fps.attackKind, `${role} : type d'attaque incohérent`);
    kinds.add(side.attackKind);
    assert.ok(side.attackKind, `${role} : type d'attaque absent`);
  }
  assert.equal(kinds.size, 4, "les quatre rôles doivent avoir quatre attaques distinctes");
  const support = roles.behavior("support", "side");
  const alarm = roles.behavior("alarm", "side");
  assert.ok(support.damage < 10, "un soutien doit rester une menace faible");
  assert.ok(alarm.damage < 10, "une alarme doit rester une menace faible");
  assert.equal(support.support, true);
  assert.equal(alarm.alarm, true);
  assert.equal(roles.behavior("hunter", "side").hunter, true);
  assert.ok(roles.behavior("ranged", "side").reach >= 170, "le tireur doit porter loin");
  assert.ok(roles.behavior("ranged", "side").minRange > 0, "le tireur doit garder ses distances");
  assert.ok(
    roles.behavior("support", "side").minRange > 0,
    "le soutien doit rester derrière",
  );
  assert.ok(
    roles.behavior("hunter", "side").speed > roles.behavior("support", "side").speed,
    "le chasseur doit être plus rapide que le soutien",
  );
  assert.equal(roles.behavior("melee", "side"), null, "les profils historiques restent dans game.js");
});

check("le chasseur ignore le rattachement et garde la mémoire longue", () => {
  assert.ok(roles.isHunter("hunter"));
  assert.equal(roles.isHunter("ranged"), false);
  assert.ok(roles.leashFor("hunter", 330) > 10000, "le chasseur ne doit pas être rappelé");
  assert.equal(roles.leashFor("melee", 330), 330, "les autres rôles gardent leur laisse");
  assert.ok(roles.memoryFor("hunter", 2.3) >= 6, "mémoire de chasse trop courte");
  assert.equal(roles.memoryFor("melee", 2.3), 2.3);
});

check("le soutien choisit l'allié le plus blessé à portée", () => {
  const self = { x: 100, w: 16, hp: 10, maxHp: 10, ai: { state: "pursue" } };
  const allies = [
    self,
    { x: 140, w: 16, hp: 8, maxHp: 10, ai: { state: "pursue" } },
    { x: 180, w: 16, hp: 3, maxHp: 10, ai: { state: "pursue" } },
    { x: 220, w: 16, hp: 5, maxHp: 10, dead: true },
    { x: 260, w: 16, hp: 10, maxHp: 10 },
    { x: 2000, w: 16, hp: 1, maxHp: 10 },
  ];
  const target = roles.supportTarget(allies, self);
  assert.equal(target.hp, 3, "l'allié le plus blessé à portée doit être choisi");
  assert.equal(roles.supportTarget([self], self), null, "aucune cible sans allié blessé");
  assert.equal(roles.supportTarget([], self), null);
  assert.equal(roles.supportTarget(allies, null), null);
});

check("l'alarme rallie les voisins non engagés", () => {
  const source = { x: 100, w: 16, ai: { state: "pursue" } };
  const allies = [
    source,
    { x: 160, w: 16, ai: { state: "patrol" } },
    { x: 200, w: 16, ai: { state: "pursue" } },
    { x: 240, w: 16, dead: true, ai: { state: "patrol" } },
    { x: 4000, w: 16, ai: { state: "patrol" } },
  ];
  const alerted = roles.alarmTargets(allies, source);
  assert.equal(alerted.length, 1, "un seul voisin doit être rallié");
  assert.equal(alerted[0].x, 160);
  assert.equal(roles.alarmTargets(allies, null).length, 0);
});

check("les neuf boss de campagne ont exactement deux patterns", () => {
  assert.equal(campaignBossIds.length, 9, `9 boss attendus, reçu ${campaignBossIds.length}`);
  assert.equal(
    JSON.stringify(Object.keys(roles.bossPatterns).sort()),
    JSON.stringify(campaignBossIds),
    "les patterns doivent couvrir exactement les boss de campagne",
  );
  const patternIds = new Set();
  for (const bossId of campaignBossIds) {
    const patterns = roles.patternsFor(bossId);
    assert.equal(patterns.length, 2, `${bossId} : deux patterns attendus`);
    assert.equal(patterns[0].threshold, 1, `${bossId} : premier pattern incomplet`);
    assert.equal(patterns[1].threshold, 0.5, `${bossId} : second pattern sous 50 % attendu`);
    assert.notEqual(
      patterns[0].attackKind,
      patterns[1].attackKind,
      `${bossId} : les deux patterns doivent différer`,
    );
    assert.ok(
      patterns[1].telegraph > patterns[0].telegraph,
      `${bossId} : le second pattern doit être plus télégraphié`,
    );
    for (const pattern of patterns) {
      assert.ok(pattern.id && pattern.label, `${bossId} : pattern sans identité`);
      assert.ok(!patternIds.has(pattern.id), `${pattern.id} : pattern dupliqué`);
      patternIds.add(pattern.id);
      assert.ok(pattern.telegraph > 0, `${pattern.id} : télégraphe absent`);
    }
  }
});

check("le catalogue réel fournit les quatre rôles", () => {
  const distribution = {};
  for (const entry of roster) {
    const role = roles.classify(entry, {});
    distribution[role] = (distribution[role] || 0) + 1;
  }
  for (const role of ["ranged", "support", "alarm", "hunter"]) {
    assert.ok(distribution[role] >= 1, `${role} n'est porté par aucun ennemi`);
  }
  const newcomers = distribution.ranged + distribution.support + distribution.alarm + distribution.hunter;
  assert.ok(
    newcomers <= roster.length * 0.2,
    `${newcomers} ennemis reclassés sur ${roster.length} : les rôles doivent rester minoritaires`,
  );
  const heavy = roster.filter((entry) =>
    ["miniboss", "boss", "giant"].includes(entry.category),
  );
  for (const entry of heavy) {
    const role = roles.classify(entry, {});
    assert.ok(
      role !== "support" && role !== "alarm",
      `${entry.id} (${entry.category}) ne doit pas être ${role}`,
    );
  }
});

check("le second pattern prend le relais à 50 % et modifie le combat", () => {
  const first = roles.patternFor("giant-03-take-mori", 0.9);
  const second = roles.patternFor("giant-03-take-mori", 0.5);
  const low = roles.patternFor("giant-03-take-mori", 0.1);
  assert.equal(first.id, "bamboo-slam");
  assert.equal(second.id, "root-whip");
  assert.equal(low.id, "root-whip");
  assert.equal(roles.patternFor("boss-inconnu", 0.2), null);

  const base = {
    speed: 32, damage: 20, postureDamage: 36,
    attackDuration: 1, activeAt: 0.6, reach: 80, attackKind: "smash",
  };
  const applied = roles.applyPattern(base, second);
  assert.equal(applied.pattern, "root-whip");
  assert.equal(applied.attackKind, "sweep");
  assert.ok(applied.damage > base.damage, "les dégâts doivent augmenter");
  assert.ok(applied.postureDamage > base.postureDamage, "la posture doit augmenter");
  assert.ok(applied.reach > base.reach, "la portée doit augmenter");
  assert.ok(applied.attackDuration > base.attackDuration, "le télégraphe doit allonger l'attaque");
  assert.equal(applied.telegraph, second.telegraph);
  assert.equal(roles.applyPattern(base, null), base, "sans pattern, le profil reste intact");
});

check("le moteur branche les rôles, l'alarme, le soutien et les patterns", () => {
  assert.ok(
    html.indexOf('enemy-roles.js') > -1
      && html.indexOf('enemy-roles.js') < html.indexOf('game.js'),
    "enemy-roles.js doit être chargé avant game.js",
  );
  for (const marker of [
    "KageEnemyRoles",
    "withBossPattern",
    "supportTarget",
    "alarmTargets",
    "isHunter",
    "behavior?.(family",
  ]) {
    assert.ok(gameSource.includes(marker), `game.js ne branche pas ${marker}`);
  }
  const guarded = gameSource.match(/roleBehaviour && family !== "ranged" && !enemy\.boss/g) || [];
  assert.equal(
    guarded.length,
    2,
    "les profils 2D et FPS doivent exclure les boss des rôles soutien et alarme",
  );
});

if (failures.length) {
  console.error(
    `\nEnemy roles smoke test : ${successes.length} contrat(s) valide(s), ${failures.length} manquant(s).`,
  );
  failures.forEach((failure, index) => {
    console.error(`${index + 1}. ${failure.name}`);
    console.error(`   ${failure.message}`);
  });
  process.exitCode = 1;
} else {
  console.log(
    `\nEnemy roles smoke test OK — 8 rôles, ${campaignBossIds.length} boss × 2 patterns`,
  );
}
