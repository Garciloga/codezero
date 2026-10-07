import {randomInt} from 'node:crypto';
export type ExamQuestion={id:number;prompt:string;options:string[]};
export type SittingVariant={questions:ExamQuestion[];mapping:Record<string,string[]>};
function shuffled<T>(values:T[]){const out=[...values];for(let i=out.length-1;i>0;i--){const j=randomInt(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
export function createExamSitting(questions:ExamQuestion[]):SittingVariant{
 if(!questions.length||questions.length>100||new Set(questions.map(q=>q.id)).size!==questions.length)throw Error('INVALID_QUESTIONS');
 const mapping:Record<string,string[]>={};
 const publicQuestions=shuffled(questions).map(q=>{
  if(!Number.isSafeInteger(q.id)||q.id<1||typeof q.prompt!=='string'||!Array.isArray(q.options)||q.options.length<2||q.options.length>4||q.options.some(x=>typeof x!=='string'))throw Error('INVALID_QUESTIONS');
  const order=shuffled(q.options.map((_,index)=>index));mapping[String(q.id)]=order.map(index=>String.fromCharCode(65+index));
  return{id:q.id,prompt:q.prompt,options:order.map(index=>q.options[index])};
 });
 return{questions:publicQuestions,mapping};
}
export function resolveSittingAnswers(mapping:Record<string,string[]>,answers:Record<string,string>){
 const resolved:Record<string,string>={};
 if(!mapping||typeof mapping!=='object'||Array.isArray(mapping))throw Error('INVALID_MAPPING');
 for(const [id,labels] of Object.entries(mapping)){
  const index=String(answers[id]??'').charCodeAt(0)-65;
  if(!Array.isArray(labels)||labels.length<2||labels.length>4||new Set(labels).size!==labels.length||labels.some(x=>!/^[A-D]$/.test(x))||!/^[A-D]$/.test(answers[id]??'')||index<0||index>=labels.length)throw Error('INVALID_ANSWER');
  resolved[id]=labels[index];
 }
 return resolved;
}
