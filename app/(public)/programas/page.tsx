import Link from "next/link";
import published from "../../../lib/position-curricula/published.json";
import {POSITION_PROGRAMS,positionProgramTotals} from "../../../lib/position-curriculum";
import LocalizedContent from "../../components/localization/server";
import {translatedMetadata} from "../../../lib/localization/metadata";
import {publicMetadata} from "../../../lib/public-metadata";
export async function generateMetadata(){return translatedMetadata(publicMetadata("Programas por puesto","Explora los programas profesionales de Garciloga y sus temarios.","/programas"));}
export default function ProgramsIndex(){return <LocalizedContent><main className="wrap program-catalog">
<header className="program-catalog-header"><span className="pill">Formación por puesto</span><h1>Aprende las decisiones que exige tu trabajo</h1><p>Consulta el temario de cada programa antes de registrarte. Practica situaciones, competencias y proyectos ligados a tu puesto.</p></header>
<section className="program-catalog-grid" aria-label="Programas profesionales">{published.map(x=>{const p=POSITION_PROGRAMS[x.key],n=positionProgramTotals(p);return <article className="card" key={x.key}><span className="pill">Programa disponible</span><h2>{x.title}</h2><p>{n.levels} niveles · {n.lessons} lecciones · {n.projects} proyectos</p><Link className="btn secondary" href={"/programas/"+x.key}>Ver el temario</Link></article>})}</section>
<section className="card program-catalog-cta"><h2>Programación es opcional</h2><p>Formarte para tu puesto no requiere comprar el complemento de Programación e Integraciones.</p><Link className="btn" href="/login?modo=registro">Empezar gratis</Link></section>
</main></LocalizedContent>}
