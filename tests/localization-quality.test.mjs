import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {authoredStrings,audit,normalizedAuditPath,isLocalizationSource} from '../scripts/localization-audit.mjs';
test('new visible labels and placeholders are detected, while form values and opaque code stay literal',()=>{
const found=authoredStrings('fixture.tsx','const x=<form><label>Una etiqueta nueva</label><input name="field" value="valor interno" placeholder="Describe tu caso"/><code>Texto de código</code><span translate="no">Nombre de persona</span></form>');assert.ok(found.includes('Una etiqueta nueva'));assert.ok(found.includes('Describe tu caso'));assert.ok(!found.includes('Texto de código'));assert.ok(!found.includes('Nombre de persona'));});
test('all detected authored strings have three translations',()=>assert.deepEqual(audit().problems,[]));
test('every level has a complementary example, an error case, a variation and a primary resource',()=>{
 const examples=JSON.parse(fs.readFileSync('lib/learning-companions.json'));assert.equal(new Set(examples.flatMap(x=>x.levels)).size,15);
 for(const x of examples){assert.ok(x.steps.length>80);assert.ok(x.failure.length>80);assert.ok(x.challenge.length>50);assert.match(x.resource,/^https:\/\/(docs\.python\.org|git-scm\.com|www\.postgresql\.org|developer\.mozilla\.org)\//);for(const locale of ['en','pt','fr']){const dict=JSON.parse(fs.readFileSync(`lib/localization/${locale}-server.json`));for(const field of ['title','steps','failure','challenge']){assert.ok(dict[x[field]]);assert.deepEqual(dict[x[field]].match(/\d+(?:[.,]\d+)?/g)??[],x[field].match(/\d+(?:[.,]\d+)?/g)??[]);}}}
});
test('technical glossary preserves meaning and literal identifiers after catalog regeneration',()=>{
 const expected={en:{Funciones:'Functions','Ramas y merges':'Branches and merges',principiante:'beginner',examen:'exam'},pt:{Funciones:'Funções','Ramas y merges':'Branches e merges',principiante:'iniciante',examen:'exame'},fr:{Funciones:'Fonctions','Ramas y merges':'Branches et fusions',principiante:'débutant',examen:'examen'}};
 for(const lang of ['en','pt','fr']){const dict=JSON.parse(fs.readFileSync(`lib/localization/${lang}-curriculum.json`));for(const [key,value]of Object.entries(expected[lang]))assert.equal(dict[key],value);for(const code of ['activa AND plan_de_pago','activa OR plan_de_pago','NOT activa','h1','git commit','CI/CD'])assert.equal(dict[code],code);}
});
test('UI catalog stays within its transfer budget and supplemental lessons remain server-only',()=>{
 for(const locale of ['en','pt','fr']){const bytes=fs.readFileSync(`lib/localization/${locale}-ui.json`);assert.ok(bytes.length<230000,'UI catalog unexpectedly expanded');const ui=JSON.parse(bytes);for(const example of JSON.parse(fs.readFileSync('lib/learning-companions.json')))assert.ok(!Object.hasOwn(ui,example.steps),'lesson content should not be serialized globally to visitors');}
});

test('localization audit handles Windows and POSIX separators consistently',()=>{
 for(const file of ['app/components/localization/language-selector.tsx','app\\\\components\\\\localization\\\\language-selector.tsx','lib/localization/shared.ts','lib\\\\localization\\\\shared.ts'])assert.equal(isLocalizationSource(file),true,file);
 for(const file of ['app/admin/page.tsx','app\\\\admin\\\\page.tsx'])assert.equal(isLocalizationSource(file),false,file);
 assert.equal(normalizedAuditPath('app\\\\admin\\\\page.tsx'),'app/admin/page.tsx');
});
