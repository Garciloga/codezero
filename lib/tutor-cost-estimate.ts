/** Reference rates checked 2026-10-07. Estimate only; never billing, FX lookup or budget enforcement. */
export const AI_COST_REFERENCE = { model:"gpt-6-luna", checkedOn:"2026-10-07", inputUsdPerMillion:0.10, outputUsdPerMillion:0.50, source:"https://developers.openai.com/api/docs/models/gpt-6-luna" } as const;
export function estimateAiMonthlyCost(input:{sessions:number;callsPerSession:number;inputTokensPerCall:number;outputTokensPerCall:number;mxnPerUsd:number}) {
 const counts=[input.sessions,input.callsPerSession,input.inputTokensPerCall,input.outputTokensPerCall];
 if(counts.some(value=>!Number.isSafeInteger(value)||value<0) || input.sessions>1000 || input.callsPerSession>100 || input.inputTokensPerCall>272000 || input.outputTokensPerCall>128000 || !Number.isFinite(input.mxnPerUsd)||input.mxnPerUsd<=0||input.mxnPerUsd>1000)throw new Error("INVALID_COST_ASSUMPTION");
 const calls=input.sessions*input.callsPerSession;
 const usd=calls*(input.inputTokensPerCall*AI_COST_REFERENCE.inputUsdPerMillion+input.outputTokensPerCall*AI_COST_REFERENCE.outputUsdPerMillion)/1_000_000;
 return {calls,usd,mxn:usd*input.mxnPerUsd};
}
