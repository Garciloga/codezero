import {test} from 'node:test';import assert from 'node:assert/strict';
import {validUsageBatch,usageSection} from '../lib/platform-usage.ts';
import {boundedJson} from '../lib/bounded-json.ts';
test('usage strips identifiers, queries and public token paths',()=>{
  assert.equal(usageSection('/teams/private-person?email=secret#message'),'teams');
  assert.equal(usageSection('/role-training/career-map?organization_id=private'),'career');
  for(const path of ['/','/login','/auth/callback','/portfolio/share/private','/verify/private'])assert.equal(usageSection(path),null);
});
test('usage only accepts bounded count batches, never identity or free text',()=>{
  const batch={id:'12345678-1234-4123-8123-123456789012',section:'learning',clicks:5,visits:1};assert.ok(validUsageBatch(batch));
  for(const x of [{...batch,user_id:'other'},{...batch,section:'/private'},{...batch,clicks:-1},{...batch,clicks:201},{...batch,clicks:1.5},{...batch,visits:2},{...batch,clicks:0,visits:0},{...batch,id:'wrong'}])assert.equal(validUsageBatch(x),false);
});
test('usage byte bound checks actual streamed bytes even with absent content length',async()=>{
  await assert.rejects(()=>boundedJson(new Request('http://local',{method:'POST',body:JSON.stringify({x:'a'.repeat(1100)})}),1024));
  assert.deepEqual(await boundedJson(new Request('http://local',{method:'POST',body:'{"x":1}'}),1024),{x:1});
});
