"use strict";

/*
 * Contrat du harnais navigateur (P0.3).
 *
 * Ce test ne lance pas Chromium : il vérifie ce qui rend le parcours fiable
 * avant même d'ouvrir une page — plan des 28 zones et des sept rechargements,
 * arguments, types MIME et petit serveur statique (racine, 404, traversal).
 * Le parcours réel s'exécute avec `node tools/browser-harness.mjs` ou
 * `node tools/verify-all.mjs --with-browser`.
 */
const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");

const { KageLevels } = require("./level-data.js");

const failures = [];
const successes = [];
let harness = null;

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

function get(base, requestPath) {
  return new Promise((resolve, reject) => {
    const { hostname, port } = new URL(base);
    const request = http.request(
      { hostname, port, path: requestPath, method: "GET" },
      (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () =>
        resolve({
          status: response.statusCode,
          type: String(response.headers["content-type"] || ""),
          body: Buffer.concat(chunks).toString("utf8"),
        }));
      },
    );
    request.on("error", reject);
    request.end();
  });
}

async function main() {
  harness = await import("./tools/browser-harness.mjs");

  check("le plan couvre 28 zones, sept actes et sept fins d'acte", () => {
    const plan = harness.buildPlan(KageLevels);
    assert.equal(plan.length, 28, "28 zones sur la route");
    assert.deepEqual(
      plan.map((entry) => entry.areaId),
      KageLevels.campaignRuntime.linearRoute,
      "la route suit exactement linearRoute",
    );
    const orders = plan.map((entry) => entry.actOrder);
    assert.deepEqual(orders, [...orders].sort((a, b) => a - b), "actes croissants");
    assert.equal(new Set(plan.map((entry) => entry.actId)).size, 7, "sept actes");
    assert.equal(plan.filter((entry) => entry.actEnd).length, 7, "sept rechargements");
    plan.forEach((entry, index) => {
      if (index < plan.length - 1) {
        assert.equal(entry.nextAreaId, plan[index + 1].areaId, `chaînage ${entry.areaId}`);
        assert.equal(entry.actEnd, plan[index + 1].actId !== entry.actId, `fin d'acte ${entry.areaId}`);
      } else {
        assert.equal(entry.nextAreaId, null, "la dernière zone n'a pas de suivante");
        assert.equal(entry.actEnd, true, "la dernière zone clôt son acte");
      }
    });
  });

  check("les arguments du harnais sont explicites", () => {
    const defaults = harness.parseArgs([]);
    assert.equal(defaults.json, false);
    assert.equal(defaults.headed, false);
    assert.equal(defaults.only, null);
    assert.ok(defaults.timeoutMs > 0, "délai par défaut");
    const parsed = harness.parseArgs(["--json", "--headed", "--only", "cyber-shogun-core"]);
    assert.equal(parsed.json, true);
    assert.equal(parsed.headed, true);
    assert.equal(parsed.only, "cyber-shogun-core");
    assert.throws(() => harness.parseArgs(["--nope"]), /Drapeau inconnu/);
    assert.throws(() => harness.parseArgs(["--only"]), /--only attend/);
    assert.throws(() => harness.parseArgs(["--timeout", "0"]), /--timeout attend/);
  });

  check("les types MIME servis correspondent aux fichiers du jeu", () => {
    assert.match(harness.contentType("index.html"), /^text\/html/);
    assert.match(harness.contentType("game.js"), /^text\/javascript/);
    assert.match(harness.contentType("styles.css"), /^text\/css/);
    assert.equal(harness.contentType("sprite.png"), "image/png");
    assert.equal(harness.contentType("unknown.bin"), "application/octet-stream");
  });

  check("le serveur statique sert la vraie racine, refuse le reste", async () => {
    const { base, server } = await harness.startStaticServer(path.join(__dirname));
    try {
      const index = await get(base, "/");
      assert.equal(index.status, 200, "index.html servi");
      assert.match(index.type, /^text\/html/);
      assert.match(index.body, /Yomi no Kage/, "le document est bien la page du jeu");

      const script = await get(base, "/level-data.js");
      assert.equal(script.status, 200);
      assert.match(script.type, /^text\/javascript/);

      const missing = await get(base, "/introuvable.js");
      assert.equal(missing.status, 404, "absence signalée");

      /* Les segments encodés qui sortent de la racine sont refusés ; une
       * simple remontée normalisée reste dans la racine du jeu. */
      const escape = await get(base, "/%2e%2e%2f%2e%2e%2fetc%2fpasswd");
      assert.equal(escape.status, 403, "traversal refusé");
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  if (failures.length) {
    console.error(
      `\nHarnais navigateur : ${successes.length} contrat(s) valide(s), `
      + `${failures.length} manquant(s).`,
    );
    failures.forEach((failure, index) => {
      console.error(`${index + 1}. ${failure.name}`);
      console.error(`   ${failure.message}`);
    });
    process.exitCode = 1;
  } else {
    console.log(
      `\nHarnais navigateur OK — ${successes.length} contrats, parcours réel : `
      + "node tools/browser-harness.mjs",
    );
  }
}

main().catch((error) => {
  console.error(`\nHarnais navigateur : échec inattendu.\n${error.stack || error}`);
  process.exitCode = 1;
});
