import "server-only";
import grc from "../docs/curriculum-drafts/2026-10/grc-advanced.json" with {type:"json"};
import flags from "../docs/curriculum-drafts/2026-10/red-flags.json" with {type:"json"};
import cross from "../docs/curriculum-drafts/2026-10/cross-sell.json" with {type:"json"};
import upsell from "../docs/curriculum-drafts/2026-10/upsell.json" with {type:"json"};
import retention from "../docs/curriculum-drafts/2026-10/retention.json" with {type:"json"};
export const DRAFT_CURRICULA={grc_advanced:grc,red_flags:flags,cross_sell:cross,upsell,retention} as const;
export type DraftKey=keyof typeof DRAFT_CURRICULA;
export function draftCourse(value:string|undefined){
 return value&&Object.prototype.hasOwnProperty.call(DRAFT_CURRICULA,value)?DRAFT_CURRICULA[value as DraftKey]:DRAFT_CURRICULA.grc_advanced;
}

import adjacentCollection from "../docs/curriculum-drafts/2026-10/seven-adjacent-modules.json" with {type:"json"};
export const ADJACENT_DRAFTS=adjacentCollection.modules;
export type AdjacentDraft={
 key:string;title:string;kind:string;audience:string;guardrails:string[];
 stages:Array<{
 id:string;number:number;title:string;difficulty:string;
 case:{facts:string;conflict:string;metric:string};
 units:Array<{id:string;title:string;objective:string;teaching:string;deliverable:string;evidence:{minWords:number;fields:string[]}}>;
 decisions:Array<{prompt:string;options:string[];correctIndex:number;feedback:string}>;
 assessment:{minimumWords:number;passingPoints:number;maxPoints:number;tasks:Array<{title:string;points:number;prompt:string;minWords:number}>};
 project:null|{title:string;deliverable:string;humanReview:boolean;rubric:Array<{name:string;weight:number}>};
 }>;
};
export function adjacentDraft(key:string|undefined):AdjacentDraft|null{
 if(!key||!Object.prototype.hasOwnProperty.call(ADJACENT_DRAFTS,key))return null;
 return ADJACENT_DRAFTS[key as keyof typeof ADJACENT_DRAFTS] as unknown as AdjacentDraft;
}
