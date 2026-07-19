import fs from "node:fs";
import http from "node:http";
import https from "node:https";

const baseUrl = process.argv[2] || "http://127.0.0.1:8765/";
const expectedLevelBuildId = "20260719-complete-campaign-v2";
const assetReleaseRef = "complete-campaign-v2";
const assetRepositoryRoot = `https://raw.githubusercontent.com/darknigthmare/yomi-no-kage/${assetReleaseRef}/`;
const productionAssets = /(^|\.)vercel\.app$/i.test(new URL(baseUrl).hostname);
const indexSource = fs.readFileSync("index.html", "utf8");
const registry = JSON.parse(fs.readFileSync("assets/modular/registry.json", "utf8"));
const catalog = JSON.parse(fs.readFileSync("assets/modular/catalog.json", "utf8"));
const refs = new Set([
  "index.html",
  "assets.html",
  "game.js",
  "asset-runtime.js",
  "audio.js",
  "cinematic.js",
  "styles.css",
  "assets-gallery.js",
  "assets-gallery.css",
  "assets/modular/registry.json",
  "assets/modular/catalog.json",
  "assets/generated/cinematics/prologue-01-peste.png",
  "assets/generated/cinematics/prologue-02-cloche.png",
  "assets/generated/cinematics/prologue-03-foyers.png",
  "assets/generated/cinematics/prologue-04-ordre.png",
  "assets/generated/cinematics/prologue-05-serment.png",
  "assets/generated/cinematics/prologue-06-kurokawa.png",
]);

function isRuntimeDeployFile(file) {
  const normalized = String(file || "").replaceAll("\\", "/");
  return Boolean(normalized)
    && !/(^|\/)(audit|tools|tmp)\//i.test(normalized)
    && !/\/frames\//i.test(normalized)
    && !/\/sources?\//i.test(normalized)
    && !/\/sources-(?:v2|alpha-v2)\//i.test(normalized)
    && !/(?:^|[-_.])source(?:[-_.]|$)/i.test(normalized.split("/").at(-1))
    && !/\/master(?:-alpha)?\.png$/i.test(normalized)
    && !/\/source-master\.png$/i.test(normalized);
}
for (const match of indexSource.matchAll(/\b(?:src|href)=["']([^"'#]+)["']/gi)) {
  const ref = match[1];
  if (!/^(?:[a-z]+:|\/\/|data:)/i.test(ref)) refs.add(ref);
}

for (const asset of catalog.assets) {
  if (isRuntimeDeployFile(asset.file)) refs.add(asset.file);
}
for (const character of registry.characters) {
  Object.values(character.animations).forEach((file) => refs.add(file));
  if (character.fpsAnimations) Object.values(character.fpsAnimations).forEach((file) => refs.add(file));
  for (const bank of Object.values(character.fpsDirections || {})) {
    Object.values(bank?.animations || {}).forEach((file) => refs.add(file));
  }
  if (character.fpsWeaponSprites) Object.values(character.fpsWeaponSprites).forEach((file) => refs.add(file));
}
for (const weapon of registry.weapons || []) {
  if (isRuntimeDeployFile(weapon.file)) refs.add(weapon.file);
  if (weapon.fpsAnimations) Object.values(weapon.fpsAnimations).forEach((file) => refs.add(file));
  if (isRuntimeDeployFile(weapon.fpsSprite)) refs.add(weapon.fpsSprite);
  if (isRuntimeDeployFile(weapon.fpsSpriteMeta)) refs.add(weapon.fpsSpriteMeta);
}

const urls = [...refs];
const errors = [];
let cursor = 0;

function head(url) {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const request = client.request(url, {
      method: "HEAD",
      agent: false,
      headers: { Connection: "close" },
    }, (response) => {
      response.resume();
      response.once("end", () => resolve({
        ok: response.statusCode >= 200 && response.statusCode < 300,
        status: response.statusCode,
        size: Number(response.headers["content-length"] || 0),
      }));
    });
    request.setTimeout(10_000, () => request.destroy(new Error("timeout")));
    request.once("error", reject);
    request.end();
  });
}

function deployedUrl(file) {
  if (productionAssets && String(file).startsWith("assets/")) {
    return new URL(String(file), assetRepositoryRoot);
  }
  return new URL(file, baseUrl);
}

function getText(url) {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const request = client.get(url, {
      agent: false,
      headers: { Connection: "close" },
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.once("end", () => resolve({
        ok: response.statusCode >= 200 && response.statusCode < 300,
        status: response.statusCode,
        text: Buffer.concat(chunks).toString("utf8"),
      }));
    });
    request.setTimeout(10_000, () => request.destroy(new Error("timeout")));
    request.once("error", reject);
  });
}

async function worker() {
  while (cursor < urls.length) {
    const file = urls[cursor];
    cursor += 1;
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await head(deployedUrl(file));
        if (response.ok && response.size > 0) {
          lastError = null;
          break;
        }
        lastError = { file, status: response.status, size: response.size };
      } catch (error) {
        lastError = { file, error: error.message };
      }
    }
    if (lastError) errors.push(lastError);
  }
}

await Promise.all(Array.from({ length: 4 }, worker));
try {
  const liveIndex = await getText(new URL("index.html", baseUrl));
  if (!liveIndex.ok) {
    errors.push({ file: "index.html", contract: "GET", status: liveIndex.status });
  } else {
    const levelScript = liveIndex.text.match(
      /<script[^>]+src=["']([^"']*level-data\.js[^"']*)["']/i,
    )?.[1];
    const gameScript = liveIndex.text.match(
      /<script[^>]+src=["']([^"']*game\.js[^"']*)["']/i,
    )?.[1];
    if (!levelScript) {
      errors.push({ file: "index.html", contract: "level-data script absent" });
    } else {
      const liveLevels = await getText(new URL(levelScript, baseUrl));
      if (!liveLevels.ok || !liveLevels.text.includes(expectedLevelBuildId)) {
        errors.push({
          file: levelScript,
          contract: `buildId ${expectedLevelBuildId}`,
          status: liveLevels.status,
        });
      }
    }
    if (!gameScript) {
      errors.push({ file: "index.html", contract: "game script absent" });
    } else {
      const liveGame = await getText(new URL(gameScript, baseUrl));
      if (!liveGame.ok || !liveGame.text.includes(expectedLevelBuildId)) {
        errors.push({
          file: gameScript,
          contract: `moteur compatible ${expectedLevelBuildId}`,
          status: liveGame.status,
        });
      }
    }
  }
} catch (error) {
  errors.push({ file: "runtime-contract", error: error.message });
}
console.log(JSON.stringify({
  baseUrl,
  assetReleaseRef,
  productionAssets,
  checked: urls.length,
  errorCount: errors.length,
  errors: errors.slice(0, 50),
}, null, 2));
if (errors.length) process.exitCode = 1;
