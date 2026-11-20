#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yomi-audit-'));
const put = (name, data) => { const p = path.join(root, name); fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p, data); };
const save = (name, data) => put(name, JSON.stringify(data));
const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'audit-fps-authored-coverage.mjs');
const dirs = ['front','front-left','back-left','back','back-right','front-right'];
const types = ['regular','special','miniboss','boss','giant','legacy'];
try {
  for (const category of types) {
    const entries = category === 'regular' ? [{id:'r09-haka-digger',name:'Fossoyeur'}] :
      category === 'miniboss' ? [{id:'mb-09-pisteur-kegare',name:'Pisteur'}] : [];
    save('assets/modular/manifests/' + category + '.json', { category, count:entries.length, entries });
  }
  save('assets/modular/manifests/fps-authored-wave-02.json', {id:'fixture', characters:[
    {category:'regular',id:'r09-haka-digger'}, {category:'miniboss',id:'mb-09-pisteur-kegare'}]});
  const base = 'assets/modular/fps/characters/regular/r09-haka-digger';
  const b = Buffer.alloc(64); Buffer.from('89504e470d0a1a0a','hex').copy(b);
  b.writeUInt32BE(576,16); b.writeUInt32BE(640,20);
  const sha = crypto.createHash('sha256').update(b).digest('hex');
  const views = {}, sources = {};
  for (const dir of dirs) {
    const raw = base + '/sources-authored-six-way-v1/' + dir + '-imagegen-raw.png';
    put(raw,b);
    sources[dir] = {sha256:sha};
    views[dir] = {sourceKind:'authored-directional-atlas', authoredDirection:true, sourceSha256:sha,
      sourceAtlas:raw, pixelTransforms:{fusion:false,mirror:false,projection:false,interpolation:false,phaseSynthesis:false}};
  }
  save(base+'/sprite.json', {fpsDirections:views});
  save(base+'/sources-authored-six-way-v1/import-input.json',{schema:1});
  save(base+'/sources-authored-six-way-v1/import-manifest.json',{
    category:'regular',characterId:'r09-haka-digger',sources,
    sourceContract:{handsEmpty:true,weaponsBakedIntoBody:false,oneCompleteSilhouettePerCell:true},
    normalization:{fusion:false,mirror:false,projection:false,interpolation:false,phaseSynthesis:false}});
  save('assets/modular/fps/characters/miniboss/mb-09-pisteur-kegare/sprite.json',{fpsDirections:Object.fromEntries(dirs.map(d=>[d,{sourceKind:'derived-diagonal-bitmap'}]))});
  const run = () => JSON.parse(execFileSync(process.execPath,[script,'--root',root,'--json'],{encoding:'utf8'}));
  const report = run();
  assert.deepEqual([report.totals.enemies,report.totals.verifiedAuthoredAtlas,report.totals.remainingAtlas,report.totals.independentlyAuthoredPoses],[2,6,6,180]);
  assert.deepEqual(report.totals.issues,[]);
  views.front.sourceSha256='tampered'; save(base+'/sprite.json',{fpsDirections:views});
  const broken=run();
  assert.equal(broken.totals.verifiedAuthoredAtlas,5);
  assert.ok(broken.totals.issues.some(i=>i.includes('unverified authored view front')));
  const check = spawnSync(process.execPath,[script,'--root',root,'--check'],{encoding:'utf8'});
  assert.equal(check.status,1);
  console.log('FPS authored coverage smoke test passed.');
} finally { fs.rmSync(root,{recursive:true,force:true}); }
