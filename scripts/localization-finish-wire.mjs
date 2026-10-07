import ts from 'typescript';import fs from 'node:fs';import path from 'node:path';
const files=[];function walk(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p);else if(p.endsWith('.tsx')&&!p.includes('/localization/')&&!p.includes('/social/'))files.push(p);}}walk('app');
for(const file of files){let code=fs.readFileSync(file,'utf8');const tree=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const edits=[];let dates=false;let metadata=false;
 function visit(n){
  if(ts.isJsxExpression(n)&&n.expression&&ts.isCallExpression(n.expression)){const call=n.expression;if(ts.isPropertyAccessExpression(call.expression)&&['toLocaleDateString','toLocaleString'].includes(call.expression.name.text)&&ts.isNewExpression(call.expression.expression)&&call.expression.expression.expression.getText(tree)==='Date'){
   dates=true;edits.push({start:n.getStart(tree),end:n.end,value:`<LocalizedDate value={${call.expression.expression.arguments[0].getText(tree)}}${call.expression.name.text==='toLocaleString'?' includeTime':''} />`});
  }}
  if(ts.isVariableStatement(n)&&n.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)){const d=n.declarationList.declarations.find(d=>d.name.getText(tree)==='metadata');if(d?.initializer){metadata=true;edits.push({start:n.getStart(tree),end:n.end,value:`export async function generateMetadata() { return translatedMetadata(${d.initializer.getText(tree)}); }`});}}
  ts.forEachChild(n,visit);
 }visit(tree);
 edits.sort((a,b)=>b.start-a.start);for(const e of edits)code=code.slice(0,e.start)+e.value+code.slice(e.end);
 // Native options must not contain spans. Names stay opaque at the option boundary.
 code=code.replace(/<option([^>]*)><span translate="no">(.*?)<\/span><\/option>/gs,'<option$1 translate="no">$2</option>');
 if(!file.endsWith('block-diploma-document.tsx')&&!file.endsWith('certificate-sharing.tsx'))code=code.replace(/<span translate="no">\{name\}<\/span>/g,'{name}');
 if(dates){let p=path.relative(path.dirname(file),'app/components/localization/date');if(!p.startsWith('.'))p='./'+p;const imp=`import LocalizedDate from '${p}';\n`;if(/^\s*["']use client/.test(code)){const pos=code.indexOf(';')+1;code=code.slice(0,pos)+'\n'+imp+code.slice(pos);}else code=imp+code;}
 if(metadata){let p=path.relative(path.dirname(file),'lib/localization/metadata');if(!p.startsWith('.'))p='./'+p;code=`import { translatedMetadata } from '${p}';\n`+code;}
 fs.writeFileSync(file,code);
}
