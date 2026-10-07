import test from 'node:test';import assert from 'node:assert/strict';
import {createAssessmentVariant,publicAssessmentVariant,gradeNumericVariant} from '../lib/assessment-variants.ts';
test('numeric question grades its saved private snapshot and never exposes the solution',()=>{
 const secret='s'.repeat(32);for(let i=0;i<20;i++){const v=createAssessmentVariant(secret,'attempt_'+String(i).padStart(3,'0'));const pub=publicAssessmentVariant(v);assert.equal(Object.hasOwn(pub,'answer'),false);assert.equal(Object.hasOwn(pub,'rows'),false);assert.equal(gradeNumericVariant(v,String(v.answer)),true);assert.equal(gradeNumericVariant(v,String(v.answer+1)),false);for(const malformed of [null,'','1e1','8.0','-1',{},'100'])assert.throws(()=>gradeNumericVariant(v,malformed));}
});
