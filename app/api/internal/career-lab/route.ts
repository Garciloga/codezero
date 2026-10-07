import { NextResponse } from "next/server";
import { careerLabOwner } from "../../../../lib/career-lab-owner";
import { validateLabRequest, runCareerLab } from "../../../../lib/career-lab";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control":"private, no-store", "X-Robots-Tag":"noindex, nofollow" };
export async function POST(req:Request) {
 // This laboratory only calculates fixed synthetic inputs; it performs no writes.
 if(req.headers.get("origin")!==new URL(req.url).origin) return NextResponse.json({error:"FORBIDDEN"},{status:403,headers});
 try {
  if(!await careerLabOwner()) return NextResponse.json({error:"NOT_FOUND"},{status:404,headers});
  if(!req.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({error:"INVALID_CONTENT_TYPE"},{status:415,headers});
  const reader=req.body?.getReader();if(!reader) return NextResponse.json({error:"INVALID_LAB_REQUEST"},{status:400,headers});
  let bytes=0;const chunks:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>4096){await reader.cancel();return NextResponse.json({error:"PAYLOAD_TOO_LARGE"},{status:413,headers});}chunks.push(value);}
  const body=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  let input;try{input=validateLabRequest(JSON.parse(new TextDecoder().decode(body)));}catch(error){
   const code=error instanceof Error?error.message:"INVALID_LAB_REQUEST";
   return NextResponse.json({error:code},{status:code==="CAREER_MODEL_CHANGED"?409:400,headers});
  }
  try{return NextResponse.json(runCareerLab(input),{headers});}catch{return NextResponse.json({error:"CAREER_ACTIVITY_NOT_EXPECTED"},{status:409,headers});}
 } catch { return NextResponse.json({error:"LAB_UNAVAILABLE"},{status:503,headers}); }
}

