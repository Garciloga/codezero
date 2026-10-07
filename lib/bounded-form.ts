/** Bound actual streamed bytes before parsing a browser form. Content-Length is not trusted. */
export async function boundedForm(req:Request,maxBytes:number):Promise<FormData>{
 const reader=req.body?.getReader();if(!reader)throw Error('INVALID_FORM');const chunks:Uint8Array[]=[];let bytes=0;
 while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>maxBytes){await reader.cancel();throw Error('FORM_TOO_LARGE');}chunks.push(value);}
 const body=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
 return new Response(body,{headers:{'Content-Type':req.headers.get('content-type')??''}}).formData();
}
