import test from 'node:test';import assert from 'node:assert/strict';
import {createExamSitting,resolveSittingAnswers} from '../lib/exam-sitting.ts';
test('all shuffled options grade back to the original server answer without serializing solutions',()=>{
 const original=[{id:1,prompt:'Pregunta',options:['correcta','otra','tercera','cuarta']},{id:2,prompt:'Otra',options:['sí','no']}];
 for(let i=0;i<50;i++){const v=createExamSitting(original);assert.equal(v.questions.length,2);assert.equal(JSON.stringify(v.questions).includes('mapping'),false);for(const q of v.questions){assert.deepEqual([...q.options].sort(),[...original.find(x=>x.id===q.id).options].sort());const chosen=String.fromCharCode(65+q.options.indexOf(original.find(x=>x.id===q.id).options[0]));const answers=Object.fromEntries(v.questions.map(x=>[x.id,x.id===q.id?chosen:'A']));assert.equal(resolveSittingAnswers(v.mapping,answers)[q.id],'A');}}
});
test('foreign, missing and malformed displayed answers fail closed',()=>{
 assert.throws(()=>resolveSittingAnswers({'1':['B','A']},{'1':'C'}));assert.throws(()=>resolveSittingAnswers({'1':['B','A']},{}));assert.throws(()=>resolveSittingAnswers({'1':['B','B']},{'1':'A'}));assert.throws(()=>createExamSitting([]));
});
