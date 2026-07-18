"use strict";

const assert = require("node:assert/strict");

require("./audio.js");

const audio = globalThis.gameAudio;
assert.ok(audio, "le singleton audio doit être exposé");

[
  "setMusicState",
  "setMusicIntensity",
  "getMusicState",
  "playWeapon",
  "playSpatial",
  "playFootstep",
  "playCombatCue",
].forEach((method) => {
  assert.equal(typeof audio[method], "function", `${method} doit être disponible`);
});

[
  "title",
  "prologue",
  "travel",
  "village",
  "interior",
  "yomi",
  "combat",
  "boss",
  "purified",
].forEach((state) => {
  assert.equal(audio.setMusicState(state), state, `état musical ${state}`);
});

assert.equal(audio.setMusicState("inconnu"), "village", "repli musical sûr");
assert.equal(audio.setMusicIntensity(4), 1, "intensité bornée au maximum");
assert.equal(audio.setMusicIntensity(-2), 0, "intensité bornée au minimum");

// Node ne fournit pas Web Audio : les appels doivent échouer proprement.
assert.equal(audio.playWeapon("bow", "release"), false);
assert.equal(
  typeof audio.playSpatial("zombie", { pan: -0.5, distance: 3 }),
  "boolean",
  "un appel spatial doit rester sans erreur avant déverrouillage",
);

console.log("Audio smoke test: OK — états, familles et repli sans Web Audio.");
