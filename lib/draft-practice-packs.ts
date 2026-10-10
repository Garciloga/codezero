import "server-only";
import data0 from "../docs/curriculum-drafts/2026-10/practice-packs/grc-advanced.json" with {type:"json"};
import data1 from "../docs/curriculum-drafts/2026-10/practice-packs/red-flags.json" with {type:"json"};
import data2 from "../docs/curriculum-drafts/2026-10/practice-packs/cross-sell.json" with {type:"json"};
import data3 from "../docs/curriculum-drafts/2026-10/practice-packs/upsell.json" with {type:"json"};
import data4 from "../docs/curriculum-drafts/2026-10/practice-packs/retention.json" with {type:"json"};
import data5 from "../docs/curriculum-drafts/2026-10/practice-packs/onboarding-30-60-90.json" with {type:"json"};
import data6 from "../docs/curriculum-drafts/2026-10/practice-packs/ai-at-work.json" with {type:"json"};
import data7 from "../docs/curriculum-drafts/2026-10/practice-packs/professional-languages.json" with {type:"json"};
import data8 from "../docs/curriculum-drafts/2026-10/practice-packs/candidate-assessment.json" with {type:"json"};
import data9 from "../docs/curriculum-drafts/2026-10/practice-packs/metrics-lab.json" with {type:"json"};
import data10 from "../docs/curriculum-drafts/2026-10/practice-packs/employability.json" with {type:"json"};
import data11 from "../docs/curriculum-drafts/2026-10/practice-packs/manager-toolkit.json" with {type:"json"};
/** This registry is only for server-rendered, owner-protected editorial screens.
 * It includes private grading notes and MUST NOT be imported into client components.
 */
export type DraftPracticePack={
 key:string;title:string;status:string;unitsCount:number;practicesCount:number;
 levels:Array<{number:number;title:string;difficulty:string;caseFacts:string;caseConflict:string;
 units:Array<{id:string;title:string;objective:string;reading:{principle:string;workedCase:string;quantitativeReasoning:string;procedure:string;misconception:string;prerequisites:string[]};
 practices:Array<{id:string;title:string;type:string;demand?:string;task?:string;required:string[];minWords:number;requiresHumanReview:true;allowCompletionByAcknowledgement:false}>;
 instructor:{referenceResult?:number;expectedValue?:number;referenceUnit?:string;unit?:string;commonFailure:string;rubric?:Array<{name:string;weight:number}>;rubricDimensions?:Array<{name:string;weight:number}>;criticalErrors:string[]};
 publication:{enabled:false}
 }>}>;
};
const items={grc_advanced:data0,
 red_flags:data1,
 cross_sell:data2,
 upsell:data3,
 retention:data4,
 onboarding_30_60_90:data5,
 ai_at_work:data6,
 professional_languages:data7,
 candidate_assessment:data8,
 metrics_lab:data9,
 employability:data10,
 manager_toolkit:data11} as unknown as Record<string,DraftPracticePack>;
export const DRAFT_PRACTICE_NAMES=Object.entries(items).map(([id,p])=>({id,title:p.title,levels:p.levels.length,units:p.unitsCount,practices:p.practicesCount}));
export function ownerDraftPractice(id:string|undefined):DraftPracticePack|null{
 return id&&Object.prototype.hasOwnProperty.call(items,id)?items[id]:null;
}
