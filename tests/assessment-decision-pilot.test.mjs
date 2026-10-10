import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {initialPilot,decidePilot,pilotScene,pilotOptions,summarizePilot,PILOT_STAGES} from "../lib/assessment-decision-pilot.ts";
import {assessmentPilotCopy} from "../lib/localization/assessment-pilot.ts";

const reason="I would compare independent activity evidence against the agreed outcome and confirm accountability before committing.";
const choose=(s,id)=>decidePilot(s,id,reason);
test("five escalating challenge levels use a real decision chain and preserve clean initial state",()=>{
  let state=initialPilot();
  assert.equal(state.metrics.adoption,42);
  assert.deepEqual(PILOT_STAGES,[2,5,8,11,14]);
  state=choose(state,"discover");
  assert.equal(state.stage,1);
  assert.ok(state.metrics.risk<60);
  state=choose(state,"frame");
  assert.equal(pilotScene(state),"evidence");
  state=choose(state,"verify");
  assert.equal(state.metrics.adoption,50);
  state=choose(state,"phased");
  state=choose(state,"revise");
  const result=summarizePilot(state);
  assert.equal(result.percentage,100);
  assert.equal(result.criticalErrors,0);
  assert.equal(result.decisionReady,true);
  assert.equal(state.events.length,5);
  assert.throws(()=>choose(state,"revise"),/COMPLETE/);
  assert.equal(initialPilot().events.length,0);
});
test("bad choices create a different stage and critical errors cannot be averaged away",()=>{
  let state=choose(initialPilot(),"discount");
  state=choose(state,"promise");
  assert.equal(pilotScene(state),"escalation");
  state=choose(state,"recover");
  state=choose(state,"phased");
  state=choose(state,"revise");
  const result=summarizePilot(state);
  assert.equal(result.criticalErrors,1);
  assert.equal(result.decisionReady,false);
});
test("invalid rationale, long rationale and unknown options cannot register an attempt",()=>{
  assert.throws(()=>decidePilot(initialPilot(),"discover","done"),/RATIONALE_REQUIRED/);
  assert.throws(()=>decidePilot(initialPilot(),"discover","x".repeat(2501)),/RATIONALE_REQUIRED/);
  assert.throws(()=>decidePilot(initialPilot(),"unknown",reason),/INVALID_CHOICE/);
  assert.throws(()=>summarizePilot(initialPilot()),/INCOMPLETE/);
});
test("every stage and alternative is localized in Spanish, English, Portuguese and French",()=>{
  let state=initialPilot();
  const scenarios=new Set();
  const walk=(s)=>{
    if(s.stage===5)return;
    const name=pilotScene(s);
    scenarios.add(name);
    for(const option of pilotOptions(s))walk(choose(s,option.id));
  };
  walk(state);
  assert.deepEqual([...scenarios].sort(),["communication","diagnosis","escalation","evidence","planning","transfer"]);
  for(const [lang,copy] of Object.entries(assessmentPilotCopy)){
    assert.ok(copy.heading.length>8,lang);
    for(const scenario of scenarios){
      const scene=copy.scenes[scenario];
      assert.ok(scene?.context?.length>25,lang+"/"+scenario);
      for(const optionId of new Set(pilotOptions(scenario==="diagnosis"?initialPilot():{
        ...initialPilot(),stage:scenario==="communication"?1:scenario==="planning"?3:scenario==="transfer"?4:2,
        metrics:{...initialPilot().metrics,risk:scenario==="escalation"?99:20}
      }).map(o=>o.id))){
        assert.equal(scene.choices[optionId]?.length,2,lang+"/"+scenario+"/"+optionId);
      }
    }
  }
});
test("owner-only pilot is isolated from progress, billing and certificates",()=>{
  const page=readFileSync(new URL("../app/admin/assessments-pilot/page.tsx",import.meta.url),"utf8");
  const client=readFileSync(new URL("../app/admin/assessments-pilot/assessment-pilot.tsx",import.meta.url),"utf8");
  assert.ok(page.indexOf("await requireOwner(user.id)")<page.indexOf("return <AssessmentDecisionPilot"));
  assert.match(page,/robots:\{index:false,follow:false\}/);
  assert.doesNotMatch(page+client,/\.rpc\(|\.insert\(|\.upsert\(|\.update\(|\.delete\(|fetch\(|localStorage|sessionStorage|award.*certificate|finish_exam_sitting/);
  assert.match(client,/useState\(initialPilot\)/);
});
