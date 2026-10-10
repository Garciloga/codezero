import test from 'node:test';import assert from 'node:assert/strict';import {editorialFingerprint,effectiveEditorialState} from '../lib/editorial-review.ts';
const sample={key:'position-test-l1-1',level:1,title:{es:'Diagnóstico'},application:{case:'Una cuenta no puede exportar'}};
test('editorial review fingerprints invalidate marks on edited content',()=>{
 const old=editorialFingerprint(sample);
 assert.match(old,/^[a-f0-9]{64}$/);
 assert.equal(effectiveEditorialState({lesson_key:sample.key,content_hash:old,state:'reviewed',note:null},old),'reviewed');
 const next=editorialFingerprint({...sample,application:{case:'El incidente cambia de alcance'}});
 assert.notEqual(old,next);assert.equal(effectiveEditorialState({lesson_key:sample.key,content_hash:old,state:'reviewed',note:null},next),'pending');
});
test('missing review never implies approval',()=>assert.equal(effectiveEditorialState(undefined,'0'.repeat(64)),'pending'));
