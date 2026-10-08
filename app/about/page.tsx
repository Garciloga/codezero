import PublicHeader from '../components/public-header';
import LocalizedContent from '../components/localization/server';
import {getServerUser} from '../../lib/supabase-server';
import {translatedMetadata} from '../../lib/localization/metadata';
import {publicMetadata} from '../../lib/public-metadata';
export async function generateMetadata(){return translatedMetadata(publicMetadata('Sobre Garciloga','Nuestra misión, visión, valores e historia.','/about'));}
const values=[
 ['Tú decides','Recomendamos, no imponemos; ninguna sugerencia bloquea tu camino.'],
 ['Transparencia','Explicamos el porqué de cada recomendación y no prometemos lo que aún no existe.'],
 ['Evidencia, no pseudociencia','Nos basamos en lo que haces, no en etiquetas ni tests de personalidad.'],
 ['Empleabilidad real','Cada ruta termina en proyectos y evidencia que sirven para conseguir o crecer en un puesto.'],
 ['Privacidad y consentimiento','Tus datos son tuyos y usamos solo los necesarios.'],
 ['Crecimiento sin techo','Nadie queda limitado a una sola posición.'],
];
export default async function About(){
 const {data:{user}}=await getServerUser();
 return <div className="public-site"><PublicHeader authenticated={Boolean(user)}/><LocalizedContent><main className="wrap">
 <section className="public-section"><p className="public-eyebrow">Nuestra identidad</p><h1>Sobre Garciloga</h1></section>
 <div className="grid grid2"><section className="card"><h2>Misión</h2><p>Ayudar a cada persona a desarrollar habilidades reales para el trabajo, desde cero hasta supervisión, gerencia y dirección, combinando programación, cursos, procesos y toma de decisiones, con práctica y evidencia de lo aprendido.</p></section>
 <section className="card"><h2>Visión</h2><p>Ser la plataforma de referencia en Latinoamérica donde personas y equipos descubren y construyen más de una ruta profesional, sin encasillarse, y donde los líderes ven con claridad las fortalezas y áreas de mejora de su gente.</p></section></div>
 <section className="public-section"><h2>Valores</h2><div className="grid grid2">{values.map(([title,body])=><article className="card" key={title}><h3>{title}</h3><p>{body}</p></article>)}</div></section>
 <section className="public-section card brand-story"><h2>Nuestra historia</h2>
 <p>Garciloga nació en octubre de 2026 en Ciudad de México, fundada por Isaac López García, después de años trabajando en Customer Success, Onboarding y Account Management en empresas de tecnología y SaaS.</p>
 <p>Empezó con el nombre CodeZero, como una plataforma para aprender a programar desde cero: 15 niveles, 92 lecciones, ejercicios, exámenes y proyectos Capstone. Muy pronto quedó claro que programar era solo una parte: la gente también necesita aprender procesos, tomar decisiones y prepararse para puestos como Customer Success, Soporte, Onboarding, Account Management, Project Management y liderazgo.</p>
 <p>El 7 de octubre de 2026 la plataforma tomó su nombre definitivo, Garciloga, y amplió su rumbo. Hoy está disponible en español, inglés, portugués y francés, con un espacio para empresas donde cada líder da seguimiento al avance de su equipo.</p></section>
 <section className="public-section card brand-story"><h2>Lo que queremos lograr</h2><ul><li>Que cualquier persona pueda empezar desde cero y llegar hasta dirigir equipos.</li><li>Orientar a cada usuario hacia las rutas que mejor van con su forma de trabajar.</li><li>Dar a las empresas una forma clara de formar y reforzar a sus equipos.</li><li>Sumar cursos completos de liderazgo, mentorías, comunidad y práctica ejecutable.</li></ul></section>
 </main></LocalizedContent></div>;
}

