import test from 'node:test';import assert from 'node:assert/strict';
import {hasCustomerSuccessCourse,CS_COURSE_UNITS,CS_LESSONS,CS_CAPSTONE_RUBRIC,CS_COURSE_DATA} from '../lib/customer-success-course.ts';
test('course requires an active paid included plan or trusted administrative role',()=>{
 for(const profile of [null,{}, {status:'active',plan_name:'free'},{status:'active',plan_name:'starter'},{status:'suspended',plan_name:'pro'},{status:'cancelled',role:'owner'}])assert.equal(hasCustomerSuccessCourse(profile),false);
 for(const profile of [{status:'active',plan_name:'pro'},{status:'active',plan_name:'enterprise'},{status:'active',role:'owner'},{status:'active',role:'admin'}])assert.equal(hasCustomerSuccessCourse(profile),true);
});
test('eight instructional units have original deliverables, decisions, examples and review criteria',()=>{
 assert.equal(CS_COURSE_UNITS.length,8);assert.equal(CS_LESSONS.length,8);assert.equal(new Set(CS_COURSE_UNITS.map(x=>x.key)).size,8);
 for(const [i,unit] of CS_COURSE_UNITS.entries()){assert.ok(CS_LESSONS[i].length>200);assert.ok(unit.task.length>40);assert.ok(unit.example.length>80);assert.equal(unit.choices.length,2);assert.ok(unit.review.length>=3);}
 assert.equal(CS_CAPSTONE_RUBRIC.length,4);assert.equal(CS_COURSE_DATA.at(-1).preparationDays,3);
});
