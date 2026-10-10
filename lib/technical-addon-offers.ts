/** Approved prices; published as expressions of interest only. Not a billing entitlement or Stripe checkout switch. */
export const TECHNICAL_ADDON_OFFERS = [
 {key:"technical_essential",label:"Programación esencial",priceCents:14900,unit:"persona" as const,minimumSeats:1,
  detail:"Ruta técnica inicial. Alcance exacto de niveles y ejercicios pendiente de validación antes de vender."},
 {key:"technical_complete",label:"Programación + Integraciones",priceCents:24900,unit:"persona" as const,minimumSeats:1,
  detail:"Ruta técnica completa de quince niveles, prácticas, proyectos e integraciones sujetos a cuota."},
 {key:"technical_teams",label:"Programación para equipos",priceCents:12900,unit:"asiento" as const,minimumSeats:5,
  detail:"Complemento por persona para organizaciones, mínimo cinco asientos; adicional al plan base."},
] as const;
export type TechnicalOfferKey=typeof TECHNICAL_ADDON_OFFERS[number]["key"];
export const TECHNICAL_CHECKOUT_ENABLED=false as const; // Fail closed until all test-mode billing / webhook / entitlement checks pass.
export function technicalOffer(key:string){return TECHNICAL_ADDON_OFFERS.find(offer=>offer.key===key)??null;}
export function technicalQuote(key:string,seats:number=1){
 const offer=technicalOffer(key);
 if(!offer||!Number.isSafeInteger(seats)||seats<offer.minimumSeats||seats>10000)throw Error("TECHNICAL_OFFER_INVALID");
 if(offer.unit==="persona"&&seats!==1)throw Error("TECHNICAL_SINGLE_USER_ONLY");
 return {key:offer.key,unitAmountCents:offer.priceCents,quantity:seats,totalCents:offer.priceCents*seats,currency:"mxn" as const,interval:"month" as const};
}
/** Future access policy: never revoke grandfathered entitlements by enabling the add-on catalog alone. */
export function technicalLegacyAccess(plan:string,role:string|null|undefined){
 return role==="owner"||role==="admin"||plan==="starter"||plan==="pro"||plan==="enterprise";
}
