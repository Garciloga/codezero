export type CertificateFacts={accountId:string;route:string;allLessons:boolean;examPassed:boolean;projectApproved:boolean;owned:boolean;operational:boolean};
/** Candidate policy only; trusted facts must be re-read transactionally at issuance. */
export function certificateIssuanceDecision(facts:CertificateFacts){
 if(!facts||!facts.accountId||facts.route!=='route_customer_success')return {eligible:false,reason:'INVALID_ROUTE'} as const;
 for(const key of ['operational','owned','allLessons','examPassed','projectApproved'] as const)if(facts[key]!==true)return {eligible:false,reason:key} as const;
 return {eligible:true,reason:'READY_FOR_TRANSACTIONAL_ISSUANCE'} as const;
}
type StoredCertificate={publicId:string;displayName:string;routeTitle:string;issuedOn:string;status:'verified'|'revoked';accountId:string;email?:string;internalEvidence?:unknown};
/** Allowlist minimal public fields. An endpoint still needs opaque token lookup, rate limiting and consent. */
export function certificatePublicView(record:StoredCertificate){
 if(!/^[A-Za-z0-9_-]{32,100}$/.test(record.publicId)||!['verified','revoked'].includes(record.status)||!/^\d{4}-\d{2}-\d{2}$/.test(record.issuedOn))throw Error('INVALID_CERTIFICATE');
 const day=new Date(record.issuedOn+'T12:00:00Z');if(!Number.isFinite(day.getTime())||day.toISOString().slice(0,10)!==record.issuedOn)throw Error('INVALID_CERTIFICATE');
 if(!record.displayName.trim()||record.displayName.length>160||!record.routeTitle.trim()||record.routeTitle.length>160)throw Error('INVALID_CERTIFICATE');
 return {publicId:record.publicId,displayName:record.displayName,routeTitle:record.routeTitle,issuedOn:record.issuedOn,status:record.status};
}
