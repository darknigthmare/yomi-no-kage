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
  const ASSET_VERSION = "20260718-hero-v2";
  const PLAYER_ATTACK_DURATION = 0.34;
  const PLAYER_ATTACK_ACTIVE_AT = 0.38;
  const PLAYER_HURT_DURATION = 0.72;
  const PLAYER_DEATH_DURATION = 0.9;
  const ENEMY_HURT_DURATION = 0.34;
  const ENEMY_DEATH_DURATION = 0.78;
  const SIDE_ENEMY_BASELINE_OFFSET = 4;
  const SIDE_GROUND_Y = 300;
  const SIDE_GROUND_DEPTH = 60;
  const KATANA_IDS = [
    "01-kurokage", "02-shogun-no-in", "03-hinezumi", "04-shirogane", "05-yomibane",
    "06-kegare-kiri", "07-takekaze", "08-raijin-no-tsume", "09-akatsuki", "10-mujo",
  ];
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
      { x: 80, y: 262, w: 132, h: 8, visualHeight: 27 },
      { x: 382, y: 236, w: 118, h: 8, visualHeight: 27 },
      { x: 628, y: 264, w: 116, h: 8, visualHeight: 27 },
      { x: 1058, y: 260, w: 142, h: 8, visualHeight: 29 },
      { x: 1422, y: 234, w: 122, h: 8, visualHeight: 27 },
      { x: 1688, y: 262, w: 136, h: 8, visualHeight: 28 },
      { x: 2105, y: 244, w: 118, h: 8, visualHeight: 27 },
      { x: 2300, y: 264, w: 126, h: 8, visualHeight: 27 },
    ],
    [
      { x: 1080, y: 264, w: 128, h: 8, visualHeight: 33 },
      { x: 1330, y: 238, w: 126, h: 8, visualHeight: 33 },
      { x: 1590, y: 264, w: 128, h: 8, visualHeight: 34 },
      { x: 1872, y: 242, w: 80, h: 8, visualHeight: 32 },
      { x: 2312, y: 264, w: 92, h: 8, visualHeight: 33 },
    ],
  ];
  const SIDE_CHAPTER_RULES = [
    {
      minX: 6,
      maxX: 2479,
      cameraMinX: 0,
      enemyXs: [330, 510, 990, 1030, 1210, 1400, 1640, 1880, 2240, 2440],
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
      enemyXs: [1000, 1230, 1310, 1465, 1490, 1730, 2420, 2450],
      pickups: [
        { x: 1240, kind: "ammo" },
        { x: 1570, kind: "health" },
        { x: 2260, kind: "ammo" },
      ],
    },
  ];
  const SIDE_MIDGROUND_SOURCE_Y = [696, 792, 791];
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
  const FPS_VIEWMODEL_RECT = { x: 80, y: 40, width: 480, height: 320 };
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
      idle: { x: 0.18, y: -0.4, scale: 0.34, rotation: -0.28 },
      move: { x: 0.16, y: -0.39, scale: 0.32, rotation: -0.22 },
      attack: { x: 0.22, y: -0.42, scale: 0.44, rotation: -0.9, arc: 1.55 },
      hurt: { x: 0.08, y: -0.36, scale: 0.3, rotation: 0.16 },
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
    akioFpsBody: loadAnimationSet("assets/modular/fps/player/akio/body"),
    // Les mêmes lames détourées servent aux deux perspectives. Les anciennes
    // sources générées contenaient encore, pour sept sabres, un morceau de
    // fourreau dans le crop 2D.
    weapons: KATANA_IDS.map((id) =>
      loadBitmap(`assets/modular/fps/player/akio/weapons/${id}/weapon.png`)),
    fpsPlayerWeapons: KATANA_IDS.map((id) =>
      loadBitmap(`assets/modular/fps/player/akio/weapons/${id}/weapon.png`)),
    sideBackgrounds: [
      loadBitmap("assets/generated/environments/01-kurokawa-burning-village.png"),
      loadBitmap("assets/generated/environments/02-bamboo-shrine.png"),
      loadBitmap("assets/generated/environments/03-daimyo-castle-interior.png"),
    ],
    parallaxBackgrounds: [
      loadParallaxSet("assets/modular/environments/kurokawa"),
      loadParallaxSet("assets/modular/environments/bamboo-shrine"),
      loadParallaxSet("assets/modular/environments/daimyo-castle"),
    ],
    platformTiles: [
      {
        ground: loadBitmap("assets/modular/environments/kurokawa/platforms/sol-terre-centre.png"),
        ledge: loadBitmap("assets/modular/environments/kurokawa/platforms/plateforme-bois-longue.png"),
      },
      {
        ground: loadBitmap("assets/modular/environments/bamboo-shrine/platforms/sol-pierre-centre.png"),
        ledge: loadBitmap("assets/modular/environments/bamboo-shrine/platforms/plateforme-bambou-longue.png"),
      },
      {
        ground: loadBitmap("assets/modular/environments/daimyo-castle/platforms/sol-tatami-centre.png"),
        ledge: loadBitmap("assets/modular/environments/daimyo-castle/platforms/plateforme-cedre-longue.png"),
      },
    ],
    sideEntrances: [
      loadBitmap("assets/modular/environments/bamboo-shrine/props/grand-torii.png"),
      loadBitmap("assets/modular/environments/daimyo-castle/props/porte-chateau.png"),
    ],
    fpsWallAtlas: loadBitmap("assets/generated/props/fps-wall-texture-atlas.png"),
    fpsAltars: [
      loadBitmap("assets/modular/environments/bamboo-shrine/props/autel-purification.png"),
      loadBitmap("assets/modular/environments/daimyo-castle/props/racines-donjon.png"),
    ],
    worldProps: [
      loadPropSet("assets/modular/environments/kurokawa", [
        { file: "minka-chaume-brulee", x: 42, width: 175 },
        { file: "barriere-village", x: 220, width: 86, layer: "front" },
        { file: "tour-guet-kurokawa", x: 315, width: 82 },
        { file: "minka-tuiles-intacte", x: 535, width: 175 },
        { file: "foyer-incendie", x: 760, width: 76, layer: "front" },
        { file: "kura-entrepot-riz", x: 1010, width: 145 },
        { file: "charrette-cassee", x: 1325, width: 74, layer: "front" },
        { file: "puits-pierre", x: 1570, width: 54, layer: "front" },
        { file: "minka-chaume-brulee", x: 1810, width: 175 },
        { file: "autel-route", x: 2040, width: 58, layer: "front" },
        { file: "tour-guet-kurokawa", x: 2250, width: 82 },
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
        { file: "mur-shoji", x: 1215, width: 190 },
        { file: "alcove-tatami", x: 1450, width: 175 },
        { file: "porte-laquee", x: 1705, width: 170 },
        { file: "pilier-cedre", x: 1910, width: 48 },
        { file: "brasero-fer", x: 1270, width: 38, layer: "front" },
        { file: "armure-vide", x: 1515, width: 42, layer: "front" },
        { file: "paravent-dechire", x: 1760, width: 105, layer: "front" },
        { file: "ratelier-vide", x: 1960, width: 85, layer: "front" },
        { file: "racines-donjon", x: 2045, width: 80, layer: "front" },
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

  function getRosterCategory(category) {
    return modularRoster.characters.filter((entry) => entry.category === category);
  }

  function animationSetForRosterEntry(entry) {
    if (!entry) return null;
    if (!modularRoster.animationSets.has(entry.id)) {
      modularRoster.animationSets.set(
        entry.id,
        loadAnimationSet(`assets/modular/characters/${entry.category}/${entry.id}`),
      );
    }
    return modularRoster.animationSets.get(entry.id);
  }

  function animationSetFromPaths(paths, cache, cacheId) {
    if (!paths || !cacheId) return null;
    if (!cache.has(cacheId)) {
      cache.set(
        cacheId,
        Object.fromEntries(
          MODULAR_ANIMATIONS.map((animation) => [
            animation,
            paths[animation] ? loadBitmap(paths[animation]) : null,
          ]),
        ),
      );
    }
    return cache.get(cacheId);
  }

  function fpsAnimationSetForRosterEntry(entry) {
    if (!entry) return null;
    return animationSetFromPaths(entry.fpsAnimations, modularRoster.fpsAnimationSets, entry.id);
  }

  function fpsWeaponSetForWeapon(weapon) {
    if (!weapon) return null;
    return animationSetFromPaths(weapon.fpsAnimations, modularRoster.fpsWeaponAnimationSets, weapon.id);
  }

  function weaponBitmapForEnemy(enemy) {
    if (!enemy?.weaponFile) return null;
    if (!modularRoster.weaponBitmaps.has(enemy.weaponFile)) {
      modularRoster.weaponBitmaps.set(enemy.weaponFile, loadBitmap(enemy.weaponFile));
    }
    return modularRoster.weaponBitmaps.get(enemy.weaponFile);
  }

  function weaponEntryForCurrentKatana() {
    const selectedId = KATANA_IDS[game.weaponIndex];
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

  function equipRosterEntry(enemy, entry, weaponIndex) {
    if (!entry) return;
    enemy.modularEntry = entry;
    enemy.impactMaterial = impactMaterialForEntry(entry, enemy);
    const modularWeapons = modularRoster.weapons.filter((weapon) =>
      String(weapon.file || "").startsWith("assets/modular/weapons/"),
    );
    const requestedWeapon = modularWeapons.find((weapon) =>
      weapon.id === entry.weaponId || weapon.id === entry.weapon,
    );
    const fallbackWeapon = modularWeapons.length
      ? modularWeapons[Math.abs(weaponIndex) % modularWeapons.length]
      : null;
    enemy.weaponAsset = requestedWeapon || fallbackWeapon || null;
    enemy.weaponFile = enemy.weaponAsset?.file || null;
  }

  function applyRosterToGame(state) {
    if (!modularRoster.ready || !state) return;
    const regular = getRosterCategory("regular");
    const special = getRosterCategory("special");
    const miniboss = getRosterCategory("miniboss");
    const bosses = getRosterCategory("boss");
    const giants = getRosterCategory("giant");
    const sidePool = [...regular, ...special];
    if (sidePool.length) {
      state.side.enemies.forEach((enemy, index) => {
        const rosterIndex = state.chapter * state.side.enemies.length + index;
        equipRosterEntry(enemy, sidePool[rosterIndex % sidePool.length], rosterIndex);
      });
    }
    state.fps.missions.forEach((mission, missionIndex) => {
      const combatPool = missionIndex === 0 ? special : [...special.slice(10), ...miniboss];
      let combatIndex = 0;
      mission.enemies.forEach((enemy) => {
        if (enemy.boss) {
          // Les géants restent réservés aux futures arènes extérieures : dans
          // ce donjon étroit leur hauteur dépassait trois murs et leur
          // collision restait celle d'un zombie ordinaire.
          const bossPool = bosses.length ? bosses : giants;
          if (bossPool.length) {
            equipRosterEntry(enemy, bossPool[missionIndex % bossPool.length], 40 + missionIndex);
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
      const response = await fetch("assets/modular/registry.json?v=20260717-5", { cache: "no-store" });
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
    pause: document.getElementById("pause-screen"),
    end: document.getElementById("end-screen"),
    startButton: document.getElementById("start-button"),
    health: document.getElementById("hud-health"),
    healthText: document.getElementById("hud-health-text"),
    stamina: document.getElementById("hud-stamina"),
    staminaText: document.getElementById("hud-stamina-text"),
    ammo: document.getElementById("hud-ammo"),
    seals: document.getElementById("hud-seals"),
    score: document.getElementById("hud-score"),
    objective: document.getElementById("hud-objective"),
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
  };

  const input = {
    keys: new Set(),
    jumpQueued: false,
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
  ];

  const FPS_DEFS = [
    {
      start: [1.5, 1.5, 0],
      altar: [12.5, 11.5],
      enemies: [
        [4.5, 1.6], [8.5, 1.5], [3.5, 5.5], [8.5, 5.5], [12.2, 7.5], [6.5, 9.5], [11.5, 13.2],
      ],
    },
    {
      start: [1.5, 13.2, -Math.PI / 2],
      altar: [12.5, 11.5],
      enemies: [
        [3.5, 11.5], [5.5, 7.5], [11.5, 7.5], [6.5, 3.5], [12.3, 1.6],
      ],
      boss: [9.5, 11.5],
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

  let game = createGameState();
  let lastTime = performance.now();
  let rafId = 0;

  function createGameState() {
    return {
      status: "title",
      mode: "side",
      chapter: 0,
      health: 100,
      stamina: 100,
      ammo: 8,
      seals: 0,
      kills: 0,
      score: 0,
      startedAt: 0,
      elapsed: 0,
      invulnerable: 0,
      hurtTimer: 0,
      deathTimer: 0,
      attackTimer: 0,
      attackCooldown: 0,
      attackHitApplied: false,
      playerStagger: 0,
      shake: 0,
      hitStop: 0,
      hitConfirm: 0,
      hitConfirmMaterial: "flesh",
      hitConfirmPoint: { x: W / 2, y: H / 2 },
      transition: 0,
      transitionLabel: "",
      weaponIndex: 0,
      side: makeSideState(),
      fps: {
        current: 0,
        missions: FPS_DEFS.map((_, index) => makeFpsMission(index)),
        zBuffer: new Array(320).fill(20),
      },
    };
  }

  function makeSideEnemies(chapter) {
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
    const rules = SIDE_CHAPTER_RULES[chapter] || SIDE_CHAPTER_RULES[0];
    return rules.pickups.map((pickup) => ({
      x: pickup.x,
      y: SIDE_GROUND_Y - 34,
      kind: pickup.kind,
      taken: false,
    }));
  }

  function makeSideState() {
    return {
      width: 2500,
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
      },
      enemies: makeSideEnemies(0),
      projectiles: [],
      particles: [],
      pickups: makeSidePickups(0),
    };
  }

  function prepareSideChapter(chapter) {
    game.side.enemies = makeSideEnemies(chapter);
    game.side.pickups = makeSidePickups(chapter);
    game.side.projectiles.length = 0;
    game.side.particles.length = 0;
  }

  function makeFpsMission(index) {
    const def = FPS_DEFS[index];
    const formationCount = def.enemies.length + (def.boss ? 1 : 0);
    const formationPhase = index * Math.PI / 7;
    const enemies = def.enemies.map((entry, i) => ({
      x: entry[0], y: entry[1], hp: 4, maxHp: 4, dead: false, dying: false,
      attack: 0, attackDuration: 0.68, attackCooldown: i * 0.12, attackHitApplied: false,
      hurtTimer: 0, deathTimer: 0, knockbackX: 0, knockbackY: 0,
      flash: 0, boss: false, impactMaterial: "flesh",
      spriteIndex: i % 5,
      engagementSlot: i,
      engagementAngle: formationPhase + i * Math.PI * 2 / formationCount,
    }));
    if (def.boss) {
      enemies.push({
        x: def.boss[0], y: def.boss[1], hp: 18, maxHp: 18, dead: false, dying: false,
        attack: 0, attackDuration: 0.92, attackCooldown: 0.4, attackHitApplied: false,
        hurtTimer: 0, deathTimer: 0, knockbackX: 0, knockbackY: 0,
        flash: 0, boss: true, spriteIndex: 5, impactMaterial: "armor",
        engagementSlot: enemies.length,
        engagementAngle: formationPhase + enemies.length * Math.PI * 2 / formationCount,
      });
    }
    return {
      map: MAPS[index],
      player: { x: def.start[0], y: def.start[1], angle: def.start[2] },
      altar: { x: def.altar[0], y: def.altar[1] },
      enemies,
      particles: [],
      purified: false,
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
    return game.chapter === 0 ? 0 : 2;
  }

  function currentSideRules() {
    return SIDE_CHAPTER_RULES[game.chapter] || SIDE_CHAPTER_RULES[0];
  }

  function currentSidePlatforms() {
    return SIDE_PLATFORM_LAYOUTS[game.chapter] || SIDE_PLATFORM_LAYOUTS[0];
  }

  function currentSideSurfaces() {
    return [
      ...currentSidePlatforms(),
      { x: 0, y: SIDE_GROUND_Y, w: game.side.width, h: SIDE_GROUND_DEPTH, ground: true },
    ].sort((a, b) => a.y - b.y);
  }

  function currentSideEntrance() {
    return SIDE_ENTRANCES[game.chapter] || SIDE_ENTRANCES[0];
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

  function showOnly(screen) {
    [dom.title, dom.briefing, dom.pause, dom.end].forEach((el) => el.classList.toggle("active", el === screen));
  }

  function showBriefing() {
    showOnly(dom.briefing);
    game.status = "briefing";
    document.body.dataset.state = "briefing";
  }

  async function startGame() {
    game = createGameState();
    applyRosterToGame(game);
    game.status = "playing";
    game.startedAt = performance.now();
    document.body.dataset.state = "playing";
    showOnly(null);
    canvas.focus();
    if (window.gameAudio?.begin) {
      try { await window.gameAudio.begin(); } catch (_) { /* Autorisation navigateur facultative. */ }
    }
    announce("KUROKAWA — LE VILLAGE DES CENDRES");
    updateHud();
  }

  function restartGame() {
    document.exitPointerLock?.();
    startGame();
  }

  function returnToTitle() {
    document.exitPointerLock?.();
    game.status = "title";
    document.body.dataset.state = "title";
    showOnly(dom.title);
  }

  function togglePause() {
    if (game.status === "playing") {
      game.status = "paused";
      document.body.dataset.state = "paused";
      dom.pause.classList.add("active");
      document.exitPointerLock?.();
    } else if (game.status === "paused") {
      game.status = "playing";
      document.body.dataset.state = "playing";
      dom.pause.classList.remove("active");
      lastTime = performance.now();
      canvas.focus();
    }
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
    game.hurtTimer = Math.max(0, game.hurtTimer - dt);
    game.playerStagger = Math.max(0, game.playerStagger - dt);
    game.hitConfirm = Math.max(0, game.hitConfirm - dt);
    const previousAttackTimer = game.attackTimer;
    game.attackTimer = Math.max(0, game.attackTimer - dt);
    game.attackCooldown = Math.max(0, game.attackCooldown - dt);
    game.shake = Math.max(0, game.shake - dt * 22);
    game.transition = Math.max(0, game.transition - dt);
    if (game.hitStop > 0) {
      game.hitStop -= dt;
      return;
    }

    if (
      previousAttackTimer > 0
      && !game.attackHitApplied
      && 1 - game.attackTimer / PLAYER_ATTACK_DURATION >= PLAYER_ATTACK_ACTIVE_AT
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
    const controlsLocked = game.transition > 0.05 || game.playerStagger > 0;
    const sprint = !controlsLocked && key("Shift") && game.stamina > 1 && (left || right);
    const speed = sprint ? 178 : 112;
    const dir = controlsLocked ? 0 : (right ? 1 : 0) - (left ? 1 : 0);

    if (sprint) game.stamina = Math.max(0, game.stamina - 28 * dt);
    else game.stamina = Math.min(100, game.stamina + 19 * dt);

    p.vx = approach(
      p.vx,
      dir * speed,
      (game.playerStagger > 0 ? 240 : (dir ? 760 : 980)) * dt,
    );
    if (dir) p.facing = dir;
    if (!controlsLocked && input.jumpQueued && p.grounded) {
      p.vy = -235;
      p.grounded = false;
    }
    input.jumpQueued = false;

    // Les portes restent des déclencheurs manuels, jamais des murs invisibles :
    // Akio peut traverser leur plan 2D et continuer à explorer derrière.
    const chapterRules = currentSideRules();
    p.x = clamp(
      p.x + p.vx * dt,
      chapterRules.minX,
      Math.min(chapterRules.maxX, side.width - p.w - 6),
    );
    const entrance = currentSideEntrance();
    if (entrance.collision === "solidDoor" && p.x > entrance.blockX) {
      p.x = entrance.blockX;
      if (p.vx > 0) p.vx = 0;
    }
    const previousBottom = p.y + p.h;
    p.vy += 590 * dt;
    p.y += p.vy * dt;
    p.grounded = false;

    // Les surfaces sont triées du haut vers le bas afin qu'un grand pas de
    // simulation ne traverse pas une plateforme pour finir sur le sol.
    for (const platform of currentSideSurfaces()) {
      const overlapsX = p.x + p.w > platform.x && p.x < platform.x + platform.w;
      const crossedTop = previousBottom <= platform.y + 3 && p.y + p.h >= platform.y;
      if (p.vy >= 0 && overlapsX && crossedTop) {
        p.y = platform.y - p.h;
        p.vy = 0;
        p.grounded = true;
        break;
      }
    }
    if (p.y > H + 30) damagePlayer(100);

    updateSideEnemies(dt);
    updateSideProjectiles(dt);
    updateSidePickups();
    updateParticles(side.particles, dt);
    side.cameraX = clamp(
      approach(side.cameraX, p.x - W * 0.32, 520 * dt),
      chapterRules.cameraMinX,
      side.width - W,
    );
  }

  function sideEnemyCombatProfile(enemy) {
    const elite = enemy.maxHp >= 3;
    return {
      speed: elite ? 22 : 29,
      damage: elite ? 16 : 11,
      attackDuration: elite ? 0.64 : 0.56,
      activeAt: elite ? 0.54 : 0.48,
      recovery: elite ? 0.68 : 0.82,
      reach: elite ? 22 : 18,
    };
  }

  function canOccupySideEnemy(enemy, candidateX) {
    const rules = currentSideRules();
    if (candidateX < rules.minX || candidateX + enemy.w > rules.maxX) return false;
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

  function updateSideEnemies(dt) {
    const p = game.side.player;
    for (const enemy of game.side.enemies) {
      if (enemy.dead) continue;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.hurtTimer = Math.max(0, enemy.hurtTimer - dt);
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
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

      const profile = sideEnemyCombatProfile(enemy);
      if (enemy.attack > 0) {
        enemy.attack = Math.max(0, enemy.attack - dt);
        const progress = 1 - enemy.attack / enemy.attackDuration;
        if (!enemy.attackHitApplied && progress >= profile.activeAt) {
          enemy.attackHitApplied = true;
          const dx = p.x + p.w / 2 - (enemy.x + enemy.w / 2);
          if (Math.abs(dx) <= profile.reach + 6 && Math.abs(p.y - enemy.y) < 55) {
            const damaged = damagePlayer(profile.damage, {
              mode: "side",
              direction: Math.sign(dx) || enemy.facing,
            });
            if (damaged) playAudio("playZombie");
          }
        }
        continue;
      }

      const dx = p.x - enemy.x;
      if (Math.abs(dx) < 190 && Math.abs(p.y - enemy.y) < 55) {
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

  function updateSideProjectiles(dt) {
    const side = game.side;
    for (const projectile of side.projectiles) {
      projectile.x += projectile.vx * dt;
      projectile.life -= dt;
      for (const enemy of side.enemies) {
        if (!isEnemyAlive(enemy) || projectile.dead) continue;
        if (Math.abs(projectile.x - (enemy.x + enemy.w / 2)) < 13 && Math.abs(projectile.y - (enemy.y + 10)) < 19) {
          projectile.dead = true;
          hitEnemy(enemy, 3, "side");
        }
      }
    }
    side.projectiles = side.projectiles.filter((p) => p.life > 0 && !p.dead);
  }

  function updateSidePickups() {
    const p = game.side.player;
    for (const item of game.side.pickups) {
      if (!item.taken && Math.abs(item.x - (p.x + p.w / 2)) < 20 && Math.abs(item.y - p.y) < 36) {
        item.taken = true;
        if (item.kind === "ammo") game.ammo = Math.min(12, game.ammo + 4);
        else game.health = Math.min(100, game.health + 28);
        game.score += 100;
        playAudio("playPickup");
        announce(item.kind === "ammo" ? "OFUDA CONSACRÉS +4" : "DÉCOCTION DE YOMOGI +28");
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
    const sprint = key("Shift") && game.stamina > 1 && (forward || strafe);
    const speed = (sprint ? 3.55 : 2.25) * dt;

    p.angle = normalizeAngle(p.angle + turning * 1.9 * dt);
    if (sprint) game.stamina = Math.max(0, game.stamina - 30 * dt);
    else game.stamina = Math.min(100, game.stamina + 17 * dt);

    const mx = Math.cos(p.angle) * forward * speed + Math.cos(p.angle + Math.PI / 2) * strafe * speed;
    const my = Math.sin(p.angle) * forward * speed + Math.sin(p.angle + Math.PI / 2) * strafe * speed;
    moveFpsPlayer(mission, mx, my);
    // La courte transition sert de sas visuel : aucun ennemi ne peut frapper
    // avant que le joueur ait réellement récupéré le contrôle de la caméra.
    if (game.transition <= 0.05) updateFpsEnemies(mission, dt);
    updateParticles(mission.particles, dt);
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
    if (enemy?.modularEntry?.category === "giant") return 0.56;
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
    const radius = profile.reach * 0.92;
    const x = mission.player.x + Math.cos(angle) * radius;
    const y = mission.player.y + Math.sin(angle) * radius;
    const enemyRadius = fpsEnemyRadius(enemy);
    if (!isWalkable(mission.map, x, y, enemyRadius)) return null;
    return { x, y };
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
    if (enemy.boss) {
      return {
        speed: 0.7,
        damage: 19,
        attackDuration: 0.92,
        activeAt: 0.58,
        recovery: 0.72,
        reach: 0.96,
      };
    }
    return {
      speed: 0.92,
      damage: 10,
      attackDuration: 0.68,
      activeAt: 0.5,
      recovery: 0.86,
      reach: 0.72,
    };
  }

  function updateFpsEnemies(mission, dt) {
    const p = mission.player;
    for (const enemy of mission.enemies) {
      if (enemy.dead) continue;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.hurtTimer = Math.max(0, enemy.hurtTimer - dt);
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      enemy.knockbackX = approach(enemy.knockbackX, 0, 2.8 * dt);
      enemy.knockbackY = approach(enemy.knockbackY, 0, 2.8 * dt);
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

      const profile = fpsEnemyCombatProfile(enemy);
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

  function lineOfSight(mission, x1, y1, x2, y2) {
    const distance = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(distance / 0.12);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (!isWalkable(mission.map, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
    }
    return true;
  }

  function performAttack() {
    if (
      game.status !== "playing"
      || game.attackCooldown > 0
      || game.transition > 0.05
      || game.playerStagger > 0
    ) return;
    game.attackCooldown = 0.4;
    game.attackTimer = PLAYER_ATTACK_DURATION;
    game.attackHitApplied = false;
    playAudio("playKatana");
  }

  function resolvePlayerAttack() {
    if (game.attackHitApplied || game.status !== "playing") return;
    game.attackHitApplied = true;
    if (game.mode === "side") {
      const p = game.side.player;
      const targets = game.side.enemies
        .filter((e) => isEnemyAlive(e) && Math.abs((e.x + e.w / 2) - (p.x + p.w / 2)) < 47 && Math.abs(e.y - p.y) < 42)
        .filter((e) => Math.sign(e.x - p.x) === p.facing || Math.abs(e.x - p.x) < 16)
        .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x));
      targets.slice(0, 2).forEach((enemy) => hitEnemy(enemy, 2, {
        mode: "side",
        direction: p.facing,
      }));
    } else {
      const mission = currentMission();
      const target = nearestFpsTarget(mission, 1.65, 0.48);
      if (target) hitEnemy(target, target.boss ? 2 : 3, { mode: "fps" });
    }
  }

  function performRanged() {
    if (
      game.status !== "playing"
      || game.attackCooldown > 0
      || game.transition > 0.05
      || game.playerStagger > 0
      || game.ammo <= 0
    ) {
      if (game.ammo <= 0) announce("PLUS D'OFUDA");
      return;
    }
    game.ammo -= 1;
    game.attackCooldown = 0.5;
    playAudio("playShot");
    if (game.mode === "side") {
      const p = game.side.player;
      game.side.projectiles.push({ x: p.x + p.w / 2 + p.facing * 10, y: p.y + 9, vx: p.facing * 330, life: 1.8, dead: false });
    } else {
      const mission = currentMission();
      const target = nearestFpsTarget(mission, 12, 0.15);
      if (target) hitEnemy(target, target.boss ? 3 : 4, { mode: "fps", ranged: true });
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
    const giantBoss = enemy.modularEntry?.category === "giant";
    const worldHeight = giantBoss ? 1.7 : (enemy.boss ? 1.28 : 0.92);
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
    enemy.flash = material === "armor" ? 0.2 : 0.15;
    enemy.hurtTimer = ENEMY_HURT_DURATION;
    enemy.attack = 0;
    enemy.attackHitApplied = false;
    game.shake = Math.max(game.shake, material === "armor" ? 4.8 : 3.8);
    game.hitStop = material === "armor" ? 0.055 : 0.042;
    game.score += 25;
    playAudio("playImpact", material);
    spawnImpactParticles(enemy, material, mode);
    if (mode === "side") {
      const direction = normalized.direction || Math.sign(enemy.x - game.side.player.x) || 1;
      enemy.knockbackVx = direction * (material === "armor" ? 75 : 125);
    } else {
      const p = currentMission().player;
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const length = Math.max(0.01, Math.hypot(dx, dy));
      const force = material === "armor" ? 0.7 : 1.15;
      enemy.knockbackX = dx / length * force;
      enemy.knockbackY = dy / length * force;
    }
    if (enemy.hp <= 0) {
      enemy.dying = true;
      enemy.deathTimer = ENEMY_DEATH_DURATION;
      enemy.hurtTimer = 0;
      enemy.attack = 0;
      game.kills += 1;
      game.score += enemy.boss ? 1500 : 180;
      if (enemy.boss) {
        const bossName = String(enemy.modularEntry?.name || "LE DAIMYŌ").toUpperCase();
        announce(`${bossName} TOMBE — PURIFIEZ L'AUTEL`);
      }
    }
    return true;
  }

  function damagePlayer(amount, source = {}) {
    if (game.invulnerable > 0 || game.status !== "playing") return false;
    game.health = Math.max(0, game.health - amount);
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

  function interact() {
    if (game.status !== "playing") return;
    if (game.mode === "side") {
      const entrance = currentSideEntrance();
      if (isNearSideEntrance()) {
        enterFps(entrance.mission, false);
      } else {
        announce("APPROCHEZ-VOUS DE L'ENTRÉE");
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
    if (!mission.purified) {
      mission.purified = true;
      game.seals += 1;
      game.score += 1000;
      playAudio("playPickup");
      if (game.fps.current === 0) {
        game.chapter = 1;
        prepareSideChapter(1);
        applyRosterToGame(game);
        game.ammo = Math.min(12, game.ammo + 3);
        game.health = Math.min(100, game.health + 18);
        Object.assign(game.side.player, {
          x: 1045,
          y: SIDE_GROUND_Y - game.side.player.h,
          vx: 0,
          vy: 0,
          facing: 1,
          grounded: true,
        });
        returnToSide(true);
        announce("PREMIER SCEAU POSÉ — LE DONJON VOUS ATTEND");
      } else {
        finishGame(true);
      }
    }
  }

  function switchMode() {
    if (game.status !== "playing" || game.transition > 0.25) return;
    if (game.mode === "side") {
      if (isNearSideEntrance()) interact();
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
    input.keys.clear();
    game.side.player.vx = 0;
    game.side.player.vy = 0;
    game.fps.current = clamp(index, 0, 1);
    game.mode = "fps";
    game.invulnerable = Math.max(game.invulnerable, 2.2);
    game.transition = 0.85;
    game.transitionLabel = automatic ? "LE VOILE DE YOMI SE DÉCHIRE" : "REGARD DE L'OMBRE";
    document.body.classList.add("fps-mode");
    playAudio("playTransition", "fps");
    announce(game.fps.current === 0 ? "SANCTUAIRE CONTAMINÉ — PURIFIEZ LE FOYER" : "DONJON DE KUROKAWA — TUEZ LE DAIMYŌ");
    if (canvas.requestPointerLock && matchMedia("(pointer: fine)").matches) {
      canvas.requestPointerLock()?.catch?.(() => {});
    }
  }

  function returnToSide(automatic) {
    input.keys.clear();
    game.mode = "side";
    game.invulnerable = Math.max(game.invulnerable, 1);
    game.side.player.vx = 0;
    game.side.player.vy = 0;
    game.transition = 0.85;
    game.transitionLabel = automatic ? "LE MONDE DES VIVANTS VOUS RAPPELLE" : "PAS DE CÔTÉ";
    document.body.classList.remove("fps-mode");
    document.exitPointerLock?.();
    playAudio("playTransition", "2d");
  }

  function finishGame(victory) {
    game.status = "ended";
    document.body.dataset.state = "ended";
    document.exitPointerLock?.();
    dom.end.classList.add("active");
    const minutes = Math.floor(game.elapsed / 60);
    const seconds = Math.floor(game.elapsed % 60).toString().padStart(2, "0");
    const rank = victory ? (game.health >= 75 && game.elapsed < 360 ? "S" : game.health >= 40 ? "A" : "B") : "—";
    dom.endGlyph.textContent = victory ? "勝" : "滅";
    dom.endKicker.textContent = victory ? "MISSION ACCOMPLIE" : "LE SANG RETOURNE À LA TERRE";
    dom.endTitle.textContent = victory ? "L'AUBE REVIENT SUR KUROKAWA" : "L'OMBRE VOUS A DÉVORÉ";
    dom.endMessage.textContent = victory ? "Les morts reposent. Pour cette nuit." : "Le shogun attendra un samouraï qui ne reviendra jamais.";
    dom.endKills.textContent = game.kills;
    dom.endTime.textContent = `${minutes.toString().padStart(2, "0")}:${seconds}`;
    dom.endRank.textContent = rank;
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
    const shakeX = game.shake ? Math.round((Math.random() - 0.5) * game.shake) : 0;
    const shakeY = game.shake ? Math.round((Math.random() - 0.5) * game.shake) : 0;
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
    for (const platform of currentSidePlatforms()) drawPlatform(platform);
    for (const item of side.pickups) if (!item.taken) drawPickup(item);
    for (const projectile of side.projectiles) drawOfuda(projectile.x, projectile.y, Math.sign(projectile.vx));
    for (const enemy of side.enemies) if (isEnemyVisible(enemy)) drawZombie2d(enemy);
    drawSamurai2d(side.player);
    drawModularWorldProps("front");
    drawWorldParticles(side.particles);
    ctx.restore();

    drawSideEntrancePrompt(cam);
    drawHitConfirm(cam);
    const gateX = currentSideEntrance().x;
    const sx = gateX - cam;
    if (sx > 20 && sx < W - 20 && !isNearSideEntrance()) {
      ctx.fillStyle = "#f0d9a4";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("▼ OBJECTIF", sx, 94 + Math.sin(performance.now() / 180) * 3);
    }
  }

  function drawSideEntranceWorld() {
    const entrance = currentSideEntrance();
    const image = bitmapAssets.sideEntrances[game.chapter];
    const width = game.chapter === 0 ? 166 : 214;
    const near = isNearSideEntrance(1.18);
    ctx.save();
    if (near) {
      ctx.shadowColor = game.chapter === 0
        ? "rgba(121, 215, 158, .8)"
        : "rgba(222, 174, 93, .78)";
      ctx.shadowBlur = 14;
    }
    if (!drawGroundedWorldSprite(image, entrance.x - width / 2, SIDE_GROUND_Y, width)) {
      drawTorii(entrance.x, game.chapter === 0 ? 185 : 174, game.chapter !== 0);
    }
    ctx.restore();
  }

  function drawSideEntrancePrompt(cam) {
    if (!isNearSideEntrance()) return;
    const entrance = currentSideEntrance();
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
    ctx.fillText(entrance.label, screenX, panelY + 14);
    ctx.fillStyle = "#fff0b5";
    ctx.font = "bold 10px monospace";
    ctx.fillText(entrance.prompt, screenX, panelY + 28);
  }

  function drawSideBackdrop(cam) {
    const environmentIndex = currentSideEnvironmentIndex();
    const parallax = bitmapAssets.parallaxBackgrounds[environmentIndex];
    if (parallax && bitmapReady(parallax.sky)) {
      drawParallaxLayer(parallax.sky, cam, 0);
      drawParallaxLayer(parallax.far, cam, 0.035);
      drawParallaxLayer(
        parallax.mid,
        cam,
        0.09,
        SIDE_MIDGROUND_SOURCE_Y[environmentIndex],
      );
      drawParallaxLayer(parallax.near, cam, 0.16);
      ctx.fillStyle = "rgba(4, 6, 11, .12)";
      ctx.fillRect(0, 0, W, H);
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

  function drawParallaxLayer(image, cam, factor, sourceGroundY = null) {
    if (!bitmapReady(image)) return;
    const scale = H / image.naturalHeight;
    const drawY = Number.isFinite(sourceGroundY)
      ? Math.round(SIDE_GROUND_Y - sourceGroundY * scale)
      : 0;
    if (factor === 0) {
      ctx.drawImage(image, 0, drawY, W, H);
      return;
    }
    const drawWidth = Math.max(W, image.naturalWidth * scale);
    const offset = -((cam * factor) % drawWidth);
    for (let x = offset - drawWidth; x < W + drawWidth; x += drawWidth) {
      ctx.drawImage(image, Math.round(x), drawY, Math.ceil(drawWidth), H);
    }
  }

  const opaqueBoundsCache = new WeakMap();

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

  function drawOpaqueBitmap(image, x, y, width, height) {
    const bounds = opaqueBoundsForImage(image);
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
    const bounds = opaqueBoundsForImage(image);
    if (!bounds) return false;
    const visibleHeight = Math.max(1, visibleWidth * bounds.h / bounds.w);
    drawOpaqueBitmap(image, x, groundY - visibleHeight, visibleWidth, visibleHeight);
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
    const bounds = opaqueBoundsForImage(image);
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

  function drawModularWorldProps(layer = "back") {
    const props = bitmapAssets.worldProps[currentSideEnvironmentIndex()] || [];
    let drawn = false;
    for (const prop of props) {
      if ((prop.layer || "back") !== layer) continue;
      if (!bitmapReady(prop.image)) continue;
      const bottomY = prop.bottomY ?? SIDE_GROUND_Y;
      drawGroundedWorldSprite(prop.image, prop.x, bottomY, prop.width);
      drawn = true;
    }
    return drawn;
  }

  function hasModularChapterProps() {
    return (bitmapAssets.worldProps[currentSideEnvironmentIndex()] || [])
      .some((prop) => bitmapReady(prop.image));
  }

  function drawVillage(side) {
    const environmentIndex = currentSideEnvironmentIndex();
    const hasGeneratedBackdrop = bitmapReady(bitmapAssets.parallaxBackgrounds[environmentIndex]?.sky)
      || bitmapReady(bitmapAssets.sideBackgrounds[environmentIndex]);
    const tiles = bitmapAssets.platformTiles[environmentIndex];
    const hasBackProps = drawModularWorldProps("back");
    ctx.fillStyle = hasGeneratedBackdrop ? "rgba(16, 14, 19, .72)" : "#161219";
    ctx.fillRect(0, SIDE_GROUND_Y, side.width, SIDE_GROUND_DEPTH);
    if (!drawContinuousGroundSprite(
      tiles?.ground,
      0,
      SIDE_GROUND_Y,
      side.width,
      SIDE_GROUND_DEPTH,
    )) {
      ctx.fillStyle = hasGeneratedBackdrop ? "rgba(72, 49, 40, .78)" : "#2a2020";
      ctx.fillRect(0, SIDE_GROUND_Y, side.width, 7);
      ctx.fillStyle = "#42302a";
      for (let x = 0; x < side.width; x += 18) {
        ctx.fillRect(x, SIDE_GROUND_Y + 7 + (x % 3), 11, 3);
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
    const tile = bitmapAssets.platformTiles[currentSideEnvironmentIndex()]?.ledge;
    const visualHeight = p.visualHeight || Math.max(18, p.h);
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
    const text = `${weaponAsset.id || ""} ${weaponAsset.name || ""} ${weaponAsset.file || ""}`.toLowerCase();
    if (/bouclier|plaque|carapace|joug/.test(text)) return "guard";
    if (/yari|naginata|shakujo|spear|lance|bambou/.test(text)) return "pole";
    if (/otsuchi|maillet|belier|masse|marteau|taiko/.test(text)) return "heavy";
    if (/tanto|jitte|hachiwari|tessen|wakizashi/.test(text)) return "short";
    if (/chaine|fleau|menotte|ancre/.test(text)) return "chain";
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
    ctx.drawImage(
      image,
      sx,
      sy,
      sw,
      sh,
      -drawWidth * anchor[0],
      -drawHeight * anchor[1],
      drawWidth,
      drawHeight,
    );
  }

  function drawEnemyWeapon(enemy, animation, spriteSize, fps = false) {
    const weapon = weaponBitmapForEnemy(enemy);
    if (!bitmapReady(weapon)) return;
    const context = fps ? "fps" : "side";
    const mount = WEAPON_MOUNTS[context][animation] || WEAPON_MOUNTS[context].idle;
    const kind = weaponKind(enemy.weaponAsset);
    const maxDimension = spriteSize * mount.scale * weaponScaleForKind(kind);
    const anchor = Array.isArray(enemy.weaponAsset?.anchor)
      ? enemy.weaponAsset.anchor
      : [0.16, 0.5];
    const attacking = animation === "attack";
    const attackPhase = attacking
      ? clamp(1 - enemy.attack / Math.max(0.01, enemy.attackDuration || 0.68), 0, 1)
      : 0;
    ctx.save();
    ctx.translate(spriteSize * mount.x, spriteSize * mount.y);
    const defaultRotation = Number.isFinite(enemy.weaponAsset?.defaultRotation)
      ? enemy.weaponAsset.defaultRotation * Math.PI / 180
      : 0;
    ctx.rotate(defaultRotation + mount.rotation + (attacking ? attackPhase * mount.arc : 0));
    if (kind === "guard") ctx.scale(0.82, 1.05);
    drawWeaponImage(weapon, {
      anchor,
      maxDimension,
      widthBias: kind === "pole" ? 1.08 : 1,
    });
    ctx.restore();
  }

  function drawPlayerWeapon(animation, frame) {
    const equippedWeapon = bitmapAssets.weapons[game.weaponIndex];
    if (!bitmapReady(equippedWeapon)) return;
    const meta = KATANA_WEAPON_META[game.weaponIndex] || KATANA_WEAPON_META[0];
    const mount = SIDE_PLAYER_WEAPON_MOUNTS[animation]?.[frame]
      || SIDE_PLAYER_WEAPON_MOUNTS.idle[0];
    const [mountX, mountY, rotation, scale] = mount;
    ctx.save();
    ctx.translate(mountX, mountY);
    ctx.rotate(rotation + (animation === "idle" ? meta.sideRotation * 0.08 : 0));
    drawWeaponImage(equippedWeapon, {
      anchor: meta.anchor,
      maxDimension: 54 * scale,
      widthBias: 1.08,
    });
    ctx.restore();
  }

  function drawProceduralHeldWeapon(attacking) {
    ctx.save();
    ctx.translate(attacking ? 6 : -7, attacking ? 13 : 19);
    const progress = attacking ? clamp(1 - game.attackTimer / PLAYER_ATTACK_DURATION, 0, 1) : 0;
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
      const progress = clamp(1 - game.attackTimer / PLAYER_ATTACK_DURATION, 0, 0.999);
      return { animation: "attack", frame: Math.min(5, Math.floor(progress * 6)), moving: false };
    }
    const animation = moving ? "move" : "idle";
    return {
      animation,
      frame: Math.floor(performance.now() / (moving ? 95 : 165)) % 6,
      moving,
    };
  }

  function drawFpsWeaponSprite(image, animation, frame) {
    if (!bitmapReady(image)) return false;
    const mount = FPS_PLAYER_WEAPON_MOUNTS[animation]?.[frame]
      || FPS_PLAYER_WEAPON_MOUNTS.idle[0];
    const [mountX, mountY, rotation, scale, alpha] = mount;
    if (alpha <= 0) return true;
    const drawWidth = Math.round(260 * scale);
    const drawHeight = Math.max(1, Math.round(drawWidth * image.naturalHeight / image.naturalWidth));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(
      Math.round(FPS_VIEWMODEL_RECT.x + FPS_VIEWMODEL_RECT.width * mountX),
      Math.round(FPS_VIEWMODEL_RECT.y + FPS_VIEWMODEL_RECT.height * mountY),
    );
    ctx.rotate(rotation);
    ctx.drawImage(
      image,
      Math.round(-drawWidth * 0.26),
      Math.round(-drawHeight * 0.52),
      drawWidth,
      drawHeight,
    );
    ctx.restore();
    return true;
  }

  function drawFpsSelectedWeapon() {
    const pose = fpsPlayerPose();
    const selectedFpsWeapon = bitmapAssets.fpsPlayerWeapons[game.weaponIndex];
    if (
      modularAnimationReady(bitmapAssets.akioFpsBody, pose.animation)
      && bitmapReady(selectedFpsWeapon)
    ) {
      drawFpsWeaponSprite(
        selectedFpsWeapon,
        pose.animation,
        pose.frame,
      );
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

    // Compatibilité avec les anciens registres pendant le chargement.
    const fpsWeapon = fpsWeaponSetForWeapon(weaponEntryForCurrentKatana());
    const { animation, frame } = pose;
    if (modularAnimationReady(fpsWeapon, animation)) {
      drawAnimationSprite(fpsWeapon, animation, frame, 80, 40, 480, 320);
      return true;
    }

    const equippedWeapon = bitmapAssets.weapons[game.weaponIndex];
    if (!bitmapReady(equippedWeapon)) return false;
    const meta = KATANA_WEAPON_META[game.weaponIndex] || KATANA_WEAPON_META[0];
    const progress = game.attackTimer > 0
      ? clamp(1 - game.attackTimer / PLAYER_ATTACK_DURATION, 0, 1)
      : 0;
    const swing = Math.sin(progress * Math.PI);
    ctx.save();
    ctx.translate(W * (0.76 - swing * 0.12), H * (0.87 - swing * 0.08));
    ctx.rotate(meta.fpsRotation - swing * 0.82 + progress * 0.24);
    drawWeaponImage(equippedWeapon, {
      anchor: meta.anchor,
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
          1 - game.attackTimer / PLAYER_ATTACK_DURATION,
          0,
          0.999,
        ) * 6));
      } else {
        frame = Math.floor(performance.now() / (moving ? 95 : 165)) % 6;
      }
      ctx.save();
      ctx.translate(x + p.w / 2, y + p.h);
      ctx.scale(flip, 1);
      if (game.invulnerable > 0 && Math.floor(game.invulnerable * 18) % 2) ctx.globalAlpha = 0.35;
      // L'arme est rendue derrière les bras : la tsuka reste interchangeable
      // tout en paraissant réellement tenue par les mains d'Akio.
      if (animation !== "death") drawPlayerWeapon(animation, frame);
      drawAnimationSprite(bitmapAssets.akioModular, animation, frame, -48, -80, 96, 80);
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
    const distanceToPlayer = Math.abs(game.side.player.x - e.x);
    const dying = Boolean(e.dying || e.hp <= 0);
    const moving = distanceToPlayer < 190 && distanceToPlayer > 18;
    const animation = dying
      ? "death"
      : (e.hurtTimer > 0 || e.flash > 0
        ? "hurt"
        : (e.attack > 0 ? "attack" : (moving ? "move" : "idle")));
    if (modularAnimationReady(modularEnemy, animation)) {
      const elite = spriteIndex === 4;
      const size = elite ? 76 : 66;
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
      ctx.save();
      ctx.translate(x + e.w / 2, y + e.h + SIDE_ENEMY_BASELINE_OFFSET);
      // Les masters ennemis regardent vers la gauche, contrairement à Akio.
      ctx.scale(e.facing < 0 ? 1 : -1, 1);
      if (e.flash > 0) ctx.filter = "brightness(2.2) saturate(.2)";
      drawAnimationSprite(modularEnemy, animation, frame, -size / 2, -size, size, size);
      if (animation !== "death") drawEnemyWeapon(e, animation, size);
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
    ctx.fillStyle = item.kind === "ammo" ? "#e9dab6" : "#8ec86d";
    ctx.fillRect(item.x - 5, item.y + bob - 10, 10, 13);
    ctx.fillStyle = item.kind === "ammo" ? "#b52d34" : "#e7e1b5";
    ctx.font = "bold 8px serif"; ctx.textAlign = "center"; ctx.fillText(item.kind === "ammo" ? "札" : "+", item.x, item.y + bob);
  }

  function drawOfuda(x, y, direction) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(direction, 1);
    ctx.fillStyle = "#eee0b8"; ctx.fillRect(-5, -7, 10, 14);
    ctx.fillStyle = "#b52731"; ctx.fillRect(-1, -5, 2, 10); ctx.fillRect(-3, -1, 6, 2);
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
    return FPS_MATERIAL_SCHEMES[game.fps.current] || FPS_MATERIAL_SCHEMES[0];
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
    return corrected > 3.2 ? "move" : "idle";
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
    drawFpsWeapon();
    drawHitConfirm();
    drawCrosshair();
    drawMiniMap(mission);
  }

  function drawFpsEnemy(enemy, distance, angle) {
    const giantBoss = enemy.modularEntry?.category === "giant";
    const worldHeight = giantBoss ? 1.9 : (enemy.boss ? 1.55 : 1.14);
    const aspect = giantBoss ? 0.82 : (enemy.boss ? 0.78 : 0.76);
    const projection = projectFpsEntity(distance, angle, worldHeight, aspect);
    const left = projection.screenX - projection.width / 2;
    if (left > W || left + projection.width < 0) return;

    const spriteIndex = enemy.spriteIndex ?? (enemy.boss ? 5 : 0);
    const fpsEnemy = fpsAnimationSetForRosterEntry(enemy.modularEntry);
    const modularEnemy = fpsEnemy || animationSetForEnemy(enemy, spriteIndex);
    const animation = fpsEnemyAnimation(enemy, projection.corrected);
    const frame = fpsEnemyAnimationFrame(enemy, animation, spriteIndex);

    ctx.save();
    const clipWidth = projection.height * (giantBoss ? 1.12 : 1.04);
    const clipLeft = projection.screenX - clipWidth / 2;
    if (!clipBillboardToDepth(clipLeft, clipWidth, projection.corrected)) {
      ctx.restore();
      return;
    }

    const shadowWidth = projection.width * (giantBoss ? 0.58 : 0.42);
    ctx.fillStyle = "rgba(0, 0, 0, .48)";
    ctx.fillRect(
      Math.round(projection.screenX - shadowWidth / 2),
      Math.round(projection.groundY - Math.max(2, projection.height * 0.025)),
      Math.round(shadowWidth),
      Math.max(2, Math.round(projection.height * 0.05)),
    );

    if (enemy.flash > 0) ctx.filter = "brightness(2.25) saturate(.28)";
    if (modularAnimationReady(modularEnemy, animation)) {
      drawAnimationSprite(
        modularEnemy,
        animation,
        frame,
        Math.round(left),
        Math.round(projection.top),
        Math.round(projection.width),
        Math.round(projection.height),
      );
      if (animation !== "death" && !enemy.frontlineBlocked) {
        ctx.save();
        ctx.translate(projection.screenX, projection.groundY);
        drawEnemyWeapon(enemy, animation, projection.height, true);
        ctx.restore();
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
        Math.round(left),
        Math.round(projection.top),
        Math.round(projection.width),
        Math.round(projection.height),
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
      drawEnemyWeapon(enemy, modularAnimation, spriteSize, true);
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

    const image = bitmapAssets.fpsAltars[game.fps.current];
    const bounds = opaqueBoundsForImage(image);
    const aspect = bounds ? bounds.w / bounds.h : 0.9;
    const worldHeight = game.fps.current === 0 ? 0.72 : 1.02;
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
      ctx.shadowColor = game.fps.current === 0
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
      ? Math.sin((1 - game.attackTimer / PLAYER_ATTACK_DURATION) * Math.PI)
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
    dom.hint.textContent = game.mode === "side"
      ? (isNearSideEntrance()
        ? `${currentSideEntrance().prompt} · J katana · K ofuda`
        : "A/D avancer · ESPACE sauter · J katana · K ofuda · E entrer")
      : "W/S avancer · A/D esquiver · SOURIS tourner · J katana · K ofuda · E sceller";
    dom.objective.textContent = objectiveText();

    const mission = game.mode === "fps" ? currentMission() : null;
    const boss = mission?.enemies.find((enemy) => enemy.boss && !enemy.dead);
    dom.bossBar.hidden = !boss;
    if (boss) {
      dom.bossName.textContent = String(boss.modularEntry?.name || "LE DAIMYŌ CORROMPU").toUpperCase();
      dom.bossHealth.style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
    }
  }

  function objectiveText() {
    if (game.mode === "side") {
      return game.chapter === 0
        ? "Atteindre le torii contaminé puis appuyer sur E"
        : "Atteindre la porte du donjon puis appuyer sur E";
    }
    const mission = currentMission();
    const remaining = mission.enemies.filter((e) => !e.dead).length;
    if (remaining) return game.fps.current === 1 ? `Abattre le daimyō et ses gardes (${remaining})` : `Purifier le sanctuaire (${remaining})`;
    return "Rejoindre l'autel et appuyer sur E";
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

  function equipWeapon(idOrIndex) {
    const numeric = Number(idOrIndex);
    const index = Number.isInteger(numeric)
      ? clamp(numeric, 0, KATANA_IDS.length - 1)
      : KATANA_IDS.indexOf(String(idOrIndex));
    if (index < 0) return false;
    game.weaponIndex = index;
    announce(`ARME ÉQUIPÉE — ${KATANA_NAMES[index]}`);
    return true;
  }

  function onKeyDown(event) {
    const k = event.key;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(k) && ["playing", "paused"].includes(game.status)) event.preventDefault();
    input.keys.add(k);
    input.keys.add(k.toLowerCase());
    if (event.repeat) return;
    if (k === "Escape" || k.toLowerCase() === "p") togglePause();
    if (game.status !== "playing") return;
    if (k === " " && game.mode === "side") input.jumpQueued = true;
    if (k.toLowerCase() === "j") performAttack();
    if (k.toLowerCase() === "k") performRanged();
    if (k.toLowerCase() === "e") interact();
    if (k.toLowerCase() === "v") switchMode();
    if (k.toLowerCase() === "m") toggleAudio();
    if (/^[0-9]$/.test(k)) equipWeapon(k === "0" ? 9 : Number(k) - 1);
  }

  function onKeyUp(event) {
    input.keys.delete(event.key);
    input.keys.delete(event.key.toLowerCase());
  }

  function handleAction(action) {
    if (action === "start") startGame();
    else if (action === "pause") togglePause();
    else if (action === "restart") restartGame();
    else if (action === "switch") switchMode();
    else if (action === "attack") performAttack();
    else if (action === "ranged") performRanged();
    else if (action === "interact") interact();
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
    if (game.status === "playing") togglePause();
  });
  document.addEventListener("mousemove", (event) => {
    if (game.status === "playing" && game.mode === "fps" && document.pointerLockElement === canvas) {
      currentMission().player.angle = normalizeAngle(currentMission().player.angle + event.movementX * 0.0025);
    }
  });
  canvas.addEventListener("pointerdown", (event) => {
    if (game.status !== "playing") return;
    if (game.mode === "fps" && canvas.requestPointerLock && matchMedia("(pointer: fine)").matches) canvas.requestPointerLock()?.catch?.(() => {});
    if (event.button === 0) performAttack();
    if (event.button === 2) performRanged();
  });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  dom.startButton.addEventListener("click", showBriefing);
  dom.audioButton.addEventListener("click", toggleAudio);

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action));
  });

  document.querySelectorAll("[data-input]").forEach((button) => {
    const value = button.dataset.input;
    const mapping = { left: "a", right: "d", up: "w", down: "s" };
    const press = (event) => {
      event.preventDefault();
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
    pause: togglePause,
    restart: restartGame,
    switchMode,
    attack: performAttack,
    ranged: performRanged,
    equipWeapon,
    interact,
    getState: () => ({
      status: game.status, mode: game.mode, chapter: game.chapter, health: game.health,
      stamina: game.stamina, ammo: game.ammo, seals: game.seals, kills: game.kills,
      weapon: KATANA_IDS[game.weaponIndex],
      player2d: { ...game.side.player },
      playerFps: { ...currentMission().player },
      fpsRemaining: currentMission().enemies.filter((e) => !e.dead).length,
      nearEntrance: isNearSideEntrance(),
      entrance: { ...currentSideEntrance() },
      attackTimer: game.attackTimer,
      hitConfirm: game.hitConfirm,
    }),
    debug: {
      setMode: (mode) => mode === "fps" ? enterFps(game.chapter, false) : returnToSide(false),
      setHealth: (health) => { game.health = clamp(Number(health), 0, 100); },
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
      setFpsEnemy: (index, patch = {}) => {
        const enemies = currentMission().enemies;
        const enemy = enemies[clamp(Number(index) || 0, 0, enemies.length - 1)];
        Object.assign(enemy, patch);
        return { ...enemy };
      },
      warpToGate: () => {
        const entrance = currentSideEntrance();
        game.side.player.x = entrance.approachX;
        game.side.player.y = SIDE_GROUND_Y - game.side.player.h;
        game.side.player.vx = 0;
        game.side.player.vy = 0;
        game.side.player.grounded = true;
      },
      clearFps: () => {
        currentMission().enemies.forEach((enemy) => {
          enemy.hp = 0;
          enemy.dying = false;
          enemy.dead = true;
          enemy.attack = 0;
        });
      },
      warpToAltar: () => { const m = currentMission(); m.player.x = m.altar.x; m.player.y = m.altar.y; },
      worldSnapshot: () => {
        const scheme = currentFpsMaterialScheme();
        const mission = currentMission();
        const sideRules = currentSideRules();
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
            w: enemy.w,
            dead: enemy.dead,
          })),
          pickups: game.side.pickups.map((pickup) => ({
            x: pickup.x,
            w: 10,
            taken: pickup.taken,
          })),
          frontPropFootprints: (bitmapAssets.worldProps[currentSideEnvironmentIndex()] || [])
            .filter((prop) => prop.layer === "front")
            .map((prop) => ({ x: prop.x, w: prop.width, file: prop.file })),
          entrancePassThrough: currentSideEntrance().collision === "passThrough",
          fps: {
            scheme: scheme.id,
            floorTile: scheme.floorTile,
            floorProjection: "world-uv-floor-cast",
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
          hurtTimer: game.hurtTimer,
          stagger: game.playerStagger,
        },
        sideEnemies: game.side.enemies.map((enemy) => ({
          hp: enemy.hp,
          maxHp: enemy.maxHp,
          dying: enemy.dying,
          dead: enemy.dead,
          hurtTimer: enemy.hurtTimer,
          material: enemy.impactMaterial,
        })),
        fpsEnemies: currentMission().enemies.map((enemy) => ({
          x: enemy.x,
          y: enemy.y,
          hp: enemy.hp,
          dead: enemy.dead,
          radius: fpsEnemyRadius(enemy),
          engagementSlot: enemy.engagementSlot,
        })),
        particles: game.mode === "side"
          ? game.side.particles.map((particle) => particle.kind)
          : currentMission().particles.map((particle) => particle.kind),
        hitConfirmMaterial: game.hitConfirmMaterial,
      }),
      assetStatus: () => ({
        akio: modularAnimationReady(bitmapAssets.akioModular, "idle"),
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
        platformTiles: bitmapAssets.platformTiles.map((set) => ({
          ground: bitmapReady(set.ground),
          ledge: bitmapReady(set.ledge),
        })),
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
    const preview = new URLSearchParams(location.search).get("preview");
    const previewModes = new Set([
      "kurokawa",
      "bamboo",
      "gate-kurokawa",
      "gate-castle",
      "fps-kurokawa",
      "fps-castle",
    ]);
    if (previewModes.has(preview)) {
      startGame();
      const castlePreview = preview === "bamboo"
        || preview === "gate-castle"
        || preview === "fps-castle";
      game.chapter = castlePreview ? 1 : 0;
      prepareSideChapter(game.chapter);
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
      }
      updateHud();
    }
  }
  draw();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(frame);
})();
