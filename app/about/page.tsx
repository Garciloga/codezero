import Link from 'next/link';
import PublicHeader from '../components/public-header';
import LocalizedContent from '../components/localization/server';
import {getServerUser} from '../../lib/supabase-server';
import {translatedMetadata} from '../../lib/localization/metadata';
import {publicMetadata} from '../../lib/public-metadata';
export async function generateMetadata(){return translatedMetadata(publicMetadata('Sobre Garciloga','Misión, visión, historia, valores y objetivos de Garciloga: formación práctica para el trabajo real.','/about'));}
// Approved institutional copy (Notion · Identidad, 9 Oct 2026). No dates, figures or claims beyond the record.
const values=[
 ['Libertad para elegir el propio camino','Cada persona puede construir más de un camino profesional; una recomendación nunca impone límites.'],
 ['Transparencia y confianza','Explicamos el motivo de cada recomendación y no exageramos capacidades ni resultados.'],
 ['Crecimiento profesional sin límites','Acompañamos el aprendizaje desde el nivel inicial hasta el liderazgo.'],
 ['Aprendizaje práctico y verificable','Escenarios, proyectos y decisiones reales. Un clic no es una competencia.'],
 ['Empatía y acompañamiento','Enseñamos con claridad y con retroalimentación constructiva.'],
 ['Innovación y mejora continua','Mejoramos la experiencia con evidencia, sin perseguir novedades por sí mismas.'],
 ['Inclusión y oportunidades','Diseño accesible para distintas edades y niveles de experiencia.'],
 ['Privacidad y respeto','Usamos solo los datos necesarios y respetamos los permisos de cada persona y cada compañía.'],
 ['Orientación hacia el trabajo real','Lo que se aprende aquí debe servir en un puesto, no solo en un examen.'],
];
const goals=[
 ['Preparar para el mundo laboral','Ofrecer formación alineada con las responsabilidades, procesos y decisiones que se enfrentan en diferentes puestos.'],
 ['Convertir el aprendizaje en experiencia','Desarrollar actividades prácticas, simulaciones y proyectos que permitan aplicar los conocimientos adquiridos.'],
 ['Impulsar el crecimiento profesional','Facilitar rutas de aprendizaje desde niveles iniciales hasta responsabilidades de supervisión, gerencia y dirección.'],
 ['Fortalecer a los equipos','Ayudar a las organizaciones a identificar competencias, necesidades de capacitación y oportunidades de desarrollo de sus colaboradores.'],
 ['Personalizar el aprendizaje','Ofrecer recomendaciones basadas en habilidades, intereses profesionales, evidencia y objetivos individuales, sin limitar las decisiones de cada persona.'],
 ['Promover el aprendizaje continuo','Mantener una experiencia educativa que evolucione con nuevas herramientas, competencias y necesidades del entorno profesional.'],
 ['Acercar la tecnología a todos','Integrar programación, datos, automatización, inteligencia artificial e integraciones como habilidades complementarias aplicables al trabajo.'],
];
export default async function About(){
 const {data:{user}}=await getServerUser();
 return <div className="public-site"><PublicHeader authenticated={Boolean(user)}/><LocalizedContent><main className="wrap about">
 <section className="about-intro"><p className="public-eyebrow">Sobre Garciloga</p><h1>Aprende para el trabajo real. Crece hacia lo que sigue.</h1>
 <p className="about-lead">Garciloga es una plataforma de formación profesional por puesto: procesos, casos, herramientas y decisiones, desde los primeros pasos hasta supervisión, gerencia y dirección.</p></section>
 <section className="about-mission" aria-labelledby="about-mission"><h2 id="about-mission" className="public-eyebrow">Nuestra misión</h2>
 <p className="about-statement">Impulsar el crecimiento profesional de las personas mediante una formación práctica, accesible y enfocada en el mundo laboral real.</p>
 <div className="about-columns"><p>En Garciloga ayudamos a desarrollar conocimientos, habilidades y competencias para desempeñarse con confianza en distintos puestos de trabajo, desde los primeros pasos profesionales hasta posiciones de liderazgo y dirección.</p>
 <p>Combinamos aprendizaje estructurado, situaciones reales, toma de decisiones, herramientas y proyectos aplicados para transformar el conocimiento en capacidades que puedan demostrarse.</p></div></section>
 <section className="public-dark about-vision" aria-labelledby="about-vision"><h2 id="about-vision" className="public-eyebrow">Nuestra visión</h2>
 <p className="about-statement">Construir una plataforma educativa donde cualquier persona pueda descubrir su potencial, desarrollar nuevas habilidades y avanzar profesionalmente sin límites impuestos por su experiencia inicial.</p>
 <div className="about-columns"><p>Aspiramos a transformar la manera en que las personas y las organizaciones desarrollan talento, conectando el aprendizaje con los desafíos reales del trabajo y ofreciendo rutas de crecimiento claras, flexibles y basadas en competencias.</p>
 <p>Queremos que aprender, mejorar y prepararse para nuevas responsabilidades sea una oportunidad continua.</p></div></section>
 <section className="public-section about-story" aria-labelledby="about-story"><h2 id="about-story">Nuestra historia</h2>
 <div className="brand-story">
 <p className="about-story-lead">Garciloga nació de una idea sencilla: aprender debería prepararnos para enfrentar situaciones reales, no únicamente para aprobar exámenes.</p>
 <h3>De dónde viene</h3>
 <p>El proyecto fue creado en Ciudad de México por Isaac López García, a partir de su experiencia profesional en empresas de tecnología, Customer Success, Onboarding, Account Management y atención a clientes.</p>
 <p>Inicialmente comenzó como CodeZero, una plataforma diseñada para enseñar programación desde cero.</p>
 <h3>Por qué cambió</h3>
 <p>Durante su evolución surgió una visión más amplia: las personas no solo necesitan aprender herramientas técnicas, sino también comprender procesos, resolver problemas, comunicarse, tomar decisiones y desarrollar las competencias necesarias para crecer profesionalmente.</p>
 <p>Así nació Garciloga como una propuesta de formación laboral integral.</p>
 <h3>Dónde está hoy</h3>
 <p>Hoy, el proyecto busca conectar el conocimiento con la práctica mediante rutas profesionales, ejercicios, escenarios de trabajo, proyectos y herramientas para que las personas y los equipos identifiquen sus fortalezas y oportunidades de mejora.</p>
 <p className="about-story-lead">Nuestra historia está comenzando y queremos construir una plataforma que evolucione junto con las personas que aprenden en ella.</p>
 </div></section>
 <section className="public-section" aria-labelledby="about-values"><h2 id="about-values">Valores</h2>
 <dl className="about-values">{values.map(([title,body])=><div key={title}><dt>{title}</dt><dd>{body}</dd></div>)}</dl></section>
 <section className="public-section" aria-labelledby="about-goals"><h2 id="about-goals">Nuestros objetivos</h2>
 <div className="about-goals">{goals.map(([title,body])=><article className="card" key={title}><h3>{title}</h3><p>{body}</p></article>)}</div></section>
 <section className="public-close"><h2>Explora la formación por puesto y elige por dónde empezar.</h2><Link className="btn accent" href="/positions">Ver la formación por puesto</Link></section>
 </main></LocalizedContent></div>;
}
