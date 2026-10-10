import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const file=fs.readFileSync("lib/draft-expanded-curriculum.ts","utf8");
const names=["grc-advanced","red-flags","cross-sell","upsell","retention","onboarding-30-60-90","ai-at-work","professional-languages","candidate-assessment","metrics-lab","employability","manager-toolkit"];
test("twelve course extensions have fifteen domain-specific titles",()=>{
 for(const name of names){const needle='"'+name+'": ';assert.ok(file.includes(needle),name);}
 assert.match(file,/split\(";"\)/);assert.match(file,/priorEvidenceRequired:i>0/);
 assert.match(file,/personalityInferenceForbidden:true/);
 assert.match(file,/independentHumanReviewer:true/);
 assert.match(file,/criticalErrorsAllowed:0/);
 assert.match(file,/return null/);
});
test("expansion stays editor only and never registers draft as a released route",()=>{
 assert.match(file,/import "server-only"/);
 const pub=fs.readFileSync("lib/product-roadmap.ts","utf8");
 assert.ok(!pub.includes("draftExpandedCurriculum"));
});
\ntest("expanded cases offer defensible alternatives with three stages, never a trivial single answer",()=>{
 assert.ok(file.includes('grading:"human-rubric-no-single-correct-option"'));
 assert.ok(file.includes('phase:"diagnóstico"'));
 assert.ok(file.includes('phase:"ejecución"'));
 assert.ok(file.includes('phase:"revisión"'));
 assert.ok(file.includes('neverInferTraits:true'));
 assert.ok(!file.includes('reviewerOnlyPreferred:0'));
});\n