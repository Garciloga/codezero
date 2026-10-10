export const DRAFT_COURSES=["grc_advanced","red_flags","cross_sell","upsell","retention","onboarding_30_60_90","ai_at_work","professional_languages","candidate_assessment","metrics_lab","employability","manager_toolkit"] as const;
export type DraftCourseKey=typeof DRAFT_COURSES[number];
export const ASSIGNABLE_COMPETENCIES=["communication","diagnosis","data","prioritization","documentation","deescalation","negotiation","planning","technical","collaboration"] as const;
export type AssignableCompetency=typeof ASSIGNABLE_COMPETENCIES[number];
export type Emphasis="base"|"focused"|"intensive";
export function draftCourseAssignmentsEnabled(env:Record<string,string|undefined>=process.env){
 if(env.CODEZERO_DRAFT_COURSE_ASSIGNMENTS!=="1"||env.CODEZERO_ENVIRONMENT!=="sandbox"||env.VERCEL_ENV==="production"||env.CODEZERO_WORKSPACE_SANDBOX!=="1")return false;
 try{const u=new URL(env.NEXT_PUBLIC_SUPABASE_URL??"");return ["localhost","127.0.0.1"].includes(u.hostname)&&env.CODEZERO_SANDBOX_PROJECT_REF==="local"||/^[a-z]{20}[.]supabase[.]co$/.test(u.hostname)&&!u.hostname.startsWith("kwfzhpapvpdatdfwhouf.");}catch{return false;}
}
export function validDraftAssignment(input:{course:string;competency:string;emphasis:string;dueAt:string;teamId?:string|null}){
 if(!DRAFT_COURSES.includes(input.course as DraftCourseKey)||!ASSIGNABLE_COMPETENCIES.includes(input.competency as AssignableCompetency)||!["base","focused","intensive"].includes(input.emphasis))return false;
 const date=Date.parse(input.dueAt+"T12:00:00Z");return /^\d{4}-\d{2}-\d{2}$/.test(input.dueAt)&&Number.isFinite(date)&&date>Date.now()&&date<Date.now()+366*86400000;
}
export const DRAFT_ASSIGNMENT_NOTICE="Solo planificación de borrador en entorno aislado. No desbloquea cursos, no evalúa empleados ni altera progreso.";
