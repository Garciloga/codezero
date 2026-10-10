import type {CompetencyEvidence} from "./competency-matrix";
/** Only reviewed, sufficiently scored personal projects are safe for opt-in publication.
 * Organization evidence remains private to that organization. */
export function eligiblePersonalProject(e:CompetencyEvidence & {reviewed_by?:string|null},userId:string){
 return e.user_id===userId&&e.organization_id===null&&
 ["admin","manager"].includes(e.review_source)&&typeof e.reviewed_by==="string"&&e.reviewed_by!==userId&&
 ["project","capstone"].includes(e.kind)&&
 Array.isArray(e.critical_errors)&&e.critical_errors.length===0&&
 e.competency_scores!=null&&
 Object.values(e.competency_scores).length>0&&
 Object.values(e.competency_scores).every(score=>Number.isInteger(score)&&score>=3&&score<=4);
}
