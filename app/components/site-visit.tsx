'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
const pages:Record<string,string>={'/':'home','/pricing':'pricing','/login':'registration','/roadmap':'roadmap'};
export default function SiteVisit(){
 const pathname=usePathname();
 useEffect(()=>{const page=pages[pathname];if(!page)return;let cancelled=false;const timer=setTimeout(()=>{if(cancelled)return;try{const key='garciloga-visit:'+page;if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');void fetch('/api/metrics/visit',{method:'POST',body:new URLSearchParams({page}),keepalive:true}).catch(()=>{});}catch{}},1000);return()=>{cancelled=true;clearTimeout(timer);};},[pathname]);return null;
}
