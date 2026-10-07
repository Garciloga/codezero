import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import { createRequire } from 'node:module';import React from 'react';import { renderToStaticMarkup } from 'react-dom/server';
import { translator, validLocale } from '../lib/localization/shared.ts';
const require=createRequire(import.meta.url);const tree={};new Function('require','exports',ts.transpileModule(fs.readFileSync('lib/localization/tree.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,tree);
for(const locale of ['en','pt','fr'])test(`${locale}: all authored curriculum strings have translations and remain server-only`,()=>{
 const source=JSON.parse(fs.readFileSync('lib/localization/source-curriculum.json'));const curriculum=JSON.parse(fs.readFileSync(`lib/localization/${locale}-curriculum.json`));const ui=JSON.parse(fs.readFileSync(`lib/localization/${locale}-ui.json`));
 for(const text of source)assert.ok(typeof curriculum[text]==='string'&&curriculum[text].length>0,'Missing authored translation');
 assert.ok(source.filter(s=>s.length>500).every(s=>!Object.hasOwn(ui,s)),'Paid lesson content must not be a client message');
 for(const [key,value]of Object.entries(curriculum)){assert.deepEqual(value.match(/\d+(?:[.,]\d+)?/g)??[],key.match(/\d+(?:[.,]\d+)?/g)??[],'Numbers and version identifiers must remain unchanged');for(const code of key.match(/`[^`\n]+`/g)??[])assert.ok(value.includes(code),'Inline code must be unchanged');}
 const groups=JSON.parse(fs.readFileSync('localization-curriculum-source.json'));const translate=translator(curriculum);for(const group of [...groups.exercises,...groups.questions]){assert.equal(new Set(group.options.map(translate)).size,new Set(group.options).size,'Distinct choices must remain distinct after translation');}
 const t=translator(ui);assert.notEqual(t('Empezar gratis'),'Empezar gratis');assert.notEqual(t('Contraseña'),'Contraseña');
});
test('render localization preserves original form values, user data, code and security props',()=>{
 const t=translator({'Nombre':'Name','Guardar':'Save','SELECT':'Choose','Texto de ayuda':'Help text'});
 const element=React.createElement('form',{action:'/api/profile/update',method:'post'},React.createElement('label',{htmlFor:'name'},'Nombre'),React.createElement('input',{id:'name',name:'full_name',defaultValue:'Guardar',placeholder:'Texto de ayuda'}),React.createElement('button',{type:'submit'},'Guardar'),React.createElement('p',{translate:'no'},'Nombre'),React.createElement('code',null,'SELECT'));
 const html=renderToStaticMarkup(tree.translateTree(element,t));assert.match(html,/action="\/api\/profile\/update"/);assert.match(html,/method="post"/);assert.match(html,/value="Guardar"/);assert.match(html,/placeholder="Help text"/);assert.match(html,/>Name<\/label>/);assert.match(html,/>Save<\/button>/);assert.match(html,/<p translate="no">Nombre<\/p>/);assert.match(html,/<code>SELECT<\/code>/);
});
test('locale validation, whitespace and dynamic messages do not alter caller-owned variables',()=>{
 for(const lang of ['es','en','pt','fr'])assert.equal(validLocale(lang),true);for(const lang of ['de','en-US','../en',null,{},'ES'])assert.equal(validLocale(lang),false);
 const t=translator({'Avance de {0}':'Progress for {0}','Guardar':'Save'});assert.equal(t('Avance de Isaac López'),'Progress for Isaac López');assert.equal(t('\n Guardar  '),'\n Save  ');assert.equal(t('Unrecognized user input'),'Unrecognized user input');
});
