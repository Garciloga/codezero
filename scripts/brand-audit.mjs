import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
// URLs, environment keys and identifiers remain stable. Only user-facing literals are inspected.
const issues=[];
const technical={'lib/localization/shared.ts':['CodeZero','Empezó con el nombre CodeZero,'],'lib/user-appearance.ts':['codezero.appearance.v1:']};
function allowed(value){return /^attachment; filename="codezero-/.test(value)|| /^https?:\/\/|^\/|^[A-Z0-9_]+$|^[a-z0-9_-]+$/.test(value)||value.startsWith('Empezó con el nombre CodeZero,');}
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(/\.(ts|tsx|json|html)$/.test(f)){
 const source=fs.readFileSync(f,'utf8');
 if(f.includes('/localization/')&&f.endsWith('.json')){for(const [k,v]of Object.entries(JSON.parse(source)))if(typeof v==='string'&&/CodeZero/i.test(v)&&!allowed(k)&&!allowed(v))issues.push(`${f}: ${k}`);}
 else if(f.endsWith('.html')){const visible=source.replace(/<[^>]*>/g,'');if(/CodeZero/i.test(visible))issues.push(f);}
 else {const tree=ts.createSourceFile(f,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);function visit(n){if((ts.isJsxText(n)||ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))&&/CodeZero/i.test(n.text)&&!allowed(n.text)&&!technical[f]?.includes(n.text)&&!ts.isImportDeclaration(n.parent)){issues.push(`${f}:${tree.getLineAndCharacterOfPosition(n.pos).line+1}`);}ts.forEachChild(n,visit);}visit(tree);}
 }}}
walk('app');walk('lib');walk('supabase/templates');
console.log(`Brand audit: ${issues.length} findings`);for(const i of issues)console.error(i);if(issues.length)process.exitCode=1;
