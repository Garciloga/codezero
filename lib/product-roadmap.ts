import { ADDON_OFFERS } from './modular-offers.ts';

/** Commercial references only; never used by Stripe or quota authorization. */
export const COMMERCIAL_REFERENCES = { mentoringMxn: 699, mentoringMinutes: 45, teamSeatMxn: 249, minimumSeats: 5 } as const;
export const PRODUCT_ROADMAP = [
  { key: 'grc_courses', label: 'GRC · Gobierno, Riesgo y Cumplimiento', audience: 'Profesionales y equipos', detail: 'Cursos previstos: fundamentos de gobierno corporativo, gestión de riesgos, controles internos, cumplimiento, auditoría y evidencias. Casos prácticos de matrices de riesgo, políticas y seguimiento de controles.', gate: 'Contenido en preparación. Cursos y prácticas todavía no disponibles; fecha de lanzamiento por confirmar.' },
  { key: 'enterprise_communicator', label: 'Comunicador Enterprise', audience: 'Equipos Enterprise', detail: 'Mensajes, emojis e información entre compañeros. Actualizaciones de líderes con contexto para su equipo.', gate: 'Permisos por organización, moderación, conservación y pruebas de privacidad antes de abrirlo.' },
  { key: 'leadership_courses', label: 'Cursos de supervisión, gerencia y dirección', audience: 'De colaborador a directivo', detail: 'Delegación, coaching, seguimiento de procesos, decisiones con datos y coordinación de equipos. La guía introductoria de liderazgo ya puede consultarse.', gate: 'Cursos completos, proyectos y evaluación humana antes de anunciar certificación.' },
  { key: 'career_guidance', label: 'Orientación profesional por habilidades', audience: 'Desarrollo profesional', detail: 'Explora afinidades, rutas y misiones por puesto. El laboratorio interno todavía no es una herramienta pública.', gate: 'Privacidad, consentimiento y validación de resultados antes de abrir una beta.' },
  { key: 'learner_community', label: 'Comunidad de alumnos', audience: 'Todos los alumnos', detail: 'Un espacio para compartir avances, dudas y experiencias durante una beta cerrada.', gate: 'Moderación, reglas y grupos de prueba antes de abrir la comunidad.' },
  { key: 'executable_code', label: 'Práctica de código ejecutable', audience: 'Programación e integraciones', detail: 'Editor y ejecución aislada de Python y SQL, con proyectos de integración aplicados al trabajo.', gate: 'Seguridad, límites y pruebas del motor antes de habilitarlo.' },
  { key: 'annual_plans', label: 'Planes anuales y ofertas de lanzamiento', audience: 'Todos los alumnos', detail: 'Opciones comerciales futuras después de validar la beta y los procesos de facturación.', gate: 'Condiciones y precios por confirmar. Los planes mensuales actuales conservan sus límites.' },
  ...ADDON_OFFERS.filter(o => !['verified_certificate', 'route_customer_success'].includes(o.key)).map(o => ({ key: o.key, label: o.label, audience: o.key === 'mentoring' ? 'Puestos y procesos' : 'Desarrollo profesional', detail: o.detail ?? '', gate: o.key === 'mentoring' ? 'Sesiones impartidas por Isaac López García. Horarios y reservas sujetos a su disponibilidad.' : o.key === 'ai_tutor' ? 'Proveedor, presupuesto y pruebas antes de activar el tutor. Las compras siguen bloqueadas.' : 'Contenido, evaluación y validación antes de habilitar compras.' })),
] as const;

/** Match labels to executable, guarded routes; commercial add-ons stay blocked. */
export const RELEASED_PRACTICE_ROUTES: Record<string,string> = {
 route_operations:'operations', route_qa:'quality', route_data_bi:'data_bi',
 route_product:'product', route_management:'leadership',
 route_solutions_integrations:'solutions', route_enablement:'enablement',
};
export function pendingProductRoadmap({companyMessaging,codePractice,roleTraining,community=false}:{companyMessaging:boolean;codePractice:boolean;roleTraining:boolean;community?:boolean}){
 return PRODUCT_ROADMAP.filter(item=>!(community&&['learner_community','mentoring'].includes(item.key))&&!(companyMessaging&&item.key==='enterprise_communicator')&&!(codePractice&&item.key==='executable_code')&&!(roleTraining&&(item.key==='leadership_courses'||Object.hasOwn(RELEASED_PRACTICE_ROUTES,item.key))));
}



