import test from 'node:test';import assert from 'node:assert/strict';
import {parseAssignedActivity,csvCell,teamReportCsv} from '../lib/team-report.ts';
test('assignment selection accepts only bounded published catalog identifiers',()=>{
 assert.deepEqual(parseAssignedActivity('lesson:12'),{type:'lesson',id:12});
 for(const id of ['lesson:0','lesson:1.5','admin:1','exam:01','project:9007199254740992','lesson:1;DROP',' lesson:1',null])assert.equal(parseAssignedActivity(id),null);
});
test('CSV treats spreadsheet formulas as text and escapes embedded quotes, commas and lines',()=>{
 for(const value of ['=SUM(1,2)','+CMD','-1','@IMPORT',' \t=1','\r\n@1'])assert.ok(csvCell(value).startsWith('"\''));
 assert.equal(csvCell('a,"b"\nc'),'"a,""b""\nc"');assert.equal(csvCell(80),'"80"');
});
test('report includes only active visible roster and assigned activity evidence',()=>{
 const members=[{user_id:'a',display_name:'Ana',role:'manager',active:true},{user_id:'b',display_name:'Suspendido',role:'learner',active:false}];
 const assignments=[{user_id:'a',activity_key:'lesson:1',title:'API',competency:'APIs'},{user_id:'b',activity_key:'lesson:1',title:'Oculta',competency:'APIs'},{user_id:'outsider',activity_key:'lesson:1',title:'Otra empresa',competency:'APIs'}];
 const report=teamReportCsv(members,assignments,[{user_id:'a',activity_key:'lesson:2',completed:true,score:100,observed_at:'today'}]);
 assert.ok(report.startsWith('\ufeff'));assert.match(report,/Ana/);assert.match(report,/Pendiente/);assert.doesNotMatch(report,/Suspendido|Otra empresa|100|today/);
});
