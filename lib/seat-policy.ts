export const MINIMUM_TEAM_SEATS=5;
export function validSeatQuantity(value:unknown):value is number{return typeof value==='number'&&Number.isSafeInteger(value)&&value>=MINIMUM_TEAM_SEATS&&value<=100000;}
export function validSeatPrice(price:{currency:string;unit_amount:number|null;billing_scheme:string;transform_quantity?:unknown;recurring?:{interval:string;interval_count:number;usage_type?:string}|null},cents:number){
 return price.currency==='mxn'&&price.unit_amount===cents&&price.billing_scheme==='per_unit'&&!price.transform_quantity&&price.recurring?.interval==='month'&&price.recurring.interval_count===1&&price.recurring.usage_type==='licensed';
}
