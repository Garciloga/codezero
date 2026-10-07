import test from 'node:test';import assert from 'node:assert/strict';import {boundedForm} from '../lib/bounded-form.ts';
test('form byte limit rejects an oversized body even with a forged length header',async()=>{
 const req=new Request('https://example.test',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','content-length':'1'},body:'draft='+ 'x'.repeat(100)});
 await assert.rejects(()=>boundedForm(req,50),/FORM_TOO_LARGE/);
 const ok=await boundedForm(new Request('https://example.test',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'draft=hola&choice=1'}),100);assert.equal(ok.get('draft'),'hola');
});
