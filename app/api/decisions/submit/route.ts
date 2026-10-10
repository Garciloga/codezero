import {trustedWorkspaceMutation} from "../../../../lib/workspace-sandbox";
import {advancedLearner,decodeAdvancedInputs} from "../../../../lib/advanced-assessment-server";
import {ADVANCED_ACTIVITY_KEY,ADVANCED_STAGES,replayAdvanced,advancedSummary} from "../../../../lib/advanced-assessment";
import {consumeRateLimit} from "../../../../lib/rate-limit";
import {createAdminSupabase} from "../../../../lib/admin";
export async function POST(req:Request){
 if(!trustedWorkspaceMutation(req))return Response.json({error:"ORIGIN_FORBIDDEN"},{status:403});
 const rawText=await req.text().catch(()=>"");
 if(rawText.length>65000)return Response.json({error:"INPUT_TOO_LARGE"},{status:413});
 let raw:unknown;try{raw=JSON.parse(rawText);}catch{return Response.json({error:"INVALID_JSON"},{status:400});}
 const request=decodeAdvancedInputs(raw,false);
 if(!request?.request)return Response.json({error:"INVALID_INPUT"},{status:400});
 if(request.org&&(raw as Record<string,unknown>).share_with_team!==true)return Response.json({error:"CONSENT_REQUIRED"},{status:403});
 const session=await advancedLearner(request.org);
 if(!session)return Response.json({error:"FORBIDDEN"},{status:403});
 const rate=await consumeRateLimit("decision-save:"+session.user.id,5,600);
 if(!rate.allowed)return Response.json({error:"RATE_LIMITED"},{status:429});
 let state;
 try{state=replayAdvanced(request.inputs);}catch{return Response.json({error:"INVALID_DECISIONS"},{status:400});}
 if(state.events.length!==ADVANCED_STAGES.length)return Response.json({error:"NOT_FINISHED"},{status:400});
 const admin=createAdminSupabase();
 const {data:catalog,error:catalogError}=await admin.from("learning_activity_catalog")
   .select("id").eq("content_key",ADVANCED_ACTIVITY_KEY).eq("active",true).maybeSingle();
 if(catalogError||!catalog)return Response.json({error:"CATALOG_UNAVAILABLE"},{status:503});
 const summary=advancedSummary(state);
 // Prose is for an independent human to audit; no automated passing level
 // or inferred personality score is written to competency evidence.
 const draft=[
  "RÚBRICA: revisar hechos, alternativas, justificación y verificación de ocho decisiones.",
  "Versión: cs-decision-evidence-v2.0; resultado objetivo provisional: "+summary.objective+"/100",
  "Errores críticos detectados en opciones: "+summary.critical,
  ...state.events.map((e,i)=>[
   "DECISIÓN "+(i+1)+" / ESCENARIO "+e.scene+" / OPCIÓN "+e.choice,
   "Hechos e incertidumbre: "+e.facts,
   "Alternativa y costo: "+e.tradeoff,
   "Verificación propuesta: "+e.verification
  ].join("\n"))
 ].join("\n\n");
 if(draft.length>23000)return Response.json({error:"DELIVERABLE_TOO_LONG"},{status:413});
 const {data,error}=await admin.rpc("submit_training_practice",{
  p_actor:session.user.id,p_activity:catalog.id,p_request:request.request,p_org:request.org,
  p_draft:draft,p_scores:{diagnosis:0,data:0,planning:0},
  p_assistance:"guided",p_answers:state.events.map(e=>e.choice),
  p_auto_results:[],p_reevaluation:null
 });
 if(error)return Response.json({error:"SUBMISSION_BLOCKED"},{status:409});
 return Response.json({saved:true,submission_id:data,review_required:true,objective_score:summary.objective},{
  headers:{"Cache-Control":"no-store"}
 });
}
