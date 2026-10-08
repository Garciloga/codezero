'use client';
import {useEffect,useRef,useState} from 'react';
import LocalizedContent from './localization/client';
import {boundedRuntimeResult} from '../../lib/code-runtime-policy';
type Run={id:string;channel:string;language:'python'|'sql';code:string};
export default function MixedCodeEditor({initialCode,language,runtimeOrigin,appOrigin}:{initialCode:string;language:'python'|'sql';runtimeOrigin:string;appOrigin:string}){
 const [code,setCode]=useState(initialCode),[run,setRun]=useState<Run|null>(null),[result,setResult]=useState<NonNullable<ReturnType<typeof boundedRuntimeResult>>|null>(null),[phase,setPhase]=useState('');const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{
  if(!run)return;let sent=false,running=false;let timer=setTimeout(()=>finish({status:'timeout',stdout:'',error:'No se pudo cargar el motor aislado. Comprueba que esté iniciado.',truncated:false}),30000);
  function finish(value:NonNullable<ReturnType<typeof boundedRuntimeResult>>){clearTimeout(timer);setResult(value);setRun(null);setPhase('');}
  function receive(event:MessageEvent){
   if(event.origin!==runtimeOrigin||event.source!==frame.current?.contentWindow||event.data?.channel!==run?.channel)return;
   if(event.data.type==='frame_ready'&&!sent){sent=true;frame.current?.contentWindow?.postMessage({type:'run',...run},runtimeOrigin);}
   else if(event.data.type==='running'&&event.data.id===run?.id&&!running){running=true;setPhase('Ejecutando tu práctica…');clearTimeout(timer);timer=setTimeout(()=>finish({status:'timeout',stdout:'',error:'La ejecución excedió el tiempo de práctica.',truncated:false}),5000);}
   else{const value=boundedRuntimeResult(event.data,run!.id);if(value)finish(value);}
  }
  window.addEventListener('message',receive);return()=>{clearTimeout(timer);window.removeEventListener('message',receive);};
 },[run,runtimeOrigin]);
 function stop(){if(run)frame.current?.contentWindow?.postMessage({type:'cancel',id:run.id,channel:run.channel},runtimeOrigin);setRun(null);setPhase('');setResult({status:'cancelled',stdout:'',error:'Ejecución detenida.',truncated:false});}
 return <LocalizedContent><section className="mixed-editor"><h3>{language==='python'?'Python':'SQL · SQLite'}</h3><p>Datos ficticios y ejecución aislada sin red. La salida no acredita una competencia.</p><label>Tu código<textarea name="code" rows={14} value={code} maxLength={7000} required readOnly={!!run} spellCheck={false} onChange={e=>{setCode(e.target.value);setResult(null);}}/></label>
 <input type="hidden" name="runtime_output" value={result?.stdout??''}/><input type="hidden" name="runtime_status" value={result?.status??''}/>
 <div className="mixed-actions"><button className="btn" type="button" disabled={!!run||!code.trim()} onClick={()=>{if(window.location.origin!==appOrigin)return;setResult(null);setPhase('Cargando el motor de práctica…');setRun({id:crypto.randomUUID(),channel:crypto.randomUUID(),language,code});}}>Ejecutar código</button><button className="btn secondary" type="button" disabled={!run} onClick={stop}>Detener ejecución</button></div>
 <p role="status" aria-live="polite">{phase||(result?(result.status==='complete'?'Práctica ejecutada.':result.error):'El motor se carga cuando ejecutas el código.')}</p><pre aria-label="Salida del código" tabIndex={0}>{result?.stdout||'Sin salida.'}</pre>
 {run&&<iframe ref={frame} key={run.channel} hidden tabIndex={-1} aria-hidden="true" title="Motor aislado de práctica" sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer" src={runtimeOrigin+'/frame#channel='+run.channel}/>}
 </section></LocalizedContent>;
}
