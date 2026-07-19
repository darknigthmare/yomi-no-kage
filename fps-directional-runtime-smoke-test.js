"use strict";

/*
 * Contrat executable des huit banques directionnelles FPS.
 *
 * Le resolveur ci-dessous est extrait directement de game.js et execute dans
 * un petit contexte VM. Le test prouve ainsi que le runtime choisit une banque
 * par id + direction, puis que chaque orientation opposee pointe vers un PNG
 * distinct present dans le paquet de production.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = __dirname;
const gameSource = fs.readFileSync(path.join(root, "game.js"), "utf8");
const registry = JSON.parse(
  fs.readFileSync(path.join(root, "assets", "modular", "registry.json"), "utf8"),
);
const directions = [
  "front",
  "front-left",
  "left",
  "back-left",
  "back",
  "back-right",
  "right",
  "front-right",
];
const oppositePairs = [
  ["front", "back"],
  ["front-left", "back-right"],
  ["left", "right"],
  ["back-left", "front-right"],
];
const enemyCategories = new Set([
  "legacy",
  "regular",
  "special",
  "miniboss",
  "boss",
  "giant",
]);

const resolverStart = gameSource.indexOf("  function fpsAnimationSetForRosterEntry");
const resolverEnd = gameSource.indexOf("  function fpsWeaponSetForWeapon", resolverStart);
assert.ok(
  resolverStart >= 0 && resolverEnd > resolverStart,
  "Impossible d'extraire le resolveur directionnel FPS du runtime",
);

const sandbox = {
  modularRoster: { fpsAnimationSets: new Map() },
  animationSetFromPaths(paths, cache, cacheId) {
    return { paths, cache, cacheId };
  },
};
vm.createContext(sandbox);
vm.runInContext(
  `${gameSource.slice(resolverStart, resolverEnd)}\n`
    + "this.resolveFpsAnimationSet = fpsAnimationSetForRosterEntry;",
  sandbox,
);

const facingStart = gameSource.indexOf("  function fpsEnemyViewDirection");
const facingEnd = gameSource.indexOf("  function drawDirectionalAnimationSprite", facingStart);
assert.ok(
  facingStart >= 0 && facingEnd > facingStart,
  "Impossible d'extraire la quantification directionnelle du runtime",
);
Object.assign(sandbox, {
  FPS_ENEMY_DIRECTIONS: directions,
  normalizeAngle(angle) {
    let value = angle;
    while (value > Math.PI) value -= Math.PI * 2;
    while (value < -Math.PI) value += Math.PI * 2;
    return value;
  },
  ensureFpsEnemyAi(enemy) {
    return enemy.ai;
  },
  currentMission() {
    throw new Error("Le test semantique doit fournir le joueur explicitement");
  },
});
vm.runInContext(
  `${gameSource.slice(facingStart, facingEnd)}\n`
    + "this.resolveFpsFacing = fpsEnemyViewDirection;",
  sandbox,
);

const semanticEnemy = { x: 0, y: 0, ai: { heading: 0 } };
const semanticPlayer = { x: 1, y: 0 };
assert.equal(
  sandbox.resolveFpsFacing(semanticEnemy, semanticPlayer).direction,
  "front",
  "Un ennemi oriente vers le joueur doit charger la vue front",
);
semanticEnemy.ai.heading = Math.PI;
assert.equal(
  sandbox.resolveFpsFacing(semanticEnemy, semanticPlayer).direction,
  "back",
  "Un ennemi oriente a l'oppose du joueur doit charger la vue back",
);
semanticEnemy.ai.heading = Math.PI / 4;
assert.equal(sandbox.resolveFpsFacing(semanticEnemy, semanticPlayer).direction, "front-left");
semanticEnemy.ai.heading = -Math.PI / 4;
assert.equal(sandbox.resolveFpsFacing(semanticEnemy, semanticPlayer).direction, "front-right");

const enemies = registry.characters.filter((entry) => enemyCategories.has(entry.category));
assert.equal(enemies.length, 105, "Le contrat FPS doit couvrir les 105 ennemis");

let resolvedBanks = 0;
let oppositePathPairs = 0;
for (const entry of enemies) {
  assert.deepEqual(
    Object.keys(entry.fpsDirections || {}),
    directions,
    `${entry.id}: ordre ou couverture des huit directions incorrect`,
  );

  for (const direction of directions) {
    assert.equal(
      entry.fpsDirections[direction]?.singleSilhouetteSource,
      true,
      `${entry.id}/${direction}: banque multi-silhouette interdite`,
    );
    const resolved = sandbox.resolveFpsAnimationSet(entry, direction);
    assert.equal(
      resolved.cacheId,
      `${entry.id}:${direction}`,
      `${entry.id}/${direction}: cle de cache non directionnelle`,
    );
    assert.equal(
      resolved.paths,
      entry.fpsDirections[direction].animations,
      `${entry.id}/${direction}: le runtime n'utilise pas la banque dediee`,
    );
    for (const animation of ["idle", "move", "attack", "hurt", "death"]) {
      const pngPath = resolved.paths[animation];
      assert.ok(pngPath?.endsWith(".png"), `${entry.id}/${direction}/${animation}: PNG absent`);
      assert.ok(
        fs.existsSync(path.join(root, pngPath)),
        `${entry.id}/${direction}/${animation}: fichier runtime introuvable`,
      );
    }
    resolvedBanks += 1;
  }

  for (const [leftDirection, rightDirection] of oppositePairs) {
    const leftPath = sandbox.resolveFpsAnimationSet(entry, leftDirection).paths.idle;
    const rightPath = sandbox.resolveFpsAnimationSet(entry, rightDirection).paths.idle;
    assert.notEqual(
      leftPath,
      rightPath,
      `${entry.id}: ${leftDirection}/${rightDirection} reutilisent le meme PNG`,
    );
    oppositePathPairs += 1;
  }
  assert.match(
    sandbox.resolveFpsAnimationSet(entry, "front").paths.idle,
    /\/directions\/front\/sheets\/idle\.png$/,
    `${entry.id}: le chemin front est croise`,
  );
  assert.match(
    sandbox.resolveFpsAnimationSet(entry, "back").paths.idle,
    /\/directions\/back\/sheets\/idle\.png$/,
    `${entry.id}: le chemin back est croise`,
  );
}

assert.match(
  gameSource,
  /hasDedicatedDirectionalBank[\s\S]*?drawAnimationSprite\(/,
  "Le rendu direct de la banque dediee manque dans drawFpsEnemy",
);
assert.match(
  gameSource,
  /hasDedicatedDirectionalBank \? false : viewFacing\.mirror/,
  "Une banque dediee ne doit jamais etre miroir au runtime",
);

console.log("FPS eight-direction runtime smoke test passed.");
console.log(JSON.stringify({
  enemies: enemies.length,
  directions,
  resolvedBanks,
  animationSheetsResolved: resolvedBanks * 5,
  oppositePathPairs,
  semanticFacing: {
    headingTowardPlayer: "front",
    headingAwayFromPlayer: "back",
    frontBackPathsCrossed: false,
  },
  cacheKey: "character-id:direction",
  runtimeMirroring: "legacy-fallback-only",
}, null, 2));
