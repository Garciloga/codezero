export async function boundedJson(req:Request,maxBytes:number):Promise<unknown> {
  const reader=req.body?.getReader();if(!reader)throw Error('INVALID_BODY');
  const chunks:Uint8Array[]=[];let bytes=0;
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>maxBytes){await reader.cancel();throw Error('BODY_TOO_LARGE');}chunks.push(value);}
  const body=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(body));
}
