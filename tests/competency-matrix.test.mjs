import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeCompetency,competencyProfile,DEFAULT_JOB_PROFILES,validScores} from '../lib/competency-matrix.ts';
import {TRAINING_UNITS,TRAINING_EXTRAS,TRAINING_LEVEL_HOURS,gradeTrainingDecisions} from '../lib/role-training-content.ts';
import {roleTrainingEnabled} from '../lib/role-training-policy.ts';
const now=new Date('2026-10-08T12:00:00Z');
const e=(id,changes={})=>({id,user_id:'u',organization_id:'o',activity_key:id,independent_key:id,kind:'deliverable',competency_scores:{communication:3},assistance:'independent',review_source:'manager',observed_at:'2026-09-01T12:00:00Z',critical_errors:[],...changes});
test('replays and corrections do not create three independent evidences',()=>{
 assert.equal(summarizeCompetency([e('a'),e('b'),e('c',{independent_key:'a'})],'communication',now).level,0);
 assert.equal(summarizeCompetency([e('a'),e('b'),e('c')],'communication',now).level,3);
});
test('automatic grades never prove autonomy; self review remains provisional',()=>{
 const auto=['a','b','c'].map(id=>e(id,{review_source:'auto',kind:'exercise',assistance:'recognition',competency_scores:{communication:1}}));
 assert.equal(summarizeCompetency(auto,'communication',now).level,1);
 const self=auto.concat(e('d',{review_source:'self'}));const s=summarizeCompetency(self,'communication',now);
 assert.equal(s.level,1);assert.equal(s.provisional,3);
});
test('critical errors and future records cannot grant a level',()=>{
 assert.equal(summarizeCompetency([e('a'),e('b'),e('c',{critical_errors:['invented_commitment']})],'communication',now).level,0);
 assert.equal(summarizeCompetency([e('a'),e('b'),e('c',{observed_at:'2030-01-01'})],'communication',now).level,0);
});
test('failed decisions do not prove recognition and self correction cannot erase a human critical error',()=>{
 assert.equal(summarizeCompetency(['a','b','c'].map(id=>e(id,{competency_scores:{communication:0},review_source:'auto',kind:'exercise'})),'communication',now).level,0);
 const records=[e('a',{critical_errors:['invented_commitment']}),e('a-self',{independent_key:'a',review_source:'self',observed_at:'2026-10-01'}),e('b'),e('c')];
 assert.equal(summarizeCompetency(records,'communication',now).level,0);
});
test('pilot fails closed on production or mismatched database',()=>{
 const env={CODEZERO_ROLE_TRAINING:'1',CODEZERO_WORKSPACE_SANDBOX:'1',CODEZERO_ENVIRONMENT:'sandbox',CODEZERO_SANDBOX_PROJECT_REF:'sdvwkrosdnlacyhnuxwo',NEXT_PUBLIC_SUPABASE_URL:'https://sdvwkrosdnlacyhnuxwo.supabase.co'};
 assert.equal(roleTrainingEnabled(env),true);assert.equal(roleTrainingEnabled({...env,VERCEL_ENV:'production'}),false);assert.equal(roleTrainingEnabled({...env,NEXT_PUBLIC_SUPABASE_URL:'https://kwfzhpapvpdatdfwhouf.supabase.co'}),false);assert.equal(roleTrainingEnabled({...env,CODEZERO_ROLE_TRAINING:'0'}),false);
});
test('level four needs human capstone and linked recheck at least thirty days later',()=>{
 const records=[e('a'),e('b'),e('cap',{kind:'capstone',review_source:'admin'}),e('recheck',{independent_key:'a',reevaluation_of:'a',observed_at:'2026-10-02T12:00:00Z'})];
 assert.equal(summarizeCompetency(records,'communication',now).level,4);
 assert.equal(summarizeCompetency(records.map(x=>x.id==='recheck'?{...x,observed_at:'2026-09-20T12:00:00Z'}:x),'communication',now).level,3);
 assert.equal(summarizeCompetency(records.filter(x=>x.id!=='cap'),'communication',now).level,0);
});
test('recent evidence doubles weight without automatically increasing demonstrated level',()=>{
 const s=summarizeCompetency([e('old',{observed_at:'2026-01-01',competency_scores:{communication:1}}),e('new',{competency_scores:{communication:3}})],'communication',now);
 assert.equal(s.weightedScore,2.33);assert.equal(s.level,0);assert.equal(s.trend90,null);
});
test('scores must declare one to three known competencies with integer rubric values',()=>{
 assert.equal(validScores({communication:3}),true);assert.equal(validScores({communication:3.5}),false);assert.equal(validScores({fiction:4}),false);assert.equal(validScores({}),false);
});
test('missing evidence does not invent three strengths or a trend',()=>{
 const p=competencyProfile([],null,now);assert.equal(p.strengths.length,0);assert.equal(p.gaps.length,0);assert.equal(p.questions.length,3);assert.equal(DEFAULT_JOB_PROFILES.length,16);
});
test('approved curriculum has 29 units, 87 decisions and a reconciled 165 hour estimate',()=>{
 assert.equal(TRAINING_UNITS.length,29);assert.equal(TRAINING_UNITS.flatMap(u=>u.decisions).length,87);
 assert.equal(TRAINING_UNITS.filter(u=>u.route==='common').reduce((s,u)=>s+u.hours,0),45);
 assert.equal([...TRAINING_UNITS,...TRAINING_EXTRAS].filter(u=>u.route==='customer_success').reduce((s,u)=>s+u.hours,0),120);
 for(let i=0;i<4;i++)assert.equal([...TRAINING_UNITS,...TRAINING_EXTRAS].filter(u=>u.level===i+1).reduce((s,u)=>s+u.hours,0),TRAINING_LEVEL_HOURS[i]);
 assert.equal(TRAINING_EXTRAS.filter(u=>u.sourceStage).length,8);assert.equal(TRAINING_EXTRAS.filter(u=>u.kind==='project').length,3);
 assert.equal(TRAINING_EXTRAS.filter(u=>u.kind==='capstone').length,1);
 for(const u of TRAINING_UNITS){assert.ok(u.competencies.length>=1&&u.competencies.length<=3);assert.equal(gradeTrainingDecisions(u,u.decisions.map(q=>q.correct)).score,100);}
});
