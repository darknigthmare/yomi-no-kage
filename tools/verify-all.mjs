#!/usr/bin/env node
/*
 * Vérification reproductible du dépôt.
 *
 * Une seule commande : préflight, matérialisation du cache de frames ignoré
 * par Git, puis exécution de tous les smoke tests de la racine. Le cache
 * `assets/modular/**\/frames/` est dérivé des planches : il est régénérable et
 * n'est jamais versionné.
 *
 * Codes de sortie :
 *   0  tout ce qui a été exécuté est vert
 *   1  au moins un test a échoué ou dépassé son délai
 *   2  erreur d'usage (drapeau inconnu, motif sans résultat)
 *   3  prérequis manquant (Node, Python, Pillow, espace disque)
 *   4  la matérialisation ou sa vérification a échoué
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MATERIALIZER = path.join(ROOT, "tools", "materialize-frame-cache.py");
const FRAMES_ROOT = path.join(ROOT, "assets", "modular");
const TIMEOUT_DEFAULT_MS = 90_000;
const DISK_REQUIRED_BYTES = 400 * 1024 * 1024;
const ASSET_STAMP = path.join(ROOT, "tmp", "verify", "assets-stamp.json");

const VALIDATORS = [
  ["tools/validate-modular-pack.mjs", "node"],
  ["tools/verify-modular-registry.mjs", "node"],
];

const EXIT = { OK: 0, FAIL: 1, USAGE: 2, PREFLIGHT: 3, ASSETS: 4 };

function parseArgs(argv) {
  const options = {
    skipAssets: false,
    only: null,
    list: false,
    json: false,
    withValidators: false,
    failFast: false,
    recheckAssets: false,
    timeoutMs: TIMEOUT_DEFAULT_MS,
  };
  const usage = () =>
    "usage : node tools/verify-all.mjs [--skip-assets] [--recheck-assets] [--only <motif>] [--list] [--json] [--with-validators] [--fail-fast] [--timeout <secondes>]";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--skip-assets": options.skipAssets = true; break;
      case "--recheck-assets": options.recheckAssets = true; break;
      case "--list": options.list = true; break;
      case "--json": options.json = true; break;
      case "--with-validators": options.withValidators = true; break;
      case "--fail-fast": options.failFast = true; break;
      case "--only": {
        const value = argv[index + 1];
        if (!value || value.startsWith("--")) {
          console.error(`--only attend un motif.\n${usage()}`);
          process.exit(EXIT.USAGE);
        }
        options.only = value;
        index += 1;
        break;
      }
      case "--timeout": {
        const value = Number(argv[index + 1]);
        if (!Number.isFinite(value) || value <= 0) {
          console.error(`--timeout attend un nombre de secondes.\n${usage()}`);
          process.exit(EXIT.USAGE);
        }
        options.timeoutMs = value * 1000;
        index += 1;
        break;
      }
      case "--help":
      case "-h":
        console.log(usage());
        process.exit(EXIT.OK);
        break;
      default:
        console.error(`Drapeau inconnu : ${arg}\n${usage()}`);
        process.exit(EXIT.USAGE);
    }
  }
  return options;
}

function findPython() {
  for (const candidate of ["python3", "python"]) {
    const probe = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (probe.status === 0) return { command: candidate, args: [] };
  }
  const launcher = spawnSync("py", ["-3", "--version"], { encoding: "utf8" });
  if (launcher.status === 0) return { command: "py", args: ["-3"] };
  return null;
}

function pythonHasPillow(python) {
  const probe = spawnSync(
    python.command,
    [...python.args, "-c", "import PIL, PIL.Image; print(PIL.__version__)"],
    { encoding: "utf8" },
  );
  return probe.status === 0 ? String(probe.stdout).trim() : null;
}

function freeBytes(target) {
  try {
    const stats = fs.statfsSync?.(target);
    if (!stats) return null;
    return Number(stats.bavail) * Number(stats.bsize);
  } catch {
    return null;
  }
}

function gitIgnoresFrames() {
  // Le motif .gitignore vise le contenu du dossier `frames/` : on teste un
  // fichier à l'intérieur, sinon `git check-ignore` répond « non ignoré »
  // pour un dossier qui n'existe pas encore.
  const probe = spawnSync(
    "git",
    [
      "check-ignore",
      "-q",
      "--no-index",
      "assets/modular/characters/legacy/01-shibito-villager/frames/00.png",
    ],
    { cwd: ROOT },
  );
  if (probe.status === 0) return true;
  if (probe.status === 1) return false;
  try {
    return /assets\/modular\/\*\*\/frames\//.test(
      fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8"),
    );
  } catch {
    return false;
  }
}

function walkFiles(directory, predicate, collected = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkFiles(absolute, predicate, collected);
    } else if (predicate(absolute, entry.name)) {
      collected.push(absolute);
    }
  }
  return collected;
}

/*
 * Empreinte du cache : sources (sprite.json, planches) et nombre de frames
 * présentes. Tant qu'elle ne change pas, la phase assets est sautée : un run
 * à chaud reste sous les quinze secondes, sans rescanner 28 000 fichiers.
 */
function assetsFingerprint() {
  const sources = walkFiles(
    FRAMES_ROOT,
    (absolute, name) => name === "sprite.json" || absolute.includes(`${path.sep}sheets${path.sep}`),
  ).map((absolute) => {
    const stat = fs.statSync(absolute);
    return `${path.relative(ROOT, absolute)}:${stat.size}:${Math.round(stat.mtimeMs)}`;
  });
  const frameCount = walkFiles(FRAMES_ROOT, (absolute) => absolute.endsWith(".png")).length;
  const hash = crypto.createHash("sha1").update(sources.sort().join("\n")).digest("hex");
  return { hash, frameCount };
}

function readStamp() {
  try {
    return JSON.parse(fs.readFileSync(ASSET_STAMP, "utf8"));
  } catch {
    return null;
  }
}

function discoverTests() {
  return fs
    .readdirSync(ROOT)
    .filter((file) => file.endsWith("smoke-test.js"))
    .sort()
    .map((file) => {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      const needsAssets = /\bframes\//.test(source) || /frame absente/.test(source);
      return { file, needsAssets };
    });
}

function run(command, args, { cwd = ROOT, timeout = 0 } = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: timeout > 0 ? timeout : undefined,
    maxBuffer: 32 * 1024 * 1024,
  });
  const durationMs = Date.now() - started;
  const timedOut = result.error?.code === "ETIMEDOUT" || result.signal === "SIGTERM";
  return {
    status: timedOut ? "TIMEOUT" : result.status === 0 ? "PASS" : "FAIL",
    code: result.status,
    durationMs,
    output: `${result.stdout || ""}${result.stderr || ""}`,
    timedOut,
  };
}

function tail(text, lines = 12) {
  return text.trimEnd().split("\n").slice(-lines).join("\n");
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  return `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const log = options.json ? console.error : console.log;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logDir = path.join(ROOT, "tmp", "verify", stamp);

  // Phase 0 — préflight
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (nodeMajor < 18) {
    console.error(`Node 18 ou plus requis (version courante : ${process.versions.node}).`);
    process.exit(EXIT.PREFLIGHT);
  }
  if (!fs.existsSync(MATERIALIZER)) {
    console.error(`Outil de matérialisation absent : ${MATERIALIZER}`);
    process.exit(EXIT.PREFLIGHT);
  }
  if (!fs.existsSync(FRAMES_ROOT)) {
    console.error(`Dossier d'assets absent : ${FRAMES_ROOT}`);
    process.exit(EXIT.PREFLIGHT);
  }
  if (!gitIgnoresFrames()) {
    console.error(
      "Le cache assets/modular/**/frames/ n'est pas ignoré par Git : refus d'écrire des frames versionnées.",
    );
    process.exit(EXIT.PREFLIGHT);
  }
  const python = findPython();
  if (!python) {
    console.error(
      "Python introuvable (python3, python, py -3). Installez Python 3 puis relancez.",
    );
    process.exit(EXIT.PREFLIGHT);
  }
  const pillow = pythonHasPillow(python);
  if (!pillow) {
    console.error(
      `Pillow absent pour ${python.command}. Installez-le : ${python.command} -m pip install pillow`,
    );
    process.exit(EXIT.PREFLIGHT);
  }
  const free = freeBytes(ROOT);
  if (free !== null && free < DISK_REQUIRED_BYTES) {
    console.error(
      `Espace insuffisant : ${(free / 1024 ** 2).toFixed(0)} Mio libres, 400 Mio requis pour le cache de frames.`,
    );
    process.exit(EXIT.PREFLIGHT);
  }

  const tests = discoverTests();
  const selected = options.only
    ? tests.filter((test) => test.file.includes(options.only))
    : tests;
  if (!selected.length) {
    console.error(`Aucun smoke test ne correspond à « ${options.only} ».`);
    process.exit(EXIT.USAGE);
  }

  if (options.list) {
    for (const test of selected) {
      console.log(`${test.file}${test.needsAssets ? "  (assets)" : ""}`);
    }
    process.exit(EXIT.OK);
  }

  fs.mkdirSync(logDir, { recursive: true });
  log(`Vérification — Node ${process.versions.node}, ${python.command} + Pillow ${pillow}`);
  log(`${selected.length} smoke test(s), logs dans tmp/verify/${stamp}/`);

  // Phase 1 — assets
  const assetSkipped = options.skipAssets;
  if (!assetSkipped) {
    const current = assetsFingerprint();
    const stamp = readStamp();
    const cacheFresh =
      !options.recheckAssets &&
      stamp &&
      stamp.hash === current.hash &&
      Number(stamp.frameCount) === current.frameCount;
    if (cacheFresh) {
      log(`→ cache de frames à jour (${current.frameCount} frames, empreinte vérifiée)`);
    } else {
    log("→ matérialisation du cache de frames (ignoré par Git)…");
    const materialize = run(
      python.command,
      [...python.args, MATERIALIZER],
      { timeout: 15 * 60 * 1000 },
    );
    fs.writeFileSync(path.join(logDir, "materialize-frame-cache.log"), materialize.output);
    if (materialize.status !== "PASS") {
      console.error(`Matérialisation échouée (${materialize.status}). Log : ${logDir}`);
      console.error(tail(materialize.output));
      process.exit(EXIT.ASSETS);
    }
    log(`  cache matérialisé en ${formatDuration(materialize.durationMs)}`);
    const verify = run(
      python.command,
      [...python.args, MATERIALIZER, "--check"],
      { timeout: 15 * 60 * 1000 },
    );
    fs.writeFileSync(path.join(logDir, "materialize-check.log"), verify.output);
    if (verify.status !== "PASS") {
      console.error(`Vérification du cache échouée. Log : ${logDir}`);
      console.error(tail(verify.output));
      process.exit(EXIT.ASSETS);
    }
    log(`  cache vérifié en ${formatDuration(verify.durationMs)}`);
    fs.mkdirSync(path.dirname(ASSET_STAMP), { recursive: true });
    fs.writeFileSync(
      ASSET_STAMP,
      `${JSON.stringify({ ...assetsFingerprint(), updatedAt: Date.now() }, null, 2)}\n`,
    );
    }
  } else {
    log("→ cache de frames ignoré (--skip-assets)");
  }

  // Phase 2 — tests
  const results = [];
  for (const test of selected) {
    if (assetSkipped && test.needsAssets) {
      results.push({ ...test, status: "SKIP", durationMs: 0, logPath: null });
      log(`- ${test.file} : SKIP (assets)`);
      continue;
    }
    const result = run(process.execPath, [test.file], { timeout: options.timeoutMs });
    const logPath = path.join(logDir, `${test.file}.log`);
    fs.writeFileSync(logPath, result.output);
    results.push({ ...test, ...result, logPath });
    log(`- ${test.file} : ${result.status} (${formatDuration(result.durationMs)})`);
    if (result.status !== "PASS") {
      console.error(tail(result.output));
      console.error(`  log : ${path.relative(ROOT, logPath)}`);
      if (options.failFast) break;
    }
  }

  // Phase 3 — validateurs optionnels
  if (options.withValidators && !options.failFast) {
    log("→ validateurs de tools/…");
    for (const [file, runner] of VALIDATORS) {
      if (!fs.existsSync(path.join(ROOT, file))) continue;
      const command = runner === "node" ? process.execPath : python.command;
      const args = runner === "node" ? [file] : [...python.args, file];
      const result = run(command, args, { timeout: 5 * 60 * 1000 });
      const logPath = path.join(logDir, `${path.basename(file)}.log`);
      fs.writeFileSync(logPath, result.output);
      results.push({
        file, needsAssets: true, ...result, logPath, validator: true,
      });
      log(`- ${file} : ${result.status} (${formatDuration(result.durationMs)})`);
      if (result.status !== "PASS") {
        console.error(tail(result.output));
        console.error(`  log : ${path.relative(ROOT, logPath)}`);
      }
    }
  }

  // Bilan
  const failed = results.filter((result) => ["FAIL", "TIMEOUT"].includes(result.status));
  const skipped = results.filter((result) => result.status === "SKIP");
  const passed = results.filter((result) => result.status === "PASS");

  if (options.json) {
    const payload = {
      ok: failed.length === 0,
      node: process.versions.node,
      python: python.command,
      pillow,
      assetPhase: assetSkipped ? "skipped" : "materialized",
      totals: { passed: passed.length, failed: failed.length, skipped: skipped.length },
      results: results.map((result) => ({
        file: result.file,
        status: result.status,
        durationMs: result.durationMs,
        needsAssets: result.needsAssets,
        log: result.logPath ? path.relative(ROOT, result.logPath) : null,
      })),
    };
    console.log(JSON.stringify(payload, null, 2));
  }

  if (failed.length) {
    console.error(
      `\n${passed.length} vert(s), ${failed.length} échec(s), ${skipped.length} ignoré(s).`,
    );
    failed.forEach((result) => console.error(`  ${result.status} ${result.file}`));
    process.exitCode = EXIT.FAIL;
  } else {
    log(
      `\n${passed.length}/${passed.length + skipped.length} smoke tests verts` +
        (skipped.length ? ` (${skipped.length} ignoré(s) faute d'assets)` : "") +
        ".",
    );
    process.exitCode = EXIT.OK;
  }
}

main();
