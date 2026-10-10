import test from "node:test";import assert from "node:assert/strict";
import {draftCourseAssignmentsEnabled,validDraftAssignment,DRAFT_COURSES} from "../lib/draft-course-assignment-policy.ts";
const env={CODEZERO_DRAFT_COURSE_ASSIGNMENTS:"1",CODEZERO_ENVIRONMENT:"sandbox",CODEZERO_WORKSPACE_SANDBOX:"1",CODEZERO_SANDBOX_PROJECT_REF:"local",NEXT_PUBLIC_SUPABASE_URL:"http://localhost:54321"};
test("course assignment is disabled in production and by default",()=>{
 assert.equal(draftCourseAssignmentsEnabled({}),false);
 assert.equal(draftCourseAssignmentsEnabled({...env,VERCEL_ENV:"production"}),false);
 assert.equal(draftCourseAssignmentsEnabled({...env,NEXT_PUBLIC_SUPABASE_URL:"https://kwfzhpapvpdatdfwhouf.supabase.co"}),false);
 assert.equal(draftCourseAssignmentsEnabled(env),true);
});
test("assignments require valid approved draft course, competency, intensity, future date",()=>{
 assert.equal(DRAFT_COURSES.length,12);
 const sample={course:"grc_advanced",competency:"diagnosis",emphasis:"focused",dueAt:"2027-01-15"};
 assert.equal(validDraftAssignment(sample),true);
 for(const x of [{course:"secret"},{competency:"personality"},{emphasis:"coercive"},{dueAt:"2020-01-01"}])
  assert.equal(validDraftAssignment({...sample,...x}),false);
});
test("draft assignment endpoint is sandbox-only and never touches existing learning assignments",async()=>{
 const s=await import("node:fs");const route=s.readFileSync("app/api/teams/course-assign/route.ts","utf8");
 assert.match(route,/workspaceSandboxEnabled\(\)/);
 assert.match(route,/trustedWorkspaceMutation/);
 assert.match(route,/assign_draft_learning_route/);
 assert.ok(!route.includes("assign_workspace_activity"));
});
