export type NextStep={key:string;title:string;href:string;due:string|null;minutes:number|null;started?:boolean};
export function nextLearningStep(assignments:NextStep[],inProgress:NextStep[],route:NextStep|null){
 const dated=assignments.filter(a=>a.due&&Number.isFinite(Date.parse(a.due))).sort((a,b)=>Date.parse(a.due!)-Date.parse(b.due!)||a.key.localeCompare(b.key));
 return dated[0]??inProgress[0]??route??assignments[0]??null;
}
