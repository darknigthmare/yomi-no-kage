(() => {
  "use strict";

  /*
   * Source de vérité spatiale de Yomi no Kage.
   *
   * Le moteur peut cloner les objets ci-dessous pour créer son état mutable,
   * mais ne doit plus reconstruire la géographie depuis des tableaux séparés.
   * Les coordonnées historiques importantes du prototype sont conservées :
   * départ x=56, torii x=900, retour du premier FPS x=1045 et donjon x=2190.
   */

  const HORIZONTAL_GROUND_Y = 300;
  const PLAYER_GROUND_Y = 273;

  const DEPTH_BANDS = {
    "distant-architecture": {
      layer: "back",
      groundY: 290,
      baselineY: 290,
      perspectiveScale: 0.9,
      depthBias: -60,
      collision: "none",
    },
    "gameplay-ground": {
      layer: "ground",
      groundY: HORIZONTAL_GROUND_Y,
      baselineY: HORIZONTAL_GROUND_Y,
      perspectiveScale: 1,
      depthBias: -50,
      collision: "solidGround",
    },
    "gameplay-surface": {
      layer: "world",
      groundY: HORIZONTAL_GROUND_Y,
      baselineStrategy: "authoredY",
      perspectiveScale: 1,
      depthBias: -5,
      collision: "authoredPlatform",
    },
    "back-architecture": {
      layer: "back",
      groundY: HORIZONTAL_GROUND_Y,
      baselineY: HORIZONTAL_GROUND_Y,
      perspectiveScale: 1,
      depthBias: -30,
      collision: "none",
    },
    "gameplay-architecture": {
      layer: "back",
      groundY: HORIZONTAL_GROUND_Y,
      baselineY: HORIZONTAL_GROUND_Y,
      perspectiveScale: 1,
      depthBias: -20,
      collision: "platformOwned",
    },
    "gameplay-prop": {
      layer: "world",
      groundY: HORIZONTAL_GROUND_Y,
      baselineY: HORIZONTAL_GROUND_Y,
      perspectiveScale: 1,
      depthBias: -4,
      collision: "platformOwned",
    },
    "world-mid": {
      layer: "world",
      groundY: HORIZONTAL_GROUND_Y,
      baselineY: HORIZONTAL_GROUND_Y,
      perspectiveScale: 1,
      depthBias: 0,
      collision: "none",
    },
    "world-near": {
      layer: "world",
      groundY: HORIZONTAL_GROUND_Y,
      baselineY: 302,
      perspectiveScale: 1.02,
      depthBias: 10,
      collision: "none",
    },
    foreground: {
      layer: "front",
      groundY: HORIZONTAL_GROUND_Y,
      baselineY: 304,
      perspectiveScale: 1.05,
      depthBias: 20,
      collision: "none",
    },
  };

  /*
   * Les murs sont composés en séquences de quartier déterministes. Chaque
   * module reste un sprite indépendant, mais les bandes se chevauchent de
   * quelques pixels afin qu'aucun trait de ciel ne coupe une façade.
   */
  function architectureRun(
    idPrefix,
    startX,
    endX,
    files,
    moduleWidth = 128,
    options = {},
  ) {
    const overlap = Math.max(2, Math.min(12, options.overlap ?? 6));
    const step = Math.max(32, moduleWidth - overlap);
    const props = [];
    let index = 0;
    for (let x = startX; x < endX; x += step) {
      const remaining = endX - x;
      props.push({
        id: `${idPrefix}-${String(index + 1).padStart(2, "0")}`,
        file: files[index % files.length],
        x,
        width: Math.max(48, Math.min(moduleWidth, remaining + overlap)),
        layer: "back",
        bottomY: options.bottomY ?? HORIZONTAL_GROUND_Y,
        depthBand: options.depthBand || "back-architecture",
        // Les bandes de murs restent toujours derrière les bâtiments
        // ponctuels (tours, maisons, portes), même quand leurs x se croisent.
        depthBias: options.depthBias ?? -40,
        perspectiveScale: options.perspectiveScale ?? 1,
        groundAnchor: [0.5, 1],
      });
      index += 1;
    }
    return props;
  }

  function districtRoofline(idPrefix, placements, options = {}) {
    return placements.map(([file, x, width], index) => ({
      id: `${idPrefix}-${String(index + 1).padStart(2, "0")}`,
      file,
      x,
      width,
      layer: "back",
      bottomY: options.bottomY ?? 290,
      depthBand: "distant-architecture",
      depthBias: options.depthBias ?? -60,
      perspectiveScale: options.perspectiveScale ?? 0.9,
      compositionRole: "second-plane-building",
      groundAnchor: [0.5, 1],
    }));
  }

  const SURFACE_PROFILES = {
    earthRoad: {
      material: "packedEarth",
      tileFamily: "kurokawa-ground",
      friction: 1,
      footstep: "earth",
    },
    castleStone: {
      material: "castleStone",
      tileFamily: "daimyo-castle-stone",
      friction: 0.94,
      footstep: "stone",
    },
    thatchRoof: {
      material: "thatch",
      tileFamily: "kurokawa-thatch",
      friction: 0.86,
      footstep: "thatch",
    },
    ceramicRoof: {
      material: "ceramicRoofTile",
      tileFamily: "roof-tile",
      friction: 0.82,
      footstep: "roofTile",
    },
    villageWood: {
      material: "weatheredCedar",
      tileFamily: "kurokawa-wood",
      friction: 0.9,
      footstep: "wood",
    },
    castleCedar: {
      material: "blackCedar",
      tileFamily: "daimyo-castle-cedar",
      friction: 0.92,
      footstep: "wood",
    },
    tatami: {
      material: "tatami",
      tileFamily: "daimyo-castle-tatami",
      friction: 0.96,
      footstep: "tatami",
    },
    infectedRoots: {
      material: "infectedRoots",
      tileFamily: "yomi-roots",
      friction: 0.76,
      footstep: "organic",
    },
    asphalt: {
      material: "wetAsphalt",
      tileFamily: "tokyo-wet-asphalt",
      friction: 0.88,
      footstep: "asphalt",
    },
    metal: {
      material: "weatheredMetal",
      tileFamily: "industrial-metal",
      friction: 0.84,
      footstep: "metal",
    },
    techMetal: {
      material: "neoEdoAlloy",
      tileFamily: "cyber-titanium-conduit",
      friction: 0.87,
      footstep: "tech",
    },
    techStreet: {
      material: "neonComposite",
      tileFamily: "cyber-hex-floor",
      friction: 0.9,
      footstep: "tech",
    },
  };

  const FPS_MATERIAL_LIBRARY = {
    atlas: "assets/generated/props/fps-wall-texture-atlas.png",
    grid: { columns: 4, rows: 2 },
    atlases: {
      feudal: {
        src: "assets/generated/props/fps-wall-texture-atlas.png",
        era: "kanei-1638",
        grid: { columns: 4, rows: 2 },
      },
      contemporary: {
        src: "assets/generated/props/fps-modern-texture-atlas.png",
        source: "assets/generated/props/fps-modern-texture-atlas-source-openai.png",
        era: "tokyo-contemporary",
        grid: { columns: 4, rows: 2, tileSize: 384 },
      },
      cyber: {
        src: "assets/generated/props/fps-cyber-texture-atlas.png",
        source: "assets/generated/props/fps-cyber-texture-atlas-source-openai.png",
        era: "neo-edo-cyberpunk",
        grid: { columns: 4, rows: 2, tileSize: 384 },
      },
    },
    tiles: [
      { id: "charred-cedar", atlas: "feudal", index: 0, use: ["wall", "partition"] },
      { id: "torn-shoji", atlas: "feudal", index: 1, use: ["wall", "partition"] },
      { id: "damp-stone", atlas: "feudal", index: 2, use: ["wall", "foundation", "floor"] },
      { id: "soiled-tatami", atlas: "feudal", index: 3, use: ["floor"] },
      { id: "cracked-plaster", atlas: "feudal", index: 4, use: ["wall", "partition"] },
      { id: "quarantine-palisade", atlas: "feudal", index: 5, use: ["exteriorWall"] },
      { id: "castle-wall", atlas: "feudal", index: 6, use: ["wall", "loadBearingWall"] },
      { id: "contaminated-shrine", atlas: "feudal", index: 7, use: ["altar", "sealedDoor"] },

      { id: "modern-wet-asphalt", atlas: "contemporary", index: 0, use: ["floor", "exteriorFloor"] },
      { id: "modern-poured-concrete", atlas: "contemporary", index: 1, use: ["wall", "boundary"] },
      { id: "modern-service-steel", atlas: "contemporary", index: 2, use: ["wall", "circulation"] },
      { id: "modern-subway-ceramic", atlas: "contemporary", index: 3, use: ["wall", "chamber"] },
      { id: "modern-lab-floor", atlas: "contemporary", index: 4, use: ["floor", "walkable"] },
      { id: "modern-stained-concrete", atlas: "contemporary", index: 5, use: ["wall", "boundary"] },
      { id: "modern-quarantine-door", atlas: "contemporary", index: 6, use: ["door", "sealedDoor"] },
      { id: "modern-containment-chamber", atlas: "contemporary", index: 7, use: ["wall", "altar", "objective"] },

      { id: "cyber-hex-floor", atlas: "cyber", index: 0, use: ["floor", "walkable"] },
      { id: "cyber-titanium-conduit", atlas: "cyber", index: 1, use: ["wall", "circulation"] },
      { id: "cyber-machine-bay", atlas: "cyber", index: 2, use: ["wall", "chamber"] },
      { id: "cyber-data-panel", atlas: "cyber", index: 3, use: ["wall", "dataSurface"] },
      { id: "cyber-guide-floor", atlas: "cyber", index: 4, use: ["floor", "walkable"] },
      { id: "cyber-armored-bulkhead", atlas: "cyber", index: 5, use: ["wall", "boundary"] },
      { id: "cyber-neon-shrine-door", atlas: "cyber", index: 6, use: ["door", "sealedDoor"] },
      { id: "cyber-yomi-core", atlas: "cyber", index: 7, use: ["wall", "altar", "objective"] },
    ],
    profiles: {
      "contaminated-sanctuary": {
        floor: "damp-stone",
        boundary: "damp-stone",
        circulation: "charred-cedar",
        chamber: "torn-shoji",
        altar: "contaminated-shrine",
        forbiddenInteriorMaterials: ["quarantine-palisade"],
        semanticRegions: [
          { id: "outer-foundation", bounds: [0, 0, 15, 15], material: "damp-stone" },
          { id: "ritual-chamber", bounds: [8, 8, 15, 15], material: "torn-shoji" },
          { id: "altar-seal", radiusFromObjective: 2.25, material: "contaminated-shrine" },
        ],
      },
      "kurokawa-sick-house": {
        floor: "soiled-tatami",
        boundary: "cracked-plaster",
        circulation: "charred-cedar",
        chamber: "torn-shoji",
        altar: "contaminated-shrine",
        forbiddenInteriorMaterials: ["quarantine-palisade"],
      },
      "market-road-shrine": {
        floor: "damp-stone",
        boundary: "charred-cedar",
        circulation: "cracked-plaster",
        chamber: "torn-shoji",
        altar: "contaminated-shrine",
        forbiddenInteriorMaterials: ["castle-wall"],
      },
      "daimyo-archive": {
        floor: "soiled-tatami",
        boundary: "cracked-plaster",
        circulation: "castle-wall",
        chamber: "torn-shoji",
        altar: "contaminated-shrine",
        forbiddenInteriorMaterials: ["quarantine-palisade"],
      },
      "kurokawa-donjon": {
        floor: "soiled-tatami",
        boundary: "cracked-plaster",
        circulation: "castle-wall",
        chamber: "torn-shoji",
        altar: "contaminated-shrine",
        forbiddenInteriorMaterials: ["quarantine-palisade"],
        semanticRegions: [
          { id: "guard-corridor", material: "castle-wall" },
          { id: "residence-chambers", material: "torn-shoji" },
          { id: "damaged-plaster", material: "cracked-plaster" },
          { id: "yomi-throne-seal", radiusFromObjective: 2.25, material: "contaminated-shrine" },
        ],
      },
      "modern-metropolitan-lab": {
        atlas: "contemporary",
        era: "tokyo-contemporary",
        floorProjection: "world-uv-floor-cast",
        floorScale: 0.72,
        walkableCellValues: ["0", "3"],
        floor: "modern-lab-floor",
        boundary: "modern-stained-concrete",
        circulation: "modern-service-steel",
        chamber: "modern-subway-ceramic",
        door: "modern-quarantine-door",
        altar: "modern-containment-chamber",
        forbiddenInteriorMaterials: [
          "charred-cedar",
          "torn-shoji",
          "soiled-tatami",
          "cracked-plaster",
          "quarantine-palisade",
          "castle-wall",
          "contaminated-shrine",
        ],
        semanticRegions: [
          { id: "metro-lab-floor", material: "modern-lab-floor", use: "walkable" },
          { id: "perimeter-concrete", material: "modern-stained-concrete", use: "boundary" },
          { id: "service-corridor", material: "modern-service-steel", use: "circulation" },
          { id: "subway-laboratory", material: "modern-subway-ceramic", use: "chamber" },
          { id: "quarantine-threshold", material: "modern-quarantine-door", use: "door" },
          { id: "containment-seal", radiusFromObjective: 2.25, material: "modern-containment-chamber", use: "altar" },
        ],
      },
      "cyber-yomi-mainframe": {
        atlas: "cyber",
        era: "neo-edo-cyberpunk",
        floorProjection: "world-uv-floor-cast",
        floorScale: 0.82,
        walkableCellValues: ["0", "3"],
        floor: "cyber-hex-floor",
        boundary: "cyber-armored-bulkhead",
        circulation: "cyber-titanium-conduit",
        chamber: "cyber-machine-bay",
        door: "cyber-neon-shrine-door",
        altar: "cyber-yomi-core",
        forbiddenInteriorMaterials: [
          "charred-cedar",
          "torn-shoji",
          "damp-stone",
          "soiled-tatami",
          "cracked-plaster",
          "quarantine-palisade",
          "castle-wall",
          "contaminated-shrine",
        ],
        semanticRegions: [
          { id: "mainframe-floor", material: "cyber-hex-floor", use: "walkable" },
          { id: "armored-perimeter", material: "cyber-armored-bulkhead", use: "boundary" },
          { id: "conduit-circulation", material: "cyber-titanium-conduit", use: "circulation" },
          { id: "machine-bay", material: "cyber-machine-bay", use: "chamber" },
          { id: "neon-shrine-threshold", material: "cyber-neon-shrine-door", use: "door" },
          { id: "corrupted-yomi-core", radiusFromObjective: 2.25, material: "cyber-yomi-core", use: "altar" },
        ],
      },
    },
  };

  const KageLevels = {
    schema: 2,
    buildId: "20260719-complete-campaign-v2",
    campaignId: "yomi-no-kage",
    startAreaId: "kurokawa-main-street",
    startSpawnId: "prologue",
    canonManifest: "assets/modular/manifests/yomi-no-kage-canon.json",
    rosterManifest: "assets/modular/manifests/kai-kurokawa-deployment.json",
    canon: {
      period: "Kan'ei 15 (1638)",
      geography: {
        country: "Japon",
        province: "Kai",
        settlement: "Tsuru",
        district: "Kurokawa",
        statement: "Kurokawa est le district fortifié de Tsuru, dans la province de Kai.",
      },
      contamination: {
        phase1: {
          id: "biological-outbreak",
          nature: "biological",
          summary: "Une infection transmissible provoque fièvre, nécrose et violence avant la mort clinique.",
        },
        phase2: {
          id: "yomi-resonance",
          nature: "spiritual-amplification",
          summary: "La résonance du Yomi réanime et transforme les corps déjà contaminés; elle amplifie le foyer biologique sans le remplacer.",
        },
      },
      finalBoss: {
        id: "giant-10-yomi-no-kanrei",
        hostRole: "daimyo-of-kurokawa",
        identityRule: "Yomi-no-Kanrei est la phase 2 du daimyō corrompu, pas une entité finale sans lien avec le seigneur.",
      },
    },
    worldTags: {
      regionId: "kai",
      settlementId: "tsuru",
      districtId: "tsuru-kurokawa",
      periodId: "kanei-1638",
      factionIds: ["shogunate-expedition", "kurokawa-quarantine", "yomi-infected"],
    },
    rosterPools: {
      "kai-kurokawa-village": {
        chapterTags: ["village", "quarantine", "civilian-infected"],
        factions: ["kurokawa-quarantine", "yomi-infected"],
        regular: [
          "r02-sekisho-messenger",
          "r03-kurokawa-miner",
          "r04-chaya-servant",
          "r05-kome-porter",
          "r06-yama-woodcutter",
          "r08-kawara-roofer",
          "r09-haka-digger",
          "r10-hikeshi-watchman",
          "r12-miya-porter",
          "r13-yakushi-apprentice",
          "r14-kaido-bandit",
          "r16-kusari-prisoner",
          "r17-umaya-groom",
          "r18-washi-maker",
          "r19-kago-bearer",
          "r20-komuso-wanderer",
        ],
        special: [
          "s01-kusa-shinobi",
          "s02-doku-kunoichi",
          "s03-bakusai-runner",
          "s04-onibi-adept",
          "s05-raimei-yamabushi",
          "s06-oni-men-executioner",
          "s09-kuro-yakushi",
          "s11-biwa-revenant",
          "s12-shikigami-scribe",
          "s13-kegare-sumotori",
          "s17-kurohata-bearer",
          "s18-yomi-herald",
          "s19-wana-trapper",
          "s20-mekura-oracle",
        ],
        excludedRoleTags: ["coastal-fisher", "salt-coast", "pirate", "naval", "amphibious"],
      },
      "kai-kurokawa-castle": {
        chapterTags: ["castle", "quarantine-garrison", "yomi-court"],
        factions: ["kurokawa-garrison", "yomi-infected"],
        regular: [
          "r02-sekisho-messenger",
          "r03-kurokawa-miner",
          "r05-kome-porter",
          "r08-kawara-roofer",
          "r10-hikeshi-watchman",
          "r13-yakushi-apprentice",
          "r15-oku-servant",
          "r16-kusari-prisoner",
          "r17-umaya-groom",
          "r19-kago-bearer",
        ],
        special: [
          "s06-oni-men-executioner",
          "s07-tessen-courtier",
          "s08-gomon-jailer",
          "s09-kuro-yakushi",
          "s10-hatamoto-fallen",
          "s12-shikigami-scribe",
          "s13-kegare-sumotori",
          "s15-teppo-corpsman",
          "s16-kage-mai-dancer",
          "s17-kurohata-bearer",
          "s18-yomi-herald",
          "s20-mekura-oracle",
        ],
        miniboss: [
          "mb-01-gunso-croc-fer",
          "mb-02-ronin-kurogane",
          "mb-03-sohei-cent-prieres",
          "mb-07-arquebusier-jigoku",
          "mb-08-archer-os",
          "mb-09-pisteur-kegare",
          "mb-10-forgeron-hibana",
          "mb-11-hatamoto-inazuma",
          "mb-12-gardien-masque-fer",
          "mb-15-kunoichi-veuve",
          "mb-16-yoriki-gashadokuro",
          "mb-18-onmyoji-renard",
          "mb-20-capitaine-byakko",
        ],
        excludedRoleTags: ["coastal-fisher", "salt-coast", "pirate", "naval", "amphibious"],
      },
    },
    visualStandards: {
      coordinateSpace: "side-view-orthographic",
      groundBaselineY: HORIZONTAL_GROUND_Y,
      depthBands: DEPTH_BANDS,
      surfaceProfiles: SURFACE_PROFILES,
      requireOwnedColliderForHiddenPlatforms: true,
      minimumGuardSpacing: 72,
      fpsMaterials: FPS_MATERIAL_LIBRARY,
    },
    designRules: {
      outdoorRequiredRoute: "horizontal",
      outdoorPlatformRole: "optionalUpper",
      structuralVerticalityZones: ["building", "castle"],
      portalInteraction: "manual",
      portalKey: "E",
      transitionSwapRatio: 0.5,
      persistentAreaState: true,
    },
    legacyCompatibility: {
      sideWidth: 2500,
      chapter0StartX: 56,
      chapter0FpsEntranceX: 900,
      chapter1ReturnX: 1045,
      chapter1FpsEntranceX: 2190,
      chapter1DoorBlockX: 2148,
      groundY: HORIZONTAL_GROUND_Y,
    },
    chapters: {
      village: {
        id: "village",
        label: "Kurokawa — village des cendres",
        areaIds: [
          "kurokawa-main-street",
          "kurokawa-back-street",
          "kurokawa-market-east",
        ],
        entryAreaId: "kurokawa-main-street",
        objectiveAreaId: "kurokawa-market-east",
      },
      castle: {
        id: "castle",
        label: "Donjon de Kurokawa",
        areaIds: [
          "castle-lower-court",
          "castle-residence",
          "castle-donjon",
        ],
        entryAreaId: "castle-lower-court",
        objectiveAreaId: "castle-donjon",
      },
    },
    mapGraph: {
      nodes: [
        { id: "kurokawa-main-street", mapX: 0, mapY: 0, kind: "outdoor" },
        { id: "kurokawa-back-street", mapX: 0, mapY: 1, kind: "outdoor" },
        { id: "kurokawa-market-east", mapX: 1, mapY: 0, kind: "outdoor" },
        { id: "castle-lower-court", mapX: 2, mapY: 0, kind: "castle" },
        { id: "castle-residence", mapX: 2, mapY: 1, kind: "building" },
        { id: "castle-donjon", mapX: 3, mapY: 0, kind: "castle" },
      ],
      edges: [
        {
          id: "main-back-alley",
          from: "kurokawa-main-street",
          to: "kurokawa-back-street",
          kind: "side",
          bidirectional: true,
        },
        {
          id: "main-market-gate",
          from: "kurokawa-main-street",
          to: "kurokawa-market-east",
          kind: "side",
          bidirectional: true,
        },
        {
          id: "back-market-passage",
          from: "kurokawa-back-street",
          to: "kurokawa-market-east",
          kind: "side",
          bidirectional: true,
        },
        {
          id: "market-castle-road",
          from: "kurokawa-market-east",
          to: "castle-lower-court",
          kind: "side",
          bidirectional: true,
          initiallyLocked: true,
          unlockEncounterId: "aka-ushi-east-gate",
        },
        {
          id: "court-residence-door",
          from: "castle-lower-court",
          to: "castle-residence",
          kind: "side",
          bidirectional: true,
        },
        {
          id: "residence-donjon-corridor",
          from: "castle-residence",
          to: "castle-donjon",
          kind: "side",
          bidirectional: true,
        },
      ],
    },
    areas: {
      "kurokawa-main-street": {
        id: "kurokawa-main-street",
        chapterId: "village",
        chapterTags: ["village", "main-road", "quarantine"],
        regionId: "kai",
        settlementId: "tsuru",
        districtId: "tsuru-kurokawa",
        rosterPoolId: "kai-kurokawa-village",
        label: "Grande rue de Kurokawa",
        zoneKind: "outdoor",
        environmentIndex: 0,
        width: 2500,
        minX: 6,
        maxX: 2479,
        cameraMinX: 0,
        routeMetrics: {
          mainRoute: "horizontal",
          mainRouteLength: 2420,
          requiredClimb: 0,
          optionalUpperRoutes: 4,
        },
        spawns: {
          prologue: { x: 56, y: PLAYER_GROUND_Y, facing: 1 },
          fpsReturn: { x: 852, y: PLAYER_GROUND_Y, facing: 1 },
          backStreetReturn: { x: 1420, y: PLAYER_GROUND_Y, facing: -1 },
          marketReturn: { x: 2040, y: PLAYER_GROUND_Y, facing: -1 },
        },
        groundSegments: [
          {
            id: "main-earth-road",
            x: 0,
            y: HORIZONTAL_GROUND_Y,
            w: 2500,
            h: 60,
            collision: "solid",
            surface: "earth",
            routeRole: "main",
          },
        ],
        platforms: [
          {
            id: "burned-house-roof",
            x: 49,
            y: 254,
            w: 158,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "minka-chaume-brulee",
            surface: "thatch",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "village-barrier-west-top",
            x: 226,
            y: 272,
            w: 58,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "village-barrier-west",
            surface: "wood",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "west-watch-balcony",
            x: 318,
            y: 238,
            w: 64,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "tour-guet-ouest",
            surface: "wood",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "barrel-access-top",
            x: 506,
            y: 258,
            w: 24,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "barrel-access",
            surface: "wood",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "intact-house-awning",
            x: 541,
            y: 239,
            w: 164,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "minka-tuiles-intacte",
            surface: "roofTile",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "intact-house-roof",
            x: 552,
            y: 210,
            w: 142,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "intact-minka",
            surface: "roofTile",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "rice-storehouse-roof",
            x: 1072,
            y: 190,
            w: 126,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "kura-entrepot-riz",
            surface: "roofTile",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "broken-cart-shortcut",
            x: 1013,
            y: 270,
            w: 52,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "charrette-cassee",
            surface: "wood",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "rice-storehouse-awning",
            x: 1068,
            y: 231,
            w: 62,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "rice-storehouse",
            surface: "roofTile",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "haystack-shortcut",
            x: 1385,
            y: 258,
            w: 48,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "tas-paille",
            surface: "thatch",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "haystack-high-step",
            x: 1395,
            y: 225,
            w: 28,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "hay-access",
            surface: "thatch",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "burned-quarter-barrel-top",
            x: 1775,
            y: 258,
            w: 28,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "burned-quarter-barrel",
            surface: "wood",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "burned-house-east-roof",
            x: 1817,
            y: 254,
            w: 158,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "burned-minka-east",
            surface: "thatch",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "east-watch-step",
            x: 2178,
            y: 264,
            w: 82,
            h: 8,
            visualHeight: 32,
            tile: "step",
            surface: "wood",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "east-watch-balcony",
            x: 2263,
            y: 238,
            w: 64,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "watchtower-east",
            surface: "wood",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
        ],
        props: [
          ...districtRoofline("main-roofline", [
            ["minka-tuiles-intacte", 18, 158],
            ["kura-entrepot-riz", 286, 138],
            ["minka-chaume-brulee", 505, 156],
            ["minka-tuiles-intacte", 780, 152],
            ["kura-entrepot-riz", 1050, 142],
            ["minka-chaume-brulee", 1325, 154],
            ["minka-tuiles-intacte", 1605, 156],
            ["kura-entrepot-riz", 1890, 142],
            ["minka-chaume-brulee", 2160, 154],
            ["tour-guet-kurokawa-3q-arriere-plan", 2380, 72],
          ]),
          ...architectureRun(
            "main-west-plaster",
            0,
            780,
            ["mur-platre-intact", "mur-platre-fume", "mur-platre-lattis"],
            126,
          ),
          ...architectureRun(
            "main-service-quarter",
            774,
            1710,
            [
              "mur-cedre-brule",
              "mur-planches-pluie",
              "mur-kura-bas",
              "mur-porte-service",
              "mur-fenetre-barreaux",
              "mur-volets-pluie",
            ],
            132,
          ),
          ...architectureRun(
            "main-quarantine-quarter",
            1704,
            2500,
            [
              "angle-ruelle-rentrant",
              "mur-quarantaine",
              "mur-racines-yomi",
              "mur-breche-effondree",
              "mur-pierre-jokamachi",
              "mur-echoppe-brulee",
              "angle-ruelle-sortant",
            ],
            132,
          ),
          { id: "burned-minka-west", file: "minka-chaume-brulee", x: 42, width: 175, layer: "back" },
          { id: "village-barrier-west", file: "barriere-village", x: 220, width: 68, layer: "world" },
          { id: "watchtower-west", file: "tour-guet-kurokawa", x: 305, width: 82, layer: "back" },
          { id: "barrel-access", file: "tonneau-provisions", x: 500, width: 36, layer: "world" },
          { id: "intact-minka", file: "minka-tuiles-intacte", x: 535, width: 175, layer: "back" },
          { id: "street-fire", file: "foyer-incendie", x: 760, width: 54, layer: "world" },
          { id: "broken-cart", file: "charrette-cassee", x: 990, width: 78, layer: "world" },
          { id: "rice-storehouse", file: "kura-entrepot-riz", x: 1060, width: 150, layer: "back" },
          { id: "hay-access", file: "tas-paille", x: 1374, width: 70, layer: "world" },
          { id: "main-well", file: "puits-pierre", x: 1570, width: 48, layer: "world" },
          { id: "burned-quarter-barrel", file: "tonneau-provisions", x: 1770, width: 36, layer: "world" },
          { id: "burned-minka-east", file: "minka-chaume-brulee", x: 1810, width: 175, layer: "back" },
          { id: "road-altar", file: "autel-route", x: 2040, width: 48, layer: "world" },
          { id: "watchtower-east", file: "tour-guet-kurokawa", x: 2250, width: 82, layer: "back" },
        ],
        portals: [
          {
            id: "contaminated-torii",
            linkId: "sanctuary-fps",
            x: 900,
            approachX: 852,
            interactionRange: 58,
            collision: "passThrough",
            type: "fps",
            mission: 0,
            destination: { missionId: "contaminated-sanctuary" },
            returnDestination: {
              areaId: "kurokawa-main-street",
              spawnId: "fpsReturn",
            },
            state: "open",
            label: "Sanctuaire contaminé",
            prompt: "E — FRANCHIR LE TORII",
            persistentEncounterId: "sanctuary-seal",
          },
          {
            id: "alley-to-back-street",
            linkId: "main-back-alley",
            x: 1465,
            interactionRange: 48,
            collision: "portal",
            type: "side",
            destination: {
              areaId: "kurokawa-back-street",
              spawnId: "mainStreetReturn",
            },
            state: "open",
            visual: "passage-ruelle",
            label: "Ruelle derrière les maisons",
            prompt: "E — EMPRUNTER LA RUELLE",
          },
          {
            id: "gate-to-market",
            linkId: "main-market-gate",
            x: 2130,
            interactionRange: 52,
            collision: "portal",
            type: "side",
            destination: {
              areaId: "kurokawa-market-east",
              spawnId: "mainStreetReturn",
            },
            state: "open",
            visual: "porte-palissade",
            label: "Marché oriental",
            prompt: "E — PASSER LA PALISSADE",
          },
        ],
        enemies: [
          { id: "main-regular-01", roster: "regular", x: 296, y: 276, facing: -1 },
          { id: "main-regular-02", roster: "regular", x: 430, y: 276, facing: -1 },
          { id: "main-special-01", roster: "special", x: 735, y: 276, facing: -1 },
          { id: "main-regular-03", roster: "regular", x: 1260, y: 276, facing: -1 },
          { id: "main-regular-04", roster: "regular", x: 1680, y: 276, facing: -1 },
          {
            id: "main-special-02",
            roster: "special",
            x: 2430,
            y: 276,
            facing: -1,
            ai: { patrol: { minX: 2430, maxX: 2470 } },
          },
        ],
        pickups: [
          { id: "main-ofuda-west", x: 600, y: 266, kind: "ammo", amount: 4 },
          { id: "main-yomogi", x: 1280, y: 266, kind: "health", amount: 28 },
          { id: "main-ofuda-east", x: 1850, y: 266, kind: "ammo", amount: 4 },
        ],
        encounters: [],
      },

      "kurokawa-back-street": {
        id: "kurokawa-back-street",
        chapterId: "village",
        chapterTags: ["village", "back-street", "quarantine"],
        regionId: "kai",
        settlementId: "tsuru",
        districtId: "tsuru-kurokawa",
        rosterPoolId: "kai-kurokawa-village",
        label: "Ruelle des puits",
        zoneKind: "outdoor",
        environmentIndex: 0,
        width: 2500,
        minX: 6,
        maxX: 2479,
        cameraMinX: 0,
        routeMetrics: {
          mainRoute: "horizontal",
          mainRouteLength: 2360,
          requiredClimb: 0,
          optionalUpperRoutes: 3,
        },
        spawns: {
          mainStreetReturn: { x: 150, y: PLAYER_GROUND_Y, facing: 1 },
          marketReturn: { x: 2290, y: PLAYER_GROUND_Y, facing: -1 },
          sickHouseReturn: { x: 1120, y: PLAYER_GROUND_Y, facing: 1 },
        },
        groundSegments: [
          {
            id: "back-street-earth",
            x: 0,
            y: HORIZONTAL_GROUND_Y,
            w: 2500,
            h: 60,
            collision: "solid",
            surface: "earth",
            routeRole: "main",
          },
        ],
        platforms: [
          {
            id: "back-minka-west-roof",
            x: 270,
            y: 230,
            w: 150,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "back-minka-01",
            surface: "thatch",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "back-cart",
            x: 460,
            y: 270,
            w: 64,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "charrette-cassee",
            surface: "wood",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "back-minka-roof",
            x: 820,
            y: 230,
            w: 150,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "minka-chaume-brulee",
            surface: "thatch",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "back-kura-awning",
            x: 1680,
            y: 242,
            w: 138,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "kura-entrepot-riz",
            surface: "roofTile",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "back-hay-top",
            x: 1250,
            y: 258,
            w: 54,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "back-hay",
            surface: "thatch",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "back-barrier-top",
            x: 2188,
            y: 272,
            w: 58,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "back-barrier",
            surface: "wood",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
        ],
        props: [
          ...districtRoofline("back-roofline", [
            ["kura-entrepot-riz", 20, 142],
            ["minka-chaume-brulee", 300, 154],
            ["minka-tuiles-intacte", 585, 156],
            ["kura-entrepot-riz", 875, 142],
            ["minka-tuiles-intacte", 1150, 154],
            ["tour-guet-kurokawa-3q-arriere-plan", 1450, 70],
            ["kura-entrepot-riz", 1725, 145],
            ["minka-chaume-brulee", 2010, 156],
            ["minka-tuiles-intacte", 2290, 152],
          ]),
          ...architectureRun(
            "back-kura-quarter",
            0,
            850,
            ["mur-kura-bas", "mur-kura-haut", "mur-porte-service"],
            130,
          ),
          ...architectureRun(
            "back-guard-quarter",
            844,
            1710,
            [
              "mur-fenetre-barreaux",
              "mur-volets-pluie",
              "mur-gouttiere-chaine",
              "mur-planches-pluie",
            ],
            130,
          ),
          ...architectureRun(
            "back-burned-quarter",
            1704,
            2500,
            [
              "mur-auvent-brise",
              "mur-cedre-brule",
              "mur-breche-effondree",
              "mur-echoppe-brulee",
            ],
            132,
          ),
          { id: "back-minka-01", file: "minka-chaume-brulee", x: 260, width: 175, layer: "back" },
          { id: "back-cart-01", file: "charrette-cassee", x: 450, width: 82, layer: "world" },
          { id: "back-well", file: "puits-pierre", x: 630, width: 48, layer: "world" },
          { id: "back-minka-02", file: "minka-chaume-brulee", x: 810, width: 175, layer: "back" },
          { id: "back-hay", file: "tas-paille", x: 1240, width: 74, layer: "world" },
          { id: "back-kura", file: "kura-entrepot-riz", x: 1660, width: 165, layer: "back" },
          { id: "back-fire", file: "foyer-incendie", x: 2010, width: 50, layer: "world" },
          { id: "back-barrier", file: "barriere-village", x: 2180, width: 74, layer: "world" },
        ],
        portals: [
          {
            id: "return-to-main-alley",
            linkId: "main-back-alley",
            x: 120,
            interactionRange: 48,
            collision: "portal",
            type: "return",
            destination: {
              areaId: "kurokawa-main-street",
              spawnId: "backStreetReturn",
            },
            state: "open",
            visual: "passage-ruelle",
            label: "Grande rue",
            prompt: "E — REVENIR À LA GRANDE RUE",
          },
          {
            id: "sick-house-fps",
            linkId: "sick-house-fps",
            x: 1160,
            interactionRange: 44,
            collision: "portal",
            type: "fps",
            mission: "kurokawa-sick-house",
            missionIndex: 2,
            destination: { missionId: "kurokawa-sick-house" },
            returnDestination: {
              areaId: "kurokawa-back-street",
              spawnId: "sickHouseReturn",
            },
            state: "closed",
            visual: "porte-minka",
            label: "Maison des malades",
            prompt: "E — OUVRIR LA PORTE",
            optional: true,
            persistentEncounterId: "sick-house-secret",
          },
          {
            id: "passage-to-market",
            linkId: "back-market-passage",
            x: 2350,
            interactionRange: 50,
            collision: "portal",
            type: "side",
            destination: {
              areaId: "kurokawa-market-east",
              spawnId: "backStreetReturn",
            },
            state: "open",
            visual: "passage-ruelle",
            label: "Arrière du marché",
            prompt: "E — SUIVRE LE PASSAGE",
          },
        ],
        enemies: [
          { id: "back-regular-01", roster: "regular", x: 360, y: 276, facing: -1 },
          { id: "back-regular-02", roster: "regular", x: 720, y: 276, facing: -1 },
          { id: "back-special-01", roster: "special", x: 1040, y: 276, facing: -1 },
          { id: "back-regular-03", roster: "regular", x: 1450, y: 276, facing: -1 },
          { id: "back-special-02", roster: "special", x: 1910, y: 276, facing: -1 },
          {
            id: "back-regular-04",
            roster: "regular",
            x: 2080,
            y: 276,
            facing: -1,
            ai: { patrol: { minX: 2068, maxX: 2128 } },
          },
        ],
        pickups: [
          { id: "back-yomogi", x: 650, y: 266, kind: "health", amount: 28 },
          { id: "back-cinder", x: 1310, y: 266, kind: "yomiAsh", amount: 1 },
          { id: "back-ofuda", x: 2050, y: 266, kind: "ammo", amount: 4 },
        ],
        encounters: [],
      },

      "kurokawa-market-east": {
        id: "kurokawa-market-east",
        chapterId: "village",
        chapterTags: ["village", "market", "quarantine", "massive-boss-arena"],
        regionId: "kai",
        settlementId: "tsuru",
        districtId: "tsuru-kurokawa",
        rosterPoolId: "kai-kurokawa-village",
        label: "Marché oriental",
        zoneKind: "outdoor",
        environmentIndex: 0,
        width: 2500,
        minX: 6,
        maxX: 2479,
        cameraMinX: 0,
        routeMetrics: {
          mainRoute: "horizontal",
          mainRouteLength: 2320,
          requiredClimb: 0,
          optionalUpperRoutes: 2,
        },
        spawns: {
          mainStreetReturn: { x: 150, y: PLAYER_GROUND_Y, facing: 1 },
          backStreetReturn: { x: 720, y: PLAYER_GROUND_Y, facing: 1 },
          shrineReturn: { x: 820, y: PLAYER_GROUND_Y, facing: 1 },
          castleReturn: { x: 2330, y: PLAYER_GROUND_Y, facing: -1 },
          bossCheckpoint: { x: 1080, y: PLAYER_GROUND_Y, facing: 1 },
        },
        groundSegments: [
          {
            id: "market-earth",
            x: 0,
            y: HORIZONTAL_GROUND_Y,
            w: 2500,
            h: 60,
            collision: "solid",
            surface: "earth",
            routeRole: "main",
          },
        ],
        platforms: [
          {
            id: "market-cart-shortcut",
            x: 390,
            y: 270,
            w: 70,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "charrette-cassee",
            surface: "wood",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "market-house-secret",
            x: 610,
            y: 226,
            w: 154,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "minka-tuiles-intacte",
            surface: "roofTile",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
        ],
        props: [
          ...districtRoofline("market-roofline", [
            ["minka-tuiles-intacte", 20, 158],
            ["kura-entrepot-riz", 300, 142],
            ["minka-chaume-brulee", 575, 156],
            ["minka-tuiles-intacte", 850, 158],
            ["tour-guet-kurokawa-3q-arriere-plan", 2180, 72],
            ["kura-entrepot-riz", 2380, 118],
          ]),
          ...architectureRun(
            "market-quarantine-line",
            0,
            1200,
            [
              "mur-alcove-vide",
              "mur-quarantaine",
              "mur-racines-yomi",
              "mur-breche-effondree",
            ],
            136,
          ),
          ...architectureRun(
            "market-castle-road-line",
            1194,
            2500,
            [
              "mur-pierre-jokamachi",
              "mur-echoppe-brulee",
              "mur-kura-bas",
              "mur-porte-service",
            ],
            142,
          ),
          { id: "market-cart", file: "charrette-cassee", x: 380, width: 84, layer: "world" },
          { id: "market-house", file: "minka-tuiles-intacte", x: 600, width: 175, layer: "back" },
          { id: "market-well", file: "puits-pierre", x: 970, width: 48, layer: "world" },
          { id: "arena-barrier-west", file: "barriere-village", x: 1160, width: 76, layer: "world", destructible: true },
          { id: "arena-hay", file: "tas-paille", x: 1480, width: 76, layer: "world", destructible: true },
          { id: "arena-cart", file: "charrette-cassee", x: 1850, width: 88, layer: "world", destructible: true },
          { id: "arena-barrier-east", file: "barriere-village", x: 2110, width: 76, layer: "world", destructible: true },
          { id: "castle-road-watch", file: "tour-guet-kurokawa", x: 2260, width: 88, layer: "back" },
        ],
        portals: [
          {
            id: "return-to-main-gate",
            linkId: "main-market-gate",
            x: 120,
            interactionRange: 50,
            collision: "portal",
            type: "return",
            destination: {
              areaId: "kurokawa-main-street",
              spawnId: "marketReturn",
            },
            state: "open",
            visual: "porte-palissade",
            label: "Grande rue",
            prompt: "E — REVENIR À LA GRANDE RUE",
          },
          {
            id: "return-to-back-passage",
            linkId: "back-market-passage",
            x: 760,
            interactionRange: 48,
            collision: "portal",
            type: "return",
            destination: {
              areaId: "kurokawa-back-street",
              spawnId: "marketReturn",
            },
            state: "open",
            visual: "passage-ruelle",
            label: "Ruelle des puits",
            prompt: "E — PASSER DERRIÈRE LES MAISONS",
          },
          {
            id: "market-shrine-fps",
            linkId: "market-shrine-fps",
            x: 835,
            interactionRange: 44,
            collision: "portal",
            type: "fps",
            mission: "market-road-shrine",
            missionIndex: 3,
            destination: { missionId: "market-road-shrine" },
            returnDestination: {
              areaId: "kurokawa-market-east",
              spawnId: "shrineReturn",
            },
            state: "closed",
            visual: "porte-sanctuaire",
            label: "Chapelle de route",
            prompt: "E — OUVRIR LA CHAPELLE",
            optional: true,
            persistentEncounterId: "market-shrine-secret",
          },
          {
            id: "road-to-castle",
            linkId: "market-castle-road",
            x: 2380,
            interactionRange: 58,
            collision: "solidDoor",
            blockX: 2336,
            blockWidth: 88,
            type: "side",
            destination: {
              areaId: "castle-lower-court",
              spawnId: "villageReturn",
            },
            state: "locked",
            unlockEncounterId: "aka-ushi-east-gate",
            visual: "porte-chateau",
            label: "Route du château",
            prompt: "E — OUVRIR LE PASSAGE",
          },
        ],
        enemies: [
          { id: "market-regular-01", roster: "regular", x: 280, y: 276, facing: -1 },
          { id: "market-special-01", roster: "special", x: 520, y: 276, facing: -1 },
          { id: "market-regular-02", roster: "regular", x: 980, y: 276, facing: -1 },
          {
            id: "aka-ushi",
            rosterId: "giant-02-aka-ushi",
            profileId: "giant-02-aka-ushi",
            presentationClass: "massive",
            encounterId: "aka-ushi-east-gate",
            x: 1880,
            y: 218,
            w: 128,
            h: 82,
            hp: 42,
            facing: -1,
            boss: true,
          },
        ],
        pickups: [
          { id: "market-checkpoint-yomogi", x: 1080, y: 266, kind: "health", amount: 28 },
          { id: "market-ofuda", x: 2220, y: 266, kind: "ammo", amount: 4 },
        ],
        checkpoints: [
          {
            id: "market-before-aka-ushi",
            x: 1080,
            spawnId: "bossCheckpoint",
            persistent: true,
          },
        ],
        encounters: [
          {
            id: "aka-ushi-east-gate",
            kind: "massiveBoss",
            profileId: "giant-02-aka-ushi",
            bounds: { x: 1120, y: 0, w: 1080, h: 360 },
            activationX: 1210,
            cameraLock: true,
            visibleArenaGates: ["arena-barrier-west", "arena-barrier-east"],
            completionUnlocks: ["road-to-castle"],
          },
        ],
      },

      "castle-lower-court": {
        id: "castle-lower-court",
        chapterId: "castle",
        chapterTags: ["castle", "exterior-courtyard", "quarantine-garrison"],
        regionId: "kai",
        settlementId: "tsuru",
        districtId: "tsuru-kurokawa",
        rosterPoolId: "kai-kurokawa-castle",
        label: "Cour basse du château",
        zoneKind: "castle",
        environmentIndex: 2,
        backdropProfile: "castle-courtyard",
        sideBackdrop: {
          mode: "orthographic-modular-exterior",
          environmentId: "daimyo-castle",
          projection: "lateral",
          layerOrder: ["sky", "far", "mid", "near"],
          forbiddenAssets: ["assets/generated/environments/03-daimyo-castle-interior.png"],
        },
        groundVisual: "castle-stone",
        width: 2500,
        minX: 960,
        maxX: 2479,
        cameraMinX: 900,
        routeMetrics: {
          mainRoute: "horizontal",
          mainRouteLength: 1420,
          requiredClimb: 0,
          structuralFloors: 6,
        },
        spawns: {
          villageReturn: { x: 970, y: PLAYER_GROUND_Y, facing: 1 },
          legacyFpsReturn: { x: 1045, y: PLAYER_GROUND_Y, facing: 1 },
          residenceReturn: { x: 1710, y: PLAYER_GROUND_Y, facing: -1 },
          donjonFpsApproach: { x: 2138, y: PLAYER_GROUND_Y, facing: 1 },
        },
        groundSegments: [
          {
            id: "lower-court-ground",
            x: 900,
            y: HORIZONTAL_GROUND_Y,
            w: 1600,
            h: 60,
            collision: "solid",
            surface: "tatamiStone",
            routeRole: "main",
          },
        ],
        platforms: [
          {
            id: "castle-tower-lower",
            x: 1000,
            y: 222,
            w: 170,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "tour-chateau",
            surface: "roofTile",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "castle-tower-middle",
            x: 1015,
            y: 178,
            w: 145,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "lower-court-tower",
            surface: "roofTile",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "castle-tower-upper",
            x: 1030,
            y: 135,
            w: 115,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "lower-court-tower",
            surface: "roofTile",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "castle-stair-1",
            x: 1140,
            y: 286,
            w: 78,
            h: 8,
            visualHeight: 24,
            tile: "step",
            surface: "castleStone",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "castle-stair-2",
            x: 1146,
            y: 270,
            w: 66,
            h: 8,
            visualHeight: 24,
            tile: "step",
            surface: "castleStone",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "castle-stair-3",
            x: 1152,
            y: 254,
            w: 54,
            h: 8,
            visualHeight: 24,
            tile: "step",
            surface: "castleStone",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "court-stone-gallery",
            x: 1225,
            y: 264,
            w: 170,
            h: 8,
            visualHeight: 24,
            tile: "ledge",
            surface: "castleStone",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "court-gate-roof",
            x: 1695,
            y: 183,
            w: 170,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "lower-court-gate",
            surface: "roofTile",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "court-east-beam",
            x: 1914,
            y: 234,
            w: 46,
            h: 8,
            visualHeight: 28,
            tile: "beam",
            owner: "lower-court-pillar",
            surface: "cedar",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "court-root-step",
            x: 2048,
            y: 264,
            w: 78,
            h: 8,
            visualHeight: 24,
            visual: false,
            owner: "lower-court-roots",
            surface: "infectedRoots",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
          {
            id: "court-door-step",
            x: 2130,
            y: 274,
            w: 72,
            h: 8,
            visualHeight: 30,
            tile: "short",
            surface: "castleStone",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "court-final-gallery",
            x: 2320,
            y: 264,
            w: 90,
            h: 8,
            visualHeight: 30,
            tile: "ledge",
            surface: "castleStone",
            collision: "oneWay",
            routeRole: "optionalUpper",
          },
        ],
        props: [
          ...districtRoofline(
            "lower-court-skyline",
            [
              ["tour-chateau", 120, 145],
              ["tour-chateau", 690, 150],
              ["tour-chateau", 1370, 150],
              ["tour-chateau", 2190, 145],
            ],
            { bottomY: 290, perspectiveScale: 0.84, depthBias: -65 },
          ),
          ...architectureRun(
            "lower-court-rampart",
            0,
            2500,
            ["mur-pierre-jokamachi"],
            184,
            { overlap: 10, depthBias: -35 },
          ),
          { id: "lower-court-tower", file: "tour-chateau", x: 990, width: 180, layer: "back" },
          { id: "lower-court-brazier", file: "brasero-fer", x: 1608, width: 32, layer: "front" },
          { id: "lower-court-gate", file: "porte-chateau", x: 1680, width: 190, layer: "back" },
          { id: "lower-court-pillar", file: "pilier-cedre", x: 1910, width: 48, layer: "back" },
          { id: "lower-court-brazier-east", file: "brasero-fer", x: 1968, width: 32, layer: "front" },
          { id: "lower-court-roots", file: "racines-donjon", x: 2045, width: 80, layer: "world" },
        ],
        portals: [
          {
            id: "return-to-village",
            linkId: "market-castle-road",
            x: 970,
            interactionRange: 54,
            collision: "portal",
            type: "return",
            destination: {
              areaId: "kurokawa-market-east",
              spawnId: "castleReturn",
            },
            state: "open",
            visual: "porte-chateau",
            label: "Route du village",
            prompt: "E — REDESCENDRE AU VILLAGE",
          },
          {
            id: "door-to-residence",
            linkId: "court-residence-door",
            x: 1760,
            interactionRange: 52,
            collision: "solidDoor",
            blockX: 1720,
            blockWidth: 80,
            type: "side",
            destination: {
              areaId: "castle-residence",
              spawnId: "lowerCourtReturn",
            },
            state: "closed",
            visual: "porte-laquee",
            label: "Résidence du daimyō",
            prompt: "E — FAIRE COULISSER LA PORTE",
          },
        ],
        enemies: [
          { id: "court-guard-01", roster: "special", x: 1350, y: 276, facing: -1 },
          { id: "court-guard-02", roster: "miniboss", x: 1490, y: 276, facing: -1 },
          {
            id: "court-guard-03",
            roster: "special",
            x: 1650,
            y: 276,
            facing: -1,
            ai: { patrol: { minX: 1582, maxX: 1698 } },
          },
          { id: "court-guard-04", roster: "special", x: 1870, y: 276, facing: -1 },
          {
            id: "court-guard-05",
            roster: "miniboss",
            x: 2250,
            y: 276,
            facing: -1,
            ai: { patrol: { minX: 2190, maxX: 2310 } },
          },
        ],
        pickups: [
          { id: "court-ofuda", x: 1240, y: 266, kind: "ammo", amount: 4 },
          { id: "court-yomogi", x: 1570, y: 266, kind: "health", amount: 28 },
          { id: "court-ofuda-east", x: 2260, y: 266, kind: "ammo", amount: 4 },
        ],
        encounters: [],
      },

      "castle-residence": {
        id: "castle-residence",
        chapterId: "castle",
        chapterTags: ["castle", "interior", "residence", "yomi-court"],
        regionId: "kai",
        settlementId: "tsuru",
        districtId: "tsuru-kurokawa",
        rosterPoolId: "kai-kurokawa-castle",
        label: "Résidence du daimyō",
        zoneKind: "building",
        environmentIndex: 2,
        backdropProfile: "castle-side-residence",
        sideBackdrop: {
          mode: "orthographic-modular-interior",
          environmentId: "daimyo-castle",
          projection: "lateral",
          layerOrder: ["sky", "far", "mid", "near"],
          lateralLayers: {
            ambient: "assets/modular/environments/daimyo-castle/layers/sky.png",
            distantDepth: "assets/modular/environments/daimyo-castle/layers/far.png",
            architecture: "assets/modular/environments/daimyo-castle/layers/mid.png",
            foregroundFrame: "assets/modular/environments/daimyo-castle/layers/near.png",
          },
          interiorOcclusion: "architecture-and-props",
          forbiddenAssets: ["assets/generated/environments/03-daimyo-castle-interior.png"],
        },
        groundVisual: "tatami-clean",
        width: 2400,
        minX: 6,
        maxX: 2379,
        cameraMinX: 0,
        routeMetrics: {
          mainRoute: "horizontalRooms",
          mainRouteLength: 2180,
          requiredClimb: 64,
          structuralFloors: 6,
          storeys: 2,
        },
        spawns: {
          lowerCourtReturn: { x: 120, y: PLAYER_GROUND_Y, facing: 1 },
          donjonReturn: { x: 2200, y: PLAYER_GROUND_Y, facing: -1 },
          archiveReturn: { x: 1480, y: PLAYER_GROUND_Y, facing: 1 },
        },
        groundSegments: [
          {
            id: "residence-ground-floor",
            x: 0,
            y: HORIZONTAL_GROUND_Y,
            w: 2400,
            h: 60,
            collision: "solid",
            surface: "tatami",
            routeRole: "main",
          },
        ],
        platforms: [
          {
            id: "residence-stair-lower",
            x: 620,
            y: 278,
            w: 72,
            h: 8,
            visualHeight: 24,
            tile: "step",
            owner: "escalier-bois",
            surface: "wood",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "residence-stair-upper",
            x: 680,
            y: 254,
            w: 72,
            h: 8,
            visualHeight: 24,
            tile: "step",
            owner: "escalier-bois",
            surface: "wood",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "residence-upper-floor-west",
            x: 744,
            y: 230,
            w: 360,
            h: 8,
            visualHeight: 28,
            tile: "ledge",
            surface: "cedar",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "residence-upper-bridge",
            x: 1104,
            y: 230,
            w: 180,
            h: 8,
            visualHeight: 24,
            tile: "beam",
            surface: "cedar",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "residence-upper-floor-east",
            x: 1284,
            y: 230,
            w: 390,
            h: 8,
            visualHeight: 28,
            tile: "ledge",
            surface: "cedar",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "residence-east-stairs",
            x: 1674,
            y: 258,
            w: 86,
            h: 8,
            visualHeight: 24,
            tile: "step",
            surface: "wood",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
        ],
        props: [
          ...architectureRun(
            "residence-shoji-wall",
            0,
            2400,
            ["mur-shoji"],
            176,
            { overlap: 10, depthBias: -35 },
          ),
          { id: "residence-alcove", file: "alcove-tatami", x: 470, width: 190, layer: "back", bottomY: 300, depthBias: -15 },
          { id: "residence-stairs", file: "escalier-bois", x: 620, width: 140, layer: "world" },
          { id: "residence-armor", file: "armure-vide", x: 920, width: 42, layer: "world" },
          { id: "residence-screen", file: "paravent-dechire", x: 1870, width: 96, layer: "front" },
          { id: "residence-brazier", file: "brasero-fer", x: 1810, width: 34, layer: "front" },
          { id: "residence-rack", file: "ratelier-vide", x: 2000, width: 88, layer: "world" },
        ],
        portals: [
          {
            id: "return-to-lower-court",
            linkId: "court-residence-door",
            x: 90,
            interactionRange: 52,
            collision: "solidDoor",
            blockX: 50,
            blockWidth: 80,
            type: "return",
            destination: {
              areaId: "castle-lower-court",
              spawnId: "residenceReturn",
            },
            state: "open",
            visual: "porte-laquee",
            label: "Cour basse",
            prompt: "E — SORTIR DANS LA COUR",
          },
          {
            id: "archive-fps",
            linkId: "archive-fps",
            x: 1540,
            interactionRange: 48,
            collision: "portal",
            type: "fps",
            mission: "daimyo-archive",
            missionIndex: 4,
            destination: { missionId: "daimyo-archive" },
            returnDestination: {
              areaId: "castle-residence",
              spawnId: "archiveReturn",
            },
            state: "closed",
            visual: "porte-laquee",
            label: "Archives scellées",
            prompt: "E — ENTRER DANS LES ARCHIVES",
            optional: true,
            persistentEncounterId: "daimyo-archive-secret",
          },
          {
            id: "corridor-to-donjon",
            linkId: "residence-donjon-corridor",
            x: 2260,
            interactionRange: 54,
            collision: "solidDoor",
            blockX: 2216,
            blockWidth: 88,
            type: "side",
            destination: {
              areaId: "castle-donjon",
              spawnId: "residenceReturn",
            },
            state: "closed",
            visual: "porte-chateau",
            label: "Couloir du donjon",
            prompt: "E — OUVRIR LE COULOIR",
          },
        ],
        enemies: [
          { id: "residence-guard-01", roster: "special", x: 360, y: 276, facing: -1 },
          { id: "residence-guard-02", roster: "special", x: 880, y: 206, facing: -1, platformId: "residence-upper-floor-west" },
          { id: "residence-guard-03", roster: "miniboss", x: 1230, y: 276, facing: -1 },
          { id: "residence-guard-04", roster: "special", x: 1430, y: 206, facing: -1, platformId: "residence-upper-floor-east" },
          { id: "residence-guard-05", roster: "special", x: 1980, y: 276, facing: -1 },
        ],
        pickups: [
          { id: "residence-ofuda", x: 790, y: 198, kind: "ammo", amount: 4 },
          { id: "residence-yomogi", x: 1350, y: 266, kind: "health", amount: 28 },
          { id: "residence-tamahagane", x: 1620, y: 198, kind: "tamahagane", amount: 1 },
        ],
        encounters: [],
      },

      "castle-donjon": {
        id: "castle-donjon",
        chapterId: "castle",
        chapterTags: ["castle", "interior", "donjon", "yomi-heart"],
        regionId: "kai",
        settlementId: "tsuru",
        districtId: "tsuru-kurokawa",
        rosterPoolId: "kai-kurokawa-castle",
        label: "Donjon supérieur",
        zoneKind: "castle",
        environmentIndex: 2,
        backdropProfile: "castle-side-donjon",
        sideBackdrop: {
          mode: "orthographic-modular-interior",
          environmentId: "daimyo-castle",
          projection: "lateral",
          layerOrder: ["sky", "far", "mid", "near"],
          lateralLayers: {
            ambient: "assets/modular/environments/daimyo-castle/layers/sky.png",
            distantDepth: "assets/modular/environments/daimyo-castle/layers/far.png",
            architecture: "assets/modular/environments/daimyo-castle/layers/mid.png",
            foregroundFrame: "assets/modular/environments/daimyo-castle/layers/near.png",
          },
          interiorOcclusion: "architecture-roots-and-props",
          forbiddenAssets: ["assets/generated/environments/03-daimyo-castle-interior.png"],
        },
        groundVisual: "tatami-tainted",
        width: 2500,
        minX: 6,
        maxX: 2479,
        cameraMinX: 0,
        routeMetrics: {
          mainRoute: "horizontalChambers",
          mainRouteLength: 2240,
          requiredClimb: 86,
          structuralFloors: 7,
          storeys: 3,
        },
        spawns: {
          residenceReturn: { x: 140, y: PLAYER_GROUND_Y, facing: 1 },
          fpsReturn: { x: 1045, y: PLAYER_GROUND_Y, facing: 1 },
          lowerCourtReturn: { x: 2138, y: PLAYER_GROUND_Y, facing: -1 },
          finalCheckpoint: { x: 1860, y: PLAYER_GROUND_Y, facing: 1 },
        },
        groundSegments: [
          {
            id: "donjon-ground-floor",
            x: 0,
            y: HORIZONTAL_GROUND_Y,
            w: 2500,
            h: 60,
            collision: "solid",
            surface: "tatami",
            routeRole: "main",
          },
        ],
        platforms: [
          {
            id: "donjon-stair-1",
            x: 420,
            y: 280,
            w: 76,
            h: 8,
            visualHeight: 24,
            tile: "step",
            owner: "escalier-bois",
            surface: "wood",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "donjon-stair-2",
            x: 480,
            y: 258,
            w: 76,
            h: 8,
            visualHeight: 24,
            tile: "step",
            owner: "escalier-bois",
            surface: "wood",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "donjon-floor-west",
            x: 550,
            y: 236,
            w: 360,
            h: 8,
            visualHeight: 28,
            tile: "ledge",
            surface: "cedar",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "donjon-central-beam",
            x: 910,
            y: 236,
            w: 210,
            h: 8,
            visualHeight: 24,
            tile: "beam",
            surface: "cedar",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "donjon-floor-east",
            x: 1120,
            y: 236,
            w: 380,
            h: 8,
            visualHeight: 28,
            tile: "ledge",
            surface: "cedar",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "donjon-upper-stair",
            x: 1490,
            y: 210,
            w: 92,
            h: 8,
            visualHeight: 24,
            tile: "step",
            surface: "wood",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
          {
            id: "donjon-upper-gallery",
            x: 1570,
            y: 184,
            w: 330,
            h: 8,
            visualHeight: 28,
            tile: "ledge",
            surface: "cedar",
            collision: "oneWay",
            routeRole: "structuralFloor",
          },
        ],
        props: [
          ...architectureRun(
            "donjon-shoji-wall",
            0,
            2500,
            ["mur-shoji"],
            176,
            { overlap: 10, depthBias: -35 },
          ),
          { id: "donjon-tower", file: "tour-chateau", x: 260, width: 220, layer: "back" },
          { id: "donjon-stairs", file: "escalier-bois", x: 420, width: 150, layer: "world" },
          { id: "donjon-armor", file: "armure-vide", x: 1040, width: 42, layer: "world" },
          { id: "donjon-screen", file: "paravent-dechire", x: 2320, width: 98, layer: "front" },
          { id: "donjon-roots-west", file: "racines-donjon", x: 1520, width: 96, layer: "world" },
          { id: "donjon-brazier", file: "brasero-fer", x: 320, width: 36, layer: "front" },
        ],
        portals: [
          {
            id: "return-to-residence",
            linkId: "residence-donjon-corridor",
            x: 100,
            interactionRange: 54,
            collision: "solidDoor",
            blockX: 56,
            blockWidth: 88,
            type: "return",
            destination: {
              areaId: "castle-residence",
              spawnId: "donjonReturn",
            },
            state: "open",
            visual: "porte-chateau",
            label: "Résidence",
            prompt: "E — REVENIR À LA RÉSIDENCE",
          },
          {
            id: "final-donjon-fps",
            linkId: "donjon-fps",
            x: 2190,
            approachX: 2138,
            blockX: 2148,
            blockWidth: 84,
            interactionRange: 66,
            collision: "solidDoor",
            type: "fps",
            mission: 1,
            destination: { missionId: "kurokawa-donjon" },
            returnDestination: {
              areaId: "castle-donjon",
              spawnId: "fpsReturn",
            },
            state: "closed",
            visual: "porte-chateau",
            label: "Salle du daimyō",
            prompt: "E — AFFRONTER LE DAIMYŌ",
            persistentEncounterId: "daimyo-donjon",
          },
        ],
        enemies: [
          { id: "donjon-guard-01", roster: "special", x: 330, y: 276, facing: -1 },
          { id: "donjon-guard-02", roster: "miniboss", x: 720, y: 212, facing: -1, platformId: "donjon-floor-west" },
          { id: "donjon-guard-03", roster: "special", x: 1180, y: 212, facing: -1, platformId: "donjon-floor-east" },
          { id: "donjon-guard-04", roster: "miniboss", x: 1660, y: 160, facing: -1, platformId: "donjon-upper-gallery" },
          {
            id: "donjon-guard-05",
            roster: "special",
            x: 2020,
            y: 276,
            facing: -1,
            ai: { patrol: { minX: 1952, maxX: 2035 } },
          },
        ],
        pickups: [
          { id: "donjon-ofuda", x: 820, y: 204, kind: "ammo", amount: 4 },
          { id: "donjon-yomogi", x: 1450, y: 266, kind: "health", amount: 28 },
          { id: "donjon-cinder", x: 1760, y: 152, kind: "yomiAsh", amount: 1 },
        ],
        checkpoints: [
          {
            id: "donjon-final-checkpoint",
            x: 1860,
            spawnId: "finalCheckpoint",
            persistent: true,
          },
        ],
        encounters: [],
      },
    },
  };

  const PLATFORM_OWNER_OVERRIDES = {
    "burned-house-roof": "burned-minka-west",
    "west-watch-balcony": "watchtower-west",
    "intact-house-awning": "intact-minka",
    "rice-storehouse-roof": "rice-storehouse",
    "broken-cart-shortcut": "broken-cart",
    "haystack-shortcut": "hay-access",
    "back-cart": "back-cart-01",
    "back-minka-roof": "back-minka-02",
    "back-kura-awning": "back-kura",
    "market-cart-shortcut": "market-cart",
    "market-house-secret": "market-house",
    "castle-tower-lower": "lower-court-tower",
    "residence-stair-lower": "residence-stairs",
    "residence-stair-upper": "residence-stairs",
    "donjon-stair-1": "donjon-stairs",
    "donjon-stair-2": "donjon-stairs",
  };

  function surfaceProfileId(surface, area) {
    const value = String(surface || "").toLowerCase();
    if (value.includes("tatami")) return "tatami";
    if (value.includes("root")) return "infectedRoots";
    if (value.includes("tech")) return "techMetal";
    if (value.includes("asphalt") || value.includes("concrete")) return "asphalt";
    if (value.includes("metal")) return "metal";
    if (value.includes("stone") || value.includes("pierre")) return "castleStone";
    if (value.includes("thatch") || value.includes("chaume")) return "thatchRoof";
    if (value.includes("roof") || value.includes("tuile")) return "ceramicRoof";
    if (area.environmentIndex === 2) return "castleCedar";
    return "villageWood";
  }

  function groundSurfaceProfileId(surface, area) {
    const value = String(surface || "").toLowerCase();
    if (value.includes("tech")) return "techStreet";
    if (value.includes("asphalt") || value.includes("concrete")) return "asphalt";
    if (value.includes("metal")) return "metal";
    if (value.includes("stone") || value.includes("pierre")) return "castleStone";
    if (value.includes("tatami")) return "tatami";
    if (area.environmentIndex === 2) return "castleStone";
    return "earthRoad";
  }

  function propSurfaceProfileId(prop, area) {
    const file = String(prop.file || "").toLowerCase();
    if (/mur-pierre|puits-pierre/.test(file)) return "castleStone";
    if (/racines|yomi/.test(file)) return "infectedRoots";
    if (/minka|kura|tour-guet/.test(file)) return "ceramicRoof";
    if (/tas-paille/.test(file)) return "thatchRoof";
    if (area.environmentIndex === 2) return "castleCedar";
    return "villageWood";
  }

  function resolvePlatformOwner(area, platform) {
    const override = PLATFORM_OWNER_OVERRIDES[platform.id];
    if (override) return override;
    if (!platform.owner) return null;
    const byId = area.props.find((prop) => prop.id === platform.owner);
    if (byId) return byId.id;
    const byFile = area.props.filter((prop) => prop.file === platform.owner);
    if (byFile.length === 1) return byFile[0].id;
    if (byFile.length > 1) {
      const center = platform.x + platform.w / 2;
      return byFile
        .slice()
        .sort((left, right) =>
          Math.abs(left.x + left.width / 2 - center) - Math.abs(right.x + right.width / 2 - center))[0].id;
    }
    return null;
  }

  function normalizeAreaVisualData(area) {
    area.visualDataVersion = 2;
    area.factionIds = area.factionIds || KageLevels.rosterPools[area.rosterPoolId]?.factions || [];
    area.fpsMaterialProfileIds = (area.portals || [])
      .map((portal) => portal.destination?.missionId)
      .filter((missionId) => FPS_MATERIAL_LIBRARY.profiles[missionId]);

    for (const ground of area.groundSegments || []) {
      ground.depthBand = ground.depthBand || "gameplay-ground";
      ground.baseline = ground.baseline || `ground-${ground.y}`;
      ground.baselineY = ground.baselineY ?? ground.y;
      ground.surfaceProfile = ground.surfaceProfile
        || groundSurfaceProfileId(ground.surface, area);
      ground.colliderProfile = ground.colliderProfile || {
        type: "solidGround",
        x: ground.x,
        y: ground.y,
        width: ground.w,
        height: ground.h,
      };
    }

    for (const platform of area.platforms || []) {
      const ownerPropId = platform.ownerPropId || resolvePlatformOwner(area, platform);
      if (ownerPropId) platform.ownerPropId = ownerPropId;
      platform.depthBand = platform.depthBand || "gameplay-surface";
      platform.baseline = platform.baseline || `surface-${platform.y}`;
      platform.baselineY = platform.baselineY ?? platform.y;
      platform.surfaceProfile = platform.surfaceProfile || surfaceProfileId(platform.surface, area);
      platform.colliderProfile = platform.colliderProfile || {
        type: platform.collision || "oneWay",
        x: platform.x,
        y: platform.y,
        width: platform.w,
        height: platform.h,
        topSurfaceOnly: platform.collision === "oneWay",
      };
      platform.visualSource = platform.visualSource || (
        platform.visual === false
          ? { mode: "ownerProp", propId: ownerPropId }
          : { mode: "platformTile", tile: platform.tile || "ledge" }
      );
    }

    for (const prop of area.props || []) {
      const ownedPlatforms = (area.platforms || []).filter((platform) => platform.ownerPropId === prop.id);
      const gameplayOwned = ownedPlatforms.length > 0;
      const depthBand = prop.depthBand || (
        prop.layer === "front"
          ? "foreground"
          : (gameplayOwned
            ? (prop.layer === "world" ? "gameplay-prop" : "gameplay-architecture")
            : (prop.layer === "back"
              ? "back-architecture"
              : (/puits|brasero|foyer|autel|racines/.test(String(prop.file || ""))
                ? "world-near"
                : "world-mid")))
      );
      const band = DEPTH_BANDS[depthBand] || DEPTH_BANDS["world-mid"];
      prop.depthBand = depthBand;
      prop.bottomY = prop.visualGroundY ?? band.groundY ?? prop.bottomY ?? band.baselineY;
      prop.baselineY = prop.baselineY ?? band.baselineY ?? prop.bottomY;
      prop.baseline = prop.baseline || `ground-${prop.bottomY}`;
      prop.perspectiveScale = prop.perspectiveScale ?? band.perspectiveScale;
      prop.depthBias = Number.isFinite(prop.depthBias)
        ? prop.depthBias
        : (band.depthBias || 0);
      prop.groundAnchor = Array.isArray(prop.groundAnchor)
        ? prop.groundAnchor
        : [0.5, 1];
      prop.contactMode = prop.contactMode || "opaque-bottom";
      prop.surfaceProfile = prop.surfaceProfile || propSurfaceProfileId(prop, area);
      prop.colliderProfile = prop.colliderProfile || (
        gameplayOwned
          ? {
            type: "platformOwned",
            platformIds: ownedPlatforms.map((platform) => platform.id),
            blocksMovement: false,
          }
          : {
            type: prop.destructible ? "destructibleVisual" : "visualOnly",
            blocksMovement: false,
          }
      );
    }

    for (const enemy of area.enemies || []) {
      enemy.regionId = enemy.regionId || area.regionId;
      enemy.settlementId = enemy.settlementId || area.settlementId;
      enemy.districtId = enemy.districtId || area.districtId;
      enemy.chapterId = enemy.chapterId || area.chapterId;
      enemy.rosterPoolId = enemy.rosterPoolId || area.rosterPoolId;
      enemy.factionIds = enemy.factionIds || area.factionIds;
      enemy.baseline = enemy.baseline || (enemy.platformId ? `platform-${enemy.platformId}` : "ground-300");
    }
  }

  /*
   * Extension jouable du monde. Ces zones utilisent les mêmes contrats
   * spatiaux que Kurokawa : route principale horizontale, plateformes
   * optionnelles attachées à des props identifiés et passages manuels.
   * Elles restent déclaratives afin que la carte, la sauvegarde et les
   * aperçus puissent charger exactement la même géographie.
   */
  function campaignPortal(
    id,
    x,
    destination,
    label,
    prompt,
    visual = "route-torii",
  ) {
    return {
      id,
      linkId: id,
      x,
      interactionRange: 58,
      collision: "portal",
      type: "side",
      destination,
      state: "open",
      visual,
      label,
      prompt,
    };
  }

  function campaignArea({
    id,
    chapterId,
    label,
    objective,
    objectivePortalId,
    environmentIndex,
    rosterPoolId,
    width = 3200,
    spawns,
    props,
    platforms,
    portals,
    enemies,
    surface = "earth",
    regionId = "kai",
    settlementId = "tsuru",
    districtId = id,
    chapterTags = [],
    continuityProfile,
  }) {
    return {
      id,
      chapterId,
      chapterTags,
      regionId,
      settlementId,
      districtId,
      rosterPoolId,
      label,
      objective,
      objectivePortalId,
      zoneKind: "outdoor",
      continuityProfile,
      environmentIndex,
      width,
      minX: 6,
      maxX: width - 21,
      cameraMinX: 0,
      routeMetrics: {
        mainRoute: "horizontal",
        mainRouteLength: width - 80,
        requiredClimb: 0,
        optionalUpperRoutes: platforms.length,
      },
      spawns,
      groundSegments: [
        {
          id: `${id}-ground`,
          x: 0,
          y: HORIZONTAL_GROUND_Y,
          w: width,
          h: 60,
          collision: "solid",
          surface,
          routeRole: "main",
        },
      ],
      platforms,
      props,
      portals,
      enemies,
      pickups: [
        { id: `${id}-ofuda-west`, x: 720, y: 266, kind: "ammo", amount: 3 },
        { id: `${id}-yomogi`, x: Math.round(width * 0.52), y: 266, kind: "health", amount: 24 },
        { id: `${id}-ofuda-east`, x: width - 620, y: 266, kind: "ammo", amount: 3 },
      ],
      checkpoints: [
        {
          id: `${id}-checkpoint`,
          x: Math.round(width * 0.5),
          spawnId: "checkpoint",
          persistent: true,
        },
      ],
      encounters: [],
    };
  }

  Object.assign(KageLevels.rosterPools, {
    "kai-forest-route": {
      chapterTags: ["forest", "kaido", "yomi-infected"],
      factions: ["shogunate-expedition", "yomi-infected"],
      regular: [
        "r06-yama-woodcutter",
        "r09-haka-digger",
        "r20-komuso-wanderer",
      ],
      special: ["s05-raimei-yamabushi", "s19-wana-trapper"],
      miniboss: ["mb-09-pisteur-kegare"],
    },
    "kai-bamboo-route": {
      chapterTags: ["bamboo", "shigure", "yomi-infected"],
      factions: ["shogunate-expedition", "yomi-infected"],
      regular: ["r14-kaido-bandit", "r20-komuso-wanderer"],
      special: ["s01-kusa-shinobi", "s02-doku-kunoichi", "s16-kage-mai-dancer"],
      miniboss: ["mb-06-shinobi-brumes"],
    },
    "tsuru-fields-route": {
      chapterTags: ["rice-fields", "irrigation", "yomi-infected"],
      factions: ["tsuru-farmers", "yomi-infected"],
      regular: ["r05-kome-porter", "r17-umaya-groom", "r19-kago-bearer"],
      special: ["s13-kegare-sumotori", "s19-wana-trapper"],
      miniboss: ["mb-17-sumotori-namazu"],
    },
    "tokyo-contemporary-rift": {
      chapterTags: ["contemporary", "quarantine", "temporal-rift"],
      factions: ["tokyo-response", "yomi-infected"],
      regular: ["new-modern-commuter"],
      special: ["new-modern-riot-host", "new-modern-response-officer"],
      miniboss: [],
    },
    "neo-edo-cyber-rift": {
      chapterTags: ["cyberpunk", "neo-edo", "temporal-rift"],
      factions: ["neo-edo-security", "yomi-infected"],
      regular: ["new-cyber-neon-shinobi"],
      special: ["new-cyber-drone-corpse", "new-cyber-oni-frame"],
      miniboss: [],
    },
  });

  Object.assign(KageLevels.areas, {
    "kai-forest-pass": campaignArea({
      id: "kai-forest-pass",
      objectivePortalId: "forest-to-bamboo",
      chapterId: "forest",
      label: "Forêt noyée de Kai",
      objective: "Traverser le col forestier et rejoindre la bambouseraie de Shigure",
      environmentIndex: 5,
      rosterPoolId: "kai-forest-route",
      width: 3300,
      continuityProfile: "natural-canopy",
      chapterTags: ["forest", "kaido", "act-01"],
      spawns: {
        prologue: { x: 120, y: PLAYER_GROUND_Y, facing: 1 },
        westReturn: { x: 150, y: PLAYER_GROUND_Y, facing: 1 },
        eastReturn: { x: 3120, y: PLAYER_GROUND_Y, facing: -1 },
        checkpoint: { x: 1650, y: PLAYER_GROUND_Y, facing: 1 },
      },
      platforms: [
        { id: "forest-cart-top", x: 548, y: 258, w: 92, h: 8, visual: false, owner: "forest-cart", surface: "wood", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "forest-log-top", x: 1000, y: 256, w: 176, h: 8, visual: false, owner: "forest-hollow-log", surface: "wood", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "forest-shelter-roof", x: 1570, y: 218, w: 188, h: 8, visual: false, owner: "forest-shelter", surface: "thatch", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "forest-root-bridge", x: 2180, y: 246, w: 172, h: 8, tile: "ledge", surface: "root", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "forest-cave-step", x: 2790, y: 252, w: 112, h: 8, tile: "step", surface: "stone", collision: "oneWay", routeRole: "optionalUpper" },
      ],
      props: [
        { id: "forest-cedar-west", file: "ancient-cedar-trunk", x: 210, width: 124, layer: "back" },
        { id: "forest-cart", file: "woodcutter-cart", x: 525, width: 124, layer: "world" },
        { id: "forest-logs", file: "stacked-logs", x: 760, width: 118, layer: "world" },
        { id: "forest-hollow-log", file: "hollow-fallen-log", x: 980, width: 214, layer: "world" },
        { id: "forest-lantern-west", file: "moss-stone-lantern", x: 1320, width: 42, layer: "world" },
        { id: "forest-shelter", file: "charcoal-burner-shelter", x: 1545, width: 238, layer: "back" },
        { id: "forest-campfire", file: "campfire-ring", x: 1870, width: 62, layer: "world" },
        { id: "forest-roots", file: "infected-root-cluster", x: 2180, width: 170, layer: "world" },
        { id: "forest-spring", file: "forest-spring-basin", x: 2440, width: 86, layer: "world" },
        { id: "forest-tent", file: "collapsed-quarantine-tent", x: 2610, width: 132, layer: "back" },
        { id: "forest-cave", file: "yomi-cave-arch", x: 2860, width: 170, layer: "back" },
        { id: "forest-ward-east", file: "rope-ward-gate", x: 3090, width: 102, layer: "world" },
      ],
      portals: [
        campaignPortal(
          "forest-to-bamboo",
          3200,
          { areaId: "shigure-bamboo-grove", spawnId: "westReturn" },
          "Bambouseraie de Shigure",
          "E — SUIVRE LE SENTIER DE BAMBOUS",
        ),
      ],
      enemies: [
        { id: "forest-enemy-01", rosterId: "r06-yama-woodcutter", x: 470, y: 276, facing: -1 },
        { id: "forest-enemy-02", rosterId: "s19-wana-trapper", x: 830, y: 276, facing: -1 },
        { id: "forest-enemy-03", rosterId: "r20-komuso-wanderer", x: 1210, y: 276, facing: -1 },
        { id: "forest-enemy-04", rosterId: "s05-raimei-yamabushi", x: 1510, y: 276, facing: -1 },
        { id: "forest-enemy-05", rosterId: "r09-haka-digger", x: 2020, y: 276, facing: -1 },
        { id: "forest-enemy-06", rosterId: "mb-09-pisteur-kegare", roster: "miniboss", x: 2540, y: 276, facing: -1 },
        { id: "forest-enemy-07", rosterId: "r06-yama-woodcutter", x: 3000, y: 276, facing: -1 },
      ],
    }),

    "shigure-bamboo-grove": campaignArea({
      id: "shigure-bamboo-grove",
      objectivePortalId: "bamboo-to-fields",
      chapterId: "bamboo",
      label: "Bambouseraie de Shigure",
      objective: "Suivre le sentier de bambous jusqu’aux rizières de Tsuru",
      environmentIndex: 1,
      rosterPoolId: "kai-bamboo-route",
      width: 3200,
      continuityProfile: "bamboo-curtain",
      chapterTags: ["bamboo", "shrine", "act-02"],
      spawns: {
        westReturn: { x: 140, y: PLAYER_GROUND_Y, facing: 1 },
        eastReturn: { x: 3020, y: PLAYER_GROUND_Y, facing: -1 },
        checkpoint: { x: 1600, y: PLAYER_GROUND_Y, facing: 1 },
      },
      platforms: [
        { id: "bamboo-bridge-top", x: 515, y: 256, w: 172, h: 8, visual: false, owner: "bamboo-bridge", surface: "wood", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "bamboo-cut-stack", x: 930, y: 252, w: 130, h: 8, tile: "ledge", surface: "bamboo", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "bamboo-shrine-roof", x: 1530, y: 214, w: 206, h: 8, visual: false, owner: "bamboo-shrine", surface: "roofTile", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "bamboo-root-platform", x: 2130, y: 244, w: 180, h: 8, tile: "ledge", surface: "root", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "bamboo-torii-beam", x: 2670, y: 230, w: 146, h: 8, visual: false, owner: "bamboo-grand-torii", surface: "wood", collision: "oneWay", routeRole: "optionalUpper" },
      ],
      props: [
        { id: "bamboo-west-wall", file: "bambous-hauts", x: 80, width: 116, layer: "back" },
        { id: "bamboo-stone-lantern-west", file: "lanterne-pierre", x: 330, width: 40, layer: "world" },
        { id: "bamboo-bridge", file: "pont-bois", x: 500, width: 196, layer: "world" },
        { id: "bamboo-cut-west", file: "bambous-coupes", x: 900, width: 150, layer: "world" },
        { id: "bamboo-small-torii", file: "petit-torii", x: 1210, width: 102, layer: "back" },
        { id: "bamboo-shrine", file: "sanctuaire-rural", x: 1495, width: 250, layer: "back" },
        { id: "bamboo-basin", file: "bassin-purification", x: 1810, width: 70, layer: "world" },
        { id: "bamboo-roots", file: "racines-contaminees", x: 2110, width: 196, layer: "world" },
        { id: "bamboo-bell", file: "cloche-sanctuaire", x: 2390, width: 84, layer: "world" },
        { id: "bamboo-grand-torii", file: "grand-torii", x: 2640, width: 190, layer: "back" },
        { id: "bamboo-ritual-barrier", file: "barriere-rituelle", x: 2930, width: 126, layer: "world" },
      ],
      portals: [
        campaignPortal(
          "bamboo-to-forest",
          90,
          { areaId: "kai-forest-pass", spawnId: "eastReturn" },
          "Forêt de Kai",
          "E — REVENIR DANS LA FORÊT",
        ),
        campaignPortal(
          "bamboo-to-fields",
          3090,
          { areaId: "tsuru-rice-fields", spawnId: "westReturn" },
          "Rizières de Tsuru",
          "E — DESCENDRE VERS LES RIZIÈRES",
        ),
      ],
      enemies: [
        { id: "bamboo-enemy-01", rosterId: "r14-kaido-bandit", x: 410, y: 276, facing: -1 },
        { id: "bamboo-enemy-02", rosterId: "s01-kusa-shinobi", x: 760, y: 276, facing: -1 },
        { id: "bamboo-enemy-03", rosterId: "s02-doku-kunoichi", x: 1120, y: 276, facing: -1 },
        { id: "bamboo-enemy-04", rosterId: "r20-komuso-wanderer", x: 1510, y: 276, facing: -1 },
        { id: "bamboo-enemy-05", rosterId: "s16-kage-mai-dancer", x: 1980, y: 276, facing: -1 },
        { id: "bamboo-enemy-06", rosterId: "mb-06-shinobi-brumes", roster: "miniboss", x: 2460, y: 276, facing: -1 },
        { id: "bamboo-enemy-07", rosterId: "s01-kusa-shinobi", x: 2880, y: 276, facing: -1 },
      ],
    }),

    "tsuru-rice-fields": campaignArea({
      id: "tsuru-rice-fields",
      objectivePortalId: "fields-to-kurokawa",
      chapterId: "fields",
      label: "Rizières de Tsuru",
      objective: "Franchir les rizières et gagner la porte ouest de Kurokawa",
      environmentIndex: 6,
      rosterPoolId: "tsuru-fields-route",
      width: 3400,
      continuityProfile: "rural-horizon",
      chapterTags: ["rice-fields", "irrigation", "act-03"],
      spawns: {
        westReturn: { x: 140, y: PLAYER_GROUND_Y, facing: 1 },
        eastReturn: { x: 3220, y: PLAYER_GROUND_Y, facing: -1 },
        checkpoint: { x: 1700, y: PLAYER_GROUND_Y, facing: 1 },
      },
      platforms: [
        { id: "fields-cart-top", x: 510, y: 258, w: 132, h: 8, visual: false, owner: "fields-cart", surface: "wood", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "fields-bridge-top", x: 1050, y: 252, w: 176, h: 8, visual: false, owner: "fields-bridge", surface: "wood", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "fields-hut-roof", x: 1640, y: 216, w: 200, h: 8, visual: false, owner: "fields-hut", surface: "thatch", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "fields-bales-top", x: 2300, y: 250, w: 150, h: 8, visual: false, owner: "fields-bales", surface: "thatch", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "fields-granary-roof", x: 2780, y: 214, w: 196, h: 8, visual: false, owner: "fields-granary", surface: "roofTile", collision: "oneWay", routeRole: "optionalUpper" },
      ],
      props: [
        { id: "fields-wheel", file: "irrigation-water-wheel", x: 190, width: 150, layer: "back" },
        { id: "fields-cart", file: "farm-cart", x: 485, width: 176, layer: "world" },
        { id: "fields-sheaf", file: "bound-rice-sheaf", x: 760, width: 90, layer: "world" },
        { id: "fields-bridge", file: "field-footbridge", x: 1020, width: 224, layer: "world" },
        { id: "fields-sluice", file: "irrigation-sluice", x: 1340, width: 112, layer: "world" },
        { id: "fields-hut", file: "field-hut", x: 1600, width: 250, layer: "back" },
        { id: "fields-scarecrow", file: "scarecrow", x: 2000, width: 84, layer: "world" },
        { id: "fields-bales", file: "straw-bales", x: 2270, width: 182, layer: "world" },
        { id: "fields-fire", file: "burning-crop-pile", x: 2530, width: 100, layer: "world" },
        { id: "fields-granary", file: "wooden-granary", x: 2740, width: 238, layer: "back" },
        { id: "fields-marker", file: "field-marker", x: 3090, width: 54, layer: "world" },
        { id: "fields-yomi-torii", file: "yomi-warp-torii", x: 3220, width: 140, layer: "back" },
      ],
      portals: [
        campaignPortal(
          "fields-to-bamboo",
          90,
          { areaId: "shigure-bamboo-grove", spawnId: "eastReturn" },
          "Bambouseraie de Shigure",
          "E — REVENIR À LA BAMBOUSERAIE",
        ),
        campaignPortal(
          "fields-to-kurokawa",
          3290,
          { areaId: "kurokawa-main-street", spawnId: "prologue" },
          "Ville fortifiée de Kurokawa",
          "E — ENTRER DANS KUROKAWA",
        ),
      ],
      enemies: [
        { id: "fields-enemy-01", rosterId: "r05-kome-porter", x: 430, y: 276, facing: -1 },
        { id: "fields-enemy-02", rosterId: "r17-umaya-groom", x: 820, y: 276, facing: -1 },
        { id: "fields-enemy-03", rosterId: "s19-wana-trapper", x: 1190, y: 276, facing: -1 },
        { id: "fields-enemy-04", rosterId: "r19-kago-bearer", x: 1600, y: 276, facing: -1 },
        { id: "fields-enemy-05", rosterId: "s13-kegare-sumotori", x: 2100, y: 276, facing: -1 },
        { id: "fields-enemy-06", rosterId: "mb-17-sumotori-namazu", roster: "miniboss", x: 2580, y: 276, facing: -1 },
        { id: "fields-enemy-07", rosterId: "r05-kome-porter", x: 3090, y: 276, facing: -1 },
      ],
    }),

    "tokyo-contemporary-rift": campaignArea({
      id: "tokyo-contemporary-rift",
      objectivePortalId: "modern-to-cyber",
      chapterId: "contemporary",
      label: "Tokyo contemporain — quarantaine Yomi",
      objective: "Rompre le cordon de quarantaine et atteindre la faille vers Neo-Edo",
      environmentIndex: 3,
      rosterPoolId: "tokyo-contemporary-rift",
      width: 3300,
      continuityProfile: "urban-facades",
      regionId: "tokyo",
      settlementId: "tokyo",
      districtId: "rift-quarantine",
      surface: "asphalt",
      chapterTags: ["contemporary", "temporal-rift", "end-game-01"],
      spawns: {
        warpArrival: { x: 130, y: PLAYER_GROUND_Y, facing: 1 },
        checkpoint: { x: 1650, y: PLAYER_GROUND_Y, facing: 1 },
      },
      platforms: [
        { id: "modern-car-top", x: 650, y: 258, w: 150, h: 8, visual: false, owner: "modern-emergency-car", surface: "metal", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "modern-koban-roof", x: 1030, y: 216, w: 190, h: 8, visual: false, owner: "modern-koban", surface: "roofTile", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "modern-scaffold-mid", x: 1510, y: 236, w: 210, h: 8, visual: false, owner: "modern-scaffold", surface: "metal", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "modern-station-canopy", x: 2140, y: 224, w: 230, h: 8, tile: "ledge", surface: "metal", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "modern-barrier-step", x: 2740, y: 260, w: 120, h: 8, tile: "short", surface: "metal", collision: "oneWay", routeRole: "optionalUpper" },
      ],
      props: [
        { id: "modern-warp", file: "yomi-warp-arch", x: 70, width: 150, layer: "back" },
        { id: "modern-metro", file: "metro-entrance", x: 300, width: 190, layer: "back" },
        { id: "modern-vending", file: "vending-machine", x: 540, width: 52, layer: "world" },
        { id: "modern-emergency-car", file: "emergency-car", x: 625, width: 190, layer: "world" },
        { id: "modern-koban", file: "koban", x: 995, width: 250, layer: "back" },
        { id: "modern-pole", file: "utility-pole", x: 1320, width: 54, layer: "world" },
        { id: "modern-scaffold", file: "construction-scaffold", x: 1470, width: 280, layer: "back" },
        { id: "modern-generator", file: "emergency-generator", x: 1840, width: 108, layer: "world" },
        { id: "modern-shrine", file: "neighborhood-shrine", x: 2020, width: 180, layer: "back" },
        { id: "modern-bicycle", file: "city-bicycle", x: 2360, width: 90, layer: "world" },
        { id: "modern-barrier", file: "quarantine-barrier", x: 2690, width: 180, layer: "world" },
        { id: "modern-pump", file: "rainwater-pump", x: 2990, width: 90, layer: "world" },
      ],
      portals: [
        campaignPortal(
          "modern-to-cyber",
          3190,
          { areaId: "neo-edo-cyber-rift", spawnId: "warpArrival" },
          "Faille vers Neo-Edo",
          "E — TRAVERSER LA FAILLE TEMPORELLE",
        ),
      ],
      enemies: [
        { id: "modern-enemy-01", rosterId: "new-modern-commuter", x: 460, y: 276, facing: -1 },
        { id: "modern-enemy-02", rosterId: "new-modern-riot-host", roster: "special", x: 820, y: 276, facing: -1 },
        { id: "modern-enemy-03", rosterId: "new-modern-response-officer", roster: "special", x: 1210, y: 276, facing: -1 },
        { id: "modern-enemy-04", rosterId: "new-modern-commuter", x: 1620, y: 276, facing: -1 },
        { id: "modern-enemy-05", rosterId: "new-modern-riot-host", roster: "special", x: 2060, y: 276, facing: -1 },
        { id: "modern-enemy-06", rosterId: "new-modern-response-officer", roster: "special", x: 2520, y: 276, facing: -1 },
        { id: "modern-enemy-07", rosterId: "new-modern-commuter", x: 3000, y: 276, facing: -1 },
      ],
    }),

    "neo-edo-cyber-rift": campaignArea({
      id: "neo-edo-cyber-rift",
      objectivePortalId: "cyber-yomi-core",
      chapterId: "cyberpunk",
      label: "Neo-Edo — secteur du Shōgun Zéro",
      objective: "Traverser le secteur et localiser le cœur de la faille Yomi",
      environmentIndex: 4,
      rosterPoolId: "neo-edo-cyber-rift",
      width: 3500,
      continuityProfile: "urban-facades",
      regionId: "neo-edo",
      settlementId: "neo-tokyo",
      districtId: "shogun-zero-sector",
      surface: "techStreet",
      chapterTags: ["cyberpunk", "temporal-rift", "end-game-02"],
      spawns: {
        warpArrival: { x: 130, y: PLAYER_GROUND_Y, facing: 1 },
        checkpoint: { x: 1750, y: PLAYER_GROUND_Y, facing: 1 },
      },
      platforms: [
        { id: "cyber-crate-top", x: 590, y: 258, w: 110, h: 8, visual: false, owner: "cyber-crate", surface: "metal", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "cyber-transit-roof", x: 1020, y: 216, w: 220, h: 8, visual: false, owner: "cyber-transit", surface: "metal", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "cyber-catwalk", x: 1540, y: 228, w: 260, h: 8, tile: "ledge", surface: "metal", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "cyber-shrine-roof", x: 2160, y: 214, w: 230, h: 8, visual: false, owner: "cyber-shrine", surface: "metal", collision: "oneWay", routeRole: "optionalUpper" },
        { id: "cyber-relay-step", x: 2860, y: 252, w: 150, h: 8, tile: "short", surface: "metal", collision: "oneWay", routeRole: "optionalUpper" },
      ],
      props: [
        { id: "cyber-warp", file: "temporal-torii", x: 70, width: 160, layer: "back" },
        { id: "cyber-terminal", file: "vending-terminal", x: 340, width: 74, layer: "world" },
        { id: "cyber-crate", file: "sealed-cargo-crate", x: 560, width: 140, layer: "world" },
        { id: "cyber-transit", file: "transit-access-gate", x: 980, width: 260, layer: "back" },
        { id: "cyber-vent", file: "ventilation-tower", x: 1330, width: 120, layer: "back" },
        { id: "cyber-coolant", file: "coolant-pipe", x: 1550, width: 230, layer: "world" },
        { id: "cyber-drone-dock", file: "drone-charging-dock", x: 1890, width: 132, layer: "world" },
        { id: "cyber-shrine", file: "shrine-tech-altar", x: 2120, width: 260, layer: "back" },
        { id: "cyber-lantern", file: "cyber-shrine-lantern", x: 2490, width: 62, layer: "world" },
        { id: "cyber-maglev", file: "maglev-maintenance-car", x: 2670, width: 250, layer: "world" },
        { id: "cyber-relay", file: "damaged-power-relay", x: 3050, width: 120, layer: "world" },
        { id: "cyber-energy-post", file: "energy-barrier-post", x: 3290, width: 66, layer: "world" },
      ],
      portals: [
        {
          id: "cyber-yomi-core",
          linkId: "cyber-yomi-core",
          x: 3390,
          interactionRange: 64,
          collision: "portal",
          type: "ending",
          state: "open",
          label: "Cœur de la faille Yomi",
          prompt: "E — SCELLER LA FAILLE À TRAVERS LES SIÈCLES",
        },
      ],
      enemies: [
        { id: "cyber-enemy-01", rosterId: "new-cyber-neon-shinobi", x: 430, y: 276, facing: -1 },
        { id: "cyber-enemy-02", rosterId: "new-cyber-drone-corpse", roster: "special", x: 820, y: 276, facing: -1 },
        { id: "cyber-enemy-03", rosterId: "new-cyber-oni-frame", roster: "special", x: 1260, y: 276, facing: -1 },
        { id: "cyber-enemy-04", rosterId: "new-cyber-neon-shinobi", x: 1730, y: 276, facing: -1 },
        { id: "cyber-enemy-05", rosterId: "new-cyber-drone-corpse", roster: "special", x: 2200, y: 276, facing: -1 },
        { id: "cyber-enemy-06", rosterId: "new-cyber-oni-frame", roster: "special", x: 2700, y: 276, facing: -1 },
        { id: "cyber-enemy-07", rosterId: "new-cyber-neon-shinobi", x: 3200, y: 276, facing: -1 },
      ],
    }),
  });

  /*
   * Les onze zones historiques restent les ancres de compatibilite des
   * sauvegardes. Les dix-sept zones ci-dessous completent la campagne sans
   * dupliquer une aire : le contrat 7 actes / 28 zones pointe vers vingt-huit
   * identifiants runtime uniques.
   *
   * Les compositions reutilisent uniquement les sprites livres dans les sept
   * banques d'environnement. Les arches, torii et portes decoratives restent
   * visualOnly ; seules les entrees de `area.portals` peuvent changer de zone.
   */
  const RUNTIME_PROP_WIDTHS = {
    "ancient-cedar-trunk": 124,
    "hollow-fallen-log": 214,
    "charcoal-burner-shelter": 238,
    "moss-stone-lantern": 42,
    "woodcutter-cart": 124,
    "stacked-logs": 118,
    "rope-ward-gate": 102,
    "forest-spring-basin": 86,
    "collapsed-quarantine-tent": 132,
    "infected-root-cluster": 170,
    "campfire-ring": 62,
    "yomi-cave-arch": 170,
    "grand-torii": 190,
    "petit-torii": 102,
    "sanctuaire-rural": 250,
    "lanterne-pierre": 40,
    "bassin-purification": 70,
    "bambous-hauts": 116,
    "bambous-coupes": 150,
    "pont-bois": 196,
    "barriere-rituelle": 126,
    "racines-contaminees": 196,
    "cloche-sanctuaire": 84,
    "autel-purification": 84,
    "field-hut": 250,
    "irrigation-water-wheel": 150,
    "farm-cart": 176,
    "bound-rice-sheaf": 90,
    "irrigation-sluice": 112,
    "field-footbridge": 224,
    scarecrow: 84,
    "wooden-granary": 238,
    "straw-bales": 182,
    "field-marker": 54,
    "burning-crop-pile": 100,
    "yomi-warp-torii": 140,
    "tour-guet-kurokawa": 82,
    "porte-chateau": 190,
    "tour-chateau": 210,
    "mur-shoji": 176,
    "pilier-cedre": 54,
    "brasero-fer": 54,
    "porte-laquee": 132,
    "armure-vide": 68,
    "ratelier-vide": 130,
    "paravent-dechire": 126,
    "escalier-bois": 180,
    "alcove-tatami": 210,
    "racines-donjon": 190,
    "metro-entrance": 190,
    koban: 250,
    "vending-machine": 52,
    "utility-pole": 54,
    "quarantine-barrier": 180,
    "city-bicycle": 90,
    "emergency-car": 190,
    "neighborhood-shrine": 180,
    "construction-scaffold": 280,
    "emergency-generator": 108,
    "rainwater-pump": 90,
    "yomi-warp-arch": 150,
    "temporal-torii": 160,
    "shrine-tech-altar": 260,
    "ventilation-tower": 120,
    "energy-barrier-post": 66,
    "maglev-maintenance-car": 250,
    "drone-charging-dock": 132,
    "sealed-cargo-crate": 140,
    "vending-terminal": 74,
    "coolant-pipe": 230,
    "cyber-shrine-lantern": 62,
    "transit-access-gate": 260,
    "damaged-power-relay": 120,
  };

  const RUNTIME_PLATFORM_TOPS = {
    "hollow-fallen-log": 256,
    "charcoal-burner-shelter": 218,
    "woodcutter-cart": 258,
    "stacked-logs": 252,
    "infected-root-cluster": 244,
    "sanctuaire-rural": 214,
    "bambous-coupes": 252,
    "pont-bois": 256,
    "racines-contaminees": 244,
    "grand-torii": 230,
    "field-hut": 216,
    "farm-cart": 258,
    "field-footbridge": 252,
    "wooden-granary": 214,
    "straw-bales": 250,
    "tour-guet-kurokawa": 238,
    "tour-chateau": 222,
    "porte-chateau": 236,
    "mur-shoji": 238,
    "ratelier-vide": 254,
    "escalier-bois": 252,
    "alcove-tatami": 224,
    "racines-donjon": 242,
    koban: 216,
    "emergency-car": 258,
    "construction-scaffold": 236,
    "metro-entrance": 224,
    "quarantine-barrier": 260,
    "neighborhood-shrine": 220,
    "shrine-tech-altar": 214,
    "maglev-maintenance-car": 222,
    "sealed-cargo-crate": 258,
    "coolant-pipe": 228,
    "transit-access-gate": 216,
    "damaged-power-relay": 252,
  };

  const RUNTIME_AREA_KITS = {
    forest: {
      chapterId: "forest",
      environmentIndex: 5,
      rosterPoolId: "kai-forest-route",
      continuityProfile: "natural-canopy",
      surface: "earth",
      props: [
        "ancient-cedar-trunk",
        "woodcutter-cart",
        "stacked-logs",
        "hollow-fallen-log",
        "moss-stone-lantern",
        "charcoal-burner-shelter",
        "campfire-ring",
        "infected-root-cluster",
        "forest-spring-basin",
        "collapsed-quarantine-tent",
        "yomi-cave-arch",
        "rope-ward-gate",
      ],
    },
    bamboo: {
      chapterId: "bamboo",
      environmentIndex: 1,
      rosterPoolId: "kai-bamboo-route",
      continuityProfile: "bamboo-curtain",
      surface: "earth",
      props: [
        "bambous-hauts",
        "lanterne-pierre",
        "pont-bois",
        "bambous-coupes",
        "petit-torii",
        "sanctuaire-rural",
        "bassin-purification",
        "racines-contaminees",
        "cloche-sanctuaire",
        "grand-torii",
        "barriere-rituelle",
        "autel-purification",
      ],
    },
    fields: {
      chapterId: "fields",
      environmentIndex: 6,
      rosterPoolId: "tsuru-fields-route",
      continuityProfile: "rural-horizon",
      surface: "earth",
      props: [
        "irrigation-water-wheel",
        "farm-cart",
        "bound-rice-sheaf",
        "field-footbridge",
        "irrigation-sluice",
        "field-hut",
        "scarecrow",
        "straw-bales",
        "burning-crop-pile",
        "wooden-granary",
        "field-marker",
        "yomi-warp-torii",
      ],
    },
    city: {
      chapterId: "village",
      environmentIndex: 0,
      rosterPoolId: "kai-kurokawa-village",
      continuityProfile: "urban-facades",
      surface: "earth",
      districtId: "tsuru-kurokawa",
      props: [
        "tour-guet-kurokawa",
        "barriere-village",
        "minka-tuiles-intacte",
        "tonneau-provisions",
        "charrette-cassee",
        "kura-entrepot-riz",
        "foyer-incendie",
        "tas-paille",
        "puits-pierre",
        "minka-chaume-brulee",
        "autel-route",
        "porte-chateau",
      ],
      wallFiles: [
        "mur-platre-intact",
        "mur-platre-fume",
        "mur-platre-lattis",
        "mur-cedre-brule",
        "mur-planches-pluie",
        "mur-kura-bas",
      ],
    },
    castle: {
      chapterId: "castle",
      environmentIndex: 2,
      rosterPoolId: "kai-kurokawa-castle",
      continuityProfile: null,
      surface: "castleStone",
      districtId: "tsuru-kurokawa",
      zoneKind: "castle",
      props: [
        "tour-chateau",
        "porte-chateau",
        "mur-shoji",
        "pilier-cedre",
        "brasero-fer",
        "porte-laquee",
        "armure-vide",
        "ratelier-vide",
        "paravent-dechire",
        "escalier-bois",
        "alcove-tatami",
        "racines-donjon",
      ],
      wallFiles: [
        "mur-pierre-jokamachi",
        "mur-kura-bas",
        "mur-cedre-brule",
        "mur-planches-pluie",
      ],
    },
    modern: {
      chapterId: "contemporary",
      environmentIndex: 3,
      rosterPoolId: "tokyo-contemporary-rift",
      continuityProfile: "urban-facades",
      surface: "asphalt",
      regionId: "tokyo",
      settlementId: "tokyo",
      districtId: "rift-quarantine",
      props: [
        "metro-entrance",
        "vending-machine",
        "emergency-car",
        "koban",
        "utility-pole",
        "construction-scaffold",
        "emergency-generator",
        "neighborhood-shrine",
        "city-bicycle",
        "quarantine-barrier",
        "rainwater-pump",
        "yomi-warp-arch",
      ],
    },
    cyber: {
      chapterId: "cyberpunk",
      environmentIndex: 4,
      rosterPoolId: "neo-edo-cyber-rift",
      continuityProfile: "urban-facades",
      surface: "techStreet",
      regionId: "neo-edo",
      settlementId: "neo-tokyo",
      districtId: "shogun-zero-sector",
      props: [
        "temporal-torii",
        "vending-terminal",
        "sealed-cargo-crate",
        "transit-access-gate",
        "ventilation-tower",
        "coolant-pipe",
        "drone-charging-dock",
        "shrine-tech-altar",
        "cyber-shrine-lantern",
        "maglev-maintenance-car",
        "damaged-power-relay",
        "energy-barrier-post",
      ],
    },
  };

  function runtimePropsForArea(definition, kit) {
    const files = definition.propOrder || kit.props;
    const availableWidth = definition.width - 360;
    const step = files.length > 1 ? availableWidth / (files.length - 1) : 0;
    const props = files.map((file, index) => {
      const secondPlane = index % 3 === 0
        || /minka|kura|tour|sanctuaire|shrine|koban|metro|transit|yomi-cave|granary|field-hut/.test(file);
      return {
        id: `${definition.id}-prop-${String(index + 1).padStart(2, "0")}`,
        file,
        x: Math.round(150 + index * step),
        width: RUNTIME_PROP_WIDTHS[file] || 112,
        layer: secondPlane ? "back" : "world",
        compositionRole: secondPlane ? "second-plane-anchor" : "gameplay-prop",
      };
    });
    if (kit.wallFiles) {
      props.unshift(...architectureRun(
        `${definition.id}-continuous-wall`,
        0,
        definition.width,
        kit.wallFiles,
        132,
        { depthBias: -46 },
      ));
    }
    return props;
  }

  function runtimePlatformsForArea(definition, props) {
    const candidates = props.filter((prop) => Number.isFinite(RUNTIME_PLATFORM_TOPS[prop.file]));
    return candidates.slice(0, 5).map((prop, index) => ({
      id: `${definition.id}-surface-${String(index + 1).padStart(2, "0")}`,
      x: Math.round(prop.x + Math.max(6, prop.width * 0.08)),
      y: RUNTIME_PLATFORM_TOPS[prop.file],
      w: Math.max(54, Math.round(prop.width * 0.82)),
      h: 8,
      visual: false,
      owner: prop.id,
      surface: definition.kit === "castle"
        ? "wood"
        : (["modern", "cyber"].includes(definition.kit) ? "metal" : "wood"),
      collision: "oneWay",
      routeRole: "optionalUpper",
    }));
  }

  function runtimeEnemiesForArea(definition) {
    const count = definition.enemyIds.length;
    const left = 420;
    const right = definition.boss ? definition.width - 1050 : definition.width - 430;
    const step = count > 1 ? (right - left) / (count - 1) : 0;
    const enemies = definition.enemyIds.map((rosterId, index) => ({
      id: `${definition.id}-enemy-${String(index + 1).padStart(2, "0")}`,
      rosterId,
      roster: /^mb-/.test(rosterId)
        ? "miniboss"
        : (/^(s|new-.*(?:host|officer|corpse|frame))/.test(rosterId) ? "special" : "regular"),
      x: Math.round(left + index * step),
      y: 276,
      facing: index % 2 ? 1 : -1,
    }));
    if (definition.boss) {
      const massive = definition.boss.rosterId.startsWith("giant-")
        || definition.boss.massive === true;
      const width = definition.boss.width || (massive ? 148 : 72);
      const height = definition.boss.height || (massive ? 96 : 54);
      enemies.push({
        id: definition.boss.sourceId,
        rosterId: definition.boss.rosterId,
        narrativeId: definition.boss.narrativeId || definition.boss.rosterId,
        profileId: definition.boss.profileId
          || (definition.boss.rosterId.startsWith("giant-")
            ? definition.boss.rosterId
            : null),
        presentationClass: massive ? "massive" : null,
        encounterId: `${definition.id}-boss-gate`,
        x: definition.width - 690,
        y: HORIZONTAL_GROUND_Y - height,
        w: width,
        h: height,
        hp: definition.boss.hp || (massive ? 54 : 34),
        facing: -1,
        boss: true,
      });
    }
    return enemies;
  }

  const RUNTIME_NEW_AREA_DEFINITIONS = [
    {
      id: "forest-abandoned-camp",
      kit: "forest",
      label: "Camp abandonne des bucherons",
      width: 3000,
      enemyIds: ["r06-yama-woodcutter", "s19-wana-trapper", "r09-haka-digger", "s05-raimei-yamabushi", "mb-09-pisteur-kegare"],
      propOrder: ["collapsed-quarantine-tent", "woodcutter-cart", "stacked-logs", "campfire-ring", "charcoal-burner-shelter", "ancient-cedar-trunk", "moss-stone-lantern", "hollow-fallen-log", "forest-spring-basin", "infected-root-cluster", "yomi-cave-arch", "rope-ward-gate"],
    },
    {
      id: "forest-root-sanctuary",
      kit: "forest",
      label: "Sanctuaire des racines",
      width: 3200,
      enemyIds: ["r20-komuso-wanderer", "s05-raimei-yamabushi", "s19-wana-trapper", "r09-haka-digger"],
      propOrder: ["ancient-cedar-trunk", "infected-root-cluster", "moss-stone-lantern", "forest-spring-basin", "hollow-fallen-log", "yomi-cave-arch", "charcoal-burner-shelter", "campfire-ring", "collapsed-quarantine-tent", "infected-root-cluster", "ancient-cedar-trunk", "rope-ward-gate"],
      boss: { sourceId: "take-mori-root-guardian", rosterId: "giant-03-take-mori", hp: 52 },
    },
    {
      id: "bamboo-hollow-path",
      kit: "bamboo",
      label: "Chemin des tiges creuses",
      width: 3100,
      enemyIds: ["r14-kaido-bandit", "s01-kusa-shinobi", "s02-doku-kunoichi", "r20-komuso-wanderer", "mb-06-shinobi-brumes"],
      propOrder: ["bambous-hauts", "pont-bois", "bambous-coupes", "lanterne-pierre", "petit-torii", "racines-contaminees", "bassin-purification", "bambous-hauts", "cloche-sanctuaire", "sanctuaire-rural", "barriere-rituelle", "grand-torii"],
    },
    {
      id: "bamboo-moon-clearing",
      kit: "bamboo",
      label: "Clairiere de la lune fendue",
      width: 3200,
      enemyIds: ["s01-kusa-shinobi", "s02-doku-kunoichi", "s16-kage-mai-dancer", "mb-06-shinobi-brumes"],
      propOrder: ["grand-torii", "lanterne-pierre", "bambous-coupes", "pont-bois", "sanctuaire-rural", "autel-purification", "racines-contaminees", "cloche-sanctuaire", "bambous-hauts", "bassin-purification", "barriere-rituelle", "petit-torii"],
      boss: { sourceId: "kumo-moon-duel", rosterId: "boss-14-maitre-shinobi-kumo", hp: 38 },
    },
    {
      id: "fields-drowned-paddies",
      kit: "fields",
      label: "Rizieres noyees",
      width: 3100,
      enemyIds: ["r05-kome-porter", "r17-umaya-groom", "r19-kago-bearer", "s13-kegare-sumotori", "mb-17-sumotori-namazu"],
      propOrder: ["irrigation-water-wheel", "field-footbridge", "irrigation-sluice", "bound-rice-sheaf", "farm-cart", "field-hut", "scarecrow", "straw-bales", "burning-crop-pile", "field-marker", "wooden-granary", "yomi-warp-torii"],
    },
    {
      id: "fields-mill-road",
      kit: "fields",
      label: "Route du moulin",
      width: 3000,
      enemyIds: ["r05-kome-porter", "s19-wana-trapper", "r17-umaya-groom", "s13-kegare-sumotori", "mb-17-sumotori-namazu"],
      propOrder: ["farm-cart", "bound-rice-sheaf", "field-footbridge", "field-hut", "irrigation-water-wheel", "irrigation-sluice", "straw-bales", "scarecrow", "wooden-granary", "burning-crop-pile", "field-marker", "yomi-warp-torii"],
    },
    {
      id: "fields-burning-granary",
      kit: "fields",
      label: "Grenier de la moisson noire",
      width: 3300,
      enemyIds: ["r19-kago-bearer", "s13-kegare-sumotori", "mb-17-sumotori-namazu", "r05-kome-porter"],
      propOrder: ["field-hut", "straw-bales", "burning-crop-pile", "farm-cart", "wooden-granary", "burning-crop-pile", "bound-rice-sheaf", "irrigation-sluice", "scarecrow", "field-footbridge", "field-marker", "yomi-warp-torii"],
      boss: { sourceId: "shiro-kabuto-harvest", rosterId: "giant-07-shiro-kabuto", hp: 56 },
    },
    {
      id: "city-castle-approach",
      kit: "city",
      label: "Avenue fortifiee du chateau",
      width: 3300,
      enemyIds: ["r10-hikeshi-watchman", "s03-bakusai-runner", "s17-kurohata-bearer", "mb-20-capitaine-byakko"],
      boss: { sourceId: "engeki-castle-approach", rosterId: "boss-11-brigadier-engeki", hp: 42 },
    },
    {
      id: "castle-armory",
      kit: "castle",
      label: "Armurerie du clan Kurokawa",
      width: 3000,
      enemyIds: ["r15-oku-servant", "s08-gomon-jailer", "s15-teppo-corpsman", "mb-10-forgeron-hibana", "mb-12-gardien-masque-fer"],
      propOrder: ["porte-chateau", "ratelier-vide", "armure-vide", "brasero-fer", "mur-shoji", "pilier-cedre", "escalier-bois", "porte-laquee", "paravent-dechire", "alcove-tatami", "racines-donjon", "tour-chateau"],
    },
    {
      id: "castle-yomi-rift",
      kit: "castle",
      label: "Faille du Yomi",
      width: 3400,
      enemyIds: ["s18-yomi-herald", "s20-mekura-oracle", "mb-18-onmyoji-renard", "s10-hatamoto-fallen"],
      propOrder: ["porte-laquee", "racines-donjon", "brasero-fer", "mur-shoji", "pilier-cedre", "alcove-tatami", "paravent-dechire", "racines-donjon", "armure-vide", "tour-chateau", "porte-chateau", "racines-donjon"],
      boss: { sourceId: "yomi-no-kanrei-final-phase", rosterId: "giant-10-yomi-no-kanrei", hp: 72 },
    },
    {
      id: "modern-subway-station",
      kit: "modern",
      label: "Station de metro condamnee",
      width: 3100,
      enemyIds: ["new-modern-commuter", "new-modern-riot-host", "new-modern-response-officer", "new-modern-commuter", "new-modern-riot-host"],
      propOrder: ["metro-entrance", "vending-machine", "quarantine-barrier", "emergency-car", "utility-pole", "construction-scaffold", "emergency-generator", "rainwater-pump", "city-bicycle", "koban", "neighborhood-shrine", "yomi-warp-arch"],
    },
    {
      id: "modern-quarantine-hospital",
      kit: "modern",
      label: "Hopital de quarantaine",
      width: 3200,
      enemyIds: ["new-modern-commuter", "new-modern-response-officer", "new-modern-riot-host", "new-modern-response-officer", "new-modern-commuter"],
      propOrder: ["quarantine-barrier", "emergency-car", "emergency-generator", "construction-scaffold", "koban", "vending-machine", "rainwater-pump", "utility-pole", "metro-entrance", "city-bicycle", "neighborhood-shrine", "yomi-warp-arch"],
    },
    {
      id: "modern-metropolitan-lab",
      kit: "modern",
      label: "Laboratoire metropolitain",
      width: 3400,
      enemyIds: ["new-modern-response-officer", "new-modern-riot-host", "new-modern-commuter", "new-modern-response-officer"],
      propOrder: ["koban", "quarantine-barrier", "construction-scaffold", "emergency-generator", "vending-machine", "rainwater-pump", "utility-pole", "emergency-car", "metro-entrance", "neighborhood-shrine", "city-bicycle", "yomi-warp-arch"],
      boss: {
        sourceId: "metro-colossus",
        rosterId: "new-modern-metro-colossus",
        massive: true,
        width: 168,
        height: 108,
        hp: 96,
      },
    },
    {
      id: "cyber-neon-market",
      kit: "cyber",
      label: "Marche aux neons",
      width: 3200,
      enemyIds: ["new-cyber-neon-shinobi", "new-cyber-drone-corpse", "new-cyber-oni-frame", "new-cyber-neon-shinobi", "new-cyber-drone-corpse"],
      propOrder: ["vending-terminal", "sealed-cargo-crate", "transit-access-gate", "cyber-shrine-lantern", "coolant-pipe", "drone-charging-dock", "shrine-tech-altar", "ventilation-tower", "maglev-maintenance-car", "damaged-power-relay", "energy-barrier-post", "temporal-torii"],
    },
    {
      id: "cyber-maglev-ruins",
      kit: "cyber",
      label: "Ruines du maglev",
      width: 3300,
      enemyIds: ["new-cyber-neon-shinobi", "new-cyber-oni-frame", "new-cyber-drone-corpse", "new-cyber-neon-shinobi", "new-cyber-oni-frame"],
      propOrder: ["maglev-maintenance-car", "sealed-cargo-crate", "coolant-pipe", "ventilation-tower", "transit-access-gate", "damaged-power-relay", "drone-charging-dock", "energy-barrier-post", "vending-terminal", "cyber-shrine-lantern", "shrine-tech-altar", "temporal-torii"],
    },
    {
      id: "cyber-yomi-datacenter",
      kit: "cyber",
      label: "Centre de donnees Yomi",
      width: 3400,
      enemyIds: ["new-cyber-drone-corpse", "new-cyber-neon-shinobi", "new-cyber-oni-frame", "new-cyber-drone-corpse"],
      propOrder: ["transit-access-gate", "ventilation-tower", "coolant-pipe", "drone-charging-dock", "damaged-power-relay", "sealed-cargo-crate", "shrine-tech-altar", "energy-barrier-post", "vending-terminal", "maglev-maintenance-car", "cyber-shrine-lantern", "temporal-torii"],
      boss: {
        sourceId: "yomi-network-kannushi",
        rosterId: "new-cyber-yomi-hacker",
        hp: 44,
      },
    },
    {
      id: "cyber-shogun-core",
      kit: "cyber",
      label: "Coeur du Shogun Zero",
      width: 3600,
      enemyIds: ["new-cyber-neon-shinobi", "new-cyber-drone-corpse", "new-cyber-oni-frame", "new-cyber-neon-shinobi"],
      propOrder: ["temporal-torii", "energy-barrier-post", "shrine-tech-altar", "coolant-pipe", "drone-charging-dock", "damaged-power-relay", "transit-access-gate", "sealed-cargo-crate", "ventilation-tower", "maglev-maintenance-car", "cyber-shrine-lantern", "energy-barrier-post"],
      boss: {
        sourceId: "shogun-zero",
        rosterId: "new-cyber-shogun-zero",
        hp: 64,
      },
    },
  ];

  for (const definition of RUNTIME_NEW_AREA_DEFINITIONS) {
    const kit = RUNTIME_AREA_KITS[definition.kit];
    const props = runtimePropsForArea(definition, kit);
    const platforms = runtimePlatformsForArea(definition, props);
    const enemies = runtimeEnemiesForArea(definition);
    const area = campaignArea({
      id: definition.id,
      chapterId: kit.chapterId,
      label: definition.label,
      objective: "",
      objectivePortalId: null,
      environmentIndex: kit.environmentIndex,
      rosterPoolId: kit.rosterPoolId,
      width: definition.width,
      continuityProfile: kit.continuityProfile,
      regionId: kit.regionId || "kai",
      settlementId: kit.settlementId || "tsuru",
      districtId: kit.districtId || definition.id,
      surface: kit.surface,
      chapterTags: [definition.kit, "campaign-runtime", "seven-act"],
      spawns: {
        campaignWest: { x: 140, y: PLAYER_GROUND_Y, facing: 1 },
        campaignEast: { x: definition.width - 180, y: PLAYER_GROUND_Y, facing: -1 },
        checkpoint: { x: Math.round(definition.width * 0.5), y: PLAYER_GROUND_Y, facing: 1 },
      },
      props,
      platforms,
      portals: [],
      enemies,
    });
    area.zoneKind = kit.zoneKind || "outdoor";
    if (definition.boss) {
      area.encounters = [{
        id: `${definition.id}-boss-gate`,
        kind: (
          definition.boss.rosterId.startsWith("giant-")
          || definition.boss.massive === true
        ) ? "massiveBoss" : "boss",
        profileId: definition.boss.rosterId,
        bounds: {
          x: definition.width - 1120,
          y: 0,
          w: 1010,
          h: 360,
        },
        activationX: definition.width - 1040,
        cameraLock: true,
        completionUnlocks: [],
      }];
    }
    KageLevels.areas[definition.id] = area;
  }

  KageLevels.startAreaId = "kai-forest-pass";
  KageLevels.startSpawnId = "prologue";
  KageLevels.chapters.village.entryAreaId = "kai-forest-pass";
  KageLevels.chapters.village.areaIds = [
    "kai-forest-pass",
    "shigure-bamboo-grove",
    "tsuru-rice-fields",
    ...KageLevels.chapters.village.areaIds,
  ];
  KageLevels.worldActs = [
    { id: "act-01-forest", areaIds: ["kai-forest-pass"], environmentIndex: 5 },
    { id: "act-02-bamboo", areaIds: ["shigure-bamboo-grove"], environmentIndex: 1 },
    { id: "act-03-fields", areaIds: ["tsuru-rice-fields"], environmentIndex: 6 },
    { id: "act-04-city", areaIds: ["kurokawa-main-street", "kurokawa-back-street", "kurokawa-market-east"], environmentIndex: 0 },
    { id: "act-05-castle", areaIds: ["castle-lower-court", "castle-residence", "castle-donjon"], environmentIndex: 2 },
    { id: "act-06-contemporary", areaIds: ["tokyo-contemporary-rift"], environmentIndex: 3 },
    { id: "act-07-cyberpunk", areaIds: ["neo-edo-cyber-rift"], environmentIndex: 4 },
  ];

  KageLevels.mapGraph.nodes.push(
    { id: "kai-forest-pass", mapX: -3, mapY: 0, kind: "outdoor" },
    { id: "shigure-bamboo-grove", mapX: -2, mapY: 0, kind: "outdoor" },
    { id: "tsuru-rice-fields", mapX: -1, mapY: 0, kind: "outdoor" },
    { id: "tokyo-contemporary-rift", mapX: 4, mapY: 0, kind: "temporal" },
    { id: "neo-edo-cyber-rift", mapX: 5, mapY: 0, kind: "temporal" },
  );
  KageLevels.mapGraph.edges.push(
    { id: "forest-bamboo-route", from: "kai-forest-pass", to: "shigure-bamboo-grove", kind: "side", bidirectional: true },
    { id: "bamboo-fields-route", from: "shigure-bamboo-grove", to: "tsuru-rice-fields", kind: "side", bidirectional: true },
    { id: "fields-kurokawa-route", from: "tsuru-rice-fields", to: "kurokawa-main-street", kind: "side", bidirectional: true },
    { id: "castle-contemporary-warp", from: "castle-donjon", to: "tokyo-contemporary-rift", kind: "warp", bidirectional: true },
    { id: "contemporary-cyber-warp", from: "tokyo-contemporary-rift", to: "neo-edo-cyber-rift", kind: "warp", bidirectional: true },
  );

  KageLevels.areas["kurokawa-main-street"].portals.unshift(
    campaignPortal(
      "kurokawa-to-fields",
      120,
      { areaId: "tsuru-rice-fields", spawnId: "eastReturn" },
      "Rizières de Tsuru",
      "E — REPRENDRE LA ROUTE DES RIZIÈRES",
    ),
  );
  KageLevels.areas["castle-donjon"].portals.push(
    campaignPortal(
      "castle-to-contemporary-warp",
      2340,
      { areaId: "tokyo-contemporary-rift", spawnId: "warpArrival" },
      "Faille du Yomi",
      "E — ENTRER DANS LE JAPON CONTEMPORAIN",
    ),
  );

  KageLevels.areas["castle-donjon"].spawns.warpReturn = {
    x: 2260,
    y: PLAYER_GROUND_Y,
    facing: -1,
  };
  KageLevels.areas["tokyo-contemporary-rift"].spawns.cyberReturn = {
    x: 3060,
    y: PLAYER_GROUND_Y,
    facing: -1,
  };
  KageLevels.areas["tokyo-contemporary-rift"].portals.unshift({
    ...campaignPortal(
      "modern-to-castle",
      90,
      { areaId: "castle-donjon", spawnId: "warpReturn" },
      "Faille vers le donjon",
      "E — REVENIR AU JAPON FÉODAL",
      "faille-moderne",
    ),
    type: "return",
  });
  KageLevels.areas["neo-edo-cyber-rift"].portals.unshift({
    ...campaignPortal(
      "cyber-to-modern",
      90,
      { areaId: "tokyo-contemporary-rift", spawnId: "cyberReturn" },
      "Faille vers Tokyo",
      "E — REVENIR AU JAPON CONTEMPORAIN",
      "faille-cyber",
    ),
    type: "return",
  });

  const objectivePortalIds = {
    "kurokawa-main-street": "alley-to-back-street",
    "kurokawa-back-street": "passage-to-market",
    "kurokawa-market-east": "road-to-castle",
    "castle-lower-court": "door-to-residence",
    "castle-residence": "corridor-to-donjon",
    "castle-donjon": "final-donjon-fps",
  };
  Object.entries(objectivePortalIds).forEach(([areaId, portalId]) => {
    KageLevels.areas[areaId].objectivePortalId = portalId;
  });

  const castleWarp = KageLevels.areas["castle-donjon"].portals
    .find((portal) => portal.id === "castle-to-contemporary-warp");
  castleWarp.requiresConfirmation = true;
  castleWarp.visual = "faille-moderne";
  const modernWarp = KageLevels.areas["tokyo-contemporary-rift"].portals
    .find((portal) => portal.id === "modern-to-cyber");
  modernWarp.requiresAreaClear = true;
  modernWarp.visual = "faille-moderne";
  const cyberCore = KageLevels.areas["neo-edo-cyber-rift"].portals
    .find((portal) => portal.id === "cyber-yomi-core");
  cyberCore.requiresAreaClear = true;
  cyberCore.requiresConfirmation = true;
  cyberCore.visual = "faille-cyber";

  const RUNTIME_CAMPAIGN_ZONES = [
    {
      zoneId: "forest-kaido-trail",
      areaId: "kai-forest-pass",
      actId: "act-01-forest",
      objective: {
        id: "obj-forest-follow-traces",
        type: "investigate",
        label: "Suivre les traces de la patrouille du shogun",
        sealReward: 0,
      },
    },
    {
      zoneId: "forest-abandoned-camp",
      areaId: "forest-abandoned-camp",
      actId: "act-01-forest",
      objective: {
        id: "obj-forest-purify-camp",
        type: "purify",
        label: "Purifier le camp abandonne",
        sealReward: 1,
      },
    },
    {
      zoneId: "forest-root-sanctuary",
      areaId: "forest-root-sanctuary",
      actId: "act-01-forest",
      objective: {
        id: "obj-forest-defeat-take-mori",
        type: "boss",
        label: "Abattre Take-Mori, gardien des racines",
        targetEnemyId: "giant-03-take-mori",
        sealReward: 1,
      },
    },
    {
      zoneId: "bamboo-rain-gate",
      areaId: "shigure-bamboo-grove",
      actId: "act-02-bamboo",
      objective: {
        id: "obj-bamboo-cut-wards",
        type: "destroy-nodes",
        label: "Rompre les sceaux poses sur les bambous",
        sealReward: 1,
      },
    },
    {
      zoneId: "bamboo-hollow-path",
      areaId: "bamboo-hollow-path",
      actId: "act-02-bamboo",
      objective: {
        id: "obj-bamboo-rescue-scout",
        type: "rescue",
        label: "Retrouver l'eclaireur de la patrouille",
        sealReward: 0,
      },
    },
    {
      zoneId: "bamboo-moon-clearing",
      areaId: "bamboo-moon-clearing",
      actId: "act-02-bamboo",
      objective: {
        id: "obj-bamboo-defeat-kumo",
        type: "boss",
        label: "Vaincre Kumo dans la clairiere",
        targetEnemyId: "boss-14-maitre-shinobi-kumo",
        sealReward: 1,
      },
    },
    {
      zoneId: "fields-west-dikes",
      areaId: "tsuru-rice-fields",
      actId: "act-03-fields",
      objective: {
        id: "obj-fields-open-irrigation",
        type: "world-state",
        label: "Rouvrir les vannes d'irrigation",
        sealReward: 0,
      },
    },
    {
      zoneId: "fields-drowned-paddies",
      areaId: "fields-drowned-paddies",
      actId: "act-03-fields",
      objective: {
        id: "obj-fields-defend-farmers",
        type: "defense",
        label: "Defendre les survivants des rizieres",
        sealReward: 1,
      },
    },
    {
      zoneId: "fields-mill-road",
      areaId: "fields-mill-road",
      actId: "act-03-fields",
      objective: {
        id: "obj-fields-break-spore-mill",
        type: "purify",
        label: "Detruire le moulin a spores",
        sealReward: 1,
      },
    },
    {
      zoneId: "fields-burning-granary",
      areaId: "fields-burning-granary",
      actId: "act-03-fields",
      objective: {
        id: "obj-fields-defeat-aka-ushi",
        runtimeObjectiveAlias: "obj-fields-defeat-shiro-kabuto",
        type: "boss",
        label: "Briser la carapace de Shiro-Kabuto",
        targetEnemyId: "giant-07-shiro-kabuto",
        sealReward: 1,
      },
    },
    {
      zoneId: "city-south-gate",
      areaId: "kurokawa-main-street",
      actId: "act-04-city",
      objective: {
        id: "obj-city-enter-quarantine",
        type: "breach",
        label: "Franchir le cordon de quarantaine",
        sealReward: 0,
      },
    },
    {
      zoneId: "city-market-wards",
      areaId: "kurokawa-back-street",
      actId: "act-04-city",
      objective: {
        id: "obj-city-open-refuge",
        type: "refuge",
        label: "Ouvrir un refuge dans le quartier marchand",
        sealReward: 1,
      },
    },
    {
      zoneId: "city-canal-roofs",
      areaId: "kurokawa-market-east",
      actId: "act-04-city",
      objective: {
        id: "obj-city-ring-fire-bell",
        type: "world-state",
        label: "Sonner la cloche d'incendie de Kurokawa",
        sealReward: 1,
      },
    },
    {
      zoneId: "city-castle-approach",
      areaId: "city-castle-approach",
      actId: "act-04-city",
      objective: {
        id: "obj-city-defeat-engeki",
        type: "boss",
        label: "Vaincre le brigadier Engeki",
        targetEnemyId: "boss-11-brigadier-engeki",
        sealReward: 1,
      },
    },
    {
      zoneId: "castle-lower-court-expansion",
      areaId: "castle-lower-court",
      actId: "act-05-castle",
      objective: {
        id: "obj-castle-break-barracks-seal",
        type: "destroy-nodes",
        label: "Briser le sceau de la garnison",
        sealReward: 1,
      },
    },
    {
      zoneId: "castle-residence-expansion",
      areaId: "castle-residence",
      actId: "act-05-castle",
      objective: {
        id: "obj-castle-find-daimyo-records",
        type: "investigate",
        label: "Retrouver les registres du daimyo",
        sealReward: 0,
      },
    },
    {
      zoneId: "castle-armory",
      areaId: "castle-armory",
      actId: "act-05-castle",
      objective: {
        id: "obj-castle-purify-armory",
        type: "purify",
        label: "Purifier l'armurerie du clan",
        sealReward: 1,
      },
    },
    {
      zoneId: "castle-donjon-expansion",
      areaId: "castle-donjon",
      actId: "act-05-castle",
      objective: {
        id: "obj-castle-defeat-kanrei",
        runtimeObjectiveAlias: "obj-castle-defeat-daimyo",
        type: "boss",
        label: "Abattre le daimyo corrompu",
        targetEnemyId: "06-daimyo-corrupted",
        sealReward: 1,
      },
    },
    {
      zoneId: "castle-yomi-rift",
      areaId: "castle-yomi-rift",
      actId: "act-05-castle",
      objective: {
        id: "obj-castle-stabilize-warp",
        runtimeObjectiveAlias: "obj-castle-defeat-kanrei-phase-2",
        type: "boss",
        label: "Detruire Yomi-no-Kanrei et stabiliser la faille",
        targetEnemyId: "giant-10-yomi-no-kanrei",
        sealReward: 1,
      },
    },
    {
      zoneId: "modern-shibuya-side-street",
      areaId: "tokyo-contemporary-rift",
      actId: "act-06-contemporary",
      objective: {
        id: "obj-modern-read-emergency-records",
        type: "investigate",
        label: "Lire les archives d'urgence de Tokyo",
        sealReward: 0,
      },
    },
    {
      zoneId: "modern-subway-station",
      areaId: "modern-subway-station",
      actId: "act-06-contemporary",
      objective: {
        id: "obj-modern-restore-power",
        type: "world-state",
        label: "Retablir le courant de la station",
        sealReward: 1,
      },
    },
    {
      zoneId: "modern-quarantine-hospital",
      areaId: "modern-quarantine-hospital",
      actId: "act-06-contemporary",
      objective: {
        id: "obj-modern-secure-sample",
        type: "retrieval",
        label: "Securiser l'echantillon originel",
        sealReward: 1,
      },
    },
    {
      zoneId: "modern-metropolitan-lab",
      areaId: "modern-metropolitan-lab",
      actId: "act-06-contemporary",
      objective: {
        id: "obj-modern-defeat-metro-colossus",
        type: "boss",
        label: "Abattre le colosse de la ligne Yomi",
        targetEnemyId: "new-modern-metro-colossus",
        sealReward: 1,
      },
    },
    {
      zoneId: "cyber-shrine-sector",
      areaId: "neo-edo-cyber-rift",
      actId: "act-07-cyberpunk",
      objective: {
        id: "obj-cyber-calibrate-katana",
        type: "upgrade",
        label: "Calibrer la lame sur la frequence Yomi",
        sealReward: 1,
      },
    },
    {
      zoneId: "cyber-neon-market",
      areaId: "cyber-neon-market",
      actId: "act-07-cyberpunk",
      objective: {
        id: "obj-cyber-free-memory-monks",
        type: "rescue",
        label: "Liberer les moines-memoires",
        sealReward: 1,
      },
    },
    {
      zoneId: "cyber-maglev-ruins",
      areaId: "cyber-maglev-ruins",
      actId: "act-07-cyberpunk",
      objective: {
        id: "obj-cyber-destroy-drone-nests",
        type: "destroy-nodes",
        label: "Detruire les nids de drones",
        sealReward: 1,
      },
    },
    {
      zoneId: "cyber-yomi-datacenter",
      areaId: "cyber-yomi-datacenter",
      actId: "act-07-cyberpunk",
      objective: {
        id: "obj-cyber-defeat-hacker",
        type: "boss",
        label: "Neutraliser le kannushi du reseau",
        targetEnemyId: "new-cyber-yomi-hacker",
        sealReward: 1,
      },
    },
    {
      zoneId: "cyber-shogun-core",
      areaId: "cyber-shogun-core",
      actId: "act-07-cyberpunk",
      objective: {
        id: "obj-cyber-defeat-shogun-zero",
        type: "boss",
        label: "Vaincre le Shogun Zero",
        targetEnemyId: "new-cyber-shogun-zero",
        sealReward: 1,
      },
    },
  ];

  const RUNTIME_CAMPAIGN_ACT_DEFINITIONS = [
    {
      id: "act-01-forest",
      order: 1,
      label: "Acte I - La foret qui murmure",
      biomeId: "forest",
      totalSeals: 2,
      bossEnemyId: "giant-03-take-mori",
    },
    {
      id: "act-02-bamboo",
      order: 2,
      label: "Acte II - Les lames de Shigure",
      biomeId: "bamboo-grove",
      totalSeals: 2,
      bossEnemyId: "boss-14-maitre-shinobi-kumo",
    },
    {
      id: "act-03-fields",
      order: 3,
      label: "Acte III - La moisson noire",
      biomeId: "rice-fields",
      totalSeals: 3,
      bossEnemyId: "giant-07-shiro-kabuto",
    },
    {
      id: "act-04-city",
      order: 4,
      label: "Acte IV - Kurokawa, ville des cendres",
      biomeId: "fortified-city",
      totalSeals: 3,
      bossEnemyId: "boss-11-brigadier-engeki",
    },
    {
      id: "act-05-castle",
      order: 5,
      label: "Acte V - Le trone du Yomi",
      biomeId: "castle",
      totalSeals: 4,
      bossEnemyId: "giant-10-yomi-no-kanrei",
      phaseBossEnemyIds: ["06-daimyo-corrupted", "giant-10-yomi-no-kanrei"],
    },
    {
      id: "act-06-contemporary",
      order: 6,
      label: "Acte VI - Tokyo, annee zero",
      biomeId: "contemporary-japan",
      totalSeals: 3,
      bossEnemyId: "new-modern-metro-colossus",
    },
    {
      id: "act-07-cyberpunk",
      order: 7,
      label: "Acte VII - Les ombres de Neo-Tokyo",
      biomeId: "cyberpunk-japan",
      totalSeals: 5,
      bossEnemyId: "new-cyber-shogun-zero",
    },
  ];

  /*
   * Cibles de terrain des objectifs non combattants.
   *
   * Chaque cible est un vrai sprite du biome, placé sur le plan jouable et
   * associé à un point d'interaction manuel. Les identifiants de cibles sont
   * stables afin que la sauvegarde puisse reprendre un objectif à mi-parcours
   * sans recréer une progression différente.
   */
  const CAMPAIGN_OBJECTIVE_TARGET_BLUEPRINTS = {
    "obj-forest-purify-camp": {
      targets: [
        {
          propFile: "campfire-ring",
          width: 74,
          label: "Foyer du camp",
          prompt: "E - POSER UN OFUDA DE PURIFICATION",
          actionLabel: "FOYER PURIFIE",
          requiresAreaClear: true,
        },
      ],
    },
    "obj-bamboo-cut-wards": {
      targets: [1, 2, 3].map((index) => ({
        propFile: "barriere-rituelle",
        width: 76,
        label: `Sceau impur ${index}/3`,
        prompt: "E - TRANCHER LE SCEAU",
        actionLabel: "SCEAU ROMPU",
      })),
    },
    "obj-bamboo-rescue-scout": {
      targets: [
        {
          propFile: "petit-torii",
          width: 70,
          label: "Éclaireur retenu",
          prompt: "E - COUPER LES LIENS",
          actionLabel: "ECLAIREUR LIBERE",
        },
        {
          propFile: "bassin-purification",
          width: 68,
          label: "Éclaireur contaminé",
          prompt: "E - ADMINISTRER LE REMEDE",
          actionLabel: "ECLAIREUR STABILISE",
        },
      ],
    },
    "obj-fields-open-irrigation": {
      targets: [
        {
          propFile: "irrigation-sluice",
          width: 104,
          label: "Vanne occidentale",
          prompt: "E - LEVER LA VANNE",
          actionLabel: "VANNE OUVERTE",
        },
        {
          propFile: "irrigation-sluice",
          width: 104,
          label: "Vanne orientale",
          prompt: "E - LEVER LA VANNE",
          actionLabel: "VANNE OUVERTE",
        },
      ],
    },
    "obj-fields-break-spore-mill": {
      targets: [
        {
          propFile: "irrigation-water-wheel",
          width: 138,
          label: "Mécanisme à spores",
          prompt: "E - INCENDIER LE COEUR DU MOULIN",
          actionLabel: "MOULIN PURIFIE",
          requiresAreaClear: true,
        },
      ],
    },
    "obj-city-open-refuge": {
      targets: [
        {
          propFile: "autel-route",
          width: 78,
          label: "Autel du refuge",
          prompt: "E - CONSACRER LE REFUGE",
          actionLabel: "REFUGE OUVERT",
          requiresAreaClear: true,
        },
      ],
    },
    "obj-city-ring-fire-bell": {
      targets: [
        {
          propFile: "tour-guet-kurokawa",
          width: 142,
          label: "Cloche d'incendie",
          prompt: "E - SONNER L'ALARME",
          actionLabel: "CLOCHE SONNEE",
        },
      ],
    },
    "obj-castle-break-barracks-seal": {
      targets: [1, 2, 3].map((index) => ({
        propFile: "racines-donjon",
        width: 72,
        label: `Ancrage du sceau ${index}/3`,
        prompt: "E - DETRUIRE L'ANCRAGE",
        actionLabel: "ANCRAGE DETRUIT",
      })),
    },
    "obj-castle-purify-armory": {
      targets: [
        {
          propFile: "ratelier-vide",
          width: 86,
          label: "Râtelier contaminé",
          prompt: "E - BRULER LES ARMES SOUILLEES",
          actionLabel: "RATELIER PURIFIE",
          requiresAreaClear: true,
        },
        {
          propFile: "armure-vide",
          width: 62,
          label: "Armure possédée",
          prompt: "E - APPOSER LE SCEAU",
          actionLabel: "ARMURE PURIFIEE",
          requiresAreaClear: true,
        },
      ],
    },
    "obj-modern-restore-power": {
      targets: [
        {
          propFile: "emergency-generator",
          width: 116,
          label: "Générateur de secours",
          prompt: "E - REARMER LE GENERATEUR",
          actionLabel: "GENERATEUR REARME",
        },
        {
          propFile: "rainwater-pump",
          width: 94,
          label: "Pompe de la station",
          prompt: "E - RELANCER LA POMPE",
          actionLabel: "POMPE RELANCEE",
        },
      ],
    },
    "obj-modern-secure-sample": {
      targets: [
        {
          propFile: "emergency-car",
          width: 154,
          label: "Ambulance du patient zéro",
          prompt: "E - RECUPERER L'ECHANTILLON",
          actionLabel: "ECHANTILLON SECURISE",
        },
      ],
    },
    "obj-cyber-calibrate-katana": {
      targets: [
        {
          propFile: "shrine-tech-altar",
          width: 106,
          label: "Autel de calibration",
          prompt: "E - SYNCHRONISER LA LAME",
          actionLabel: "LAME CALIBREE",
        },
      ],
    },
    "obj-cyber-free-memory-monks": {
      targets: [
        {
          propFile: "sealed-cargo-crate",
          width: 90,
          label: "Reliquaire-mémoire 1/2",
          prompt: "E - LIBERER LA MEMOIRE",
          actionLabel: "MEMOIRE LIBEREE",
        },
        {
          propFile: "sealed-cargo-crate",
          width: 90,
          label: "Reliquaire-mémoire 2/2",
          prompt: "E - LIBERER LA MEMOIRE",
          actionLabel: "MEMOIRE LIBEREE",
        },
      ],
    },
    "obj-cyber-destroy-drone-nests": {
      targets: [1, 2, 3].map((index) => ({
        propFile: "drone-charging-dock",
        width: 96,
        label: `Nid de drones ${index}/3`,
        prompt: "E - SURCHARGER LE NID",
        actionLabel: "NID DE DRONES DETRUIT",
      })),
    },
  };

  const CAMPAIGN_MANUAL_OBJECTIVE_TYPES = new Set([
    "destroy-nodes",
    "purify",
    "refuge",
    "rescue",
    "retrieval",
    "upgrade",
    "world-state",
  ]);

  function campaignObjectiveCompletionMethod(type) {
    if (type === "boss") return "enemy-death";
    if (["investigate", "breach"].includes(type)) return "checkpoint-reach";
    if (type === "defense") return "area-clear";
    if (CAMPAIGN_MANUAL_OBJECTIVE_TYPES.has(type)) return "manual-targets";
    return "explicit-runtime";
  }

  function campaignObjectiveTargetCenters(area, count) {
    const minimum = Math.max(area.minX + 260, 320);
    const maximum = Math.min(area.maxX - 260, area.width - 320);
    const span = Math.max(240, maximum - minimum);
    const authoredPortalXs = (area.portals || [])
      .map((portal) => Number(portal.x))
      .filter(Number.isFinite);
    const centers = [];
    for (let index = 0; index < count; index += 1) {
      const preferred = count <= 1
        ? Math.round((minimum + maximum) * 0.5)
        : Math.round(minimum + span * ((index + 1) / (count + 1)));
      let selected = preferred;
      for (let attempt = 0; attempt < 14; attempt += 1) {
        const step = Math.ceil(attempt / 2) * 112;
        const direction = attempt === 0 ? 0 : (attempt % 2 === 1 ? -1 : 1);
        const candidate = Math.max(minimum, Math.min(maximum, preferred + step * direction));
        const clearsPortals = authoredPortalXs.every((x) => Math.abs(x - candidate) >= 142);
        const clearsTargets = centers.every((x) => Math.abs(x - candidate) >= 174);
        if (clearsPortals && clearsTargets) {
          selected = candidate;
          break;
        }
      }
      centers.push(selected);
    }
    return centers;
  }

  /*
   * Le daimyo existe deja dans la mission FPS historique. Cette incarnation
   * 2D rend toutefois l'objectif du donjon resolvable par le meme contrat que
   * les six autres actes. La sauvegarde partage son rosterId entre les vues.
   */
  const castleDonjonArea = KageLevels.areas["castle-donjon"];
  if (!castleDonjonArea.enemies.some((enemy) => enemy.rosterId === "06-daimyo-corrupted")) {
    castleDonjonArea.enemies.push({
      id: "daimyo-corrupted-side",
      rosterId: "06-daimyo-corrupted",
      narrativeId: "daimyo-of-kurokawa",
      encounterId: "castle-donjon-daimyo-gate",
      x: 1880,
      y: 246,
      w: 72,
      h: 54,
      hp: 48,
      facing: -1,
      boss: true,
    });
    castleDonjonArea.encounters.push({
      id: "castle-donjon-daimyo-gate",
      kind: "boss",
      profileId: "06-daimyo-corrupted",
      bounds: { x: 1540, y: 0, w: 820, h: 360 },
      activationX: 1610,
      cameraLock: true,
      completionUnlocks: [],
    });
  }

  const campaignObjectives = Object.fromEntries(
    RUNTIME_CAMPAIGN_ZONES.map((entry) => [
      entry.objective.id,
      {
        ...entry.objective,
        actId: entry.actId,
        zoneId: entry.zoneId,
        areaId: entry.areaId,
        completionMethod: campaignObjectiveCompletionMethod(entry.objective.type),
        runtimeTrigger: campaignObjectiveCompletionMethod(entry.objective.type),
        targetCount: CAMPAIGN_OBJECTIVE_TARGET_BLUEPRINTS[entry.objective.id]?.targets?.length || 1,
        targetIds: [],
      },
    ]),
  );

  for (const [index, entry] of RUNTIME_CAMPAIGN_ZONES.entries()) {
    const area = KageLevels.areas[entry.areaId];
    const objective = campaignObjectives[entry.objective.id];
    const act = RUNTIME_CAMPAIGN_ACT_DEFINITIONS.find((candidate) => candidate.id === entry.actId);
    area.actId = entry.actId;
    area.actOrder = act.order;
    area.campaignZoneId = entry.zoneId;
    area.objective = objective.label;
    area.objectiveIds = [objective.id];
    area.objectives = [objective];
    area.checkpointPolicy = {
      mode: "persistent-area",
      resumeAreaId: area.id,
      preserveEnemies: true,
      preservePickups: true,
      preserveObjectives: true,
    };
    area.completionGate = {
      type: objective.type === "boss" ? "boss" : "area-clear",
      objectiveId: objective.id,
      targetEnemyId: objective.targetEnemyId || null,
      encounterId: objective.type === "boss"
        ? `${area.id}-boss-gate`
        : null,
    };
    if (entry.areaId === "castle-donjon") {
      area.completionGate.encounterId = "castle-donjon-daimyo-gate";
    }

    area.spawns = area.spawns || {};
    area.spawns.campaignWest = area.spawns.campaignWest || {
      x: Math.max(area.minX + 70, 140),
      y: PLAYER_GROUND_Y,
      facing: 1,
    };
    area.spawns.campaignEast = area.spawns.campaignEast || {
      x: Math.min(area.maxX - 70, area.width - 180),
      y: PLAYER_GROUND_Y,
      facing: -1,
    };
    area.spawns.checkpoint = area.spawns.checkpoint || {
      x: Math.round((area.minX + area.maxX) * 0.5),
      y: PLAYER_GROUND_Y,
      facing: 1,
    };
    area.checkpoints = area.checkpoints || [];
    if (!area.checkpoints.length) {
      area.checkpoints.push({
        id: `${area.id}-campaign-checkpoint`,
        x: area.spawns.checkpoint.x,
        spawnId: "checkpoint",
        persistent: true,
      });
    }
    if (objective.completionMethod === "checkpoint-reach") {
      objective.targetIds = [area.checkpoints[0].id];
      objective.targetCount = 1;
    } else if (objective.completionMethod === "enemy-death") {
      objective.targetIds = [objective.targetEnemyId];
      objective.targetCount = 1;
    } else if (objective.completionMethod === "area-clear") {
      objective.targetIds = [`${area.id}:all-enemies`];
      objective.targetCount = 1;
    } else if (objective.completionMethod === "manual-targets") {
      const blueprint = CAMPAIGN_OBJECTIVE_TARGET_BLUEPRINTS[objective.id];
      const centers = campaignObjectiveTargetCenters(area, blueprint.targets.length);
      area.objectiveTargets = blueprint.targets.map((target, targetIndex) => {
        const targetId = `${objective.id}:target-${targetIndex + 1}`;
        const centerX = centers[targetIndex];
        const width = Math.max(40, Number(target.width) || 80);
        const propId = `objective-prop-${objective.id}-${targetIndex + 1}`;
        const portalId = `objective-interaction-${objective.id}-${targetIndex + 1}`;
        area.props.push({
          id: propId,
          file: target.propFile,
          x: Math.round(centerX - width / 2),
          width,
          layer: "world",
          compositionRole: "campaign-objective",
          depthBand: "world-near",
          bottomY: HORIZONTAL_GROUND_Y,
          baselineY: HORIZONTAL_GROUND_Y + 2,
          baseline: `ground-${HORIZONTAL_GROUND_Y}`,
          perspectiveScale: 1,
          depthBias: 12,
          groundAnchor: [0.5, 1],
          contactMode: "opaque-bottom",
          objectiveId: objective.id,
          objectiveTargetId: targetId,
          colliderProfile: { type: "visualOnly", blocksMovement: false },
        });
        area.portals.push({
          id: portalId,
          type: "objective",
          state: "open",
          x: centerX,
          interactionRange: 62,
          collision: "none",
          interaction: "manual",
          interactionKey: "E",
          label: target.label,
          prompt: target.prompt,
          actionLabel: target.actionLabel,
          objectiveId: objective.id,
          objectiveType: objective.type,
          objectiveTarget: true,
          objectiveTargetId: targetId,
          objectiveTargetIndex: targetIndex,
          objectiveTargetCount: blueprint.targets.length,
          propId,
          hideWorldPortal: true,
          requiresAreaClear: Boolean(target.requiresAreaClear),
        });
        return {
          id: targetId,
          portalId,
          propId,
          propFile: target.propFile,
          x: centerX,
          label: target.label,
          prompt: target.prompt,
          requiresAreaClear: Boolean(target.requiresAreaClear),
        };
      });
      objective.targetIds = area.objectiveTargets.map((target) => target.id);
      objective.targetCount = area.objectiveTargets.length;
    }
    area.campaignRouteIndex = index;
  }

  function availableCampaignPortalX(area, preferredX, searchDirection) {
    let x = preferredX;
    const minimum = area.minX + 54;
    const maximum = area.maxX - 54;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const overlapsAuthoredPortal = (area.portals || []).some((portal) =>
        Math.abs(Number(portal.x) - x) < (portal.objectiveTarget ? 142 : 92));
      if (!overlapsAuthoredPortal) return Math.max(minimum, Math.min(maximum, x));
      x += searchDirection * 112;
      x = Math.max(minimum, Math.min(maximum, x));
    }
    return Math.max(minimum, Math.min(maximum, x));
  }

  const campaignRouteLinks = [];
  for (let index = 0; index < RUNTIME_CAMPAIGN_ZONES.length - 1; index += 1) {
    const fromEntry = RUNTIME_CAMPAIGN_ZONES[index];
    const toEntry = RUNTIME_CAMPAIGN_ZONES[index + 1];
    const fromArea = KageLevels.areas[fromEntry.areaId];
    const toArea = KageLevels.areas[toEntry.areaId];
    const linkId = `campaign-route-${String(index + 1).padStart(2, "0")}`;
    const crossesAct = fromEntry.actId !== toEntry.actId;
    const warp = (
      fromEntry.areaId === "castle-yomi-rift"
      || fromEntry.areaId === "modern-metropolitan-lab"
    );
    const unlockRuleId = crossesAct
      ? `rule-complete-act-${String(
        RUNTIME_CAMPAIGN_ACT_DEFINITIONS.find((act) => act.id === fromEntry.actId).order,
      ).padStart(2, "0")}`
      : "rule-open";
    const forwardPortalId = `${linkId}-forward`;
    const backwardPortalId = `${linkId}-backward`;
    const forwardX = availableCampaignPortalX(fromArea, fromArea.maxX - 70, -1);
    const backwardX = availableCampaignPortalX(toArea, toArea.minX + 70, 1);
    const forward = {
      ...campaignPortal(
        forwardPortalId,
        forwardX,
        { areaId: toArea.id, spawnId: "campaignWest" },
        toArea.label,
        warp ? "E - TRAVERSER LA FAILLE TEMPORELLE" : "E - CONTINUER LA CAMPAGNE",
        warp ? "faille-moderne" : "route-torii",
      ),
      linkId,
      type: warp ? "warp" : "side",
      collision: "solidDoor",
      blockX: forwardX - 18,
      blockWidth: 36,
      interaction: "manual",
      interactionKey: "E",
      bidirectional: true,
      objectiveId: fromEntry.objective.id,
      requiresObjectiveId: fromEntry.objective.id,
      unlockRuleId,
      requiresAreaClear: true,
      requiresConfirmation: warp,
      unlockEncounterId: fromArea.completionGate.type === "boss"
        ? fromArea.completionGate.encounterId
        : undefined,
      actBoundary: crossesAct,
      preserveOriginState: true,
      transitionPresentation: warp ? "temporal-rift-cinematic" : "area-fade",
    };
    const backward = {
      ...campaignPortal(
        backwardPortalId,
        backwardX,
        { areaId: fromArea.id, spawnId: "campaignEast" },
        fromArea.label,
        warp ? "E - REVENIR PAR LA FAILLE" : "E - REVENIR DANS LA ZONE PRECEDENTE",
        warp ? "faille-cyber" : "route-torii",
      ),
      linkId,
      type: warp ? "warp" : "return",
      interaction: "manual",
      interactionKey: "E",
      bidirectional: true,
      actBoundary: crossesAct,
      unlockRuleId: "rule-open",
      preserveOriginState: true,
      transitionPresentation: warp ? "temporal-rift-cinematic" : "area-fade",
    };
    if (!fromArea.portals.some((portal) => portal.id === forwardPortalId)) {
      fromArea.portals.push(forward);
    }
    if (!toArea.portals.some((portal) => portal.id === backwardPortalId)) {
      toArea.portals.push(backward);
    }
    fromArea.objectivePortalId = forwardPortalId;
    const encounter = fromArea.encounters?.find(
      (candidate) => candidate.id === fromArea.completionGate.encounterId,
    );
    if (encounter && !encounter.completionUnlocks.includes(forwardPortalId)) {
      encounter.completionUnlocks.push(forwardPortalId);
    }
    campaignRouteLinks.push({
      id: linkId,
      fromAreaId: fromArea.id,
      toAreaId: toArea.id,
      fromZoneId: fromEntry.zoneId,
      toZoneId: toEntry.zoneId,
      kind: warp ? "warp" : "side",
      bidirectional: true,
      interaction: "manual",
      interactionKey: "E",
      unlockRuleId,
      forwardPortalId,
      backwardPortalId,
      actBoundary: crossesAct,
    });
  }

  const finalCampaignEntry = RUNTIME_CAMPAIGN_ZONES.at(-1);
  const finalCampaignArea = KageLevels.areas[finalCampaignEntry.areaId];
  const finalEndingPortal = {
    id: "campaign-ending-after-shogun-zero",
    linkId: "campaign-ending-after-shogun-zero",
    x: finalCampaignArea.maxX - 70,
    interactionRange: 64,
    collision: "solidDoor",
    blockX: finalCampaignArea.maxX - 88,
    blockWidth: 36,
    type: "ending",
    state: "open",
    visual: "faille-cyber",
    label: "Faille purifiee",
    prompt: "E - SCELLER LE YOMI A TRAVERS LES SIECLES",
    interaction: "manual",
    interactionKey: "E",
    objectiveId: finalCampaignEntry.objective.id,
    requiresObjectiveId: finalCampaignEntry.objective.id,
    requiresAreaClear: true,
    requiresConfirmation: true,
    unlockEncounterId: finalCampaignArea.completionGate.encounterId,
  };
  finalCampaignArea.portals.push(finalEndingPortal);
  finalCampaignArea.objectivePortalId = finalEndingPortal.id;
  const finalEncounter = finalCampaignArea.encounters.find(
    (candidate) => candidate.id === finalCampaignArea.completionGate.encounterId,
  );
  if (finalEncounter) finalEncounter.completionUnlocks.push(finalEndingPortal.id);

  /*
   * Alternance de perspective de la campagne longue.
   *
   * Les cinq missions FPS historiques restent aux indices 0..4. Ces missions
   * obligatoires occupent les fins d'acte aux indices 5..11 et reutilisent les
   * cinq cartes interieures composees a la main par `game.js` via `mapIndex`.
   * Aucun plan n'est genere aleatoirement : chaque profil de materiaux nomme
   * des usages semantiques de l'atlas (sol, enceinte, circulation, chambre,
   * autel).
   */
  const CAMPAIGN_FPS_MISSIONS = [
    {
      id: "forest-root-heart",
      actId: "act-01-forest",
      sourceAreaId: "forest-root-sanctuary",
      mapIndex: 0,
      materialProfile: "contaminated-sanctuary",
      label: "COEUR RACINAIRE DE KAI",
      announcement: "COEUR RACINAIRE - PURIFIEZ LA SOURCE SOUTERRAINE",
      objective: "Detruire les infectes du reseau de racines",
      altarObjective: "Poser un sceau dans le coeur racinaire",
      completionAnnouncement: "COEUR RACINAIRE PURIFIE - LA FORET OUVRE LE PASSAGE",
      altarAssetIndex: 0,
      musicState: "yomi",
      musicIntensity: 0.62,
      start: [1.5, 1.5, 0],
      altar: [12.5, 11.5],
      rosterIds: [
        "r06-yama-woodcutter",
        "r09-haka-digger",
        "s05-raimei-yamabushi",
        "s19-wana-trapper",
        "mb-09-pisteur-kegare",
      ],
      enemies: [
        [4.5, 1.5], [8.5, 1.5], [3.5, 5.5], [8.5, 5.5],
        [12.2, 7.5], [6.5, 9.5], [11.5, 13.2],
      ],
    },
    {
      id: "bamboo-moon-sanctum",
      actId: "act-02-bamboo",
      sourceAreaId: "bamboo-moon-clearing",
      mapIndex: 3,
      materialProfile: "market-road-shrine",
      label: "SANCTUAIRE DE LA LUNE FENDUE",
      announcement: "LUNE FENDUE - ROMPEZ LA PROCESSION DU YOMI",
      objective: "Purifier les galeries du sanctuaire de bambou",
      altarObjective: "Rendre son souffle a la cloche de Shigure",
      completionAnnouncement: "SANCTUAIRE PURIFIE - LES BAMBOUS REPRENNENT LEUR CHANT",
      altarAssetIndex: 0,
      musicState: "yomi",
      musicIntensity: 0.66,
      start: [1.5, 1.5, 0],
      altar: [15.5, 15.5],
      rosterIds: [
        "s01-kusa-shinobi",
        "s02-doku-kunoichi",
        "s16-kage-mai-dancer",
        "mb-06-shinobi-brumes",
      ],
      enemies: [
        [6.5, 1.5], [14.5, 2.5], [2.5, 6.5], [8.5, 5.5],
        [14.5, 7.5], [5.5, 10.5], [10.5, 10.5], [14.5, 14.5],
      ],
    },
    {
      id: "fields-granary-cellar",
      actId: "act-03-fields",
      sourceAreaId: "fields-burning-granary",
      mapIndex: 2,
      materialProfile: "kurokawa-sick-house",
      label: "CELLER DU GRENIER NOIR",
      announcement: "GRENIER NOIR - ETEIGNEZ LE FOYER SOUS LES RECOLTES",
      objective: "Liberer les reserves contaminees",
      altarObjective: "Bruler la semence noire dans le bassin rituel",
      completionAnnouncement: "GRENIER PURIFIE - LA ROUTE DE KUROKAWA EST DEGAGEE",
      altarAssetIndex: 0,
      musicState: "yomi",
      musicIntensity: 0.7,
      start: [1.5, 15.5, -Math.PI / 2],
      altar: [15.5, 1.5],
      rosterIds: [
        "r05-kome-porter",
        "r17-umaya-groom",
        "s13-kegare-sumotori",
        "s19-wana-trapper",
        "mb-17-sumotori-namazu",
      ],
      enemies: [
        [3.5, 15.5], [8.5, 14.5], [13.5, 14.5], [2.5, 10.5],
        [8.5, 9.5], [14.5, 10.5], [3.5, 7.5], [13.5, 3.5],
      ],
    },
    {
      id: "city-firewatch-vault",
      actId: "act-04-city",
      sourceAreaId: "city-castle-approach",
      mapIndex: 3,
      materialProfile: "market-road-shrine",
      label: "SOUTERRAIN DE LA TOUR DE GUET",
      announcement: "TOUR DE GUET - ETOUFFEZ LE FEU DU KEGARE",
      objective: "Nettoyer les caves de la garde de Kurokawa",
      altarObjective: "Rallumer le brasero de veille avec une flamme pure",
      completionAnnouncement: "TOUR PURIFIEE - LES PORTES DU CHATEAU REPONDENT",
      altarAssetIndex: 0,
      musicState: "combat",
      musicIntensity: 0.72,
      start: [1.5, 1.5, 0],
      altar: [15.5, 15.5],
      rosterIds: [
        "r10-hikeshi-watchman",
        "s06-oni-men-executioner",
        "s15-teppo-corpsman",
        "s17-kurohata-bearer",
        "mb-01-gunso-croc-fer",
      ],
      enemies: [
        [6.5, 1.5], [14.5, 2.5], [2.5, 6.5], [8.5, 5.5],
        [14.5, 7.5], [5.5, 10.5], [10.5, 10.5], [14.5, 14.5],
      ],
    },
    {
      id: "castle-yomi-threshold",
      actId: "act-05-castle",
      sourceAreaId: "castle-yomi-rift",
      mapIndex: 1,
      materialProfile: "kurokawa-donjon",
      label: "SEUIL INTERIEUR DU YOMI",
      announcement: "SEUIL DU YOMI - FERMEZ LA BLESSURE DU DAIMYO",
      objective: "Rompre la garde spectrale du seuil",
      altarObjective: "Sceller le trone interieur du Yomi",
      completionAnnouncement: "SEUIL SCELLE - LA FAILLE TEMPORELLE SE STABILISE",
      altarAssetIndex: 1,
      musicState: "boss",
      musicIntensity: 0.9,
      start: [1.5, 13.2, -Math.PI / 2],
      altar: [12.5, 11.5],
      rosterIds: [
        "s10-hatamoto-fallen",
        "s12-shikigami-scribe",
        "s18-yomi-herald",
        "mb-18-onmyoji-renard",
        "mb-20-capitaine-byakko",
      ],
      enemies: [
        [3.5, 11.5], [5.5, 7.5], [11.5, 7.5], [6.5, 3.5],
        [12.3, 1.6], [9.5, 11.5], [3.5, 3.5],
      ],
    },
    {
      id: "modern-lab-containment",
      actId: "act-06-contemporary",
      sourceAreaId: "modern-metropolitan-lab",
      mapIndex: 4,
      materialProfile: "modern-metropolitan-lab",
      label: "CONFINEMENT DU LABORATOIRE METROPOLITAIN",
      announcement: "LABORATOIRE - ISOLEZ LA SOUCHE ORIGINELLE",
      objective: "Neutraliser les contamines du laboratoire",
      altarObjective: "Sceller l'echantillon dans la chambre de confinement",
      completionAnnouncement: "SOUCHE CONFINEE - LA BRECHE VERS NEO-EDO EST STABLE",
      altarAssetIndex: 1,
      musicState: "combat",
      musicIntensity: 0.82,
      start: [1.5, 17.5, -Math.PI / 2],
      altar: [17.5, 1.5],
      doorCells: [[6, 1], [12, 2], [8, 6], [15, 12]],
      rosterIds: [
        "new-modern-commuter",
        "new-modern-riot-host",
        "new-modern-response-officer",
        "new-cyber-drone-corpse",
      ],
      enemies: [
        [4.5, 17.5], [9.5, 16.5], [15.5, 17.5], [2.5, 13.5],
        [16.5, 13.5], [3.5, 10.5], [15.5, 10.5], [9.5, 7.5],
        [15.5, 2.5],
      ],
    },
    {
      id: "cyber-yomi-mainframe",
      actId: "act-07-cyberpunk",
      sourceAreaId: "cyber-shogun-core",
      mapIndex: 4,
      materialProfile: "cyber-yomi-mainframe",
      label: "MATRICE DU YOMI",
      announcement: "MATRICE DU YOMI - COUPEZ LA MEMOIRE DU SHOGUN ZERO",
      objective: "Detruire les gardiens de la matrice",
      altarObjective: "Graver le sceau du shogun dans le noyau",
      completionAnnouncement: "MATRICE PURIFIEE - LE YOMI PEUT ETRE REFERME",
      altarAssetIndex: 1,
      musicState: "boss",
      musicIntensity: 0.96,
      start: [1.5, 17.5, -Math.PI / 2],
      altar: [17.5, 1.5],
      doorCells: [[12, 1], [6, 5], [10, 6], [3, 12]],
      rosterIds: [
        "new-cyber-neon-shinobi",
        "new-cyber-drone-corpse",
        "new-cyber-oni-frame",
        "new-cyber-yomi-hacker",
      ],
      enemies: [
        [4.5, 17.5], [9.5, 16.5], [15.5, 17.5], [2.5, 13.5],
        [16.5, 13.5], [3.5, 10.5], [15.5, 10.5], [2.5, 7.5],
        [9.5, 7.5], [15.5, 2.5],
      ],
    },
  ].map((mission, campaignIndex) => ({
    ...mission,
    missionIndex: 5 + campaignIndex,
    campaignMission: true,
    required: true,
    optional: false,
    sealReward: 1,
    secretId: `campaign-fps-${mission.id}`,
    reward: {
      score: 2200 + campaignIndex * 450,
      health: 18,
      ammo: 3,
      currencies: {
        mon: 75 + campaignIndex * 25,
        tamahagane: 1,
        yomiAsh: 1,
      },
    },
  }));

  for (const mission of CAMPAIGN_FPS_MISSIONS) {
    const area = KageLevels.areas[mission.sourceAreaId];
    if (!area) {
      throw new Error(`Mission FPS campaign sans sortie de zone: ${mission.id}`);
    }
    const forwardPortal = area.portals.find(
      (portal) => portal.id === area.objectivePortalId,
    );
    if (!forwardPortal) {
      throw new Error(`Mission FPS campaign sans sortie de zone: ${mission.id}`);
    }
    const portalX = availableCampaignPortalX(area, area.maxX - 286, -1);
    const returnSpawnId = "campaignFpsReturn";
    area.spawns[returnSpawnId] = {
      x: Math.max(area.minX + 36, portalX - 58),
      y: PLAYER_GROUND_Y,
      facing: 1,
    };
    const portalId = `campaign-fps-${mission.id}`;
    area.portals.push({
      id: portalId,
      linkId: portalId,
      x: portalX,
      interactionRange: 58,
      collision: "portal",
      type: "fps",
      state: "open",
      visual: mission.actId === "act-05-castle"
        ? "porte-laquee"
        : (mission.actId === "act-06-contemporary"
          ? "faille-moderne"
          : (mission.actId === "act-07-cyberpunk" ? "faille-cyber" : "porte-sanctuaire")),
      label: mission.label,
      prompt: `E - ENTRER DANS ${mission.label}`,
      interaction: "manual",
      interactionKey: "E",
      mission: mission.id,
      missionIndex: mission.missionIndex,
      destination: { missionId: mission.id },
      returnAreaId: area.id,
      returnSpawnId,
      campaignMission: true,
      requiredForForward: true,
      preserveOriginState: true,
    });
    forwardPortal.requiresFpsMissionId = mission.id;
    forwardPortal.requiresFpsPurification = true;
    forwardPortal.fpsGatePortalId = portalId;
    area.requiredFpsMissionId = mission.id;
    area.campaignFpsMissionIds = [mission.id];
    area.fpsMaterialProfileIds = [
      ...new Set([...(area.fpsMaterialProfileIds || []), mission.materialProfile]),
    ];
  }

  KageLevels.campaignFpsMissions = CAMPAIGN_FPS_MISSIONS.map((mission) => ({
    ...mission,
    start: [...mission.start],
    altar: [...mission.altar],
    rosterIds: [...mission.rosterIds],
    enemies: mission.enemies.map((position) => [...position]),
    reward: { ...mission.reward },
  }));

  /*
   * Ces sorties appartiennent au parcours 11 zones anterieur. Elles restent
   * presentes pour relire les sauvegardes et les tests historiques, mais sont
   * explicitement exclues du graphe 28 zones afin que la couche de progression
   * puisse les masquer pendant une nouvelle campagne.
   */
  const canonicalCampaignPortalIds = new Set(
    campaignRouteLinks.flatMap((link) => [
      link.forwardPortalId,
      link.backwardPortalId,
    ]),
  );
  /*
   * Tout ancien passage aire -> aire qui n'appartient pas au graphe canonique
   * est un raccourci de compatibilite. Cette detection exhaustive evite qu'un
   * portail historique oublie dans une liste permette de sauter un objectif,
   * une mission FPS obligatoire ou une fin d'acte.
   */
  const legacyShortcutPortalIds = [...new Set([
    "forest-to-bamboo",
    "bamboo-to-fields",
    "fields-to-kurokawa",
    "road-to-castle",
    "corridor-to-donjon",
    "castle-to-contemporary-warp",
    "modern-to-cyber",
    "cyber-yomi-core",
    ...Object.values(KageLevels.areas).flatMap((area) =>
      (area.portals || [])
        .filter((portal) =>
          portal.destination?.areaId
          && !canonicalCampaignPortalIds.has(portal.id))
        .map((portal) => portal.id)),
  ])];
  for (const area of Object.values(KageLevels.areas)) {
    for (const portal of area.portals || []) {
      if (!legacyShortcutPortalIds.includes(portal.id)) continue;
      portal.campaignCompatibility = "legacy-shortcut";
      portal.excludedFromCampaignRoute = true;
    }
  }

  const campaignActs = Object.fromEntries(
    RUNTIME_CAMPAIGN_ACT_DEFINITIONS.map((definition) => {
      const zoneEntries = RUNTIME_CAMPAIGN_ZONES.filter(
        (entry) => entry.actId === definition.id,
      );
      return [
        definition.id,
        {
          ...definition,
          areaIds: zoneEntries.map((entry) => entry.areaId),
          zoneIds: zoneEntries.map((entry) => entry.zoneId),
          objectiveIds: zoneEntries.map((entry) => entry.objective.id),
          fpsMissionIds: CAMPAIGN_FPS_MISSIONS
            .filter((mission) => mission.actId === definition.id)
            .map((mission) => mission.id),
          entryAreaId: zoneEntries[0].areaId,
          exitAreaId: zoneEntries.at(-1).areaId,
          bossAreaId: zoneEntries.find(
            (entry) => entry.objective.targetEnemyId === definition.bossEnemyId,
          )?.areaId || zoneEntries.at(-1).areaId,
          completionRuleId: `rule-complete-act-${String(definition.order).padStart(2, "0")}`,
        },
      ];
    }),
  );

  KageLevels.campaignActs = campaignActs;
  KageLevels.campaignObjectives = campaignObjectives;
  KageLevels.campaignRuntime = {
    schema: 2,
    buildId: "20260719-seven-act-runtime-v5",
    status: "playable-data",
    totalActs: RUNTIME_CAMPAIGN_ACT_DEFINITIONS.length,
    totalZones: RUNTIME_CAMPAIGN_ZONES.length,
    startAreaId: RUNTIME_CAMPAIGN_ZONES[0].areaId,
    finalAreaId: finalCampaignArea.id,
    startZoneId: RUNTIME_CAMPAIGN_ZONES[0].zoneId,
    finalZoneId: finalCampaignEntry.zoneId,
    zoneToAreaId: Object.fromEntries(
      RUNTIME_CAMPAIGN_ZONES.map((entry) => [entry.zoneId, entry.areaId]),
    ),
    areaToZoneId: Object.fromEntries(
      RUNTIME_CAMPAIGN_ZONES.map((entry) => [entry.areaId, entry.zoneId]),
    ),
    linearRoute: RUNTIME_CAMPAIGN_ZONES.map((entry) => entry.areaId),
    routeLinks: campaignRouteLinks,
    fpsMissionIds: CAMPAIGN_FPS_MISSIONS.map((mission) => mission.id),
    requiredFpsMissions: CAMPAIGN_FPS_MISSIONS.length,
    finalEndingPortalId: finalEndingPortal.id,
    legacyShortcutPortalIds,
    legacyAreasPreserved: 11,
    generatedRuntimeAreas: RUNTIME_NEW_AREA_DEFINITIONS.length,
  };

  KageLevels.startAreaId = KageLevels.campaignRuntime.startAreaId;
  KageLevels.startSpawnId = "prologue";
  KageLevels.worldActs = Object.values(campaignActs).map((act) => ({
    id: act.id,
    order: act.order,
    label: act.label,
    biomeId: act.biomeId,
    areaIds: act.areaIds,
    entryAreaId: act.entryAreaId,
    exitAreaId: act.exitAreaId,
    bossAreaId: act.bossAreaId,
    bossEnemyId: act.bossEnemyId,
    environmentIndex: KageLevels.areas[act.entryAreaId].environmentIndex,
  }));

  for (const act of Object.values(campaignActs)) {
    const chapterKey = act.id
      .replace(/^act-\d+-/, "");
    KageLevels.chapters[chapterKey] = {
      ...(KageLevels.chapters[chapterKey] || {}),
      id: chapterKey,
      label: act.label,
      areaIds: act.areaIds,
      entryAreaId: act.entryAreaId,
      objectiveAreaId: act.exitAreaId,
      actId: act.id,
    };
  }

  KageLevels.mapGraph = {
    nodes: RUNTIME_CAMPAIGN_ZONES.map((entry, index) => ({
      id: entry.areaId,
      zoneId: entry.zoneId,
      actId: entry.actId,
      mapX: index,
      mapY: index % 2 === 0 ? 0 : 1,
      kind: KageLevels.areas[entry.areaId].zoneKind,
    })),
    edges: campaignRouteLinks.map((link) => ({
      id: link.id,
      from: link.fromAreaId,
      to: link.toAreaId,
      kind: link.kind,
      bidirectional: true,
      interaction: "manual",
    })),
  };

  Object.values(KageLevels.areas).forEach(normalizeAreaVisualData);

  const MASSIVE_RENDER_DEFAULTS = {
    maxWidthRatio: 0.55,
    maxHeightRatio: 0.62,
    footAnchor: [0.5, 1],
    preserveSourceAspect: true,
    clampToArenaCamera: true,
  };

  function massiveProfile(definition) {
    return {
      ...definition,
      presentationClass: "massive",
      displayLabel: "Boss massif",
      legacyCategory: "giant",
      modePreference: "side",
      render: {
        ...MASSIVE_RENDER_DEFAULTS,
        ...definition.render,
      },
    };
  }

  const KageMassiveBossProfiles = {
    "giant-01-kurogane-warder": massiveProfile({
      id: "giant-01-kurogane-warder",
      name: "Gardien Kurogane",
      silhouette: "armoredHumanoid",
      render: { targetWidthRatio: 0.39, targetHeightRatio: 0.58 },
      collider: { widthRatio: 0.48, heightRatio: 0.84, anchor: [0.5, 1] },
      arena: {
        kind: "gatehouse",
        minimumWidth: 980,
        horizontal: true,
        cameraLock: true,
        requiredCeilingClearance: 230,
      },
      phases: [
        { id: "living-lock", healthRange: [1, 0.55], pattern: "body-check-and-short-sweep" },
        { id: "torn-gate", healthRange: [0.55, 0], pattern: "beam-club-and-platform-break" },
      ],
      detachableParts: [
        {
          id: "beam-club",
          weaponId: "poutre-massue-kurogane",
          separateSprite: true,
          attachPhase: "torn-gate",
        },
      ],
    }),

    "giant-02-aka-ushi": massiveProfile({
      id: "giant-02-aka-ushi",
      name: "Aka-Ushi",
      silhouette: "wideQuadruped",
      render: {
        targetWidthRatio: 0.5,
        targetHeightRatio: 0.49,
        maxWidthRatio: 0.55,
        maxHeightRatio: 0.56,
      },
      collider: { widthRatio: 0.78, heightRatio: 0.62, anchor: [0.5, 1] },
      arena: {
        id: "aka-ushi-east-gate-arena",
        zoneId: "kurokawa-market-east",
        encounterId: "aka-ushi-east-gate",
        kind: "outdoorRoad",
        bounds: { x: 1120, y: 0, w: 1080, h: 360 },
        playerSpawnId: "bossCheckpoint",
        bossSpawn: { x: 1880, y: 218, facing: -1 },
        horizontal: true,
        cameraLock: true,
        visibleClosingProps: ["arena-barrier-west", "arena-barrier-east"],
        destructibleProps: ["arena-cart", "arena-hay"],
        completionUnlocks: ["road-to-castle"],
      },
      phases: [
        {
          id: "plague-yoke",
          label: "Joug de quarantaine",
          healthRange: [1, 0.5],
          pattern: "telegraphed-horizontal-charge",
          attacks: ["horn-charge", "yoke-sweep", "front-stomp"],
          stunCondition: "charge-collides-with-arena-barrier",
          exposedWeakPointIds: ["yoke-straps"],
        },
        {
          id: "freed-beast",
          label: "Bête affolée",
          healthRange: [0.5, 0],
          pattern: "short-charge-and-back-kick",
          attacks: ["short-charge", "back-kick", "double-stomp"],
          speedMultiplier: 1.28,
          detachedPartIds: ["bladed-yoke"],
          exposedWeakPointIds: ["hind-legs"],
        },
      ],
      weakPoints: [
        {
          id: "yoke-straps",
          attachTo: "shoulders",
          phaseIds: ["plague-yoke"],
          damageMultiplier: 1.7,
          postureDamageMultiplier: 2.2,
          activeWindow: "after-failed-charge",
          destroysPartId: "bladed-yoke",
        },
        {
          id: "hind-legs",
          attachTo: "rearLegs",
          phaseIds: ["freed-beast"],
          damageMultiplier: 1.4,
          activeWindow: "during-back-kick-recovery",
        },
      ],
      detachableParts: [
        {
          id: "bladed-yoke",
          weaponId: "joug-tranchant-aka-ushi",
          separateSprite: true,
          attachPoint: "neckRig",
          detachTransition: "phase-2",
          detachedCollision: "hazard",
          persistsAfterDetach: true,
        },
      ],
    }),

    "giant-03-take-mori": massiveProfile({
      id: "giant-03-take-mori",
      name: "Take-Mori",
      silhouette: "tallHumanoid",
      render: { targetWidthRatio: 0.36, targetHeightRatio: 0.6 },
      collider: { widthRatio: 0.45, heightRatio: 0.88, anchor: [0.5, 1] },
      arena: {
        kind: "bambooClearing",
        minimumWidth: 1050,
        horizontal: true,
        cameraLock: true,
        requiredCeilingClearance: 240,
      },
      phases: [
        { id: "bare-hands", healthRange: [1, 0.6], pattern: "palms-and-forearms" },
        { id: "bamboo-ram", healthRange: [0.6, 0], pattern: "horizontal-ram-charge" },
      ],
      detachableParts: [
        {
          id: "bamboo-ram",
          weaponId: "belier-bambou-take-mori",
          separateSprite: true,
          attachPhase: "bamboo-ram",
        },
      ],
    }),

    "giant-04-enjin-bozu": massiveProfile({
      id: "giant-04-enjin-bozu",
      name: "Enjin-Bōzu",
      silhouette: "heavyHumanoid",
      render: { targetWidthRatio: 0.41, targetHeightRatio: 0.57 },
      collider: { widthRatio: 0.54, heightRatio: 0.86, anchor: [0.5, 1] },
      arena: {
        kind: "templeCourt",
        minimumWidth: 980,
        horizontal: true,
        cameraLock: true,
        requiredCeilingClearance: 230,
      },
      phases: [
        { id: "contained-embers", healthRange: [1, 0.45], pattern: "palms-and-ground-smash" },
        { id: "burning-bell", healthRange: [0.45, 0], pattern: "segmented-flail-sweeps" },
      ],
      detachableParts: [
        {
          id: "bell-flail",
          weaponId: "fleau-cloche-enjin",
          separateSprite: true,
          composition: {
            mode: "segmentedChain",
            linkSpriteId: "chain-link-iron",
            handleSpriteId: "chain-handle-wood",
            endSpriteId: "bell-weight-enjin",
          },
        },
      ],
    }),

    "giant-05-numa-no-oyakata": massiveProfile({
      id: "giant-05-numa-no-oyakata",
      name: "Numa-no-Oyakata",
      silhouette: "wideHumanoid",
      render: { targetWidthRatio: 0.46, targetHeightRatio: 0.57 },
      collider: { widthRatio: 0.62, heightRatio: 0.82, anchor: [0.5, 1] },
      arena: {
        kind: "riverBank",
        minimumWidth: 1080,
        horizontal: true,
        cameraLock: true,
        requiredCeilingClearance: 225,
      },
      phases: [
        { id: "drowned-body", healthRange: [1, 0.55], pattern: "grabs-and-body-slams" },
        { id: "domain-anchor", healthRange: [0.55, 0], pattern: "anchor-pulls-and-sweeps" },
      ],
      detachableParts: [
        {
          id: "river-anchor",
          weaponId: "ancre-riviere-numa",
          separateSprite: true,
          attachPhase: "domain-anchor",
        },
      ],
    }),

    "giant-06-kinoko-haha": massiveProfile({
      id: "giant-06-kinoko-haha",
      name: "Kinoko-Haha",
      silhouette: "wideOrganic",
      render: { targetWidthRatio: 0.48, targetHeightRatio: 0.55 },
      collider: { widthRatio: 0.66, heightRatio: 0.8, anchor: [0.5, 1] },
      arena: {
        kind: "quarantineGarden",
        minimumWidth: 1000,
        horizontal: true,
        cameraLock: true,
        requiredCeilingClearance: 220,
      },
      phases: [
        { id: "spore-growths", healthRange: [1, 0.5], pattern: "space-control-and-sweep" },
        { id: "broken-growths", healthRange: [0.5, 0], pattern: "short-rush-and-incense-cloud" },
      ],
      detachableParts: [
        {
          id: "spore-censer",
          weaponId: "encensoir-spores-kinoko",
          separateSprite: true,
        },
      ],
    }),

    "giant-07-shiro-kabuto": massiveProfile({
      id: "giant-07-shiro-kabuto",
      name: "Shiro-Kabuto",
      silhouette: "lowWide",
      render: { targetWidthRatio: 0.55, targetHeightRatio: 0.44 },
      collider: { widthRatio: 0.8, heightRatio: 0.66, anchor: [0.5, 1] },
      arena: {
        kind: "riceTerrace",
        minimumWidth: 1120,
        horizontal: true,
        cameraLock: true,
        requiredCeilingClearance: 190,
      },
      phases: [
        { id: "closed-shell", healthRange: [1, 0.48], pattern: "guard-and-low-charge" },
        { id: "cracked-shell", healthRange: [0.48, 0], pattern: "fast-lateral-rushes" },
      ],
      detachableParts: [
        {
          id: "shell-shield",
          weaponId: "bouclier-carapace-shiro",
          separateSprite: true,
          detachTransition: "phase-2",
        },
      ],
    }),

    "giant-08-nuno-kyojin": massiveProfile({
      id: "giant-08-nuno-kyojin",
      name: "Nuno-Kyojin",
      silhouette: "tallLimb",
      render: { targetWidthRatio: 0.36, targetHeightRatio: 0.62 },
      collider: { widthRatio: 0.42, heightRatio: 0.9, anchor: [0.5, 1] },
      arena: {
        kind: "prisonYard",
        minimumWidth: 1100,
        horizontal: true,
        cameraLock: true,
        requiredCeilingClearance: 245,
      },
      phases: [
        { id: "bound-arms", healthRange: [1, 0.55], pattern: "chain-drag-and-grab" },
        { id: "broken-manacles", healthRange: [0.55, 0], pattern: "long-arm-slams" },
      ],
      detachableParts: [
        {
          id: "prison-chain",
          weaponId: "chaines-menottes-nuno",
          separateSprite: true,
          detachTransition: "phase-2",
          composition: {
            mode: "segmentedChain",
            linkSpriteId: "chain-link-iron",
            startSpriteId: "manacle-left",
            endSpriteId: "manacle-right",
          },
        },
      ],
    }),

    "giant-09-ganseki-otoko": massiveProfile({
      id: "giant-09-ganseki-otoko",
      name: "Ganseki-Otoko",
      silhouette: "armoredHumanoid",
      render: { targetWidthRatio: 0.44, targetHeightRatio: 0.58 },
      collider: { widthRatio: 0.58, heightRatio: 0.86, anchor: [0.5, 1] },
      arena: {
        kind: "quarryFloor",
        minimumWidth: 1080,
        horizontal: true,
        cameraLock: true,
        requiredCeilingClearance: 230,
      },
      phases: [
        { id: "stone-armor", healthRange: [1, 0.52], pattern: "armored-advance" },
        { id: "quarry-breaker", healthRange: [0.52, 0], pattern: "hammer-terrain-breaks" },
      ],
      detachableParts: [
        {
          id: "quarry-hammer",
          weaponId: "marteau-carriere-ganseki",
          separateSprite: true,
          attachPhase: "quarry-breaker",
        },
      ],
    }),

    "giant-10-yomi-no-kanrei": massiveProfile({
      id: "giant-10-yomi-no-kanrei",
      name: "Yomi-no-Kanrei",
      silhouette: "finalHumanoid",
      render: { targetWidthRatio: 0.46, targetHeightRatio: 0.62 },
      collider: { widthRatio: 0.58, heightRatio: 0.88, anchor: [0.5, 1] },
      arena: {
        kind: "yomiGate",
        minimumWidth: 1280,
        horizontal: true,
        cameraLock: true,
        requiredCeilingClearance: 250,
      },
      phases: [
        { id: "regent", healthRange: [1, 0.66], pattern: "four-arm-unarmed-combos" },
        { id: "black-nodachi", healthRange: [0.66, 0.32], pattern: "nodachi-sweeps" },
        { id: "broken-regency", healthRange: [0.32, 0], pattern: "desperate-mixed-combos" },
      ],
      detachableParts: [
        {
          id: "yomi-nodachi",
          weaponId: "nodachi-geant-yomi",
          separateSprite: true,
          attachPhase: "black-nodachi",
        },
      ],
    }),

    "new-modern-metro-colossus": massiveProfile({
      id: "new-modern-metro-colossus",
      name: "Colosse de la ligne Yomi",
      silhouette: "metroExoskeleton",
      render: {
        targetWidthRatio: 0.52,
        targetHeightRatio: 0.58,
        maxWidthRatio: 0.56,
        maxHeightRatio: 0.62,
      },
      collider: { widthRatio: 0.62, heightRatio: 0.84, anchor: [0.5, 1] },
      arena: {
        kind: "metropolitanLab",
        zoneId: "modern-metropolitan-lab",
        minimumWidth: 1120,
        horizontal: true,
        cameraLock: true,
        requiredCeilingClearance: 238,
      },
      phases: [
        {
          id: "maintenance-shell",
          healthRange: [1, 0.52],
          pattern: "door-sweeps-and-heavy-charge",
        },
        {
          id: "terminus-overload",
          healthRange: [0.52, 0],
          pattern: "shockwave-combos-and-rail-rush",
        },
      ],
      detachableParts: [
        {
          id: "metro-car-door",
          weaponId: "metro-car-door",
          separateSprite: true,
        },
      ],
    }),
  };

  const host = typeof window !== "undefined" ? window : globalThis;
  host.KageLevels = KageLevels;
  host.KageMassiveBossProfiles = KageMassiveBossProfiles;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      KageLevels,
      KageMassiveBossProfiles,
    };
  }
})();
