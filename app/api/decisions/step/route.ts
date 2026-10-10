import {trustedWorkspaceMutation} from "../../../../lib/workspace-sandbox";
import {advancedLearner,decodeAdvancedInputs} from "../../../../lib/advanced-assessment-server";
import {ADVANCED_STAGES,replayAdvancedPartial,sceneFor,advancedSummary,recommendAdvanced} from "../../../../lib/advanced-assessment";
import {consumeRateLimit} from "../../../../lib/rate-limit";
export async function POST(req:Request){
 if(!trustedWorkspaceMutation(req))return Response.json({error:"ORIGIN_FORBIDDEN"},{status:403});
 const text=await req.text().catch(()=>"");
 if(text.length>70000)return Response.json({error:"INPUT_TOO_LARGE"},{status:413});
 let raw:unknown;try{raw=JSON.parse(text);}catch{return Response.json({error:"INVALID_JSON"},{status:400});}
 const validated=decodeAdvancedInputs(raw,true);if(!validated)return Response.json({error:"INVALID_INPUT"},{status:400});
 const session=await advancedLearner(validated.org);if(!session)return Response.json({error:"FORBIDDEN"},{status:403});
 const rate=await consumeRateLimit("decision-step:"+session.user.id,80,600);
 if(!rate.allowed)return Response.json({error:"RATE_LIMITED"},{status:429});
 try{
  const state=replayAdvancedPartial(validated.inputs);
  const complete=state.step===ADVANCED_STAGES.length;
  return Response.json({step:state.step,scene:sceneFor(state),metrics:state.metrics,complete,
    ...(complete?{summary:advancedSummary(state),recommendations:recommendAdvanced(state)}:{})},{
     headers:{"Cache-Control":"no-store"}
    });
 }catch{return Response.json({error:"INVALID_SEQUENCE"},{status:400});}
}
