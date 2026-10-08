import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cancellationAction} from '../lib/cancellation-history.ts';
import fs from 'node:fs';
import sharp from 'sharp';
import {normalizeCompanyBrand} from '../lib/company-brand.ts';
import {TRAINING_ACTIVITIES,TRAINING_UNITS} from '../lib/role-training-content.ts';
import {PROFESSIONAL_ROUTES,PROFESSIONAL_ACTIVITIES} from '../lib/professional-route-content.ts';
test('cancellation history observes transitions, not unrelated subscription updates',()=>{
 assert.equal(cancellationAction('customer.subscription.created',false,{}),null);
 assert.equal(cancellationAction('customer.subscription.updated',true,{}),null);
 assert.equal(cancellationAction('customer.subscription.updated',true,{cancel_at_period_end:false}),'scheduled');
 assert.equal(cancellationAction('customer.subscription.updated',false,{cancel_at_period_end:true}),'reversed');
 assert.equal(cancellationAction('customer.subscription.updated',true,{cancel_at_period_end:true}),null);
 assert.equal(cancellationAction('customer.subscription.deleted',false,{}),'ended');
});
test('company logos retain aspect ratio and strip metadata; raster covers and invalid uploads are bounded',async()=>{
 const input=await sharp({create:{width:1200,height:300,channels:4,background:'#12345600'}}).png().withMetadata().toBuffer();
 const logo=await normalizeCompanyBrand(input,'image/png','logo'),meta=await sharp(logo).metadata();
 assert.equal(meta.width,512);assert.equal(meta.height,128);assert.equal(meta.exif,undefined);assert.equal(meta.format,'webp');
 const cover=await sharp(await normalizeCompanyBrand(input,'image/png','cover')).metadata();assert.ok(cover.width<=1440&&cover.height<=480);
 await assert.rejects(()=>normalizeCompanyBrand(Buffer.from('<svg/>'),'image/png','logo'));
});
test('all route decisions have distinct localized alternatives; pilot numeric facts remain unchanged',()=>{
 const normalized=s=>s.replace(/\s+/g,' ').trim();
 for(const lang of ['en','pt','fr']){
 const messages=Object.assign({},...['ui','server','curriculum','extension','social','mixed'].map(kind=>JSON.parse(fs.readFileSync(`lib/localization/${lang}-${kind}.json`))));
 for(const label of ['Sin evidencia suficiente','Reconoce','Aplica con apoyo','Aplica solo','Sostiene','Sin datos','Alto','Medio','Bajo'])assert.ok(messages[label],lang+': '+label);
 for(const activity of [...TRAINING_ACTIVITIES,...PROFESSIONAL_ACTIVITIES]){
 for(const key of ['title','lesson','task','template','example'])assert.ok(messages[normalized(activity[key])],`${lang}: ${activity.key}: ${key}`);
 for(const d of activity.decisions){const options=d.options.map(s=>messages[normalized(s)]);assert.ok(options.every(Boolean),activity.key);assert.equal(new Set(options).size,options.length,`${lang}: ${activity.key}: ambiguous options`);assert.ok(messages[normalized(d.feedback)]);}
 }
 for(const a of TRAINING_UNITS){const source=normalized(a.lesson),result=messages[source];assert.deepEqual(result.match(/\d+/g)??[],source.match(/\d+/g)??[],`${lang}: ${a.key}: numeric fact changed`);}
 }
});
test('professional route keys and reevaluations refer to unique activities and existing units',()=>{
 const keys=new Set(PROFESSIONAL_ACTIVITIES.map(a=>a.key));assert.equal(keys.size,308);
 for(const route of PROFESSIONAL_ROUTES){const activities=PROFESSIONAL_ACTIVITIES.filter(a=>a.route===route.key);assert.equal(activities.length,44);for(const level of [1,2,3,4])assert.equal(activities.filter(a=>a.key.includes('-unit-')&&a.level===level).length,5);assert.equal(activities.filter(a=>a.kind==='capstone').length,1);for(const a of activities.filter(a=>a.reevaluationOf))assert.ok(keys.has(a.reevaluationOf));}
});

