"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("asset-runtime.js", "utf8");

function boot(hostname) {
  const sandbox = {
    location: { hostname },
    window: null,
  };
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox, { filename: "asset-runtime.js" });
  return sandbox.KageAssets;
}

const local = boot("127.0.0.1");
assert.equal(local.remoteAssets, false);
assert.equal(local.resolve("assets/modular/registry.json"), "assets/modular/registry.json");

const production = boot("yomi-no-kage.vercel.app");
assert.equal(production.remoteAssets, true);
assert.equal(production.releaseRef, "authored-fps-v1");
assert.equal(
  production.resolve("assets/modular/registry.json?v=test"),
  "https://raw.githubusercontent.com/darknigthmare/yomi-no-kage/authored-fps-v1/assets/modular/registry.json?v=test",
);
assert.equal(production.resolve("game.js?v=42"), "game.js?v=42");

const index = fs.readFileSync("index.html", "utf8");
assert.ok(
  index.indexOf("asset-runtime.js?v=3") < index.indexOf("game.js?v=42"),
  "index: le résolveur CDN doit précéder le moteur",
);
assert.ok(
  index.indexOf("asset-runtime.js?v=3") < index.indexOf("cinematic.js?v=13"),
  "index: le résolveur CDN doit précéder la cinématique",
);

const gallery = fs.readFileSync("assets.html", "utf8");
assert.ok(
  gallery.indexOf("asset-runtime.js?v=3") < gallery.indexOf("assets-gallery.js?v=20260722-authored-fps-v1"),
  "artbook: le résolveur CDN doit précéder la galerie",
);

const vercelIgnore = fs.readFileSync(".vercelignore", "utf8");
assert.match(vercelIgnore, /^assets\/generated\/$/m);
assert.match(vercelIgnore, /^assets\/modular\/$/m);

const game = fs.readFileSync("game.js", "utf8");
assert.match(game, /resolveAssetPath\(`assets\/modular\/registry\.json/);
assert.match(game, /const resolvedPath = resolveAssetPath\(path\)/);
assert.match(game, /const previewUrl = resolveAssetPath\(preview\)/);

console.log("Asset runtime smoke test passed — local assets + GitHub release CDN production.");
