export type ScheduleItem={price:string;quantity:number};
/** Same-subscription policy. All other prices and quantities are copied verbatim. */
export function tutorAdditionPhases(input:{items:ScheduleItem[];start:number;end:number;first:string;renewal:string;tutorPrices:ReadonlySet<string>}){
 if(!Number.isSafeInteger(input.start)||!Number.isSafeInteger(input.end)||input.end<=input.start||!input.items.length||input.items.some(x=>!x.price.startsWith('price_')||!Number.isSafeInteger(x.quantity)||x.quantity<1)||!input.first.startsWith('price_')||!input.renewal.startsWith('price_')||input.first===input.renewal||input.items.some(x=>input.tutorPrices.has(x.price)))throw Error('INVALID_SUBSCRIPTION');
 return[
  {start_date:input.start,end_date:input.end,items:input.items,proration_behavior:'none' as const},
  {duration:{interval:'month' as const,interval_count:1},items:[...input.items,{price:input.first,quantity:1}],proration_behavior:'none' as const},
  {items:[...input.items,{price:input.renewal,quantity:1}],proration_behavior:'none' as const},
 ];
}
export function tutorCancellationPhases(input:{items:ScheduleItem[];start:number;end:number;tutorPrices:ReadonlySet<string>}){
 const remaining=input.items.filter(x=>!input.tutorPrices.has(x.price));if(!remaining.length||remaining.length===input.items.length)throw Error('TUTOR_ITEM_NOT_FOUND');
 return[{start_date:input.start,end_date:input.end,items:input.items,proration_behavior:'none' as const},{items:remaining,proration_behavior:'none' as const}];
}
