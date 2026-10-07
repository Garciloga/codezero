import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const source = new Set();
const templates = new Set();
const files=[];
function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(p))files.push(p);}}
walk('app');walk('lib');
export function normalize(s){return s.replace(/\s+/g,' ').trim();}
function add(s){const v=normalize(s);if(v && /[a-zA-ZÀ-ÿ]/.test(v) && !/^(https?:|\/|[\w.-]+@)/.test(v) && (/[\sÀ-ÿ¿¡]/.test(v)||/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(v)||/^[A-ZÁÉÍÓÚÑ]{3,}$/.test(v)))source.add(v);}
for(const p of files){if(p.includes('localization/'))continue;const s=fs.readFileSync(p,'utf8');const tree=ts.createSourceFile(p,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function visit(n){
 if(ts.isJsxText(n))add(n.text);
 if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))add(n.text);
 if(ts.isTemplateExpression(n)){const v=n.head.text+n.templateSpans.map((x,i)=>`{${i}}`+x.literal.text).join('');if(/[À-ÿ]|\b(de|tu|para|con|por|en|el|la)\b/i.test(v)){add(v);templates.add(normalize(v));}}
 ts.forEachChild(n,visit);
}visit(tree);}
// This is authored curriculum only: no attempts, solutions, identities or user submissions.
const curriculum=JSON.parse(fs.readFileSync('localization-curriculum-source.json','utf8'));
const authored=new Set();
function collect(v){if(typeof v==='string')authored.add(v);else if(Array.isArray(v))v.forEach(collect);else if(v&&typeof v==='object')Object.values(v).forEach(collect);}
collect(curriculum);
fs.writeFileSync('lib/localization/source-ui.json',JSON.stringify([...source].sort(),null,2)+'\n');
fs.writeFileSync('lib/localization/source-curriculum.json',JSON.stringify([...authored].sort(),null,2)+'\n');
fs.writeFileSync('lib/localization/templates.json',JSON.stringify([...templates].sort(),null,2)+'\n');
console.log({ui:source.size,curriculum:authored.size,templates:templates.size});
