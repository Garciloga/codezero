export const REVIEW_ROLES={owner:'Dueño',admin:'Administrador',manager:'Manager',supervisor:'Supervisor',learner:'Colaborador'} as const;
export type ReviewSelector={all:boolean;roles:string[];positions:string[];users:string[]};
export type ReviewStage={name:string;required:number;reviewers:ReviewSelector};
export type ReviewFlow={id:string;flow_key:string;version:number;name:string;enabled:boolean;priority:number;audience:ReviewSelector;stages:ReviewStage[];created_by:string};
export type ReviewPerson={user_id:string;display_name:string;role:string;learning_position_key:string|null};
export type ReviewRun={submission_id:string;organization_id:string;learner_id:string;authorizer_id:string;state:string;current_stage:number;snapshot:{name:string;required:number;reviewers:{id:string;name:string;role:string}[]}[];progress:Record<string,{approved:number;changes_requested:number}>};
export type ReviewVote={id:string;submission_id:string;stage_index:number;user_id:string;decision:string;feedback:string;observed_at:string};
export const emptyReviewSelector=():ReviewSelector=>({all:false,roles:[],positions:[],users:[]});
export function validReviewSelector(s:unknown):s is ReviewSelector{
 if(!s||typeof s!=='object')return false;const q=s as ReviewSelector;
 return Object.keys(q).sort().join(',')==='all,positions,roles,users'&&typeof q.all==='boolean'&&Array.isArray(q.roles)&&q.roles.length<=5&&q.roles.every(r=>Object.hasOwn(REVIEW_ROLES,r))&&Array.isArray(q.positions)&&q.positions.length<=16&&q.positions.every(p=>typeof p==='string'&&p.length<=80)&&Array.isArray(q.users)&&q.users.length<=100&&q.users.every(u=>typeof u==='string'&&/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(u))&&(q.all||q.roles.length+q.positions.length+q.users.length>0);
}
export function validReviewStages(s:unknown):s is ReviewStage[]{return Array.isArray(s)&&s.length>=1&&s.length<=8&&s.every(q=>q&&typeof q==='object'&&Object.keys(q).sort().join(',')==='name,required,reviewers'&&typeof q.name==='string'&&q.name.trim().length>=1&&q.name.length<=120&&Number.isInteger(q.required)&&q.required>=1&&q.required<=20&&validReviewSelector(q.reviewers));}
