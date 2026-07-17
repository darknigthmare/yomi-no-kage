import fs from "node:fs";
import http from "node:http";
import https from "node:https";

const baseUrl = process.argv[2] || "http://127.0.0.1:8765/";
const registry = JSON.parse(fs.readFileSync("assets/modular/registry.json", "utf8"));
const catalog = JSON.parse(fs.readFileSync("assets/modular/catalog.json", "utf8"));
const refs = new Set([
  "index.html",
  "assets.html",
  "game.js",
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

for (const asset of catalog.assets) refs.add(asset.file);
for (const character of registry.characters) {
  refs.add(character.sprite);
  Object.values(character.animations).forEach((file) => refs.add(file));
  Object.values(character.frames).flat().forEach((file) => refs.add(file));
  if (character.fpsAnimations) Object.values(character.fpsAnimations).forEach((file) => refs.add(file));
  if (character.fpsFrames) Object.values(character.fpsFrames).flat().forEach((file) => refs.add(file));
  if (character.fpsSprite) refs.add(character.fpsSprite);
  if (character.fpsWeaponSprites) Object.values(character.fpsWeaponSprites).forEach((file) => refs.add(file));
}
for (const weapon of registry.weapons || []) {
  if (weapon.file) refs.add(weapon.file);
  if (weapon.fpsAnimations) Object.values(weapon.fpsAnimations).forEach((file) => refs.add(file));
  if (weapon.fpsSprite) refs.add(weapon.fpsSprite);
  if (weapon.fpsSpriteMeta) refs.add(weapon.fpsSpriteMeta);
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

async function worker() {
  while (cursor < urls.length) {
    const file = urls[cursor];
    cursor += 1;
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await head(new URL(file, baseUrl));
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
console.log(JSON.stringify({
  baseUrl,
  checked: urls.length,
  errorCount: errors.length,
  errors: errors.slice(0, 50),
}, null, 2));
if (errors.length) process.exitCode = 1;
