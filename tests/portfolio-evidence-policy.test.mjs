import test from "node:test";import assert from "node:assert/strict";import {eligiblePersonalProject} from "../lib/portfolio-evidence-policy.ts";
const base={user_id:"student",organization_id:null,review_source:"admin",reviewed_by:"reviewer",kind:"project",critical_errors:[],competency_scores:{planning:3,communication:4}};
test("only approved personal evidence appears in opt-in portfolio",()=>{
 assert.equal(eligiblePersonalProject(base,"student"),true);
 for(const update of [{organization_id:"company"},{reviewed_by:"student"},{review_source:"self"},{competency_scores:{planning:2}},{critical_errors:["data_exposure"]},{kind:"exercise"},{user_id:"someone-else"},{competency_scores:{}}])assert.equal(eligiblePersonalProject({...base,...update},"student"),false);
});
