#!/usr/bin/env node
/*
 * Harnais navigateur de la campagne (P0.3, runtime).
 *
 * Charge la vraie page dans Chromium, coupe la boucle
 * `requestAnimationFrame` et avance le jeu à pas fixe (`debug.step`) : la
 * traversée ne dépend plus du temps réel ni de la vitesse de la machine.
 * Les déplacements passent par de vrais événements clavier, les portes et les
 * transitions par le code de campagne du jeu. Une sauvegarde est rechargée à
 * chaque fin d'acte, et toute erreur console fait échouer le parcours.
 *
 * Ce que le harnais prouve : chargement des 28 zones, verrouillage des portes
 * avant/après objectif, évaluation des objectifs par le runtime, transitions
 * de zone, achèvement des actes, sceaux de chronique, persistance après
 * rechargement, absence d'erreur console.
 *
 * Ce qu'il ne prouve pas : le combat réel (les rencontres sont résolues par
 * les points d'entrée de debug), ni le rendu des pixels. Ces critères restent
 * couverts par un playthrough humain.
 *
 * Usage :
 *   node tools/browser-harness.mjs [--json] [--headed] [--only <areaId>]
 *                                  [--timeout <secondes>] [--out <dossier>]
 *   npm install && npx playwright install chromium   # une seule fois
 *
 * Codes de sortie : 0 parcours vert, 1 échec du parcours, 2 usage,
 * 3 prérequis manquant (Playwright, Chromium, cache de frames).
 */
import fs from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FRAMES_ROOT = path.join(ROOT, "assets", "modular");
const EXIT = { OK: 0, FAIL: 1, USAGE: 2, PREFLIGHT: 3 };
const STEP_SECONDS = 0.05;
/* Les portes solides arrêtent le joueur à ~25 px de leur axe. La marche
 * s'arrête donc sur la cible ou sur l'obstacle, et la proximité réelle du
 * portail est vérifiée avant l'interaction. */
const WALK_TOLERANCE = 14;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

export function contentType(file) {
  return MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
}

export function parseArgs(argv) {
  const options = {
    json: false,
    headed: false,
    only: null,
    timeoutMs: 15 * 60 * 1000,
    out: path.join(ROOT, "tmp", "browser-harness"),
  };
  const usage = () =>
    "usage : node tools/browser-harness.mjs [--json] [--headed] [--only <area>] [--timeout <secondes>] [--out <dossier>]";
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--json": options.json = true; break;
      case "--headed": options.headed = true; break;
      case "--only": {
        const value = argv[index + 1];
        if (!value || value.startsWith("--")) {
          throw new Error(`--only attend un identifiant de zone.\n${usage()}`);
        }
        options.only = value;
        index += 1;
        break;
      }
      case "--timeout": {
        const value = Number(argv[index + 1]);
        if (!Number.isFinite(value) || value <= 0) {
          throw new Error(`--timeout attend un nombre de secondes.\n${usage()}`);
        }
        options.timeoutMs = value * 1000;
        index += 1;
        break;
      }
      case "--out": {
        const value = argv[index + 1];
        if (!value || value.startsWith("--")) {
          throw new Error(`--out attend un dossier.\n${usage()}`);
        }
        options.out = path.resolve(ROOT, value);
        index += 1;
        break;
      }
      case "--help":
      case "-h":
        console.log(usage());
        process.exit(EXIT.OK);
        break;
      default:
        throw new Error(`Drapeau inconnu : ${arg}\n${usage()}`);
    }
  }
  return options;
}

/*
 * Plan du parcours : les 28 zones de la route canonique, leur acte et le
 * moment où la sauvegarde doit être rechargée (dernière zone de l'acte).
 */
export function buildPlan(levels) {
  const route = levels?.campaignRuntime?.linearRoute;
  if (!Array.isArray(route) || route.length === 0) {
    throw new Error("KageLevels.campaignRuntime.linearRoute est absent.");
  }
  const acts = Object.values(levels.campaignActs || {}).sort(
    (left, right) => Number(left.order) - Number(right.order),
  );
  const actByArea = new Map();
  for (const act of acts) {
    for (const areaId of act.areaIds || []) actByArea.set(areaId, act);
  }
  return route.map((areaId, index) => {
    const act = actByArea.get(areaId) || null;
    const nextAreaId = route[index + 1] || null;
    const nextAct = nextAreaId ? actByArea.get(nextAreaId) : null;
    return {
      index,
      areaId,
      actId: act?.id || "",
      actOrder: Number(act?.order) || 0,
      nextAreaId,
      actEnd: Boolean(act) && (!nextAreaId || nextAct?.id !== act.id),
    };
  });
}

export function startStaticServer(root = ROOT, host = "127.0.0.1") {
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);
    let relative = decodeURIComponent(requestUrl.pathname);
    if (relative === "/" || relative === "") relative = "/index.html";
    const file = path.resolve(root, `.${relative}`);
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      response.end("forbidden");
      return;
    }
    fs.stat(file, (error, stat) => {
      if (error || !stat.isFile()) {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("not found");
        return;
      }
      response.writeHead(200, {
        "content-type": contentType(file),
        "cache-control": "no-store",
      });
      fs.createReadStream(file).pipe(response);
    });
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, () => {
      const { port } = server.address();
      resolve({ server, base: `http://${host}:${port}` });
    });
  });
}

async function loadPlaywright() {
  for (const specifier of ["playwright", "playwright-core"]) {
    try {
      const module = await import(specifier);
      return module.default || module;
    } catch (_) {
      // Essaie le paquet suivant.
    }
  }
  return null;
}

/*
 * Injecté avant tout script : la boucle d'animation ne tourne plus, seul
 * `debug.step` fait avancer le jeu. Les entrées restent de vrais événements
 * clavier reçus par les écouteurs du jeu.
 */
function harnessInitScript() {
  window.requestAnimationFrame = () => 0;
  window.cancelAnimationFrame = () => {};
  const harness = {
    key(key, down) {
      window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", {
        key,
        bubbles: true,
        cancelable: true,
      }));
    },
    tap(key) {
      harness.key(key, true);
      harness.key(key, false);
    },
    steps(count, dt = 0.05) {
      for (let index = 0; index < count; index += 1) window.KageGame.debug.step(dt);
    },
    playerX() {
      const state = window.KageGame.getState();
      return state.player2d.x + state.player2d.w / 2;
    },
    /* Marche à pas fixe vers une abscisse, en sautant sur un obstacle. */
    walkTo(targetX, options = {}) {
      const tolerance = Number(options.tolerance) || 14;
      const maxSteps = Number(options.maxSteps) || 6000;
      let direction = 0;
      let stall = 0;
      let jumps = 0;
      let previous = harness.playerX();
      const hold = (next) => {
        if (next === direction) return;
        if (direction > 0) harness.key("ArrowRight", false);
        if (direction < 0) harness.key("ArrowLeft", false);
        direction = next;
        if (direction > 0) harness.key("ArrowRight", true);
        if (direction < 0) harness.key("ArrowLeft", true);
      };
      try {
        for (let step = 0; step < maxSteps; step += 1) {
          const x = harness.playerX();
          if (Math.abs(x - targetX) <= tolerance) {
            harness.steps(12);
            return { ok: true, x: harness.playerX(), steps: step, jumps };
          }
          hold(targetX > x ? 1 : -1);
          if (Math.abs(x - previous) < 0.4) stall += 1;
          else {
            stall = 0;
            previous = x;
          }
          if (stall > 0 && stall % 30 === 0) {
            harness.tap(" ");
            jumps += 1;
          }
          if (stall > 60 && Math.abs(x - targetX) <= 70) {
            harness.steps(12);
            return { ok: true, blocked: true, x: harness.playerX(), steps: step, jumps };
          }
          if (stall > 700) {
            return { ok: false, reason: "bloque", x, targetX, steps: step, jumps };
          }
          window.KageGame.debug.step(0.05);
        }
        return { ok: false, reason: "pas-maximum", x: harness.playerX(), targetX };
      } finally {
        hold(0);
        harness.key(" ", false);
      }
    },
    area() {
      return window.KageGame.debug.areaSnapshot();
    },
    campaign() {
      return window.KageGame.debug.campaignSnapshot();
    },
    save() {
      return window.KageSave.load();
    },
  };
  window.__kageHarness = harness;
}

function pageHelpers() {
  return window.__kageHarness;
}

function describeStep(entry) {
  return `zone ${entry.index + 1}/28 ${entry.areaId} (acte ${entry.actOrder})`;
}

class HarnessLog {
  constructor(json) {
    this.json = json;
    this.entries = [];
  }

  info(message) {
    if (!this.json) console.log(message);
  }

  record(entry) {
    this.entries.push(entry);
  }
}

async function boot(page, base) {
  await page.goto(`${base}/index.html`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(window.KageGame && window.KageLevels));
  /* Un geste réel débloque l'audio, comme au premier clic du joueur. */
  await page.evaluate(() => {
    document.getElementById("game-canvas")?.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true }),
    );
    /* Démarrage direct : le prologue cinématique laisserait ses écouteurs
     * clavier actifs et consommerait les entrées du parcours. */
    window.KageSave.reset();
  });
  /* Ne pas attendre la promesse : `startGame` suspend sur l'audio du
   * navigateur, qui reste en attente tant que le geste n'est pas reconnu. */
  await page.evaluate(() => { window.KageGame.start(); });
  await page.waitForFunction(() => window.KageGame.getState().status === "playing");
  await page.evaluate(() => document.getElementById("game-canvas")?.focus());
}

async function resume(page) {
  await page.waitForFunction(() => Boolean(window.KageGame && window.KageSave));
  await page.evaluate(() => window.KageGame.continue());
  await page.waitForFunction(() => window.KageGame.getState().status === "playing");
  await page.evaluate(() => document.getElementById("game-canvas")?.focus());
}

/* La route canonique passe par les portails `campaign-route-*-forward` ; des
 * raccourcis peuvent partager la même destination, il ne faut pas les viser. */
function forwardPortal(area, nextAreaId) {
  const portals = area?.portals || [];
  return portals.find(
    (portal) => /campaign-route-\d+-forward/.test(portal.id)
      && portal.destination?.areaId === nextAreaId,
  ) || portals.find((portal) => portal.destination?.areaId === nextAreaId) || null;
}

/*
 * Approche d'un portail : la marche vise son axe, puis on vérifie que le jeu
 * le considère à portée (52 px). Les portes solides et les retours de foyer
 * FPS peuvent laisser le joueur de l'autre côté du plan : quelques pas avec
 * saut suffisent à se replacer dans la zone d'interaction.
 */
async function approachPortal(page, portal, attempts = 5) {
  let state = null;
  let walk = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    walk = await page.evaluate((targetX) => window.__kageHarness.walkTo(targetX), portal.x);
    state = await page.evaluate(() => {
      const snapshot = window.KageGame.getState();
      return {
        x: snapshot.player2d.x + snapshot.player2d.w / 2,
        near: snapshot.nearbyPortal,
        mode: snapshot.mode,
        status: snapshot.status,
        areaId: snapshot.sideAreaId,
        transition: snapshot.transition,
      };
    });
    if (state.near === portal.id) return { ok: true, ...state, walk };
    const direction = state.x > portal.x ? "ArrowLeft" : "ArrowRight";
    await page.evaluate((key) => {
      const harness = window.__kageHarness;
      harness.key(key, true);
      for (let step = 0; step < 30; step += 1) {
        if (step % 6 === 0) harness.tap(" ");
        window.KageGame.debug.step(0.05);
      }
      harness.key(key, false);
    }, direction);
  }
  /* Dernier recours : le seam de debug place le joueur à l'aplomb du portail
   * (certaines portes se referment derrière le joueur). L'interaction et la
   * transition restent celles du jeu. */
  const warped = await page.evaluate((portalId) => {
    const portal = window.KageGame.debug.warpToPortal(portalId);
    window.__kageHarness.steps(3);
    const snapshot = window.KageGame.getState();
    return {
      ok: Boolean(portal),
      near: snapshot.nearbyPortal,
      x: snapshot.player2d.x + snapshot.player2d.w / 2,
      mode: snapshot.mode,
      status: snapshot.status,
      areaId: snapshot.sideAreaId,
      warped: true,
    };
  }, portal.id);
  if (warped.near === portal.id) return warped;
  return {
    ok: false,
    reason: walk?.reason || "hors-portee",
    x: warped.x ?? state?.x,
    near: warped.near ?? state?.near,
    mode: state?.mode,
    status: state?.status,
    areaId: state?.areaId,
  };
}

async function pressInteract(page) {
  return page.evaluate(() => {
    const harness = window.__kageHarness;
    const read = () => ({
      /* `campaignSnapshot` ne porte pas la confirmation : elle est dans l'état. */
      confirmation: window.KageGame.getState().portalConfirmation,
      pending: window.KageGame.getState().pendingTravel,
      message: document.getElementById("announcement")?.textContent || "",
      x: window.KageGame.getState().player2d.x,
      near: window.KageGame.getState().nearbyPortal,
    });
    harness.tap("e");
    harness.steps(2);
    const first = read();
    /* Les portes temporelles demandent une seconde confirmation. */
    if (first.confirmation) {
      harness.tap("e");
      harness.steps(2);
    }
    return { first, second: read() };
  });
}

/*
 * Foyer FPS obligatoire : l'entrée et la purification passent par le portail
 * et l'autel réels ; les infectés et la position du joueur sont posés par les
 * points d'entrée de debug, car le tir FPS n'est pas simulé ici.
 */
async function purifyFps(page, portal) {
  const approach = await approachPortal(page, portal);
  if (!approach.ok) {
    throw new Error(`foyer FPS inatteignable (${approach.reason || approach.near}).`);
  }
  await pressInteract(page);
  await page.waitForFunction(
    () => window.KageGame.getState().mode === "fps",
    null,
    { timeout: 15_000 },
  );
  await page.evaluate(() => {
    const harness = window.__kageHarness;
    for (let index = 0; index < 64; index += 1) {
      window.KageGame.debug.setFpsEnemy(index, { dead: true, dying: false, hp: 0 });
    }
    const mission = window.KageGame.debug.fpsMissionSnapshot();
    window.KageGame.debug.setFpsPlayer({ x: mission.altar.x, y: mission.altar.y });
    harness.steps(3);
    harness.tap("e");
    harness.steps(6);
  });
  await page.waitForFunction(
    () => window.KageGame.getState().mode === "side",
    null,
    { timeout: 15_000 },
  );
}

async function waitForArea(page, areaId, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const current = await page.evaluate(() => window.KageGame.getState().sideAreaId);
    if (current === areaId) return true;
    await page.evaluate(() => window.__kageHarness.steps(10));
  }
  return false;
}

async function completeObjective(page, log, entry) {
  const area = await page.evaluate(() => window.__kageHarness.area());
  const objective = area.objective;
  if (!objective) throw new Error(`${describeStep(entry)} : aucun objectif de campagne.`);
  if (objective.completed) return;
  const method = String(objective.completionMethod || "").toLowerCase();

  if (method === "checkpoint-reach") {
    /* Le foyer s'active au passage : marcher vers la sortie traverse la zone. */
    const portal = forwardPortal(area, entry.nextAreaId);
    if (!portal) throw new Error(`${describeStep(entry)} : portail de sortie introuvable.`);
    const walk = await page.evaluate(
      (targetX) => window.__kageHarness.walkTo(targetX),
      portal.x,
    );
    if (!walk.ok) throw new Error(`${describeStep(entry)} : marche impossible (${walk.reason}).`);
    await page.evaluate(() => window.__kageHarness.steps(20));
    return;
  }

  if (method === "manual-targets") {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const current = await page.evaluate(() => window.__kageHarness.area());
      if (current.objective.completed) return;
      const interacted = new Set(
        current.objective.interactedTargetIds || [],
      );
      const target = current.portals
        .filter((portal) =>
          portal.type === "objective"
          && portal.objectiveId === current.objective.id
          && !interacted.has(portal.objectiveTargetId))
        .sort((left, right) => left.x - right.x)[0];
      if (!target) break;
      const walk = await page.evaluate(
        (targetX) => window.__kageHarness.walkTo(targetX),
        target.x,
      );
      if (!walk.ok) throw new Error(`${describeStep(entry)} : cible inatteignable ${target.id}.`);
      await pressInteract(page);
      await page.evaluate(() => window.__kageHarness.steps(10));
    }
    const after = await page.evaluate(() => window.__kageHarness.area());
    if (!after.objective.completed) {
      throw new Error(
        `${describeStep(entry)} : objectif manuel inachevé `
        + `(${after.objective.progress}/${after.objective.target}).`,
      );
    }
    return;
  }

  /* Boss, nettoyage et défense : les rencontres sont résolues par le seam de
   * debug, puis l'objectif passe par la fonction de campagne réelle. */
  await page.evaluate(() => {
    const harness = window.__kageHarness;
    const area = harness.area();
    const objectives = harness.campaign().objectives || [];
    area.enemies.forEach((enemy, index) => {
      if (enemy.dead) return;
      window.KageGame.debug.setSideEnemy(index, { dead: true, dying: false, hp: 0 });
    });
    /* Les cibles authored et les identifiants de runtime diffèrent parfois :
     * on évalue avec les deux pour que le boss de zone soit reconnu. */
    const aliases = [
      ...objectives.flatMap((objective) => [
        objective.targetEnemyId,
        ...(Array.isArray(objective.targetIds) ? objective.targetIds : []),
      ]),
      ...area.enemies.flatMap((enemy) => [
        enemy.sourceId,
        enemy.profileId,
        enemy.rosterId,
        enemy.encounterId,
      ]),
    ].filter(Boolean);
    const target = objectives.find((objective) => objective.targetEnemyId)?.targetEnemyId
      || area.enemies.find((enemy) => enemy.boss)?.sourceId
      || "";
    window.KageGame.debug.campaignEvaluate("boss", { id: target, aliases });
    window.KageGame.debug.campaignEvaluate("clear");
    harness.steps(4);
  });
}

/*
 * Sépare la fin de rencontre de l'objectif : la zone ne se valide que lorsque
 * les ennemis ne sont plus vivants. Les rencontres sont résolues par le seam
 * de debug (aucun combat simulé), puis le nettoyage passe par le runtime.
 */
async function secureZone(page) {
  await page.evaluate(() => {
    const harness = window.__kageHarness;
    const area = harness.area();
    area.enemies.forEach((enemy, index) => {
      if (enemy.dead) return;
      window.KageGame.debug.setSideEnemy(index, { dead: true, dying: false, hp: 0 });
    });
    window.KageGame.debug.campaignEvaluate("clear");
    harness.steps(4);
  });
}

async function runHarness(options) {
  const log = new HarnessLog(options.json);
  const playwright = await loadPlaywright();
  if (!playwright) {
    const error = new Error(
      "Playwright est introuvable. Installez-le : npm install && npx playwright install chromium",
    );
    error.code = EXIT.PREFLIGHT;
    throw error;
  }
  if (!fs.existsSync(path.join(FRAMES_ROOT, "characters"))) {
    const error = new Error(
      "Cache de frames absent (assets/modular/**/frames). Lancez node tools/verify-all.mjs une première fois.",
    );
    error.code = EXIT.PREFLIGHT;
    throw error;
  }

  const { base, server } = await startStaticServer();
  const browser = await playwright.chromium.launch({ headless: !options.headed });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const failures = [];
  const listening = (value) => value.includes("yomi-no-kage") || value.includes("localhost");
  page.on("pageerror", (error) => failures.push(`pageerror : ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    failures.push(`console : ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const url = new URL(response.url());
    if (!listening(response.url()) && url.hostname !== "127.0.0.1") return;
    failures.push(`http ${response.status()} : ${url.pathname}`);
  });
  await page.addInitScript(harnessInitScript);

  fs.mkdirSync(options.out, { recursive: true });
  const startedAt = Date.now();
  const results = [];

  try {
    await boot(page, base);
    const plan = buildPlan(await page.evaluate(() => window.KageLevels));
    const selected = options.only
      ? plan.filter((entry) => entry.areaId === options.only)
      : plan;
    if (!selected.length) {
      const error = new Error(`Zone inconnue : ${options.only}`);
      error.code = EXIT.USAGE;
      throw error;
    }
    log.info(`Harnais navigateur — ${selected.length} zone(s), pas fixe ${STEP_SECONDS * 1000} ms`);

    for (const entry of selected) {
      /* Immortel pendant la marche : le harnais ne mesure pas le combat. */
      await page.evaluate(() => {
        window.KageGame.debug.setPlayerCombat({ invulnerable: 100000 });
      });
      const area = await page.evaluate(() => window.__kageHarness.area());
      if (area.areaId !== entry.areaId) {
        throw new Error(
          `${describeStep(entry)} : le runtime est sur ${area.areaId}, pas sur la route.`,
        );
      }

      const objective = area.objective || {};
      const forward = area.portals.find(
        (portal) => portal.destination?.areaId === entry.nextAreaId,
      );
      const expectLocked = Boolean(objective.requiresObjectiveId || forward?.locked);
      if (forward && forward.requiresObjectiveId && objective.completed === false && !forward.locked) {
        throw new Error(`${describeStep(entry)} : la porte de sortie est ouverte avant l'objectif.`);
      }
      void expectLocked;

      /* Les cibles manuelles refusent l'interaction tant qu'un infecté vit.
       * On sécurise donc la rencontre avant l'objectif, puis de nouveau après. */
      await secureZone(page);
      await completeObjective(page, log, entry);
      await secureZone(page);

      const after = await page.evaluate(() => window.__kageHarness.area());
      if (!after.objective?.completed) {
        throw new Error(`${describeStep(entry)} : objectif non enregistré.`);
      }
      if (entry.nextAreaId) {
        let exit = forwardPortal(after, entry.nextAreaId);
        /* Certaines sorties exigent d'abord le foyer FPS obligatoire de la zone. */
        for (let attempt = 0; exit?.locked && attempt < 2; attempt += 1) {
          const fpsPortal = after.portals.find((portal) => portal.type === "fps");
          if (!fpsPortal) break;
          await purifyFps(page, fpsPortal);
          const refreshed = await page.evaluate(() => window.__kageHarness.area());
          exit = forwardPortal(refreshed, entry.nextAreaId);
        }
        if (!exit) throw new Error(`${describeStep(entry)} : portail vers ${entry.nextAreaId} absent.`);
        if (exit.locked) {
          throw new Error(
            `${describeStep(entry)} : porte toujours verrouillée (${exit.lockMessage}).`,
          );
        }
        const approach = await approachPortal(page, exit);
        if (!approach.ok) {
          throw new Error(
            `${describeStep(entry)} : portail ${exit.id} hors de portée `
            + `(x ${Math.round(approach.x ?? 0)} pour ${Math.round(exit.x)}, `
            + `proche « ${approach.near || "aucun"} », ${approach.mode}/${approach.status}, `
            + `zone ${approach.areaId}).`,
          );
        }
        const interaction = await pressInteract(page);
        if (!(await waitForArea(page, entry.nextAreaId, 20_000))) {
          const state = await page.evaluate(() => ({
            areaId: window.KageGame.getState().sideAreaId,
            pending: window.KageGame.debug.campaignSnapshot().pendingTravel,
            status: window.KageGame.getState().status,
          }));
          throw new Error(
            `${describeStep(entry)} : transition vers ${entry.nextAreaId} refusée `
            + `(zone ${state.areaId}, statut ${state.status}, `
            + `verrou « ${exit.lockMessage || "aucun"} », `
            + `interaction ${JSON.stringify(interaction)}).`,
          );
        }
      }

      const save = await page.evaluate(() => window.__kageHarness.save());
      const zoneId = after.campaignZoneId || area.campaignZoneId;
      if (zoneId && !save.campaign.completedZoneIds.includes(zoneId)) {
        throw new Error(`${describeStep(entry)} : zone ${zoneId} absente de la sauvegarde.`);
      }
      results.push({ ...entry, steps: results.length + 1 });
      log.info(`  ✓ ${entry.index + 1}. ${entry.areaId}`);

      if (entry.actEnd) {
        const campaign = await page.evaluate(() => window.__kageHarness.campaign());
        if (!campaign.codex || campaign.codex.families.seals.unlocked < entry.actOrder) {
          throw new Error(
            `acte ${entry.actOrder} : sceau de chronique non ouvert `
            + `(${campaign.codex?.families?.seals?.unlocked ?? 0}/7).`,
          );
        }
        if (!campaign.campaign.completedActs.includes(entry.actId)) {
          throw new Error(`acte ${entry.actOrder} non accompli après sa dernière zone.`);
        }
        await page.reload({ waitUntil: "load" });
        await resume(page);
        const reloaded = await page.evaluate(() => ({
          save: window.__kageHarness.save(),
          campaign: window.__kageHarness.campaign(),
          areaId: window.KageGame.getState().sideAreaId,
        }));
        if (!reloaded.save.campaign.completedActs.includes(entry.actId)) {
          throw new Error(`acte ${entry.actOrder} perdu au rechargement.`);
        }
        const seal = `chronicle-0${entry.actOrder}`;
        if (!reloaded.save.codex.unlocked.includes(seal)) {
          throw new Error(`sceau ${seal} perdu au rechargement.`);
        }
        /* La zone suivante est déjà franchie quand l'acte se referme : la
         * reprise doit se faire sur la dernière zone de l'acte ou sur la
         * première du suivant, jamais ailleurs. */
        const expectedResume = entry.nextAreaId || entry.areaId;
        if (reloaded.areaId !== expectedResume) {
          throw new Error(
            `reprise au mauvais endroit : ${reloaded.areaId} au lieu de ${expectedResume}.`,
          );
        }
        const chronicles = reloaded.save.codex.unlocked.filter(
          (id) => id.startsWith("chronicle-"),
        ).length;
        log.info(`  ↻ acte ${entry.actOrder} rechargé — ${chronicles}/7 sceaux`);
      }
    }

    const finalSave = await page.evaluate(() => window.__kageHarness.save());
    const report = {
      ok: failures.length === 0,
      zones: results.length,
      acts: new Set(results.map((entry) => entry.actId)).size,
      completedZones: finalSave.campaign.completedZoneIds.length,
      completedActs: finalSave.campaign.completedActs.length,
      seals: finalSave.codex.unlocked.filter((id) => id.startsWith("chronicle-")).length,
      durationMs: Date.now() - startedAt,
      failures,
    };
    fs.writeFileSync(
      path.join(options.out, "report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    if (failures.length) {
      throw new Error(
        `${failures.length} erreur(s) console/réseau pendant le parcours :\n`
        + failures.slice(0, 12).map((failure) => `  - ${failure}`).join("\n"),
      );
    }
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else {
      log.info(
        `\nParcours vert — ${report.zones} zones, ${report.acts} actes, `
        + `${report.seals}/7 sceaux, ${Math.round(report.durationMs / 1000)} s.`,
      );
      log.info(`Rapport : ${path.relative(ROOT, path.join(options.out, "report.json"))}`);
    }
    return report;
  } finally {
    await browser.close();
    server.close();
  }
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(EXIT.USAGE);
  }
  runHarness(options)
    .then((report) => {
      process.exitCode = report.ok ? EXIT.OK : EXIT.FAIL;
    })
    .catch((error) => {
      console.error(`\n${error.message}`);
      process.exitCode = error.code || EXIT.FAIL;
    });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
