(function defineKageEnemyRoles(global) {
  "use strict";

  /*
   * Rôles IA et seconds patterns de boss (P1.5).
   *
   * Module pur : aucune lecture du DOM, aucun accès au moteur. `game.js`
   * l'utilise pour classer les ennemis, choisir un profil de combat et faire
   * évoluer un boss vers son second pattern. Les familles historiques
   * (melee, shield, charger, spirit) gardent leurs nombres dans `game.js` ;
   * ce module ajoute `ranged` (tireur), `support`, `alarm` et `hunter`, plus les
   * patterns des neuf boss de campagne.
   */

  const ROLE_IDS = Object.freeze([
    "melee",
    "shield",
    "charger",
    "spirit",
    "ranged",
    "support",
    "alarm",
    "hunter",
  ]);
  const ROLE_LABELS = Object.freeze({
    melee: "Mêlée",
    shield: "Garde",
    charger: "Charge",
    spirit: "Esprit",
    ranged: "Tireur",
    support: "Soutien",
    alarm: "Alarme",
    hunter: "Chasseur",
  });
  const NEW_ROLES = Object.freeze(["ranged", "support", "alarm", "hunter"]);

  const SUPPORT_RADIUS = 260;
  const SUPPORT_HEAL = 2;
  const SUPPORT_POSTURE_RELIEF = 8;
  const SUPPORT_COOLDOWN = 2.4;
  const ALARM_RADIUS = 420;
  const HUNTER_LEASH = 100000;
  const HUNTER_MEMORY = 6.5;

  /* Profils des rôles ajoutés. Les distances sont en pixels en 2D et en mètres
   * en FPS, comme les profils historiques de `game.js`. */
  const BEHAVIORS = Object.freeze({
    side: Object.freeze({
      ranged: Object.freeze({
        speed: 18, damage: 10, postureDamage: 18,
        attackDuration: 0.96, activeAt: 0.64, recovery: 1.2,
        reach: 178, minRange: 72, ranged: true, attackKind: "ranged",
      }),
      support: Object.freeze({
        speed: 24, damage: 6, postureDamage: 8,
        attackDuration: 0.6, activeAt: 0.5, recovery: SUPPORT_COOLDOWN,
        reach: 22, minRange: 120, ranged: false, attackKind: "support-strike",
        support: true,
      }),
      alarm: Object.freeze({
        speed: 30, damage: 5, postureDamage: 6,
        attackDuration: 0.5, activeAt: 0.4, recovery: 3,
        reach: 20, minRange: 150, ranged: false, attackKind: "alarm-strike",
        alarm: true,
      }),
      hunter: Object.freeze({
        speed: 34, damage: 13, postureDamage: 24,
        attackDuration: 0.68, activeAt: 0.52, recovery: 0.74,
        reach: 26, minRange: 0, ranged: false, attackKind: "hunter-strike",
        hunter: true,
      }),
    }),
    fps: Object.freeze({
      ranged: Object.freeze({
        speed: 0.56, damage: 11, postureDamage: 18,
        attackDuration: 1.02, activeAt: 0.66, recovery: 1.25,
        reach: 5.8, minRange: 2.45, ranged: true, attackKind: "ranged",
      }),
      support: Object.freeze({
        speed: 0.62, damage: 6, postureDamage: 8,
        attackDuration: 0.62, activeAt: 0.5, recovery: SUPPORT_COOLDOWN,
        reach: 0.82, minRange: 2.2, ranged: false, attackKind: "support-strike",
        support: true,
      }),
      alarm: Object.freeze({
        speed: 1.02, damage: 5, postureDamage: 6,
        attackDuration: 0.52, activeAt: 0.4, recovery: 3,
        reach: 0.78, minRange: 3, ranged: false, attackKind: "alarm-strike",
        alarm: true,
      }),
      hunter: Object.freeze({
        speed: 1.28, damage: 12, postureDamage: 24,
        attackDuration: 0.72, activeAt: 0.54, recovery: 0.8,
        reach: 1.02, minRange: 0, ranged: false, attackKind: "hunter-strike",
        hunter: true,
      }),
    }),
  });

  /* Deux patterns par boss de campagne. Le premier couvre 100 % → 50 % des
   * points de vie ; le second prend le relais à 50 % et moins, avec un
   * télégraphe plus long et une attaque différente. */
  const BOSS_PATTERNS = Object.freeze({
    "giant-03-take-mori": Object.freeze([
      Object.freeze({
        id: "bamboo-slam", label: "Écrasement de bambou", attackKind: "smash",
        threshold: 1, telegraph: 0.42,
        speedMultiplier: 1, damageMultiplier: 1, postureMultiplier: 1, reachMultiplier: 1,
      }),
      Object.freeze({
        id: "root-whip", label: "Fouet de racines", attackKind: "sweep",
        threshold: 0.5, telegraph: 0.62,
        speedMultiplier: 1.18, damageMultiplier: 1.2, postureMultiplier: 1.25, reachMultiplier: 1.3,
      }),
    ]),
    "boss-14-maitre-shinobi-kumo": Object.freeze([
      Object.freeze({
        id: "silent-blade", label: "Lame silencieuse", attackKind: "melee",
        threshold: 1, telegraph: 0.34,
        speedMultiplier: 1, damageMultiplier: 1, postureMultiplier: 1, reachMultiplier: 1,
      }),
      Object.freeze({
        id: "shadow-flurry", label: "Bunshin enchaîné", attackKind: "shadow-flurry",
        threshold: 0.5, telegraph: 0.4,
        speedMultiplier: 1.42, damageMultiplier: 1.1, postureMultiplier: 1.15, reachMultiplier: 1.2,
      }),
    ]),
    "giant-07-shiro-kabuto": Object.freeze([
      Object.freeze({
        id: "horn-charge", label: "Charge de corne", attackKind: "charge",
        threshold: 1, telegraph: 0.5,
        speedMultiplier: 1, damageMultiplier: 1, postureMultiplier: 1, reachMultiplier: 1,
      }),
      Object.freeze({
        id: "iron-wall", label: "Mur de carapace", attackKind: "shield-bash",
        threshold: 0.5, telegraph: 0.7,
        speedMultiplier: 0.86, damageMultiplier: 1.35, postureMultiplier: 1.6, reachMultiplier: 1.1,
      }),
    ]),
    "boss-11-brigadier-engeki": Object.freeze([
      Object.freeze({
        id: "musket-volley", label: "Salve de mousquet", attackKind: "ranged",
        threshold: 1, telegraph: 0.48,
        speedMultiplier: 1, damageMultiplier: 1, postureMultiplier: 1, reachMultiplier: 1,
      }),
      Object.freeze({
        id: "bayonet-rush", label: "Baïonnette en avant", attackKind: "charge",
        threshold: 0.5, telegraph: 0.5,
        speedMultiplier: 1.4, damageMultiplier: 1.25, postureMultiplier: 1.2, reachMultiplier: 1.15,
      }),
    ]),
    "06-daimyo-corrupted": Object.freeze([
      Object.freeze({
        id: "corrupted-decree", label: "Décret corrompu", attackKind: "spirit",
        threshold: 1, telegraph: 0.5,
        speedMultiplier: 1, damageMultiplier: 1, postureMultiplier: 1, reachMultiplier: 1,
      }),
      Object.freeze({
        id: "yomi-hand", label: "Main du Yomi", attackKind: "spirit-grasp",
        threshold: 0.5, telegraph: 0.78,
        speedMultiplier: 0.92, damageMultiplier: 1.3, postureMultiplier: 1.5, reachMultiplier: 1.4,
      }),
    ]),
    "giant-10-yomi-no-kanrei": Object.freeze([
      Object.freeze({
        id: "rift-pressure", label: "Pression de la faille", attackKind: "smash",
        threshold: 1, telegraph: 0.56,
        speedMultiplier: 1, damageMultiplier: 1, postureMultiplier: 1, reachMultiplier: 1,
      }),
      Object.freeze({
        id: "rift-opening", label: "Ouverture du rift", attackKind: "rift-burst",
        threshold: 0.5, telegraph: 0.9,
        speedMultiplier: 0.9, damageMultiplier: 1.4, postureMultiplier: 1.35, reachMultiplier: 1.55,
      }),
    ]),
    "new-modern-metro-colossus": Object.freeze([
      Object.freeze({
        id: "train-charge", label: "Charge de rame", attackKind: "charge",
        threshold: 1, telegraph: 0.58,
        speedMultiplier: 1, damageMultiplier: 1, postureMultiplier: 1, reachMultiplier: 1,
      }),
      Object.freeze({
        id: "torn-door", label: "Porte arrachée", attackKind: "hazard-throw",
        threshold: 0.5, telegraph: 0.74,
        speedMultiplier: 1.06, damageMultiplier: 1.3, postureMultiplier: 1.2, reachMultiplier: 1.45,
      }),
    ]),
    "new-cyber-yomi-hacker": Object.freeze([
      Object.freeze({
        id: "network-surge", label: "Surcharge réseau", attackKind: "ranged",
        threshold: 1, telegraph: 0.44,
        speedMultiplier: 1, damageMultiplier: 1, postureMultiplier: 1, reachMultiplier: 1,
      }),
      Object.freeze({
        id: "lockdown", label: "Verrouillage du secteur", attackKind: "zone-lock",
        threshold: 0.5, telegraph: 0.66,
        speedMultiplier: 1.16, damageMultiplier: 1.15, postureMultiplier: 1.3, reachMultiplier: 1.25,
      }),
    ]),
    "new-cyber-shogun-zero": Object.freeze([
      Object.freeze({
        id: "executive-edit", label: "Édit exécutoire", attackKind: "boss-strike",
        threshold: 1, telegraph: 0.5,
        speedMultiplier: 1, damageMultiplier: 1, postureMultiplier: 1, reachMultiplier: 1,
      }),
      Object.freeze({
        id: "mandate-purge", label: "Purge du mandat", attackKind: "spirit",
        threshold: 0.5, telegraph: 0.86,
        speedMultiplier: 0.95, damageMultiplier: 1.45, postureMultiplier: 1.4, reachMultiplier: 1.5,
      }),
    ]),
  });

  /* Classification volontairement étroite : identifiant, nom et sous-titre
   * seulement. Le texte de `gameplay` décrit trop de choses pour servir de
   * signal, et une catégorie lourde (boss, géant, sous-boss) ne reçoit jamais
   * un rôle de soutien ou d'alarme : elle doit rester une menace. */
  const HEAVY_CATEGORIES = new Set(["mini-boss", "miniboss", "boss", "giant"]);
  const ALARM_PATTERN = /\bguetteur\b|\bsentinelle\b|\bveilleur\b|\bcloche\b|\btambour\b|\bcorne\b|\balarme\b|\bwatchman\b/;
  const SUPPORT_PATTERN = /\bsoigneur\b|\bsoigneuse\b|\bmedecin\b|\bmédecin\b|\bpretre\b|\bprêtre\b|\bpretresse\b|\bprêtresse\b|\bmoine\b|\bmedic\b|\bshaman\b|\binfirmier\b/;
  const HUNTER_PATTERN = /\bchasseur\b|\btraqueur\b|\bpisteur\b|\blimier\b|\bmolosse\b|\bhunter\b|\btracker\b/;
  const RANGED_PATTERN = /teppo|tanegashima|arqueb|archer|yumi|arc\b|tireur|projectile|shuriken|kunai|arbal|fusil|mousquet|gunner|sniper|\barc\b/;
  const SPIRIT_PATTERN = /onibi|onryo|oracle|shikigami|miko|yomi|esprit|spirit|spectr|biwa/;
  const SHIELD_PATTERN = /bouclier|pavois|shield|gardien|kabuto|carapace|jailer|geoli/;
  const CHARGER_PATTERN = /charge|runner|sumotori|oni|taureau|ushi|brute|cavalier/;

  function fullText(entry, enemy) {
    return [
      entry?.id,
      entry?.name,
      entry?.subtitle,
      entry?.gameplay,
      entry?.weaponId,
      enemy?.weaponAsset?.id,
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function narrowText(entry, enemy) {
    return [entry?.id, entry?.name, entry?.subtitle, enemy?.weaponAsset?.id]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function classify(entry = {}, enemy = {}) {
    if (ROLE_IDS.includes(entry.role)) return entry.role;
    /* Les quatre familles historiques gardent leur texte complet : leur
     * classification existante ne doit pas bouger. Les rôles ajoutés se
     * contentent de l'identifiant, du nom et du sous-titre. */
    const legacy = fullText(entry, enemy);
    if (RANGED_PATTERN.test(legacy)) return "ranged";
    if (SPIRIT_PATTERN.test(legacy)) return "spirit";
    if (SHIELD_PATTERN.test(legacy)) return "shield";
    if (CHARGER_PATTERN.test(legacy)) return "charger";
    const heavy = HEAVY_CATEGORIES.has(String(entry.category || "").toLowerCase())
      || HEAVY_CATEGORIES.has(String(entry.tier || "").toLowerCase());
    const narrow = narrowText(entry, enemy);
    if (!heavy && ALARM_PATTERN.test(narrow)) return "alarm";
    if (!heavy && SUPPORT_PATTERN.test(narrow)) return "support";
    if (HUNTER_PATTERN.test(narrow)) return "hunter";
    return "melee";
  }

  function behavior(role, mode = "side", elite = false) {
    const table = BEHAVIORS[mode] || BEHAVIORS.side;
    const profile = table[role];
    if (!profile) return null;
    const scale = elite ? 1.15 : 1;
    return {
      ...profile,
      speed: Math.round(profile.speed * scale * 100) / 100,
      damage: profile.damage ? Math.round(profile.damage * (elite ? 1.3 : 1)) : 0,
      postureDamage: profile.postureDamage
        ? Math.round(profile.postureDamage * (elite ? 1.2 : 1))
        : 0,
    };
  }

  function isNewRole(role) {
    return NEW_ROLES.includes(role);
  }

  function isHunter(role) {
    return role === "hunter";
  }

  function leashFor(role, base) {
    if (role === "hunter") return HUNTER_LEASH;
    return base;
  }

  function memoryFor(role, base) {
    if (role === "hunter") return Math.max(base, HUNTER_MEMORY);
    return base;
  }

  function centerX(entity) {
    return Number(entity?.x) + Number(entity?.w || 0) / 2;
  }

  function isAlive(entity) {
    return Boolean(entity) && !entity.dead && !entity.dying;
  }

  function supportTarget(allies, self, radius = SUPPORT_RADIUS) {
    if (!Array.isArray(allies) || !self) return null;
    const origin = centerX(self);
    let best = null;
    let bestRatio = 1;
    for (const ally of allies) {
      if (ally === self || !isAlive(ally)) continue;
      const maxHp = Number(ally.maxHp) || 0;
      if (maxHp <= 0) continue;
      const ratio = Number(ally.hp) / maxHp;
      if (!(ratio < 1)) continue;
      if (Math.abs(centerX(ally) - origin) > radius) continue;
      if (ratio < bestRatio) {
        best = ally;
        bestRatio = ratio;
      }
    }
    return best;
  }

  function alarmTargets(allies, source, radius = ALARM_RADIUS) {
    if (!Array.isArray(allies) || !source) return [];
    const origin = centerX(source);
    return allies.filter((ally) => {
      if (ally === source || !isAlive(ally)) return false;
      if (Math.abs(centerX(ally) - origin) > radius) return false;
      const state = ally.ai?.state;
      return state !== "pursue" && state !== "attack" && state !== "hurt";
    });
  }

  function patternsFor(bossId) {
    return BOSS_PATTERNS[String(bossId || "")] || null;
  }

  function patternFor(bossId, hpRatio = 1) {
    const patterns = patternsFor(bossId);
    if (!patterns) return null;
    const ratio = Number.isFinite(Number(hpRatio)) ? Number(hpRatio) : 1;
    let active = null;
    for (const pattern of patterns) {
      if (ratio <= pattern.threshold) active = pattern;
    }
    return active;
  }

  function applyPattern(profile, pattern) {
    if (!profile || !pattern) return profile;
    const telegraph = Number(pattern.telegraph) || 0;
    const attackDuration = Number(profile.attackDuration) || 0.8;
    return {
      ...profile,
      speed: (Number(profile.speed) || 0) * (pattern.speedMultiplier || 1),
      damage: Math.max(0, Math.round((Number(profile.damage) || 0) * (pattern.damageMultiplier || 1))),
      postureDamage: Math.max(
        0,
        Math.round((Number(profile.postureDamage) || 0) * (pattern.postureMultiplier || 1)),
      ),
      reach: (Number(profile.reach) || 0) * (pattern.reachMultiplier || 1),
      attackKind: pattern.attackKind || profile.attackKind,
      attackDuration: attackDuration + telegraph,
      activeAt: Math.min(0.92, (Number(profile.activeAt) || 0.5) + telegraph * 0.35),
      pattern: pattern.id,
      patternLabel: pattern.label,
      telegraph,
    };
  }

  global.KageEnemyRoles = Object.freeze({
    roles: ROLE_IDS,
    labels: ROLE_LABELS,
    newRoles: NEW_ROLES,
    bossPatterns: BOSS_PATTERNS,
    supportRadius: SUPPORT_RADIUS,
    supportHeal: SUPPORT_HEAL,
    supportPostureRelief: SUPPORT_POSTURE_RELIEF,
    supportCooldown: SUPPORT_COOLDOWN,
    alarmRadius: ALARM_RADIUS,
    classify,
    behavior,
    isNewRole,
    isHunter,
    leashFor,
    memoryFor,
    supportTarget,
    alarmTargets,
    patternsFor,
    patternFor,
    applyPattern,
  });
})(typeof window !== "undefined" ? window : globalThis);
