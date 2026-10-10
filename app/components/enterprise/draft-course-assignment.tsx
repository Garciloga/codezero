import {DRAFT_COURSES,ASSIGNABLE_COMPETENCIES,DRAFT_ASSIGNMENT_NOTICE} from "../../../lib/draft-course-assignment-policy";
import {COMPETENCIES} from "../../../lib/competency-matrix";
const labels:Record<string,string>={
 grc_advanced:"GRC avanzado",red_flags:"Detector de red flags",cross_sell:"Cross-sell",upsell:"Upsell",retention:"Retención",
 onboarding_30_60_90:"Onboarding corporativo 30-60-90",ai_at_work:"IA aplicada al puesto",professional_languages:"Idioma profesional",
 candidate_assessment:"Evaluación de candidatos",metrics_lab:"Laboratorio de métricas",employability:"Empleabilidad",manager_toolkit:"Kit del manager"
};
export default function DraftCourseAssignment({org,target,teams}:{org:string;target:string|null;teams:{id:string;name:string}[]}){
 return <section className="card draft-course-assignment" aria-label="Planificador de rutas por competencias">
 <span className="pill">Borrador · No activo</span><h2>Asignar cursos según las competencias</h2>
 <p>{DRAFT_ASSIGNMENT_NOTICE}</p>
 <form action="/api/teams/course-assign" method="post">
 <input type="hidden" name="organization_id" value={org}/>{target&&<input type="hidden" name="user_id" value={target}/>}
 <div className="draft-course-fields">
 <label>Curso completo<select name="course_key" required defaultValue="">{<option value="" disabled>Selecciona una ruta</option>}{DRAFT_COURSES.map(k=><option key={k} value={k}>{labels[k]}</option>)}</select></label>
 <label>Competencia prioritaria<select name="competency" required defaultValue=""><option value="" disabled>Elige competencia</option>{ASSIGNABLE_COMPETENCIES.map(k=><option key={k} value={k}>{COMPETENCIES[k]}</option>)}</select></label>
 <label>Intensidad de refuerzo<select name="emphasis" defaultValue="focused" required><option value="base">Base · practicar</option><option value="focused">Enfoque · reforzar</option><option value="intensive">Intensivo · práctica y revisión</option></select></label>
 <label>Fecha objetivo<input name="due_at" type="date" required/></label>
 <label>Equipo interno<select name="team_id" required={!target} defaultValue=""><option value="">Sin equipo / asignación individual</option>{teams.map(t=><option key={t.id} value={t.id} translate="no">{t.name}</option>)}</select></label>
 </div>
 <p>La asignación a equipos solo alcanza integrantes activos del equipo autorizado. La prioridad cambia el plan de práctica, no inventa competencias ni elimina formación básica.</p>
 <button className="btn" type="submit">Guardar plan de prueba</button>
 <p role="note">Este planificador solo funciona en sandbox tras habilitación expresa y migración verificada. No certifica, no envía notificaciones y no desbloquea cursos pendientes.</p>
 </form></section>;
}
