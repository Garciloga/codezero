import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {auditCurriculum} from '../scripts/position-curriculum-audit.mjs';
test('onboarding titles are distinct in every locale while stable ids remain',()=>{
 const d=JSON.parse(fs.readFileSync('lib/position-curricula/roles/onboarding.json'));
 const a=d.levels.flatMap(x=>x.lessons);
 assert.equal(a.length,92);assert.equal(new Set(a.map(x=>x.key)).size,92);
 for(const l of ['es','en','pt','fr'])assert.equal(new Set(a.map(x=>x.localized[l].title.toLowerCase())).size,92);
 assert.equal(auditCurriculum(d).filter(x=>x.rule==='duplicate-lesson-title').length,0);
});
test('repeating a title blocks publication',()=>{
 const d=JSON.parse(fs.readFileSync('lib/position-curricula/roles/onboarding.json'));
 d.levels[2].lessons[0].localized.es.title=d.levels[1].lessons[0].localized.es.title;
 assert.equal(auditCurriculum(d).find(x=>x.rule==='duplicate-lesson-title')?.blocking,true);
});