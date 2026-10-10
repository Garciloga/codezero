import {translationGate} from './localization-flag-policy.mjs';
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const attrs=new Set(['aria-label','aria-description','aria-valuetext','title','alt','placeholder','label']);
// Use repository-relative POSIX paths for exceptions and release gates on every OS.
export const normalizedAuditPath=file=>file.replaceAll('\\','/');
export const isLocalizationSource=file=>normalizedAuditPath(file).split('/').includes('localization');
export const normalized=s=>s.replace(/\s+/g,' ').trim();
export function authoredStrings(file,source){
 const found=new Set(),tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function visit(node){
  if(ts.isJsxElement(node)&&(['code','textarea','script','style'].includes(node.openingElement.tagName.getText(tree))||node.openingElement.attributes.properties.some(a=>ts.isJsxAttribute(a)&&a.name.getText(tree)==='translate'&&a.initializer?.text==='no')))return;
  if(ts.isJsxText(node)){const text=normalized(node.text);if(/[\p{L}]/u.test(text))found.add(text);}
  if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)){
   const p=node.parent,v=normalized(node.text);
   if(ts.isJsxAttribute(p)&&attrs.has(p.name.getText(tree)))found.add(v);
   else if(!ts.isImportDeclaration(p)&&(/[À-ÿ¿¡]|\b(el|la|los|las|un|una|tu|tus|para|con|sin|del|de|por|No|Guardar|Enviar|Buscar|Cancelar|Volver|Continuar)\b/.test(v))&&!v.startsWith('/')&&!v.startsWith('http'))found.add(v);
  }
  if(ts.isTemplateExpression(node)){const v=normalized(node.head.text+node.templateSpans.map((x,i)=>`{${i}}`+x.literal.text).join(''));if(/[À-ÿ¿¡]|\b(de|tu|para|con|por|en|el|la)\b/.test(v))found.add(v);}
  ts.forEachChild(node,visit);
 }visit(tree);return [...found].filter(s=>s&&s!=='·');
}
export function audit(root='.'){
 const locales=['en','pt','fr'];const catalogs=Object.fromEntries(locales.map(lang=>[lang,Object.assign({},...['ui','server','curriculum','extension','social','mixed','suggestions','technical'].map(kind=>JSON.parse(fs.readFileSync(path.join(root,`lib/localization/${lang}-${kind}.json`)))))]));
 const ignored=JSON.parse(fs.readFileSync(path.join(root,'scripts/localization-audit-exceptions.json')));
 const problems=[];let checked=0;
 function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(isLocalizationSource(file))continue;if(entry.isDirectory())walk(file);else if(/\.(tsx|ts)$/.test(file)){for(const s of authoredStrings(file,fs.readFileSync(file,'utf8'))){checked++;const relative=normalizedAuditPath(path.relative(root,file));if(ignored[relative]?.includes(s))continue;for(const lang of locales)if(!Object.hasOwn(catalogs[lang],s)||!catalogs[lang][s]?.trim())problems.push({file:relative,locale:lang,source:s});}}}}
 for(const item of JSON.parse(fs.readFileSync(path.join(root,'lib/learning-companions.json')))) for(const field of ['title','steps','failure','challenge']) { checked++; for(const lang of locales) if(!catalogs[lang][item[field]]) problems.push({file:'lib/learning-companions.json',locale:lang,source:item[field]}); }
 // Snapshots of published authored content are audited too; live DB edits must refresh these.
 for (const file of ['localization-curriculum-source.json','localization-faq-source.json']) {
  const content=JSON.parse(fs.readFileSync(path.join(root,file)));
  const visit=value=>{if(Array.isArray(value)){for(const item of value)visit(item);}else if(value&&typeof value==='object'){for(const [field,item]of Object.entries(value)){if(['title','description','content','instructions','prompt','question','answer','option_a','option_b','option_c','option_d'].includes(field)&&typeof item==='string'){checked++;for(const lang of locales)if(!catalogs[lang][item]&&!catalogs[lang][normalized(item)])problems.push({file,locale:lang,source:item});}else if(item&&typeof item==='object')visit(item);}}};visit(content);
 }
 walk(path.join(root,'app'));walk(path.join(root,'lib'));const warnings=problems.filter(p=>translationGate(p.file)==='warning');return {checked,problems:problems.filter(p=>translationGate(p.file)==='error'),warnings};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const result=audit();if(result.warnings.length)console.warn(`Inactive modules: ${result.warnings.length} pending translations`);for(const x of result.problems)console.error(`${x.locale} ${x.file}: ${x.source.slice(0,120)}`);
 console.log(`Translation audit: ${result.checked} authored occurrences; ${result.problems.length} missing translations.`);if(result.problems.length)process.exitCode=1;
}

