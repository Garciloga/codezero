import test from 'node:test';import assert from 'node:assert/strict';
import {readAnswer,ACTIVITY_KIND_LABELS,lessonState,canCompleteLesson,lessonPercent,isLessonUnlocked,attemptCategory,LESSON_STATE_LABELS} from '../lib/lesson-rules.ts';
const e=(o)=>({completed:false,total:2,attempted:0,passed:0,...o});
test('lesson states follow evidence, never a declared status',()=>{
 assert.equal(lessonState(e({})),'not_started');
 assert.equal(lessonState(e({viewing:true})),'studying');
 assert.equal(lessonState(e({attempted:1})),'practice_pending');
 assert.equal(lessonState(e({attempted:1,passed:1})),'practice_pending');
 assert.equal(lessonState(e({attempted:2,passed:1})),'practice_review');
 assert.equal(lessonState(e({attempted:2,passed:2})),'check_passed');
 assert.equal(lessonState(e({completed:true})),'completed');
 assert.equal(Object.keys(LESSON_STATE_LABELS).length,6);
});
test('completion needs every published activity passed; a lesson without activities cannot be verified',()=>{
 assert.equal(canCompleteLesson({total:2,passed:1}),false);
 assert.equal(canCompleteLesson({total:2,passed:2}),true);
 assert.equal(canCompleteLesson({total:0,passed:0}),false);
});
test('percentage is verifiable: activities weigh 90 and only completion reaches 100',()=>{
 assert.equal(lessonPercent(e({})),0);assert.equal(lessonPercent(e({attempted:2,passed:1})),45);
 assert.equal(lessonPercent(e({attempted:2,passed:2})),90);assert.equal(lessonPercent(e({completed:true})),100);
 assert.equal(lessonPercent(e({total:0})),0);
});
test('lessons open in order; completed lessons, including historical ones, stay open',()=>{
 const order=[10,11,12];
 assert.equal(isLessonUnlocked(order,new Set(),10),true);
 assert.equal(isLessonUnlocked(order,new Set(),11),false);
 assert.equal(isLessonUnlocked(order,new Set([10]),11),true);
 assert.equal(isLessonUnlocked(order,new Set([10]),12),false);
 assert.equal(isLessonUnlocked(order,new Set([12]),12),true);
 assert.equal(isLessonUnlocked(order,new Set([10,11,12]),99),false);
});
test('minimum check is free only until the activity is passed',()=>{
 assert.equal(attemptCategory(false),'lesson_check');assert.equal(attemptCategory(true),'practice');
});
const form=o=>({get:k=>o[k]});
test('answers are normalised per kind; ordering needs four distinct positions',()=>{
 assert.equal(readAnswer('multiple_choice',form({answer:'B'})),'B');assert.equal(readAnswer(null,form({answer:'D'})),'D');
 assert.equal(readAnswer('find_error',form({answer:'E'})),null);assert.equal(readAnswer('fill_blank',form({})),null);
 assert.equal(readAnswer('order_steps',form({position_A:'4',position_B:'1',position_C:'3',position_D:'2'})),'BDCA');
 assert.equal(readAnswer('order_steps',form({position_A:'1',position_B:'1',position_C:'3',position_D:'2'})),null);
 assert.equal(readAnswer('order_steps',form({position_A:'1',position_B:'2',position_C:'3'})),null);
 assert.equal(readAnswer('order_steps',form({position_A:'0',position_B:'2',position_C:'3',position_D:'5'})),null);
 assert.equal(readAnswer('order_steps',form({answer:'A'})),null);
 assert.deepEqual(Object.keys(ACTIVITY_KIND_LABELS),['multiple_choice','order_steps','fill_blank','find_error']);
});
