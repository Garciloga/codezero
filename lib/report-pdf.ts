// Two-page summary with WinAnsi text. Detailed person rows are supplied in CSV.
export function reportPdf(lines:string[]){
 const wrap=lines.flatMap(s=>{const result:string[]=[];let line='';for(const word of s.split(/\s+/)){if((line+' '+word).length>92){result.push(line);line=word;}else line+=(line?' ':'')+word;}result.push(line);return result;}).slice(0,90);
 const pages=Array.from({length:Math.max(1,Math.ceil(wrap.length/45))},(_,i)=>wrap.slice(i*45,(i+1)*45));
 const objects:string[]=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'];
 const encode=(s:string)=>s.replace(/[–—]/g,'-').replace(/→/g,'>').replace(/[“”]/g,'"').replace(/[’]/g,"'").replace(/[^\x20-\xff]/g,'?').replace(/([\\()])/g,'\\$1');
 const kids:number[]=[];for(const lines of pages){const pageId=objects.length+1,streamId=pageId+1;kids.push(pageId);objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`);const content='BT /F1 11 Tf 44 790 Td 16 TL '+lines.map(s=>`(${encode(s)}) Tj T*`).join('\n')+' ET';objects.push(`<< /Length ${Buffer.byteLength(content,'latin1')} >>\nstream\n${content}\nendstream`);}
 objects[1]=`<< /Type /Pages /Kids [${kids.map(id=>id+' 0 R').join(' ')}] /Count ${kids.length} >>`;
 let body='%PDF-1.4\n',offsets=[0];for(const [i,obj]of objects.entries()){offsets.push(Buffer.byteLength(body,'latin1'));body+=`${i+1} 0 obj\n${obj}\nendobj\n`;}const offset=Buffer.byteLength(body,'latin1');body+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;return Buffer.from(body,'latin1');
}
