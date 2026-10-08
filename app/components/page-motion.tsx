'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
/** Animate only committed route content; no navigation interception or delayed requests. */
export default function PageMotion({children}:{children:ReactNode}){
 const path=usePathname(),ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const animation=ref.current?.animate([{transform:'translateY(6px)'},{transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});return ()=>animation?.cancel();},[path]);
 return <div ref={ref} className="page-motion">{children}</div>;
}
