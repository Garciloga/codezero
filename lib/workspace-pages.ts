/** Avoid silently truncating a roster or the denominator at PostgREST row limits. */
export async function readWorkspacePages<T>(fetchPage: (start:number,end:number)=>PromiseLike<{data:T[]|null;error:unknown}>) {
  const rows:T[]=[];
  for(let page=0;page<100;page++) {
    const result=await fetchPage(page*500,page*500+499);
    if(result.error || !result.data) return {data:null,error:result.error??new Error("NO_DATA")};
    rows.push(...result.data);
    if(result.data.length<500) return {data:rows,error:null};
  }
  return {data:null,error:new Error("ROSTER_TOO_LARGE")};
}
