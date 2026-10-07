export function classifySubscription(items:{price:{id:string}}[],base:Record<string,string|undefined>,tutor:ReadonlySet<string>){
 const plans=new Set(items.map(item=>base[item.price.id]).filter(Boolean));
 const tutorItem=items.find(item=>tutor.has(item.price.id));
 return{basePlan:plans.size===1?[...plans][0]:null,ambiguousBase:plans.size>1,legacyTutor:plans.size===0&&!!tutorItem,tutorItem};
}
