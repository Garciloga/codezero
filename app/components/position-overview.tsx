import Link from 'next/link';
import {positionState} from '../../lib/position-server';
import {localeContext,serverTranslator} from '../../lib/localization/server';
import ui from '../../lib/position-curricula/ui.json';
import {COMPETENCIES} from '../../lib/competency-matrix';
export default async function PositionOverview({org=null}:{org?:string|null}){
 const state=await positionState(org);if(!state)return null;
 const {locale}=await localeContext(),t=await serverTranslator(),s=ui[locale],href='/positions'+(org?'?organization_id='+org:'');
 return <section className="card position-overview" aria-label={s.title}><span className="pill">Garciloga</span><h2>{s.title}</h2><p>{s.intro}</p><div className="public-actions"><Link className="btn" href={href}>{s.continue}</Link><Link className="btn secondary" href={href+(org?'&':'?')+'diagnostic=1'}>{s.diagnostic}</Link></div><h3>{s.map}</h3><div className="grid grid2">{state.person.summary.competencies.map(c=><div key={c.key}><b>{t(COMPETENCIES[c.key])}</b><p>{c.level}/4 · {c.count} {t('Evidencias')}</p><progress max={4} value={c.level} aria-label={t(COMPETENCIES[c.key])}/></div>)}</div><p className="muted">{s.notice}</p><Link href="/dashboard?view=learning#my-learning-path">{s.technical}</Link></section>;
}
