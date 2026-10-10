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
