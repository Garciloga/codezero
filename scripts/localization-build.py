"""Offline catalogue build: Argos es→en, en→pt/fr; no runtime service or user data."""
import json,re,os,time
from pathlib import Path
import ctranslate2
import argostranslate.package as packages
ROOT=Path('lib/localization')
ui=json.loads((ROOT/'source-ui.json').read_text()); curriculum=json.loads((ROOT/'source-curriculum.json').read_text())
server=json.loads((ROOT/'source-server.json').read_text())
all_sources=list(dict.fromkeys(ui+server+curriculum)); segments=[]; plans={}
glossary={
 "cuota": {"en":"quota", "pt":"cota", "fr":"quota"},
 "cuotas": {"en":"quotas", "pt":"cotas", "fr":"quotas"},
 "caso límite": {"en":"edge case", "pt":"caso limite", "fr":"cas limite"},
 "casos límite": {"en":"edge cases", "pt":"casos limite", "fr":"cas limites"},
 "línea base": {"en":"baseline", "pt":"linha de base", "fr":"valeur de référence"},
 "alta de un cliente": {"en":"customer onboarding", "pt":"cadastro de um cliente", "fr":"inscription d’un client"},
 "baja de un empleado": {"en":"employee offboarding", "pt":"desligamento de um funcionário", "fr":"départ d’un employé"},
 "altas, cambios, bajas": {"en":"account creation, updates and deactivation", "pt":"criação, alteração e desativação de contas", "fr":"création, modification et désactivation de comptes"},

 "LABORATORIO GUIADO": {"en":"GUIDED LAB", "pt":"LABORATÓRIO GUIADO", "fr":"ATELIER GUIDÉ"},
 "LABORATORIO ENTERPRISE": {"en":"ENTERPRISE LAB", "pt":"LABORATÓRIO ENTERPRISE", "fr":"ATELIER ENTREPRISE"},
 "RETO DE TRANSFERENCIA": {"en":"TRANSFER CHALLENGE", "pt":"DESAFIO DE APLICAÇÃO", "fr":"DÉFI DE TRANSFERT"},
 "EVIDENCIA DE DOMINIO": {"en":"EVIDENCE OF MASTERY", "pt":"EVIDÊNCIA DE DOMÍNIO", "fr":"PREUVE DE MAÎTRISE"},
 "EJEMPLO RESUELTO": {"en":"WORKED EXAMPLE", "pt":"EXEMPLO RESOLVIDO", "fr":"EXEMPLE RÉSOLU"},
 "MINI-RETO": {"en":"MINI CHALLENGE", "pt":"MINIDESAFIO", "fr":"MINI-DÉFI"},
 "CASO APLICADO": {"en":"APPLIED CASE", "pt":"CASO APLICADO", "fr":"CAS PRATIQUE"},
 "RETO EXTRA": {"en":"EXTRA CHALLENGE", "pt":"DESAFIO EXTRA", "fr":"DÉFI SUPPLÉMENTAIRE"},
 "OPERACIÓN": {"en":"OPERATIONS", "pt":"OPERAÇÃO", "fr":"EXPLOITATION"},
 "RETO": {"en":"CHALLENGE", "pt":"DESAFIO", "fr":"DÉFI"},
 "Criterio de dominio": {"en":"Mastery criterion", "pt":"Critério de domínio", "fr":"Critère de maîtrise"},
 "Pensamiento computacional": {"en":"Computational thinking", "pt":"Pensamento computacional", "fr":"Pensée informatique"},
}

# Preserve executable examples, identifiers in backticks, links, placeholders and quoted literals.
terms=['CodeZero','Faro','Nube','Puente','Isaac López García','Stripe','Supabase','Vercel','Resend','Python','JavaScript','TypeScript','SQL','SQLite','SaaS','Customer Success','OAuth','III']+list(glossary)
protected=re.compile(r"(`[^`\n]+`|https?://[^\s)]+|[\w.+-]+@[\w.-]+\.[A-Za-z]+|\{\d+\}|\b\d+(?:[.,]\d+)*\b|\b(?:"+'|'.join(re.escape(t) for t in sorted(terms,key=len,reverse=True))+r")\b|\"[^\"\n]*\"|'[^'\n]*')")
code_line=re.compile(r'^\s*(?:```|(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|JOIN|HAVING)\b|(?:def|class|import|from|return|print|console\.|const |let |function |if\s*\(|for\s*\(|SELECT\s).*|[\w.\[\]"\']+\s*=(?!=)|\{|\}|\[|\]|#(?:include|define))',re.I)
# Build segments separated by newlines and protected code. This keeps code byte-for-byte.
for source in all_sources:
 parts=[];fenced=False
 # Repair escaped editorial line breaks while preserving escaped newlines in code literals.
 processed=protected.sub(lambda m:m.group(0).replace("\\n","CODEZERO_LITERAL_ESCAPED_N"),source).replace("\\n","\n").replace("CODEZERO_LITERAL_ESCAPED_N","\\n")
 for line in processed.splitlines(keepends=True):
  ending='\n' if line.endswith('\n') else '';line=line.rstrip('\n')
  if line.strip().startswith('```'):fenced=not fenced;parts.append(('raw',line+ending));continue
  if fenced or code_line.match(line):parts.append(('raw',line+ending));continue
  for part in protected.split(line):
   if not part:continue
   if part in glossary:parts.append(('glossary',part));continue
   if protected.fullmatch(part) or not re.search('[A-Za-zÀ-ÿ]',part):parts.append(('raw',part));continue
   # Short readable phrases are translated in context; technical/CSS fragments stay unchanged.
   if re.fullmatch(r'[\d\s.%,pxfr#-]+',part) or re.fullmatch(r'\d+px\s.*',part) or part.startswith(('application/','text/','image/')):parts.append(('raw',part));continue
   lead=part[:len(part)-len(part.lstrip())];trail=part[len(part.rstrip()):]
   body=part.strip()
   # Split large paragraphs at sentence boundaries to keep model context bounded.
   chunks=re.split(r'(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚ¿¡])',body) if len(body)>450 else [body]
   for idx,chunk in enumerate(chunks):
    if idx:parts.append(('raw',' '))
    if not chunk:continue
    segments.append(chunk);parts.append(('segment',chunk,lead if idx==0 else '',trail if idx==len(chunks)-1 else ''))
  if ending:parts.append(('raw',ending))
 plans[source]=parts
spanish={source:''.join(p[1] if p[0] in ('raw','glossary') else p[2]+p[1]+p[3] for p in parts) for source,parts in plans.items()}
(ROOT/'es-curriculum.json').write_text(json.dumps({s:spanish[s] for s in curriculum},ensure_ascii=False,indent=2)+'\n')
segments=list(dict.fromkeys(segments))
print('Sources',len(all_sources),'segments',len(segments),flush=True)
pkgs={(p.from_code,p.to_code):p for p in packages.get_installed_packages()}
def run(src,target,inputs):
 cachepath=ROOT/f'.cache-{src}-{target}.json'
 cache=json.loads(cachepath.read_text()) if cachepath.exists() else {}
 remaining=[s for s in inputs if s not in cache]
 p=pkgs[(src,target)];model=ctranslate2.Translator(str(p.package_path/'model'),device='cpu',compute_type='int8',inter_threads=1,intra_threads=8)
 for i in range(0,len(remaining),64):
  batch=remaining[i:i+64];tokens=[p.tokenizer.encode(s) for s in batch]
  result=model.translate_batch(tokens,beam_size=2,max_batch_size=4096,batch_type='tokens',replace_unknowns=True,max_decoding_length=512,target_prefix=[[p.target_prefix]]*len(batch) if p.target_prefix else None)
  for s,r in zip(batch,result):
   v=p.tokenizer.decode(r.hypotheses[0]).strip()
   if p.target_prefix and v.startswith(p.target_prefix):v=v[len(p.target_prefix):].strip()
   cache[s]=v or s
  cachepath.write_text(json.dumps(cache,ensure_ascii=False))
  if i%320==0:print(src,target,i+len(batch),'/',len(remaining),flush=True)
 return cache
en=run('es','en',segments)
translations={'en':en}
for locale in ['pt','fr']:
 translated=run('en',locale,list(dict.fromkeys(en.values())))
 translations[locale]={s:translated[en[s]] for s in segments}
for locale,dictionary in translations.items():
 values={}
 for source,parts in plans.items():
  values[source]=''.join(p[1] if p[0]=='raw' else glossary[p[1]][locale] if p[0]=='glossary' else p[2]+dictionary[p[1]]+p[3] for p in parts)
 (ROOT/f'{locale}-ui.json').write_text(json.dumps({s:values[s] for s in ui},ensure_ascii=False,indent=2)+'\n')
 (ROOT/f'{locale}-server.json').write_text(json.dumps({s:values[s] for s in server},ensure_ascii=False,indent=2)+'\n')
 (ROOT/f'{locale}-curriculum.json').write_text(json.dumps({s:values[s] for s in curriculum},ensure_ascii=False,indent=2)+'\n')
 print('Written',locale,flush=True)
