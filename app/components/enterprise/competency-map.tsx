'use client';
import {useEffect,useRef,useState} from 'react';
import {ROLE_WORKFLOWS} from '../../../lib/career-role-workflows';
import Link from 'next/link';
import {COMPETENCIES,type CompetencyKey,type competencyProfile} from '../../../lib/competency-matrix';
import LocalizedContent from '../localization/client';
import {useLanguage} from '../localization/provider';
type Row={user_id:string;display_name:string;job_title?:string|null;position?:string|null;teams:{id:string;name:string}[];summary:ReturnType<typeof competencyProfile>};
export default function CompetencyMap({org,rows,units,readOnly=false}:{org:string;rows:Row[];units:{key:string;title:string;competencies:CompetencyKey[]}[];readOnly?:boolean}){
 const {t}=useLanguage();
 const [position,setPosition]=useState(''),[team,setTeam]=useState(''),[selected,setSelected]=useState<{id:string;key:CompetencyKey}|null>(null);
 const panel=useRef<HTMLElement>(null),lastTrigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(selected)panel.current?.focus({preventScroll:true});},[selected]);
 const close=()=>{setSelected(null);lastTrigger.current?.focus();};
 const filtered=rows.filter(r=>(!position||r.position===position)&&(!team||r.teams.some(t=>t.id===team)));
 const teams=[...new Map(rows.flatMap(r=>r.teams).map(t=>[t.id,t])).values()];
 const scores=Object.keys(COMPETENCIES).flatMap(k=>{const cs=filtered.flatMap(r=>r.summary.competencies.filter(c=>c.key===k&&c.count>=3));return cs.length?[{key:k as CompetencyKey,average:cs.reduce((s,c)=>s+c.level,0)/cs.length}]:[];}).sort((a,b)=>a.average-b.average);
 const person=rows.find(r=>r.user_id===selected?.id),cell=person?.summary.competencies.find(c=>c.key===selected?.key),unit=units.find(u=>u.competencies.includes(selected?.key as CompetencyKey));
 const renderCell=(r:Row,c:Row['summary']['competencies'][number])=><button type="button" className={'competency-cell level-'+c.level} onClick={e=>{lastTrigger.current=e.currentTarget;setSelected({id:r.user_id,key:c.key});}} aria-label={`${r.display_name} · ${t(c.name)} · ${c.count<3?t('Sin evidencia suficiente'):c.level+'/4'}`}>{c.count<3?'Sin evidencia suficiente':<>{c.level}/4 · {c.label}</>}</button>;
 return <LocalizedContent><section><div className="grid grid3"><p>Competencia a reforzar<br/>{scores[0]?COMPETENCIES[scores[0].key]:'Sin evidencia suficiente'}</p><p>Competencia más fuerte<br/>{scores.at(-1)?COMPETENCIES[scores.at(-1)!.key]:'Sin evidencia suficiente'}</p><p>Sin evidencia reciente<br/>{filtered.filter(r=>!r.summary.competencies.some(c=>c.evidence.some(e=>!e.critical_errors.length&&Date.now()-Date.parse(e.observed_at)<=90*86400000))).length}</p></div>
 <div className="grid grid2"><label>Filtrar por puesto<select value={position} onChange={e=>setPosition(e.target.value)}><option value="">Todos los puestos</option>{[...new Set(rows.map(r=>r.position).filter(Boolean))].map(p=><option key={p} value={p!}>{ROLE_WORKFLOWS[p as keyof typeof ROLE_WORKFLOWS]?.title??rows.find(r=>r.position===p)?.job_title??p}</option>)}</select></label><label>Filtrar por equipo<select value={team} onChange={e=>setTeam(e.target.value)}><option value="">Todos los equipos</option>{teams.map(t=><option key={t.id} value={t.id} translate="no">{t.name}</option>)}</select></label></div>
 <div className="vivo-table-scroll competency-desktop"><table><caption>Comparación con el perfil de aprendizaje del puesto</caption><thead><tr><th scope="col">Persona</th>{Object.values(COMPETENCIES).map(n=><th scope="col" key={n}>{n}</th>)}</tr></thead><tbody>{filtered.map(r=><tr key={r.user_id}><th scope="row"><span translate="no">{r.display_name}</span></th>{r.summary.competencies.map(c=><td key={c.key}>{renderCell(r,c)}</td>)}</tr>)}</tbody></table></div>
 <div className="competency-mobile">{filtered.map(r=><article className="card" key={r.user_id}><h3 translate="no">{r.display_name}</h3>{[...r.summary.competencies].sort((a,b)=>a.level-b.level).map(c=><p key={c.key}>{c.name} {renderCell(r,c)}</p>)}</article>)}</div>
 {!filtered.length&&<p>Sin personas para estos filtros</p>}
 {person&&cell&&<section className="card competency-drawer" ref={panel} tabIndex={-1} role="region" aria-label="Evidencia de competencia"><button className="btn secondary" onClick={close}>Cerrar detalle</button><h3><span translate="no">{person.display_name}</span> · {cell.name}</h3><p>{cell.count<3?'Sin evidencia suficiente':cell.label}</p><ul>{cell.evidence.map(e=><li key={e.id}><time dateTime={e.observed_at}>{e.observed_at.slice(0,10)}</time> · <span translate="no">{e.activity_key}</span> · {e.competency_scores[cell.key]}/4 · {e.critical_errors.length?'Requiere cambios':e.review_source==='manager'||e.review_source==='admin'?'Revisión humana':'Práctica formativa'}</li>)}</ul>
 {!readOnly&&unit&&<form action="/api/role-training" method="post"><input type="hidden" name="action" value="reinforce"/><input type="hidden" name="organization_id" value={org}/><input type="hidden" name="user_id" value={person.user_id}/><input type="hidden" name="units" value={unit.key}/><p>{unit.title}</p><label>Fecha límite<input type="date" name="due_at" required/></label><button className="btn">Asignar refuerzo sugerido</button></form>}
 {!readOnly&&<Link prefetch={false} href={`/teams/${org}/person/${person.user_id}`}>Ficha de aprendizaje</Link>}</section>}
 </section></LocalizedContent>;
}
