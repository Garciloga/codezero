import LocalizedContent from '../localization/server';
import {WORK_TYPES,WORK_TYPE_NAMES,WORK_TYPE_ICONS,type WorkType} from '../../../lib/mixed-role-model';
export default function MixedLevels({levels}:{levels:{type:WorkType;level:number|null;supported?:boolean;people?:number;withEvidence?:number;belowTwo?:number}[]}){
 return <LocalizedContent><div className="mixed-levels">{WORK_TYPES.map(type=>{const row=levels.find(r=>r.type===type);return <section className={'card mixed-level '+type} key={type}><h2><span aria-hidden="true">{WORK_TYPE_ICONS[type]}</span> {WORK_TYPE_NAMES[type]}</h2><p><strong>{row?.level??'—'} / 4</strong></p><meter min={0} max={4} value={row?.level??0} aria-label={WORK_TYPE_NAMES[type]}/><p>{row?.supported===false?'Sin evidencia suficiente':row?.people!==undefined?<>{row.withEvidence} / {row.people} · {row.belowTwo} &lt; 2</>:null}</p></section>;})}</div></LocalizedContent>;
}
