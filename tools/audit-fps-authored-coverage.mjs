#!/usr/bin/env node
/** Strict read-only audit of the six non-lateral FPS views; projections never count. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
const DIRS = ['front', 'front-left', 'back-left', 'back', 'back-right', 'front-right'];
const TYPES = ['regular', 'special', 'miniboss', 'boss', 'giant', 'legacy'];
const rootIndex = process.argv.indexOf('--root');
const ROOT = rootIndex < 0 ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') : path.resolve(process.argv[rootIndex + 1]);
const file = p => path.join(ROOT, p);
const json = p => JSON.parse(fs.readFileSync(file(p), 'utf8'));
const maybe = p => fs.existsSync(file(p)) ? json(p) : null;
const pngHash = p => {
  if (!fs.existsSync(file(p))) return null;
  const b = fs.readFileSync(file(p));
  return b.length > 24 && b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' &&
    b.readUInt32BE(16) > 0 && b.readUInt32BE(20) > 0
    ? crypto.createHash('sha256').update(b).digest('hex') : null;
};
function audit() {
  const roster = TYPES.flatMap(category => {
    const m = json('assets/modular/manifests/' + category + '.json');
    if (m.category !== category || m.count !== m.entries.length) throw Error('Invalid roster: ' + category);
    return m.entries.map(e => ({ category, id: e.id, name: e.name || e.id }));
  });
  const batch = json('assets/modular/manifests/fps-authored-wave-02.json');
  const index = new Map(roster.map(r => [r.category + '/' + r.id, r]));
  if (index.size !== roster.length) throw Error('Duplicated roster character');
  const seen = new Set();
  for (const target of batch.characters) {
    const k = target.category + '/' + target.id;
    if (!index.has(k) || seen.has(k)) throw Error('Unknown or duplicated wave target: ' + k);
    seen.add(k);
  }
  const issues = [], rows = [];
  let verified = 0;
  for (const c of roster) {
    const label = c.category + '/' + c.id;
    const folder = 'assets/modular/fps/characters/' + label;
    const sourceFolder = folder + '/sources-authored-six-way-v1';
    const runtime = maybe(folder + '/sprite.json');
    const imported = maybe(sourceFolder + '/import-manifest.json');
    const input = maybe(sourceFolder + '/import-input.json');
    if (!runtime?.fpsDirections) issues.push(label + ': missing FPS runtime metadata');
    if (imported && (imported.category !== c.category || imported.characterId !== c.id)) {
      issues.push(label + ': import identity mismatch');
    }
    const contract = imported?.sourceContract;
    const provenance = imported?.normalization;
    const validContract = Boolean(contract && contract.handsEmpty === true &&
      contract.weaponsBakedIntoBody === false && contract.oneCompleteSilhouettePerCell === true &&
      provenance && ['fusion','mirror','projection','interpolation','phaseSynthesis'].every(k => provenance[k] === false));
    if (imported && !validContract) issues.push(label + ': invalid authored contract');
    const drawn = [], raw = [], missing = [];
    for (const dir of DIRS) {
      const p = sourceFolder + '/' + dir + '-imagegen-raw.png';
      const digest = pngHash(p);
      if (digest) raw.push(dir);
      const view = runtime?.fpsDirections?.[dir];
      const claims = view?.sourceKind === 'authored-directional-atlas' && view.authoredDirection === true;
      const sourceHash = imported?.sources?.[dir]?.sha256;
      const noSynthesis = claims && ['fusion','mirror','projection','interpolation','phaseSynthesis']
        .every(k => view.pixelTransforms?.[k] === false);
      const ok = Boolean(claims && validContract && digest && digest === sourceHash &&
        view.sourceSha256 === sourceHash && view.sourceAtlas === p && noSynthesis);
      if (ok) { drawn.push(dir); verified++; } else missing.push(dir);
      if (claims && !ok) issues.push(label + ': unverified authored view ' + dir);
      if (digest && !input) issues.push(label + ': raw atlas without import contract ' + dir);
    }
    rows.push({ ...c, drawn, raw, missing, status: missing.length === 0 ? 'published-authored' :
      raw.length === 0 ? 'awaiting-original-art' : raw.length < 6 ? 'partial-original-art' : 'requires-validated-import' });
  }
  const targets = batch.characters.map(t => rows.find(r => r.category === t.category && r.id === t.id));
  return { schema: 1, wave: batch.id,
    totals: { enemies: roster.length, requiredAtlas: roster.length * DIRS.length, verifiedAuthoredAtlas: verified,
      remainingAtlas: roster.length * DIRS.length - verified, independentlyAuthoredPoses: verified * 30,
      fullCharacters: rows.filter(r => r.drawn.length === DIRS.length).length, issues },
    waveCharacters: targets, queue: rows.filter(r => r.missing.length > 0) };
}
try {
  const report = audit();
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else {
    const t = report.totals;
    console.log('# Audit FPS authored — ' + report.wave + '\n');
    console.log(t.verifiedAuthoredAtlas + '/' + t.requiredAtlas + ' atlas, ' + t.remainingAtlas + ' manquants, ' + t.independentlyAuthoredPoses + ' poses authored.\n');
    console.log('| Personnage | Vues authored | Sources PNG | Manquantes | État |\n|---|---:|---:|---|---|');
    for (const c of report.waveCharacters) console.log('| ' + c.name + ' (' + c.id + ') | ' + c.drawn.length + '/6 | ' + c.raw.length + '/6 | ' + c.missing.join(', ') + ' | ' + c.status + ' |');
    if (t.issues.length) console.log('\n## Problèmes\n' + t.issues.map(s => '- ' + s).join('\n'));
  }
  if (process.argv.includes('--check') && report.totals.issues.length) process.exitCode = 1;
} catch (e) { console.error(e.message); process.exitCode = 1; }
