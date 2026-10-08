"""Build only missing authored content with local models; never transmit user data."""
import json,re
from pathlib import Path
import argostranslate.package as packages
import ctranslate2
root=Path('lib/localization')
sources=json.loads((root/'extension-source.json').read_text())
pkgs={(p.from_code,p.to_code):p for p in packages.get_installed_packages()}
protected=re.compile(r'(`[^`]+`|https?://[^\s]+|\{\d+\}|\b(?:Garciloga|CodeZero|Faro|Nube|Puente|Python|SQL|API|APIs|CSV|QBR|EBR|ROI|NPS|CSAT|Customer Success|Admin|Starter|Pro|Enterprise|WebP|JPG|PNG|UUID)\b|\b\d+(?:[.,]\d+)*\b)')
plans={};segments=[]
for s in sources:
 parts=[]
 for p in protected.split(s):
  if not p:continue
  if protected.fullmatch(p) or not re.search('[A-Za-zÀ-ÿ]',p):parts.append(('raw',p));continue
  lead=p[:len(p)-len(p.lstrip())];trail=p[len(p.rstrip()):]
  chunks=re.split(r'(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚ¿¡])',p.strip())
  for i,c in enumerate(chunks):
   if i:parts.append(('raw',' '))
   segments.append(c);parts.append(('segment',c,lead if not i else '',trail if i==len(chunks)-1 else ''))
 plans[s]=parts
segments=list(dict.fromkeys(segments))
def run(src,target,inputs):
 cachefile=root/f'.extension-cache-{src}-{target}.json'
 cache=json.loads(cachefile.read_text()) if cachefile.exists() else {}
 remaining=[s for s in inputs if s not in cache];p=pkgs[(src,target)]
 model=ctranslate2.Translator(str(p.package_path/'model'),device='cpu',compute_type='int8',inter_threads=1,intra_threads=4)
 for i in range(0,len(remaining),48):
  batch=remaining[i:i+48];results=model.translate_batch([p.tokenizer.encode(s) for s in batch],beam_size=3,max_batch_size=4096,batch_type='tokens',max_decoding_length=512,target_prefix=[[p.target_prefix]]*len(batch) if p.target_prefix else None)
  for s,r in zip(batch,results):
   value=p.tokenizer.decode(r.hypotheses[0]).strip()
   if p.target_prefix and value.startswith(p.target_prefix):value=value[len(p.target_prefix):].strip()
   if not value:raise ValueError('Empty translation')
   cache[s]=value
  cachefile.write_text(json.dumps(cache,ensure_ascii=False));print(src,target,i+len(batch),'/',len(remaining),flush=True)
 return cache
en=run('es','en',segments);values={'en':en}
for lang in ['pt','fr']:
 secondary=run('en',lang,list(dict.fromkeys(en.values())))
 values[lang]={s:secondary[en[s]] for s in segments}
for lang,d in values.items():
 extension={s:''.join(p[1] if p[0]=='raw' else p[2]+d[p[1]]+p[3] for p in plans[s]) for s in sources}
 overrides=json.loads((root/'extension-editorial-overrides.json').read_text()) if (root/'extension-editorial-overrides.json').exists() else {}
 extension.update(overrides.get(lang,{}))
 (root/f'{lang}-extension.json').write_text(json.dumps(extension,ensure_ascii=False,indent=2)+'\n')
 client=json.loads((root/'extension-client-source.json').read_text())
 (root/f'{lang}-client-extension.json').write_text(json.dumps({s:extension[s] for s in client},ensure_ascii=False,indent=2)+'\n')
 print('Written',lang,len(extension),flush=True)
