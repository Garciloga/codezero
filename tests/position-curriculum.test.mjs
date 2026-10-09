import test from 'node:test';import assert from 'node:assert/strict';
import {CS_CURRICULUM_LEVELS,CS_CURRICULUM_LESSONS,CS_CURRICULUM_EXAMS,CS_CURRICULUM_PROJECTS,CS_CURRICULUM_OPTIONAL,POSITION_ITEMS,positionGrade,positionProjectApproved} from '../lib/position-curriculum.ts';
test('complete curriculum with source-backed lessons, formative feedback, keys and optional technical support',()=>{
 assert.equal(CS_CURRICULUM_LEVELS.length,15);assert.equal(CS_CURRICULUM_LESSONS.length,92);assert.equal(CS_CURRICULUM_LESSONS.reduce((n,l)=>n+l.decisions.length,0),184);assert.equal(CS_CURRICULUM_EXAMS.length,15);assert.equal(CS_CURRICULUM_EXAMS.flatMap(a=>a.decisions).length,75);assert.equal(CS_CURRICULUM_PROJECTS.length,2);
 assert.equal(new Set(POSITION_ITEMS.map(a=>a.key)).size,POSITION_ITEMS.length);assert.ok(CS_CURRICULUM_OPTIONAL.every(a=>!a.required&&a.level===0));
 for(const lesson of CS_CURRICULUM_LESSONS){assert.ok(lesson.source.lesson.length>100&&lesson.source.task.length>30&&lesson.source.template&&lesson.source.example&&lesson.source.competencies.length);for(const lang of ['es','en','pt','fr']){assert.ok(lesson.title[lang]);const a=lesson.application[lang];assert.ok(a.rule&&a.evidence&&a.process&&a.task&&a.template&&a.example);assert.equal(a.decisions.length,2);assert.deepEqual(a.decisions.map(q=>q.correct),lesson.decisions.map(q=>q.correct));}}
 assert.equal(new Set(CS_CURRICULUM_LESSONS.flatMap(l=>l.decisions.map(q=>q.prompt))).size,184);
 for(const a of CS_CURRICULUM_EXAMS){assert.deepEqual(positionGrade(a,a.decisions.map(q=>q.correct)),[1,1,1,1,1]);assert.throws(()=>positionGrade(a,[99,99,99,99,99]));assert.ok(a.decisions.every(q=>q.feedback.length>20&&q.options[q.correct]));}
});
test('latest human review controls approval; self review, critical errors and other org cannot unlock',()=>{
 const e={id:'1',organization_id:'org',activity_key:'project',review_source:'manager',competency_scores:{data:3},observed_at:'2026-10-08T12:00:00Z',critical_errors:[]};
 assert.equal(positionProjectApproved([e],'project','org'),true);assert.equal(positionProjectApproved([{...e,review_source:'self'}],'project','org'),false);assert.equal(positionProjectApproved([e],'project','other'),false);assert.equal(positionProjectApproved([e,{...e,id:'2',observed_at:'2026-10-08T13:00:00Z',critical_errors:['invented_commitment']}],'project','org'),false);
});
