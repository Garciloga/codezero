import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("expanded 15-level viewer is owner protected, no student route",()=>{
 const s=fs.readFileSync("app/admin/curriculum/drafts/expanded/page.tsx","utf8");
 assert.match(s,/requireOwner\(user.id\)/);
 assert.match(s,/draftExpandedCurriculum\(q.course/);
 assert.match(s,/lesson.decision.phases.map/);
 assert.match(s,/metadata=\{title:/);
 assert.ok(!fs.readFileSync("app/(public)/page.tsx","utf8").includes("draftExpandedCurriculum"));
});
