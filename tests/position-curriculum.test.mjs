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

import {POSITION_PROGRAMS,ONBOARDING_PROGRAM,positionProgram,positionProgramTotals,positionExamKey,positionItem} from '../lib/position-curriculum.ts';
test('every position program has fifteen gated levels and totals derived from its content',()=>{
 for(const program of Object.values(POSITION_PROGRAMS)){
  const totals=positionProgramTotals(program);
  assert.deepEqual(totals,{levels:15,lessons:92,exercises:184,questions:75,projects:2,hours:165.5},program.key);
  assert.deepEqual(program.exams.map(a=>a.level),Array.from({length:15},(_,i)=>i+1));
  assert.deepEqual(program.projects.map(a=>a.level),[8,15]);
  for(const item of [...program.lessons,...program.exams,...program.projects]){assert.equal(item.position,program.key);assert.equal(positionItem(item.key),item);}
  assert.equal(positionExamKey(program,7),program.exams[6].key);
 }
 assert.equal(positionProgram('onboarding'),ONBOARDING_PROGRAM);
 for(const unknown of ['',null,undefined,'common','toString','__proto__'])assert.equal(positionProgram(unknown),null);
});
test('Onboarding lessons carry their own scenario and a three-option decision in four languages',()=>{
 for(const lesson of ONBOARDING_PROGRAM.lessons){
  const correct=new Set();
  for(const locale of ['es','en','pt','fr']){
   const a=lesson.application[locale];assert.ok(a.case.length>40&&a.rule.length>20&&a.task.length>20&&a.template.length>20,lesson.key+' '+locale);
   assert.equal(a.decisions.length,1);assert.equal(a.decisions[0].options.length,3);assert.equal(new Set(a.decisions[0].options).size,3);
   assert.notEqual(a.decisions[0].feedback,a.decisions[0].options[a.decisions[0].correct]);correct.add(a.decisions[0].correct);
  }
  assert.equal(correct.size,1,'same answer position in every language: '+lesson.key);
  assert.deepEqual(positionGrade(lesson,[lesson.decisions[0].correct]),[1]);
 }
 assert.equal(new Set(ONBOARDING_PROGRAM.lessons.map(l=>l.application.es.case)).size,92);
 assert.ok(new Set(ONBOARDING_PROGRAM.lessons.map(l=>l.decisions[0].correct)).size===3);
});
test('Onboarding exams and projects are gradable and reviewable like Customer Success',()=>{
 for(const exam of ONBOARDING_PROGRAM.exams){
  assert.equal(exam.decisions.length,5);assert.deepEqual(positionGrade(exam,exam.decisions.map(q=>q.correct)),[1,1,1,1,1]);
  for(const locale of ['en','pt','fr'])assert.deepEqual(exam.application[locale].decisions.map(q=>q.correct),exam.decisions.map(q=>q.correct));
  assert.throws(()=>positionGrade(exam,[0,0,0,0]));
 }
 for(const project of ONBOARDING_PROGRAM.projects){for(const locale of ['es','en','pt','fr'])assert.ok(project.brief[locale].length>200&&project.title[locale]);assert.ok(project.source.rubric.length>0&&project.source.competencies.length>0);}
});
test('onboarding answer positions are not a fixed rotation and stay aligned across languages',()=>{
 const seq=POSITION_ITEMS.filter(a=>a.position==='onboarding').flatMap(a=>a.decisions.map(q=>q.correct));
 assert.equal(seq.length,167);
 const next=seq.slice(1).filter((v,i)=>v===(seq[i]+1)%3).length/(seq.length-1);
 assert.ok(next<0.5,'the correct option must not simply advance one position each question');
 for(const index of [0,1,2]){const share=seq.filter(v=>v===index).length/seq.length;assert.ok(share>0.2&&share<0.45,'each position is used a reasonable share of the time');}
});
test('sign-up offers exactly the connected position programs',async()=>{
 const {default:published}=await import('../lib/position-curricula/published.json',{with:{type:'json'}});
 assert.deepEqual(published.map(p=>[p.key,p.title]),Object.values(POSITION_PROGRAMS).map(p=>[p.key,p.title]));
});
