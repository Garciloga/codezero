import {workspaceSandboxEnabled} from "./workspace-sandbox";
export const DRAFT_COURSES=["grc_advanced","red_flags","cross_sell","upsell","retention","onboarding_30_60_90","ai_at_work","professional_languages","candidate_assessment","metrics_lab","employability","manager_toolkit"] as const;
export type DraftCourseKey=typeof DRAFT_COURSES[number];
export const ASSIGNABLE_COMPETENCIES=["communication","diagnosis","data","prioritization","documentation","deescalation","negotiation","planning","technical","collaboration"] as const;
export type AssignableCompetency=typeof ASSIGNABLE_COMPETENCIES[number];
export type Emphasis="base"|"focused"|"intensive";
export function draftCourseAssignmentsEnabled(env:Record<string,string|undefined>=process.env){
 return env.CODEZERO_DRAFT_COURSE_ASSIGNMENTS==="1" && workspaceSandboxEnabled(env);
}
export function validDraftAssignment(input:{course:string;competency:string;emphasis:string;dueAt:string;teamId?:string|null}){
 if(!DRAFT_COURSES.includes(input.course as DraftCourseKey)||!ASSIGNABLE_COMPETENCIES.includes(input.competency as AssignableCompetency)||!["base","focused","intensive"].includes(input.emphasis))return false;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.dueAt))return false;
 const [year,month,day]=input.dueAt.split("-").map(Number);
 const date=new Date(input.dueAt+"T12:00:00.000Z"),timestamp=date.getTime();
 // Reject normalized impossible dates such as 2027-02-29 or 2027-04-31.
 return Number.isFinite(timestamp)&&date.getUTCFullYear()===year&&date.getUTCMonth()+1===month&&date.getUTCDate()===day
  &&timestamp>Date.now()&&timestamp<Date.now()+366*86400000;
}
export const DRAFT_ASSIGNMENT_NOTICE="Solo planificación de borrador en entorno aislado. No desbloquea cursos, no evalúa empleados ni altera progreso.";
