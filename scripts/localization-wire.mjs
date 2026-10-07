import ts from 'typescript';import fs from 'node:fs';import path from 'node:path';
const files=[];function walk(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p);else if(p.endsWith('.tsx'))files.push(p);}}walk('app');
let count=0;
for(const file of files){if(file==='app/layout.tsx'||file.includes('/localization/')||file.includes('/social/'))continue;
 let code=fs.readFileSync(file,'utf8');if(code.includes('import LocalizedContent'))continue;
 const tree=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const edits=[];
 function visit(n){
 if(ts.isJsxExpression(n)&&n.expression){const e=n.expression.getText(tree);if(/(?:\.(?:full_name|email|display_name|learner_name|submission_text|feedback|draft|subject|body)\b|\b(?:name|displayName)\b$)/.test(e)&&!e.includes('=>')&&!e.includes('<')){
  let parent=n.parent;let attr=false;while(parent&&!ts.isJsxElement(parent)&&!ts.isJsxFragment(parent)){if(ts.isJsxAttribute(parent))attr=true;parent=parent.parent;}
  if(!attr&&parent&&ts.isJsxElement(parent)&&!['textarea','pre','code'].includes(parent.openingElement.tagName.getText(tree))) edits.push({start:n.getStart(tree),end:n.end,value:`<span translate="no">${n.getText(tree)}</span>`});
 }}
 if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)||ts.isJsxFragment(n)){
  let parent=n.parent;let nested=false;while(parent){if(ts.isJsxElement(parent)||ts.isJsxFragment(parent)){nested=true;break;}parent=parent.parent;}
  if(!nested){edits.push({start:n.getStart(tree),end:n.getStart(tree),value:'<LocalizedContent>'});edits.push({start:n.end,end:n.end,value:'</LocalizedContent>'});}
 }
 ts.forEachChild(n,visit);
 }visit(tree);if(!edits.length)continue;
 edits.sort((a,b)=>b.start-a.start||b.end-a.end);for(const e of edits)code=code.slice(0,e.start)+e.value+code.slice(e.end);
 const client=/^\s*["']use client["']/.test(code);let relative=path.relative(path.dirname(file),`app/components/localization/${client?'client':'server'}`).replaceAll('\\','/');if(!relative.startsWith('.'))relative='./'+relative;
 const imp=`import LocalizedContent from ${JSON.stringify(relative)};\n`;
 if(client){const pos=code.indexOf(';')+1;code=code.slice(0,pos)+'\n'+imp+code.slice(pos);}else code=imp+code;
 fs.writeFileSync(file,code);count++;
}console.log('Localized render boundaries:',count);
