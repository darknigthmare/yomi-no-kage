/*
 * YOMI NO KAGE — moteur Canvas sans dépendance.
 * Les deux perspectives partagent les mêmes statistiques de mission. La vue
 * latérale gère gravité/plateformes, la vue subjective utilise un raycaster.
 */
(function bootYomiNoKage() {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  // Le gameplay reste en coordonnées logiques 640x360. Le backing store est
  // deux fois plus grand afin que les nouvelles planches d'Akio soient
  // affichées pixel pour pixel, sans réduction suivie d'un agrandissement CSS.
  const W = 640;
  const H = 360;
  const RENDER_SCALE_X = Math.max(1, canvas.width / W);
  const RENDER_SCALE_Y = Math.max(1, canvas.height / H);
  ctx.setTransform(RENDER_SCALE_X, 0, 0, RENDER_SCALE_Y, 0, 0);
  const TAU = Math.PI * 2;
  const FOV = Math.PI / 3;
  const ASSET_VERSION = "20260719-world-expansion-v3";
  const REQUIRED_LEVEL_SCHEMA = 2;
  const REQUIRED_LEVEL_BUILD_ID = "20260719-world-expansion-v3";
  const ALLOW_LEGACY_LAYOUT = typeof location !== "undefined"
    && new URLSearchParams(location.search).get("legacy-layout") === "1";
  const ENVIRONMENT_PREVIEW_INDICES = Object.freeze({
    contemporary: 3,
    cyberpunk: 4,
    forest: 5,
    fields: 6,
  });
  let previewEnvironmentIndex = null;
  const levelContract = typeof window !== "undefined" ? window.KageLevels : null;
  const levelContractValid = Boolean(
    levelContract
    && levelContract.schema === REQUIRED_LEVEL_SCHEMA
    && levelContract.buildId === REQUIRED_LEVEL_BUILD_ID
    && levelContract.areas?.[levelContract.startAreaId],
  );
  if (!levelContractValid && !ALLOW_LEGACY_LAYOUT) {
    document.body.dataset.levelDataError = "incompatible";
    const panel = document.createElement("div");
    panel.id = "level-data-error";
    panel.textContent = "DONNÉES DE NIVEAU INCOMPATIBLES — rechargez Yomi no Kage";
    Object.assign(panel.style, {
      position: "fixed",
      inset: "0",
      zIndex: "99999",
      display: "grid",
      placeItems: "center",
      padding: "24px",
      color: "#f2d6a2",
      background: "#090a0f",
      font: "700 16px monospace",
      textAlign: "center",
    });
    document.body.appendChild(panel);
    throw new Error(
      `KageLevels ${REQUIRED_LEVEL_BUILD_ID} requis; `
      + `reçu ${levelContract?.buildId || "absent"}`,
    );
  }
  document.body.dataset.levelBuildId = levelContract?.buildId || "legacy-explicit";
  const PLAYER_ATTACK_DURATION = 0.34;
  const PLAYER_ATTACK_ACTIVE_AT = 0.38;
  const PLAYER_HURT_DURATION = 0.72;
  const PLAYER_DEATH_DURATION = 0.9;
  const ENEMY_HURT_DURATION = 0.34;
  const ENEMY_DEATH_DURATION = 0.78;
  const PLAYER_COMBO_WINDOW = 0.72;
  const PLAYER_PARRY_WINDOW = 0.18;
  const PLAYER_DODGE_DURATION = 0.32;
  const PLAYER_DODGE_COOLDOWN = 0.72;
  const PLAYER_GUARD_POSTURE_MAX = 100;
  const SIDE_ANIMATION_CACHE_LIMIT = 24;
  const FPS_ANIMATION_CACHE_LIMIT = 18;
  const FPS_WEAPON_ANIMATION_CACHE_LIMIT = 10;
  const ENEMY_HURT_RENDER_SCALE = 0.92;
  const SIDE_ENEMY_BASELINE_OFFSET = 4;
  const SIDE_GROUND_Y = 300;
  const SIDE_GROUND_DEPTH = 60;
  const SIDE_GROUND_VISUAL_OVERLAP = 1;
  const SIDE_WALK_DISTANCE_PER_FRAME = 64 / 6;
  const FPS_TOUCH_LOOK_SENSITIVITY = 0.0045;
  // Les lames sources vont de la tsuka vers la pointe, de gauche à droite.
  // Cette correction les fait monter légèrement vers la droite depuis les
  // mains, au lieu de les faire repartir derrière l'avant-bras gauche.
  const FPS_KATANA_HAND_ALIGNMENT = 1.06;
  const KATANA_IDS = [
    "01-kurokage", "02-shogun-no-in", "03-hinezumi", "04-shirogane", "05-yomibane",
    "06-kegare-kiri", "07-takekaze", "08-raijin-no-tsume", "09-akatsuki", "10-mujo",
  ];
  const ALLEY_WALL_IDS = Object.freeze([
    "mur-platre-intact",
    "mur-platre-fume",
    "mur-platre-lattis",
    "mur-cedre-brule",
    "mur-planches-pluie",
    "mur-kura-bas",
    "mur-kura-haut",
    "mur-porte-service",
    "mur-fenetre-barreaux",
    "mur-volets-pluie",
    "angle-ruelle-rentrant",
    "angle-ruelle-sortant",
    "mur-gouttiere-chaine",
    "mur-auvent-brise",
    "mur-alcove-vide",
    "mur-quarantaine",
    "mur-racines-yomi",
    "mur-breche-effondree",
    "mur-pierre-jokamachi",
    "mur-echoppe-brulee",
  ]);
  // Recadrages de secours calculés sur la composante opaque principale des
  // vingt modules. Ils rendent l'ancrage identique sous file://, où Chrome
  // peut interdire getImageData() sur un bitmap local.
  const ALLEY_WALL_GROUND_BOUNDS = Object.freeze({
    "angle-ruelle-rentrant": [3, 3, 221, 188],
    "angle-ruelle-sortant": [5, 4, 222, 188],
    "mur-alcove-vide": [0, 3, 244, 183],
    "mur-auvent-brise": [3, 3, 256, 189],
    "mur-breche-effondree": [3, 0, 244, 176],
    "mur-cedre-brule": [3, 3, 246, 179],
    "mur-echoppe-brulee": [0, 0, 246, 176],
    "mur-fenetre-barreaux": [3, 3, 247, 179],
    "mur-gouttiere-chaine": [5, 3, 241, 189],
    "mur-kura-bas": [3, 3, 237, 150],
    "mur-kura-haut": [3, 3, 253, 201],
    "mur-pierre-jokamachi": [3, 0, 256, 175],
    "mur-planches-pluie": [0, 3, 244, 179],
    "mur-platre-fume": [3, 3, 250, 179],
    "mur-platre-intact": [3, 3, 226, 180],
    "mur-platre-lattis": [3, 3, 236, 179],
    "mur-porte-service": [3, 3, 238, 180],
    "mur-quarantaine": [3, 0, 226, 176],
    "mur-racines-yomi": [3, 0, 242, 178],
    "mur-volets-pluie": [0, 3, 244, 179],
  });
  const KATANA_NAMES = [
    "KUROKAGE", "SHOGUN NO IN", "HINEZUMI", "SHIROGANE", "YOMIBANE",
    "KEGARE-KIRI", "TAKEKAZE", "RAIJIN NO TSUME", "AKATSUKI", "MUJO",
  ];
  const KATANA_WEAPON_META = [
    { anchor: [0.26, 0.52], sideRotation: -0.58, fpsRotation: -0.86 },
    { anchor: [0.26, 0.52], sideRotation: -0.54, fpsRotation: -0.82 },
    { anchor: [0.26, 0.52], sideRotation: -0.52, fpsRotation: -0.8 },
    { anchor: [0.26, 0.52], sideRotation: -0.56, fpsRotation: -0.84 },
    { anchor: [0.26, 0.52], sideRotation: -0.56, fpsRotation: -0.84 },
    { anchor: [0.26, 0.52], sideRotation: -0.6, fpsRotation: -0.88 },
    { anchor: [0.26, 0.52], sideRotation: -0.55, fpsRotation: -0.83 },
    { anchor: [0.26, 0.52], sideRotation: -0.54, fpsRotation: -0.82 },
    { anchor: [0.26, 0.52], sideRotation: -0.62, fpsRotation: -0.9 },
    { anchor: [0.26, 0.52], sideRotation: -0.55, fpsRotation: -0.83 },
  ];
  const FALLBACK_LOADOUT = Object.freeze({
    primary: KATANA_IDS[0],
    secondary: KATANA_IDS[1],
    ranged: "ofuda-purification",
    armor: "do-maru-voyage",
    charm: "omamori-ombre",
    technique: "iai-kage",
  });
  const PLAYER_WEAPON_RENDER_PROFILES = {
    katana: { sideScale: 1, sideRotation: 0, fpsScale: 1, fpsRotation: 0 },
    blade: { sideScale: 0.96, sideRotation: 0.03, fpsScale: 0.96, fpsRotation: 0.02 },
    shortBlade: { sideScale: 0.76, sideRotation: 0.08, fpsScale: 0.78, fpsRotation: 0.08 },
    polearm: { sideScale: 1.34, sideRotation: -0.14, fpsScale: 1.2, fpsRotation: -0.18 },
    heavy: { sideScale: 1.12, sideRotation: 0.08, fpsScale: 1.08, fpsRotation: 0.1 },
    staff: { sideScale: 1.24, sideRotation: -0.12, fpsScale: 1.12, fpsRotation: -0.12 },
    flexible: { sideScale: 0.94, sideRotation: 0.04, fpsScale: 0.92, fpsRotation: 0.06 },
    bow: { sideScale: 1.18, sideRotation: -0.38, fpsScale: 1.08, fpsRotation: -0.34 },
    firearm: { sideScale: 1.16, sideRotation: -0.26, fpsScale: 1.12, fpsRotation: -0.22 },
    throwing: { sideScale: 0.7, sideRotation: 0.12, fpsScale: 0.74, fpsRotation: 0.12 },
    fan: { sideScale: 0.74, sideRotation: 0.04, fpsScale: 0.78, fpsRotation: 0.05 },
    capture: { sideScale: 1.26, sideRotation: -0.12, fpsScale: 1.12, fpsRotation: -0.12 },
  };
  const PLAYER_WEAPON_POSE_OFFSETS = Object.freeze({
    side: Object.freeze({
      katana: 0,
      blade: 0,
      shortBlade: 0.12,
      polearm: -0.08,
      heavy: 0.08,
      staff: -0.04,
      flexible: 0,
      bow: -0.78,
      firearm: 0.44,
      throwing: 0.38,
      fan: 0.22,
      capture: -0.08,
    }),
    fps: Object.freeze({
      katana: 0,
      blade: 0,
      shortBlade: 0.18,
      polearm: 0.08,
      heavy: 0.3,
      staff: 0.08,
      flexible: 0,
      bow: -0.16,
      firearm: 1.02,
      throwing: 0.88,
      fan: 0.82,
      capture: 0.08,
    }),
  });
  const ENEMY_WEAPON_PRESENTATION = Object.freeze({
    blade: Object.freeze({ anchor: [0.13, 0.84], rotation: 0, scale: 1 }),
    short: Object.freeze({ anchor: [0.16, 0.8], rotation: 0.12, scale: 0.76 }),
    pole: Object.freeze({ anchor: [0.1, 0.88], rotation: -0.08, scale: 1.18 }),
    heavy: Object.freeze({ anchor: [0.12, 0.88], rotation: 0.08, scale: 1.05 }),
    chain: Object.freeze({ anchor: [0.18, 0.72], rotation: 0, scale: 0.94 }),
    guard: Object.freeze({ anchor: [0.5, 0.86], rotation: 0.18, scale: 0.82 }),
    fan: Object.freeze({ anchor: [0.5, 0.9], rotation: 0.2, scale: 0.82 }),
  });
  const ENEMY_FPS_DIRECTIONAL_WEAPON = Object.freeze({
    front: Object.freeze({ x: 0.2, y: 0.08, rotation: 0, scale: 0.84 }),
    back: Object.freeze({ x: 0.16, y: 0.04, rotation: 0.1, scale: 0.82 }),
    left: Object.freeze({ x: 0, y: 0, rotation: 0, scale: 1 }),
    right: Object.freeze({ x: 0, y: 0, rotation: 0, scale: 1 }),
  });
  const MASSIVE_EQUIPMENT_MOUNTS = Object.freeze({
    "joug-tranchant-aka-ushi": Object.freeze({
      // Le joug est une pièce d'armure centrée sur les épaules, pas une arme
      // tenue à la main. Son ancre correspond au creux du collier et il doit
      // donc passer devant le torse dans les deux projections.
      side: Object.freeze({
        // Aka-Ushi regarde à gauche dans le master : son cou se trouve
        // en avant du centre de la masse du corps.
        x: -0.2,
        y: -0.64,
        rotation: 0,
        scale: 1.1,
        anchor: Object.freeze([0.5, 0.52]),
        layer: "front-body",
      }),
      fps: Object.freeze({
        x: 0,
        y: -0.6,
        rotation: 0,
        scale: 0.64,
        anchor: Object.freeze([0.5, 0.52]),
        layer: "front-body",
      }),
    }),
  });

  function fallbackWeaponEntry(id) {
    const katanaIndex = KATANA_IDS.indexOf(String(id));
    if (katanaIndex >= 0) {
      return {
        id: KATANA_IDS[katanaIndex],
        name: KATANA_NAMES[katanaIndex],
        family: "katana",
        animationProfile: "katana",
        sprite: `assets/modular/fps/player/akio/weapons/${KATANA_IDS[katanaIndex]}/weapon.png`,
        stats: {
          power: 58,
          speed: 62,
          reach: 58,
          kiCost: 12,
          posture: 52,
          armorPenetration: 18,
        },
      };
    }
    return null;
  }

  function arsenalWeapons() {
    return Array.isArray(window.KageArsenal?.weapons)
      ? window.KageArsenal.weapons
      : KATANA_IDS.map(fallbackWeaponEntry);
  }

  function arsenalWeaponById(id) {
    if (typeof window.KageArsenal?.weaponById === "function") {
      const result = window.KageArsenal.weaponById(id);
      if (result) return result;
    }
    return arsenalWeapons().find((weapon) => weapon.id === id)
      || fallbackWeaponEntry(id)
      || null;
  }

  function normalizePlayerLoadout(candidate = {}) {
    const defaults = window.KageArsenal?.defaultLoadout
      || window.KageArsenal?.defaults?.loadout
      || FALLBACK_LOADOUT;
    const requested = { ...FALLBACK_LOADOUT, ...defaults, ...(candidate || {}) };
    const meleeFallback = arsenalWeaponById(FALLBACK_LOADOUT.primary)?.id || KATANA_IDS[0];
    const normalizeWeaponSlot = (id, fallback) =>
      arsenalWeaponById(id)?.id || arsenalWeaponById(fallback)?.id || meleeFallback;
    return {
      primary: normalizeWeaponSlot(requested.primary, meleeFallback),
      secondary: normalizeWeaponSlot(requested.secondary, requested.primary),
      ranged: arsenalWeaponById(requested.ranged)?.id || requested.ranged || "ofuda-purification",
      armor: requested.armor || FALLBACK_LOADOUT.armor,
      charm: requested.charm || requested.omamori?.[0] || FALLBACK_LOADOUT.charm,
      omamori: Array.isArray(requested.omamori)
        ? requested.omamori.slice(0, 2)
        : [requested.charm || FALLBACK_LOADOUT.charm],
      technique: requested.technique || FALLBACK_LOADOUT.technique,
      quickItems: Array.isArray(requested.quickItems)
        ? requested.quickItems.slice(0, 2)
        : ["ofuda-purification", "yomogi"],
    };
  }

  function persistedPlayerLoadout() {
    try {
      if (typeof window.KageSave?.getLoadout === "function") {
        return normalizePlayerLoadout(window.KageSave.getLoadout());
      }
      if (typeof window.KageSave?.load === "function") {
        return normalizePlayerLoadout(window.KageSave.load()?.loadout);
      }
    } catch (_) {
      // Une partie locale ou un navigateur privé restent jouables sans save.
    }
    return normalizePlayerLoadout();
  }

  function persistedGameSettings() {
    try {
      const settings = window.KageSave?.load?.()?.settings || {};
      return {
        reducedMotion: Boolean(settings.reducedMotion),
        screenShake: settings.screenShake !== false,
      };
    } catch (_) {
      return { reducedMotion: false, screenShake: true };
    }
  }

  function persistedAmmoMap() {
    try {
      const ammo = window.KageSave?.load?.()?.ammo;
      if (ammo && typeof ammo === "object") return { ...ammo };
    } catch (_) {
      // La réserve locale reste facultative.
    }
    return {
      ofuda: 8,
      kunai: 8,
      shuriken: 16,
      boShuriken: 12,
      makibishi: 5,
      uchine: 5,
      ya: 28,
      tamade: 10,
    };
  }

  function rangedAmmoType(weapon) {
    return String(weapon?.ammoType || "ofuda");
  }

  function rangedAmmoCapacity(weapon) {
    return Math.max(1, Number(weapon?.maxAmmo || 12));
  }

  function persistAmmoMap() {
    try {
      const profile = window.KageSave?.load?.();
      if (!profile || !game?.ammoByType) return;
      profile.ammo = { ...profile.ammo, ...game.ammoByType };
      window.KageSave.save(profile);
    } catch (_) {
      // Une session privée conserve la réserve uniquement en mémoire de jeu.
    }
  }
  const SIDE_ENTRANCES = [
    {
      x: 900,
      approachX: 852,
      interactionRange: 58,
      collision: "passThrough",
      mission: 0,
      label: "SANCTUAIRE CONTAMINÉ",
      prompt: "E — FRANCHIR LE TORII",
    },
    {
      x: 2190,
      approachX: 2138,
      blockX: 2148,
      interactionRange: 66,
      collision: "solidDoor",
      mission: 1,
      label: "DONJON DE KUROKAWA",
      prompt: "E — OUVRIR LA PORTE",
    },
  ];
  const SIDE_PLATFORM_LAYOUTS = [
    [
      { x: 49, y: 254, w: 158, h: 8, visualHeight: 24, visual: false, owner: "minka-chaume-brulee", surface: "toit-maison-brulee" },
      { x: 226, y: 272, w: 58, h: 8, visualHeight: 24, visual: false, owner: "barriere-village", surface: "barriere" },
      { x: 318, y: 238, w: 64, h: 8, visualHeight: 24, visual: false, owner: "tour-guet-ouest", surface: "balcon-tour" },
      { x: 506, y: 258, w: 24, h: 8, visualHeight: 24, visual: false, owner: "tonneau-acces", surface: "tonneau" },
      { x: 541, y: 239, w: 164, h: 8, visualHeight: 24, visual: false, owner: "minka-tuiles-intacte", surface: "auvent-minka" },
      { x: 552, y: 210, w: 142, h: 8, visualHeight: 24, visual: false, owner: "minka-tuiles-intacte", surface: "toit-minka" },
      { x: 1013, y: 270, w: 52, h: 8, visualHeight: 24, visual: false, owner: "charrette-cassee", surface: "charrette" },
      { x: 1068, y: 231, w: 62, h: 8, visualHeight: 24, visual: false, owner: "kura-entrepot-riz", surface: "auvent-grange" },
      { x: 1072, y: 190, w: 126, h: 8, visualHeight: 24, visual: false, owner: "kura-entrepot-riz", surface: "toit-grange" },
      { x: 1385, y: 258, w: 48, h: 8, visualHeight: 24, visual: false, owner: "tas-paille", surface: "paille-basse" },
      { x: 1395, y: 225, w: 28, h: 8, visualHeight: 24, visual: false, owner: "tas-paille", surface: "paille-haute" },
      { x: 1775, y: 258, w: 28, h: 8, visualHeight: 24, visual: false, owner: "tonneau-quartier-brule", surface: "tonneau" },
      { x: 1820, y: 225, w: 150, h: 8, visualHeight: 24, visual: false, owner: "minka-est", surface: "toit-maison-brulee" },
      { x: 2178, y: 264, w: 82, h: 8, visualHeight: 32, tile: "step", surface: "marche-tour" },
      { x: 2258, y: 228, w: 68, h: 8, visualHeight: 24, visual: false, owner: "tour-guet-est", surface: "balcon-tour" },
    ],
    [
      { x: 1000, y: 222, w: 170, h: 8, visualHeight: 24, visual: false, owner: "tour-chateau", surface: "toit-tour-bas" },
      { x: 1015, y: 178, w: 145, h: 8, visualHeight: 24, visual: false, owner: "tour-chateau", surface: "toit-tour-milieu" },
      { x: 1030, y: 135, w: 115, h: 8, visualHeight: 24, visual: false, owner: "tour-chateau", surface: "toit-tour-haut" },
      { x: 1140, y: 286, w: 78, h: 8, visualHeight: 24, visual: false, owner: "escalier-bois", surface: "escalier-1" },
      { x: 1146, y: 270, w: 66, h: 8, visualHeight: 24, visual: false, owner: "escalier-bois", surface: "escalier-2" },
      { x: 1152, y: 254, w: 54, h: 8, visualHeight: 24, visual: false, owner: "escalier-bois", surface: "escalier-3" },
      { x: 1158, y: 238, w: 42, h: 8, visualHeight: 24, visual: false, owner: "escalier-bois", surface: "escalier-4" },
      { x: 1164, y: 222, w: 30, h: 8, visualHeight: 24, visual: false, owner: "escalier-bois", surface: "escalier-5" },
      { x: 1225, y: 264, w: 170, h: 8, visualHeight: 24, visual: false, owner: "mur-shoji", surface: "coursive-shoji" },
      { x: 1460, y: 258, w: 150, h: 8, visualHeight: 24, visual: false, owner: "alcove-tatami", surface: "estrade-tatami" },
      { x: 1715, y: 242, w: 145, h: 8, visualHeight: 30, tile: "roof", surface: "toit-porte-laquee" },
      { x: 1914, y: 234, w: 46, h: 8, visualHeight: 28, tile: "beam", surface: "poutre-cedre" },
      { x: 2048, y: 264, w: 78, h: 8, visualHeight: 24, visual: false, owner: "racines-donjon", surface: "racines" },
      { x: 2130, y: 274, w: 72, h: 8, visualHeight: 30, tile: "short", surface: "marche-porte" },
      { x: 2320, y: 264, w: 90, h: 8, visualHeight: 30, tile: "ledge", surface: "coursive-finale" },
    ],
  ];
  const SIDE_CHAPTER_RULES = [
    {
      minX: 6,
      maxX: 2479,
      cameraMinX: 0,
      enemyXs: [296, 430, 735, 845, 925, 1260, 1500, 1680, 2070, 2430],
      pickups: [
        { x: 600, kind: "ammo" },
        { x: 1280, kind: "health" },
        { x: 1850, kind: "ammo" },
      ],
    },
    {
      minX: 960,
      maxX: 2479,
      cameraMinX: 900,
      enemyXs: [970, 1398, 1695, 1880, 1980, 2220, 2420, 2450],
      pickups: [
        { x: 1240, kind: "ammo" },
        { x: 1570, kind: "health" },
        { x: 2260, kind: "ammo" },
      ],
    },
  ];
  const SIDE_MIDGROUND_SOURCE_Y = [696, 792, 791, null, null, 815, 765];
  const SPIRIT_IMPACT_IDS = new Set([
    "04-onryo-miko",
    "s04-onibi-adept",
    "s11-biwa-revenant",
    "s12-shikigami-scribe",
    "s16-kage-mai-dancer",
    "s18-yomi-herald",
    "s20-mekura-oracle",
    "mb-04-miko-tsukikage",
    "mb-18-onmyoji-renard",
    "boss-09-maitre-noh-utsuro",
    "boss-18-pretresse-cendres-suzaku",
    "giant-10-yomi-no-kanrei",
  ]);
  const ARMOR_IMPACT_IDS = new Set([
    "02-ashigaru-revenant",
    "03-kegare-sohei",
    "05-kabuto-brute",
    "06-daimyo-corrupted",
    "s06-oni-men-executioner",
    "s08-gomon-jailer",
    "s10-hatamoto-fallen",
    "s15-teppo-corpsman",
    "s17-kurohata-bearer",
  ]);
  const FPS_WALL_TILES = [
    [26, 82, 344, 344],
    [406, 82, 344, 344],
    [786, 82, 344, 344],
    [1166, 82, 344, 344],
    [26, 560, 344, 344],
    [406, 560, 344, 344],
    [786, 560, 344, 344],
    [1166, 560, 344, 344],
  ];
  const FPS_MATERIAL_SCHEMES = [
    {
      id: "sanctuaire-pierre-et-bois",
      floorTile: 2,
      floorScale: 1,
      boundaryWall: 2,
      coreWall: 0,
      chamberWall: 1,
      altarWall: 7,
      fog: [17, 13, 17],
    },
    {
      id: "donjon-tatami-et-cedre",
      floorTile: 3,
      floorScale: 1,
      boundaryWall: 4,
      coreWall: 6,
      chamberWall: 5,
      altarWall: 7,
      fog: [12, 10, 14],
    },
  ];
  // Le corps FPS doit rester un repère périphérique, pas masquer l'arène.
  // Un cadrage bas et resserré conserve les mains/arme lisibles tout en
  // libérant le centre de l'écran pour les ennemis, portes et autels.
  const FPS_VIEWMODEL_RECT = { x: 180, y: 170, width: 280, height: 188 };
  const FPS_PLAYER_WEAPON_MOUNTS = {
    idle: [
      [0.4677, 0.4724, -1.78, 1.00, 1], [0.4818, 0.3374, -1.76, 1.00, 1],
      [0.4787, 0.3352, -1.79, 1.00, 1], [0.4720, 0.3660, -1.81, 1.00, 1],
      [0.4759, 0.4031, -1.77, 1.00, 1], [0.4696, 0.3764, -1.80, 1.00, 1],
    ],
    move: [
      [0.4935, 0.2981, -1.82, 1.00, 1], [0.4809, 0.4836, -1.76, 1.00, 1],
      [0.4843, 0.6125, -1.70, 1.00, 1], [0.4848, 0.6061, -1.70, 1.00, 1],
      [0.5002, 0.3143, -1.78, 1.00, 1], [0.4834, 0.5164, -1.82, 1.00, 1],
    ],
    attack: [
      [0.5016, 0.4992, -1.96, 1.00, 1], [0.5396, 0.3282, -1.70, 1.00, 1],
      [0.6141, 0.3062, -1.38, 1.00, 1], [0.2584, 0.3002, -0.95, 1.00, 1],
      [0.2358, 0.5277, -0.43, 1.00, 1], [0.5025, 0.4642, 0.08, 1.00, 1],
    ],
    hurt: [
      [0.5059, 0.4310, -2.04, 1.00, 1], [0.3541, 0.4222, -2.25, 1.00, 0.95],
      [0.4734, 0.3448, -2.48, 1.00, 0.82], [0.4781, 0.3851, -2.24, 1.00, 0.72],
      [0.4680, 0.3759, -2.02, 1.00, 0.88], [0.4752, 0.3825, -1.80, 1.00, 1],
    ],
    death: [
      [0.5002, 0.1861, -1.78, 1.00, 0], [0.4965, 0.2033, -1.28, 1.00, 0],
      [0.5248, 0.3670, -0.82, 1.00, 0], [0.5322, 0.4581, -0.34, 1.00, 0],
      [0.5120, 0.5591, 0.10, 1.00, 0], [0.4830, 0.6300, 0.32, 1.00, 0],
    ],
  };
  const SIDE_PLAYER_WEAPON_MOUNTS = {
    idle: [
      [0, -43, -0.62, 1], [0, -44, -0.62, 1], [1, -45, -0.62, 1],
      [0, -44, -0.62, 1], [0, -43, -0.62, 1], [0, -43, -0.62, 1],
    ],
    move: [
      [10, -42, -0.52, 0.92], [8, -41, -0.46, 0.92], [6, -40, -0.40, 0.92],
      [8, -42, -0.48, 0.92], [11, -43, -0.56, 0.92], [9, -41, -0.48, 0.92],
    ],
    attack: [
      [-13, -43, -1.42, 1.06], [-7, -47, -1.20, 1.08], [7, -48, -0.82, 1.10],
      [17, -45, -0.28, 1.12], [19, -36, 0.18, 1.10], [6, -34, 0.52, 1.04],
    ],
    hurt: [
      [-8, -40, -0.22, 0.92], [-5, -42, -0.10, 0.90], [-2, -39, 0.06, 0.88],
      [1, -37, 0.12, 0.88], [3, -39, -0.08, 0.90], [4, -41, -0.30, 0.94],
    ],
  };
  const WEAPON_MOUNTS = {
    side: {
      idle: { x: -0.18, y: -0.5, scale: 0.6, rotation: -0.38 },
      move: { x: -0.16, y: -0.48, scale: 0.58, rotation: -0.32 },
      attack: { x: -0.1, y: -0.5, scale: 0.66, rotation: -1.08, arc: 1.68 },
      hurt: { x: -0.22, y: -0.43, scale: 0.54, rotation: 0.12 },
    },
    fps: {
      idle: { x: -0.18, y: -0.4, scale: 0.34, rotation: -0.28 },
      move: { x: -0.16, y: -0.39, scale: 0.32, rotation: -0.22 },
      attack: { x: -0.22, y: -0.42, scale: 0.44, rotation: -0.9, arc: 1.55 },
      hurt: { x: -0.08, y: -0.36, scale: 0.3, rotation: 0.16 },
    },
  };
  ctx.imageSmoothingEnabled = false;

  // Les bitmaps OpenAI sont optionnels au chargement : le rendu procédural
  // reste disponible comme solution de secours si un asset n'est pas prêt.
  function loadBitmap(path) {
    if (typeof Image !== "function") return null;
    const image = new Image();
    image.decoding = "async";
    image.src = path.includes("?") ? `${path}&v=${ASSET_VERSION}` : `${path}?v=${ASSET_VERSION}`;
    return image;
  }

  function bitmapReady(image) {
    return Boolean(image && image.complete && image.naturalWidth > 0);
  }

  const playerWeaponBitmapCache = new Map();
  const playerComponentBitmapCache = new Map();

  function weaponFamilyKey(weapon = {}) {
    // La catégorie et la famille sont plus précises que le profil générique
    // d'animation (`blade`, par exemple). Ce dernier reste un repli legacy.
    const raw = [
      weapon.category,
      weapon.family,
      weapon.moveset,
      weapon.animationProfile,
      "blade",
    ].filter(Boolean).join(" ").toLowerCase();
    if (/katana|sword-two|sword-one/.test(raw)) return "katana";
    if (/short|tanto|wakizashi|jitte|hachiwari/.test(raw)) return "shortBlade";
    if (/pole|yari|naginata|nagamaki/.test(raw)) return "polearm";
    if (/heavy|kanabo|tetsubo|hammer|axe|otsuchi|masakari|ono/.test(raw)) return "heavy";
    if (/staff|bo\b|jo\b|shakujo/.test(raw)) return "staff";
    if (/flex|chain|kusari|nunchaku|kyoketsu|chigiriki|manriki/.test(raw)) return "flexible";
    if (/bow|yumi/.test(raw)) return "bow";
    if (/firearm|tanegashima|teppo|bajo|ozutsu/.test(raw)) return "firearm";
    if (/throw|shuriken|kunai|makibishi|uchine/.test(raw)) return "throwing";
    if (/fan|tessen/.test(raw)) return "fan";
    if (/capture|sasumata|sodegarami|tsukubo/.test(raw)) return "capture";
    return "blade";
  }

  function weaponRenderProfile(weapon) {
    return PLAYER_WEAPON_RENDER_PROFILES[weaponFamilyKey(weapon)]
      || PLAYER_WEAPON_RENDER_PROFILES.blade;
  }

  function weaponSpritePath(weapon, view = "side") {
    if (!weapon) return null;
    const declared = weapon.sprites?.[view]
      || weapon.views?.[view]?.sprite
      || weapon.views?.[view]?.file;
    if (declared) return declared;
    if (view === "fps" && weapon.fpsSprite) return weapon.fpsSprite;
    return weapon.sprite || weapon.file || null;
  }

  function playerWeaponBitmap(weapon, view = "side") {
    const path = weaponSpritePath(weapon, view) || weaponSpritePath(weapon, "side");
    if (!path) return null;
    const key = `${view}:${path}`;
    if (!playerWeaponBitmapCache.has(key)) {
      playerWeaponBitmapCache.set(key, loadBitmap(path));
    }
    return playerWeaponBitmapCache.get(key);
  }

  function componentEntriesForWeapon(weapon, view = "side") {
    const declared = weapon?.views?.[view]?.components
      || weapon?.components?.[view]
      || weapon?.components
      || [];
    if (Array.isArray(declared)) {
      return declared.map((component, index) =>
        typeof component === "string"
          ? { role: `component-${index}`, file: component }
          : { role: component.role || component.id || `component-${index}`, ...component });
    }
    if (declared && typeof declared === "object") {
      return Object.entries(declared)
        .filter(([role]) => role !== "root")
        .map(([role, component]) =>
          typeof component === "string"
            ? { role, file: component }
            : { role, ...component });
    }
    return [];
  }

  function playerComponentBitmap(component) {
    const path = component?.file || component?.sprite;
    if (!path) return null;
    if (!playerComponentBitmapCache.has(path)) {
      playerComponentBitmapCache.set(path, loadBitmap(path));
    }
    return playerComponentBitmapCache.get(path);
  }

  function currentPlayerWeapon() {
    const id = game?.activeWeaponId
      || game?.loadout?.[game?.activeWeaponSlot || "primary"]
      || KATANA_IDS[0];
    return arsenalWeaponById(id) || fallbackWeaponEntry(KATANA_IDS[0]);
  }

  function currentRangedWeapon() {
    return arsenalWeaponById(game?.loadout?.ranged) || null;
  }

  function normalizedWeaponStats(weapon) {
    const stats = weapon?.stats || {};
    const number = (key, fallback) => {
      const value = Number(stats[key]);
      return Number.isFinite(value) ? value : fallback;
    };
    return {
      power: clamp(number("power", number("damage", 58)), 0, 100),
      speed: clamp(number("speed", 62), 0, 100),
      reach: clamp(number("reach", 58), 0, 100),
      kiCost: clamp(number("kiCost", number("stamina", 12)), 0, 100),
      posture: clamp(number("posture", 52), 0, 100),
      armorPenetration: clamp(
        number("armorPenetration", number("armor", 18)),
        0,
        100,
      ),
      control: clamp(number("control", 50), 0, 100),
      flesh: clamp(number("flesh", 1), 0.25, 2.5),
      armor: clamp(number("armor", 1), 0.25, 2.5),
      spirit: clamp(number("spirit", 1), 0.25, 2.5),
      boss: clamp(number("boss", 1), 0.25, 2.5),
    };
  }

  function playerAttackSpec(weapon = currentPlayerWeapon(), options = {}) {
    const stats = normalizedWeaponStats(weapon);
    const family = weaponFamilyKey(weapon);
    const attackKind = options.kind === "heavy" ? "heavy" : "light";
    const comboStep = clamp(Math.round(options.comboStep || 1), 1, 3);
    const passiveEffect = String(weapon?.passive?.effect || "");
    const passiveTrigger = String(weapon?.passive?.trigger || "");
    let duration = clamp(0.54 - stats.speed * 0.0032, 0.22, 0.52);
    let damage = clamp(Math.round(1 + stats.power / 42), 1, 4);
    let staminaCost = Math.max(4, stats.kiCost * 0.72);
    let sideReach = 30 + stats.reach * 0.38;
    let fpsReach = 1.02 + stats.reach * 0.012;
    let postureDamage = 12 + stats.posture * 0.34;
    let targets = ["polearm", "flexible", "staff", "capture"].includes(family)
      ? 3
      : (family === "shortBlade" ? 1 : 2);

    if (attackKind === "heavy") {
      duration *= 1.58;
      damage = Math.max(2, Math.round(damage * 1.75));
      staminaCost *= 1.55;
      postureDamage *= 2.25;
      sideReach *= 1.12;
      fpsReach *= 1.1;
      targets = Math.max(1, targets - 1);
    } else {
      const comboDamage = [1, 1.16, 1.42][comboStep - 1];
      damage = Math.max(1, Math.round(damage * comboDamage));
      postureDamage *= [1, 1.12, 1.38][comboStep - 1];
      duration *= [1, 0.94, 1.12][comboStep - 1];
      if (game?.loadout?.technique === "iai-kage" && comboStep === 3) {
        damage += 1;
        postureDamage *= 1.2;
      }
    }

    if (passiveEffect === "attackSpeed" || passiveEffect === "indoorAttackSpeed") duration *= 0.88;
    if (passiveEffect === "reach") {
      sideReach *= 1.14;
      fpsReach *= 1.14;
    }
    if (passiveEffect === "extraTarget") targets += 1;
    if (passiveEffect === "lightAttackKiCost" && attackKind === "light") staminaCost *= 0.78;
    if (passiveEffect === "postureDamage" || passiveTrigger === "onHeavyHit") postureDamage *= 1.25;
    if (passiveEffect === "highHealthDamage" && game?.health >= 80) damage += 1;

    return {
      weapon,
      stats,
      family,
      attackKind,
      comboStep,
      duration,
      cooldown: duration + clamp(0.25 - stats.speed * 0.0014, 0.1, 0.24),
      damage,
      sideReach,
      fpsReach,
      targets,
      staminaCost: Math.max(3, staminaCost),
      postureDamage,
      armorBonus: stats.armorPenetration >= 62 ? 1 : 0,
      armorIgnore: passiveEffect === "armorIgnore",
    };
  }

  const MODULAR_ANIMATIONS = ["idle", "move", "attack", "hurt", "death"];

  function loadAnimationSet(basePath) {
    return Object.fromEntries(
      MODULAR_ANIMATIONS.map((animation) => [
        animation,
        loadBitmap(`${basePath}/sheets/${animation}.png`),
      ]),
    );
  }

  function loadParallaxSet(basePath) {
    return {
      sky: loadBitmap(`${basePath}/layers/sky.png`),
      far: loadBitmap(`${basePath}/layers/far.png`),
      mid: loadBitmap(`${basePath}/layers/mid.png`),
      near: loadBitmap(`${basePath}/layers/near.png`),
    };
  }

  function loadPropSet(basePath, definitions) {
    return definitions.map((definition) => ({
      ...definition,
      image: loadBitmap(`${basePath}/props/${definition.file}.png`),
    }));
  }

  const bitmapAssets = {
    akioModular: loadAnimationSet("assets/modular/characters/player/akio"),
    // Les cinq planches FPS 5760x640 sont volontairement differees jusqu'a
    // la premiere entree en vue subjective afin d'epargner la memoire mobile.
    akioFpsBody: null,
    // Les mêmes lames détourées servent aux deux perspectives. Les anciennes
    // sources générées contenaient encore, pour sept sabres, un morceau de
    // fourreau dans le crop 2D.
    weapons: KATANA_IDS.map((id) =>
      loadBitmap(`assets/modular/fps/player/akio/weapons/${id}/weapon.png`)),
    fpsPlayerWeapons: [],
    sideBackgrounds: [
      loadBitmap("assets/generated/environments/01-kurokawa-burning-village.png"),
      loadBitmap("assets/generated/environments/02-bamboo-shrine.png"),
      // L'ancien panorama frontal FPS ne doit ni charger ni apparaître dans
      // les pièces latérales du château.
      null,
      null,
      null,
      null,
      null,
    ],
    parallaxBackgrounds: [
      loadParallaxSet("assets/modular/environments/kurokawa"),
      loadParallaxSet("assets/modular/environments/bamboo-shrine"),
      loadParallaxSet("assets/modular/environments/daimyo-castle"),
      loadParallaxSet("assets/modular/environments/contemporary-japan"),
      loadParallaxSet("assets/modular/environments/cyberpunk-japan"),
      loadParallaxSet("assets/modular/environments/kai-forest"),
      loadParallaxSet("assets/modular/environments/tsuru-fields"),
    ],
    platformTiles: [
      {
        ground: loadBitmap("assets/modular/environments/kurokawa/platforms/sol-terre-centre.png"),
        ledge: loadBitmap("assets/modular/environments/kurokawa/platforms/plateforme-bois-longue.png"),
        short: loadBitmap("assets/modular/environments/kurokawa/platforms/plateforme-bois-courte.png"),
        step: loadBitmap("assets/modular/environments/kurokawa/platforms/marche-bois.png"),
        thatch: loadBitmap("assets/modular/environments/kurokawa/platforms/plateforme-chaume.png"),
        roof: loadBitmap("assets/modular/environments/kurokawa/platforms/plateforme-toit-tuile.png"),
      },
      {
        ground: loadBitmap("assets/modular/environments/bamboo-shrine/platforms/sol-pierre-centre.png"),
        ledge: loadBitmap("assets/modular/environments/bamboo-shrine/platforms/plateforme-bambou-longue.png"),
      },
      {
        ground: loadBitmap("assets/modular/environments/daimyo-castle/platforms/sol-tatami-centre.png"),
        ledge: loadBitmap("assets/modular/environments/daimyo-castle/platforms/plateforme-cedre-longue.png"),
        short: loadBitmap("assets/modular/environments/daimyo-castle/platforms/plateforme-cedre-courte.png"),
        step: loadBitmap("assets/modular/environments/daimyo-castle/platforms/marche-chateau.png"),
        beam: loadBitmap("assets/modular/environments/daimyo-castle/platforms/plateforme-poutre.png"),
        roof: loadBitmap("assets/modular/environments/daimyo-castle/platforms/plateforme-toit-tuile.png"),
      },
      {
        ground: loadBitmap("assets/modular/environments/contemporary-japan/platforms/asphalt-center.png"),
        ledge: loadBitmap("assets/modular/environments/contemporary-japan/platforms/concrete-curb-long.png"),
        short: loadBitmap("assets/modular/environments/contemporary-japan/platforms/concrete-curb-short.png"),
        step: loadBitmap("assets/modular/environments/contemporary-japan/platforms/concrete-step.png"),
        beam: loadBitmap("assets/modular/environments/contemporary-japan/platforms/footbridge-platform.png"),
        roof: loadBitmap("assets/modular/environments/contemporary-japan/platforms/station-canopy.png"),
        scaffold: loadBitmap("assets/modular/environments/contemporary-japan/platforms/scaffold-platform.png"),
        ramp: loadBitmap("assets/modular/environments/contemporary-japan/platforms/rubble-ramp.png"),
        hazard: loadBitmap("assets/modular/environments/contemporary-japan/platforms/drainage-hazard.png"),
      },
      {
        ground: loadBitmap("assets/modular/environments/cyberpunk-japan/platforms/tech-street-center.png"),
        ledge: loadBitmap("assets/modular/environments/cyberpunk-japan/platforms/service-platform-long.png"),
        short: loadBitmap("assets/modular/environments/cyberpunk-japan/platforms/service-platform-short.png"),
        step: loadBitmap("assets/modular/environments/cyberpunk-japan/platforms/illuminated-step.png"),
        beam: loadBitmap("assets/modular/environments/cyberpunk-japan/platforms/transit-platform.png"),
        roof: loadBitmap("assets/modular/environments/cyberpunk-japan/platforms/shrine-tech-roof.png"),
        scaffold: loadBitmap("assets/modular/environments/cyberpunk-japan/platforms/coolant-catwalk.png"),
        ramp: loadBitmap("assets/modular/environments/cyberpunk-japan/platforms/debris-ramp.png"),
        hazard: loadBitmap("assets/modular/environments/cyberpunk-japan/platforms/energy-trench.png"),
      },
      {
        ground: loadBitmap("assets/modular/environments/kai-forest/platforms/forest-earth-center.png"),
        ledge: loadBitmap("assets/modular/environments/kai-forest/platforms/long-fallen-log.png"),
        short: loadBitmap("assets/modular/environments/kai-forest/platforms/short-fallen-log.png"),
        step: loadBitmap("assets/modular/environments/kai-forest/platforms/moss-stone-steps.png"),
        beam: loadBitmap("assets/modular/environments/kai-forest/platforms/thick-root-platform.png"),
        roof: loadBitmap("assets/modular/environments/kai-forest/platforms/moss-stone-platform.png"),
        scaffold: loadBitmap("assets/modular/environments/kai-forest/platforms/stream-stone-ledge.png"),
        ramp: loadBitmap("assets/modular/environments/kai-forest/platforms/root-earth-slope.png"),
        hazard: loadBitmap("assets/modular/environments/kai-forest/platforms/fungus-pit.png"),
      },
      {
        ground: loadBitmap("assets/modular/environments/tsuru-fields/platforms/paddy-dike-center.png"),
        ledge: loadBitmap("assets/modular/environments/tsuru-fields/platforms/long-plank.png"),
        short: loadBitmap("assets/modular/environments/tsuru-fields/platforms/short-plank.png"),
        step: loadBitmap("assets/modular/environments/tsuru-fields/platforms/irrigation-stone-steps.png"),
        beam: loadBitmap("assets/modular/environments/tsuru-fields/platforms/straw-bale-platform.png"),
        roof: loadBitmap("assets/modular/environments/tsuru-fields/platforms/field-hut-roof.png"),
        scaffold: loadBitmap("assets/modular/environments/tsuru-fields/platforms/drainage-stone-ledge.png"),
        ramp: loadBitmap("assets/modular/environments/tsuru-fields/platforms/muddy-dike-slope.png"),
        hazard: loadBitmap("assets/modular/environments/tsuru-fields/platforms/flooded-plague-ditch.png"),
      },
    ],
    groundVisuals: {
      "castle-stone": loadBitmap(
        "assets/modular/environments/daimyo-castle/platforms/bord-pierre.png",
      ),
      "tatami-clean": loadBitmap(
        "assets/modular/environments/daimyo-castle/platforms/sol-tatami-centre.png",
      ),
      "tatami-tainted": loadBitmap(
        "assets/modular/environments/daimyo-castle/platforms/sol-tatami-souille.png",
      ),
    },
    sideEntrances: [
      loadBitmap("assets/modular/environments/bamboo-shrine/props/grand-torii.png"),
      loadBitmap("assets/modular/environments/daimyo-castle/props/porte-chateau.png"),
    ],
    depthPortals: {
      "passage-ruelle": loadBitmap("assets/modular/environments/depth-portals/sprites/ruelle-laterale.png"),
      "porte-minka": loadBitmap("assets/modular/environments/depth-portals/sprites/porte-minka.png"),
      "entree-machiya-noren": loadBitmap("assets/modular/environments/depth-portals/sprites/entree-machiya-noren.png"),
      "porte-kura": loadBitmap("assets/modular/environments/depth-portals/sprites/porte-kura.png"),
      "porte-palissade": loadBitmap("assets/modular/environments/depth-portals/sprites/breche-palissade.png"),
      "escalier-etage": loadBitmap("assets/modular/environments/depth-portals/sprites/escalier-etage.png"),
      "trappe-cave": loadBitmap("assets/modular/environments/depth-portals/sprites/trappe-cave.png"),
      "porte-laquee": loadBitmap("assets/modular/environments/daimyo-castle/props/porte-laquee.png"),
      "porte-chateau": loadBitmap("assets/modular/environments/daimyo-castle/props/porte-chateau.png"),
      "porte-sanctuaire": loadBitmap("assets/modular/environments/depth-portals/sprites/porte-cour-interieure.png"),
      "route-torii": loadBitmap("assets/modular/environments/bamboo-shrine/props/grand-torii.png"),
      "route-rizieres": loadBitmap("assets/modular/environments/tsuru-fields/props/yomi-warp-torii.png"),
      "faille-moderne": loadBitmap("assets/modular/environments/contemporary-japan/props/yomi-warp-arch.png"),
      "faille-cyber": loadBitmap("assets/modular/environments/cyberpunk-japan/props/temporal-torii.png"),
    },
    alleyWalls: Object.fromEntries(
      ALLEY_WALL_IDS.map((id) => [
        id,
        loadBitmap(`assets/modular/environments/kurokawa/alley-walls/sprites/${id}.png`),
      ]),
    ),
    fpsWallAtlas: loadBitmap("assets/generated/props/fps-wall-texture-atlas.png"),
    fpsAltars: [
      loadBitmap("assets/modular/environments/bamboo-shrine/props/autel-purification.png"),
      loadBitmap("assets/modular/environments/daimyo-castle/props/racines-donjon.png"),
    ],
    worldProps: [
      loadPropSet("assets/modular/environments/kurokawa", [
        { file: "minka-chaume-brulee", x: 42, width: 175 },
        { file: "barriere-village", x: 220, width: 68, layer: "world" },
        { file: "tour-guet-kurokawa", x: 305, width: 82 },
        { file: "tonneau-provisions", x: 500, width: 36, layer: "world" },
        { file: "minka-tuiles-intacte", x: 535, width: 175 },
        { file: "foyer-incendie", x: 760, width: 54, bottomY: 294 },
        { file: "charrette-cassee", x: 990, width: 78, layer: "world" },
        { file: "kura-entrepot-riz", x: 1060, width: 150 },
        { file: "tas-paille", x: 1374, width: 70, layer: "world" },
        { file: "puits-pierre", x: 1570, width: 48, bottomY: 294 },
        { file: "tonneau-provisions", x: 1770, width: 36, layer: "world" },
        { file: "minka-chaume-brulee", x: 1810, width: 175 },
        { file: "autel-route", x: 2040, width: 48, bottomY: 294 },
        { file: "tour-guet-kurokawa", x: 2250, width: 82 },
        {
          file: "tour-guet-kurokawa-3q-arriere-plan",
          x: 2380,
          width: 74,
          layer: "back",
          bottomY: 290,
        },
        {
          file: "foyer-incendie-3q-arriere-plan",
          x: 2160,
          width: 48,
          layer: "back",
          bottomY: 290,
        },
      ]),
      loadPropSet("assets/modular/environments/bamboo-shrine", [
        { file: "bambous-hauts", x: 75, width: 80 },
        { file: "sanctuaire-rural", x: 425, width: 190 },
        { file: "grand-torii", x: 840, width: 150 },
        { file: "petit-torii", x: 1085, width: 86 },
        { file: "pont-bois", x: 1210, width: 175, layer: "front" },
        { file: "bassin-purification", x: 1485, width: 65, layer: "front" },
        { file: "lanterne-pierre", x: 1660, width: 36, layer: "front" },
        { file: "barriere-rituelle", x: 1740, width: 96, layer: "front" },
        { file: "bambous-coupes", x: 1870, width: 92, layer: "front" },
        { file: "autel-purification", x: 2050, width: 78, layer: "front" },
      ]),
      loadPropSet("assets/modular/environments/daimyo-castle", [
        { file: "tour-chateau", x: 990, width: 180 },
        { file: "escalier-bois", x: 1140, width: 80, layer: "world" },
        { file: "mur-shoji", x: 1215, width: 190 },
        { file: "alcove-tatami", x: 1450, width: 175 },
        { file: "porte-laquee", x: 1705, width: 170 },
        { file: "pilier-cedre", x: 1910, width: 48 },
        { file: "brasero-fer", x: 1270, width: 32, bottomY: 294 },
        { file: "armure-vide", x: 1515, width: 38, layer: "world" },
        { file: "paravent-dechire", x: 1612, width: 80, layer: "front", bottomY: 304 },
        { file: "ratelier-vide", x: 1960, width: 78, layer: "world" },
        { file: "racines-donjon", x: 2045, width: 80, layer: "world" },
      ]),
      loadPropSet("assets/modular/environments/contemporary-japan", [
        { file: "metro-entrance", x: 72, width: 148, layer: "back" },
        { file: "koban", x: 340, width: 128, layer: "back" },
        { file: "vending-machine", x: 565, width: 50, layer: "world" },
        { file: "utility-pole", x: 720, width: 44, layer: "back" },
        { file: "quarantine-barrier", x: 865, width: 104, layer: "world" },
        { file: "city-bicycle", x: 1065, width: 82, layer: "world" },
        { file: "emergency-car", x: 1240, width: 136, layer: "world" },
        { file: "neighborhood-shrine", x: 1495, width: 122, layer: "back" },
        { file: "construction-scaffold", x: 1735, width: 148, layer: "back" },
        { file: "emergency-generator", x: 1970, width: 92, layer: "world" },
        { file: "rainwater-pump", x: 2160, width: 74, layer: "world" },
        { file: "yomi-warp-arch", x: 2325, width: 132, layer: "back" },
      ]),
      loadPropSet("assets/modular/environments/cyberpunk-japan", [
        { file: "temporal-torii", x: 60, width: 142, layer: "back" },
        { file: "shrine-tech-altar", x: 340, width: 104, layer: "world" },
        { file: "ventilation-tower", x: 565, width: 72, layer: "back" },
        { file: "energy-barrier-post", x: 760, width: 38, layer: "world" },
        { file: "maglev-maintenance-car", x: 925, width: 184, layer: "back" },
        { file: "drone-charging-dock", x: 1215, width: 92, layer: "world" },
        { file: "sealed-cargo-crate", x: 1395, width: 62, layer: "world" },
        { file: "vending-terminal", x: 1515, width: 54, layer: "world" },
        { file: "coolant-pipe", x: 1665, width: 112, layer: "back" },
        { file: "cyber-shrine-lantern", x: 1890, width: 42, layer: "world" },
        { file: "transit-access-gate", x: 2050, width: 124, layer: "back" },
        { file: "damaged-power-relay", x: 2305, width: 76, layer: "world" },
      ]),
      loadPropSet("assets/modular/environments/kai-forest", [
        { file: "ancient-cedar-trunk", x: 42, width: 154, layer: "back" },
        { file: "hollow-fallen-log", x: 285, width: 126, layer: "world" },
        { file: "charcoal-burner-shelter", x: 500, width: 152, layer: "back" },
        { file: "moss-stone-lantern", x: 755, width: 42, layer: "world" },
        { file: "woodcutter-cart", x: 905, width: 118, layer: "world" },
        { file: "stacked-logs", x: 1115, width: 105, layer: "world" },
        { file: "rope-ward-gate", x: 1315, width: 126, layer: "back" },
        { file: "forest-spring-basin", x: 1535, width: 108, layer: "world" },
        { file: "collapsed-quarantine-tent", x: 1745, width: 122, layer: "back" },
        { file: "infected-root-cluster", x: 1945, width: 96, layer: "front" },
        { file: "campfire-ring", x: 2140, width: 78, layer: "world" },
        { file: "yomi-cave-arch", x: 2320, width: 142, layer: "back" },
      ]),
      loadPropSet("assets/modular/environments/tsuru-fields", [
        { file: "field-hut", x: 48, width: 142, layer: "back" },
        { file: "irrigation-water-wheel", x: 295, width: 128, layer: "back" },
        { file: "farm-cart", x: 520, width: 132, layer: "world" },
        { file: "bound-rice-sheaf", x: 755, width: 58, layer: "world" },
        { file: "irrigation-sluice", x: 910, width: 112, layer: "back" },
        { file: "field-footbridge", x: 1125, width: 142, layer: "world" },
        { file: "scarecrow", x: 1370, width: 60, layer: "world" },
        { file: "wooden-granary", x: 1530, width: 132, layer: "back" },
        { file: "straw-bales", x: 1760, width: 102, layer: "world" },
        { file: "field-marker", x: 1940, width: 62, layer: "world" },
        { file: "burning-crop-pile", x: 2090, width: 104, layer: "front" },
        { file: "yomi-warp-torii", x: 2315, width: 132, layer: "back" },
      ]),
    ],
    enemies: [
      loadBitmap("assets/generated/enemies/01-shibito-villager.png"),
      loadBitmap("assets/generated/enemies/02-ashigaru-revenant.png"),
      loadBitmap("assets/generated/enemies/03-kegare-sohei.png"),
      loadBitmap("assets/generated/enemies/04-onryo-miko.png"),
      loadBitmap("assets/generated/enemies/05-kabuto-brute.png"),
      loadBitmap("assets/generated/enemies/06-daimyo-corrupted.png"),
    ],
    modularEnemies: [
      loadAnimationSet("assets/modular/characters/legacy/01-shibito-villager"),
      loadAnimationSet("assets/modular/characters/legacy/02-ashigaru-revenant"),
      loadAnimationSet("assets/modular/characters/legacy/03-kegare-sohei"),
      loadAnimationSet("assets/modular/characters/legacy/04-onryo-miko"),
      loadAnimationSet("assets/modular/characters/legacy/05-kabuto-brute"),
      loadAnimationSet("assets/modular/characters/legacy/06-daimyo-corrupted"),
    ],
  };

  function ensureFpsPlayerAssets() {
    if (!bitmapAssets.akioFpsBody) {
      bitmapAssets.akioFpsBody = loadAnimationSet("assets/modular/fps/player/akio/body");
    }
    if (!bitmapAssets.fpsPlayerWeapons.length) {
      bitmapAssets.fpsPlayerWeapons = KATANA_IDS.map((id) =>
        loadBitmap(`assets/modular/fps/player/akio/weapons/${id}/weapon.png`));
    }
    return bitmapAssets.akioFpsBody;
  }

  // Le registre complet reste charge a la demande : seuls les adversaires
  // visibles instancient leurs cinq planches, ce qui evite de charger les
  // centaines de PNG du bestiaire en une seule fois.
  const modularRoster = {
    ready: false,
    characters: [],
    weapons: [],
    environments: [],
    animationSets: new Map(),
    fpsAnimationSets: new Map(),
    weaponBitmaps: new Map(),
    fpsWeaponAnimationSets: new Map(),
  };

  function cacheAnimationSet(cache, cacheId, factory, limit) {
    if (cache.has(cacheId)) {
      const cached = cache.get(cacheId);
      cache.delete(cacheId);
      cache.set(cacheId, cached);
      return cached;
    }
    const created = factory();
    cache.set(cacheId, created);
    while (cache.size > limit) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    return created;
  }

  function getRosterCategory(category) {
    return modularRoster.characters.filter((entry) => entry.category === category);
  }

  function animationSetForRosterEntry(entry) {
    if (!entry) return null;
    return cacheAnimationSet(
      modularRoster.animationSets,
      entry.id,
      () => loadAnimationSet(`assets/modular/characters/${entry.category}/${entry.id}`),
      SIDE_ANIMATION_CACHE_LIMIT,
    );
  }

  function animationSetFromPaths(paths, cache, cacheId, limit = FPS_ANIMATION_CACHE_LIMIT) {
    if (!paths || !cacheId) return null;
    return cacheAnimationSet(
      cache,
      cacheId,
      () => Object.fromEntries(
          MODULAR_ANIMATIONS.map((animation) => [
            animation,
            paths[animation] ? loadBitmap(paths[animation]) : null,
          ]),
        ),
      limit,
    );
  }

  function fpsAnimationSetForRosterEntry(entry) {
    if (!entry) return null;
    return animationSetFromPaths(entry.fpsAnimations, modularRoster.fpsAnimationSets, entry.id);
  }

  function fpsWeaponSetForWeapon(weapon) {
    if (!weapon) return null;
    return animationSetFromPaths(
      weapon.fpsAnimations,
      modularRoster.fpsWeaponAnimationSets,
      weapon.id,
      FPS_WEAPON_ANIMATION_CACHE_LIMIT,
    );
  }

  function weaponBitmapForEnemy(enemy) {
    if (!enemy?.weaponFile) return null;
    if (!modularRoster.weaponBitmaps.has(enemy.weaponFile)) {
      modularRoster.weaponBitmaps.set(enemy.weaponFile, loadBitmap(enemy.weaponFile));
    }
    return modularRoster.weaponBitmaps.get(enemy.weaponFile);
  }

  function weaponEntryForCurrentKatana() {
    const selectedId = game.activeWeaponId || KATANA_IDS[game.weaponIndex];
    return modularRoster.weapons.find((weapon) => weapon.id === selectedId) || null;
  }

  function buildRegistryWorldProps(environments) {
    // Le registre décrit les assets disponibles, pas leur mise en scène.
    // L'ancien code prenait les douze premiers fichiers alphabétiques et
    // appliquait les mêmes tailles à une maison, un puits et un autel. Les
    // layouts ci-dessus restent donc la source de vérité spatiale.
    document.body.dataset.rosterProps = String(
      environments.filter((entry) => entry.type === "prop").length,
    );
  }

  function impactMaterialForEntry(entry, enemy = null) {
    const id = String(entry?.id || "");
    if (SPIRIT_IMPACT_IDS.has(id)) return "spirit";
    if (
      ARMOR_IMPACT_IDS.has(id)
      || entry?.category === "miniboss"
      || entry?.category === "boss"
      || entry?.category === "giant"
      || enemy?.boss
    ) return "armor";
    return "flesh";
  }

  function enemyBehaviorFamily(enemy, entry = enemy?.modularEntry) {
    if (isMassiveEnemy(enemy)) return "charger";
    const text = [
      entry?.id,
      entry?.name,
      entry?.subtitle,
      entry?.gameplay,
      entry?.weaponId,
      enemy?.weaponAsset?.id,
    ].filter(Boolean).join(" ").toLowerCase();
    if (/teppo|tanegashima|arqueb|archer|yumi|arc\b|tireur|projectile|shuriken|kunai/.test(text)) {
      return "ranged";
    }
    if (/onibi|onryo|oracle|shikigami|miko|yomi|esprit|spirit|spectr|biwa/.test(text)) {
      return "spirit";
    }
    if (/bouclier|pavois|shield|gardien|kabuto|carapace|jailer|geoli/.test(text)) {
      return "shield";
    }
    if (/charge|runner|sumotori|oni|taureau|ushi|brute|cavalier/.test(text)) {
      return "charger";
    }
    return "melee";
  }

  function massiveBossProfileFor(entry) {
    const profiles = window.KageMassiveBossProfiles || {};
    const declared = profiles[entry?.id];
    if (declared) {
      return {
        ...declared,
        renderProfile: declared.renderProfile || declared.render,
      };
    }
    return entry?.category === "giant"
        ? {
            presentationClass: "massive",
            displayLabel: "Boss massif",
            renderProfile: {
              targetWidthRatio: 0.48,
              targetHeightRatio: 0.52,
              maxHeightRatio: 0.62,
              maxWidthRatio: 0.56,
            },
            phases: [
              { id: "assaut", threshold: 1 },
              { id: "furie", threshold: 0.5 },
            ],
          }
        : null;
  }

  function isMassiveEnemy(enemy) {
    return Boolean(
      enemy?.presentationClass === "massive"
      || enemy?.massiveProfile?.presentationClass === "massive"
      || enemy?.modularEntry?.presentationClass === "massive"
      || enemy?.modularEntry?.category === "giant",
    );
  }

  function equipRosterEntry(enemy, entry, weaponIndex) {
    if (!entry) return;
    enemy.modularEntry = entry;
    enemy.impactMaterial = impactMaterialForEntry(entry, enemy);
    const massiveProfile = massiveBossProfileFor(entry);
    const detachablePart = massiveProfile?.detachableParts
      ?.find((part) => part.separateSprite);
    if (massiveProfile) {
      enemy.presentationClass = "massive";
      enemy.massiveProfile = massiveProfile;
      if (!Number.isFinite(enemy.massivePhase)) enemy.massivePhase = 1;
      const initialPhaseId = massiveProfile.phases?.[0]?.id;
      enemy.detachablePartAttached = !detachablePart?.attachPhase
        || detachablePart.attachPhase === initialPhaseId;
    }
    const modularWeapons = modularRoster.weapons.filter((weapon) =>
      String(weapon.file || "").startsWith("assets/modular/weapons/"),
    );
    const detachableWeaponId = detachablePart?.weaponId;
    const requestedWeapon = modularWeapons.find((weapon) =>
      weapon.id === entry.weaponId
      || weapon.id === entry.weapon
      || weapon.id === detachableWeaponId,
    );
    const fallbackWeapon = modularWeapons.length
      ? modularWeapons[Math.abs(weaponIndex) % modularWeapons.length]
      : null;
    enemy.weaponAsset = requestedWeapon || fallbackWeapon || null;
    enemy.weaponFile = enemy.weaponAsset?.file || null;
    enemy.behaviorFamily = enemyBehaviorFamily(enemy, entry);
    const stats = entry.stats || null;
    if (stats) {
      enemy.authoredStats = {
        hp: Number(stats.hp) || null,
        damage: Number(stats.damage) || null,
        speed: Number(stats.speed) || null,
        posture: Number(stats.posture) || null,
      };
      if (
        !enemy.authoredHp
        && !isMassiveEnemy(enemy)
        && enemy.authoredStats.hp
      ) {
        const scaledHp = clamp(Math.ceil(enemy.authoredStats.hp / 24), 1, 75);
        const healthRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
        enemy.maxHp = scaledHp;
        enemy.hp = Math.max(1, Math.round(scaledHp * healthRatio));
      }
      if (enemy.authoredStats.posture) {
        enemy.maxPosture = clamp(Math.round(enemy.authoredStats.posture), 16, 520);
        enemy.posture = Math.min(enemy.posture || 0, enemy.maxPosture);
      }
    }
  }

  function applyRosterToGame(state) {
    if (!modularRoster.ready || !state) return;
    const regular = getRosterCategory("regular");
    const special = getRosterCategory("special");
    const miniboss = getRosterCategory("miniboss");
    const bosses = getRosterCategory("boss");
    const giants = getRosterCategory("giant");
    const activeArea = sideAreaById(state.side?.areaId);
    const rosterPoolId = activeArea?.rosterPoolId || null;
    const declaredPool = window.KageLevels?.rosterPools?.[rosterPoolId] || null;
    const entriesForIds = (ids, fallback) => {
      if (!Array.isArray(ids) || !ids.length) return fallback;
      const allowList = new Set(ids);
      const regional = modularRoster.characters.filter((entry) => allowList.has(entry.id));
      return regional.length ? regional : fallback;
    };
    const regionalRegular = entriesForIds(declaredPool?.regular, regular);
    const regionalSpecial = entriesForIds(declaredPool?.special, special);
    const regionalMiniboss = entriesForIds(declaredPool?.miniboss, miniboss);
    const sidePool = [...regionalRegular, ...regionalSpecial];
    state.side.enemies.forEach((enemy, index) => {
      const rosterIndex = state.chapter * state.side.enemies.length + index;
      const explicitId = enemy.rosterId || enemy.profileId;
      const explicitEntry = explicitId
        ? modularRoster.characters.find((entry) => entry.id === explicitId)
        : null;
      const hintedPool = enemy.rosterHint === "miniboss"
        ? regionalMiniboss
        : (enemy.rosterHint === "special"
          ? regionalSpecial
          : (enemy.rosterHint === "boss" ? bosses : sidePool));
      const entry = explicitEntry
        || (hintedPool.length ? hintedPool[rosterIndex % hintedPool.length] : null);
      if (entry) {
        equipRosterEntry(enemy, entry, rosterIndex);
        enemy.rosterPoolId = rosterPoolId;
      }
    });
    state.fps.missions.forEach((mission, missionIndex) => {
      const missionDef = FPS_DEFS[missionIndex] || {};
      const explicitCombatPool = (missionDef.rosterIds || [])
        .map((rosterId) => modularRoster.characters.find((entry) => entry.id === rosterId))
        .filter(Boolean);
      const combatPool = explicitCombatPool.length
        ? explicitCombatPool
        : (missionIndex === 0 ? special : [...special.slice(10), ...miniboss]);
      let combatIndex = 0;
      mission.enemies.forEach((enemy) => {
        if (enemy.boss) {
          // Aka-Ushi domine une arène de route en 2D. Le donjon conserve son
          // daimyō FPS : les deux formats ont ainsi une vraie arène dédiée.
          const explicitBossEntry = missionDef.bossRosterId
            ? modularRoster.characters.find((entry) => entry.id === missionDef.bossRosterId)
            : null;
          const bossEntry = explicitBossEntry || (missionIndex === 1
            ? modularRoster.characters.find((entry) => entry.id === "06-daimyo-corrupted")
              || bosses[missionIndex % bosses.length]
              || giants[missionIndex % giants.length]
            : bosses[missionIndex % bosses.length]
              || giants[missionIndex % giants.length]);
          if (bossEntry) {
            equipRosterEntry(enemy, bossEntry, 40 + missionIndex);
          }
        } else if (combatPool.length) {
          equipRosterEntry(enemy, combatPool[combatIndex % combatPool.length], 20 + combatIndex);
          combatIndex += 1;
        }
      });
    });
  }

  async function loadModularRoster() {
    if (typeof fetch !== "function") return;
    try {
      const response = await fetch(
        `assets/modular/registry.json?v=${ASSET_VERSION}`,
        { cache: "default" },
      );
      if (!response.ok) throw new Error(`registre HTTP ${response.status}`);
      const registry = await response.json();
      modularRoster.characters = Array.isArray(registry.characters) ? registry.characters : [];
      modularRoster.weapons = Array.isArray(registry.weapons) ? registry.weapons : [];
      modularRoster.environments = Array.isArray(registry.environments) ? registry.environments : [];
      buildRegistryWorldProps(modularRoster.environments);
      modularRoster.ready = modularRoster.characters.length > 0;
      document.body.dataset.rosterCharacters = String(modularRoster.characters.length);
      document.body.dataset.rosterWeapons = String(modularRoster.weapons.length);
      applyRosterToGame(game);
    } catch (_) {
      // Le bestiaire historique reste un secours jouable hors serveur HTTP.
    }
  }

  const dom = {
    title: document.getElementById("title-screen"),
    briefing: document.getElementById("briefing-screen"),
    dojo: document.getElementById("dojo-screen"),
    pause: document.getElementById("pause-screen"),
    end: document.getElementById("end-screen"),
    startButton: document.getElementById("start-button"),
    continueButton: document.getElementById("continue-button")
      || document.getElementById("continue-game"),
    continueNote: document.getElementById("continue-note"),
    settingsButton: document.getElementById("settings-button")
      || document.getElementById("settings-toggle"),
    health: document.getElementById("hud-health"),
    healthText: document.getElementById("hud-health-text"),
    stamina: document.getElementById("hud-stamina"),
    staminaText: document.getElementById("hud-stamina-text"),
    ammo: document.getElementById("hud-ammo"),
    seals: document.getElementById("hud-seals"),
    score: document.getElementById("hud-score"),
    objective: document.getElementById("hud-objective"),
    hudWeapon: document.getElementById("hud-weapon"),
    hudWeaponIcon: document.getElementById("hud-weapon-icon"),
    activeWeaponName: document.getElementById("hud-weapon-name"),
    activeWeaponFamily: document.getElementById("hud-weapon-slot"),
    mode: document.getElementById("view-mode-label"),
    hint: document.getElementById("context-hint"),
    bossBar: document.getElementById("boss-bar"),
    bossHealth: document.getElementById("boss-health"),
    bossName: document.getElementById("boss-name"),
    announce: document.getElementById("announcement"),
    damage: document.getElementById("damage-flash"),
    audioButton: document.getElementById("audio-button"),
    endTitle: document.getElementById("end-title"),
    endKicker: document.getElementById("end-kicker"),
    endMessage: document.getElementById("end-message"),
    endGlyph: document.getElementById("end-glyph"),
    endKills: document.getElementById("end-kills"),
    endTime: document.getElementById("end-time"),
    endRank: document.getElementById("end-rank"),
    endRestart: document.getElementById("restart-button"),
  };

  const input = {
    keys: new Set(),
    jumpQueued: false,
    lookPointerId: null,
    lookLastX: 0,
  };

  const MAPS = [
    [
      "111111111111111",
      "100000100000001",
      "101110101111101",
      "101000100000101",
      "101011111010101",
      "100010000010001",
      "111010111011101",
      "100010100000001",
      "101110101111101",
      "100000000100001",
      "101111110101101",
      "100000000100301",
      "101111111110001",
      "100000000000001",
      "111111111111111",
    ],
    [
      "111111111111111",
      "100000000000001",
      "101111011111101",
      "101000010000101",
      "101011110110101",
      "100010000010001",
      "111010111010111",
      "100000100000001",
      "101110101111101",
      "100010000010001",
      "101011111010101",
      "101000000010301",
      "101111011110001",
      "100000000000001",
      "111111111111111",
    ],
    // Maison des malades : neuf pièces de tatami reliées par des portes
    // étroites. Les cloisons forcent à fouiller les chambres sans produire
    // un labyrinthe arbitraire.
    [
      "11111111111111111",
      "10000100000100031",
      "10000100000000001",
      "10000000000100001",
      "10000100000100001",
      "11101111011111011",
      "10000100000100001",
      "10000100000000001",
      "10000000000100001",
      "10000100000100001",
      "10000100000100001",
      "11011110111110111",
      "10000100000100001",
      "10000100000000001",
      "10000000000100001",
      "10000100000100001",
      "11111111111111111",
    ],
    // Chapelle de route : cour carrée, pavillons latéraux et massif rituel
    // central. Le joueur peut contourner la cour par deux itinéraires.
    [
      "11111111111111111",
      "10001000000010001",
      "10000000000010001",
      "10001000000000001",
      "11011111011111011",
      "10001000000010001",
      "10001000000010001",
      "10001001110010001",
      "10000001110010001",
      "10001001110000001",
      "10001000000010001",
      "10001000000010001",
      "11101111101111011",
      "10001000000010001",
      "10000000000000001",
      "10001000000010031",
      "11111111111111111",
    ],
    // Archives du daimyō : salles de consultation et rayonnages réguliers,
    // avec une voie centrale qui conduit au registre contaminé.
    [
      "1111111111111111111",
      "1000001000001000031",
      "1000000000001000001",
      "1011101011100011001",
      "1011101011101011001",
      "1000001000001000001",
      "1110111110111110111",
      "1000001000001000001",
      "1011101011101011001",
      "1011100011100011001",
      "1000001000001000001",
      "1000001000001000001",
      "1101111110111111011",
      "1000001000001000001",
      "1011101011101011001",
      "1011101011100011001",
      "1000000000001000001",
      "1000001000001000001",
      "1111111111111111111",
    ],
  ];

  const FPS_DEFS = [
    {
      id: "contaminated-sanctuary",
      materialProfile: "contaminated-sanctuary",
      label: "SANCTUAIRE CONTAMINÉ",
      announcement: "SANCTUAIRE CONTAMINÉ — PURIFIEZ LE FOYER",
      objective: "Purifier le sanctuaire",
      altarObjective: "Rejoindre l'autel et poser le premier sceau",
      altarAssetIndex: 0,
      musicState: "yomi",
      musicIntensity: 0.54,
      start: [1.5, 1.5, 0],
      altar: [12.5, 11.5],
      enemies: [
        [4.5, 1.6], [8.5, 1.5], [3.5, 5.5], [8.5, 5.5], [12.2, 7.5], [6.5, 9.5], [11.5, 13.2],
      ],
    },
    {
      id: "kurokawa-donjon",
      materialProfile: "kurokawa-donjon",
      label: "DONJON DE KUROKAWA",
      announcement: "DONJON DE KUROKAWA — TUEZ LE DAIMYŌ",
      objective: "Abattre le daimyō et ses gardes",
      altarObjective: "Rejoindre les racines et poser le sceau final",
      altarAssetIndex: 1,
      musicState: "boss",
      musicIntensity: 0.92,
      start: [1.5, 13.2, -Math.PI / 2],
      altar: [12.5, 11.5],
      enemies: [
        [3.5, 11.5], [5.5, 7.5], [11.5, 7.5], [6.5, 3.5], [12.3, 1.6],
      ],
      boss: [9.5, 11.5],
      bossRosterId: "06-daimyo-corrupted",
    },
    {
      id: "kurokawa-sick-house",
      materialProfile: "kurokawa-sick-house",
      label: "MAISON DES MALADES",
      announcement: "MAISON DES MALADES — LIBÉREZ LES CHAMBRES EN QUARANTAINE",
      objective: "Délivrer les malades du Kegare",
      altarObjective: "Brûler les linges contaminés au foyer",
      completionAnnouncement: "MAISON PURIFIÉE — YOMOGI ET TANTŌ DE YAKUSHI RÉCUPÉRÉS",
      alreadyPurifiedAnnouncement: "MAISON DES MALADES DÉJÀ PURIFIÉE — V POUR REPARTIR",
      optional: true,
      secretId: "sick-house-secret",
      altarAssetIndex: 0,
      musicState: "yomi",
      musicIntensity: 0.46,
      fog: [23, 17, 15],
      rosterIds: [
        "r13-yakushi-apprentice",
        "r04-chaya-servant",
        "r15-oku-servant",
        "r18-washi-maker",
        "s09-kuro-yakushi",
      ],
      reward: {
        score: 1400,
        health: 32,
        ammo: 2,
        currencies: { yomogi: 2 },
        unlockWeapon: "tanto",
      },
      start: [1.5, 15.5, -Math.PI / 2],
      altar: [15.5, 1.5],
      enemies: [
        [3.5, 15.5], [8.5, 14.5], [13.5, 14.5],
        [2.5, 10.5], [8.5, 9.5], [14.5, 10.5],
        [3.5, 7.5], [9.5, 6.5], [13.5, 3.5],
      ],
    },
    {
      id: "market-road-shrine",
      materialProfile: "market-road-shrine",
      label: "CHAPELLE DE ROUTE",
      announcement: "CHAPELLE DE ROUTE — BRISEZ LA PROCESSION DES ONIBI",
      objective: "Éteindre la procession des Onibi",
      altarObjective: "Rendre les offrandes à la chapelle",
      completionAnnouncement: "CHAPELLE PURIFIÉE — HIRA-SHURIKEN ET CENDRES DU YOMI RÉCUPÉRÉS",
      alreadyPurifiedAnnouncement: "CHAPELLE DÉJÀ PURIFIÉE — V POUR REPARTIR",
      optional: true,
      secretId: "market-shrine-secret",
      altarAssetIndex: 0,
      musicState: "yomi",
      musicIntensity: 0.6,
      fog: [13, 17, 14],
      rosterIds: [
        "s04-onibi-adept",
        "s11-biwa-revenant",
        "s12-shikigami-scribe",
        "s16-kage-mai-dancer",
        "s18-yomi-herald",
      ],
      reward: {
        score: 1800,
        health: 18,
        ammo: 6,
        currencies: { yomiAsh: 2 },
        unlockWeapon: "hira-shuriken",
      },
      start: [1.5, 1.5, 0],
      altar: [15.5, 15.5],
      enemies: [
        [6.5, 1.5], [14.5, 2.5], [2.5, 6.5], [8.5, 5.5], [14.5, 7.5],
        [5.5, 10.5], [10.5, 10.5], [2.5, 14.5], [9.5, 14.5], [14.5, 14.5],
      ],
    },
    {
      id: "daimyo-archive",
      materialProfile: "daimyo-archive",
      label: "ARCHIVES DU DAIMYŌ",
      announcement: "ARCHIVES DU DAIMYŌ — RETROUVEZ LE REGISTRE DES DISPARUS",
      objective: "Rompre la garde des archives",
      altarObjective: "Sceller le registre contaminé",
      completionAnnouncement: "ARCHIVES SCELLÉES — SHŌGUN NO IN ET TAMAHAGANE RÉCUPÉRÉS",
      alreadyPurifiedAnnouncement: "ARCHIVES DÉJÀ SCELLÉES — V POUR REPARTIR",
      optional: true,
      secretId: "daimyo-archive-secret",
      altarAssetIndex: 1,
      musicState: "boss",
      musicIntensity: 0.72,
      fog: [14, 11, 17],
      rosterIds: [
        "s07-tessen-courtier",
        "s10-hatamoto-fallen",
        "s12-shikigami-scribe",
        "s17-kurohata-bearer",
        "mb-12-gardien-masque-fer",
      ],
      reward: {
        score: 2600,
        health: 24,
        ammo: 4,
        currencies: { tamahagane: 2, mon: 180 },
        unlockWeapon: "02-shogun-no-in",
      },
      start: [1.5, 17.5, -Math.PI / 2],
      altar: [17.5, 1.5],
      enemies: [
        [4.5, 17.5], [9.5, 16.5], [15.5, 17.5], [2.5, 13.5], [16.5, 13.5],
        [3.5, 10.5], [15.5, 10.5], [2.5, 7.5], [9.5, 7.5], [15.5, 2.5],
      ],
      boss: [9.5, 1.5],
      bossHp: 18,
      bossRosterId: "mb-18-onmyoji-renard",
    },
  ];
  const FPS_ENGAGEMENT_ANGLES = [
    0,
    Math.PI,
    Math.PI / 2,
    -Math.PI / 2,
    Math.PI / 4,
    -3 * Math.PI / 4,
    3 * Math.PI / 4,
    -Math.PI / 4,
  ];
  const SIDE_AI_PROFILES = Object.freeze({
    walker: Object.freeze({
      sight: 220,
      hearing: 118,
      memory: 2.3,
      leash: 330,
      patrolRadius: 92,
      patrolWait: 0.72,
    }),
    sentinel: Object.freeze({
      sight: 255,
      hearing: 105,
      memory: 3,
      leash: 235,
      patrolRadius: 54,
      patrolWait: 1.15,
    }),
    brute: Object.freeze({
      sight: 185,
      hearing: 145,
      memory: 3.4,
      leash: 280,
      patrolRadius: 68,
      patrolWait: 1.05,
    }),
    boss: Object.freeze({
      sight: 420,
      hearing: 360,
      memory: 6,
      leash: 760,
      patrolRadius: 0,
      patrolWait: 0,
    }),
  });
  const FPS_AI_DEFAULTS = Object.freeze({
    sight: 8.5,
    hearing: 2.6,
    memory: 3.25,
    fov: Math.PI * 0.72,
    patrolRadius: 1.35,
    patrolWait: 0.8,
  });

  let game = createGameState();
  let lastTime = performance.now();
  let rafId = 0;

  function createGameState(loadoutOverride = persistedPlayerLoadout()) {
    const loadout = normalizePlayerLoadout(loadoutOverride);
    const ammoByType = persistedAmmoMap();
    const rangedWeapon = arsenalWeaponById(loadout.ranged);
    const ammoType = rangedAmmoType(rangedWeapon);
    const ammoCapacity = rangedAmmoCapacity(rangedWeapon);
    return {
      status: "title",
      mode: "side",
      chapter: 0,
      health: 100,
      stamina: 100,
      ammo: clamp(Number(ammoByType[ammoType] ?? ammoCapacity), 0, ammoCapacity),
      ammoByType,
      seals: 0,
      kills: 0,
      score: 0,
      startedAt: 0,
      elapsed: 0,
      invulnerable: 0,
      engagementGrace: 0,
      hurtTimer: 0,
      deathTimer: 0,
      attackTimer: 0,
      attackDuration: PLAYER_ATTACK_DURATION,
      attackCooldown: 0,
      attackHitApplied: false,
      attackKind: "light",
      attackSpec: null,
      comboStep: 0,
      comboTimer: 0,
      guardHeld: false,
      guardTimer: 0,
      parryTimer: 0,
      dodgeTimer: 0,
      dodgeCooldown: 0,
      playerPosture: 0,
      playerPostureDelay: 0,
      perfectParries: 0,
      settings: persistedGameSettings(),
      rangedViewTimer: 0,
      lastRangedWeaponId: null,
      playerStagger: 0,
      shake: 0,
      hitStop: 0,
      hitConfirm: 0,
      hitConfirmMaterial: "flesh",
      hitConfirmPoint: { x: W / 2, y: H / 2 },
      transition: 0,
      transitionLabel: "",
      pendingTravel: null,
      portalConfirmation: null,
      activeCheckpointId: null,
      consumedCheckpointIds: new Set(),
      takenPickupIds: new Set(),
      restoringProgress: false,
      loadout,
      activeWeaponSlot: "primary",
      activeWeaponId: loadout.primary,
      weaponIndex: Math.max(0, KATANA_IDS.indexOf(loadout.primary)),
      loadoutReturnStatus: "briefing",
      side: makeSideState(),
      fps: {
        current: 0,
        missions: FPS_DEFS.map((_, index) => makeFpsMission(index)),
        zBuffer: new Array(320).fill(20),
      },
    };
  }

  function savedProgress() {
    try {
      return window.KageSave?.getProgress?.()
        || window.KageSave?.load?.()?.progress
        || null;
    } catch (_) {
      return null;
    }
  }

  function persistRunProgress(patch = {}) {
    if (!window.KageSave?.setProgress || !game || game.restoringProgress) return null;
    const previous = savedProgress();
    const areaId = patch.areaId || game.side?.areaId || sideAreaIdForChapter(game.chapter);
    const area = sideAreaById(areaId);
    const chapter = area?.chapterId === "castle" ? 1 : game.chapter;
    try {
      return window.KageSave.setProgress({
        chapter,
        highestChapter: chapter,
        areaId,
        spawnId: patch.spawnId || previous?.spawnId || "prologue",
        checkpoint: patch.checkpoint || previous?.checkpoint || "kai-forest-entry",
        health: clamp(Number(patch.health ?? game.health), 1, 100),
        seals: Math.max(0, Number(patch.seals ?? game.seals) || 0),
        kills: Math.max(0, Number(patch.kills ?? game.kills) || 0),
        score: Math.max(0, Number(patch.score ?? game.score) || 0),
        elapsed: Math.max(0, Number(patch.elapsed ?? game.elapsed) || 0),
        visitedAreas: [...new Set(game.side?.visitedAreas || [])],
        takenPickupIds: [...game.takenPickupIds],
        consumedCheckpointIds: [...game.consumedCheckpointIds],
        started: patch.started !== false,
        completed: Boolean(patch.completed),
      });
    } catch (_) {
      return null;
    }
  }

  function restoreRunProgress() {
    const progress = savedProgress();
    if (!progress?.started || progress.completed) return false;
    game.restoringProgress = true;
    game.chapter = clamp(Number(progress.chapter) || 0, 0, 1);
    game.health = clamp(Number(progress.health) || 100, 1, 100);
    game.seals = Math.max(0, Number(progress.seals) || 0);
    game.kills = Math.max(0, Number(progress.kills) || 0);
    game.score = Math.max(0, Number(progress.score) || 0);
    game.elapsed = Math.max(0, Number(progress.elapsed) || 0);
    game.takenPickupIds = new Set(progress.takenPickupIds || []);
    game.consumedCheckpointIds = new Set(progress.consumedCheckpointIds || []);
    game.side.visitedAreas = [...new Set([
      ...(progress.visitedAreas || []),
      game.side.areaId,
    ])];
    game.activeCheckpointId = progress.checkpoint || null;
    if (game.activeCheckpointId) {
      game.consumedCheckpointIds.add(game.activeCheckpointId);
    }
    const fallbackAreaId = sideAreaIdForChapter(game.chapter);
    const areaId = sideAreaById(progress.areaId) ? progress.areaId : fallbackAreaId;
    const area = sideAreaById(areaId);
    const spawnId = area?.spawns?.[progress.spawnId]
      ? progress.spawnId
      : Object.keys(area?.spawns || {})[0];
    const restored = setCurrentSideArea(areaId, spawnId, true);
    game.restoringProgress = false;
    return restored;
  }

  function sideAreaById(areaId) {
    return window.KageLevels?.areas?.[areaId] || null;
  }

  function sideAreaIdForChapter(chapter) {
    if (chapter === 0) {
      return window.KageLevels?.chapters?.village?.entryAreaId
        || window.KageLevels?.startAreaId
        || "legacy-village";
    }
    return window.KageLevels?.chapters?.castle?.entryAreaId
      || "legacy-castle";
  }

  function sidePlatformById(area, platformId) {
    if (!platformId || !Array.isArray(area?.platforms)) return null;
    return area.platforms.find((platform) => platform.id === platformId) || null;
  }

  function sideEnemyAiProfileName(definition, massive) {
    if (massive || definition.boss) return "boss";
    if (definition.ai?.profile) return definition.ai.profile;
    if (definition.platformId) return "sentinel";
    if (definition.roster === "special") return "brute";
    return "walker";
  }

  function persistedBossDefeated(...ids) {
    try {
      const bosses = window.KageSave?.load?.()?.bosses || {};
      return ids.filter(Boolean).some((id) => bosses[id] === true);
    } catch (_) {
      return false;
    }
  }

  function createSideEnemyAi(definition, area, width, height, index, massive) {
    const profileName = sideEnemyAiProfileName(definition, massive);
    const defaults = SIDE_AI_PROFILES[profileName] || SIDE_AI_PROFILES.walker;
    const authored = definition.ai || {};
    const platform = sidePlatformById(area, definition.platformId);
    const patrol = authored.patrol || {};
    const homeX = Number(definition.x) || 0;
    const homeY = Number.isFinite(definition.y)
      ? definition.y
      : SIDE_GROUND_Y - height;
    const radius = Number.isFinite(patrol.radius)
      ? patrol.radius
      : defaults.patrolRadius;
    const areaMin = Number.isFinite(area?.minX) ? area.minX : 6;
    const areaMax = Number.isFinite(area?.maxX)
      ? area.maxX
      : Math.max(areaMin + width, (area?.width || 2500) - width - 6);
    const platformMin = platform ? platform.x + 2 : areaMin;
    const platformMax = platform
      ? platform.x + platform.w - width - 2
      : areaMax - width;
    const patrolMinX = clamp(
      Number.isFinite(patrol.minX) ? patrol.minX : homeX - radius,
      platformMin,
      Math.max(platformMin, platformMax),
    );
    const patrolMaxX = clamp(
      Number.isFinite(patrol.maxX) ? patrol.maxX : homeX + radius,
      patrolMinX,
      Math.max(patrolMinX, platformMax),
    );
    return {
      profile: profileName,
      state: massive ? "idle" : "patrol",
      previousState: null,
      stateTime: index * 0.11,
      reason: "spawn",
      homeX,
      homeY,
      homeFacing: definition.facing || -1,
      platformId: definition.platformId || null,
      patrolMinX,
      patrolMaxX,
      patrolDirection: definition.facing || (index % 2 ? -1 : 1),
      waitTime: index % 3 * 0.18,
      sight: Number(authored.perception?.sight ?? defaults.sight),
      hearing: Number(authored.perception?.hearing ?? defaults.hearing),
      memoryDuration: Number(authored.perception?.memory ?? defaults.memory),
      memoryTime: 0,
      leash: Number(authored.leash ?? defaults.leash),
      lastKnownX: null,
      targetVisible: false,
      targetAudible: false,
      moveVelocity: 0,
      stuckTime: 0,
      lastX: homeX,
    };
  }

  function makeSideEnemiesForArea(areaId, chapter = 0) {
    const area = sideAreaById(areaId);
    const definitions = area?.enemies;
    const rules = SIDE_CHAPTER_RULES[chapter] || SIDE_CHAPTER_RULES[0];
    const entries = Array.isArray(definitions) && definitions.length
      ? definitions
      : rules.enemyXs.map((x) => ({ x }));
    return entries.map((definition, i) => {
      const massive = definition.presentationClass === "massive"
        || Boolean(definition.profileId);
      const width = definition.w || (massive ? 128 : 16);
      const height = definition.h || (massive ? 82 : 24);
      const hp = definition.hp
        || (massive
          ? 42
          : (definition.roster === "miniboss"
            ? 9
            : (definition.roster === "special" || i > 6 ? 3 : 2)));
      const enemy = {
        sourceId: definition.id || `${areaId}-enemy-${i + 1}`,
        authoredHp: Number.isFinite(Number(definition.hp)),
        rosterHint: definition.roster || null,
        rosterId: definition.rosterId || null,
        profileId: definition.profileId || null,
        encounterId: definition.encounterId || null,
        presentationClass: massive ? "massive" : null,
        boss: Boolean(definition.boss || massive),
        x: definition.x,
        y: Number.isFinite(definition.y) ? definition.y : SIDE_GROUND_Y - height,
        w: width,
        h: height,
        hp,
        maxHp: hp,
        dead: false,
        dying: false,
        facing: definition.facing || -1,
        attack: 0,
        attackDuration: 0.56,
        attackCooldown: i * 0.1,
        attackHitApplied: false,
        hurtTimer: 0,
        deathTimer: 0,
        knockbackVx: 0,
        flash: 0,
        impactMaterial: massive ? "armor" : "flesh",
        behaviorFamily: massive ? "charger" : (definition.roster === "miniboss" ? "shield" : "melee"),
        posture: 0,
        maxPosture: massive ? 120 : (definition.roster === "miniboss" ? 72 : 36),
        postureDelay: 0,
        postureBrokenTimer: 0,
        massivePhase: massive ? 1 : null,
        detachablePartAttached: massive ? true : null,
        seed: chapter * 101 + i * 13.7,
        platformId: definition.platformId || null,
      };
      if (
        enemy.boss
        && persistedBossDefeated(
          enemy.sourceId,
          enemy.rosterId,
          enemy.profileId,
          enemy.encounterId,
        )
      ) {
        enemy.hp = 0;
        enemy.dead = true;
        enemy.dying = false;
      }
      enemy.ai = createSideEnemyAi(definition, area, width, height, i, massive);
      return enemy;
    });
  }

  function makeSideEnemies(chapter) {
    return makeSideEnemiesForArea(sideAreaIdForChapter(chapter), chapter);
  }

  function makeSidePickupsForArea(areaId, chapter = 0) {
    const area = sideAreaById(areaId);
    const definitions = area?.pickups;
    const rules = SIDE_CHAPTER_RULES[chapter] || SIDE_CHAPTER_RULES[0];
    const entries = Array.isArray(definitions) && definitions.length
      ? definitions
      : rules.pickups;
    return entries.map((pickup, index) => ({
      sourceId: pickup.id || `${areaId}-pickup-${index + 1}`,
      x: pickup.x,
      y: Number.isFinite(pickup.y) ? pickup.y : SIDE_GROUND_Y - 34,
      kind: pickup.kind,
      amount: pickup.amount,
      taken: false,
    }));
  }

  function legacyMakeSideEnemies(chapter) {
    const rules = SIDE_CHAPTER_RULES[chapter] || SIDE_CHAPTER_RULES[0];
    return rules.enemyXs.map((x, i) => ({
        x,
        y: SIDE_GROUND_Y - 24,
        w: 16,
        h: 24,
        hp: i > 6 ? 3 : 2,
        maxHp: i > 6 ? 3 : 2,
        dead: false,
        dying: false,
        facing: -1,
        attack: 0,
        attackDuration: 0.56,
        attackCooldown: i * 0.1,
        attackHitApplied: false,
        hurtTimer: 0,
        deathTimer: 0,
        knockbackVx: 0,
        flash: 0,
        impactMaterial: "flesh",
        seed: chapter * 101 + i * 13.7,
      }));
  }

  function makeSidePickups(chapter) {
    return makeSidePickupsForArea(sideAreaIdForChapter(chapter), chapter);
  }

  function makeSideState() {
    const areaId = sideAreaIdForChapter(0);
    const area = sideAreaById(areaId);
    const enemies = makeSideEnemiesForArea(areaId, 0);
    const pickups = makeSidePickupsForArea(areaId, 0);
    return {
      areaId,
      width: area?.width || 2500,
      cameraX: 0,
      player: {
        x: 56,
        y: SIDE_GROUND_Y - 27,
        vx: 0,
        vy: 0,
        w: 15,
        h: 27,
        facing: 1,
        grounded: true,
        walkDistance: 0,
      },
      enemies,
      projectiles: [],
      particles: [],
      pickups,
      areaStates: {
        [areaId]: { enemies, pickups },
      },
      visitedAreas: [areaId],
      activeEncounterId: null,
    };
  }

  function prepareSideChapter(chapter) {
    const areaId = sideAreaIdForChapter(chapter);
    if (!setCurrentSideArea(areaId, chapter === 0 ? "prologue" : "legacyFpsReturn", true)) {
      game.side.enemies = makeSideEnemiesForArea(areaId, chapter);
      game.side.pickups = makeSidePickupsForArea(areaId, chapter);
      game.side.projectiles.length = 0;
      game.side.particles.length = 0;
      game.side.width = 2500;
    }
  }

  function createFpsEnemyAi(x, y, index, boss = false) {
    const patrolAngle = index * 2.399963 + (boss ? Math.PI : 0);
    return {
      state: boss ? "idle" : "patrol",
      previousState: null,
      stateTime: index * 0.09,
      reason: "spawn",
      homeX: x,
      homeY: y,
      heading: normalizeAngle(patrolAngle),
      patrolAngle,
      patrolDirection: index % 2 ? -1 : 1,
      patrolRadius: boss ? 0.55 : FPS_AI_DEFAULTS.patrolRadius,
      patrolWait: (index % 3) * 0.2,
      sight: boss ? 11.5 : FPS_AI_DEFAULTS.sight,
      hearing: boss ? 4.2 : FPS_AI_DEFAULTS.hearing,
      fov: boss ? Math.PI * 1.25 : FPS_AI_DEFAULTS.fov,
      memoryDuration: boss ? 5.2 : FPS_AI_DEFAULTS.memory,
      memoryTime: 0,
      lastKnownX: null,
      lastKnownY: null,
      targetVisible: false,
      targetAudible: false,
      stuckTime: 0,
      movedDistance: 0,
    };
  }

  function persistedOptionalFpsMission(secretId) {
    if (!secretId) return false;
    try {
      return window.KageSave?.load?.()?.secrets?.[secretId] === true;
    } catch (_) {
      return false;
    }
  }

  function makeFpsMission(index) {
    const def = FPS_DEFS[index];
    const persistedPurification = Boolean(
      def.optional && persistedOptionalFpsMission(def.secretId),
    );
    const formationCount = def.enemies.length + (def.boss ? 1 : 0);
    const formationPhase = index * Math.PI / 7;
    const enemies = def.enemies.map((entry, i) => ({
      x: entry[0], y: entry[1], hp: persistedPurification ? 0 : 4, maxHp: 4,
      dead: persistedPurification, dying: false,
      attack: 0, attackDuration: 0.68, attackCooldown: i * 0.12, attackHitApplied: false,
      hurtTimer: 0, deathTimer: 0, knockbackX: 0, knockbackY: 0,
      flash: 0, boss: false, impactMaterial: "flesh",
      behaviorFamily: "melee", posture: 0, maxPosture: 42,
      postureDelay: 0, postureBrokenTimer: 0,
      spriteIndex: i % 5,
      engagementSlot: i,
      engagementAngle: formationPhase + i * Math.PI * 2 / formationCount,
      ai: createFpsEnemyAi(entry[0], entry[1], i, false),
    }));
    if (def.boss) {
      const bossHp = Math.max(1, Number(def.bossHp) || 26);
      enemies.push({
        x: def.boss[0], y: def.boss[1],
        hp: persistedPurification ? 0 : bossHp,
        maxHp: bossHp,
        dead: persistedPurification,
        dying: false,
        attack: 0, attackDuration: 0.92, attackCooldown: 0.4, attackHitApplied: false,
        hurtTimer: 0, deathTimer: 0, knockbackX: 0, knockbackY: 0,
        flash: 0, boss: true, spriteIndex: 5, impactMaterial: "armor",
        behaviorFamily: "shield", posture: 0, maxPosture: 110,
        postureDelay: 0, postureBrokenTimer: 0,
        engagementSlot: enemies.length,
        engagementAngle: formationPhase + enemies.length * Math.PI * 2 / formationCount,
        ai: createFpsEnemyAi(def.boss[0], def.boss[1], enemies.length, true),
      });
    }
    return {
      id: def.id || `fps-mission-${index}`,
      label: def.label || "FOYER CONTAMINÉ",
      objective: def.objective || "Purifier le foyer",
      altarObjective: def.altarObjective || "Rejoindre l'autel",
      completionAnnouncement: def.completionAnnouncement || "",
      alreadyPurifiedAnnouncement: def.alreadyPurifiedAnnouncement || "",
      optional: Boolean(def.optional),
      secretId: def.secretId || null,
      reward: def.reward ? { ...def.reward } : null,
      map: MAPS[index],
      player: { x: def.start[0], y: def.start[1], angle: def.start[2] },
      altar: { x: def.altar[0], y: def.altar[1] },
      enemies,
      particles: [],
      purified: persistedPurification,
    };
  }

  function key(name) {
    return input.keys.has(name) || input.keys.has(name.toLowerCase());
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function approach(value, target, amount) {
    return value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
  }

  function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= TAU;
    while (angle < -Math.PI) angle += TAU;
    return angle;
  }

  function currentSideEnvironmentIndex() {
    return previewEnvironmentIndex
      ?? currentSideArea()?.environmentIndex
      ?? (game.chapter === 0 ? 0 : 2);
  }

  function currentSideArea() {
    return sideAreaById(game.side.areaId);
  }

  function currentSideRules() {
    const area = currentSideArea();
    if (area) {
      return {
        minX: area.minX ?? 6,
        maxX: area.maxX ?? area.width - 21,
        cameraMinX: area.cameraMinX ?? 0,
        enemyXs: (area.enemies || []).map((enemy) => enemy.x),
        pickups: area.pickups || [],
      };
    }
    return SIDE_CHAPTER_RULES[game.chapter] || SIDE_CHAPTER_RULES[0];
  }

  function currentSidePlatforms() {
    const area = currentSideArea();
    if (area) return area.platforms || [];
    return SIDE_PLATFORM_LAYOUTS[game.chapter] || SIDE_PLATFORM_LAYOUTS[0];
  }

  function currentSideSurfaces() {
    const area = currentSideArea();
    const groundSegments = area?.groundSegments?.length
      ? area.groundSegments
      : [{ x: 0, y: SIDE_GROUND_Y, w: game.side.width, h: SIDE_GROUND_DEPTH, ground: true }];
    return [
      ...currentSidePlatforms(),
      ...groundSegments.map((ground) => ({ ...ground, ground: true })),
    ].sort((a, b) => a.y - b.y);
  }

  function fpsMissionIndexForPortal(portal) {
    const candidate = portal?.missionIndex ?? portal?.mission;
    const index = Number(candidate);
    return Number.isFinite(index) ? index : null;
  }

  function currentSideEntrance() {
    const area = currentSideArea();
    if (area?.portals?.length) {
      return area.portals.find((portal) =>
        portal.type === "fps"
        && fpsMissionIndexForPortal(portal) === game.chapter)
        || area.portals.find((portal) => portal.type === "side")
        || area.portals.find((portal) =>
          portal.type === "fps" && fpsMissionIndexForPortal(portal) !== null)
        || area.portals[0];
    }
    return SIDE_ENTRANCES[game.chapter] || SIDE_ENTRANCES[0];
  }

  function currentSideObjectivePortal() {
    const area = currentSideArea();
    const portals = area?.portals || [];
    if (game.side.areaId === "castle-donjon" && game.seals >= 2) {
      const temporalWarp = portals.find(
        (portal) => portal.id === "castle-to-contemporary-warp",
      );
      if (temporalWarp) return temporalWarp;
    }
    const activeMissionPortal = portals.find((portal) =>
      portal.type === "fps"
      && fpsMissionIndexForPortal(portal) === game.chapter);
    if (activeMissionPortal) return activeMissionPortal;
    const authoredObjective = portals.find(
      (portal) => portal.id === area?.objectivePortalId,
    );
    if (authoredObjective) return authoredObjective;
    return currentSideEntrance();
  }

  function currentSidePortals() {
    return (currentSideArea()?.portals || [currentSideEntrance()])
      .filter((portal) => !["disabled", "legacyOnly"].includes(portal.state));
  }

  function sideEncounterComplete(encounterId) {
    if (!encounterId) return true;
    for (const [areaId, area] of Object.entries(window.KageLevels?.areas || {})) {
      const definesEncounter = area.encounters?.some((entry) => entry.id === encounterId)
        || area.enemies?.some((enemy) => enemy.encounterId === encounterId);
      if (!definesEncounter) continue;
      const runtime = game.side.areaStates?.[areaId];
      const enemy = runtime?.enemies?.find((entry) =>
        entry.encounterId === encounterId || entry.sourceId === encounterId);
      return Boolean(enemy && (enemy.dead || enemy.dying || enemy.hp <= 0));
    }
    return false;
  }

  function sidePortalLockMessage(portal) {
    if (
      portal.id === "castle-to-contemporary-warp"
      && game.seals < 2
    ) {
      return "LA FAILLE RESTE FERMÉE — ABATTEZ LE DAIMYŌ ET POSEZ LE SECOND SCEAU";
    }
    if (portal.type === "ending" && game.seals < 2) {
      return "LE CŒUR DE LA FAILLE REFUSE UN SCEAU INCOMPLET";
    }
    if (
      portal.requiresAreaClear
      && game.side.enemies.some(isEnemyAlive)
    ) {
      const remaining = game.side.enemies.filter(isEnemyAlive).length;
      return `LA FAILLE RESTE INSTABLE — ${remaining} INFECTÉ${remaining > 1 ? "S" : ""} À ÉLIMINER`;
    }
    if (
      portal.destination?.areaId === "castle-lower-court"
      && game.seals < 1
    ) {
      return "LA ROUTE DU CHÂTEAU EST SCELLÉE PAR LE PREMIER FOYER";
    }
    if (portal.unlockEncounterId && !sideEncounterComplete(portal.unlockEncounterId)) {
      return "AKA-USHI GARDE LA ROUTE — ABATTEZ LE BOSS MASSIF";
    }
    return "";
  }

  function confirmSidePortal(portal) {
    if (!portal?.requiresConfirmation) return true;
    const confirmationId = `${game.side.areaId}:${portal.id}`;
    const now = performance.now();
    if (
      game.portalConfirmation?.id === confirmationId
      && game.portalConfirmation.expiresAt >= now
    ) {
      game.portalConfirmation = null;
      return true;
    }
    game.portalConfirmation = {
      id: confirmationId,
      expiresAt: now + 4500,
    };
    announce(
      portal.type === "ending"
        ? "CONFIRMEZ AVEC E — SCELLER LA FAILLE METTRA FIN À LA CAMPAGNE"
        : "CONFIRMEZ AVEC E — FRANCHIR LA FAILLE TEMPORELLE",
    );
    return false;
  }

  function currentSideMassiveEncounter() {
    return currentSideArea()?.encounters?.find((entry) => entry.kind === "massiveBoss")
      || null;
  }

  function currentSideMassiveBoss(encounter = currentSideMassiveEncounter()) {
    if (!encounter) return null;
    return game.side.enemies.find((enemy) =>
      enemy.encounterId === encounter.id || enemy.profileId === encounter.profileId)
      || null;
  }

  function updateSideEncounterLock() {
    const encounter = currentSideMassiveEncounter();
    const boss = currentSideMassiveBoss(encounter);
    if (!encounter || !boss || !isEnemyAlive(boss)) {
      const encounterEnded = Boolean(game.side.activeEncounterId);
      game.side.activeEncounterId = null;
      if (encounterEnded) {
        const music = sideMusicState();
        setMusicState(music.state, music.intensity);
      }
      return null;
    }
    const playerCenter = game.side.player.x + game.side.player.w / 2;
    if (
      game.side.activeEncounterId === encounter.id
      || playerCenter >= (encounter.activationX ?? encounter.bounds?.x ?? Infinity)
    ) {
      const encounterStarted = game.side.activeEncounterId !== encounter.id;
      game.side.activeEncounterId = encounter.id;
      if (encounterStarted) {
        setMusicState("boss", 0.95);
        playAudio("playCombatCue", "boss-intro");
      }
      const bounds = encounter.bounds;
      if (bounds) {
        game.side.player.x = clamp(
          game.side.player.x,
          bounds.x + 14,
          bounds.x + bounds.w - game.side.player.w - 14,
        );
      }
      return encounter;
    }
    return null;
  }

  function sidePortalBlocksMovement(portal) {
    if (portal?.collision !== "solidDoor") return false;
    if (
      portal.persistentEncounterId === "daimyo-donjon"
      && game.seals >= 2
    ) {
      return false;
    }
    const portalType = portal.type
      || (fpsMissionIndexForPortal(portal) !== null ? "fps" : "side");
    if (
      portalType === "fps"
      && fpsMissionIndexForPortal(portal) === null
    ) {
      // Les intérieurs secondaires encore non jouables restent des points
      // d'interaction manuels, mais ne coupent jamais la rue principale.
      return false;
    }
    if (sidePortalLockMessage(portal)) return true;
    if (
      portal.unlockEncounterId
      && sideEncounterComplete(portal.unlockEncounterId)
    ) return false;
    return portal.state !== "open";
  }

  function sidePortalBarrier(portal) {
    const width = Math.max(8, Number(portal.blockWidth) || 18);
    const left = Number.isFinite(portal.blockX)
      ? Number(portal.blockX)
      : Number(portal.x) - width / 2;
    return {
      left,
      right: left + width,
    };
  }

  function sideBlockedPortals() {
    return currentSidePortals().filter(sidePortalBlocksMovement);
  }

  function resolveSideDoorCollision(previousX, candidateX, width) {
    let resolvedX = candidateX;
    for (const portal of sideBlockedPortals()) {
      const isChapterObjective = portal === currentSideEntrance()
        && (portal.type || "fps") === "fps"
        && fpsMissionIndexForPortal(portal) !== null;
      if (
        isChapterObjective
        && Number.isFinite(portal.blockX)
        && resolvedX > portal.blockX
      ) {
        resolvedX = portal.blockX;
        continue;
      }
      const barrier = sidePortalBarrier(portal);
      const previousRight = previousX + width;
      const candidateRight = resolvedX + width;
      const collisionPlane = Number(portal.x);
      const previousCenter = previousX + width / 2;
      const candidateCenter = resolvedX + width / 2;
      if (previousCenter <= collisionPlane && candidateCenter > collisionPlane) {
        resolvedX = collisionPlane - width;
      } else if (previousCenter >= collisionPlane && candidateCenter < collisionPlane) {
        resolvedX = collisionPlane;
      } else if (previousRight <= barrier.left + 1 && candidateRight > barrier.left) {
        resolvedX = barrier.left - width;
      } else if (previousX >= barrier.right - 1 && resolvedX < barrier.right) {
        resolvedX = barrier.right;
      } else if (
        resolvedX < barrier.right
        && candidateRight > barrier.left
      ) {
        resolvedX = resolvedX + width / 2 < (barrier.left + barrier.right) / 2
          ? barrier.left - width
          : barrier.right;
      }
    }
    return resolvedX;
  }

  function sidePortalDistance(portal) {
    const p = game.side.player;
    return Math.abs(p.x + p.w / 2 - portal.x);
  }

  function nearestSidePortal(rangeScale = 1) {
    if (game.mode !== "side") return null;
    const p = game.side.player;
    const feetY = p.y + p.h;
    if (Math.abs(feetY - SIDE_GROUND_Y) > 12) return null;
    return currentSidePortals()
      .filter((portal) =>
        sidePortalDistance(portal) <= (portal.interactionRange || 52) * rangeScale)
      .sort((a, b) => sidePortalDistance(a) - sidePortalDistance(b))[0]
      || null;
  }

  function isNearSideEntrance(rangeScale = 1) {
    if (game.mode !== "side") return false;
    const entrance = currentSideEntrance();
    const p = game.side.player;
    const centerX = p.x + p.w / 2;
    const feetY = p.y + p.h;
    return Math.abs(centerX - entrance.x) <= entrance.interactionRange * rangeScale
      && Math.abs(feetY - SIDE_GROUND_Y) <= 12;
  }

  function setCurrentSideArea(areaId, spawnId, resetProjectiles = false) {
    const targetArea = sideAreaById(areaId);
    if (!targetArea) return false;
    const side = game.side;
    if (side.areaId && side.enemies && side.pickups) {
      side.areaStates[side.areaId] = {
        enemies: side.enemies,
        pickups: side.pickups,
      };
    }
    if (!side.areaStates[areaId]) {
      side.areaStates[areaId] = {
        enemies: makeSideEnemiesForArea(areaId, targetArea.chapterId === "castle" ? 1 : 0),
        pickups: makeSidePickupsForArea(areaId, targetArea.chapterId === "castle" ? 1 : 0),
      };
    }
    const runtime = side.areaStates[areaId];
    runtime.pickups.forEach((pickup) => {
      if (game.takenPickupIds.has(pickup.sourceId)) pickup.taken = true;
    });
    side.areaId = areaId;
    side.width = targetArea.width || 2500;
    side.enemies = runtime.enemies;
    side.pickups = runtime.pickups;
    side.activeEncounterId = null;
    if (!side.visitedAreas.includes(areaId)) side.visitedAreas.push(areaId);
    const spawn = targetArea.spawns?.[spawnId]
      || Object.values(targetArea.spawns || {})[0]
      || { x: 56, y: SIDE_GROUND_Y - side.player.h, facing: 1 };
    Object.assign(side.player, {
      x: spawn.x,
      y: Number.isFinite(spawn.y) ? spawn.y : SIDE_GROUND_Y - side.player.h,
      vx: 0,
      vy: 0,
      facing: spawn.facing || 1,
      grounded: true,
      walkDistance: 0,
    });
    side.cameraX = clamp(
      side.player.x - W * 0.32,
      targetArea.cameraMinX || 0,
      Math.max(targetArea.cameraMinX || 0, side.width - W),
    );
    if (resetProjectiles) {
      side.projectiles.length = 0;
      side.particles.length = 0;
    }
    if (targetArea.chapterId === "castle") game.chapter = Math.max(game.chapter, 1);
    applyRosterToGame(game);
    if (game.status === "playing" && !game.restoringProgress) {
      persistRunProgress({ areaId, spawnId: spawnId || Object.keys(targetArea.spawns || {})[0] });
      const music = sideMusicState(targetArea);
      setMusicState(music.state, music.intensity);
    }
    return true;
  }

  function queueSideTravel(destination, label = "PASSAGE VERS UN AUTRE PLAN") {
    if (!destination?.areaId || !sideAreaById(destination.areaId)) return false;
    game.portalConfirmation = null;
    input.keys.clear();
    game.side.player.vx = 0;
    game.side.player.vy = 0;
    game.pendingTravel = {
      type: "side",
      areaId: destination.areaId,
      spawnId: destination.spawnId,
      swapped: false,
    };
    game.transition = 0.85;
    game.transitionLabel = label;
    game.invulnerable = Math.max(game.invulnerable, 1);
    playAudio("playTransition", "2d");
    return true;
  }

  function updateSideCheckpoint() {
    const checkpoints = currentSideArea()?.checkpoints || [];
    if (!checkpoints.length || game.mode !== "side" || game.status !== "playing") return false;
    const playerCenter = game.side.player.x + game.side.player.w / 2;
    const checkpoint = checkpoints.find((entry) => Math.abs(playerCenter - entry.x) <= 34);
    if (!checkpoint || game.consumedCheckpointIds.has(checkpoint.id)) return false;
    game.activeCheckpointId = checkpoint.id;
    game.consumedCheckpointIds.add(checkpoint.id);
    game.health = Math.min(100, game.health + 20);
    game.playerPosture = 0;
    persistRunProgress({
      checkpoint: checkpoint.id,
      areaId: game.side.areaId,
      spawnId: checkpoint.spawnId,
      health: game.health,
    });
    announce("FOYER SECURISE - PROGRESSION SAUVEGARDEE");
    playAudio("playPickup");
    return true;
  }

  function applyPendingTravel() {
    if (!game.pendingTravel || game.pendingTravel.swapped) return false;
    const travel = game.pendingTravel;
    travel.swapped = true;
    if (travel.type === "side") {
      setCurrentSideArea(travel.areaId, travel.spawnId, true);
      const area = currentSideArea();
      announce(`${String(area?.label || "NOUVELLE ZONE").toUpperCase()} — PLAN PROFOND`);
    }
    return true;
  }

  function isEnemyAlive(enemy) {
    return Boolean(enemy && !enemy.dead && !enemy.dying && enemy.hp > 0);
  }

  function isEnemyVisible(enemy) {
    return Boolean(enemy && !enemy.dead);
  }

  function playAudio(method, ...args) {
    const audio = window.gameAudio;
    if (audio && typeof audio[method] === "function") {
      try { audio[method](...args); } catch (_) { /* Le jeu reste jouable sans Web Audio. */ }
    }
  }

  function setMusicState(state, intensity = 0.45) {
    const normalizedIntensity = clamp(intensity, 0, 1);
    const signature = `${state}:${Math.round(normalizedIntensity * 20)}`;
    if (document.body.dataset.musicState === signature) return;
    document.body.dataset.musicState = signature;
    playAudio("setMusicState", state, { intensity: normalizedIntensity });
  }

  function sideMusicState(area = currentSideArea()) {
    if (game.side?.activeEncounterId) return { state: "boss", intensity: 0.95 };
    if (area?.environmentIndex === 3) return { state: "modern", intensity: 0.72 };
    if (area?.environmentIndex === 4) return { state: "cyber", intensity: 0.78 };
    if ([1, 5, 6].includes(area?.environmentIndex)) {
      return { state: "travel", intensity: 0.5 };
    }
    if (["building", "castle"].includes(area?.zoneKind)) {
      return { state: "interior", intensity: area?.zoneKind === "castle" ? 0.7 : 0.52 };
    }
    return { state: "village", intensity: game.chapter > 0 ? 0.62 : 0.42 };
  }

  function sideFootstepSurface(surface = null) {
    const token = [
      surface?.surfaceProfile,
      surface?.surface,
      surface?.owner,
      surface?.ownerPropId,
    ].filter(Boolean).join(" ").toLowerCase();
    if (/eau|water|flaque|ruisseau/.test(token)) return "water";
    if (/tatami|natte/.test(token)) return "tatami";
    if (/tech|néon|neon|cyber/.test(token)) return "tech";
    if (/asphalt|asphalte|concrete|béton|beton/.test(token)) return "asphalt";
    if (/metal|métal|acier|catwalk|échafaud|echafaud/.test(token)) return "metal";
    if (/pierre|stone|tuile|castle|cour|marche/.test(token)) return "stone";
    if (/bois|wood|cèdre|cedre|toit|charrette|grange|poutre|balcon|coursive/.test(token)) return "wood";
    if (["building", "castle"].includes(currentSideArea()?.zoneKind)) return "wood";
    return "earth";
  }

  function showOnly(screen) {
    [dom.title, dom.briefing, dom.dojo, dom.pause, dom.end]
      .filter(Boolean)
      .forEach((el) => {
        const active = el === screen;
        el.classList.toggle("active", active);
        el.setAttribute?.("aria-hidden", String(!active));
      });
  }

  function refreshContinueState() {
    const canContinue = Boolean(window.KageSave?.hasContinue?.());
    if (dom.continueButton) {
      dom.continueButton.disabled = !canContinue;
      dom.continueButton.dataset.saveAvailable = String(canContinue);
      dom.continueButton.setAttribute?.("aria-disabled", String(!canContinue));
    }
    if (dom.continueNote) {
      const progress = savedProgress();
      dom.continueNote.textContent = canContinue
        ? `Chronique sauvegardee — chapitre ${Math.max(1, Number(progress?.chapter || 0) + 1)}, dernier foyer disponible.`
        : "Aucune chronique sauvegardee.";
    }
    return canContinue;
  }

  function showBriefing() {
    showOnly(dom.briefing);
    game.status = "briefing";
    document.body.dataset.state = "briefing";
    setMusicState("prologue", 0.25);
  }

  async function startGame(options = {}) {
    const continueRequested = options === true || options?.continue === true;
    const selectedLoadout = normalizePlayerLoadout(
      window.KageLoadout?.getCurrentLoadout?.()
      || window.KageSave?.getLoadout?.()
      || game?.loadout,
    );
    game = createGameState(selectedLoadout);
    applyRosterToGame(game);
    if (continueRequested) restoreRunProgress();
    game.status = "playing";
    // Laisse au joueur le temps de reprendre la main après la fermeture du
    // briefing ou le chargement d'un foyer. La première commande écourte
    // cette grâce sans permettre un coup instantané hors champ.
    game.engagementGrace = continueRequested ? 1.8 : 8;
    game.startedAt = performance.now() - game.elapsed * 1000;
    document.body.dataset.state = "playing";
    showOnly(null);
    canvas.focus();
    if (window.gameAudio?.begin) {
      try { await window.gameAudio.begin(); } catch (_) { /* Autorisation navigateur facultative. */ }
    }
    const music = sideMusicState();
    setMusicState(music.state, music.intensity);
    if (!continueRequested) {
      persistRunProgress({
        checkpoint: "kai-forest-entry",
        areaId: game.side.areaId,
        spawnId: "prologue",
        started: true,
      });
    }
    announce(continueRequested
      ? "CHRONIQUE REPRISE AU DERNIER FOYER"
      : "FORÊT DE KAI — LA ROUTE DES CENDRES");
    updateHud();
  }

  function restartGame() {
    document.exitPointerLock?.();
    const canContinue = window.KageSave?.hasContinue?.() || false;
    startGame(canContinue ? { continue: true } : {});
  }

  function continueGame() {
    if (window.KageSave?.hasContinue?.()) return startGame({ continue: true });
    showBriefing();
    announce("AUCUNE CHRONIQUE EN COURS");
    return false;
  }

  function newGame() {
    if (typeof dom.startButton?.click === "function") dom.startButton.click();
    else prepareNewGameBriefing();
    return true;
  }

  function prepareNewGameBriefing() {
    try { window.KageSave?.reset?.(); } catch (_) { /* sauvegarde facultative */ }
    game = createGameState();
    applyRosterToGame(game);
    refreshContinueState();
    showBriefing();
    return true;
  }

  function returnToTitle() {
    document.exitPointerLock?.();
    game.status = "title";
    document.body.dataset.state = "title";
    showOnly(dom.title);
    setMusicState("title", 0.22);
  }

  function togglePause() {
    if (game.status === "playing") {
      game.status = "paused";
      document.body.dataset.state = "paused";
      dom.pause.classList.add("active");
      dom.pause.setAttribute?.("aria-hidden", "false");
      dom.pause.querySelector?.("button:not([disabled])")?.focus?.({ preventScroll: true });
      document.exitPointerLock?.();
    } else if (game.status === "paused") {
      game.status = "playing";
      document.body.dataset.state = "playing";
      dom.pause.classList.remove("active");
      dom.pause.setAttribute?.("aria-hidden", "true");
      lastTime = performance.now();
      canvas.focus();
    }
  }

  function openLoadout() {
    if (!dom.dojo || game.status === "dying" || game.status === "ended") return false;
    if (game.status === "loadout") return true;
    game.loadoutReturnStatus = game.status === "playing"
      ? "playing"
      : (game.status === "paused" ? "paused" : "briefing");
    game.status = "loadout";
    document.body.dataset.state = "loadout";
    showOnly(dom.dojo);
    document.exitPointerLock?.();
    try { window.KageLoadout?.open?.(game.loadout); } catch (_) { /* UI facultative */ }
    return true;
  }

  function closeLoadout() {
    if (game.status !== "loadout") return false;
    const returnStatus = game.loadoutReturnStatus || "briefing";
    if (returnStatus === "playing") {
      game.status = "playing";
      document.body.dataset.state = "playing";
      showOnly(null);
      lastTime = performance.now();
      canvas.focus();
    } else if (returnStatus === "paused") {
      game.status = "paused";
      document.body.dataset.state = "paused";
      showOnly(dom.pause);
    } else {
      game.status = "briefing";
      document.body.dataset.state = "briefing";
      showOnly(dom.briefing);
    }
    return true;
  }

  function announce(text) {
    dom.announce.textContent = text;
    dom.announce.classList.remove("show");
    void dom.announce.offsetWidth;
    dom.announce.classList.add("show");
  }

  function update(dt) {
    game.elapsed = (performance.now() - game.startedAt) / 1000;
    game.invulnerable = Math.max(0, game.invulnerable - dt);
    game.engagementGrace = Math.max(0, game.engagementGrace - dt);
    game.hurtTimer = Math.max(0, game.hurtTimer - dt);
    game.playerStagger = Math.max(0, game.playerStagger - dt);
    game.hitConfirm = Math.max(0, game.hitConfirm - dt);
    const previousAttackTimer = game.attackTimer;
    game.attackTimer = Math.max(0, game.attackTimer - dt);
    game.attackCooldown = Math.max(0, game.attackCooldown - dt);
    game.comboTimer = Math.max(0, game.comboTimer - dt);
    if (game.comboTimer <= 0 && game.attackTimer <= 0) game.comboStep = 0;
    game.guardTimer = Math.max(0, game.guardTimer - dt);
    game.parryTimer = Math.max(0, game.parryTimer - dt);
    game.dodgeTimer = Math.max(0, game.dodgeTimer - dt);
    game.dodgeCooldown = Math.max(0, game.dodgeCooldown - dt);
    game.playerPostureDelay = Math.max(0, game.playerPostureDelay - dt);
    if (game.playerPostureDelay <= 0 && !game.guardHeld && game.guardTimer <= 0) {
      game.playerPosture = Math.max(0, game.playerPosture - 32 * dt);
    }
    game.rangedViewTimer = Math.max(0, game.rangedViewTimer - dt);
    game.shake = Math.max(0, game.shake - dt * 22);
    const previousTransition = game.transition;
    game.transition = Math.max(0, game.transition - dt);
    if (
      game.pendingTravel
      && !game.pendingTravel.swapped
      && previousTransition > 0.425
      && game.transition <= 0.425
    ) {
      applyPendingTravel();
    }
    if (game.pendingTravel?.swapped && game.transition <= 0) {
      game.pendingTravel = null;
    }
    if (game.hitStop > 0) {
      game.hitStop -= dt;
      return;
    }

    if (
      previousAttackTimer > 0
      && !game.attackHitApplied
      && 1 - game.attackTimer / Math.max(0.01, game.attackDuration) >= PLAYER_ATTACK_ACTIVE_AT
    ) {
      resolvePlayerAttack();
    }

    if (game.mode === "side") updateSide(dt);
    else updateFps(dt);
    updateHud();
  }

  function updateSide(dt) {
    const side = game.side;
    const p = side.player;
    const left = key("a") || key("ArrowLeft");
    const right = key("d") || key("ArrowRight");
    const guarding = game.guardHeld || game.guardTimer > 0;
    const dodging = game.dodgeTimer > 0;
    const controlsLocked = game.transition > 0.05 || game.playerStagger > 0 || dodging;
    const sprint = !controlsLocked && !guarding && key("Shift") && game.stamina > 1 && (left || right);
    const speed = guarding ? 54 : (sprint ? 178 : 112);
    const dir = controlsLocked ? 0 : (right ? 1 : 0) - (left ? 1 : 0);

    if (sprint) game.stamina = Math.max(0, game.stamina - 28 * dt);
    else game.stamina = Math.min(100, game.stamina + (guarding ? 6 : 19) * dt);

    if (!dodging) {
      p.vx = approach(
        p.vx,
        dir * speed,
        (game.playerStagger > 0 ? 240 : (dir ? 760 : 980)) * dt,
      );
    }
    if (dir) p.facing = dir;
    if (!controlsLocked && input.jumpQueued && p.grounded) {
      p.vy = -235;
      p.grounded = false;
    }
    input.jumpQueued = false;

    // Les arches de route restent traversables. Une vraie porte de bâtiment
    // conserve en revanche un plan solide jusqu'à l'action E.
    const chapterRules = currentSideRules();
    const previousX = p.x;
    p.x = clamp(
      p.x + p.vx * dt,
      chapterRules.minX,
      Math.min(chapterRules.maxX, side.width - p.w - 6),
    );
    const resolvedDoorX = resolveSideDoorCollision(previousX, p.x, p.w);
    if (resolvedDoorX !== p.x) {
      p.x = resolvedDoorX;
      p.vx = 0;
    }
    const activeEncounter = updateSideEncounterLock();
    const previousBottom = p.y + p.h;
    p.vy += 590 * dt;
    p.y += p.vy * dt;
    p.grounded = false;

    // Les surfaces sont triées du haut vers le bas afin qu'un grand pas de
    // simulation ne traverse pas une plateforme pour finir sur le sol.
    let landedSurface = null;
    for (const platform of currentSideSurfaces()) {
      const overlapsX = p.x + p.w > platform.x && p.x < platform.x + platform.w;
      const crossedTop = previousBottom <= platform.y + 3 && p.y + p.h >= platform.y;
      if (p.vy >= 0 && overlapsX && crossedTop) {
        p.y = platform.y - p.h;
        p.vy = 0;
        p.grounded = true;
        landedSurface = platform;
        break;
      }
    }
    const horizontalTravel = Math.abs(p.x - previousX);
    if (p.grounded && horizontalTravel > 0.01) {
      p.walkDistance = (p.walkDistance || 0) + horizontalTravel;
      p.footstepSurface = sideFootstepSurface(landedSurface);
      const stride = sprint ? 30 : 38;
      const footstepIndex = Math.floor(p.walkDistance / stride);
      if (p.footstepIndex !== footstepIndex) {
        p.footstepIndex = footstepIndex;
        playAudio("playFootstep", p.footstepSurface);
      }
    } else if (p.grounded && Math.abs(p.vx) <= 8) {
      // Un nouveau départ commence toujours sur une pose de contact franche.
      p.walkDistance = 0;
      p.footstepIndex = -1;
    }
    if (p.y > H + 30) damagePlayer(100);

    updateSideEnemies(dt);
    updateDetachedEquipmentHazards(dt);
    updateSideProjectiles(dt);
    updateSidePickups();
    updateSideCheckpoint();
    updateParticles(side.particles, dt);
    const cameraMin = activeEncounter?.bounds
      ? Math.max(chapterRules.cameraMinX, activeEncounter.bounds.x)
      : chapterRules.cameraMinX;
    const cameraMax = activeEncounter?.bounds
      ? Math.min(side.width - W, activeEncounter.bounds.x + activeEncounter.bounds.w - W)
      : side.width - W;
    side.cameraX = clamp(
      approach(side.cameraX, p.x - W * 0.32, 520 * dt),
      cameraMin,
      Math.max(cameraMin, cameraMax),
    );
  }

  function updateMassiveEnemyPhase(enemy, particles, mode) {
    if (
      !isMassiveEnemy(enemy)
      || enemy.dead
      || enemy.dying
      || enemy.hp <= 0
      || enemy.maxHp <= 0
    ) return false;
    const phases = enemy.massiveProfile?.phases || [];
    const ratio = enemy.hp / enemy.maxHp;
    let targetPhase = 1;
    for (let index = 0; index < phases.length; index += 1) {
      const phase = phases[index];
      if (Array.isArray(phase.healthRange)) {
        const high = Number(phase.healthRange[0]);
        const low = Number(phase.healthRange[1]);
        if (ratio <= high && ratio > low) targetPhase = index + 1;
      } else if (
        Number.isFinite(Number(phase.threshold))
        && ratio <= Number(phase.threshold)
      ) {
        targetPhase = index + 1;
      }
    }
    const previousPhase = enemy.massivePhase || 1;
    if (targetPhase <= previousPhase) return false;
    enemy.massivePhase = targetPhase;
    const phaseId = phases[targetPhase - 1]?.id || `phase-${targetPhase}`;
    const detachablePart = enemy.massiveProfile?.detachableParts
      ?.find((part) => part.separateSprite);
    const wasAttached = enemy.detachablePartAttached !== false;
    if (detachablePart?.attachPhase === phaseId) {
      enemy.detachablePartAttached = true;
    }
    if (detachablePart?.detachTransition === `phase-${targetPhase}`) {
      enemy.detachablePartAttached = false;
      if (
        mode === "side"
        && detachablePart.detachedCollision === "hazard"
        && detachablePart.persistsAfterDetach
      ) {
        enemy.detachedEquipment = {
          weaponId: detachablePart.weaponId,
          x: enemy.x + enemy.w * 0.34,
          bottomY: SIDE_GROUND_Y,
          width: Math.max(112, enemy.w * 0.92),
          damage: 14,
          cooldown: 0,
          active: true,
        };
      }
    }
    enemy.attack = 0;
    enemy.attackCooldown = 0.45;
    game.shake = Math.max(game.shake, 12);
    const bossName = String(
      enemy.massiveProfile?.name
      || enemy.modularEntry?.name
      || "BOSS MASSIF",
    ).toUpperCase();
    if (!wasAttached && enemy.detachablePartAttached) {
      announce(`${bossName} DÉPLOIE SON ARME — PHASE ${targetPhase}`);
    } else if (wasAttached && enemy.detachablePartAttached === false) {
      announce(`${bossName} BRISE SON ÉQUIPEMENT — PHASE ${targetPhase}`);
    } else {
      announce(`${bossName} ENTRE EN FURIE — PHASE ${targetPhase}`);
    }
    const screen = mode === "fps";
    const originX = screen ? W / 2 : enemy.x + enemy.w / 2;
    const originY = screen ? H * 0.46 : enemy.y + enemy.h * 0.42;
    for (let index = 0; index < 18; index += 1) {
      particles.push({
        x: originX + (index % 6 - 2.5) * (screen ? 12 : 5),
        y: originY + Math.floor(index / 6) * (screen ? 8 : 4),
        vx: (index % 6 - 2.5) * (screen ? 18 : 12),
        vy: -35 - Math.floor(index / 6) * 12,
        gravity: 120,
        drag: 0.96,
        life: 0.45 + index % 3 * 0.08,
        max: 0.62,
        color: index % 2 ? "#d6b66b" : "#817268",
        screen,
        kind: "spark",
      });
    }
    return true;
  }

  function activeMassivePhase(enemy) {
    const phases = enemy.massiveProfile?.phases || [];
    return phases[Math.max(0, (enemy.massivePhase || 1) - 1)] || null;
  }

  function sideEnemyCombatProfile(enemy) {
    const family = enemy.behaviorFamily || enemyBehaviorFamily(enemy);
    if (isMassiveEnemy(enemy)) {
      const phase = activeMassivePhase(enemy);
      const enraged = (enemy.massivePhase || 1) >= 2;
      const phaseSpeed = Number(phase?.speedMultiplier) || 1;
      const pattern = String(phase?.pattern || "");
      const charge = /charge|rush|advance/.test(pattern);
      return {
        family: "charger",
        speed: (enraged ? 45 : 32) * phaseSpeed,
        damage: enraged ? 25 : 21,
        postureDamage: enraged ? 44 : 36,
        attackDuration: enraged ? 0.72 : 1.02,
        activeAt: enraged ? 0.48 : 0.64,
        recovery: enraged ? 0.58 : 0.92,
        reach: charge ? (enraged ? 118 : 104) : (enraged ? 92 : 82),
        minRange: 0,
        ranged: false,
        charge,
        attackKind: charge ? "charge" : "smash",
        pattern,
      };
    }
    const elite = enemy.maxHp >= 3;
    if (family === "ranged") {
      return {
        family, speed: 18, damage: elite ? 14 : 10, postureDamage: 18,
        attackDuration: 0.96, activeAt: 0.64, recovery: 1.2,
        reach: 178, minRange: 72, ranged: true, attackKind: "ranged",
      };
    }
    if (family === "spirit") {
      return {
        family, speed: 25, damage: elite ? 16 : 12, postureDamage: 24,
        attackDuration: 0.82, activeAt: 0.58, recovery: 0.96,
        reach: 132, minRange: 48, ranged: true, attackKind: "spirit",
      };
    }
    if (family === "shield") {
      return {
        family, speed: 17, damage: elite ? 19 : 15, postureDamage: 34,
        attackDuration: 0.78, activeAt: 0.6, recovery: 0.86,
        reach: 27, minRange: 0, ranged: false, attackKind: "shield-bash",
      };
    }
    if (family === "charger") {
      return {
        family, speed: elite ? 38 : 35, damage: elite ? 19 : 14, postureDamage: 30,
        attackDuration: 0.74, activeAt: 0.55, recovery: 0.92,
        reach: elite ? 52 : 43, minRange: 0, ranged: false,
        charge: true, attackKind: "charge",
      };
    }
    return {
      family, speed: elite ? 22 : 29, damage: elite ? 16 : 11,
      postureDamage: elite ? 28 : 20,
      attackDuration: elite ? 0.64 : 0.56,
      activeAt: elite ? 0.54 : 0.48,
      recovery: elite ? 0.68 : 0.82,
      reach: elite ? 22 : 18,
      minRange: 0,
      ranged: false,
      attackKind: "melee",
    };
  }

  function applyAuthoredCombatStats(enemy, profile) {
    const stats = enemy.authoredStats;
    if (!stats) return profile;
    const speedMultiplier = stats.speed
      ? clamp(stats.speed, 0.55, 1.65)
      : 1;
    return {
      ...profile,
      speed: profile.speed * speedMultiplier,
      damage: stats.damage
        ? clamp(Math.round(stats.damage), 6, 60)
        : profile.damage,
    };
  }

  function legacyCanOccupySideEnemy(enemy, candidateX) {
    const rules = currentSideRules();
    if (candidateX < rules.minX || candidateX + enemy.w > rules.maxX) return false;
    const candidateTop = enemy.y;
    const candidateBottom = enemy.y + enemy.h;
    const overlapsOwnedGroundObstacle = currentSidePlatforms().some((platform) =>
      platform.ownerPropId
      && candidateX + enemy.w > platform.x
      && candidateX < platform.x + platform.w
      && candidateBottom > platform.y - 2
      && candidateTop < platform.y + platform.h + 2);
    if (overlapsOwnedGroundObstacle) return false;
    // Les plateformes sont à sens unique et les props de premier plan sont
    // décoratifs : Akio comme ses adversaires les traversent horizontalement.
    // Les bloquer pour les ennemis seulement créait des zones de combat mortes.
    const candidateCenter = candidateX + enemy.w / 2;
    return game.side.enemies.every((other) => {
      if (other === enemy || !isEnemyVisible(other)) return true;
      const otherCenter = other.x + other.w / 2;
      const spacing = (enemy.w + other.w) / 2 + 5;
      return Math.abs(candidateCenter - otherCenter) >= spacing;
    });
  }

  function legacyUpdateSideEnemies(dt) {
    const p = game.side.player;
    for (const enemy of game.side.enemies) {
      if (enemy.dead) continue;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.hurtTimer = Math.max(0, enemy.hurtTimer - dt);
      enemy.postureDelay = Math.max(0, (enemy.postureDelay || 0) - dt);
      enemy.postureBrokenTimer = Math.max(0, (enemy.postureBrokenTimer || 0) - dt);
      if (enemy.postureDelay <= 0 && enemy.posture > 0) {
        enemy.posture = Math.max(0, enemy.posture - (enemy.boss ? 12 : 24) * dt);
      }
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      updateMassiveEnemyPhase(enemy, game.side.particles, "side");
      enemy.knockbackVx = approach(enemy.knockbackVx, 0, 420 * dt);
      if (Math.abs(enemy.knockbackVx) > 0.1) {
        const rules = currentSideRules();
        const candidateX = clamp(
          enemy.x + enemy.knockbackVx * dt,
          rules.minX,
          Math.min(rules.maxX - enemy.w, game.side.width - enemy.w - 8),
        );
        if (canOccupySideEnemy(enemy, candidateX)) enemy.x = candidateX;
      }

      if (enemy.dying) {
        enemy.deathTimer = Math.max(0, enemy.deathTimer - dt);
        if (enemy.deathTimer <= 0) enemy.dead = true;
        continue;
      }
      if (enemy.hurtTimer > 0) {
        enemy.attack = 0;
        continue;
      }

      const profile = applyAuthoredCombatStats(enemy, sideEnemyCombatProfile(enemy));
      if (enemy.attack > 0) {
        enemy.attack = Math.max(0, enemy.attack - dt);
        const progress = 1 - enemy.attack / enemy.attackDuration;
        if (!enemy.attackHitApplied && progress >= profile.activeAt) {
          enemy.attackHitApplied = true;
          const dx = p.x + p.w / 2 - (enemy.x + enemy.w / 2);
          const feetGap = Math.abs((p.y + p.h) - (enemy.y + enemy.h));
          if (Math.abs(dx) <= profile.reach + 6 && feetGap < 55) {
            const damaged = damagePlayer(profile.damage, {
              attacker: enemy,
              material: profile.family === "spirit" ? "spirit" : enemy.impactMaterial,
              mode: "side",
              direction: Math.sign(dx) || enemy.facing,
            });
            if (damaged) playAudio("playZombie");
          }
        }
        continue;
      }

      const dx = p.x + p.w / 2 - (enemy.x + enemy.w / 2);
      const feetGap = Math.abs((p.y + p.h) - (enemy.y + enemy.h));
      if (Math.abs(dx) < (isMassiveEnemy(enemy) ? 260 : 190) && feetGap < 55) {
        enemy.facing = Math.sign(dx) || enemy.facing;
        if (Math.abs(dx) > profile.reach) {
          const candidateX = enemy.x + enemy.facing * profile.speed * dt;
          if (canOccupySideEnemy(enemy, candidateX)) enemy.x = candidateX;
        } else if (enemy.attackCooldown <= 0 && game.transition <= 0.05) {
          enemy.attackDuration = profile.attackDuration;
          enemy.attack = profile.attackDuration;
          enemy.attackHitApplied = false;
          enemy.attackCooldown = profile.attackDuration + profile.recovery;
        }
      }
    }
  }

  function ensureSideEnemyAi(enemy) {
    if (enemy.ai) return enemy.ai;
    const definition = {
      x: enemy.x,
      y: enemy.y,
      facing: enemy.facing,
      boss: enemy.boss,
      platformId: enemy.platformId,
    };
    enemy.ai = createSideEnemyAi(
      definition,
      currentSideArea(),
      enemy.w,
      enemy.h,
      Math.round(Math.abs(enemy.seed || 0)),
      isMassiveEnemy(enemy),
    );
    return enemy.ai;
  }

  function transitionEnemyAi(enemy, nextState, reason = "") {
    const ai = ensureSideEnemyAi(enemy);
    if (ai.state === nextState) return false;
    ai.previousState = ai.state;
    ai.state = nextState;
    ai.stateTime = 0;
    ai.reason = reason;
    return true;
  }

  function sideEnemyCanSeePlayer(enemy, player, ai) {
    const enemyCenter = enemy.x + enemy.w / 2;
    const playerCenter = player.x + player.w / 2;
    const dx = playerCenter - enemyCenter;
    const feetGap = Math.abs((player.y + player.h) - (enemy.y + enemy.h));
    const inFront = Math.sign(dx) === enemy.facing
      || Math.abs(dx) <= Math.max(28, enemy.w * 0.7);
    return feetGap < 55 && inFront && Math.abs(dx) <= ai.sight;
  }

  function sideEnemyCanHearPlayer(enemy, player, ai) {
    const distance = Math.abs(
      player.x + player.w / 2 - (enemy.x + enemy.w / 2),
    );
    const noisy = Math.abs(player.vx) > 92
      || game.attackTimer > 0
      || game.rangedViewTimer > 0;
    return noisy && distance <= ai.hearing;
  }

  function recordEnemyStimulus(enemy, targetX, reason = "perception") {
    const ai = ensureSideEnemyAi(enemy);
    ai.lastKnownX = Number(targetX);
    ai.memoryTime = ai.memoryDuration;
    if (!["attack", "hurt", "dying"].includes(ai.state)) {
      transitionEnemyAi(enemy, "pursue", reason);
    }
  }

  function sideEnemyNavigationBand(enemy) {
    const ai = ensureSideEnemyAi(enemy);
    const rules = currentSideRules();
    const platform = sidePlatformById(currentSideArea(), ai.platformId);
    let minX = rules.minX;
    let maxX = Math.min(rules.maxX - enemy.w, game.side.width - enemy.w - 8);
    if (platform) {
      minX = Math.max(minX, platform.x + 2);
      maxX = Math.min(maxX, platform.x + platform.w - enemy.w - 2);
    }
    const encounter = currentSideMassiveEncounter();
    if (
      encounter?.bounds
      && (
        enemy.encounterId === encounter.id
        || game.side.activeEncounterId === encounter.id
      )
    ) {
      minX = Math.max(minX, encounter.bounds.x + 12);
      maxX = Math.min(maxX, encounter.bounds.x + encounter.bounds.w - enemy.w - 12);
    }
    return { minX, maxX: Math.max(minX, maxX) };
  }

  function canOccupySideEnemy(enemy, candidateX) {
    const band = sideEnemyNavigationBand(enemy);
    if (candidateX < band.minX || candidateX > band.maxX) return false;
    const candidateRight = candidateX + enemy.w;
    const crossesClosedSolidDoor = currentSidePortals()
      .filter((portal) =>
        portal.collision === "solidDoor"
        && sidePortalBlocksMovement(portal))
      .some((portal) => {
        const barrier = sidePortalBarrier(portal);
        return candidateX < barrier.right && candidateRight > barrier.left;
      });
    if (crossesClosedSolidDoor) return false;
    const candidateTop = enemy.y;
    const candidateBottom = enemy.y + enemy.h;
    const crossesOwnedGroundObstacle = currentSidePlatforms().some((platform) =>
      platform.ownerPropId
      && candidateX < platform.x + platform.w
      && candidateRight > platform.x
      && candidateBottom > platform.y - 2
      && candidateTop < platform.y + platform.h + 2);
    if (crossesOwnedGroundObstacle) return false;
    const candidateCenter = candidateX + enemy.w / 2;
    return game.side.enemies.every((other) => {
      if (other === enemy || !isEnemyVisible(other)) return true;
      const otherCenter = other.x + other.w / 2;
      const spacing = (enemy.w + other.w) / 2 + 5;
      return Math.abs(candidateCenter - otherCenter) >= spacing;
    });
  }

  function moveSideEnemyToward(enemy, targetX, speed, dt) {
    const ai = ensureSideEnemyAi(enemy);
    const center = enemy.x + enemy.w / 2;
    const direction = Math.sign(targetX - center);
    if (!direction) {
      ai.moveVelocity = 0;
      return false;
    }
    enemy.facing = direction;
    const previousX = enemy.x;
    const candidateX = enemy.x + direction * speed * dt;
    if (canOccupySideEnemy(enemy, candidateX)) {
      enemy.x = candidateX;
      ai.moveVelocity = (enemy.x - previousX) / Math.max(dt, 0.001);
      ai.stuckTime = 0;
      return true;
    }
    ai.moveVelocity = 0;
    ai.stuckTime += dt;
    return false;
  }

  function updateSideEnemyPatrol(enemy, profile, dt) {
    const ai = ensureSideEnemyAi(enemy);
    if (ai.waitTime > 0) {
      ai.waitTime = Math.max(0, ai.waitTime - dt);
      ai.moveVelocity = 0;
      return;
    }
    const targetX = ai.patrolDirection > 0 ? ai.patrolMaxX : ai.patrolMinX;
    if (Math.abs(enemy.x - targetX) <= 3) {
      ai.patrolDirection *= -1;
      enemy.facing = ai.patrolDirection;
      ai.waitTime = (SIDE_AI_PROFILES[ai.profile]?.patrolWait || 0.75)
        + (Math.abs(enemy.seed || 0) % 3) * 0.12;
      ai.moveVelocity = 0;
      return;
    }
    moveSideEnemyToward(enemy, targetX + enemy.w / 2, profile.speed * 0.62, dt);
  }

  function updateSideEnemies(dt) {
    const player = game.side.player;
    for (const enemy of game.side.enemies) {
      if (enemy.dead) continue;
      const ai = ensureSideEnemyAi(enemy);
      ai.stateTime += dt;
      ai.moveVelocity = 0;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.hurtTimer = Math.max(0, enemy.hurtTimer - dt);
      enemy.postureDelay = Math.max(0, (enemy.postureDelay || 0) - dt);
      enemy.postureBrokenTimer = Math.max(0, (enemy.postureBrokenTimer || 0) - dt);
      if (enemy.postureDelay <= 0 && enemy.posture > 0) {
        enemy.posture = Math.max(0, enemy.posture - (enemy.boss ? 12 : 24) * dt);
      }
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      updateMassiveEnemyPhase(enemy, game.side.particles, "side");
      enemy.knockbackVx = approach(enemy.knockbackVx, 0, 420 * dt);
      if (Math.abs(enemy.knockbackVx) > 0.1) {
        const band = sideEnemyNavigationBand(enemy);
        const candidateX = clamp(
          enemy.x + enemy.knockbackVx * dt,
          band.minX,
          band.maxX,
        );
        if (canOccupySideEnemy(enemy, candidateX)) enemy.x = candidateX;
      }

      if (enemy.dying) {
        transitionEnemyAi(enemy, "dying", "fatal-hit");
        enemy.deathTimer = Math.max(0, enemy.deathTimer - dt);
        if (enemy.deathTimer <= 0) {
          enemy.dead = true;
          transitionEnemyAi(enemy, "dead", "death-animation-complete");
        }
        continue;
      }
      if (enemy.hurtTimer > 0) {
        transitionEnemyAi(enemy, "hurt", "impact");
        if (!enemy.boss || enemy.postureBrokenTimer > 0) enemy.attack = 0;
        continue;
      }
      if (ai.state === "hurt") {
        transitionEnemyAi(
          enemy,
          Number.isFinite(ai.lastKnownX) ? "pursue" : "returnHome",
          "recovered",
        );
      }

      const profile = applyAuthoredCombatStats(enemy, sideEnemyCombatProfile(enemy));
      const playerCenter = player.x + player.w / 2;
      const enemyCenter = enemy.x + enemy.w / 2;
      const dx = playerCenter - enemyCenter;
      const feetGap = Math.abs((player.y + player.h) - (enemy.y + enemy.h));
      const playerCanBeEngaged = game.engagementGrace <= 0;
      ai.targetVisible = playerCanBeEngaged && sideEnemyCanSeePlayer(enemy, player, ai);
      ai.targetAudible = playerCanBeEngaged && sideEnemyCanHearPlayer(enemy, player, ai);
      if (ai.targetVisible || ai.targetAudible) {
        recordEnemyStimulus(
          enemy,
          playerCenter,
          ai.targetVisible ? "sight" : "hearing",
        );
      } else if (ai.memoryTime > 0) {
        ai.memoryTime = Math.max(0, ai.memoryTime - dt);
      }

      if (enemy.attack > 0) {
        transitionEnemyAi(enemy, "attack", "attack-active");
        enemy.attack = Math.max(0, enemy.attack - dt);
        const progress = 1 - enemy.attack / enemy.attackDuration;
        if (profile.charge && progress < profile.activeAt) {
          moveSideEnemyToward(enemy, playerCenter, profile.speed * 2.25, dt);
        }
        if (!enemy.attackHitApplied && progress >= profile.activeAt) {
          enemy.attackHitApplied = true;
          const targetStillInFront = Math.sign(dx) === enemy.facing
            || Math.abs(dx) < Math.max(10, enemy.w * 0.7);
          if (
            targetStillInFront
            && Math.abs(dx) <= profile.reach + 6
            && feetGap < 55
          ) {
            const damaged = damagePlayer(profile.damage, {
              attacker: enemy,
              material: profile.family === "spirit" ? "spirit" : enemy.impactMaterial,
              mode: "side",
              direction: Math.sign(dx) || enemy.facing,
              postureDamage: profile.postureDamage,
              attackKind: profile.attackKind,
            });
            if (damaged) playAudio("playZombie");
          }
        }
        if (enemy.attack <= 0) {
          transitionEnemyAi(enemy, "pursue", "attack-recovery");
        }
        continue;
      }

      if (
        ai.state === "pursue"
        && !ai.targetVisible
        && !ai.targetAudible
        && ai.memoryTime <= 0
      ) {
        transitionEnemyAi(enemy, "investigate", "lost-target");
        ai.waitTime = 1.15;
      }

      if (ai.state === "pursue") {
        const targetX = ai.targetVisible || ai.targetAudible
          ? playerCenter
          : ai.lastKnownX;
        const beyondLeash = !isMassiveEnemy(enemy)
          && Math.abs(enemy.x - ai.homeX) > ai.leash
          && !ai.targetVisible;
        if (beyondLeash || !Number.isFinite(targetX)) {
          transitionEnemyAi(enemy, "returnHome", "leash");
        } else {
          enemy.facing = Math.sign(targetX - enemyCenter) || enemy.facing;
          const distance = Math.abs(dx);
          if (
            profile.ranged
            && distance < profile.minRange
            && feetGap < 55
          ) {
            const retreatTarget = enemyCenter - Math.sign(dx || enemy.facing) * 84;
            moveSideEnemyToward(enemy, retreatTarget, profile.speed * 1.18, dt);
          } else if (distance <= profile.reach && feetGap < 55 && ai.targetVisible) {
            if (enemy.attackCooldown <= 0 && game.transition <= 0.05) {
              enemy.attackDuration = profile.attackDuration;
              enemy.attack = profile.attackDuration;
              enemy.attackKind = profile.attackKind;
              enemy.attackHitApplied = false;
              enemy.attackCooldown = profile.attackDuration + profile.recovery;
              transitionEnemyAi(enemy, "attack", "in-range");
            }
          } else {
            moveSideEnemyToward(enemy, targetX, profile.speed, dt);
          }
        }
      } else if (ai.state === "investigate") {
        if (Number.isFinite(ai.lastKnownX) && Math.abs(enemyCenter - ai.lastKnownX) > 7) {
          moveSideEnemyToward(enemy, ai.lastKnownX, profile.speed * 0.74, dt);
        } else {
          ai.waitTime = Math.max(0, ai.waitTime - dt);
          if (ai.waitTime <= 0) {
            transitionEnemyAi(enemy, "returnHome", "investigation-complete");
          }
        }
      } else if (ai.state === "returnHome") {
        const homeCenter = ai.homeX + enemy.w / 2;
        if (Math.abs(enemy.x - ai.homeX) <= 3) {
          enemy.x = ai.homeX;
          enemy.facing = ai.homeFacing;
          ai.lastKnownX = null;
          transitionEnemyAi(enemy, "patrol", "home");
        } else {
          moveSideEnemyToward(enemy, homeCenter, profile.speed * 0.7, dt);
        }
      } else if (ai.state === "idle") {
        if (!isMassiveEnemy(enemy) && ai.stateTime > 0.65) {
          transitionEnemyAi(enemy, "patrol", "idle-complete");
        }
      } else {
        updateSideEnemyPatrol(enemy, profile, dt);
      }

      if (ai.stuckTime > 0.72 && ai.state === "patrol") {
        ai.patrolDirection *= -1;
        ai.stuckTime = 0;
        ai.waitTime = 0.4;
      }
      ai.lastX = enemy.x;
    }
    if (game.status === "playing" && game.mode === "side") {
      const activeBoss = game.side.enemies.some((enemy) =>
        isEnemyAlive(enemy) && (enemy.boss || isMassiveEnemy(enemy))
        && ["pursue", "attack", "hurt"].includes(enemy.ai?.state));
      const alerted = game.side.enemies.some((enemy) =>
        isEnemyAlive(enemy)
        && ["pursue", "attack", "hurt"].includes(enemy.ai?.state));
      if (activeBoss) setMusicState("boss", 0.94);
      else if (alerted) setMusicState("combat", 0.7);
      else {
        const music = sideMusicState();
        setMusicState(music.state, music.intensity);
      }
    }
  }

  function updateSideProjectiles(dt) {
    const side = game.side;
    for (const projectile of side.projectiles) {
      projectile.x += projectile.vx * dt;
      projectile.life -= dt;
      for (const enemy of side.enemies) {
        if (!isEnemyAlive(enemy) || projectile.dead) continue;
        const horizontalHit = Math.abs(projectile.x - (enemy.x + enemy.w / 2))
          < enemy.w / 2 + 13;
        const verticalHit = projectile.y >= enemy.y - 10
          && projectile.y <= enemy.y + enemy.h + 10;
        if (horizontalHit && verticalHit) {
          projectile.dead = true;
          hitEnemy(enemy, projectile.damage || 3, {
            mode: "side",
            ranged: true,
            postureDamage: 10,
          });
        }
      }
    }
    side.projectiles = side.projectiles.filter((p) => p.life > 0 && !p.dead);
  }

  function updateDetachedEquipmentHazards(dt) {
    const player = game.side.player;
    const playerCenter = player.x + player.w / 2;
    for (const enemy of game.side.enemies) {
      const hazard = enemy.detachedEquipment;
      if (!hazard?.active) continue;
      hazard.cooldown = Math.max(0, Number(hazard.cooldown) - dt);
      const halfWidth = Math.max(30, Number(hazard.width) * 0.38);
      const grounded = Math.abs(player.y + player.h - hazard.bottomY) <= 16;
      if (
        grounded
        && hazard.cooldown <= 0
        && Math.abs(playerCenter - hazard.x) <= halfWidth
      ) {
        const damaged = damagePlayer(hazard.damage || 14, {
          mode: "side",
          postureDamage: 22,
          knockback: playerCenter < hazard.x ? -62 : 62,
          source: "detached-equipment",
        });
        if (damaged) {
          hazard.cooldown = 0.9;
          announce("LE JOUG BRISÉ LACÈRE LE SOL");
        }
      }
    }
  }

  function updateSidePickups() {
    const p = game.side.player;
    for (const item of game.side.pickups) {
      if (!item.taken && Math.abs(item.x - (p.x + p.w / 2)) < 20 && Math.abs(item.y - p.y) < 36) {
        item.taken = true;
        game.takenPickupIds.add(item.sourceId);
        let pickupMessage = "DÉCOCTION DE YOMOGI +28";
        if (item.kind === "ammo") {
          const rangedWeapon = currentRangedWeapon();
          const ammoType = rangedAmmoType(rangedWeapon);
          game.ammo = Math.min(
            rangedAmmoCapacity(rangedWeapon),
            game.ammo + (item.amount || 4),
          );
          game.ammoByType[ammoType] = game.ammo;
          persistAmmoMap();
          pickupMessage = `PROJECTILES +${item.amount || 4}`;
        } else if (["tamahagane", "yomiAsh"].includes(item.kind)) {
          const profile = window.KageSave?.load?.();
          if (profile?.currencies) {
            profile.currencies[item.kind] = Math.max(
              0,
              Number(profile.currencies[item.kind] || 0) + (item.amount || 1),
            );
            window.KageSave.save(profile);
          }
          pickupMessage = item.kind === "tamahagane"
            ? "TAMAHAGANE RÉCUPÉRÉ"
            : "CENDRE DE YOMI RÉCUPÉRÉE";
        } else {
          game.health = Math.min(100, game.health + (item.amount || 28));
        }
        game.score += 100;
        playAudio("playPickup");
        announce(pickupMessage);
        persistRunProgress();
      }
    }
  }

  function updateFps(dt) {
    const mission = currentMission();
    const p = mission.player;
    const controlsLocked = game.transition > 0.05 || game.playerStagger > 0;
    const forward = controlsLocked
      ? 0
      : (key("w") || key("ArrowUp") ? 1 : 0) - (key("s") || key("ArrowDown") ? 1 : 0);
    const strafe = controlsLocked ? 0 : (key("d") ? 1 : 0) - (key("a") ? 1 : 0);
    const turning = controlsLocked
      ? 0
      : (key("ArrowRight") ? 1 : 0) - (key("ArrowLeft") ? 1 : 0);
    const guarding = game.guardHeld || game.guardTimer > 0;
    const sprint = !guarding && key("Shift") && game.stamina > 1 && (forward || strafe);
    const speed = (sprint ? 3.55 : 2.25) * dt;

    p.angle = normalizeAngle(p.angle + turning * 1.9 * dt);
    if (sprint) game.stamina = Math.max(0, game.stamina - 30 * dt);
    else game.stamina = Math.min(100, game.stamina + (guarding ? 5 : 17) * dt);

    const mx = Math.cos(p.angle) * forward * speed + Math.cos(p.angle + Math.PI / 2) * strafe * speed;
    const my = Math.sin(p.angle) * forward * speed + Math.sin(p.angle + Math.PI / 2) * strafe * speed;
    moveFpsPlayer(mission, mx, my);
    // La courte transition sert de sas visuel : aucun ennemi ne peut frapper
    // avant que le joueur ait réellement récupéré le contrôle de la caméra.
    if (game.transition <= 0.05) updateFpsEnemies(mission, dt);
    updateParticles(mission.particles, dt);
  }

  function applyFpsLookDelta(deltaX, viewportWidth = W) {
    if (
      game.status !== "playing"
      || game.mode !== "fps"
      || game.transition > 0.05
      || game.playerStagger > 0
    ) return false;
    const responsiveScale = clamp(W / Math.max(320, Number(viewportWidth) || W), 0.55, 1.35);
    const turn = clamp(Number(deltaX) || 0, -64, 64)
      * FPS_TOUCH_LOOK_SENSITIVITY
      * responsiveScale;
    currentMission().player.angle = normalizeAngle(currentMission().player.angle + turn);
    return Math.abs(turn) > 0;
  }

  function moveFpsPlayer(mission, dx, dy) {
    const p = mission.player;
    if (canOccupyFps(mission, p.x + dx, p.y, 0.19, null)) p.x += dx;
    if (canOccupyFps(mission, p.x, p.y + dy, 0.19, null)) p.y += dy;
  }

  function isWalkable(map, x, y, radius = 0) {
    const pts = [[x - radius, y - radius], [x + radius, y - radius], [x - radius, y + radius], [x + radius, y + radius]];
    return pts.every(([px, py]) => {
      const row = map[Math.floor(py)];
      const cell = row?.[Math.floor(px)];
      return isFpsWalkableCell(cell);
    });
  }

  function fpsEnemyRadius(enemy) {
    if (isMassiveEnemy(enemy)) return 0.62;
    return enemy?.boss ? 0.4 : 0.28;
  }

  function canOccupyFps(mission, x, y, radius, movingEnemy) {
    if (!isWalkable(mission.map, x, y, radius)) return false;
    if (
      movingEnemy
      && Math.hypot(x - mission.player.x, y - mission.player.y) < radius + 0.24
    ) return false;
    return mission.enemies.every((other) => {
      if (other === movingEnemy || !isEnemyAlive(other)) return true;
      const minimum = radius + fpsEnemyRadius(other);
      return Math.hypot(x - other.x, y - other.y) >= minimum;
    });
  }

  function fpsEngagementGoal(mission, enemy, profile) {
    const slot = Math.abs(Math.round(enemy.engagementSlot ?? enemy.spriteIndex ?? 0));
    const angle = Number.isFinite(enemy.engagementAngle)
      ? enemy.engagementAngle
      : FPS_ENGAGEMENT_ANGLES[slot % FPS_ENGAGEMENT_ANGLES.length];
    const radius = profile.ranged
      ? clamp(profile.minRange * 0.82, 1.3, 2.2)
      : profile.reach * 0.92;
    const enemyRadius = fpsEnemyRadius(enemy);
    const angleOffsets = [0, 0.42, -0.42, 0.82, -0.82, 1.24, -1.24];
    const radiusScales = [1, 0.78, 1.18];
    for (const radiusScale of radiusScales) {
      for (const angleOffset of angleOffsets) {
        const candidateAngle = angle + angleOffset;
        const x = mission.player.x + Math.cos(candidateAngle) * radius * radiusScale;
        const y = mission.player.y + Math.sin(candidateAngle) * radius * radiusScale;
        if (isWalkable(mission.map, x, y, enemyRadius)) return { x, y };
      }
    }
    return null;
  }

  function moveFpsEnemyWithSteering(mission, enemy, goalDx, goalDy, pace) {
    const goalLength = Math.max(0.001, Math.hypot(goalDx, goalDy));
    const baseX = goalDx / goalLength;
    const baseY = goalDy / goalLength;
    const radius = fpsEnemyRadius(enemy);
    let repelX = 0;
    let repelY = 0;
    for (const other of mission.enemies) {
      if (other === enemy || !isEnemyAlive(other)) continue;
      const awayX = enemy.x - other.x;
      const awayY = enemy.y - other.y;
      const separation = Math.hypot(awayX, awayY);
      const comfort = radius + fpsEnemyRadius(other) + 0.16;
      if (separation <= 0.001 || separation >= comfort) continue;
      const strength = (comfort - separation) / comfort;
      repelX += awayX / separation * strength;
      repelY += awayY / separation * strength;
    }

    const combinedLength = Math.max(0.001, Math.hypot(baseX + repelX * 1.35, baseY + repelY * 1.35));
    const combined = {
      x: (baseX + repelX * 1.35) / combinedLength,
      y: (baseY + repelY * 1.35) / combinedLength,
    };
    const flankSign = (Math.abs(Math.round(enemy.engagementSlot ?? 0)) % 2) * 2 - 1;
    const flankAngle = flankSign * 0.55;
    const alternateAngle = -flankAngle;
    const candidates = [
      combined,
      {
        x: baseX * Math.cos(flankAngle) - baseY * Math.sin(flankAngle),
        y: baseX * Math.sin(flankAngle) + baseY * Math.cos(flankAngle),
      },
      {
        x: baseX * Math.cos(alternateAngle) - baseY * Math.sin(alternateAngle),
        y: baseX * Math.sin(alternateAngle) + baseY * Math.cos(alternateAngle),
      },
      { x: baseX, y: baseY },
    ];

    for (const candidate of candidates) {
      const nx = enemy.x + candidate.x * pace;
      const ny = enemy.y + candidate.y * pace;
      if (canOccupyFps(mission, nx, ny, radius, enemy)) {
        enemy.x = nx;
        enemy.y = ny;
        return true;
      }
      let slid = false;
      if (canOccupyFps(mission, nx, enemy.y, radius, enemy)) {
        enemy.x = nx;
        slid = true;
      }
      if (canOccupyFps(mission, enemy.x, ny, radius, enemy)) {
        enemy.y = ny;
        slid = true;
      }
      if (slid) return true;
    }
    return false;
  }

  function fpsFrontlineBlocked(mission, enemy) {
    const p = mission.player;
    const enemyDx = enemy.x - p.x;
    const enemyDy = enemy.y - p.y;
    const enemyDistance = Math.hypot(enemyDx, enemyDy);
    const enemyBearing = Math.atan2(enemyDy, enemyDx);
    return mission.enemies.some((other) => {
      if (other === enemy || !isEnemyAlive(other)) return false;
      const otherDx = other.x - p.x;
      const otherDy = other.y - p.y;
      const otherDistance = Math.hypot(otherDx, otherDy);
      if (otherDistance >= enemyDistance - 0.04) return false;
      const bearingGap = Math.abs(normalizeAngle(Math.atan2(otherDy, otherDx) - enemyBearing));
      return bearingGap < 0.24 && enemyDistance - otherDistance < 1.08;
    });
  }

  function fpsEnemyCombatProfile(enemy) {
    const family = enemy.behaviorFamily || enemyBehaviorFamily(enemy);
    if (isMassiveEnemy(enemy)) {
      const phase = activeMassivePhase(enemy);
      const enraged = (enemy.massivePhase || 1) >= 2;
      const phaseSpeed = Number(phase?.speedMultiplier) || 1;
      const pattern = String(phase?.pattern || "");
      const charge = /charge|rush|advance/.test(pattern);
      return {
        family: "charger",
        speed: (enraged ? 0.84 : 0.58) * phaseSpeed,
        damage: enraged ? 25 : 21,
        postureDamage: enraged ? 46 : 38,
        attackDuration: enraged ? 0.76 : 1.04,
        activeAt: enraged ? 0.5 : 0.62,
        recovery: enraged ? 0.54 : 0.9,
        reach: charge ? (enraged ? 1.46 : 1.32) : (enraged ? 1.14 : 1.06),
        minRange: 0,
        ranged: false,
        charge,
        attackKind: charge ? "charge" : "smash",
        pattern,
      };
    }
    if (enemy.boss) {
      return {
        family,
        speed: 0.7,
        damage: 19,
        postureDamage: 38,
        attackDuration: 0.92,
        activeAt: 0.58,
        recovery: 0.72,
        reach: 0.96,
        minRange: 0,
        ranged: false,
        attackKind: family === "shield" ? "shield-bash" : "boss-strike",
      };
    }
    if (family === "ranged") {
      return {
        family, speed: 0.56, damage: 11, postureDamage: 18,
        attackDuration: 1.02, activeAt: 0.66, recovery: 1.25,
        reach: 5.8, minRange: 2.45, ranged: true, attackKind: "ranged",
      };
    }
    if (family === "spirit") {
      return {
        family, speed: 0.7, damage: 13, postureDamage: 24,
        attackDuration: 0.86, activeAt: 0.58, recovery: 1.02,
        reach: 4.25, minRange: 1.65, ranged: true, attackKind: "spirit",
      };
    }
    if (family === "shield") {
      return {
        family, speed: 0.58, damage: 16, postureDamage: 34,
        attackDuration: 0.82, activeAt: 0.61, recovery: 0.88,
        reach: 0.82, minRange: 0, ranged: false, attackKind: "shield-bash",
      };
    }
    if (family === "charger") {
      return {
        family, speed: 1.12, damage: 15, postureDamage: 31,
        attackDuration: 0.76, activeAt: 0.56, recovery: 0.94,
        reach: 1.08, minRange: 0, ranged: false, charge: true, attackKind: "charge",
      };
    }
    return {
      family,
      speed: 0.92,
      damage: 10,
      postureDamage: 20,
      attackDuration: 0.68,
      activeAt: 0.5,
      recovery: 0.86,
      reach: 0.72,
      minRange: 0,
      ranged: false,
      attackKind: "melee",
    };
  }

  function legacyUpdateFpsEnemies(mission, dt) {
    const p = mission.player;
    for (const enemy of mission.enemies) {
      if (enemy.dead) continue;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.hurtTimer = Math.max(0, enemy.hurtTimer - dt);
      enemy.postureDelay = Math.max(0, (enemy.postureDelay || 0) - dt);
      enemy.postureBrokenTimer = Math.max(0, (enemy.postureBrokenTimer || 0) - dt);
      if (enemy.postureDelay <= 0 && enemy.posture > 0) {
        enemy.posture = Math.max(0, enemy.posture - (enemy.boss ? 12 : 24) * dt);
      }
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      enemy.knockbackX = approach(enemy.knockbackX, 0, 2.8 * dt);
      enemy.knockbackY = approach(enemy.knockbackY, 0, 2.8 * dt);
      updateMassiveEnemyPhase(enemy, mission.particles, "fps");
      if (Math.hypot(enemy.knockbackX, enemy.knockbackY) > 0.01) {
        const nx = enemy.x + enemy.knockbackX * dt;
        const ny = enemy.y + enemy.knockbackY * dt;
        const radius = fpsEnemyRadius(enemy);
        if (canOccupyFps(mission, nx, enemy.y, radius, enemy)) enemy.x = nx;
        if (canOccupyFps(mission, enemy.x, ny, radius, enemy)) enemy.y = ny;
      }

      if (enemy.dying) {
        enemy.deathTimer = Math.max(0, enemy.deathTimer - dt);
        if (enemy.deathTimer <= 0) enemy.dead = true;
        continue;
      }
      if (enemy.hurtTimer > 0) {
        enemy.attack = 0;
        continue;
      }

      const profile = applyAuthoredCombatStats(enemy, fpsEnemyCombatProfile(enemy));
      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      const frontlineBlocked = fpsFrontlineBlocked(mission, enemy);
      enemy.frontlineBlocked = frontlineBlocked;
      if (enemy.attack > 0) {
        enemy.attack = Math.max(0, enemy.attack - dt);
        const progress = 1 - enemy.attack / enemy.attackDuration;
        if (!enemy.attackHitApplied && progress >= profile.activeAt) {
          enemy.attackHitApplied = true;
          if (dist <= profile.reach + 0.12 && lineOfSight(mission, enemy.x, enemy.y, p.x, p.y)) {
            const damaged = damagePlayer(profile.damage, {
              attacker: enemy,
              material: profile.family === "spirit" ? "spirit" : enemy.impactMaterial,
              mode: "fps",
              sourceX: enemy.x,
              sourceY: enemy.y,
            });
            if (damaged) playAudio("playZombie");
          }
        }
        continue;
      }

      if (dist < (enemy.boss ? 11 : 8) && lineOfSight(mission, enemy.x, enemy.y, p.x, p.y)) {
        const engagementGoal = dist < profile.reach + 2
          ? fpsEngagementGoal(mission, enemy, profile)
          : null;
        const goalDx = engagementGoal ? engagementGoal.x - enemy.x : dx;
        const goalDy = engagementGoal ? engagementGoal.y - enemy.y : dy;
        const goalDistance = Math.hypot(goalDx, goalDy);
        const shouldReposition = Boolean(engagementGoal && goalDistance > 0.16);
        let moved = false;
        if (
          (dist > profile.reach || shouldReposition)
          && (!frontlineBlocked || engagementGoal)
        ) {
          const pace = profile.speed * dt;
          moved = moveFpsEnemyWithSteering(mission, enemy, goalDx, goalDy, pace);
        }
        if (
          dist <= profile.reach + 0.12
          && !frontlineBlocked
          && (!shouldReposition || !moved)
          && enemy.attackCooldown <= 0
        ) {
          enemy.attackDuration = profile.attackDuration;
          enemy.attack = profile.attackDuration;
          enemy.attackHitApplied = false;
          enemy.attackCooldown = profile.attackDuration + profile.recovery;
        }
      }
    }
  }

  function ensureFpsEnemyAi(enemy) {
    if (enemy.ai) return enemy.ai;
    enemy.ai = createFpsEnemyAi(
      enemy.x,
      enemy.y,
      enemy.engagementSlot || enemy.spriteIndex || 0,
      Boolean(enemy.boss),
    );
    return enemy.ai;
  }

  function transitionFpsEnemyAi(enemy, nextState, reason = "") {
    const ai = ensureFpsEnemyAi(enemy);
    if (ai.state === nextState) return false;
    ai.previousState = ai.state;
    ai.state = nextState;
    ai.stateTime = 0;
    ai.reason = reason;
    return true;
  }

  function fpsCanSeePlayer(mission, enemy, ai) {
    const dx = mission.player.x - enemy.x;
    const dy = mission.player.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    if (distance > ai.sight) return false;
    const targetHeading = Math.atan2(dy, dx);
    if (Math.abs(normalizeAngle(targetHeading - ai.heading)) > ai.fov / 2) {
      return false;
    }
    return lineOfSight(
      mission,
      enemy.x,
      enemy.y,
      mission.player.x,
      mission.player.y,
    );
  }

  function fpsCanHearPlayer(mission, enemy, ai) {
    const distance = Math.hypot(
      mission.player.x - enemy.x,
      mission.player.y - enemy.y,
    );
    const playerMoving = key("w")
      || key("s")
      || key("a")
      || key("d")
      || key("ArrowUp")
      || key("ArrowDown");
    return distance <= ai.hearing
      && (playerMoving || game.attackTimer > 0 || game.rangedViewTimer > 0);
  }

  function moveFpsEnemyToward(mission, enemy, targetX, targetY, pace, dt) {
    const ai = ensureFpsEnemyAi(enemy);
    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const beforeX = enemy.x;
    const beforeY = enemy.y;
    const moved = moveFpsEnemyWithSteering(mission, enemy, dx, dy, pace);
    const movementX = enemy.x - beforeX;
    const movementY = enemy.y - beforeY;
    const movedDistance = Math.hypot(movementX, movementY);
    if (moved && movedDistance > 0.0001) {
      ai.heading = Math.atan2(movementY, movementX);
      ai.movedDistance += movedDistance;
      ai.moveVelocity = movedDistance / Math.max(dt, 0.001);
      ai.stuckTime = 0;
    } else {
      ai.moveVelocity = 0;
      ai.stuckTime += dt;
    }
    return moved;
  }

  function updateFpsEnemyPatrol(mission, enemy, profile, dt) {
    const ai = ensureFpsEnemyAi(enemy);
    if (ai.patrolWait > 0) {
      ai.patrolWait = Math.max(0, ai.patrolWait - dt);
      return;
    }
    const targetX = ai.homeX + Math.cos(ai.patrolAngle) * ai.patrolRadius;
    const targetY = ai.homeY + Math.sin(ai.patrolAngle) * ai.patrolRadius;
    if (Math.hypot(targetX - enemy.x, targetY - enemy.y) <= 0.18) {
      ai.patrolAngle = normalizeAngle(
        ai.patrolAngle + ai.patrolDirection * (Math.PI * 0.56),
      );
      ai.heading = ai.patrolAngle;
      ai.patrolWait = FPS_AI_DEFAULTS.patrolWait
        + (Math.abs(enemy.spriteIndex || 0) % 3) * 0.15;
      return;
    }
    moveFpsEnemyToward(
      mission,
      enemy,
      targetX,
      targetY,
      profile.speed * 0.38 * dt,
      dt,
    );
    if (ai.stuckTime > 0.75) {
      ai.patrolAngle = normalizeAngle(ai.patrolAngle + Math.PI * 0.72);
      ai.heading = ai.patrolAngle;
      ai.stuckTime = 0;
      ai.patrolWait = 0.28;
    }
  }

  function updateFpsEnemies(mission, dt) {
    const player = mission.player;
    for (const enemy of mission.enemies) {
      if (enemy.dead) continue;
      const ai = ensureFpsEnemyAi(enemy);
      ai.stateTime += dt;
      ai.moveVelocity = 0;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.hurtTimer = Math.max(0, enemy.hurtTimer - dt);
      enemy.postureDelay = Math.max(0, (enemy.postureDelay || 0) - dt);
      enemy.postureBrokenTimer = Math.max(0, (enemy.postureBrokenTimer || 0) - dt);
      if (enemy.postureDelay <= 0 && enemy.posture > 0) {
        enemy.posture = Math.max(0, enemy.posture - (enemy.boss ? 12 : 24) * dt);
      }
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      enemy.knockbackX = approach(enemy.knockbackX, 0, 2.8 * dt);
      enemy.knockbackY = approach(enemy.knockbackY, 0, 2.8 * dt);
      updateMassiveEnemyPhase(enemy, mission.particles, "fps");
      if (Math.hypot(enemy.knockbackX, enemy.knockbackY) > 0.01) {
        const nx = enemy.x + enemy.knockbackX * dt;
        const ny = enemy.y + enemy.knockbackY * dt;
        const radius = fpsEnemyRadius(enemy);
        if (canOccupyFps(mission, nx, enemy.y, radius, enemy)) enemy.x = nx;
        if (canOccupyFps(mission, enemy.x, ny, radius, enemy)) enemy.y = ny;
      }

      if (enemy.dying) {
        transitionFpsEnemyAi(enemy, "dying", "fatal-hit");
        enemy.deathTimer = Math.max(0, enemy.deathTimer - dt);
        if (enemy.deathTimer <= 0) {
          enemy.dead = true;
          transitionFpsEnemyAi(enemy, "dead", "death-animation-complete");
        }
        continue;
      }
      if (enemy.hurtTimer > 0) {
        transitionFpsEnemyAi(enemy, "hurt", "impact");
        if (!enemy.boss || enemy.postureBrokenTimer > 0) enemy.attack = 0;
        continue;
      }
      if (ai.state === "hurt") {
        transitionFpsEnemyAi(enemy, "pursue", "recovered");
      }

      const profile = applyAuthoredCombatStats(enemy, fpsEnemyCombatProfile(enemy));
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.hypot(dx, dy);
      const targetHeading = Math.atan2(dy, dx);
      ai.targetVisible = fpsCanSeePlayer(mission, enemy, ai);
      ai.targetAudible = fpsCanHearPlayer(mission, enemy, ai);
      if (ai.targetVisible || ai.targetAudible) {
        ai.lastKnownX = player.x;
        ai.lastKnownY = player.y;
        ai.memoryTime = ai.memoryDuration;
        if (!["attack", "hurt"].includes(ai.state)) {
          transitionFpsEnemyAi(
            enemy,
            "pursue",
            ai.targetVisible ? "sight" : "hearing",
          );
        }
      } else if (ai.memoryTime > 0) {
        ai.memoryTime = Math.max(0, ai.memoryTime - dt);
      }

      const frontlineBlocked = fpsFrontlineBlocked(mission, enemy);
      const attackLaneBlocked = frontlineBlocked && !profile.ranged;
      enemy.frontlineBlocked = attackLaneBlocked;
      if (enemy.attack > 0) {
        transitionFpsEnemyAi(enemy, "attack", "attack-active");
        enemy.attack = Math.max(0, enemy.attack - dt);
        const progress = 1 - enemy.attack / enemy.attackDuration;
        if (profile.charge && progress < profile.activeAt) {
          moveFpsEnemyToward(
            mission,
            enemy,
            player.x,
            player.y,
            profile.speed * 2.15 * dt,
            dt,
          );
        }
        if (!enemy.attackHitApplied && progress >= profile.activeAt) {
          enemy.attackHitApplied = true;
          const targetInFront = Math.abs(
            normalizeAngle(targetHeading - ai.heading),
          ) <= Math.PI * 0.38;
          if (
            targetInFront
            && distance <= profile.reach + 0.12
            && lineOfSight(mission, enemy.x, enemy.y, player.x, player.y)
          ) {
            const damaged = damagePlayer(profile.damage, {
              attacker: enemy,
              material: profile.family === "spirit" ? "spirit" : enemy.impactMaterial,
              mode: "fps",
              sourceX: enemy.x,
              sourceY: enemy.y,
              postureDamage: profile.postureDamage,
              attackKind: profile.attackKind,
            });
            if (damaged) playAudio("playZombie");
          }
        }
        if (enemy.attack <= 0) {
          transitionFpsEnemyAi(enemy, "pursue", "attack-recovery");
        }
        continue;
      }

      if (
        ai.state === "pursue"
        && !ai.targetVisible
        && !ai.targetAudible
        && ai.memoryTime <= 0
      ) {
        transitionFpsEnemyAi(enemy, "investigate", "lost-target");
        ai.patrolWait = 1.2;
      }

      if (ai.state === "pursue") {
        const targetX = ai.targetVisible || ai.targetAudible
          ? player.x
          : ai.lastKnownX;
        const targetY = ai.targetVisible || ai.targetAudible
          ? player.y
          : ai.lastKnownY;
        if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) {
          transitionFpsEnemyAi(enemy, "returnHome", "no-target");
        } else {
          const engagementGoal = ai.targetVisible && distance < profile.reach + 2
            ? fpsEngagementGoal(mission, enemy, profile)
            : null;
          const retreating = profile.ranged && distance < profile.minRange;
          const retreatScale = Math.max(0.85, profile.minRange - distance + 0.85);
          const goalX = retreating
            ? (engagementGoal?.x ?? enemy.x - Math.cos(targetHeading) * retreatScale)
            : (engagementGoal?.x ?? targetX);
          const goalY = retreating
            ? (engagementGoal?.y ?? enemy.y - Math.sin(targetHeading) * retreatScale)
            : (engagementGoal?.y ?? targetY);
          const goalDistance = Math.hypot(goalX - enemy.x, goalY - enemy.y);
          const shouldReposition = Boolean(engagementGoal && goalDistance > 0.16);
          let moved = false;
          if (
            (distance > profile.reach || shouldReposition || retreating)
            && (!attackLaneBlocked || engagementGoal || retreating)
          ) {
            moved = moveFpsEnemyToward(
              mission,
              enemy,
              goalX,
              goalY,
              profile.speed * dt,
              dt,
            );
          } else {
            ai.heading = targetHeading;
          }
          if (
            ai.targetVisible
            && distance <= profile.reach + 0.12
            && !attackLaneBlocked
            && (!profile.ranged || distance >= profile.minRange * 0.72)
            && (!shouldReposition || !moved)
            && enemy.attackCooldown <= 0
          ) {
            ai.heading = targetHeading;
            enemy.attackDuration = profile.attackDuration;
            enemy.attack = profile.attackDuration;
            enemy.attackKind = profile.attackKind;
            enemy.attackHitApplied = false;
            enemy.attackCooldown = profile.attackDuration + profile.recovery;
            transitionFpsEnemyAi(enemy, "attack", "in-range");
          }
        }
      } else if (ai.state === "investigate") {
        const targetX = ai.lastKnownX;
        const targetY = ai.lastKnownY;
        if (
          Number.isFinite(targetX)
          && Number.isFinite(targetY)
          && Math.hypot(targetX - enemy.x, targetY - enemy.y) > 0.2
        ) {
          moveFpsEnemyToward(
            mission,
            enemy,
            targetX,
            targetY,
            profile.speed * 0.64 * dt,
            dt,
          );
        } else {
          ai.patrolWait = Math.max(0, ai.patrolWait - dt);
          ai.heading = normalizeAngle(ai.heading + dt * 0.8);
          if (ai.patrolWait <= 0) {
            transitionFpsEnemyAi(enemy, "returnHome", "investigation-complete");
          }
        }
      } else if (ai.state === "returnHome") {
        if (Math.hypot(ai.homeX - enemy.x, ai.homeY - enemy.y) <= 0.18) {
          enemy.x = ai.homeX;
          enemy.y = ai.homeY;
          ai.lastKnownX = null;
          ai.lastKnownY = null;
          transitionFpsEnemyAi(enemy, "patrol", "home");
        } else {
          moveFpsEnemyToward(
            mission,
            enemy,
            ai.homeX,
            ai.homeY,
            profile.speed * 0.55 * dt,
            dt,
          );
        }
      } else if (ai.state === "idle") {
        if (!enemy.boss && ai.stateTime > 0.7) {
          transitionFpsEnemyAi(enemy, "patrol", "idle-complete");
        }
      } else {
        updateFpsEnemyPatrol(mission, enemy, profile, dt);
      }
    }
    if (game.status === "playing" && game.mode === "fps") {
      const activeBoss = mission.enemies.some((enemy) =>
        isEnemyAlive(enemy) && (enemy.boss || isMassiveEnemy(enemy)));
      const alerted = mission.enemies.some((enemy) =>
        isEnemyAlive(enemy)
        && ["pursue", "attack", "hurt"].includes(enemy.ai?.state));
      if (mission.purified) setMusicState("purified", 0.5);
      else if (activeBoss) setMusicState("boss", 0.94);
      else if (alerted) setMusicState("combat", 0.76);
      else setMusicState("yomi", 0.54);
    }
  }

  function lineOfSight(mission, x1, y1, x2, y2) {
    const distance = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(distance / 0.12);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (!isWalkable(mission.map, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
    }
    return true;
  }

  function isPlayerGuarding() {
    return Boolean(game.guardHeld || game.guardTimer > 0);
  }

  function performGuard(active = true) {
    if (game.status !== "playing" || game.playerStagger > 0 || game.dodgeTimer > 0) return false;
    game.guardHeld = Boolean(active);
    if (active) {
      game.guardTimer = Math.max(game.guardTimer, 0.48);
      game.parryTimer = PLAYER_PARRY_WINDOW;
      game.attackTimer = 0;
      game.attackCooldown = Math.max(game.attackCooldown, 0.08);
    }
    return true;
  }

  function releaseGuard() {
    game.guardHeld = false;
    return true;
  }

  function performDodge() {
    if (
      game.status !== "playing"
      || game.dodgeCooldown > 0
      || game.transition > 0.05
      || game.playerStagger > 0
      || game.stamina < 18
    ) return false;
    const omamori = game.loadout?.omamori || [];
    const shadowCharm = omamori.includes("ombre") || game.loadout?.charm === "omamori-ombre";
    game.stamina -= 18;
    game.dodgeTimer = PLAYER_DODGE_DURATION;
    game.dodgeCooldown = shadowCharm ? PLAYER_DODGE_COOLDOWN * 0.82 : PLAYER_DODGE_COOLDOWN;
    game.invulnerable = Math.max(game.invulnerable, PLAYER_DODGE_DURATION + (shadowCharm ? 0.08 : 0));
    game.guardHeld = false;
    game.guardTimer = 0;
    game.parryTimer = 0;
    if (game.mode === "side") {
      const p = game.side.player;
      const inputDirection = (key("d") || key("ArrowRight") ? 1 : 0)
        - (key("a") || key("ArrowLeft") ? 1 : 0);
      p.vx = (inputDirection || p.facing || 1) * 285;
    } else {
      const mission = currentMission();
      const p = mission.player;
      const strafe = (key("d") ? 1 : 0) - (key("a") ? 1 : 0);
      const forward = (key("w") ? 1 : 0) - (key("s") ? 1 : 0);
      const localForward = forward || (strafe ? 0 : -1);
      const dx = Math.cos(p.angle) * localForward * 0.76
        + Math.cos(p.angle + Math.PI / 2) * strafe * 0.76;
      const dy = Math.sin(p.angle) * localForward * 0.76
        + Math.sin(p.angle + Math.PI / 2) * strafe * 0.76;
      moveFpsPlayer(mission, dx, dy);
    }
    playAudio("playCombatCue", "dodge");
    return true;
  }

  function beginPlayerAttack(kind = "light") {
    if (
      game.status !== "playing"
      || game.attackCooldown > 0
      || game.transition > 0.05
      || game.playerStagger > 0
      || game.dodgeTimer > 0
      || isPlayerGuarding()
    ) return;
    const attackKind = kind === "heavy" ? "heavy" : "light";
    const comboStep = attackKind === "light"
      ? (game.comboTimer > 0 ? game.comboStep % 3 + 1 : 1)
      : 1;
    const spec = playerAttackSpec(currentPlayerWeapon(), { kind: attackKind, comboStep });
    if (game.stamina < spec.staminaCost) {
      announce("KI INSUFFISANT");
      return false;
    }
    game.stamina = Math.max(0, game.stamina - spec.staminaCost);
    game.attackKind = attackKind;
    game.attackSpec = spec;
    game.comboStep = comboStep;
    game.comboTimer = attackKind === "light" ? PLAYER_COMBO_WINDOW : 0;
    game.attackDuration = spec.duration;
    game.attackCooldown = spec.cooldown;
    game.attackTimer = spec.duration;
    game.attackHitApplied = false;
    playAudio("playWeapon", spec.family, attackKind, {
      comboStep,
      heavy: attackKind === "heavy",
    });
    if (!window.gameAudio?.playWeapon) playAudio("playKatana");
    return true;
  }

  function performAttack() {
    return beginPlayerAttack("light");
  }

  function performHeavyAttack() {
    return beginPlayerAttack("heavy");
  }

  function weaponDamageAgainst(enemy, spec) {
    let damage = spec.damage;
    const material = enemy.impactMaterial || impactMaterialForEntry(enemy.modularEntry, enemy);
    const materialMultiplier = material === "armor"
      ? spec.stats.armor
      : (material === "spirit" ? spec.stats.spirit : spec.stats.flesh);
    damage *= materialMultiplier;
    if (enemy.boss || isMassiveEnemy(enemy)) damage *= spec.stats.boss;
    if (material === "armor") damage += spec.armorBonus;
    if (enemy.behaviorFamily === "shield" && !spec.armorIgnore && spec.attackKind !== "heavy") {
      damage *= 0.48;
    }
    const passiveText = `${spec.weapon?.passive?.id || ""} ${spec.weapon?.passive?.effect || ""}`.toLowerCase();
    if (material === "spirit" && /spirit|yomi|purif/.test(passiveText)) damage += 1;
    return Math.max(1, Math.round(damage));
  }

  function applyPlayerWeaponPassive(enemy, spec) {
    const passiveText = `${spec.weapon?.passive?.id || ""} ${spec.weapon?.passive?.effect || ""}`.toLowerCase();
    if (/stun|étour|posture/.test(passiveText) && enemy.hp > 0) {
      enemy.hurtTimer = Math.max(enemy.hurtTimer, 0.48);
    }
    if (/pull|entrave|capture/.test(passiveText) && enemy.hp > 0 && !isMassiveEnemy(enemy)) {
      if (game.mode === "side") {
        enemy.knockbackVx = -Math.sign(enemy.x - game.side.player.x || 1) * 72;
      } else {
        const player = currentMission().player;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const length = Math.max(0.01, Math.hypot(dx, dy));
        enemy.knockbackX = dx / length * 0.72;
        enemy.knockbackY = dy / length * 0.72;
      }
    }
  }

  function resolvePlayerAttack() {
    if (game.attackHitApplied || game.status !== "playing") return;
    game.attackHitApplied = true;
    const spec = game.attackSpec || playerAttackSpec(currentPlayerWeapon(), {
      kind: game.attackKind,
      comboStep: game.comboStep || 1,
    });
    if (game.mode === "side") {
      const p = game.side.player;
      const targets = game.side.enemies
        .filter((e) =>
          isEnemyAlive(e)
          && Math.abs((e.x + e.w / 2) - (p.x + p.w / 2)) < spec.sideReach
          && Math.abs((e.y + e.h) - (p.y + p.h)) < 46)
        .filter((e) => Math.sign(e.x - p.x) === p.facing || Math.abs(e.x - p.x) < 16)
        .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x));
      targets.slice(0, spec.targets).forEach((enemy) => {
        hitEnemy(enemy, weaponDamageAgainst(enemy, spec), {
          mode: "side",
          direction: p.facing,
          postureDamage: spec.postureDamage,
          heavy: spec.attackKind === "heavy",
        });
        applyPlayerWeaponPassive(enemy, spec);
      });
    } else {
      const mission = currentMission();
      const target = nearestFpsTarget(mission, spec.fpsReach, 0.5);
      if (target) {
        hitEnemy(target, weaponDamageAgainst(target, spec), {
          mode: "fps",
          postureDamage: spec.postureDamage,
          heavy: spec.attackKind === "heavy",
        });
        applyPlayerWeaponPassive(target, spec);
      }
    }
  }

  function performRanged() {
    if (
      game.status !== "playing"
      || game.attackCooldown > 0
      || game.transition > 0.05
      || game.playerStagger > 0
      || game.dodgeTimer > 0
      || isPlayerGuarding()
      || game.ammo <= 0
    ) {
      if (game.ammo <= 0) announce("PLUS DE PROJECTILES");
      return;
    }
    const rangedWeapon = currentRangedWeapon();
    const rangedStats = normalizedWeaponStats(rangedWeapon || {
      stats: { power: 72, speed: 55, reach: 80, control: 72 },
    });
    const rangedDamage = clamp(Math.round(1 + rangedStats.power / 32), 2, 5);
    game.ammo -= 1;
    game.ammoByType[rangedAmmoType(rangedWeapon)] = game.ammo;
    persistAmmoMap();
    game.attackCooldown = clamp(0.72 - rangedStats.speed * 0.0045, 0.28, 0.68);
    game.rangedViewTimer = 0.2;
    game.lastRangedWeaponId = rangedWeapon?.id || "ofuda-purification";
    playAudio("playWeapon", weaponFamilyKey(rangedWeapon || {}), "ranged", {
      weaponId: rangedWeapon?.id || "ofuda-purification",
    });
    if (!window.gameAudio?.playWeapon) playAudio("playShot");
    if (game.mode === "side") {
      const p = game.side.player;
      game.side.projectiles.push({
        x: p.x + p.w / 2 + p.facing * 10,
        y: p.y + 9,
        vx: p.facing * (300 + rangedStats.speed * 0.8),
        life: 1.8,
        dead: false,
        damage: rangedDamage,
        weaponId: rangedWeapon?.id || "ofuda-purification",
      });
    } else {
      const mission = currentMission();
      const maxDistance = 6 + rangedStats.reach * 0.1;
      const maxAngle = 0.09 + rangedStats.control * 0.0011;
      const target = nearestFpsTarget(mission, maxDistance, maxAngle);
      if (target) hitEnemy(target, rangedDamage, {
        mode: "fps",
        ranged: true,
        postureDamage: 9 + rangedStats.posture * 0.18,
      });
      mission.particles.push({
        x: W / 2,
        y: H / 2,
        vx: 0,
        vy: 0,
        gravity: 0,
        life: 0.18,
        max: 0.18,
        color: "#fff1a8",
        screen: true,
        kind: "flash",
      });
    }
  }

  function nearestFpsTarget(mission, maxDistance, maxAngle) {
    const p = mission.player;
    return mission.enemies
      .filter(isEnemyAlive)
      .map((e) => ({ enemy: e, dist: Math.hypot(e.x - p.x, e.y - p.y), angle: Math.abs(normalizeAngle(Math.atan2(e.y - p.y, e.x - p.x) - p.angle)) }))
      .filter((entry) => entry.dist <= maxDistance && entry.angle <= maxAngle && lineOfSight(mission, p.x, p.y, entry.enemy.x, entry.enemy.y))
      .sort((a, b) => a.angle - b.angle || a.dist - b.dist)[0]?.enemy || null;
  }

  function fpsImpactPoint(enemy) {
    const mission = currentMission();
    const p = mission.player;
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    const distance = Math.max(0.2, Math.hypot(dx, dy));
    const relativeAngle = normalizeAngle(Math.atan2(dy, dx) - p.angle);
    const massiveBoss = isMassiveEnemy(enemy);
    const worldHeight = massiveBoss ? 1.62 : (enemy.boss ? 1.28 : 0.92);
    const projection = projectFpsEntity(distance, relativeAngle, worldHeight, 1);
    return {
      x: clamp(projection.screenX, 8, W - 8),
      y: clamp(projection.top + projection.height * 0.42, 12, H - 18),
    };
  }

  function spawnImpactParticles(enemy, material, mode) {
    const particles = mode === "side" ? game.side.particles : currentMission().particles;
    const point = mode === "side"
      ? { x: enemy.x + enemy.w / 2, y: enemy.y + 8 }
      : fpsImpactPoint(enemy);
    const palette = material === "armor"
      ? ["#fff4b0", "#e9b84f", "#ffffff"]
      : material === "spirit"
        ? ["#b9e7b0", "#719c76", "#d9d7c5"]
        : ["#8f1d29", "#d73a40", "#5b101c"];
    const count = material === "armor" ? 11 : material === "spirit" ? 12 : 9;
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * (0.12 + Math.random() * 0.76);
      const speed = material === "armor" ? 75 + Math.random() * 115 : 35 + Math.random() * 80;
      particles.push({
        x: point.x,
        y: point.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: material === "spirit" ? -18 : material === "armor" ? 95 : 150,
        drag: material === "spirit" ? 0.92 : 0.98,
        life: 0.28 + Math.random() * 0.34,
        max: 0.62,
        color: palette[i % palette.length],
        screen: mode === "fps",
        kind: material === "armor" ? "spark" : material === "spirit" ? "ash" : "blood",
      });
    }
    game.hitConfirm = 0.18;
    game.hitConfirmMaterial = material;
    game.hitConfirmPoint = point;
  }

  function hitEnemy(enemy, damage, options = {}) {
    if (!isEnemyAlive(enemy)) return false;
    const normalized = typeof options === "string" ? { mode: options } : options;
    const mode = normalized.mode || game.mode;
    const material = enemy.impactMaterial || impactMaterialForEntry(enemy.modularEntry, enemy);
    enemy.hp = Math.max(0, enemy.hp - damage);
    const postureDamage = Math.max(0, Number(normalized.postureDamage) || 8);
    enemy.maxPosture = Math.max(20, Number(enemy.maxPosture) || (enemy.boss ? 96 : 36));
    enemy.posture = Math.min(enemy.maxPosture, (Number(enemy.posture) || 0) + postureDamage);
    enemy.postureDelay = 1.15;
    const postureBroken = enemy.posture >= enemy.maxPosture;
    if (postureBroken) {
      enemy.posture = 0;
      enemy.postureBrokenTimer = enemy.boss || isMassiveEnemy(enemy) ? 0.72 : 0.5;
    }
    enemy.flash = material === "armor" ? 0.2 : 0.15;
    const hasBossPoise = enemy.boss || isMassiveEnemy(enemy);
    const shouldInterrupt = postureBroken || !hasBossPoise || normalized.heavy;
    enemy.hurtTimer = shouldInterrupt
      ? Math.max(enemy.hurtTimer || 0, postureBroken ? enemy.postureBrokenTimer : ENEMY_HURT_DURATION)
      : Math.max(enemy.hurtTimer || 0, 0.07);
    if (shouldInterrupt) {
      enemy.attack = 0;
      enemy.attackHitApplied = false;
    }
    game.shake = Math.max(game.shake, material === "armor" ? 4.8 : 3.8);
    game.hitStop = material === "armor" ? 0.055 : 0.042;
    game.score += 25;
    playAudio("playImpact", material);
    spawnImpactParticles(enemy, material, mode);
    if (mode === "side") {
      const direction = normalized.direction || Math.sign(enemy.x - game.side.player.x) || 1;
      const knockback = isMassiveEnemy(enemy)
        ? 12
        : (material === "armor" ? 75 : 125);
      enemy.knockbackVx = direction * knockback;
    } else {
      const p = currentMission().player;
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const length = Math.max(0.01, Math.hypot(dx, dy));
      const force = isMassiveEnemy(enemy)
        ? 0.12
        : (material === "armor" ? 0.7 : 1.15);
      enemy.knockbackX = dx / length * force;
      enemy.knockbackY = dy / length * force;
    }
    if (mode === "side") {
      recordEnemyStimulus(
        enemy,
        game.side.player.x + game.side.player.w / 2,
        "damage",
      );
    } else if (enemy.ai) {
      const p = currentMission().player;
      enemy.ai.lastKnownX = p.x;
      enemy.ai.lastKnownY = p.y;
      enemy.ai.memoryTime = enemy.ai.memoryDuration;
      enemy.ai.previousState = enemy.ai.state;
      enemy.ai.state = "pursue";
      enemy.ai.reason = "damage";
      enemy.ai.stateTime = 0;
    }
    if (enemy.hp <= 0) {
      enemy.dying = true;
      enemy.deathTimer = ENEMY_DEATH_DURATION;
      enemy.hurtTimer = 0;
      enemy.attack = 0;
      game.kills += 1;
      game.score += enemy.boss ? 1500 : 180;
      if (enemy.boss) {
        const defeatedIds = [
          enemy.sourceId,
          enemy.rosterId,
          enemy.profileId,
          enemy.encounterId,
          enemy.modularEntry?.id,
        ].filter(Boolean);
        defeatedIds.forEach((id) => window.KageSave?.markBossDefeated?.(id, true));
        const rewardWeaponId = defeatedIds.includes("giant-02-aka-ushi")
          ? "naginata-lourde"
          : (defeatedIds.includes("06-daimyo-corrupted") ? "06-kegare-kiri" : null);
        const newlyUnlocked = rewardWeaponId
          && !window.KageSave?.isWeaponUnlocked?.(rewardWeaponId);
        if (newlyUnlocked) window.KageSave?.unlockWeapon?.(rewardWeaponId);
        persistRunProgress({ health: game.health });
        const bossName = String(enemy.modularEntry?.name || "LE DAIMYŌ").toUpperCase();
        const rewardName = newlyUnlocked
          ? String(arsenalWeaponById(rewardWeaponId)?.name || rewardWeaponId).toUpperCase()
          : "";
        const victoryMessage = mode === "side"
          ? `${bossName} TOMBE — LA ROUTE DU CHÂTEAU EST OUVERTE`
          : `${bossName} TOMBE — PURIFIEZ L'AUTEL`;
        announce(rewardName ? `${victoryMessage} · ${rewardName} DÉBLOQUÉE` : victoryMessage);
      }
    }
    return true;
  }

  function attackInsideGuardArc(source = {}) {
    const attacker = source.attacker;
    if (!attacker) return true;
    if (source.mode === "side") {
      const player = game.side.player;
      const attackerCenter = attacker.x + (attacker.w || 0) / 2;
      const playerCenter = player.x + player.w / 2;
      return Math.sign(attackerCenter - playerCenter) === player.facing
        || Math.abs(attackerCenter - playerCenter) < 18;
    }
    const player = currentMission().player;
    const heading = Math.atan2(attacker.y - player.y, attacker.x - player.x);
    return Math.abs(normalizeAngle(heading - player.angle)) <= Math.PI * 0.58;
  }

  function damagePlayer(amount, source = {}) {
    if (game.invulnerable > 0 || game.engagementGrace > 0 || game.status !== "playing") return false;
    const material = source.material || "flesh";
    const omamori = game.loadout?.omamori || [];
    const cinderCharm = omamori.includes("cendre") || game.loadout?.charm === "omamori-cendre";
    const armorReduction = game.loadout?.armor === "do-maru-voyage" ? 0.88 : 1;
    let incomingDamage = Math.max(0, Number(amount) || 0) * armorReduction;
    if (material === "spirit" && cinderCharm) incomingDamage *= 0.72;

    const guarding = isPlayerGuarding() && attackInsideGuardArc(source);
    if (guarding && game.parryTimer > 0) {
      const attacker = source.attacker;
      game.perfectParries += 1;
      game.parryTimer = 0;
      game.guardTimer = Math.max(game.guardTimer, 0.22);
      game.stamina = Math.min(100, game.stamina + 12);
      game.invulnerable = 0.16;
      game.shake = Math.max(game.shake, 3.5);
      if (attacker) {
        attacker.attack = 0;
        attacker.attackHitApplied = false;
        attacker.attackCooldown = Math.max(attacker.attackCooldown || 0, 0.9);
        attacker.maxPosture = Math.max(20, Number(attacker.maxPosture) || (attacker.boss ? 96 : 36));
        attacker.posture = Math.min(
          attacker.maxPosture,
          (Number(attacker.posture) || 0) + (attacker.boss ? 42 : 58),
        );
        attacker.postureDelay = 1.3;
        if (attacker.posture >= attacker.maxPosture) {
          attacker.posture = 0;
          attacker.postureBrokenTimer = attacker.boss ? 0.82 : 0.62;
          attacker.hurtTimer = Math.max(attacker.hurtTimer || 0, attacker.postureBrokenTimer);
        } else if (!attacker.boss) {
          attacker.hurtTimer = Math.max(attacker.hurtTimer || 0, 0.24);
        }
        const passiveEffect = String(currentPlayerWeapon()?.passive?.effect || "");
        if (passiveEffect === "disarm" && !attacker.boss) {
          attacker.attackCooldown = Math.max(attacker.attackCooldown, 2.2);
        }
        if (passiveEffect === "lowHealthRestoreKi" && game.health < 30) {
          game.stamina = Math.min(100, game.stamina + 10);
        }
      }
      playAudio("playCombatCue", "perfect-parry");
      announce("PARADE PARFAITE — GARDE ENNEMIE FISSUREE");
      return false;
    }

    if (guarding) {
      const chargeMultiplier = source.attackKind === "charge" ? 1.35 : 1;
      const guardCost = Math.max(6, incomingDamage * 1.25 * chargeMultiplier);
      game.stamina = Math.max(0, game.stamina - guardCost);
      game.playerPosture = Math.min(
        PLAYER_GUARD_POSTURE_MAX,
        game.playerPosture + Math.max(8, Number(source.postureDamage) || incomingDamage * 1.8),
      );
      game.playerPostureDelay = 1.1;
      const guardBroken = game.stamina <= 0 || game.playerPosture >= PLAYER_GUARD_POSTURE_MAX;
      if (!guardBroken) {
        const chipDamage = material === "spirit" ? incomingDamage * 0.18 : incomingDamage * 0.06;
        game.health = Math.max(1, game.health - chipDamage);
        game.invulnerable = 0.14;
        game.hurtTimer = Math.max(game.hurtTimer, 0.1);
        game.shake = Math.max(game.shake, 2.4);
        playAudio("playCombatCue", "block");
        return false;
      }
      game.guardHeld = false;
      game.guardTimer = 0;
      game.parryTimer = 0;
      game.playerPosture = 0;
      game.playerStagger = 0.62;
      incomingDamage *= 0.62;
      playAudio("playCombatCue", "guard-break");
      announce("GARDE BRISEE");
    }

    game.health = Math.max(0, game.health - incomingDamage);
    game.invulnerable = PLAYER_HURT_DURATION;
    game.hurtTimer = PLAYER_HURT_DURATION;
    game.playerStagger = 0.24;
    game.shake = 8;
    playAudio("playPlayerHurt");
    if (source.mode === "side") {
      const p = game.side.player;
      p.vx = (source.direction || -p.facing || -1) * 125;
      p.vy = -105;
      p.grounded = false;
    }
    dom.damage.classList.remove("hit");
    void dom.damage.offsetWidth;
    dom.damage.classList.add("hit");
    if (game.health <= 0) {
      game.status = "dying";
      game.deathTimer = PLAYER_DEATH_DURATION;
      game.hurtTimer = 0;
      input.keys.clear();
      document.body.dataset.state = "dying";
      document.exitPointerLock?.();
    }
    return true;
  }

  function applyOptionalFpsReward(mission) {
    const reward = mission.reward || {};
    const score = Math.max(0, Number(reward.score) || 0);
    const health = Math.max(0, Number(reward.health) || 0);
    const ammo = Math.max(0, Number(reward.ammo) || 0);
    const rangedWeapon = currentRangedWeapon();
    const ammoType = rangedAmmoType(rangedWeapon);
    const ammoCapacity = rangedAmmoCapacity(rangedWeapon);

    game.score += score;
    game.health = Math.min(100, game.health + health);
    game.ammo = Math.min(ammoCapacity, game.ammo + ammo);
    game.ammoByType[ammoType] = game.ammo;

    try {
      const profile = window.KageSave?.load?.();
      if (profile) {
        profile.secrets = profile.secrets || {};
        profile.secrets[mission.secretId] = true;
        profile.currencies = profile.currencies || {};
        for (const [currencyId, amount] of Object.entries(reward.currencies || {})) {
          profile.currencies[currencyId] = Math.max(
            0,
            Number(profile.currencies[currencyId] || 0) + Math.max(0, Number(amount) || 0),
          );
        }
        profile.ammo = {
          ...profile.ammo,
          [ammoType]: game.ammo,
        };
        if (reward.unlockWeapon) {
          profile.unlocks = profile.unlocks || {};
          profile.unlocks.weapons = Array.isArray(profile.unlocks.weapons)
            ? profile.unlocks.weapons
            : [];
          if (!profile.unlocks.weapons.includes(reward.unlockWeapon)) {
            profile.unlocks.weapons.push(reward.unlockWeapon);
          }
        }
        window.KageSave.save(profile);
      }
    } catch (_) {
      // Hors stockage persistant, la récompense reste active pour la session.
    }

    persistRunProgress({
      health: game.health,
      seals: game.seals,
      areaId: game.side.areaId,
    });
  }

  function interact() {
    if (game.status !== "playing") return;
    if (game.mode === "side") {
      const portal = nearestSidePortal();
      if (!portal) {
        announce("APPROCHEZ-VOUS DE L'ENTRÉE");
        return;
      }
      const portalType = portal.type
        || (fpsMissionIndexForPortal(portal) !== null ? "fps" : "side");
      if (["side", "return"].includes(portalType)) {
        const lockMessage = sidePortalLockMessage(portal);
        if (lockMessage) {
          announce(lockMessage);
          return;
        }
        if (!confirmSidePortal(portal)) return;
        queueSideTravel(
          portal.destination,
          portalType === "return" ? "RETOUR AU PLAN PRÉCÉDENT" : "PASSAGE EN PROFONDEUR",
        );
      } else if (portalType === "ending") {
        const lockMessage = sidePortalLockMessage(portal);
        if (lockMessage) {
          announce(lockMessage);
          return;
        }
        if (!confirmSidePortal(portal)) return;
        finishGame(true);
      } else if (portalType === "fps" && fpsMissionIndexForPortal(portal) !== null) {
        enterFps(fpsMissionIndexForPortal(portal), false);
      } else if (portalType === "fps") {
        announce("CET INTÉRIEUR SERA OUVERT PAR UNE MISSION SECONDAIRE");
      } else {
        announce("CE PASSAGE EST ENCORE CONDAMNÉ");
      }
      return;
    }
    const mission = currentMission();
    const remaining = mission.enemies.filter(isEnemyAlive).length;
    const distance = Math.hypot(mission.player.x - mission.altar.x, mission.player.y - mission.altar.y);
    if (distance > 1.35) {
      announce(remaining ? `${remaining} INFECTÉ${remaining > 1 ? "S" : ""} RÔDE${remaining > 1 ? "NT" : ""} ENCORE` : "APPROCHEZ L'AUTEL");
      return;
    }
    if (remaining) {
      announce("L'AUTEL RÉSISTE — ÉLIMINEZ LES INFECTÉS");
      return;
    }
    if (mission.purified) {
      if (mission.optional) {
        returnToSide(false);
        announce(mission.alreadyPurifiedAnnouncement || "FOYER DÉJÀ PURIFIÉ");
      }
      return;
    }
    if (!mission.purified) {
      mission.purified = true;
      if (mission.optional) {
        applyOptionalFpsReward(mission);
        playAudio("playPickup");
        setMusicState("purified", 0.38);
        returnToSide(true);
        announce(mission.completionAnnouncement || "MISSION SECONDAIRE PURIFIÉE");
        return;
      }
      game.seals += 1;
      game.score += 1000;
      playAudio("playPickup");
      setMusicState("purified", 0.38);
      if (game.fps.current === 0) {
        game.chapter = 1;
        if (!setCurrentSideArea("kurokawa-main-street", "fpsReturn", true)) {
          prepareSideChapter(1);
        }
        applyRosterToGame(game);
        const rangedWeapon = currentRangedWeapon();
        const ammoType = rangedAmmoType(rangedWeapon);
        game.ammo = Math.min(rangedAmmoCapacity(rangedWeapon), game.ammo + 3);
        game.ammoByType[ammoType] = game.ammo;
        persistAmmoMap();
        game.health = Math.min(100, game.health + 18);
        persistRunProgress({
          chapter: 1,
          areaId: game.side.areaId,
          spawnId: "fpsReturn",
          health: game.health,
          seals: game.seals,
        });
        returnToSide(true);
        announce("PREMIER SCEAU POSÉ — PASSEZ PAR LES RUELLES ET LE MARCHÉ");
      } else {
        persistRunProgress({
          completed: false,
          started: true,
          chapter: 1,
          areaId: "castle-donjon",
          spawnId: "fpsReturn",
          health: game.health,
          seals: game.seals,
        });
        window.KageSave?.markBossDefeated?.("06-daimyo-corrupted", true);
        returnToSide(true);
        announce("DAIMYŌ VAINCU — LA FAILLE DU YOMI S'OUVRE AU-DELÀ DU DONJON");
      }
    }
  }

  function switchMode() {
    if (game.status !== "playing" || game.transition > 0.25) return;
    if (game.mode === "side") {
      if (nearestSidePortal()) interact();
      else announce("APPROCHEZ D'UNE ENTRÉE ET APPUYEZ SUR E");
      return;
    }
    if (!currentMission().purified) {
      announce("SCELLEZ LE FOYER AVANT DE REPARTIR");
      return;
    }
    returnToSide(false);
  }

  function enterFps(index, automatic) {
    if (game.status !== "playing") return;
    ensureFpsPlayerAssets();
    input.keys.clear();
    input.lookPointerId = null;
    game.side.player.vx = 0;
    game.side.player.vy = 0;
    game.fps.current = clamp(
      Math.floor(Number(index) || 0),
      0,
      Math.max(0, game.fps.missions.length - 1),
    );
    const def = FPS_DEFS[game.fps.current] || FPS_DEFS[0];
    const mission = currentMission();
    game.mode = "fps";
    game.invulnerable = Math.max(game.invulnerable, 2.2);
    game.transition = 0.85;
    game.transitionLabel = automatic ? "LE VOILE DE YOMI SE DÉCHIRE" : "REGARD DE L'OMBRE";
    document.body.classList.add("fps-mode");
    playAudio("playTransition", "fps");
    setMusicState(def.musicState || "yomi", Number(def.musicIntensity) || 0.54);
    announce(
      mission.purified
        ? (mission.alreadyPurifiedAnnouncement || `${mission.label} — FOYER DÉJÀ PURIFIÉ`)
        : (def.announcement || `${mission.label} — PURIFIEZ LE FOYER`),
    );
    if (canvas.requestPointerLock && matchMedia("(pointer: fine)").matches) {
      canvas.requestPointerLock()?.catch?.(() => {});
    }
  }

  function returnToSide(automatic) {
    input.keys.clear();
    input.lookPointerId = null;
    game.mode = "side";
    game.invulnerable = Math.max(game.invulnerable, 1);
    game.side.player.vx = 0;
    game.side.player.vy = 0;
    game.transition = 0.85;
    game.transitionLabel = automatic ? "LE MONDE DES VIVANTS VOUS RAPPELLE" : "PAS DE CÔTÉ";
    document.body.classList.remove("fps-mode");
    document.exitPointerLock?.();
    playAudio("playTransition", "2d");
    const music = sideMusicState();
    setMusicState(music.state, music.intensity);
  }

  function finishGame(victory) {
    game.status = "ended";
    document.body.dataset.state = "ended";
    document.exitPointerLock?.();
    dom.end.classList.add("active");
    dom.end.setAttribute?.("aria-hidden", "false");
    const minutes = Math.floor(game.elapsed / 60);
    const seconds = Math.floor(game.elapsed % 60).toString().padStart(2, "0");
    const rank = victory
      ? (
          game.health >= 70 && game.kills >= 40 && game.elapsed < 10800
            ? "S"
            : (game.health >= 35 && game.kills >= 24 ? "A" : "B")
        )
      : "—";
    dom.endGlyph.textContent = victory ? "勝" : "滅";
    dom.endKicker.textContent = victory ? "MISSION ACCOMPLIE" : "LE SANG RETOURNE À LA TERRE";
    const temporalEnding = victory && game.side.areaId === "neo-edo-cyber-rift";
    dom.endTitle.textContent = victory
      ? (temporalEnding ? "LA FAILLE SE REFERME SUR NEO-EDO" : "L'AUBE REVIENT SUR KUROKAWA")
      : "L'OMBRE VOUS A DÉVORÉ";
    dom.endMessage.textContent = victory
      ? (
        temporalEnding
          ? "Akio renvoie l'ombre vers le Yomi. Le Japon respire à travers les siècles."
          : "Les morts reposent. Pour cette nuit."
      )
      : "Le shogun attendra un samouraï qui ne reviendra jamais.";
    dom.endKills.textContent = game.kills;
    dom.endTime.textContent = `${minutes.toString().padStart(2, "0")}:${seconds}`;
    dom.endRank.textContent = rank;
    if (dom.endRestart) {
      dom.endRestart.textContent = victory
        ? "NOUVELLE CHRONIQUE"
        : "REPRENDRE AU DERNIER FOYER";
      dom.endRestart.dataset.action = victory ? "new-game" : "restart";
    }
    if (victory) {
      persistRunProgress({
        completed: true,
        started: true,
        health: game.health,
        seals: game.seals,
      });
      window.KageSave?.markBossDefeated?.("06-daimyo-corrupted", true);
      setMusicState("purified", 1);
    } else {
      setMusicState("title", 0.16);
    }
    refreshContinueState();
    playAudio(victory ? "playVictory" : "playDefeat");
  }

  function currentMission() {
    return game.fps.missions[game.fps.current];
  }

  function updateParticles(particles, dt) {
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.drag ?? 1;
      p.vy *= p.drag ?? 1;
      p.vy += (p.gravity ?? (p.screen ? 0 : 150)) * dt;
      p.life -= dt;
    }
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
  }

  function draw() {
    ctx.save();
    const effectiveShake = game.settings?.screenShake !== false && !game.settings?.reducedMotion
      ? game.shake
      : 0;
    const shakeX = effectiveShake ? Math.round((Math.random() - 0.5) * effectiveShake) : 0;
    const shakeY = effectiveShake ? Math.round((Math.random() - 0.5) * effectiveShake) : 0;
    ctx.translate(shakeX, shakeY);
    if (game.mode === "side") drawSide();
    else drawFps();
    ctx.restore();
    if (game.transition > 0) drawTransition();
  }

  function drawSide() {
    const side = game.side;
    const cam = Math.floor(side.cameraX);
    drawSideBackdrop(cam);

    ctx.save();
    ctx.translate(-cam, 0);
    drawVillage(side);
    drawSideEntranceWorld();
    drawActiveSideEncounterBarriers();
    // Les supports jouables (charrette, tonneaux, paille, escalier) vivent
    // dans le même plan que les acteurs, mais passent derrière leurs pieds.
    for (const platform of currentSidePlatforms()) drawPlatform(platform);
    for (const item of side.pickups) if (!item.taken) drawPickup(item);
    for (const projectile of side.projectiles) drawPlayerProjectile(projectile);
    drawSideDepthScene(side);
    drawWorldParticles(side.particles);
    ctx.restore();

    drawSideEntrancePrompt(cam);
    drawSideMiniMap();
    drawHitConfirm(cam);
    const objectivePortal = currentSideObjectivePortal();
    const gateX = objectivePortal.x;
    const sx = gateX - cam;
    const nearObjective = sidePortalDistance(objectivePortal)
      <= (objectivePortal.interactionRange || 52);
    if (sx > 20 && sx < W - 20 && !nearObjective) {
      ctx.fillStyle = "#f0d9a4";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("▼ OBJECTIF", sx, 94 + Math.sin(performance.now() / 180) * 3);
    }
  }

  function drawSideMiniMap() {
    const graph = window.KageLevels?.mapGraph;
    if (!graph?.nodes?.length) return;
    const visited = new Set(game.side.visitedAreas || []);
    const activeId = game.side.areaId;
    const panelLeft = W - 138;
    const panelTop = 46;
    const panelWidth = 132;
    const panelHeight = 58;
    const minMapX = Math.min(...graph.nodes.map((node) => node.mapX));
    const maxMapX = Math.max(...graph.nodes.map((node) => node.mapX));
    const minMapY = Math.min(...graph.nodes.map((node) => node.mapY));
    const maxMapY = Math.max(...graph.nodes.map((node) => node.mapY));
    const scaleX = Math.min(16, (panelWidth - 20) / Math.max(1, maxMapX - minMapX));
    const scaleY = Math.min(20, (panelHeight - 30) / Math.max(1, maxMapY - minMapY));
    const ox = panelLeft + 10 - minMapX * scaleX;
    const oy = panelTop + 10 - minMapY * scaleY;
    ctx.save();
    ctx.globalAlpha = 0.84;
    ctx.fillStyle = "rgba(4, 6, 9, .82)";
    ctx.fillRect(panelLeft, panelTop, panelWidth, panelHeight);
    ctx.strokeStyle = "rgba(231, 207, 145, .34)";
    ctx.strokeRect(panelLeft + 0.5, panelTop + 0.5, panelWidth - 1, panelHeight - 1);
    const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
    for (const edge of graph.edges || []) {
      const from = nodeById.get(edge.from);
      const to = nodeById.get(edge.to);
      if (!from || !to || (!visited.has(from.id) && !visited.has(to.id))) continue;
      ctx.strokeStyle = edge.kind === "side" ? "#7a6955" : "#4c4142";
      ctx.beginPath();
      ctx.moveTo(ox + from.mapX * scaleX, oy + from.mapY * scaleY);
      ctx.lineTo(ox + to.mapX * scaleX, oy + to.mapY * scaleY);
      ctx.stroke();
    }
    for (const node of graph.nodes) {
      const x = ox + node.mapX * scaleX;
      const y = oy + node.mapY * scaleY;
      ctx.fillStyle = node.id === activeId
        ? "#d84942"
        : (visited.has(node.id) ? "#d8bf82" : "#302d31");
      const size = node.kind === "outdoor" ? 7 : 6;
      ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    }
    ctx.fillStyle = "#d8c89e";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "left";
    ctx.fillText("CARTE DE CAMPAGNE", panelLeft + 7, panelTop + panelHeight - 7);
    ctx.restore();
  }

  function drawPortalDepthVoid(portal, width, objectiveFpsPortal) {
    const voidWidth = Math.max(
      34,
      Math.round(width * (objectiveFpsPortal ? 0.5 : 0.58)),
    );
    const voidHeight = Math.max(
      48,
      Math.round(width * (objectiveFpsPortal ? 0.62 : 0.72)),
    );
    const left = Math.round(portal.x - voidWidth / 2);
    const top = Math.round(SIDE_GROUND_Y - voidHeight);
    const centerX = Math.round(portal.x);
    const horizonY = Math.round(top + voidHeight * 0.58);
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, voidWidth, voidHeight);
    ctx.clip();
    ctx.fillStyle = objectiveFpsPortal ? "#090b0f" : "#0b090c";
    ctx.fillRect(left, top, voidWidth, voidHeight);
    ctx.fillStyle = objectiveFpsPortal ? "#171522" : "#171116";
    ctx.fillRect(left + 3, top + 4, Math.max(1, voidWidth - 6), 7);
    ctx.fillStyle = objectiveFpsPortal ? "#11131b" : "#120e12";
    ctx.fillRect(
      centerX - Math.max(5, Math.round(voidWidth * 0.11)),
      horizonY - 15,
      Math.max(10, Math.round(voidWidth * 0.22)),
      15,
    );
    ctx.fillStyle = objectiveFpsPortal ? "#1c1b24" : "#21171a";
    ctx.beginPath();
    ctx.moveTo(left + 2, SIDE_GROUND_Y);
    ctx.lineTo(centerX - 5, horizonY);
    ctx.lineTo(centerX + 5, horizonY);
    ctx.lineTo(left + voidWidth - 2, SIDE_GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(3, 4, 7, .72)";
    const depthSteps = [0.2, 0.38, 0.57, 0.77, 0.94];
    for (const depth of depthSteps) {
      const y = Math.round(horizonY + (SIDE_GROUND_Y - horizonY) * depth);
      const halfWidth = Math.max(
        6,
        Math.round((voidWidth * 0.08) + (voidWidth * 0.4 * depth)),
      );
      ctx.fillRect(centerX - halfWidth, y, halfWidth * 2, 2);
    }
    ctx.restore();
  }

  function drawSideEntranceWorld() {
    const objective = currentSideObjectivePortal();
    for (const portal of currentSidePortals()) {
      const objectiveFpsPortal = portal === objective
        && portal.type === "fps"
        && fpsMissionIndexForPortal(portal) !== null;
      const image = objectiveFpsPortal
        ? bitmapAssets.sideEntrances[game.chapter]
        : bitmapAssets.depthPortals[portal.visual || "passage-ruelle"];
      const width = objectiveFpsPortal
        ? (game.chapter === 0 ? 166 : 214)
        : ({
            "passage-ruelle": 72,
            "porte-minka": 94,
            "entree-machiya-noren": 94,
            "porte-kura": 112,
            "porte-palissade": 84,
            "porte-laquee": 104,
            "porte-chateau": 116,
            "porte-sanctuaire": 92,
            "route-torii": 116,
            "route-rizieres": 120,
            "faille-moderne": 136,
            "faille-cyber": 144,
          }[portal.visual] || 88);
      const near = nearestSidePortal(1.18) === portal;
      drawPortalDepthVoid(portal, width, objectiveFpsPortal);
      ctx.save();
      if (near) {
        ctx.shadowColor = portal.type === "fps"
          ? "rgba(121, 215, 158, .82)"
          : "rgba(222, 174, 93, .82)";
        ctx.shadowBlur = 14;
      }
      if (!drawGroundedWorldSprite(image, portal.x - width / 2, SIDE_GROUND_Y, width)) {
        if (objectiveFpsPortal) {
          drawTorii(portal.x, game.chapter === 0 ? 185 : 174, game.chapter !== 0);
        } else {
          ctx.fillStyle = "#171319";
          ctx.fillRect(portal.x - 24, SIDE_GROUND_Y - 58, 48, 58);
          ctx.strokeStyle = "#7e5b3b";
          ctx.strokeRect(portal.x - 23.5, SIDE_GROUND_Y - 57.5, 47, 57);
        }
      }
      if (sidePortalBlocksMovement(portal)) {
        const barrierWidth = Math.max(36, Math.round(width * 0.72));
        const barY = SIDE_GROUND_Y - Math.max(28, Math.round(width * 0.42));
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#28191a";
        ctx.fillRect(
          Math.round(portal.x - barrierWidth / 2),
          Math.round(barY),
          barrierWidth,
          7,
        );
        ctx.fillStyle = "#8b4932";
        ctx.fillRect(
          Math.round(portal.x - barrierWidth / 2 + 3),
          Math.round(barY + 2),
          barrierWidth - 6,
          3,
        );
        ctx.fillStyle = "#d5a45b";
        ctx.fillRect(Math.round(portal.x - 4), Math.round(barY - 2), 8, 11);
        ctx.fillStyle = "#26171b";
        ctx.fillRect(Math.round(portal.x - 1), Math.round(barY + 2), 2, 4);
      }
      ctx.restore();
    }
  }

  function drawActiveSideEncounterBarriers() {
    const encounter = currentSideMassiveEncounter();
    if (!encounter?.bounds || game.side.activeEncounterId !== encounter.id) return;
    const boss = currentSideMassiveBoss(encounter);
    if (!isEnemyAlive(boss)) return;
    const authoredBarriers = currentWorldProps().some((prop) =>
      prop.destructible
      && /barriere/i.test(String(prop.file || "")));
    if (authoredBarriers) return;
    const positions = [
      encounter.bounds.x + 4,
      encounter.bounds.x + encounter.bounds.w - 18,
    ];
    for (const x of positions) {
      ctx.save();
      ctx.fillStyle = "#25171a";
      ctx.fillRect(x, SIDE_GROUND_Y - 132, 14, 132);
      ctx.fillStyle = "#7b382f";
      for (let y = SIDE_GROUND_Y - 128; y < SIDE_GROUND_Y; y += 20) {
        ctx.fillRect(x - 4, y, 22, 5);
      }
      ctx.fillStyle = "#d58a43";
      ctx.fillRect(x + 5, SIDE_GROUND_Y - 132, 4, 132);
      ctx.restore();
    }
  }

  function drawSideEntrancePrompt(cam) {
    const entrance = nearestSidePortal();
    if (!entrance) return;
    const screenX = entrance.x - cam;
    if (screenX < 18 || screenX > W - 18) return;
    const panelWidth = 230;
    const panelY = 80;
    ctx.fillStyle = "rgba(7, 10, 13, .9)";
    ctx.fillRect(Math.round(screenX - panelWidth / 2), panelY, panelWidth, 37);
    ctx.strokeStyle = "#e7cf91";
    ctx.strokeRect(Math.round(screenX - panelWidth / 2) + 0.5, panelY + 0.5, panelWidth - 1, 36);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f0d9a4";
    ctx.font = "bold 9px monospace";
    ctx.fillText(String(entrance.label || "PASSAGE").toUpperCase(), screenX, panelY + 14);
    ctx.fillStyle = "#fff0b5";
    ctx.font = "bold 10px monospace";
    ctx.fillText(entrance.prompt, screenX, panelY + 28);
  }

  function drawSideBackdrop(cam) {
    const environmentIndex = currentSideEnvironmentIndex();
    const backdropProfile = currentSideArea()?.backdropProfile || "";
    const castleResidenceBackdrop = [
      "castle-residence",
      "castle-side-residence",
    ].includes(backdropProfile);
    const castleDonjonBackdrop = [
      "castle-donjon",
      "castle-side-donjon",
    ].includes(backdropProfile);
    const modularCastleInterior = castleResidenceBackdrop || castleDonjonBackdrop;
    const parallax = bitmapAssets.parallaxBackgrounds[environmentIndex];
    if (parallax && bitmapReady(parallax.sky)) {
      drawParallaxLayer(parallax.sky, cam, 0, null, false);
      drawParallaxLayer(parallax.far, cam, 0.035, null, false);
      // Les villages et le château ont désormais leurs bâtiments et murs
      // modulaires. Répéter les couches "mid/near" y créait des maisons
      // jumelles et des coutures visuelles à chaque largeur d'écran.
      if ([1, 3, 4, 5, 6].includes(environmentIndex) || modularCastleInterior) {
        drawParallaxLayer(
          parallax.mid,
          cam,
          0.09,
          SIDE_MIDGROUND_SOURCE_Y[environmentIndex],
        );
        drawParallaxLayer(parallax.near, cam, 0.16);
      }
      ctx.fillStyle = castleResidenceBackdrop
        ? "rgba(18, 11, 14, .34)"
        : (castleDonjonBackdrop
          ? "rgba(13, 8, 13, .43)"
          : "rgba(4, 6, 11, .12)");
      ctx.fillRect(0, 0, W, H);
      return;
    }

    if (modularCastleInterior) {
      // Les salles latérales restent composées de couches et de props 2D.
      // Le concept art frontal FPS du donjon n'est jamais projeté derrière
      // le joueur, ce qui évite deux perspectives contradictoires.
      ctx.fillStyle = castleDonjonBackdrop ? "#100b10" : "#171116";
      ctx.fillRect(0, 0, W, H);
      const beamOffset = -((cam * 0.035) % 160);
      ctx.fillStyle = castleDonjonBackdrop ? "#29161d" : "#38231f";
      for (let x = beamOffset - 20; x < W + 20; x += 160) {
        ctx.fillRect(Math.round(x), 0, 7, H);
        ctx.fillRect(Math.round(x - 12), 57, 31, 6);
      }
      return;
    }

    const generatedBackdrop = bitmapAssets.sideBackgrounds[environmentIndex];
    if (bitmapReady(generatedBackdrop)) {
      ctx.drawImage(generatedBackdrop, 0, 0, W, H);
      // Léger voile d'encre : les silhouettes de gameplay restent lisibles
      // malgré le niveau de détail du décor généré.
      ctx.fillStyle = "rgba(4, 6, 11, .18)";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 18; i++) {
        const x = (i * 97 + performance.now() * (4 + (i % 4))) % (W + 80) - 40;
        const y = 155 + ((i * 37) % 120);
        ctx.fillStyle = game.chapter === 0
          ? (i % 3 ? "#bd4b2f" : "#f09a3a")
          : (i % 3 ? "#8e7768" : "#c6a878");
        ctx.fillRect(Math.floor(x), Math.floor(y), i % 4 === 0 ? 2 : 1, 2);
      }
      return;
    }

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#080c18");
    grad.addColorStop(0.52, "#1c2030");
    grad.addColorStop(1, "#4b2422");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#a83238";
    ctx.fillRect(505 - (cam * 0.03) % 700, 44, 35, 35);
    ctx.fillStyle = "#79252f";
    ctx.fillRect(510 - (cam * 0.03) % 700, 48, 4, 4);
    ctx.fillRect(526 - (cam * 0.03) % 700, 60, 6, 5);

    ctx.fillStyle = "#151827";
    for (let x = -80 - (cam * 0.08) % 180; x < W + 180; x += 145) {
      ctx.beginPath();
      ctx.moveTo(x, 225); ctx.lineTo(x + 85, 112); ctx.lineTo(x + 180, 225); ctx.fill();
    }
    ctx.fillStyle = "#232235";
    for (let x = -100 - (cam * 0.16) % 220; x < W + 220; x += 190) {
      ctx.beginPath();
      ctx.moveTo(x, 260); ctx.lineTo(x + 110, 155); ctx.lineTo(x + 225, 260); ctx.fill();
    }
    for (let i = 0; i < 22; i++) {
      const x = (i * 97 + performance.now() * (5 + (i % 4))) % (W + 80) - 40;
      const y = 150 + ((i * 37) % 125);
      ctx.fillStyle = game.chapter === 0
        ? (i % 3 ? "#bd4b2f" : "#f09a3a")
        : (i % 3 ? "#8e7768" : "#c6a878");
      ctx.fillRect(Math.floor(x), Math.floor(y), i % 4 === 0 ? 2 : 1, 2);
    }
  }

  function drawParallaxLayer(
    image,
    cam,
    factor,
    sourceGroundY = null,
    repeat = true,
  ) {
    if (!bitmapReady(image)) return;
    const scale = H / image.naturalHeight;
    const drawY = Number.isFinite(sourceGroundY)
      ? Math.round(SIDE_GROUND_Y - sourceGroundY * scale)
      : 0;
    if (factor === 0) {
      ctx.drawImage(image, 0, drawY, W, H);
      return;
    }
    if (!repeat) {
      const travel = Math.max(0, game.side.width - W) * factor;
      ctx.drawImage(
        image,
        Math.round(-cam * factor),
        drawY,
        Math.ceil(W + travel + 2),
        H,
      );
      return;
    }
    const drawWidth = Math.max(W, image.naturalWidth * scale);
    const offset = -((cam * factor) % drawWidth);
    for (let x = offset - drawWidth; x < W + drawWidth; x += drawWidth) {
      ctx.drawImage(image, Math.round(x), drawY, Math.ceil(drawWidth), H);
    }
  }

  const opaqueBoundsCache = new WeakMap();
  const opaqueGroundBoundsCache = new WeakMap();
  const continuousSurfaceBoundsCache = new WeakMap();
  const opaqueAnimationFrameBoundsCache = new WeakMap();
  const weaponVisualMetricsCache = new WeakMap();

  function opaqueGroundFallbackForImage(image) {
    const source = String(image?.currentSrc || image?.src || "");
    const match = source.match(/([^/?#]+)\.png(?:[?#].*)?$/i);
    const authored = match
      ? ALLEY_WALL_GROUND_BOUNDS[decodeURIComponent(match[1])]
      : null;
    if (authored) {
      return {
        x: authored[0],
        y: authored[1],
        w: authored[2],
        h: authored[3],
      };
    }
    return {
      x: 4,
      y: 4,
      w: Math.max(1, image.naturalWidth - 8),
      h: Math.max(1, image.naturalHeight - 8),
    };
  }

  function opaqueBoundsForImage(image) {
    if (!bitmapReady(image)) return null;
    if (opaqueBoundsCache.has(image)) return opaqueBoundsCache.get(image);

    const fallback = {
      x: 4,
      y: 4,
      w: Math.max(1, image.naturalWidth - 8),
      h: Math.max(1, image.naturalHeight - 8),
    };
    let bounds = fallback;
    try {
      const sampleScale = Math.min(1, 256 / Math.max(image.naturalWidth, image.naturalHeight));
      const sampleWidth = Math.max(1, Math.round(image.naturalWidth * sampleScale));
      const sampleHeight = Math.max(1, Math.round(image.naturalHeight * sampleScale));
      const sampler = document.createElement("canvas");
      sampler.width = sampleWidth;
      sampler.height = sampleHeight;
      const samplerCtx = sampler.getContext("2d", { willReadFrequently: true });
      samplerCtx.imageSmoothingEnabled = false;
      samplerCtx.drawImage(image, 0, 0, sampleWidth, sampleHeight);
      const pixels = samplerCtx.getImageData(0, 0, sampleWidth, sampleHeight).data;
      let minX = sampleWidth, minY = sampleHeight, maxX = -1, maxY = -1;
      for (let y = 0; y < sampleHeight; y++) {
        for (let x = 0; x < sampleWidth; x++) {
          if (pixels[(y * sampleWidth + x) * 4 + 3] < 18) continue;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
      if (maxX >= minX && maxY >= minY) {
        const inverseScale = 1 / sampleScale;
        const pad = Math.ceil(inverseScale);
        const x = Math.max(0, Math.floor(minX * inverseScale) - pad);
        const y = Math.max(0, Math.floor(minY * inverseScale) - pad);
        const right = Math.min(image.naturalWidth, Math.ceil((maxX + 1) * inverseScale) + pad);
        const bottom = Math.min(image.naturalHeight, Math.ceil((maxY + 1) * inverseScale) + pad);
        bounds = { x, y, w: Math.max(1, right - x), h: Math.max(1, bottom - y) };
      }
    } catch (_) {
      // Sous file:// certains navigateurs interdisent la lecture alpha. Le
      // petit crop de secours retire quand même la bordure des exports.
    }
    opaqueBoundsCache.set(image, bounds);
    return bounds;
  }

  function opaqueGroundBoundsForImage(image) {
    if (!bitmapReady(image)) return null;
    if (opaqueGroundBoundsCache.has(image)) {
      return opaqueGroundBoundsCache.get(image);
    }

    const fallback = opaqueGroundFallbackForImage(image);
    let bounds = fallback;
    try {
      const sampleWidth = Math.max(1, image.naturalWidth);
      const sampleHeight = Math.max(1, image.naturalHeight);
      const sampler = document.createElement("canvas");
      sampler.width = sampleWidth;
      sampler.height = sampleHeight;
      const samplerCtx = sampler.getContext("2d", { willReadFrequently: true });
      samplerCtx.imageSmoothingEnabled = false;
      samplerCtx.drawImage(image, 0, 0);
      const pixels = samplerCtx.getImageData(0, 0, sampleWidth, sampleHeight).data;
      const rowOpaque = new Uint32Array(sampleHeight);
      for (let y = 0; y < sampleHeight; y++) {
        for (let x = 0; x < sampleWidth; x++) {
          if (pixels[(y * sampleWidth + x) * 4 + 3] >= 18) {
            rowOpaque[y] += 1;
          }
        }
      }
      const verticalBands = [];
      let bandStart = -1;
      let bandLastOpaque = -1;
      let bandScore = 0;
      for (let y = 0; y <= sampleHeight; y++) {
        const opaqueCount = y < sampleHeight ? rowOpaque[y] : 0;
        if (opaqueCount > 0) {
          if (bandStart < 0) bandStart = y;
          bandLastOpaque = y;
          bandScore += opaqueCount;
        } else if (
          bandStart >= 0
          && (y === sampleHeight || y - bandLastOpaque > 2)
        ) {
          verticalBands.push({
            start: bandStart,
            end: bandLastOpaque + 1,
            score: bandScore,
          });
          bandStart = -1;
          bandLastOpaque = -1;
          bandScore = 0;
        }
      }
      const primaryBand = verticalBands
        .sort((a, b) => b.score - a.score || (b.end - b.start) - (a.end - a.start))[0];
      const columnOpaque = new Uint32Array(sampleWidth);
      if (primaryBand) {
        for (let y = primaryBand.start; y < primaryBand.end; y++) {
          for (let x = 0; x < sampleWidth; x++) {
            if (pixels[(y * sampleWidth + x) * 4 + 3] >= 18) {
              columnOpaque[x] += 1;
            }
          }
        }
      }
      const horizontalBands = [];
      let columnStart = -1;
      let columnLastOpaque = -1;
      let columnScore = 0;
      for (let x = 0; x <= sampleWidth; x++) {
        const opaqueCount = x < sampleWidth ? columnOpaque[x] : 0;
        if (opaqueCount > 0) {
          if (columnStart < 0) columnStart = x;
          columnLastOpaque = x;
          columnScore += opaqueCount;
        } else if (
          columnStart >= 0
          && (x === sampleWidth || x - columnLastOpaque > 2)
        ) {
          horizontalBands.push({
            start: columnStart,
            end: columnLastOpaque + 1,
            score: columnScore,
          });
          columnStart = -1;
          columnLastOpaque = -1;
          columnScore = 0;
        }
      }
      const primaryColumns = horizontalBands
        .sort((a, b) => b.score - a.score || (b.end - b.start) - (a.end - a.start))[0];
      let minX = sampleWidth, minY = sampleHeight, maxX = -1, maxY = -1;
      if (primaryBand && primaryColumns) {
        for (let y = primaryBand.start; y < primaryBand.end; y++) {
          for (let x = primaryColumns.start; x < primaryColumns.end; x++) {
            if (pixels[(y * sampleWidth + x) * 4 + 3] < 18) continue;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
      if (maxX >= minX && maxY >= minY) {
        const pad = 1;
        const x = Math.max(0, minX - pad);
        const y = Math.max(0, minY - pad);
        const right = Math.min(image.naturalWidth, maxX + 1 + pad);
        // Aucun padding sous le dernier pixel opaque : ce bord touche groundY.
        const bottom = Math.min(image.naturalHeight, maxY + 1);
        bounds = {
          x,
          y,
          w: Math.max(1, right - x),
          h: Math.max(1, bottom - y),
        };
      }
    } catch (_) {
      // Le crop de secours correspond à la bordure transparente des exports
      // lorsque file:// interdit exceptionnellement la lecture alpha.
    }
    opaqueGroundBoundsCache.set(image, bounds);
    return bounds;
  }

  function continuousSurfaceBoundsForImage(image) {
    if (!bitmapReady(image)) return null;
    if (continuousSurfaceBoundsCache.has(image)) {
      return continuousSurfaceBoundsCache.get(image);
    }
    const groundedBounds = opaqueGroundBoundsForImage(image);
    if (!groundedBounds) return null;
    let bounds = groundedBounds;
    try {
      const sampler = document.createElement("canvas");
      sampler.width = image.naturalWidth;
      sampler.height = image.naturalHeight;
      const samplerCtx = sampler.getContext("2d", { willReadFrequently: true });
      samplerCtx.imageSmoothingEnabled = false;
      samplerCtx.drawImage(image, 0, 0);
      const pixels = samplerCtx.getImageData(
        0,
        0,
        sampler.width,
        sampler.height,
      ).data;
      const inset = Math.max(1, Math.round(groundedBounds.w * 0.24));
      const coreX = groundedBounds.x + inset;
      const coreWidth = Math.max(1, groundedBounds.w - inset * 2);
      const minimumSolidPixels = Math.ceil(coreWidth * 0.72);
      const bottom = groundedBounds.y + groundedBounds.h;
      let surfaceY = groundedBounds.y;
      for (let y = groundedBounds.y; y < bottom; y++) {
        let solidPixels = 0;
        for (let x = coreX; x < coreX + coreWidth; x++) {
          if (pixels[(y * sampler.width + x) * 4 + 3] >= 18) {
            solidPixels += 1;
          }
        }
        if (solidPixels >= minimumSolidPixels) {
          surfaceY = y;
          break;
        }
      }
      bounds = {
        x: groundedBounds.x,
        y: surfaceY,
        w: groundedBounds.w,
        h: Math.max(1, bottom - surfaceY),
      };
    } catch (_) {
      // Le serveur HTTP normal utilise l'analyse alpha. Le fallback conserve
      // les bounds déjà dépourvus de padding sous le contact.
    }
    continuousSurfaceBoundsCache.set(image, bounds);
    return bounds;
  }

  function weaponVisualMetrics(image) {
    if (!bitmapReady(image)) return { sourceRotation: 0, coverage: 0 };
    if (weaponVisualMetricsCache.has(image)) {
      return weaponVisualMetricsCache.get(image);
    }
    let metrics = { sourceRotation: 0, coverage: 0 };
    try {
      const sampleScale = Math.min(1, 160 / Math.max(
        image.naturalWidth,
        image.naturalHeight,
      ));
      const sampleWidth = Math.max(1, Math.round(image.naturalWidth * sampleScale));
      const sampleHeight = Math.max(1, Math.round(image.naturalHeight * sampleScale));
      const sampler = document.createElement("canvas");
      sampler.width = sampleWidth;
      sampler.height = sampleHeight;
      const samplerCtx = sampler.getContext("2d", { willReadFrequently: true });
      samplerCtx.imageSmoothingEnabled = false;
      samplerCtx.drawImage(image, 0, 0, sampleWidth, sampleHeight);
      const pixels = samplerCtx.getImageData(0, 0, sampleWidth, sampleHeight).data;
      let count = 0;
      let sumX = 0;
      let sumY = 0;
      for (let y = 0; y < sampleHeight; y += 1) {
        for (let x = 0; x < sampleWidth; x += 1) {
          if (pixels[(y * sampleWidth + x) * 4 + 3] < 32) continue;
          count += 1;
          sumX += x;
          sumY += y;
        }
      }
      if (count > 4) {
        const centerX = sumX / count;
        const centerY = sumY / count;
        let covarianceXX = 0;
        let covarianceYY = 0;
        let covarianceXY = 0;
        for (let y = 0; y < sampleHeight; y += 1) {
          for (let x = 0; x < sampleWidth; x += 1) {
            if (pixels[(y * sampleWidth + x) * 4 + 3] < 32) continue;
            const dx = x - centerX;
            const dy = y - centerY;
            covarianceXX += dx * dx;
            covarianceYY += dy * dy;
            covarianceXY += dx * dy;
          }
        }
        metrics = {
          sourceRotation: 0.5 * Math.atan2(
            covarianceXY * 2,
            covarianceXX - covarianceYY,
          ),
          coverage: count / (sampleWidth * sampleHeight),
        };
      }
    } catch (_) {
      // Le rendu file:// conserve l'orientation déclarée si la lecture alpha
      // est interdite. Sous HTTP, chaque arme est normalisée une seule fois.
    }
    weaponVisualMetricsCache.set(image, metrics);
    return metrics;
  }

  function opaqueAnimationFrameBounds(animationSet, animation, frame) {
    const image = animationSet && animationSet[animation];
    if (!bitmapReady(image)) return null;
    let imageCache = opaqueAnimationFrameBoundsCache.get(image);
    if (!imageCache) {
      imageCache = new Map();
      opaqueAnimationFrameBoundsCache.set(image, imageCache);
    }
    const normalizedFrame = Math.floor(frame % 6);
    if (imageCache.has(normalizedFrame)) return imageCache.get(normalizedFrame);
    const sourceX = Math.round(normalizedFrame * image.naturalWidth / 6);
    const sourceRight = Math.round((normalizedFrame + 1) * image.naturalWidth / 6);
    const frameWidth = Math.max(1, sourceRight - sourceX);
    const fallback = {
      x: sourceX,
      y: 0,
      w: frameWidth,
      h: image.naturalHeight,
    };
    let bounds = fallback;
    try {
      const scale = Math.min(1, 256 / Math.max(frameWidth, image.naturalHeight));
      const sampleWidth = Math.max(1, Math.round(frameWidth * scale));
      const sampleHeight = Math.max(1, Math.round(image.naturalHeight * scale));
      const sampler = document.createElement("canvas");
      sampler.width = sampleWidth;
      sampler.height = sampleHeight;
      const samplerCtx = sampler.getContext("2d", { willReadFrequently: true });
      samplerCtx.imageSmoothingEnabled = false;
      samplerCtx.drawImage(
        image,
        sourceX,
        0,
        frameWidth,
        image.naturalHeight,
        0,
        0,
        sampleWidth,
        sampleHeight,
      );
      const pixels = samplerCtx.getImageData(0, 0, sampleWidth, sampleHeight).data;
      let minX = sampleWidth, minY = sampleHeight, maxX = -1, maxY = -1;
      for (let y = 0; y < sampleHeight; y += 1) {
        for (let x = 0; x < sampleWidth; x += 1) {
          if (pixels[(y * sampleWidth + x) * 4 + 3] < 18) continue;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
      if (maxX >= minX && maxY >= minY) {
        const inverse = 1 / scale;
        const pad = Math.ceil(inverse);
        const x = Math.max(0, Math.floor(minX * inverse) - pad);
        const y = Math.max(0, Math.floor(minY * inverse) - pad);
        const right = Math.min(frameWidth, Math.ceil((maxX + 1) * inverse) + pad);
        const bottom = Math.min(
          image.naturalHeight,
          Math.ceil((maxY + 1) * inverse) + pad,
        );
        bounds = {
          x: sourceX + x,
          y,
          w: Math.max(1, right - x),
          h: Math.max(1, bottom - y),
        };
      }
    } catch (_) {
      // Les tests sans canvas alpha et certains file:// gardent la cellule
      // entière ; le rendu HTTP utilise automatiquement le crop précis.
    }
    imageCache.set(normalizedFrame, bounds);
    return bounds;
  }

  function drawOpaqueBitmap(image, x, y, width, height, sourceBounds = null) {
    const bounds = sourceBounds || opaqueBoundsForImage(image);
    if (!bounds) return false;
    ctx.drawImage(
      image,
      bounds.x,
      bounds.y,
      bounds.w,
      bounds.h,
      Math.round(x),
      Math.round(y),
      Math.round(width),
      Math.round(height),
    );
    return true;
  }

  function drawGroundedWorldSprite(image, x, groundY, visibleWidth) {
    const bounds = opaqueGroundBoundsForImage(image);
    if (!bounds) return false;
    const visibleHeight = Math.max(1, visibleWidth * bounds.h / bounds.w);
    drawOpaqueBitmap(
      image,
      x,
      groundY - visibleHeight,
      visibleWidth,
      visibleHeight,
      bounds,
    );
    return { width: visibleWidth, height: visibleHeight };
  }

  function drawTiledWorldSprite(image, x, y, width, height) {
    const bounds = opaqueBoundsForImage(image);
    if (!bounds) return false;
    const tileWidth = Math.max(8, Math.round(bounds.w / bounds.h * height));
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    for (let tileX = x; tileX < x + width; tileX += tileWidth) {
      ctx.drawImage(
        image,
        bounds.x,
        bounds.y,
        bounds.w,
        bounds.h,
        Math.round(tileX),
        y,
        tileWidth,
        height,
      );
    }
    ctx.restore();
    return true;
  }

  function drawContinuousGroundSprite(image, x, y, width, height) {
    const bounds = continuousSurfaceBoundsForImage(image);
    if (!bounds) return false;
    // Les exports de terrain possèdent des extrémités arrondies destinées aux
    // bords de niveau. Répéter l'image entière créait un chapelet de blocs
    // disjoints. Seul le cœur du matériau est répété, ancré aux coordonnées du
    // monde pour que les raccords ne glissent pas avec la caméra.
    const inset = Math.max(1, Math.round(bounds.w * 0.24));
    const sourceX = bounds.x + inset;
    const sourceWidth = Math.max(1, bounds.w - inset * 2);
    const tileWidth = Math.max(48, Math.round(height * sourceWidth / bounds.h));
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    const firstTile = x - ((x % tileWidth) + tileWidth) % tileWidth;
    for (let tileX = firstTile; tileX < x + width; tileX += tileWidth) {
      ctx.drawImage(
        image,
        sourceX,
        bounds.y,
        sourceWidth,
        bounds.h,
        Math.round(tileX),
        y,
        tileWidth + 1,
        height,
      );
    }
    ctx.restore();
    return true;
  }

  function worldPropImageByFile(file) {
    if (bitmapAssets.alleyWalls[file]) return bitmapAssets.alleyWalls[file];
    if (bitmapAssets.depthPortals[file]) return bitmapAssets.depthPortals[file];
    for (const propSet of bitmapAssets.worldProps) {
      const match = propSet.find((prop) => prop.file === file);
      if (match?.image) return match.image;
    }
    return null;
  }

  function worldPropIsVisible(prop) {
    if (!prop.destructible) return true;
    const encounter = currentSideMassiveEncounter();
    if (!encounter) return true;
    return isEnemyAlive(currentSideMassiveBoss(encounter));
  }

  const fallbackWorldPropsCache = new Map();

  function coherentFallbackWorldProps(environmentIndex) {
    if (fallbackWorldPropsCache.has(environmentIndex)) {
      return fallbackWorldPropsCache.get(environmentIndex);
    }
    const rawProps = bitmapAssets.worldProps[environmentIndex] || [];
    const worldFiles = new Set([
      "barriere-village",
      "tonneau-provisions",
      "foyer-incendie",
      "charrette-cassee",
      "tas-paille",
      "puits-pierre",
      "autel-route",
      "escalier-bois",
      "armure-vide",
      "ratelier-vide",
      "racines-donjon",
    ]);
    const frontFiles = new Set(["brasero-fer", "paravent-dechire"]);
    const nearFiles = new Set([
      "foyer-incendie",
      "puits-pierre",
      "autel-route",
      "racines-donjon",
    ]);
    const normalized = rawProps.map((prop, index) => {
      const layer = frontFiles.has(prop.file)
        ? "front"
        : (worldFiles.has(prop.file) ? "world" : (prop.layer || "back"));
      const baselineY = layer === "front"
        ? 304
        : (nearFiles.has(prop.file) ? 302 : SIDE_GROUND_Y);
      return {
        ...prop,
        id: `legacy-safe-${environmentIndex}-${prop.file}-${index}`,
        layer,
        bottomY: SIDE_GROUND_Y,
        baselineY,
        depthBias: layer === "front" ? 20 : (layer === "world" ? 0 : -20),
        perspectiveScale: layer === "front" ? 1.05 : 1,
        groundAnchor: [0.5, 1],
        contactMode: "opaque-bottom",
        legacyFallback: true,
      };
    });
    const architecture = [];
    const routeWidth = Math.max(2500, Number(game.side?.width) || 0);
    if (environmentIndex === 0) {
      const sequence = [
        "mur-platre-intact",
        "mur-platre-fume",
        "mur-platre-lattis",
        "mur-porte-service",
        "mur-fenetre-barreaux",
        "mur-volets-pluie",
        "mur-cedre-brule",
        "mur-quarantaine",
        "mur-pierre-jokamachi",
      ];
      for (let x = 0, index = 0; x < routeWidth; x += 126, index += 1) {
        const file = sequence[index % sequence.length];
        architecture.push({
          id: `legacy-safe-wall-${index}`,
          file,
          image: bitmapAssets.alleyWalls[file],
          x,
          width: Math.min(132, routeWidth - x + 6),
          layer: "back",
          bottomY: SIDE_GROUND_Y,
          baselineY: SIDE_GROUND_Y,
          depthBias: -40,
          perspectiveScale: 1,
          groundAnchor: [0.5, 1],
          contactMode: "opaque-bottom",
          legacyFallback: true,
        });
      }
    } else if (environmentIndex === 2) {
      const shoji = rawProps.find((prop) => prop.file === "mur-shoji")?.image;
      for (let x = 0, index = 0; x < routeWidth; x += 166, index += 1) {
        architecture.push({
          id: `legacy-safe-shoji-${index}`,
          file: "mur-shoji",
          image: shoji,
          x,
          width: Math.min(176, routeWidth - x + 10),
          layer: "back",
          bottomY: SIDE_GROUND_Y,
          baselineY: SIDE_GROUND_Y,
          depthBias: -35,
          perspectiveScale: 1,
          groundAnchor: [0.5, 1],
          contactMode: "opaque-bottom",
          legacyFallback: true,
        });
      }
    }
    const fallback = [...architecture, ...normalized];
    fallbackWorldPropsCache.set(environmentIndex, fallback);
    return fallback;
  }

  function currentWorldProps() {
    if (previewEnvironmentIndex !== null) {
      return coherentFallbackWorldProps(previewEnvironmentIndex);
    }
    const areaProps = currentSideArea()?.props;
    if (Array.isArray(areaProps)) {
      return areaProps
        .filter(worldPropIsVisible)
        .map((prop) => ({
          ...prop,
          image: worldPropImageByFile(prop.file),
        }));
    }
    return ALLOW_LEGACY_LAYOUT
      ? coherentFallbackWorldProps(currentSideEnvironmentIndex())
      : [];
  }

  function drawModularWorldProp(prop) {
    if (!bitmapReady(prop?.image)) return false;
    const bottomY = prop.bottomY ?? SIDE_GROUND_Y;
    const perspectiveScale = Number(prop.perspectiveScale)
      || clamp(1 + (bottomY - SIDE_GROUND_Y) * 0.012, 0.86, 1.12);
    const width = prop.width * perspectiveScale;
    const centeredX = prop.x - (width - prop.width) / 2;
    drawGroundedWorldSprite(prop.image, centeredX, bottomY, width);
    return true;
  }

  function drawModularWorldProps(layer = "back") {
    const props = currentWorldProps()
      .filter((prop) => (prop.layer || "back") === layer)
      .sort((a, b) =>
        (a.baselineY ?? a.bottomY ?? SIDE_GROUND_Y)
          - (b.baselineY ?? b.bottomY ?? SIDE_GROUND_Y)
        || (Number(a.depthBias) || 0) - (Number(b.depthBias) || 0)
        || a.x - b.x);
    let drawn = false;
    for (const prop of props) {
      drawn = drawModularWorldProp(prop) || drawn;
    }
    return drawn;
  }

  function drawDetachedEnemyEquipment(enemy) {
    const hazard = enemy.detachedEquipment;
    const image = weaponBitmapForEnemy(enemy);
    if (!hazard?.active || !bitmapReady(image)) return false;
    const width = Math.max(72, Number(hazard.width) || 120);
    return drawGroundedWorldSprite(
      image,
      hazard.x - width / 2,
      hazard.bottomY || SIDE_GROUND_Y,
      width,
    );
  }

  function drawSideDepthScene(side) {
    const sceneEntries = [];
    for (const prop of currentWorldProps()) {
      const layer = prop.layer || "back";
      if (!["world", "front"].includes(layer) || !bitmapReady(prop.image)) continue;
      sceneEntries.push({
        kind: "prop",
        payload: prop,
        baseline: prop.baselineY ?? prop.bottomY ?? SIDE_GROUND_Y,
        depthBias: Number(prop.depthBias) || 0,
        tieOrder: 0,
        x: prop.x,
      });
    }
    for (const enemy of side.enemies) {
      if (enemy.detachedEquipment?.active) {
        sceneEntries.push({
          kind: "equipment",
          payload: enemy,
          baseline: enemy.detachedEquipment.bottomY || SIDE_GROUND_Y,
          depthBias: 0.1,
          tieOrder: 1,
          x: enemy.detachedEquipment.x,
        });
      }
      if (!isEnemyVisible(enemy)) continue;
      sceneEntries.push({
        kind: "enemy",
        payload: enemy,
        baseline: enemy.y + enemy.h,
        depthBias: 0,
        tieOrder: 1,
        x: enemy.x,
      });
    }
    sceneEntries.push({
      kind: "player",
      payload: side.player,
      baseline: side.player.y + side.player.h,
      depthBias: 0,
      tieOrder: 2,
      x: side.player.x,
    });

    sceneEntries.sort((a, b) =>
      a.baseline - b.baseline
      || a.depthBias - b.depthBias
      || a.tieOrder - b.tieOrder
      || a.x - b.x);
    for (const entry of sceneEntries) {
      if (entry.kind === "prop") drawModularWorldProp(entry.payload);
      else if (entry.kind === "equipment") drawDetachedEnemyEquipment(entry.payload);
      else if (entry.kind === "enemy") drawZombie2d(entry.payload);
      else drawSamurai2d(entry.payload);
    }
  }

  function hasModularChapterProps() {
    return currentWorldProps()
      .some((prop) => bitmapReady(prop.image));
  }

  function drawVillage(side) {
    const environmentIndex = currentSideEnvironmentIndex();
    const hasGeneratedBackdrop = bitmapReady(bitmapAssets.parallaxBackgrounds[environmentIndex]?.sky)
      || bitmapReady(bitmapAssets.sideBackgrounds[environmentIndex]);
    const tiles = bitmapAssets.platformTiles[environmentIndex];
    const groundTile = bitmapAssets.groundVisuals[
      currentSideArea()?.groundVisual
    ] || tiles?.ground;
    const hasBackProps = drawModularWorldProps("back");
    const visualGroundY = SIDE_GROUND_Y - SIDE_GROUND_VISUAL_OVERLAP;
    const visualGroundDepth = SIDE_GROUND_DEPTH + SIDE_GROUND_VISUAL_OVERLAP;
    ctx.fillStyle = hasGeneratedBackdrop ? "rgba(16, 14, 19, .72)" : "#161219";
    ctx.fillRect(0, visualGroundY, side.width, visualGroundDepth);
    if (!drawContinuousGroundSprite(
      groundTile,
      0,
      visualGroundY,
      side.width,
      visualGroundDepth,
    )) {
      ctx.fillStyle = hasGeneratedBackdrop ? "rgba(72, 49, 40, .78)" : "#2a2020";
      ctx.fillRect(0, visualGroundY, side.width, 7);
      ctx.fillStyle = "#42302a";
      for (let x = 0; x < side.width; x += 18) {
        ctx.fillRect(x, visualGroundY + 7 + (x % 3), 11, 3);
      }
    }

    // Maisons et accessoires restent des sprites indépendants des quatre
    // couches : chaque prop peut être déplacé sans recoller le fond.
    if (hasGeneratedBackdrop || hasBackProps) return;

    const houses = [75, 560, 1030, 1290, 1580, 1860, 2260];
    for (let i = 0; i < houses.length; i++) {
      const x = houses[i];
      const h = 58 + (i % 3) * 12;
      ctx.fillStyle = "#171417";
      ctx.fillRect(x, SIDE_GROUND_Y - h, 105, h);
      ctx.fillStyle = "#30211e";
      ctx.beginPath();
      ctx.moveTo(x - 12, SIDE_GROUND_Y - h);
      ctx.lineTo(x + 52, SIDE_GROUND_Y - h - 25);
      ctx.lineTo(x + 117, SIDE_GROUND_Y - h);
      ctx.fill();
      ctx.fillStyle = i % 2 ? "#b7482c" : "#6f2d25";
      ctx.fillRect(x + 25, SIDE_GROUND_Y - h + 22, 10, 14);
      ctx.fillRect(x + 69, SIDE_GROUND_Y - h + 22, 10, 14);
      if (i === 1 || i === 4) {
        ctx.fillStyle = "#e47732";
        ctx.fillRect(x + 27, SIDE_GROUND_Y - h + 24, 6, 9);
        ctx.fillRect(x + 71, SIDE_GROUND_Y - h + 24, 6, 9);
      }
    }
    for (let x = 330; x < side.width; x += 430) {
      drawBamboo(x, SIDE_GROUND_Y, 1 + (x % 3) * 0.12);
    }
  }

  function drawBamboo(x, ground, scale) {
    ctx.fillStyle = "#17261d";
    for (let i = 0; i < 4; i++) {
      const bx = x + i * 9;
      const h = (70 + i * 17) * scale;
      ctx.fillRect(bx, ground - h, 4, h);
      ctx.fillStyle = "#2e4930";
      for (let y = ground - h + 14; y < ground; y += 16) ctx.fillRect(bx - 1, y, 6, 2);
      ctx.fillStyle = "#17261d";
      ctx.fillRect(bx - 10, ground - h + 20, 11, 3);
      ctx.fillRect(bx + 4, ground - h + 34, 12, 3);
    }
  }

  function drawTorii(x, y, castle) {
    ctx.fillStyle = castle ? "#401b1d" : "#6e1d24";
    ctx.fillRect(x - 44, y + 20, 9, 96);
    ctx.fillRect(x + 35, y + 20, 9, 96);
    ctx.fillStyle = castle ? "#622426" : "#a32a31";
    ctx.fillRect(x - 58, y + 9, 116, 11);
    ctx.fillRect(x - 48, y + 26, 96, 7);
    ctx.fillRect(x - 64, y + 5, 128, 5);
    ctx.fillStyle = "#171016";
    ctx.fillRect(x - 27, y + 51, 54, 65);
    if (castle) {
      ctx.fillStyle = "#21171b";
      ctx.fillRect(x - 92, y - 40, 184, 65);
      ctx.beginPath(); ctx.moveTo(x - 112, y - 40); ctx.lineTo(x, y - 86); ctx.lineTo(x + 112, y - 40); ctx.fill();
    }
  }

  function drawPlatform(p) {
    if (p.visual === false) return;
    const tiles = bitmapAssets.platformTiles[currentSideEnvironmentIndex()];
    const tile = tiles?.[p.tile || "ledge"] || tiles?.ledge;
    const visualHeight = p.visualHeight || Math.max(18, p.h);
    const structuralFloor = p.routeRole === "structuralFloor"
      && /storey|floor|gallery/i.test(String(p.owner || p.id || ""));
    if (structuralFloor && p.y + visualHeight < SIDE_GROUND_Y - 4) {
      const supportTop = p.y + Math.min(visualHeight, 18);
      ctx.fillStyle = "#24191a";
      for (let supportX = p.x + 18; supportX < p.x + p.w - 8; supportX += 92) {
        ctx.fillRect(Math.round(supportX), supportTop, 7, SIDE_GROUND_Y - supportTop);
        ctx.fillStyle = "#5b392c";
        ctx.fillRect(Math.round(supportX + 2), supportTop, 2, SIDE_GROUND_Y - supportTop);
        ctx.fillStyle = "#24191a";
      }
      ctx.fillStyle = "#452c25";
      ctx.fillRect(
        p.x + 6,
        Math.min(SIDE_GROUND_Y - 8, supportTop + 26),
        Math.max(8, p.w - 12),
        5,
      );
    }
    // Une plateforme correspond à un sprite complet, jamais à une répétition
    // de ses cordes et de ses embouts. Son bord supérieur est exactement la
    // ligne utilisée par la collision.
    if (drawOpaqueBitmap(tile, p.x, p.y, p.w, visualHeight)) return;
    ctx.fillStyle = "#382d28"; ctx.fillRect(p.x, p.y, p.w, visualHeight);
    ctx.fillStyle = "#655044"; ctx.fillRect(p.x, p.y, p.w, 3);
    ctx.fillStyle = "#171419";
    for (let x = p.x + 8; x < p.x + p.w; x += 18) {
      ctx.fillRect(x, p.y + 4, 3, Math.max(5, visualHeight - 6));
    }
  }

  function modularAnimationReady(animationSet, animation) {
    return Boolean(animationSet && bitmapReady(animationSet[animation]));
  }

  function animationSetForEnemy(enemy, fallbackIndex) {
    return animationSetForRosterEntry(enemy?.modularEntry)
      || bitmapAssets.modularEnemies[fallbackIndex];
  }

  function weaponKind(weaponAsset = {}) {
    const text = `${weaponAsset.weaponClass || ""} ${weaponAsset.animationProfile || ""} ${weaponAsset.family || ""} ${weaponAsset.id || ""} ${weaponAsset.name || ""} ${weaponAsset.file || ""}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (/tessen|eventail|warfan|\bfan\b/.test(text)) return "fan";
    if (/bouclier|plaque|carapace|joug|guard|shield/.test(text)) return "guard";
    if (/yari|naginata|shakujo|spear|lance|bambou|polearm|sodegarami|sasumata|tsukubo|nagamaki|\bbo\b|\bjo\b/.test(text)) return "pole";
    if (/otsuchi|maillet|belier|masse|marteau|taiko|kanabo|tetsubo|masakari|\bono\b|hammer|heavy/.test(text)) return "heavy";
    if (/tanto|jitte|hachiwari|wakizashi|short|dagger/.test(text)) return "short";
    if (/chaine|fleau|menotte|ancre|kusari|chigiriki|manriki|chain/.test(text)) return "chain";
    return "blade";
  }

  function weaponScaleForKind(kind) {
    return {
      blade: 1,
      short: 0.72,
      pole: 1.18,
      heavy: 1.05,
      chain: 0.95,
      guard: 0.8,
      fan: 0.82,
    }[kind] || 1;
  }

  function drawWeaponImage(image, options) {
    const visible = opaqueBoundsForImage(image) || {
      x: 0,
      y: 0,
      w: image.naturalWidth,
      h: image.naturalHeight,
    };
    const {
      anchor = [0.16, 0.5],
      maxDimension = 44,
      widthBias = 1,
    } = options;
    const crop = options.crop || [visible.x, visible.y, visible.w, visible.h];
    const [sx, sy, sw, sh] = crop;
    const sourceMax = Math.max(sw, sh, 1);
    const drawWidth = sw / sourceMax * maxDimension * widthBias;
    const drawHeight = sh / sourceMax * maxDimension;
    const cropAnchor = options.anchorSpace === "crop"
      ? anchor
      : [
          (image.naturalWidth * anchor[0] - sx) / Math.max(1, sw),
          (image.naturalHeight * anchor[1] - sy) / Math.max(1, sh),
        ];
    ctx.drawImage(
      image,
      sx,
      sy,
      sw,
      sh,
      -drawWidth * cropAnchor[0],
      -drawHeight * cropAnchor[1],
      drawWidth,
      drawHeight,
    );
  }

  function weaponRigFrame(rigSet, animation, frame) {
    const frames = rigSet?.animations?.[animation];
    if (!Array.isArray(frames) || !frames.length) return null;
    const normalizedFrame = Math.abs(Math.floor(Number(frame) || 0)) % frames.length;
    const rig = frames[normalizedFrame];
    if (
      !rig
      || !Array.isArray(rig.primaryHand)
      || rig.primaryHand.length !== 2
      || !Array.isArray(rig.secondaryHand)
      || rig.secondaryHand.length !== 2
      || !Number.isFinite(rig.angle)
      || !Number.isFinite(rig.scale)
    ) return null;
    return rig;
  }

  function enemyWeaponRig(enemy, animation, frame, fps = false) {
    // Les rigs calculés sur les planches latérales restent exacts pour les
    // profils FPS gauche/droite. En face/dos, les réutiliser décale l'arme
    // jusqu'au bord du billboard ; on repasse donc sur l'ancre FPS centrée
    // tant qu'une vraie banque directionnelle de mains n'est pas fournie.
    if (
      fps
      && ["front", "back"].includes(enemy?.viewDirection)
      && !enemy?.modularEntry?.fpsWeaponRig?.directions?.[enemy.viewDirection]
    ) {
      return null;
    }
    const directionalFpsRig = fps
      ? enemy?.modularEntry?.fpsWeaponRig?.directions?.[enemy?.viewDirection]
      : null;
    if (directionalFpsRig) {
      return weaponRigFrame(directionalFpsRig, animation, frame);
    }
    if (fps && enemy?.modularEntry?.fpsWeaponRig) {
      return weaponRigFrame(
        enemy.modularEntry.fpsWeaponRig,
        animation,
        frame,
      );
    }
    return weaponRigFrame(enemy?.modularEntry?.weaponRig, animation, frame);
  }

  function playerRosterEntry() {
    return modularRoster.characters.find((entry) =>
      entry.category === "player" && entry.id === "akio");
  }

  function playerFrameWeaponRig(animation, frame, view = "side") {
    const playerEntry = playerRosterEntry();
    return weaponRigFrame(
      view === "fps" ? playerEntry?.fpsWeaponRig : playerEntry?.weaponRig,
      animation,
      frame,
    );
  }

  function weaponLayerForFrame(entry, rig, view = "side") {
    if (["behind-body", "front-body", "hidden"].includes(rig?.layer)) {
      return rig.layer;
    }
    const declaredOrder = view === "fps"
      ? entry?.fpsRenderOrder
      : entry?.weaponRenderOrder;
    if (Array.isArray(declaredOrder)) {
      return declaredOrder.indexOf("weapon") <= declaredOrder.indexOf("body")
        ? "behind-body"
        : "front-body";
    }
    return "front-body";
  }

  function playerWeaponPoseOffset(weapon, view) {
    const family = weaponFamilyKey(weapon);
    return PLAYER_WEAPON_POSE_OFFSETS[view]?.[family] || 0;
  }

  function normalizedWeaponRotation(image, weapon, view) {
    const sourceRotation = weaponVisualMetrics(image).sourceRotation || 0;
    return -sourceRotation + playerWeaponPoseOffset(weapon, view);
  }

  function playerWeaponAnchor(image, weapon, declaredAnchor) {
    const family = weaponFamilyKey(weapon);
    const sourceRotation = weaponVisualMetrics(image).sourceRotation || 0;
    if (family === "fan") return [0.5, 0.9];
    if (family === "throwing") return [0.5, 0.5];
    if (family === "bow") return declaredAnchor || [0.62, 0.5];
    if (Math.abs(sourceRotation) > 0.28) {
      return sourceRotation < 0 ? [0.14, 0.86] : [0.14, 0.14];
    }
    return declaredAnchor || [0.16, 0.5];
  }

  function enemyWeaponAnchor(image, enemy, kind) {
    if (Array.isArray(enemy.weaponAsset?.enemyAnchor)) {
      return enemy.weaponAsset.enemyAnchor;
    }
    if (Array.isArray(enemy.weaponAsset?.anchor)) {
      return enemy.weaponAsset.anchor;
    }
    const presentation = ENEMY_WEAPON_PRESENTATION[kind]
      || ENEMY_WEAPON_PRESENTATION.blade;
    const sourceRotation = weaponVisualMetrics(image).sourceRotation || 0;
    if (kind === "fan" || kind === "guard") return presentation.anchor;
    if (Math.abs(sourceRotation) > 0.28) {
      return sourceRotation < 0 ? [0.13, 0.86] : [0.13, 0.14];
    }
    return kind === "short" ? [0.16, 0.52] : [0.13, 0.52];
  }

  function drawWeaponGripOverlay(spriteSize, fps, kind) {
    if (kind === "guard") return;
    const size = Math.max(2, Math.round(spriteSize * (fps ? 0.018 : 0.042)));
    ctx.fillStyle = "#221820";
    ctx.fillRect(-Math.ceil(size * 0.65), -Math.ceil(size * 0.48), size, size);
    ctx.fillStyle = "#8f5f45";
    ctx.fillRect(-Math.ceil(size * 0.25), -Math.ceil(size * 0.2), size, Math.max(1, size - 1));
  }

  function drawEnemyWeapon(enemy, animation, spriteDimensions, fps = false, frame = 0) {
    const detachablePart = enemy.massiveProfile?.detachableParts
      ?.find((part) => part.separateSprite);
    const detachableId = detachablePart?.weaponId;
    if (
      fps
      && ["front", "back"].includes(enemy?.viewDirection)
      && !enemy?.modularEntry?.fpsWeaponRig?.directions?.[enemy.viewDirection]
    ) {
      // Les billboards historiques ne possèdent pas encore de vraies mains
      // dessinées de face/dos. Une arme centrée arbitrairement flotte devant
      // le torse ; on la masque donc dans ces deux directions jusqu'à ce
      // qu'une planche directionnelle authorée fournisse un socket fiable.
      return false;
    }
    if (
      isMassiveEnemy(enemy)
      && enemy.detachablePartAttached === false
      && (!detachableId || enemy.weaponAsset?.id === detachableId)
    ) return;
    const weapon = weaponBitmapForEnemy(enemy);
    if (!bitmapReady(weapon)) return;
    const dimensions = typeof spriteDimensions === "number"
      ? { width: spriteDimensions, height: spriteDimensions }
      : {
          width: Math.max(1, Number(spriteDimensions?.width) || 1),
          height: Math.max(1, Number(spriteDimensions?.height) || 1),
        };
    const spriteSize = dimensions.height;
    const context = fps ? "fps" : "side";
    const mount = WEAPON_MOUNTS[context][animation] || WEAPON_MOUNTS[context].idle;
    const attachmentRig = !fps && detachablePart?.attachPoint
      ? enemy.modularEntry?.attachmentRigs?.[detachablePart.attachPoint]
        ?.animations?.[animation]?.[frame % 6]
      : null;
    const rig = attachmentRig || enemyWeaponRig(enemy, animation, frame, fps);
    if (rig?.layer === "hidden" || rig?.scale <= 0) return;
    const kind = weaponKind(enemy.weaponAsset);
    const presentation = ENEMY_WEAPON_PRESENTATION[kind]
      || ENEMY_WEAPON_PRESENTATION.blade;
    const directionProfile = fps
      ? (ENEMY_FPS_DIRECTIONAL_WEAPON[enemy.viewDirection]
        || ENEMY_FPS_DIRECTIONAL_WEAPON.left)
      : { x: 0, y: 0, rotation: 0, scale: 1 };
    const massiveMount = attachmentRig
      ? null
      : MASSIVE_EQUIPMENT_MOUNTS[enemy.weaponAsset?.id]?.[context];
    const rigPrimary = attachmentRig?.anchor || rig?.primaryHand;
    const mountX = massiveMount?.x ?? (
      rigPrimary
        ? (rigPrimary[0] - 0.5) * dimensions.width / spriteSize
        : (mount.x + directionProfile.x)
    );
    const mountY = massiveMount?.y ?? (
      rigPrimary
        ? (rigPrimary[1] - 1) * dimensions.height / spriteSize
        : (mount.y + directionProfile.y)
    );
    const mountScale = massiveMount?.scale ?? (
      rig
        ? rig.scale * (fps ? 0.56 : 1)
        : mount.scale * directionProfile.scale
    );
    const maxDimension = spriteSize
      * mountScale
      * (massiveMount ? 1 : weaponScaleForKind(kind))
      * (massiveMount ? 1 : presentation.scale);
    const anchor = massiveMount?.anchor || enemyWeaponAnchor(weapon, enemy, kind);
    const attacking = animation === "attack";
    const attackPhase = attacking
      ? clamp(1 - enemy.attack / Math.max(0.01, enemy.attackDuration || 0.68), 0, 1)
      : 0;
    const frameNudge = rig
      ? 0
      : ([0, -0.018, -0.01, 0.012, 0.018, 0][frame % 6] || 0);
    ctx.save();
    ctx.translate(
      spriteSize * (mountX + frameNudge),
      spriteSize * (mountY + (fps ? frameNudge * 0.35 : -frameNudge * 0.4)),
    );
    const defaultRotation = Number.isFinite(enemy.weaponAsset?.defaultRotation)
      ? enemy.weaponAsset.defaultRotation * Math.PI / 180
      : 0;
    const sourceRotation = weaponVisualMetrics(weapon).sourceRotation || 0;
    ctx.rotate(
      defaultRotation
      - sourceRotation
      + (massiveMount?.rotation ?? (
        (rig ? rig.angle : mount.rotation)
        + presentation.rotation
        + (rig ? 0 : directionProfile.rotation)
      ))
      + (attacking && !rig ? attackPhase * mount.arc : 0),
    );
    if (kind === "guard" && !massiveMount) ctx.scale(0.82, 1.05);
    drawWeaponImage(weapon, {
      anchor,
      maxDimension,
      widthBias: kind === "pole" ? 1.08 : 1,
    });
    drawWeaponGripOverlay(spriteSize, fps, kind);
    ctx.restore();
  }

  function playerWeaponMeta(weapon) {
    const katanaIndex = KATANA_IDS.indexOf(weapon?.id);
    const legacyMeta = katanaIndex >= 0
      ? KATANA_WEAPON_META[katanaIndex]
      : null;
    const profile = weaponRenderProfile(weapon);
    const declaredAnchor = weapon?.anchor
      || weapon?.sprites?.anchor
      || weapon?.render?.anchor
      || weapon?.views?.side?.anchor;
    return {
      anchor: Array.isArray(declaredAnchor)
        ? declaredAnchor
        : (legacyMeta?.anchor || [0.24, 0.56]),
      sideRotation: legacyMeta
        ? legacyMeta.sideRotation - KATANA_WEAPON_META[0].sideRotation
        : (profile.sideRotation || 0),
      fpsRotation: legacyMeta
        ? legacyMeta.fpsRotation - KATANA_WEAPON_META[0].fpsRotation
        : (profile.fpsRotation || 0),
      profile,
    };
  }

  function flexibleComponentParts(weapon, view) {
    const entries = componentEntriesForWeapon(weapon, view);
    if (!entries.length) return null;
    const roleOf = (entry) => `${entry.role || ""}${entry.id || ""}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();
    const link = entries.find((entry) => /link|maillon|segment|cord|rope|chaine/.test(roleOf(entry)));
    const terminal = entries.find((entry) =>
      /weightb|handleb|poigneeb|ring|anneau|terminal|striking|projectile/.test(roleOf(entry)))
      || entries.find((entry) => /weight|fundo/.test(roleOf(entry)));
    const main = entries.find((entry) =>
      entry !== link
      && entry !== terminal
      && /main|blade|lame|sickle|kama|kunai|handlea|poigneea|weighta|grip|staff|haft|handle/.test(roleOf(entry)))
      || entries.find((entry) => entry !== link && entry !== terminal);
    if (!main || !link || !terminal) return null;
    return { main, link, terminal };
  }

  function drawRepeatedFlexibleLink(image, start, control, end, segments, size) {
    if (!bitmapReady(image)) return false;
    for (let index = 1; index < segments; index += 1) {
      const t = index / segments;
      const mt = 1 - t;
      const x = mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x;
      const y = mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y;
      const dx = 2 * mt * (control.x - start.x) + 2 * t * (end.x - control.x);
      const dy = 2 * mt * (control.y - start.y) + 2 * t * (end.y - control.y);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(dy, dx));
      drawWeaponImage(image, {
        anchor: [0.5, 0.5],
        maxDimension: size,
      });
      ctx.restore();
    }
    return true;
  }

  function drawFlexiblePlayerWeapon(weapon, view, animation, scale = 1) {
    const parts = flexibleComponentParts(weapon, view)
      || flexibleComponentParts(weapon, "side");
    if (!parts) return false;
    const mainImage = playerComponentBitmap(parts.main);
    const linkImage = playerComponentBitmap(parts.link);
    const terminalImage = playerComponentBitmap(parts.terminal);
    if (![mainImage, linkImage, terminalImage].every(bitmapReady)) return false;

    const attackProgress = game.attackTimer > 0
      ? clamp(1 - game.attackTimer / Math.max(0.01, game.attackDuration), 0, 1)
      : 0;
    const swing = Math.sin(attackProgress * Math.PI);
    const fps = view === "fps";
    const reach = (fps ? 118 : 40) * scale;
    const lift = (fps ? 58 : 18) * scale;
    const start = { x: (fps ? 18 : 7) * scale, y: (fps ? -2 : 0) * scale };
    const end = {
      x: start.x + reach * (0.58 + swing * 0.42),
      y: start.y + lift * (animation === "attack" ? 0.95 - swing * 1.7 : 0.52),
    };
    const control = {
      x: (start.x + end.x) / 2,
      y: Math.max(start.y, end.y) + (fps ? 36 : 13) * scale * (1 - swing * 0.78),
    };

    ctx.save();
    drawWeaponImage(mainImage, {
      anchor: Array.isArray(parts.main.anchor) ? parts.main.anchor : [0.22, 0.62],
      maxDimension: (fps ? 178 : 42) * scale,
    });
    drawRepeatedFlexibleLink(
      linkImage,
      start,
      control,
      end,
      fps ? 16 : 11,
      (fps ? 13 : 4.2) * scale,
    );
    ctx.translate(end.x, end.y);
    ctx.rotate(Math.atan2(end.y - control.y, end.x - control.x) + Math.PI * 0.08);
    drawWeaponImage(terminalImage, {
      anchor: Array.isArray(parts.terminal.anchor) ? parts.terminal.anchor : [0.5, 0.5],
      maxDimension: (fps ? 72 : 18) * scale,
    });
    ctx.restore();
    return true;
  }

  function drawPlayerWeapon(animation, frame) {
    const weapon = currentPlayerWeapon();
    const equippedWeapon = playerWeaponBitmap(weapon, "side");
    const meta = playerWeaponMeta(weapon);
    const rig = playerFrameWeaponRig(animation, frame, "side");
    if (rig?.layer === "hidden" || rig?.scale <= 0) return false;
    const fallbackMount = SIDE_PLAYER_WEAPON_MOUNTS[animation]?.[frame]
      || SIDE_PLAYER_WEAPON_MOUNTS.idle[0];
    const [fallbackX, fallbackY, fallbackRotation, fallbackScale] = fallbackMount;
    const mountX = rig ? (rig.primaryHand[0] - 0.5) * 96 : fallbackX;
    const mountY = rig ? (rig.primaryHand[1] - 1) * 80 : fallbackY;
    const rotation = rig?.angle ?? fallbackRotation;
    const scale = rig?.scale ?? fallbackScale;
    const family = weaponFamilyKey(weapon);
    const rigidOrientation = bitmapReady(equippedWeapon)
      ? normalizedWeaponRotation(equippedWeapon, weapon, "side")
      : playerWeaponPoseOffset(weapon, "side");
    ctx.save();
    ctx.translate(mountX, mountY);
    ctx.rotate(
      rotation
      + meta.sideRotation
      + (family === "flexible" ? 0 : rigidOrientation),
    );
    const renderScale = scale * meta.profile.sideScale;
    let drewFlexible = false;
    if (
      family === "flexible"
      && drawFlexiblePlayerWeapon(weapon, "side", animation, renderScale)
    ) {
      drewFlexible = true;
    } else {
      if (!bitmapReady(equippedWeapon)) {
        ctx.restore();
        return false;
      }
      drawWeaponImage(equippedWeapon, {
        anchor: playerWeaponAnchor(equippedWeapon, weapon, meta.anchor),
        maxDimension: 54 * renderScale,
        widthBias: ["polearm", "staff", "capture"].includes(family) ? 1.14 : 1.08,
      });
    }
    if (drewFlexible || bitmapReady(equippedWeapon)) {
      drawWeaponGripOverlay(44 * renderScale, false, family);
    }
    ctx.restore();
    return true;
  }

  function drawProceduralHeldWeapon(attacking) {
    ctx.save();
    ctx.translate(attacking ? 6 : -7, attacking ? 13 : 19);
    const progress = attacking ? clamp(1 - game.attackTimer / Math.max(0.01, game.attackDuration), 0, 1) : 0;
    ctx.rotate(attacking ? -1.15 + progress * 1.46 : -0.78);
    ctx.fillStyle = "#a5a7ad";
    ctx.fillRect(0, -1, attacking ? 30 : 25, 2);
    ctx.fillStyle = "#f4e7c3";
    ctx.fillRect(attacking ? 26 : 21, -2, 7, 1);
    ctx.restore();
  }

  function fpsPlayerPose() {
    const moving = key("w") || key("s") || key("a") || key("d") || key("ArrowUp") || key("ArrowDown");
    if (game.status === "dying" || game.health <= 0) {
      const progress = clamp(1 - game.deathTimer / PLAYER_DEATH_DURATION, 0, 0.999);
      return { animation: "death", frame: Math.min(5, Math.floor(progress * 6)), moving: false };
    }
    if (game.hurtTimer > 0) {
      const progress = clamp(1 - game.hurtTimer / PLAYER_HURT_DURATION, 0, 0.999);
      return { animation: "hurt", frame: Math.min(5, Math.floor(progress * 6)), moving: false };
    }
    if (game.attackTimer > 0) {
      const progress = clamp(1 - game.attackTimer / Math.max(0.01, game.attackDuration), 0, 0.999);
      return { animation: "attack", frame: Math.min(5, Math.floor(progress * 6)), moving: false };
    }
    const animation = moving ? "move" : "idle";
    return {
      animation,
      frame: Math.floor(performance.now() / (moving ? 95 : 165)) % 6,
      moving,
    };
  }

  function drawFpsPlayerBody(pose = fpsPlayerPose()) {
    ensureFpsPlayerAssets();
    if (!modularAnimationReady(bitmapAssets.akioFpsBody, pose.animation)) {
      return false;
    }
    drawAnimationSprite(
      bitmapAssets.akioFpsBody,
      pose.animation,
      pose.frame,
      FPS_VIEWMODEL_RECT.x,
      FPS_VIEWMODEL_RECT.y,
      FPS_VIEWMODEL_RECT.width,
      FPS_VIEWMODEL_RECT.height,
    );
    return true;
  }

  function drawFpsWeaponSprite(image, animation, frame, weapon) {
    const meta = playerWeaponMeta(weapon);
    const family = weaponFamilyKey(weapon);
    const rigidOrientation = bitmapReady(image)
      ? normalizedWeaponRotation(image, weapon, "fps")
      : playerWeaponPoseOffset(weapon, "fps");
    const rig = playerFrameWeaponRig(animation, frame, "fps");
    if (rig?.layer === "hidden" || rig?.scale <= 0) return true;
    const fallbackMount = FPS_PLAYER_WEAPON_MOUNTS[animation]?.[frame]
      || FPS_PLAYER_WEAPON_MOUNTS.idle[0];
    const [
      fallbackX,
      fallbackY,
      fallbackRotation,
      fallbackScale,
      fallbackAlpha,
    ] = fallbackMount;
    const mountX = rig?.primaryHand?.[0] ?? fallbackX;
    const mountY = rig?.primaryHand?.[1] ?? fallbackY;
    const rotation = rig?.angle ?? fallbackRotation;
    const scale = rig?.scale ?? fallbackScale;
    const alpha = rig ? 1 : fallbackAlpha;
    if (alpha <= 0) return true;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(
      Math.round(FPS_VIEWMODEL_RECT.x + FPS_VIEWMODEL_RECT.width * mountX),
      Math.round(FPS_VIEWMODEL_RECT.y + FPS_VIEWMODEL_RECT.height * mountY),
    );
    ctx.rotate(
      rotation
      + FPS_KATANA_HAND_ALIGNMENT
      + meta.fpsRotation
      + (family === "flexible" ? 0 : rigidOrientation),
    );
    const renderScale = scale * meta.profile.fpsScale;
    const drewFlexible = family === "flexible"
      && drawFlexiblePlayerWeapon(weapon, "fps", animation, renderScale);
    if (!drewFlexible) {
      if (!bitmapReady(image)) {
        ctx.restore();
        return false;
      }
      drawWeaponImage(image, {
        anchor: playerWeaponAnchor(image, weapon, meta.anchor),
        maxDimension: 272 * renderScale,
        widthBias: ["polearm", "staff", "capture"].includes(family) ? 1.16 : 1.04,
      });
    }
    drawWeaponGripOverlay(118 * renderScale, true, family);
    ctx.restore();
    return true;
  }

  function drawFpsSelectedWeapon() {
    ensureFpsPlayerAssets();
    const pose = fpsPlayerPose();
    const weapon = currentPlayerWeapon();
    const fpsCandidate = playerWeaponBitmap(weapon, "fps");
    const sideCandidate = playerWeaponBitmap(weapon, "side");
    const selectedFpsWeapon = bitmapReady(fpsCandidate) ? fpsCandidate : sideCandidate;
    if (
      modularAnimationReady(bitmapAssets.akioFpsBody, pose.animation)
      && (bitmapReady(selectedFpsWeapon) || flexibleComponentParts(weapon, "fps"))
    ) {
      const rig = playerFrameWeaponRig(pose.animation, pose.frame, "fps");
      const layer = weaponLayerForFrame(playerRosterEntry(), rig, "fps");
      const drawBody = () => drawFpsPlayerBody(pose);
      const drawWeapon = () => drawFpsWeaponSprite(
          selectedFpsWeapon,
          pose.animation,
          pose.frame,
          weapon,
        );
      if (layer === "behind-body") {
        drawWeapon();
        drawBody();
      } else {
        drawBody();
        if (layer !== "hidden") drawWeapon();
      }
      return true;
    }

    // Compatibilité avec les anciens registres pendant le chargement.
    const fpsWeapon = fpsWeaponSetForWeapon(weaponEntryForCurrentKatana());
    const { animation, frame } = pose;
    if (modularAnimationReady(fpsWeapon, animation)) {
      drawAnimationSprite(fpsWeapon, animation, frame, 80, 40, 480, 320);
      return true;
    }

    const equippedWeapon = playerWeaponBitmap(weapon, "side");
    if (!bitmapReady(equippedWeapon)) return false;
    const meta = playerWeaponMeta(weapon);
    const progress = game.attackTimer > 0
      ? clamp(1 - game.attackTimer / Math.max(0.01, game.attackDuration), 0, 1)
      : 0;
    const swing = Math.sin(progress * Math.PI);
    ctx.save();
    ctx.translate(W * (0.76 - swing * 0.12), H * (0.87 - swing * 0.08));
    ctx.rotate(
      -0.84
      + meta.fpsRotation
      + normalizedWeaponRotation(equippedWeapon, weapon, "fps")
      - swing * 0.82
      + progress * 0.24,
    );
    drawWeaponImage(equippedWeapon, {
      anchor: playerWeaponAnchor(equippedWeapon, weapon, meta.anchor),
      maxDimension: 410 + swing * 58,
      widthBias: 1.05,
    });
    ctx.restore();

    ctx.save();
    ctx.translate(W * 0.7 - swing * 58, H * 0.86 - swing * 32);
    ctx.rotate(-0.18 - swing * 0.35);
    ctx.fillStyle = "#27151b";
    ctx.fillRect(-22, 4, 74, 24);
    ctx.fillStyle = "#b98661";
    ctx.fillRect(38, -1, 18, 18);
    ctx.restore();
    return true;
  }

  function drawAnimationSprite(animationSet, animation, frame, x, y, width, height) {
    const image = animationSet && animationSet[animation];
    if (!bitmapReady(image)) return false;
    const normalizedFrame = Math.floor(frame % 6);
    const sourceX = Math.round(normalizedFrame * image.naturalWidth / 6);
    const sourceRight = Math.round((normalizedFrame + 1) * image.naturalWidth / 6);
    const frameWidth = sourceRight - sourceX;
    ctx.drawImage(
      image,
      sourceX,
      0,
      frameWidth,
      image.naturalHeight,
      x,
      y,
      width,
      height,
    );
    return true;
  }

  function drawCroppedAnimationSprite(animationSet, animation, frame, x, y, width, height) {
    const image = animationSet && animationSet[animation];
    const bounds = opaqueAnimationFrameBounds(animationSet, animation, frame);
    if (!bitmapReady(image) || !bounds) return false;
    ctx.drawImage(
      image,
      bounds.x,
      bounds.y,
      bounds.w,
      bounds.h,
      x,
      y,
      width,
      height,
    );
    return true;
  }

  function drawSamurai2d(p) {
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    const flip = p.facing;

    const moving = Math.abs(p.vx) > 8 && p.grounded;
    const dying = game.status === "dying" || game.health <= 0;
    const animation = dying
      ? "death"
      : (game.hurtTimer > 0
        ? "hurt"
        : (game.attackTimer > 0 ? "attack" : (moving ? "move" : "idle")));
    if (modularAnimationReady(bitmapAssets.akioModular, animation)) {
      let frame;
      if (animation === "death") {
        frame = Math.min(5, Math.floor(clamp(
          1 - game.deathTimer / PLAYER_DEATH_DURATION,
          0,
          0.999,
        ) * 6));
      } else if (animation === "hurt") {
        frame = Math.min(5, Math.floor(clamp(
          1 - game.hurtTimer / PLAYER_HURT_DURATION,
          0,
          0.999,
        ) * 6));
      } else if (animation === "attack") {
        frame = Math.min(5, Math.floor(clamp(
          1 - game.attackTimer / Math.max(0.01, game.attackDuration),
          0,
          0.999,
        ) * 6));
      } else if (moving) {
        frame = Math.floor((p.walkDistance || 0) / SIDE_WALK_DISTANCE_PER_FRAME) % 6;
      } else {
        frame = Math.floor(performance.now() / 165) % 6;
      }
      ctx.save();
      ctx.translate(x + p.w / 2, y + p.h);
      ctx.scale(flip, 1);
      if (game.invulnerable > 0 && Math.floor(game.invulnerable * 18) % 2) ctx.globalAlpha = 0.35;
      const rig = playerFrameWeaponRig(animation, frame, "side");
      const layer = weaponLayerForFrame(playerRosterEntry(), rig, "side");
      const drawBody = () =>
        drawAnimationSprite(bitmapAssets.akioModular, animation, frame, -48, -80, 96, 80);
      if (animation !== "death" && layer === "behind-body") {
        drawPlayerWeapon(animation, frame);
        drawBody();
      } else {
        drawBody();
        if (animation !== "death" && layer !== "hidden") drawPlayerWeapon(animation, frame);
      }
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(x + p.w / 2, y);
    ctx.scale(flip, 1);
    if (game.invulnerable > 0 && Math.floor(game.invulnerable * 18) % 2) ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#11131a"; ctx.fillRect(-7, 21, 5, 6); ctx.fillRect(3, 21, 5, 6);
    ctx.fillStyle = "#321921"; ctx.fillRect(-8, 11, 16, 13);
    ctx.fillStyle = "#7d222b"; ctx.fillRect(-10, 12, 4, 10); ctx.fillRect(7, 12, 4, 10);
    ctx.fillStyle = "#b7875c"; ctx.fillRect(-4, 4, 8, 7);
    ctx.fillStyle = "#151820"; ctx.fillRect(-7, 1, 14, 5); ctx.fillRect(-9, 4, 18, 3); ctx.fillRect(-3, -2, 6, 4);
    ctx.fillStyle = "#d5b67c"; ctx.fillRect(3, 7, 2, 1);
    drawProceduralHeldWeapon(game.attackTimer > 0);
    ctx.restore();
  }

  function drawZombie2d(e) {
    const x = Math.round(e.x), y = Math.round(e.y);
    const spriteIndex = Math.abs(Math.round(e.seed / 13.7)) % 5;
    const modularEnemy = animationSetForEnemy(e, spriteIndex);
    const dying = Boolean(e.dying || e.hp <= 0);
    const moving = Math.abs(e.ai?.moveVelocity || 0) > 0.5;
    const animation = dying
      ? "death"
      : (e.hurtTimer > 0 || e.flash > 0
        ? "hurt"
        : (e.attack > 0 ? "attack" : (moving ? "move" : "idle")));
    if (modularAnimationReady(modularEnemy, animation)) {
      const massive = isMassiveEnemy(e);
      const elite = spriteIndex === 4;
      const size = elite ? 76 : 66;
      const renderProfile = e.massiveProfile?.renderProfile
        || e.massiveProfile?.render
        || {};
      const renderWidth = massive
        ? Math.min(
            W * clamp(renderProfile.targetWidthRatio || 0.5, 0.34, 0.56),
            W * clamp(renderProfile.maxWidthRatio || 0.55, 0.4, 0.6),
          )
        : size;
      let renderHeight = massive
        ? Math.min(
            H * clamp(renderProfile.targetHeightRatio || 0.49, 0.36, 0.58),
            H * clamp(renderProfile.maxHeightRatio || 0.56, 0.4, 0.62),
          )
        : size;
      let frame;
      if (animation === "death") {
        frame = Math.min(5, Math.floor(clamp(
          1 - (e.deathTimer || 0) / ENEMY_DEATH_DURATION,
          0,
          0.999,
        ) * 6));
      } else if (animation === "hurt") {
        frame = Math.min(5, Math.floor(clamp(
          1 - (e.hurtTimer || 0) / ENEMY_HURT_DURATION,
          0,
          0.999,
        ) * 6));
      } else if (animation === "attack") {
        frame = Math.min(5, Math.floor(clamp(
          1 - e.attack / Math.max(0.01, e.attackDuration || 0.56),
          0,
          0.999,
        ) * 6));
      } else {
        frame = Math.floor(
          (performance.now() + e.seed * 53) / (animation === "move" ? 110 : 175),
        ) % 6;
      }
      const frameBounds = massive
        ? opaqueAnimationFrameBounds(modularEnemy, animation, frame)
        : null;
      if (massive && frameBounds && renderProfile.preserveSourceAspect !== false) {
        renderHeight = Math.min(
          H * clamp(renderProfile.maxHeightRatio || 0.56, 0.4, 0.62),
          renderWidth * frameBounds.h / Math.max(1, frameBounds.w),
        );
      }
      ctx.save();
      ctx.translate(x + e.w / 2, y + e.h + SIDE_ENEMY_BASELINE_OFFSET);
      // Les masters ennemis regardent vers la gauche, contrairement à Akio.
      ctx.scale(e.facing < 0 ? 1 : -1, 1);
      if (animation === "hurt") {
        // Les planches de réaction ont une silhouette plus large que l'idle.
        // On les ramène autour du même pivot de pieds pour éviter l'effet
        // involontaire de gonflement à chaque impact.
        ctx.scale(ENEMY_HURT_RENDER_SCALE, ENEMY_HURT_RENDER_SCALE);
      }
      if (e.flash > 0) ctx.filter = "brightness(2.2) saturate(.2)";
      const frameRig = enemyWeaponRig(e, animation, frame, false);
      const massiveEquipmentLayer = MASSIVE_EQUIPMENT_MOUNTS[
        e.weaponAsset?.id
      ]?.side?.layer;
      const equipmentBehindBody = massiveEquipmentLayer
        ? massiveEquipmentLayer === "behind-body"
        : weaponLayerForFrame(e.modularEntry, frameRig, "side") === "behind-body";
      if (animation !== "death" && equipmentBehindBody) {
        drawEnemyWeapon(
          e,
          animation,
          { width: renderWidth, height: renderHeight },
          false,
          frame,
        );
      }
      if (massive) {
        drawCroppedAnimationSprite(
          modularEnemy,
          animation,
          frame,
          -renderWidth / 2,
          -renderHeight,
          renderWidth,
          renderHeight,
        );
      } else {
        drawAnimationSprite(
          modularEnemy,
          animation,
          frame,
          -renderWidth / 2,
          -renderHeight,
          renderWidth,
          renderHeight,
        );
      }
      if (animation !== "death" && !equipmentBehindBody) {
        drawEnemyWeapon(
          e,
          animation,
          { width: renderWidth, height: renderHeight },
          false,
          frame,
        );
      }
      ctx.restore();
      return;
    }

    const generatedEnemy = bitmapAssets.enemies[spriteIndex];
    if (bitmapReady(generatedEnemy)) {
      const elite = spriteIndex === 4;
      const size = elite ? 62 : 54;
      ctx.save();
      ctx.translate(x + e.w / 2, y + e.h + SIDE_ENEMY_BASELINE_OFFSET);
      // Les planches sources regardent à gauche ; on inverse seulement quand
      // l'IA se retourne vers la droite.
      ctx.scale(e.facing < 0 ? 1 : -1, 1);
      if (!dying && (e.hurtTimer > 0 || e.flash > 0)) {
        ctx.scale(ENEMY_HURT_RENDER_SCALE, ENEMY_HURT_RENDER_SCALE);
      }
      if (e.flash > 0) ctx.filter = "brightness(2.2) saturate(.2)";
      if (dying) {
        const deathProgress = clamp(1 - (e.deathTimer || 0) / ENEMY_DEATH_DURATION, 0, 1);
        ctx.globalAlpha = 1 - deathProgress * 0.35;
        ctx.rotate(-deathProgress * 0.75);
        ctx.translate(0, deathProgress * 10);
      }
      ctx.drawImage(generatedEnemy, -size / 2, -size, size, size);
      ctx.restore();
      return;
    }

    ctx.save(); ctx.translate(x + e.w / 2, y); ctx.scale(e.facing, 1);
    if (dying) {
      const deathProgress = clamp(1 - (e.deathTimer || 0) / ENEMY_DEATH_DURATION, 0, 1);
      ctx.globalAlpha = 1 - deathProgress * 0.45;
      ctx.rotate(-e.facing * deathProgress * 0.82);
      ctx.translate(0, deathProgress * 8);
    }
    ctx.fillStyle = e.flash > 0 ? "#fff0c8" : "#17151a"; ctx.fillRect(-7, 20, 5, 4); ctx.fillRect(3, 20, 5, 4);
    ctx.fillStyle = e.flash > 0 ? "#fff0c8" : e.hp === 3 ? "#582528" : "#3b3530"; ctx.fillRect(-7, 9, 14, 13);
    ctx.fillStyle = e.flash > 0 ? "#fff" : "#73905b"; ctx.fillRect(-5, 2, 10, 8); ctx.fillRect(5, 11, 8, 3);
    ctx.fillStyle = "#bde66f"; ctx.fillRect(1, 4, 2, 2);
    ctx.fillStyle = "#6d1720"; ctx.fillRect(-2, 8, 5, 2);
    ctx.restore();
  }

  function drawPickup(item) {
    const bob = Math.round(Math.sin(performance.now() / 220 + item.x) * 3);
    const resource = ["tamahagane", "yomiAsh"].includes(item.kind);
    ctx.fillStyle = item.kind === "ammo"
      ? "#e9dab6"
      : (resource ? (item.kind === "tamahagane" ? "#9db9c3" : "#9486b5") : "#8ec86d");
    ctx.fillRect(item.x - 5, item.y + bob - 10, 10, 13);
    ctx.fillStyle = item.kind === "ammo" ? "#b52d34" : "#e7e1b5";
    const glyph = item.kind === "ammo"
      ? "刃"
      : (item.kind === "tamahagane" ? "鋼" : (item.kind === "yomiAsh" ? "灰" : "+"));
    ctx.font = "bold 8px serif";
    ctx.textAlign = "center";
    ctx.fillText(glyph, item.x, item.y + bob);
  }

  function drawOfuda(x, y, direction) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(direction, 1);
    ctx.fillStyle = "#eee0b8"; ctx.fillRect(-5, -7, 10, 14);
    ctx.fillStyle = "#b52731"; ctx.fillRect(-1, -5, 2, 10); ctx.fillRect(-3, -1, 6, 2);
    ctx.restore();
  }

  function drawPlayerProjectile(projectile) {
    const weapon = arsenalWeaponById(projectile.weaponId);
    const image = playerWeaponBitmap(weapon, "side");
    const family = weaponFamilyKey(weapon);
    if (family === "bow") {
      ctx.save();
      ctx.translate(Math.round(projectile.x), Math.round(projectile.y));
      ctx.scale(Math.sign(projectile.vx || 1), 1);
      ctx.fillStyle = "#d9c397";
      ctx.fillRect(-10, -1, 20, 2);
      ctx.fillStyle = "#c8d0ce";
      ctx.beginPath();
      ctx.moveTo(10, -3);
      ctx.lineTo(15, 0);
      ctx.lineTo(10, 3);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (family === "firearm") {
      ctx.save();
      ctx.translate(Math.round(projectile.x), Math.round(projectile.y));
      ctx.fillStyle = "#fff3b0";
      ctx.fillRect(-4, -2, 8, 4);
      ctx.fillStyle = "#d47635";
      ctx.fillRect(-8 * Math.sign(projectile.vx || 1), -1, 5, 2);
      ctx.restore();
      return;
    }
    if (!bitmapReady(image)) {
      drawOfuda(projectile.x, projectile.y, Math.sign(projectile.vx));
      return;
    }
    const spins = ["throwing", "fan"].includes(family)
      || /shuriken|makibishi/.test(String(weapon?.id || ""));
    const angle = spins
      ? performance.now() * 0.018 * Math.sign(projectile.vx || 1)
      : (projectile.vx < 0 ? Math.PI : 0);
    ctx.save();
    ctx.translate(Math.round(projectile.x), Math.round(projectile.y));
    ctx.rotate(angle);
    drawWeaponImage(image, {
      anchor: [0.5, 0.5],
      maxDimension: family === "bow" ? 24 : 18,
    });
    ctx.restore();
  }

  function drawParticleMark(p, screen = false) {
    const alpha = clamp(p.life / Math.max(0.001, p.max || p.life || 1), 0, 1);
    const size = Math.max(1, p.size || (screen ? 5 : 3));
    const material = p.material
      || (p.kind === "spark" ? "armor" : (p.kind === "ash" || p.kind === "wisp" ? "spirit" : "flesh"));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(p.x), Math.round(p.y));

    if (p.text || p.kind === "text") {
      ctx.fillStyle = p.color || "#fff1c2";
      ctx.font = `bold ${Math.max(8, size * 3)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(p.text || "", 0, 0);
      ctx.restore();
      return;
    }

    if (p.kind === "flash") {
      ctx.strokeStyle = p.color || "#fff1a8";
      ctx.lineWidth = Math.max(1, size / 3);
      ctx.strokeRect(-size, -size, size * 2, size * 2);
      ctx.restore();
      return;
    }

    if (material === "armor" || p.kind === "spark") {
      const trailX = clamp(-(p.vx || 0) * 0.035, -size * 4, size * 4);
      const trailY = clamp(-(p.vy || 0) * 0.035, -size * 4, size * 4);
      ctx.strokeStyle = p.color || "#ffd47a";
      ctx.lineWidth = Math.max(1, size * 0.45);
      ctx.beginPath();
      ctx.moveTo(trailX, trailY);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.fillStyle = "#fff3b2";
      ctx.fillRect(-1, -1, 3, 3);
      ctx.restore();
      return;
    }

    if (material === "spirit" || p.kind === "wisp") {
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = p.color || "#80e6d0";
      ctx.fillRect(-size / 2, -size, size, size * 2);
      ctx.fillRect(-size, -size / 2, size * 2, size);
      ctx.fillStyle = "rgba(224, 255, 241, .8)";
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
      return;
    }

    ctx.fillStyle = p.color || "#a51f2d";
    ctx.fillRect(-size / 2, -size / 2, size, size);
    if (size >= 4) {
      ctx.fillStyle = "rgba(255, 113, 103, .55)";
      ctx.fillRect(-size / 2, -size / 2, Math.max(1, size / 3), Math.max(1, size / 3));
    }
    ctx.restore();
  }

  function drawWorldParticles(particles) {
    for (const p of particles) drawParticleMark(p, false);
  }

  function drawHitConfirm(cameraX = 0) {
    if (game.hitConfirm <= 0) return;
    const material = game.hitConfirmMaterial || "flesh";
    const point = game.hitConfirmPoint || { x: W / 2, y: H / 2 };
    const x = game.mode === "side" ? point.x - cameraX : point.x;
    const y = point.y;
    if (x < -24 || x > W + 24 || y < -24 || y > H + 24) return;
    const life = clamp(game.hitConfirm / 0.24, 0, 1);
    const spread = 5 + (1 - life) * 5;
    const length = material === "armor" ? 7 : 5;
    const color = material === "armor"
      ? "#ffd36d"
      : (material === "spirit" ? "#7cebd1" : "#f3d6ba");
    ctx.save();
    ctx.globalAlpha = 0.35 + life * 0.65;
    ctx.strokeStyle = color;
    ctx.lineWidth = material === "armor" ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x - spread - length, y - spread - length);
    ctx.lineTo(x - spread, y - spread);
    ctx.moveTo(x + spread + length, y - spread - length);
    ctx.lineTo(x + spread, y - spread);
    ctx.moveTo(x - spread - length, y + spread + length);
    ctx.lineTo(x - spread, y + spread);
    ctx.moveTo(x + spread + length, y + spread + length);
    ctx.lineTo(x + spread, y + spread);
    ctx.stroke();
    if (material === "spirit") {
      ctx.strokeRect(Math.round(x - 2.5), Math.round(y - 2.5), 5, 5);
    } else if (material === "armor") {
      ctx.fillStyle = "#fff1ac";
      ctx.fillRect(Math.round(x - 1), Math.round(y - 1), 3, 3);
    }
    ctx.restore();
  }

  function isFpsWalkableCell(cell) {
    return cell === "0" || cell === "3";
  }

  // DDA exact : le point d'impact et son axe donnent une coordonnée U stable
  // le long de chaque mur. L'ancien pas fixe mélangeait x+y et répétait cinq
  // fois la texture, d'où l'impression de mosaïque aléatoire.
  function castRay(mission, angle) {
    const p = mission.player;
    const rayDirX = Math.cos(angle);
    const rayDirY = Math.sin(angle);
    let mapX = Math.floor(p.x);
    let mapY = Math.floor(p.y);
    const deltaDistX = Math.abs(1 / (Math.abs(rayDirX) < 1e-8 ? 1e-8 : rayDirX));
    const deltaDistY = Math.abs(1 / (Math.abs(rayDirY) < 1e-8 ? 1e-8 : rayDirY));
    const stepX = rayDirX < 0 ? -1 : 1;
    const stepY = rayDirY < 0 ? -1 : 1;
    let sideDistX = rayDirX < 0
      ? (p.x - mapX) * deltaDistX
      : (mapX + 1 - p.x) * deltaDistX;
    let sideDistY = rayDirY < 0
      ? (p.y - mapY) * deltaDistY
      : (mapY + 1 - p.y) * deltaDistY;
    let side = 0;
    let cell = "1";

    for (let steps = 0; steps < 64; steps += 1) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        mapY += stepY;
        side = 1;
      }
      cell = mission.map[mapY]?.[mapX] || "1";
      if (!isFpsWalkableCell(cell)) break;
    }

    const rawDistance = side === 0
      ? (mapX - p.x + (1 - stepX) / 2) / (Math.abs(rayDirX) < 1e-8 ? 1e-8 : rayDirX)
      : (mapY - p.y + (1 - stepY) / 2) / (Math.abs(rayDirY) < 1e-8 ? 1e-8 : rayDirY);
    const dist = clamp(Math.abs(rawDistance), 0.001, 20);
    const x = p.x + rayDirX * dist;
    const y = p.y + rayDirY * dist;
    const wallCoordinate = side === 0 ? y : x;
    let texture = wallCoordinate - Math.floor(wallCoordinate);
    if ((side === 0 && rayDirX > 0) || (side === 1 && rayDirY < 0)) {
      texture = 1 - texture;
    }
    return { dist, x, y, mapX, mapY, side, cell, texture };
  }

  const fpsFloorSourceCache = new Map();
  let fpsFloorRenderSurface = null;

  function currentFpsMaterialScheme() {
    const def = FPS_DEFS[game.fps.current] || FPS_DEFS[0];
    const fallback = FPS_MATERIAL_SCHEMES[def.altarAssetIndex] || FPS_MATERIAL_SCHEMES[0];
    const materialLibrary = window.KageLevels?.visualStandards?.fpsMaterials;
    const profileId = def.materialProfile || def.id || "contaminated-sanctuary";
    const profile = materialLibrary?.profiles?.[profileId];
    if (!profile || !Array.isArray(materialLibrary.tiles)) return fallback;
    const tileIndex = (materialId, fallbackIndex) => {
      const tile = materialLibrary.tiles.find((entry) => entry.id === materialId);
      return Number.isFinite(Number(tile?.index)) ? Number(tile.index) : fallbackIndex;
    };
    return {
      ...fallback,
      id: profileId,
      floorTile: tileIndex(profile.floor, fallback.floorTile),
      boundaryWall: tileIndex(profile.boundary, fallback.boundaryWall),
      coreWall: tileIndex(profile.circulation, fallback.coreWall),
      chamberWall: tileIndex(profile.chamber, fallback.chamberWall),
      altarWall: tileIndex(profile.altar, fallback.altarWall),
      fog: Array.isArray(def.fog) ? def.fog : fallback.fog,
      semanticProfile: profile,
    };
  }

  function fpsFloorSource(tileIndex) {
    const atlas = bitmapAssets.fpsWallAtlas;
    if (!bitmapReady(atlas) || typeof document.createElement !== "function") return null;
    if (fpsFloorSourceCache.has(tileIndex)) return fpsFloorSourceCache.get(tileIndex);
    try {
      const size = 64;
      const tileCanvas = document.createElement("canvas");
      tileCanvas.width = size;
      tileCanvas.height = size;
      const tileContext = tileCanvas.getContext("2d", { willReadFrequently: true });
      tileContext.imageSmoothingEnabled = false;
      const [tileX, tileY, tileWidth, tileHeight] = FPS_WALL_TILES[tileIndex];
      tileContext.drawImage(
        atlas,
        tileX,
        tileY,
        tileWidth,
        tileHeight,
        0,
        0,
        size,
        size,
      );
      const source = {
        size,
        pixels: tileContext.getImageData(0, 0, size, size).data,
      };
      fpsFloorSourceCache.set(tileIndex, source);
      return source;
    } catch (_) {
      // Sous file://, certains navigateurs refusent getImageData sur l'atlas.
      // Mémoriser l'échec évite de déclencher une exception à chaque frame.
      fpsFloorSourceCache.set(tileIndex, null);
      return null;
    }
  }

  function ensureFpsFloorRenderSurface() {
    if (fpsFloorRenderSurface) return fpsFloorRenderSurface;
    if (typeof document.createElement !== "function") return null;
    const surface = document.createElement("canvas");
    surface.width = Math.max(1, Math.floor(W / 2));
    surface.height = Math.max(1, Math.floor(H / 4));
    const surfaceContext = surface.getContext("2d");
    if (!surfaceContext?.createImageData) return null;
    fpsFloorRenderSurface = {
      canvas: surface,
      context: surfaceContext,
      image: surfaceContext.createImageData(surface.width, surface.height),
    };
    return fpsFloorRenderSurface;
  }

  function drawFpsFloorFallback(player) {
    const floor = ctx.createLinearGradient(0, H / 2, 0, H);
    floor.addColorStop(0, game.fps.current === 0 ? "#493b35" : "#4b4031");
    floor.addColorStop(1, "#100e12");
    ctx.fillStyle = floor;
    ctx.fillRect(0, H / 2, W, H / 2);

    // Grille de secours déterministe si l'atlas n'est pas encore chargé.
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = game.fps.current === 0 ? "#a99a8b" : "#bda976";
    for (let row = 1; row <= 8; row += 1) {
      const ratio = row / 8;
      const y = H / 2 + Math.pow(ratio, 1.72) * H / 2;
      ctx.beginPath();
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(W, Math.round(y) + 0.5);
      ctx.stroke();
    }
    const headingOffset = normalizeAngle(player.angle) / TAU * 96;
    for (let x = -W; x <= W * 2; x += 64) {
      ctx.beginPath();
      ctx.moveTo(W / 2, H / 2);
      ctx.lineTo(x - headingOffset, H);
      ctx.stroke();
    }
    ctx.restore();
  }

  function proceduralFpsFloorSample(worldX, worldY) {
    const cellX = Math.floor(worldX);
    const cellY = Math.floor(worldY);
    const u = ((worldX % 1) + 1) % 1;
    const v = ((worldY % 1) + 1) % 1;
    const hash = Math.abs(
      cellX * 17 + cellY * 31 + Math.floor(u * 12) * 7 + Math.floor(v * 12) * 13,
    ) % 9;
    let red;
    let green;
    let blue;

    if (game.fps.current === 0) {
      const joint = u < 0.045 || v < 0.045;
      const moss = !joint && (u < 0.09 || v < 0.09) && hash < 3;
      const alternate = Math.abs(cellX + cellY) % 2;
      red = joint ? 31 : moss ? 53 : 76 + alternate * 8 + hash;
      green = joint ? 32 : moss ? 67 : 72 + alternate * 7 + hash;
      blue = joint ? 30 : moss ? 48 : 67 + alternate * 6 + hash;
    } else {
      const horizontal = Math.abs(cellX + cellY) % 2 === 0;
      const seam = u < 0.035 || v < 0.035;
      const weave = horizontal
        ? Math.floor(v * 18) % 3
        : Math.floor(u * 18) % 3;
      red = seam ? 48 : 128 + weave * 5 + hash;
      green = seam ? 38 : 106 + weave * 4 + hash;
      blue = seam ? 26 : 63 + weave * 3 + Math.floor(hash / 2);
    }
    return red | (green << 8) | (blue << 16);
  }

  function drawFpsFloor(player) {
    const scheme = currentFpsMaterialScheme();
    const source = fpsFloorSource(scheme.floorTile);
    const render = ensureFpsFloorRenderSurface();
    if (!render) {
      drawFpsFloorFallback(player);
      return;
    }

    const renderWidth = render.canvas.width;
    const renderHeight = render.canvas.height;
    const output = render.image.data;
    const directionX = Math.cos(player.angle);
    const directionY = Math.sin(player.angle);
    const planeScale = Math.tan(FOV / 2);
    const planeX = -directionY * planeScale;
    const planeY = directionX * planeScale;
    const leftRayX = directionX - planeX;
    const leftRayY = directionY - planeY;
    const rightRayX = directionX + planeX;
    const rightRayY = directionY + planeY;
    const screenPixelHeight = (H / 2) / renderHeight;
    const textureSize = source?.size || 1;
    const floorScale = scheme.floorScale;

    for (let row = 0; row < renderHeight; row += 1) {
      const screenY = H / 2 + (row + 0.5) * screenPixelHeight;
      const rowDistance = Math.min(30, (H * 0.5) / Math.max(0.5, screenY - H / 2));
      const stepX = rowDistance * (rightRayX - leftRayX) / renderWidth;
      const stepY = rowDistance * (rightRayY - leftRayY) / renderWidth;
      let floorX = player.x + rowDistance * leftRayX;
      let floorY = player.y + rowDistance * leftRayY;
      const fogAmount = clamp((rowDistance - 1.2) / 20, 0, 0.8);
      const light = 1 - fogAmount * 0.72;
      for (let column = 0; column < renderWidth; column += 1) {
        const wrappedX = ((floorX * floorScale) % 1 + 1) % 1;
        const wrappedY = ((floorY * floorScale) % 1 + 1) % 1;
        const sourceX = Math.min(textureSize - 1, Math.floor(wrappedX * textureSize));
        const sourceY = Math.min(textureSize - 1, Math.floor(wrappedY * textureSize));
        const sourceOffset = (sourceY * textureSize + sourceX) * 4;
        const targetOffset = (row * renderWidth + column) * 4;
        const procedural = source ? 0 : proceduralFpsFloorSample(floorX, floorY);
        const sourceRed = source ? source.pixels[sourceOffset] : procedural & 255;
        const sourceGreen = source ? source.pixels[sourceOffset + 1] : procedural >> 8 & 255;
        const sourceBlue = source ? source.pixels[sourceOffset + 2] : procedural >> 16 & 255;
        output[targetOffset] = Math.floor(
          sourceRed * light + scheme.fog[0] * fogAmount,
        );
        output[targetOffset + 1] = Math.floor(
          sourceGreen * light + scheme.fog[1] * fogAmount,
        );
        output[targetOffset + 2] = Math.floor(
          sourceBlue * light + scheme.fog[2] * fogAmount,
        );
        output[targetOffset + 3] = 255;
        floorX += stepX;
        floorY += stepY;
      }
    }
    render.context.putImageData(render.image, 0, 0);
    ctx.drawImage(render.canvas, 0, H / 2, W, H / 2);
  }

  function fpsWallTileIndex(hit) {
    const scheme = currentFpsMaterialScheme();
    const mission = currentMission();
    const mapWidth = mission.map[0]?.length || 0;
    const mapHeight = mission.map.length;
    const boundary = hit.mapX <= 0
      || hit.mapY <= 0
      || hit.mapX >= mapWidth - 1
      || hit.mapY >= mapHeight - 1;
    const altarDistance = Math.hypot(
      hit.mapX + 0.5 - mission.altar.x,
      hit.mapY + 0.5 - mission.altar.y,
    );
    if (altarDistance <= 2.25) return scheme.altarWall;
    if (boundary) return scheme.boundaryWall;
    if (
      game.fps.current === 0
        ? hit.mapX >= 8 && hit.mapY >= 8
        : hit.mapX <= 6 && hit.mapY <= 6
    ) {
      return scheme.chamberWall;
    }
    return scheme.coreWall;
  }

  function drawFpsWallColumn(hit, columnX, top, wallHeight, corrected) {
    const atlas = bitmapAssets.fpsWallAtlas;
    if (bitmapReady(atlas)) {
      const [tileX, tileY, tileWidth, tileHeight] = FPS_WALL_TILES[fpsWallTileIndex(hit)];
      const texture = ((hit.texture % 1) + 1) % 1;
      const sourceX = tileX + clamp(Math.floor(texture * tileWidth), 0, tileWidth - 1);
      ctx.drawImage(
        atlas,
        sourceX,
        tileY,
        1,
        tileHeight,
        columnX,
        top,
        2,
        Math.ceil(wallHeight),
      );
      if (hit.side === 1) {
        ctx.fillStyle = "rgba(5, 7, 11, .12)";
        ctx.fillRect(columnX, top, 2, Math.ceil(wallHeight));
      }
      const fogAlpha = clamp((corrected - 2.2) / 15, 0, 0.78);
      if (fogAlpha > 0) {
        const fog = currentFpsMaterialScheme().fog;
        ctx.fillStyle = `rgba(${fog[0]}, ${fog[1]}, ${fog[2]}, ${fogAlpha})`;
        ctx.fillRect(columnX, top, 2, Math.ceil(wallHeight));
      }
      return;
    }

    const fog = clamp(1 - corrected / 15, 0.18, 1);
    const stripe = Math.floor(hit.texture * 8) % 2;
    const base = game.fps.current === 0 ? [84, 60, 54] : [66, 49, 58];
    ctx.fillStyle = `rgb(${Math.floor(base[0] * fog + stripe * 9)},${Math.floor(base[1] * fog)},${Math.floor(base[2] * fog)})`;
    ctx.fillRect(columnX, top, 2, Math.ceil(wallHeight));
  }

  function projectFpsEntity(distance, angle, worldHeight = 1, aspect = 1) {
    const corrected = Math.max(0.12, distance * Math.cos(angle));
    const projection = H / corrected;
    const screenX = W / 2 + Math.tan(angle) * (W / 2) / Math.tan(FOV / 2);
    const groundY = H / 2 + projection / 2;
    const height = clamp(projection * worldHeight, 8, H * 2.2);
    return {
      corrected,
      screenX,
      groundY,
      height,
      width: height * aspect,
      top: groundY - height,
    };
  }

  function clipBillboardToDepth(left, width, corrected, tolerance = 0.22) {
    const firstRay = clamp(Math.floor(left / 2), 0, 319);
    const lastRay = clamp(Math.ceil((left + width) / 2), 0, 319);
    let visible = false;
    ctx.beginPath();
    for (let ray = firstRay; ray <= lastRay; ray++) {
      if (corrected > game.fps.zBuffer[ray] + tolerance) continue;
      ctx.rect(ray * 2, -2, 2, H + 4);
      visible = true;
    }
    if (visible) ctx.clip();
    return visible;
  }

  function fpsEnemyAnimation(enemy, corrected) {
    if (enemy.dying || enemy.hp <= 0) return "death";
    if (enemy.hurtTimer > 0 || enemy.flash > 0) return "hurt";
    if (enemy.attack > 0) return "attack";
    return Math.abs(enemy.ai?.moveVelocity || 0) > 0.01 ? "move" : "idle";
  }

  function fpsEnemyViewDirection(enemy, player = currentMission().player) {
    const heading = ensureFpsEnemyAi(enemy).heading;
    const towardViewer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    const relative = normalizeAngle(heading - towardViewer);
    let direction = "front";
    if (Math.abs(relative) >= Math.PI * 0.75) direction = "back";
    else if (relative > Math.PI * 0.25) direction = "left";
    else if (relative < -Math.PI * 0.25) direction = "right";
    return {
      direction,
      mirror: direction === "right"
        || (direction === "back" && Math.sin(heading) > 0),
      relative,
    };
  }

  function drawDirectionalAnimationSprite(
    animationSet,
    animation,
    frame,
    centerX,
    y,
    width,
    height,
    viewFacing,
  ) {
    const direction = viewFacing?.direction || "left";
    if (!["front", "back"].includes(direction)) {
      ctx.save();
      ctx.translate(centerX, 0);
      ctx.scale(viewFacing?.mirror ? -1 : 1, 1);
      const drawn = drawAnimationSprite(
        animationSet,
        animation,
        frame,
        -width / 2,
        y,
        width,
        height,
      );
      ctx.restore();
      return drawn;
    }

    let drawn = false;
    const drawHalf = (leftHalf, mirror) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(
        centerX + (leftHalf ? -width / 2 : 0),
        y,
        width / 2,
        height,
      );
      ctx.clip();
      ctx.translate(centerX, 0);
      ctx.scale(mirror ? -1 : 1, 1);
      drawn = drawAnimationSprite(
        animationSet,
        animation,
        frame,
        -width / 2,
        y,
        width,
        height,
      ) || drawn;
      ctx.restore();
    };
    if (direction === "front") {
      drawHalf(true, false);
      drawHalf(false, true);
      if (animation !== "death") {
        const eyeSize = clamp(Math.round(width * 0.025), 1, 4);
        const eyeY = Math.round(y + height * 0.225);
        const eyeGap = Math.max(2, Math.round(width * 0.055));
        ctx.fillStyle = "#d8ef75";
        ctx.fillRect(centerX - eyeGap - eyeSize, eyeY, eyeSize, eyeSize);
        ctx.fillRect(centerX + eyeGap, eyeY, eyeSize, eyeSize);
      }
    } else {
      drawHalf(true, true);
      drawHalf(false, false);
      ctx.fillStyle = "rgba(10, 10, 14, .2)";
      ctx.fillRect(
        Math.round(centerX - width * 0.16),
        Math.round(y + height * 0.08),
        Math.round(width * 0.32),
        Math.round(height * 0.27),
      );
    }
    return drawn;
  }

  function fpsEnemyAnimationFrame(enemy, animation, spriteIndex) {
    if (animation === "death") {
      return Math.min(5, Math.floor(clamp(
        1 - (enemy.deathTimer || 0) / ENEMY_DEATH_DURATION,
        0,
        0.999,
      ) * 6));
    }
    if (animation === "hurt") {
      return Math.min(5, Math.floor(clamp(
        1 - (enemy.hurtTimer || 0) / ENEMY_HURT_DURATION,
        0,
        0.999,
      ) * 6));
    }
    if (animation === "attack") {
      return Math.min(5, Math.floor(clamp(
        1 - enemy.attack / Math.max(0.01, enemy.attackDuration || 0.68),
        0,
        0.999,
      ) * 6));
    }
    return Math.floor((performance.now() + spriteIndex * 113) / (animation === "move" ? 105 : 155)) % 6;
  }

  function drawFps() {
    const mission = currentMission();
    const p = mission.player;
    const ceiling = ctx.createLinearGradient(0, 0, 0, H / 2);
    ceiling.addColorStop(0, "#070912"); ceiling.addColorStop(1, "#281a24");
    ctx.fillStyle = ceiling; ctx.fillRect(0, 0, W, H / 2);
    drawFpsFloor(p);

    const rays = 320;
    for (let i = 0; i < rays; i++) {
      const rayAngle = p.angle - FOV / 2 + (i / rays) * FOV;
      const hit = castRay(mission, rayAngle);
      const corrected = Math.max(0.08, hit.dist * Math.cos(rayAngle - p.angle));
      game.fps.zBuffer[i] = corrected;
      const wallH = Math.min(H * 1.8, H / corrected);
      const top = Math.floor(H / 2 - wallH / 2);
      drawFpsWallColumn(hit, i * 2, top, wallH, corrected);
    }

    drawFpsAltar(mission);
    const visible = mission.enemies
      .filter(isEnemyVisible)
      .map((e) => ({ e, dist: Math.hypot(e.x - p.x, e.y - p.y), angle: normalizeAngle(Math.atan2(e.y - p.y, e.x - p.x) - p.angle) }))
      .filter((o) => Math.abs(o.angle) < FOV * 0.72)
      .sort((a, b) => b.dist - a.dist);
    for (const obj of visible) drawFpsEnemy(obj.e, obj.dist, obj.angle);

    drawFpsParticles(mission.particles);
    if (game.rangedViewTimer > 0) {
      const rangedProgress = clamp(1 - game.rangedViewTimer / 0.2, 0, 0.999);
      drawFpsPlayerBody({
        animation: "attack",
        frame: Math.min(5, Math.floor(rangedProgress * 6)),
      });
      drawFpsRangedProjectile();
    } else {
      drawFpsWeapon();
    }
    drawHitConfirm();
    drawCrosshair();
    drawMiniMap(mission);
  }

  function drawFpsEnemy(enemy, distance, angle) {
    const massiveBoss = isMassiveEnemy(enemy);
    const profile = enemy.massiveProfile?.renderProfile || {
      targetWidthRatio: 0.48,
      targetHeightRatio: 0.52,
      maxHeightRatio: 0.62,
      maxWidthRatio: 0.56,
    };
    const worldHeight = massiveBoss ? 1.65 : (enemy.boss ? 1.55 : 1.14);
    const targetPixelWidth = W * (profile.targetWidthRatio || 0.48);
    const targetPixelHeight = H * (profile.targetHeightRatio || 0.52);
    const massiveAspect = targetPixelWidth / Math.max(1, targetPixelHeight);
    const aspect = massiveBoss ? massiveAspect : (enemy.boss ? 0.78 : 0.76);
    const projection = projectFpsEntity(distance, angle, worldHeight, aspect);

    const spriteIndex = enemy.spriteIndex ?? (enemy.boss ? 5 : 0);
    const fpsEnemy = fpsAnimationSetForRosterEntry(enemy.modularEntry);
    const modularEnemy = fpsEnemy || animationSetForEnemy(enemy, spriteIndex);
    const animation = fpsEnemyAnimation(enemy, projection.corrected);
    const frame = fpsEnemyAnimationFrame(enemy, animation, spriteIndex);
    const viewFacing = fpsEnemyViewDirection(enemy);
    enemy.viewDirection = viewFacing.direction;
    const reactionScale = animation === "hurt" ? ENEMY_HURT_RENDER_SCALE : 1;
    const maxMassiveHeight = H * clamp(profile.maxHeightRatio || 0.62, 0.4, 0.62);
    const maxMassiveWidth = W * clamp(profile.maxWidthRatio || 0.56, 0.36, 0.6);
    const projectedHeight = massiveBoss
      ? Math.min(projection.height, maxMassiveHeight)
      : projection.height;
    const projectedWidth = massiveBoss
      ? Math.min(projectedHeight * aspect, maxMassiveWidth)
      : projection.width;
    const renderWidth = projectedWidth * reactionScale;
    const renderHeight = projectedHeight * reactionScale;
    const renderLeft = projection.screenX - renderWidth / 2;
    const renderTop = projection.groundY - renderHeight;
    if (renderLeft > W || renderLeft + renderWidth < 0) return;

    ctx.save();
    const clipWidth = massiveBoss ? renderWidth * 1.12 : renderHeight * 1.04;
    const clipLeft = projection.screenX - clipWidth / 2;
    if (!clipBillboardToDepth(clipLeft, clipWidth, projection.corrected)) {
      ctx.restore();
      return;
    }

    const shadowWidth = renderWidth * (massiveBoss ? 0.62 : 0.42);
    ctx.fillStyle = "rgba(0, 0, 0, .48)";
    ctx.fillRect(
      Math.round(projection.screenX - shadowWidth / 2),
      Math.round(projection.groundY - Math.max(2, renderHeight * 0.025)),
      Math.round(shadowWidth),
      Math.max(2, Math.round(renderHeight * 0.05)),
    );

    if (enemy.flash > 0) ctx.filter = "brightness(2.25) saturate(.28)";
    if (modularAnimationReady(modularEnemy, animation)) {
      const drawEnemyAnimation = massiveBoss
        ? drawCroppedAnimationSprite
        : drawAnimationSprite;
      const drawProjectedWeapon = () => {
        ctx.save();
        ctx.translate(projection.screenX, projection.groundY);
        ctx.scale(viewFacing.mirror ? -1 : 1, 1);
        drawEnemyWeapon(
          enemy,
          animation,
          { width: renderWidth, height: renderHeight },
          true,
          frame,
        );
        ctx.restore();
      };
      const frameRig = enemyWeaponRig(enemy, animation, frame, true);
      const massiveEquipmentLayer = MASSIVE_EQUIPMENT_MOUNTS[
        enemy.weaponAsset?.id
      ]?.fps?.layer;
      const equipmentBehindBody = massiveEquipmentLayer
        ? massiveEquipmentLayer === "behind-body"
        : weaponLayerForFrame(enemy.modularEntry, frameRig, "fps") === "behind-body";
      if (
        animation !== "death"
        && (viewFacing.direction === "back" || equipmentBehindBody)
      ) {
        drawProjectedWeapon();
      }
      if (massiveBoss) {
        ctx.save();
        ctx.translate(projection.screenX, 0);
        ctx.scale(viewFacing.mirror ? -1 : 1, 1);
        drawEnemyAnimation(
          modularEnemy,
          animation,
          frame,
          Math.round(-renderWidth / 2),
          Math.round(renderTop),
          Math.round(renderWidth),
          Math.round(renderHeight),
        );
        ctx.restore();
      } else {
        drawDirectionalAnimationSprite(
          modularEnemy,
          animation,
          frame,
          projection.screenX,
          Math.round(renderTop),
          Math.round(renderWidth),
          Math.round(renderHeight),
          viewFacing,
        );
      }
      if (
        animation !== "death"
        && viewFacing.direction !== "back"
        && !equipmentBehindBody
      ) {
        drawProjectedWeapon();
      }
      ctx.restore();
      return;
    }

    const generatedEnemy = bitmapAssets.enemies[spriteIndex];
    if (bitmapReady(generatedEnemy)) {
      ctx.save();
      if (animation === "death") {
        const deathProgress = clamp(1 - (enemy.deathTimer || 0) / ENEMY_DEATH_DURATION, 0, 1);
        ctx.globalAlpha = 1 - deathProgress * 0.35;
        ctx.translate(projection.screenX, projection.groundY);
        ctx.rotate(-deathProgress * 0.62);
        ctx.translate(-projection.screenX, -projection.groundY);
      }
      ctx.drawImage(
        generatedEnemy,
        Math.round(renderLeft),
        Math.round(renderTop),
        Math.round(renderWidth),
        Math.round(renderHeight),
      );
      ctx.restore();
      ctx.restore();
      return;
    }

    const unit = Math.max(1, Math.floor(projection.height / 16));
    const x = Math.round(projection.screenX - unit * 8);
    const y = Math.round(projection.groundY - unit * 16);
    ctx.fillStyle = enemy.flash > 0 ? "#fff5dc" : enemy.boss ? "#6c1e28" : "#272329";
    ctx.fillRect(x + unit * 4, y + unit * 7, unit * 8, unit * 8);
    ctx.fillRect(x + unit * 2, y + unit * 8, unit * 3, unit * 7);
    ctx.fillRect(x + unit * 11, y + unit * 8, unit * 3, unit * 7);
    ctx.fillStyle = enemy.flash > 0 ? "#fff" : "#728d58";
    ctx.fillRect(x + unit * 5, y + unit * 2, unit * 6, unit * 6);
    ctx.fillStyle = enemy.boss ? "#15141b" : "#514235";
    ctx.fillRect(x + unit * 4, y + unit, unit * 8, unit * 3);
    ctx.fillStyle = "#c5ee69";
    ctx.fillRect(x + unit * 6, y + unit * 4, unit, unit);
    ctx.fillRect(x + unit * 9, y + unit * 4, unit, unit);
    ctx.restore();
  }

  function drawFpsEnemyLegacy(enemy, distance, angle) {
    const corrected = distance * Math.cos(angle);
    const giantBoss = enemy.modularEntry?.category === "giant";
    const size = clamp(
      (H / corrected) * (giantBoss ? 2.05 : (enemy.boss ? 1.25 : 0.78)),
      12,
      giantBoss ? 320 : (enemy.boss ? 260 : 190),
    );
    const screenX = W / 2 + Math.tan(angle) * (W / 2) / Math.tan(FOV / 2);
    const rayIndex = clamp(Math.floor(screenX / 2), 0, 319);
    if (corrected > game.fps.zBuffer[rayIndex] + 0.3) return;
    const x = Math.round(screenX - size / 2);
    const y = Math.round(H / 2 - size * 0.42);
    const spriteIndex = enemy.spriteIndex ?? (enemy.boss ? 5 : 0);
    const fpsEnemy = fpsAnimationSetForRosterEntry(enemy.modularEntry);
    const modularEnemy = fpsEnemy || animationSetForEnemy(enemy, spriteIndex);
    const modularAnimation = enemy.flash > 0
      ? "hurt"
      : (enemy.attack > 0.72 ? "attack" : (corrected > 3.2 ? "move" : "idle"));
    if (modularAnimationReady(modularEnemy, modularAnimation)) {
      const spriteSize = size * (giantBoss ? 1.5 : (enemy.boss ? 1.34 : 1.16));
      const frame = modularAnimation === "attack"
        ? Math.min(5, Math.floor(clamp(1 - enemy.attack / (enemy.boss ? 0.72 : 1.08), 0, 0.999) * 6))
        : Math.floor((performance.now() + spriteIndex * 113) / 130) % 6;
      ctx.save();
      if (enemy.flash > 0) ctx.filter = "brightness(2.3) saturate(.2)";
      ctx.fillStyle = "rgba(0,0,0,.48)";
      ctx.fillRect(
        Math.round(screenX - spriteSize * .28),
        Math.round(H / 2 + spriteSize * .42),
        Math.round(spriteSize * .56),
        Math.max(2, Math.round(spriteSize * .06)),
      );
      drawAnimationSprite(
        modularEnemy,
        modularAnimation,
        frame,
        Math.round(screenX - spriteSize / 2),
        Math.round(H / 2 - spriteSize * .54),
        Math.round(spriteSize),
        Math.round(spriteSize),
      );
      ctx.save();
      // Les points de prise FPS sont exprimés depuis le bas du viewmodel.
      // Le sprite, lui, est centré autour de H / 2 : ce décalage replace
      // l'arme dans la main au lieu de la faire flotter au-dessus de la tête.
      ctx.translate(screenX, H / 2 + spriteSize * 0.46);
      drawEnemyWeapon(enemy, modularAnimation, spriteSize, true, frame);
      ctx.restore();
      ctx.restore();
      return;
    }

    const generatedEnemy = bitmapAssets.enemies[enemy.spriteIndex ?? (enemy.boss ? 5 : 0)];
    if (bitmapReady(generatedEnemy)) {
      const spriteSize = size * (enemy.boss ? 1.2 : 1.08);
      ctx.save();
      if (enemy.flash > 0) ctx.filter = "brightness(2.3) saturate(.2)";
      ctx.fillStyle = "rgba(0,0,0,.48)";
      ctx.fillRect(
        Math.round(screenX - spriteSize * .28),
        Math.round(H / 2 + spriteSize * .42),
        Math.round(spriteSize * .56),
        Math.max(2, Math.round(spriteSize * .06)),
      );
      ctx.drawImage(
        generatedEnemy,
        Math.round(screenX - spriteSize / 2),
        Math.round(H / 2 - spriteSize * .54),
        Math.round(spriteSize),
        Math.round(spriteSize),
      );
      ctx.restore();
      return;
    }

    const unit = Math.max(1, Math.floor(size / 16));
    ctx.save();
    if (enemy.flash > 0) ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(x + unit * 2, y + unit * 15, unit * 12, unit * 2);
    ctx.fillStyle = enemy.flash > 0 ? "#fff5dc" : enemy.boss ? "#6c1e28" : "#272329";
    ctx.fillRect(x + unit * 4, y + unit * 7, unit * 8, unit * 8);
    ctx.fillRect(x + unit * 2, y + unit * 8, unit * 3, unit * 7);
    ctx.fillRect(x + unit * 11, y + unit * 8, unit * 3, unit * 7);
    ctx.fillStyle = enemy.flash > 0 ? "#fff" : "#728d58";
    ctx.fillRect(x + unit * 5, y + unit * 2, unit * 6, unit * 6);
    ctx.fillStyle = enemy.boss ? "#15141b" : "#514235";
    ctx.fillRect(x + unit * 4, y + unit, unit * 8, unit * 3);
    if (enemy.boss) {
      ctx.fillRect(x + unit * 2, y + unit * 4, unit * 12, unit * 2);
      ctx.fillStyle = "#ad6638"; ctx.fillRect(x + unit * 3, y, unit * 2, unit * 3); ctx.fillRect(x + unit * 11, y, unit * 2, unit * 3);
    }
    ctx.fillStyle = "#c5ee69"; ctx.fillRect(x + unit * 6, y + unit * 4, unit, unit); ctx.fillRect(x + unit * 9, y + unit * 4, unit, unit);
    ctx.fillStyle = "#7c1721"; ctx.fillRect(x + unit * 7, y + unit * 6, unit * 3, unit);
    ctx.restore();
  }

  function drawFpsAltar(mission) {
    const p = mission.player;
    const dx = mission.altar.x - p.x;
    const dy = mission.altar.y - p.y;
    const distance = Math.hypot(dx, dy);
    const angle = normalizeAngle(Math.atan2(dy, dx) - p.angle);
    if (Math.abs(angle) > FOV * 0.7 || distance < 0.2) return;

    const missionDef = FPS_DEFS[game.fps.current] || FPS_DEFS[0];
    const altarAssetIndex = clamp(Number(missionDef.altarAssetIndex) || 0, 0, bitmapAssets.fpsAltars.length - 1);
    const image = bitmapAssets.fpsAltars[altarAssetIndex];
    const bounds = opaqueBoundsForImage(image);
    const aspect = bounds ? bounds.w / bounds.h : 0.9;
    const worldHeight = altarAssetIndex === 0 ? 0.72 : 1.02;
    const projection = projectFpsEntity(distance, angle, worldHeight, aspect);
    const left = projection.screenX - projection.width / 2;

    ctx.save();
    if (!clipBillboardToDepth(left, projection.width, projection.corrected, 0.16)) {
      ctx.restore();
      return;
    }
    ctx.fillStyle = "rgba(0, 0, 0, .46)";
    ctx.fillRect(
      Math.round(projection.screenX - projection.width * 0.32),
      Math.round(projection.groundY - Math.max(2, projection.height * 0.025)),
      Math.round(projection.width * 0.64),
      Math.max(2, Math.round(projection.height * 0.05)),
    );

    if (!mission.purified) {
      const pulse = 0.22 + Math.sin(performance.now() / 170) * 0.06;
      ctx.shadowColor = altarAssetIndex === 0
        ? "rgba(116, 232, 152, .9)"
        : "rgba(178, 70, 95, .85)";
      ctx.shadowBlur = Math.max(5, projection.height * pulse);
    }
    if (bounds) {
      drawOpaqueBitmap(
        image,
        left,
        projection.top,
        projection.width,
        projection.height,
      );
    } else {
      ctx.fillStyle = "#1b1518";
      ctx.fillRect(left, projection.top + projection.height * 0.42, projection.width, projection.height * 0.58);
      ctx.fillStyle = mission.purified ? "#6bd1c4" : "#8fc45a";
      ctx.fillRect(
        left + projection.width * 0.18,
        projection.top + projection.height * 0.2,
        projection.width * 0.64,
        projection.height * 0.24,
      );
    }
    if (mission.purified) {
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = "#baf4df";
      ctx.fillRect(
        projection.screenX - Math.max(1, projection.width * 0.03),
        projection.top,
        Math.max(2, projection.width * 0.06),
        projection.height * 0.72,
      );
    }
    ctx.restore();
  }

  function drawFpsAltarLegacy(mission) {
    const p = mission.player;
    const dx = mission.altar.x - p.x, dy = mission.altar.y - p.y;
    const distance = Math.hypot(dx, dy);
    const angle = normalizeAngle(Math.atan2(dy, dx) - p.angle);
    if (Math.abs(angle) > FOV * 0.65 || distance < 0.2) return;
    const corrected = distance * Math.cos(angle);
    const screenX = W / 2 + Math.tan(angle) * (W / 2) / Math.tan(FOV / 2);
    if (corrected > game.fps.zBuffer[clamp(Math.floor(screenX / 2), 0, 319)] + 0.2) return;
    const size = clamp(H / corrected, 18, 180);
    const x = screenX - size / 2, y = H / 2 - size * 0.15;
    ctx.fillStyle = "#1b1518"; ctx.fillRect(x, y, size, size * 0.55);
    ctx.fillStyle = mission.purified ? "#6bd1c4" : "#8fc45a"; ctx.fillRect(x + size * 0.18, y - size * 0.2, size * 0.64, size * 0.24);
    ctx.fillStyle = "rgba(142,210,93,.28)"; ctx.fillRect(x + size * 0.08, y - size * 0.3, size * 0.84, size * 0.4);
  }

  function drawFpsWeapon() {
    const swing = game.attackTimer > 0
      ? Math.sin((1 - game.attackTimer / Math.max(0.01, game.attackDuration)) * Math.PI)
      : 0;

    if (drawFpsSelectedWeapon()) return;

    ctx.save();
    ctx.translate(W * 0.72 - swing * 170, H * 0.72 - swing * 95);
    ctx.rotate(-0.72 + swing * 1.25);
    ctx.fillStyle = "#4a2423"; ctx.fillRect(-10, 5, 56, 18);
    ctx.fillStyle = "#c4c8c5"; ctx.fillRect(32, 7, 190, 8);
    ctx.fillStyle = "#f3e8ca"; ctx.fillRect(40, 7, 175, 2);
    ctx.fillStyle = "#a76c38"; ctx.fillRect(26, 1, 8, 28);
    ctx.restore();
  }

  function drawFpsRangedProjectile() {
    if (game.rangedViewTimer <= 0) return;
    const weapon = arsenalWeaponById(game.lastRangedWeaponId);
    const image = playerWeaponBitmap(weapon, "fps");
    const fallback = bitmapReady(image) ? image : playerWeaponBitmap(weapon, "side");
    if (!bitmapReady(fallback)) return;
    const progress = clamp(1 - game.rangedViewTimer / 0.2, 0, 1);
    const family = weaponFamilyKey(weapon);
    ctx.save();
    if (["bow", "firearm"].includes(family)) {
      ctx.translate(W * 0.68, H * (0.79 + Math.sin(progress * Math.PI) * 0.025));
      ctx.rotate(family === "bow" ? -0.18 : -0.08 + progress * 0.08);
    } else {
      ctx.translate(
        W * (0.68 - progress * 0.18),
        H * (0.82 - progress * 0.3),
      );
      ctx.rotate(
        ["throwing", "fan"].includes(family)
          ? progress * Math.PI * 5
          : -0.3,
      );
    }
    ctx.globalAlpha = 1 - progress * 0.42;
    drawWeaponImage(fallback, {
      anchor: [0.5, 0.5],
      maxDimension: ["bow", "firearm"].includes(family)
        ? 120
        : 34 - progress * 18,
    });
    ctx.restore();
  }

  function drawCrosshair() {
    ctx.fillStyle = "rgba(242,230,202,.82)";
    ctx.fillRect(W / 2 - 9, H / 2, 6, 1); ctx.fillRect(W / 2 + 4, H / 2, 6, 1);
    ctx.fillRect(W / 2, H / 2 - 9, 1, 6); ctx.fillRect(W / 2, H / 2 + 4, 1, 6);
  }

  function drawMiniMap(mission) {
    const scale = 3, ox = W - mission.map[0].length * scale - 10, oy = 58;
    ctx.globalAlpha = 0.68;
    ctx.fillStyle = "#05070a"; ctx.fillRect(ox - 4, oy - 4, mission.map[0].length * scale + 8, mission.map.length * scale + 8);
    for (let y = 0; y < mission.map.length; y++) for (let x = 0; x < mission.map[y].length; x++) {
      ctx.fillStyle = mission.map[y][x] === "1" ? "#5c4a45" : mission.map[y][x] === "3" ? "#80b75a" : "#171c20";
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
    }
    ctx.fillStyle = "#e84a46"; ctx.fillRect(ox + mission.player.x * scale - 1, oy + mission.player.y * scale - 1, 3, 3);
    ctx.globalAlpha = 1;
  }

  function drawFpsParticles(particles) {
    for (const p of particles) {
      if (!p.screen) continue;
      drawParticleMark(p, true);
    }
  }

  function drawTransition() {
    const t = game.transition / 0.85;
    const openness = Math.abs(t - 0.5) * 2;
    const band = (1 - openness) * H * 0.55;
    ctx.fillStyle = "#05060a";
    ctx.fillRect(0, 0, W, band);
    ctx.fillRect(0, H - band, W, band);
    ctx.fillStyle = "rgba(184,43,49,.75)";
    ctx.fillRect(0, band - 3, W, 3);
    ctx.fillRect(0, H - band, W, 3);
    if (band > H * 0.25) {
      ctx.fillStyle = "#eee0bd"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
      ctx.fillText(game.transitionLabel, W / 2, H / 2);
    }
  }

  function updateHud() {
    dom.health.style.width = `${game.health}%`;
    dom.healthText.textContent = Math.ceil(game.health);
    dom.stamina.style.width = `${game.stamina}%`;
    dom.staminaText.textContent = Math.ceil(game.stamina);
    dom.ammo.textContent = game.ammo;
    dom.seals.textContent = `${game.seals}/2`;
    dom.score.textContent = game.kills;
    dom.mode.textContent = game.mode === "side" ? "VUE LATÉRALE" : "VUE SUBJECTIVE";
    const nearbyPortal = game.mode === "side" ? nearestSidePortal() : null;
    dom.hint.textContent = game.mode === "side"
      ? (nearbyPortal
        ? `${nearbyPortal.prompt || "E — ENTRER"} · J arme active · K projectile`
        : "A/D avancer · ESPACE sauter · J attaquer · K projectile · E porte")
      : "W/S avancer · A/D esquiver · SOURIS tourner · J arme active · K projectile · E sceller";
    dom.objective.textContent = objectiveText();
    const activeWeapon = currentPlayerWeapon();
    if (dom.activeWeaponName) dom.activeWeaponName.textContent = activeWeapon?.name || "KUROKAGE";
    if (dom.activeWeaponFamily) {
      dom.activeWeaponFamily.textContent = game.activeWeaponSlot === "secondary"
        ? "SECONDAIRE"
        : "PRINCIPALE";
    }
    if (dom.hudWeapon) dom.hudWeapon.dataset.weapon = activeWeapon?.id || KATANA_IDS[0];
    if (dom.hudWeaponIcon) {
      const preview = activeWeapon?.sprites?.preview || weaponSpritePath(activeWeapon, "side");
      if (preview && dom.hudWeaponIcon.getAttribute?.("src") !== preview) {
        dom.hudWeaponIcon.src = preview;
      }
    }

    const mission = game.mode === "fps" ? currentMission() : null;
    const boss = game.mode === "side"
      ? game.side.enemies.find((enemy) => enemy.boss && !enemy.dead)
      : mission?.enemies.find((enemy) => enemy.boss && !enemy.dead);
    dom.bossBar.hidden = !boss;
    if (boss) {
      const phase = isMassiveEnemy(boss) ? ` · PHASE ${boss.massivePhase || 1}` : "";
      dom.bossName.textContent = `${String(boss.modularEntry?.name || "LE DAIMYŌ CORROMPU").toUpperCase()}${phase}`;
      dom.bossHealth.style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
    }
  }

  function objectiveText() {
    if (game.mode === "side") {
      const activeMassiveBoss = game.side.enemies.find((enemy) =>
        isMassiveEnemy(enemy) && isEnemyAlive(enemy));
      if (activeMassiveBoss) return "Abattre Aka-Ushi pour libérer la route du château";
      const activeArea = currentSideArea();
      if (activeArea?.objective) return activeArea.objective;
      const areaLabel = activeArea?.label;
      if (areaLabel && game.side.areaId !== sideAreaIdForChapter(game.chapter)) {
        return `${areaLabel} — trouver une porte vers l'objectif`;
      }
      return game.chapter === 0
        ? "Atteindre le torii contaminé puis appuyer sur E"
        : "Suivre les portes des ruelles, du marché et du château";
    }
    const mission = currentMission();
    const remaining = mission.enemies.filter((e) => !e.dead).length;
    if (remaining) return `${mission.objective} (${remaining})`;
    if (mission.purified && mission.optional) return "Foyer purifié — V pour revenir dans la zone";
    return `${mission.altarObjective} — E`;
  }

  function frame(now) {
    const dt = Math.min(0.033, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    if (game.status === "playing") update(dt);
    else if (game.status === "dying") {
      game.deathTimer = Math.max(0, game.deathTimer - dt);
      game.shake = Math.max(0, game.shake - dt * 22);
      if (game.deathTimer <= 0) finishGame(false);
    }
    draw();
    rafId = requestAnimationFrame(frame);
  }

  function applyPlayerLoadout(loadout, persist = false) {
    const previousRangedWeapon = arsenalWeaponById(game.loadout?.ranged);
    if (game.ammoByType && previousRangedWeapon) {
      game.ammoByType[rangedAmmoType(previousRangedWeapon)] = game.ammo;
    }
    const normalized = normalizePlayerLoadout(loadout);
    game.loadout = normalized;
    if (!["primary", "secondary"].includes(game.activeWeaponSlot)) {
      game.activeWeaponSlot = "primary";
    }
    game.activeWeaponId = normalized[game.activeWeaponSlot] || normalized.primary;
    game.weaponIndex = Math.max(0, KATANA_IDS.indexOf(game.activeWeaponId));
    const nextRangedWeapon = arsenalWeaponById(normalized.ranged);
    const nextAmmoType = rangedAmmoType(nextRangedWeapon);
    const nextCapacity = rangedAmmoCapacity(nextRangedWeapon);
    game.ammo = clamp(
      Number(game.ammoByType?.[nextAmmoType] ?? nextCapacity),
      0,
      nextCapacity,
    );
    game.ammoByType[nextAmmoType] = game.ammo;
    if (persist) {
      try { window.KageSave?.setLoadout?.(normalized); } catch (_) { /* facultatif */ }
      persistAmmoMap();
    }
    return { ...normalized };
  }

  function equipWeapon(idOrSlot) {
    const value = String(idOrSlot);
    const numeric = Number(idOrSlot);
    let slot = ["primary", "secondary"].includes(value) ? value : null;
    if (!slot && Number.isInteger(numeric) && numeric >= 0 && numeric <= 1) {
      slot = numeric === 0 ? "primary" : "secondary";
    }
    if (slot) {
      game.activeWeaponSlot = slot;
      game.activeWeaponId = game.loadout[slot];
    } else {
      const weapon = arsenalWeaponById(value);
      if (!weapon) return false;
      game.activeWeaponId = weapon.id;
      const matchingSlot = ["primary", "secondary"].find((key) => game.loadout[key] === weapon.id);
      if (matchingSlot) game.activeWeaponSlot = matchingSlot;
    }
    const selected = currentPlayerWeapon();
    game.weaponIndex = Math.max(0, KATANA_IDS.indexOf(selected.id));
    announce(`ARME ACTIVE — ${String(selected.name || selected.id).toUpperCase()}`);
    if (typeof CustomEvent === "function" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("yomi:weapon-changed", {
        detail: {
          loadout: { ...game.loadout },
          weaponId: selected.id,
          slot: game.activeWeaponSlot,
        },
      }));
    }
    return true;
  }

  function swapActiveWeapon() {
    return equipWeapon(game.activeWeaponSlot === "primary" ? "secondary" : "primary");
  }

  function signalPlayerIntent() {
    if (game.status !== "playing" || game.engagementGrace <= 0) return;
    game.engagementGrace = Math.min(game.engagementGrace, 0.65);
  }

  function onKeyDown(event) {
    const k = event.key;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(k) && ["playing", "paused"].includes(game.status)) event.preventDefault();
    input.keys.add(k);
    input.keys.add(k.toLowerCase());
    if (event.repeat) return;
    if (k === "Escape" || k.toLowerCase() === "p") togglePause();
    if (game.status !== "playing") return;
    if (["a", "d", "w", "s", "arrowleft", "arrowright", "arrowup", "arrowdown", " ", "j", "l", "u", "h", "k", "e"].includes(k.toLowerCase())) {
      signalPlayerIntent();
    }
    if (k === " " && game.mode === "side") input.jumpQueued = true;
    if (k.toLowerCase() === "j") performAttack();
    if (k.toLowerCase() === "l") performHeavyAttack();
    if (k.toLowerCase() === "u") performGuard(true);
    if (k.toLowerCase() === "h") performDodge();
    if (k.toLowerCase() === "k") performRanged();
    if (k.toLowerCase() === "e") interact();
    if (k.toLowerCase() === "v") switchMode();
    if (k.toLowerCase() === "m") toggleAudio();
    if (k === "1") equipWeapon("primary");
    if (k === "2") equipWeapon("secondary");
    if (k === "3") performRanged();
    if (k.toLowerCase() === "q") swapActiveWeapon();
    if (k.toLowerCase() === "i") openLoadout();
  }

  function onKeyUp(event) {
    input.keys.delete(event.key);
    input.keys.delete(event.key.toLowerCase());
    if (event.key.toLowerCase() === "u") releaseGuard();
  }

  function handleAction(action) {
    if (["attack", "heavy", "guard", "dodge", "ranged", "interact"].includes(action)) {
      signalPlayerIntent();
    }
    if (action === "start") startGame();
    else if (action === "pause") togglePause();
    else if (action === "restart") restartGame();
    else if (action === "switch") switchMode();
    else if (action === "attack") performAttack();
    else if (action === "heavy") performHeavyAttack();
    else if (action === "guard") {
      performGuard(true);
      window.setTimeout?.(releaseGuard, 420);
    }
    else if (action === "guard-release") releaseGuard();
    else if (action === "dodge") performDodge();
    else if (action === "ranged") performRanged();
    else if (action === "interact") interact();
    else if (action === "weapon-next" || action === "weapon-swap") swapActiveWeapon();
    else if (action === "loadout") openLoadout();
    else if (action === "loadout-close") closeLoadout();
    else if (action === "continue") continueGame();
    else if (action === "new-game") newGame();
    else if (action === "settings") window.KageCinematic?.openSettings?.();
    else if (action === "title") returnToTitle();
  }

  function toggleAudio() {
    const muted = window.gameAudio?.toggleMute?.();
    dom.audioButton.setAttribute("aria-pressed", String(Boolean(muted)));
    dom.audioButton.setAttribute("aria-label", muted ? "Réactiver le son" : "Couper le son");
  }

  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", () => {
    input.keys.clear();
    input.lookPointerId = null;
    releaseGuard();
    if (game.status === "playing") togglePause();
  });
  window.addEventListener("yomi:loadout-opened", (event) => {
    if (game.status === "loadout") return;
    const requestedContext = event.detail?.context;
    game.loadoutReturnStatus = requestedContext === "pause"
      ? "paused"
      : (game.status === "playing" ? "playing" : "briefing");
    game.status = "loadout";
    document.body.dataset.state = "loadout";
    showOnly(dom.dojo);
    document.exitPointerLock?.();
  });
  window.addEventListener("yomi:loadout-applied", (event) => {
    applyPlayerLoadout(event.detail?.loadout, false);
    const shouldStart = game.loadoutReturnStatus === "briefing"
      || event.detail?.context === "briefing";
    if (shouldStart) {
      startGame();
    } else {
      closeLoadout();
      window.dispatchEvent?.(new CustomEvent("yomi:weapon-changed", {
        detail: {
          loadout: { ...game.loadout },
          weaponId: game.activeWeaponId,
          slot: game.activeWeaponSlot,
        },
      }));
    }
  });
  window.addEventListener("yomi:loadout-closed", () => {
    if (game.status === "loadout") closeLoadout();
  });
  document.addEventListener("mousemove", (event) => {
    if (game.status === "playing" && game.mode === "fps" && document.pointerLockElement === canvas) {
      currentMission().player.angle = normalizeAngle(currentMission().player.angle + event.movementX * 0.0025);
    }
  });
  canvas.addEventListener("pointerdown", (event) => {
    // Sur mobile, le canvas ne doit jamais confondre un geste de caméra avec
    // un coup. Les attaques tactiles ont leurs boutons dédiés.
    if (event.pointerType === "touch") return;
    if (game.status !== "playing") return;
    signalPlayerIntent();
    if (game.mode === "fps" && canvas.requestPointerLock && matchMedia("(pointer: fine)").matches) canvas.requestPointerLock()?.catch?.(() => {});
    if (event.button === 0) performAttack();
    if (event.button === 2) performRanged();
  });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  const touchLookZone = document.getElementById("touch-look");
  const resetTouchLook = (event) => {
    if (
      event
      && input.lookPointerId !== null
      && event.pointerId !== input.lookPointerId
    ) return;
    input.lookPointerId = null;
    input.lookLastX = 0;
    touchLookZone?.classList.remove("looking");
  };
  touchLookZone?.addEventListener("pointerdown", (event) => {
    if (game.status !== "playing" || game.mode !== "fps") return;
    event.preventDefault();
    signalPlayerIntent();
    input.lookPointerId = event.pointerId;
    input.lookLastX = event.clientX;
    touchLookZone.setPointerCapture?.(event.pointerId);
    touchLookZone.classList.add("looking");
  });
  touchLookZone?.addEventListener("pointermove", (event) => {
    if (event.pointerId !== input.lookPointerId) return;
    event.preventDefault();
    const deltaX = event.clientX - input.lookLastX;
    input.lookLastX = event.clientX;
    const viewportWidth = canvas.getBoundingClientRect?.().width
      || touchLookZone.offsetWidth
      || W;
    if (applyFpsLookDelta(deltaX, viewportWidth)) {
      touchLookZone.classList.add("used");
    }
  });
  touchLookZone?.addEventListener("pointerup", resetTouchLook);
  touchLookZone?.addEventListener("pointercancel", resetTouchLook);
  touchLookZone?.addEventListener("lostpointercapture", resetTouchLook);

  dom.startButton?.addEventListener("click", prepareNewGameBriefing);
  dom.continueButton?.addEventListener("click", (event) => {
    event.preventDefault?.();
    if (!dom.continueButton.disabled) continueGame();
  });
  dom.audioButton?.addEventListener("click", toggleAudio);

  const reducedMotionSetting = document.getElementById("settings-reduced-motion");
  reducedMotionSetting?.addEventListener("change", () => {
    game.settings.reducedMotion = Boolean(reducedMotionSetting.checked);
    window.KageSave?.setSetting?.("reducedMotion", game.settings.reducedMotion);
  });
  window.addEventListener("yomi:settings-updated", (event) => {
    game.settings.reducedMotion = Boolean(event.detail?.reducedMotion);
    game.settings.screenShake = event.detail?.screenShake !== false;
    if (game.settings.reducedMotion) game.shake = 0;
  });
  window.addEventListener("yomi:save-updated", () => {
    window.setTimeout?.(refreshContinueState, 0);
  });
  window.setTimeout?.(refreshContinueState, 0);

  document.querySelectorAll("[data-action]").forEach((button) => {
    if (button.dataset.action === "guard") {
      const guardDown = (event) => {
        event.preventDefault();
        signalPlayerIntent();
        button.setPointerCapture?.(event.pointerId);
        button.classList.add("pressed");
        performGuard(true);
      };
      const guardUp = (event) => {
        event.preventDefault();
        button.classList.remove("pressed");
        releaseGuard();
      };
      button.addEventListener("pointerdown", guardDown);
      button.addEventListener("pointerup", guardUp);
      button.addEventListener("pointercancel", guardUp);
      button.addEventListener("lostpointercapture", guardUp);
    } else {
      button.addEventListener("click", () => handleAction(button.dataset.action));
    }
  });

  document.querySelectorAll("[data-input]").forEach((button) => {
    const value = button.dataset.input;
    const mapping = { left: "a", right: "d", up: "w", down: "s" };
    const press = (event) => {
      event.preventDefault();
      signalPlayerIntent();
      button.setPointerCapture?.(event.pointerId);
      button.classList.add("pressed");
      input.keys.add(mapping[value]);
      if (value === "up" && game.mode === "side") input.jumpQueued = true;
    };
    const release = (event) => {
      event.preventDefault();
      button.classList.remove("pressed");
      input.keys.delete(mapping[value]);
    };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });

  window.KageGame = {
    start: startGame,
    continue: continueGame,
    newGame,
    pause: togglePause,
    restart: restartGame,
    switchMode,
    attack: performAttack,
    heavy: performHeavyAttack,
    guard: performGuard,
    releaseGuard,
    dodge: performDodge,
    ranged: performRanged,
    equipWeapon,
    swapWeapon: swapActiveWeapon,
    applyLoadout: (loadout) => applyPlayerLoadout(loadout, true),
    openLoadout,
    closeLoadout,
    interact,
    getState: () => ({
      status: game.status, mode: game.mode, chapter: game.chapter, health: game.health,
      stamina: game.stamina, ammo: game.ammo, seals: game.seals, kills: game.kills,
      ammoType: rangedAmmoType(currentRangedWeapon()),
      ammoByType: { ...game.ammoByType },
      weapon: game.activeWeaponId,
      activeWeapon: game.activeWeaponId,
      activeWeaponSlot: game.activeWeaponSlot,
      loadout: { ...game.loadout, omamori: [...(game.loadout.omamori || [])] },
      sideAreaId: game.side.areaId,
      visitedAreas: [...(game.side.visitedAreas || [])],
      nearbyPortal: nearestSidePortal()?.id || null,
      pendingTravel: game.pendingTravel ? { ...game.pendingTravel } : null,
      portalConfirmation: game.portalConfirmation
        ? { id: game.portalConfirmation.id }
        : null,
      player2d: { ...game.side.player },
      playerFps: { ...currentMission().player },
      fpsMissionId: currentMission().id,
      fpsOptional: currentMission().optional,
      fpsPurified: currentMission().purified,
      fpsRemaining: currentMission().enemies.filter((e) => !e.dead).length,
      nearEntrance: isNearSideEntrance(),
      entrance: { ...currentSideEntrance() },
      attackTimer: game.attackTimer,
      attackKind: game.attackKind,
      comboStep: game.comboStep,
      comboTimer: game.comboTimer,
      guarding: isPlayerGuarding(),
      parryTimer: game.parryTimer,
      dodgeTimer: game.dodgeTimer,
      dodgeCooldown: game.dodgeCooldown,
      playerPosture: game.playerPosture,
      perfectParries: game.perfectParries,
      engagementGrace: game.engagementGrace,
      checkpoint: game.activeCheckpointId,
      consumedCheckpoints: [...game.consumedCheckpointIds],
      hitConfirm: game.hitConfirm,
    }),
    debug: {
      setMode: (mode) => mode === "fps" ? enterFps(game.chapter, false) : returnToSide(false),
      setHealth: (health) => { game.health = clamp(Number(health), 0, 100); },
      setPlayerCombat: (patch = {}) => {
        const allowed = [
          "stamina", "attackTimer", "attackCooldown", "guardTimer", "parryTimer",
          "dodgeTimer", "dodgeCooldown", "playerPosture", "playerStagger", "invulnerable",
        ];
        allowed.forEach((key) => {
          if (Number.isFinite(Number(patch[key]))) game[key] = Number(patch[key]);
        });
        if (typeof patch.guardHeld === "boolean") game.guardHeld = patch.guardHeld;
        return window.KageGame.getState();
      },
      damagePlayer: (amount, source = {}) => {
        game.engagementGrace = 0;
        return damagePlayer(Number(amount), source);
      },
      step: (dt = 1 / 60) => {
        if (game.status === "playing") update(clamp(Number(dt) || 0, 0, 0.25));
        return window.KageGame.getState();
      },
      setPlayer2d: (patch = {}) => { Object.assign(game.side.player, patch); },
      setSideEnemy: (index, patch = {}) => {
        const enemy = game.side.enemies[clamp(Number(index) || 0, 0, game.side.enemies.length - 1)];
        Object.assign(enemy, patch);
        return { ...enemy };
      },
      setFpsPlayer: (patch = {}) => {
        Object.assign(currentMission().player, patch);
        return { ...currentMission().player };
      },
      lookFps: (deltaX, viewportWidth = W) => applyFpsLookDelta(deltaX, viewportWidth),
      renderTuning: () => ({
        enemyHurtScale: ENEMY_HURT_RENDER_SCALE,
        sideWalkDistancePerFrame: SIDE_WALK_DISTANCE_PER_FRAME,
        fpsKatanaHandAlignment: FPS_KATANA_HAND_ALIGNMENT,
      }),
      setFpsEnemy: (index, patch = {}) => {
        const enemies = currentMission().enemies;
        const enemy = enemies[clamp(Number(index) || 0, 0, enemies.length - 1)];
        Object.assign(enemy, patch);
        return { ...enemy };
      },
      warpToGate: () => {
        const entrance = currentSideEntrance();
        game.side.player.x = entrance.approachX ?? entrance.x - 42;
        game.side.player.y = SIDE_GROUND_Y - game.side.player.h;
        game.side.player.vx = 0;
        game.side.player.vy = 0;
        game.side.player.grounded = true;
      },
      setSideArea: (areaId, spawnId) => {
        setCurrentSideArea(String(areaId), spawnId, true);
        return window.KageGame.getState();
      },
      warpToPortal: (portalId) => {
        const portal = currentSidePortals().find((entry) => entry.id === portalId);
        if (!portal) return null;
        game.side.player.x = portal.approachX ?? portal.x - 24;
        game.side.player.y = SIDE_GROUND_Y - game.side.player.h;
        game.side.player.vx = 0;
        game.side.player.vy = 0;
        game.side.player.grounded = true;
        return { ...portal };
      },
      areaSnapshot: () => ({
        areaId: game.side.areaId,
        label: currentSideArea()?.label || "",
        zoneKind: currentSideArea()?.zoneKind || "legacy",
        rosterPoolId: currentSideArea()?.rosterPoolId || null,
        width: game.side.width,
        visitedAreas: [...(game.side.visitedAreas || [])],
        objectivePortalId: currentSideObjectivePortal()?.id || null,
        portals: currentSidePortals().map((portal) => ({
          id: portal.id,
          type: portal.type || "fps",
          mission: fpsMissionIndexForPortal(portal),
          x: portal.x,
          destination: portal.destination ? { ...portal.destination } : null,
          requiresAction: true,
          locked: Boolean(sidePortalLockMessage(portal)),
          blocksMovement: sidePortalBlocksMovement(portal),
        })),
        platforms: currentSidePlatforms().map((platform) => ({ ...platform })),
        aliveEnemyIds: game.side.enemies
          .filter(isEnemyAlive)
          .map((enemy) => enemy.sourceId),
        remainingPickupIds: game.side.pickups
          .filter((pickup) => !pickup.taken)
          .map((pickup) => pickup.sourceId),
        enemies: game.side.enemies.map((enemy) => ({
          sourceId: enemy.sourceId,
          rosterId: enemy.modularEntry?.id || enemy.rosterId || null,
          rosterPoolId: enemy.rosterPoolId || null,
          behaviorFamily: enemy.behaviorFamily || "melee",
          profileId: enemy.profileId || enemy.massiveProfile?.id || null,
          encounterId: enemy.encounterId || null,
          platformId: enemy.platformId || enemy.ai?.platformId || null,
          presentationClass: isMassiveEnemy(enemy) ? "massive" : "standard",
          boss: Boolean(enemy.boss),
          x: enemy.x,
          y: enemy.y,
          w: enemy.w,
          h: enemy.h,
          feetY: enemy.y + enemy.h,
          hp: enemy.hp,
          maxHp: enemy.maxHp,
          phase: enemy.massivePhase || null,
          detachablePartAttached: enemy.detachablePartAttached !== false,
          dead: Boolean(enemy.dead || enemy.dying || enemy.hp <= 0),
          ai: enemy.ai ? {
            state: enemy.ai.state,
            previousState: enemy.ai.previousState,
            reason: enemy.ai.reason,
            homeX: enemy.ai.homeX,
            homeY: enemy.ai.homeY,
            patrolMinX: enemy.ai.patrolMinX,
            patrolMaxX: enemy.ai.patrolMaxX,
            lastKnownX: enemy.ai.lastKnownX,
            memoryTime: enemy.ai.memoryTime,
            targetVisible: enemy.ai.targetVisible,
            targetAudible: enemy.ai.targetAudible,
          } : null,
        })),
      }),
      setMassiveBossHp: (hp) => {
        const market = game.side.areaStates?.["kurokawa-market-east"];
        const boss = market?.enemies?.find((enemy) => isMassiveEnemy(enemy))
          || game.side.enemies.find((enemy) => isMassiveEnemy(enemy));
        if (!boss) return null;
        boss.hp = clamp(Number(hp), 0, boss.maxHp);
        return boss.hp;
      },
      massiveBossSnapshot: () => {
        const market = game.side.areaStates?.["kurokawa-market-east"];
        const boss = market?.enemies?.find((enemy) => isMassiveEnemy(enemy))
          || game.side.enemies.find((enemy) => isMassiveEnemy(enemy));
        if (!boss) return null;
        const renderProfile = boss.massiveProfile?.renderProfile
          || boss.massiveProfile?.render
          || {};
        return {
          id: boss.modularEntry?.id || null,
          name: boss.modularEntry?.name || null,
          presentationClass: isMassiveEnemy(boss) ? "massive" : "boss",
          hp: boss.hp,
          maxHp: boss.maxHp,
          phase: boss.massivePhase || 1,
          detachablePartAttached: boss.detachablePartAttached !== false,
          detachedHazard: boss.detachedEquipment
            ? { ...boss.detachedEquipment }
            : null,
          targetWidthRatio: renderProfile.targetWidthRatio || 0.48,
          targetHeightRatio: renderProfile.targetHeightRatio || 0.52,
          maxHeightRatio: renderProfile.maxHeightRatio || 0.62,
          maxWidthRatio: renderProfile.maxWidthRatio || 0.56,
        };
      },
      clearFps: () => {
        currentMission().enemies.forEach((enemy) => {
          enemy.hp = 0;
          enemy.dying = false;
          enemy.dead = true;
          enemy.attack = 0;
        });
      },
      clearSide: () => {
        game.side.enemies.forEach((enemy) => {
          enemy.hp = 0;
          enemy.dying = false;
          enemy.dead = true;
          enemy.attack = 0;
          enemy.attackCooldown = 0;
        });
        return game.side.enemies.length;
      },
      warpToAltar: () => { const m = currentMission(); m.player.x = m.altar.x; m.player.y = m.altar.y; },
      worldSnapshot: () => {
        const scheme = currentFpsMaterialScheme();
        const mission = currentMission();
        const sideRules = currentSideRules();
        const snapshotProps = currentWorldProps();
        const chamberSample = game.fps.current === 0
          ? { mapX: 9, mapY: 9 }
          : { mapX: 3, mapY: 3 };
        return {
          groundY: SIDE_GROUND_Y,
          groundDepth: SIDE_GROUND_DEPTH,
          bounds: {
            minX: sideRules.minX,
            maxX: sideRules.maxX,
            cameraMinX: sideRules.cameraMinX,
          },
          platforms: currentSidePlatforms().map((platform) => ({ ...platform })),
          enemies: game.side.enemies.map((enemy) => ({
            x: enemy.x,
            y: enemy.y,
            w: enemy.w,
            h: enemy.h,
            dead: enemy.dead,
          })),
          pickups: game.side.pickups.map((pickup) => ({
            x: pickup.x,
            w: 10,
            taken: pickup.taken,
          })),
          areaId: game.side.areaId,
          zoneKind: currentSideArea()?.zoneKind || "legacy",
          propSource: currentSideArea()?.props
            ? "kage-levels"
            : (ALLOW_LEGACY_LAYOUT ? "legacy-explicit" : "missing"),
          levelSchema: levelContract?.schema || null,
          levelBuildId: levelContract?.buildId || null,
          resolvedProps: snapshotProps.filter((prop) => bitmapReady(prop.image)).length,
          missingPropFiles: [...new Set(
            snapshotProps
              .filter((prop) => !bitmapReady(prop.image))
              .map((prop) => prop.file),
          )],
          wallStatus: {
            ready: ALLEY_WALL_IDS.filter((id) =>
              bitmapReady(bitmapAssets.alleyWalls[id])).length,
            total: ALLEY_WALL_IDS.length,
          },
          visitedAreas: [...(game.side.visitedAreas || [])],
          objectivePortalId: currentSideObjectivePortal()?.id || null,
          portals: currentSidePortals().map((portal) => ({
            id: portal.id,
            type: portal.type || "fps",
            x: portal.x,
            destination: portal.destination ? { ...portal.destination } : null,
            locked: Boolean(sidePortalLockMessage(portal)),
            blocksMovement: sidePortalBlocksMovement(portal),
          })),
          frontPropFootprints: snapshotProps
            .filter((prop) => prop.layer === "front")
            .map((prop) => ({ x: prop.x, w: prop.width, file: prop.file })),
          props: snapshotProps
            .map((prop) => ({
              x: prop.x,
              w: prop.width,
              file: prop.file,
              layer: prop.layer || "back",
              bottomY: prop.bottomY ?? SIDE_GROUND_Y,
              baselineY: prop.baselineY ?? prop.bottomY ?? SIDE_GROUND_Y,
              depthBias: Number(prop.depthBias) || 0,
              compositionRole: prop.compositionRole || null,
              legacyFallback: Boolean(prop.legacyFallback),
            })),
          entrancePassThrough: currentSideEntrance().collision === "passThrough",
          fps: {
            scheme: scheme.id,
            floorTile: scheme.floorTile,
            floorProjection: "world-uv-floor-cast",
            touchLook: Boolean(touchLookZone),
            wallTiles: {
              boundary: fpsWallTileIndex({ mapX: 0, mapY: 1 }),
              core: fpsWallTileIndex({ mapX: 7, mapY: 7 }),
              chamber: fpsWallTileIndex(chamberSample),
              altar: fpsWallTileIndex({
                mapX: Math.floor(mission.altar.x),
                mapY: Math.floor(mission.altar.y),
              }),
            },
            forwardRay: castRay(mission, mission.player.angle),
          },
        };
      },
      combatSnapshot: () => ({
        player: {
          health: game.health,
          stamina: game.stamina,
          hurtTimer: game.hurtTimer,
          stagger: game.playerStagger,
          guarding: isPlayerGuarding(),
          posture: game.playerPosture,
          perfectParries: game.perfectParries,
        },
        sideEnemies: game.side.enemies.map((enemy) => ({
          sourceId: enemy.sourceId,
          platformId: enemy.platformId || enemy.ai?.platformId || null,
          hp: enemy.hp,
          maxHp: enemy.maxHp,
          dying: enemy.dying,
          dead: enemy.dead,
          hurtTimer: enemy.hurtTimer,
          material: enemy.impactMaterial,
          behaviorFamily: enemy.behaviorFamily || "melee",
          posture: enemy.posture || 0,
          maxPosture: enemy.maxPosture || 0,
          ai: enemy.ai ? {
            state: enemy.ai.state,
            homeX: enemy.ai.homeX,
            homeY: enemy.ai.homeY,
            patrolMinX: enemy.ai.patrolMinX,
            patrolMaxX: enemy.ai.patrolMaxX,
            lastKnownX: enemy.ai.lastKnownX,
            memoryTime: enemy.ai.memoryTime,
          } : null,
        })),
        fpsEnemies: currentMission().enemies.map((enemy) => ({
          rosterId: enemy.modularEntry?.id || enemy.rosterId || null,
          x: enemy.x,
          y: enemy.y,
          hp: enemy.hp,
          dead: enemy.dead,
          radius: fpsEnemyRadius(enemy),
          engagementSlot: enemy.engagementSlot,
          viewDirection: enemy.viewDirection || null,
          behaviorFamily: enemy.behaviorFamily || "melee",
          posture: enemy.posture || 0,
          maxPosture: enemy.maxPosture || 0,
          ai: enemy.ai ? {
            state: enemy.ai.state,
            heading: enemy.ai.heading,
            homeX: enemy.ai.homeX,
            homeY: enemy.ai.homeY,
            lastKnownX: enemy.ai.lastKnownX,
            lastKnownY: enemy.ai.lastKnownY,
            memoryTime: enemy.ai.memoryTime,
          } : null,
        })),
        particles: game.mode === "side"
          ? game.side.particles.map((particle) => particle.kind)
          : currentMission().particles.map((particle) => particle.kind),
        hitConfirmMaterial: game.hitConfirmMaterial,
      }),
      assetStatus: () => ({
        akio: modularAnimationReady(bitmapAssets.akioModular, "idle"),
        fpsPlayerDeferred: !bitmapAssets.akioFpsBody,
        akioModular: Object.fromEntries(
          MODULAR_ANIMATIONS.map((animation) => [animation, modularAnimationReady(bitmapAssets.akioModular, animation)]),
        ),
        akioFpsBody: Object.fromEntries(
          MODULAR_ANIMATIONS.map((animation) => [animation, modularAnimationReady(bitmapAssets.akioFpsBody, animation)]),
        ),
        fpsPlayerWeapons: bitmapAssets.fpsPlayerWeapons.map(bitmapReady),
        weapons: bitmapAssets.weapons.map(bitmapReady),
        backgrounds: bitmapAssets.sideBackgrounds.map(bitmapReady),
        parallaxBackgrounds: bitmapAssets.parallaxBackgrounds.map((set) =>
          Object.fromEntries(["sky", "far", "mid", "near"].map((layer) => [layer, bitmapReady(set[layer])]))),
        platformTiles: bitmapAssets.platformTiles.map((set) =>
          Object.fromEntries(
            Object.entries(set).map(([name, image]) => [name, bitmapReady(image)]),
          )),
        worldProps: bitmapAssets.worldProps.map((set) => ({
          ready: set.filter((prop) => bitmapReady(prop.image)).length,
          total: set.length,
        })),
        enemies: bitmapAssets.enemies.map(bitmapReady),
        modularEnemies: bitmapAssets.modularEnemies.map((set) =>
          Object.fromEntries(MODULAR_ANIMATIONS.map((animation) => [animation, modularAnimationReady(set, animation)]))),
        roster: {
          ready: modularRoster.ready,
          characters: modularRoster.characters.length,
          weapons: modularRoster.weapons.length,
          loadedCharacterSets: modularRoster.animationSets.size,
          loadedWeapons: modularRoster.weaponBitmaps.size,
        },
      }),
    },
  };

  document.body.dataset.state = "title";
  showOnly(dom.title);
  loadModularRoster();
  if (typeof location !== "undefined") {
    const previewParams = new URLSearchParams(location.search);
    const preview = previewParams.get("preview");
    const previewModes = new Set([
      "kurokawa",
      "bamboo",
      "contemporary",
      "cyberpunk",
      "forest",
      "fields",
      "gate-kurokawa",
      "gate-castle",
      "fps-kurokawa",
      "fps-castle",
    ]);
    if (previewModes.has(preview)) {
      previewEnvironmentIndex = ENVIRONMENT_PREVIEW_INDICES[preview] ?? null;
      if (previewEnvironmentIndex !== null) {
        document.body.dataset.previewEnvironment = preview;
      }
      startGame();
      const previewAreaId = previewParams.get("area");
      const previewArea = previewAreaId ? sideAreaById(previewAreaId) : null;
      if (previewAreaId && !previewArea) {
        document.body.dataset.previewError = "unknown-area";
        const panel = document.createElement("div");
        panel.id = "preview-area-error";
        panel.textContent = `ZONE DE PRÉVISUALISATION INCONNUE — ${previewAreaId}`;
        Object.assign(panel.style, {
          position: "fixed",
          inset: "0",
          zIndex: "99999",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          color: "#f2d6a2",
          background: "#090a0f",
          font: "700 16px monospace",
          textAlign: "center",
        });
        document.body.appendChild(panel);
        throw new Error(`Zone de prévisualisation inconnue : ${previewAreaId}`);
      }
      const castlePreview = previewArea
        ? previewArea.chapterId === "castle"
        : preview === "bamboo"
        || preview === "gate-castle"
        || preview === "fps-castle";
      game.chapter = castlePreview ? 1 : 0;
      prepareSideChapter(game.chapter);
      const previewSpawnId = previewParams.get("spawn");
      if (
        previewArea
        && !setCurrentSideArea(previewAreaId, previewSpawnId || undefined, true)
      ) {
        throw new Error(`Échec du chargement de la zone ${previewAreaId}`);
      }
      applyRosterToGame(game);
      if (preview?.startsWith("gate-")) {
        game.invulnerable = 999;
        const entrance = currentSideEntrance();
        Object.assign(game.side.player, {
          x: entrance.approachX,
          y: SIDE_GROUND_Y - game.side.player.h,
          vx: 0,
          vy: 0,
          grounded: true,
        });
        game.side.cameraX = clamp(entrance.x - W * 0.66, 0, game.side.width - W);
      } else if (preview?.startsWith("fps-")) {
        game.invulnerable = 999;
        enterFps(game.chapter, false);
        game.transition = 0;
      } else if (
        previewParams.has("x")
        && Number.isFinite(Number(previewParams.get("x")))
      ) {
        const targetX = clamp(
          Number(previewParams.get("x")),
          currentSideRules().minX,
          currentSideRules().maxX - game.side.player.w,
        );
        game.side.player.x = targetX;
        game.side.player.y = SIDE_GROUND_Y - game.side.player.h;
        game.side.player.vx = 0;
        game.side.player.vy = 0;
        game.side.player.grounded = true;
        game.side.cameraX = clamp(targetX - W * 0.45, 0, game.side.width - W);
      }
      updateHud();
    }
  }
  draw();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(frame);
})();
