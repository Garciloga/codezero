'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {usageSection} from '../../lib/platform-usage';

export default function PlatformUsage({userId,enabled}:{userId:string|null;enabled:boolean}) {
  const pathname = usePathname();
  useEffect(() => {
    const section = usageSection(pathname);
    if (!enabled || !userId || !section) return;
    let clicks = 0, visits = document.visibilityState === 'visible' ? 1 : 0;
    const flush = () => {
      if (!clicks && !visits) return;
      const batch = {id:crypto.randomUUID(),section,clicks,visits};
      clicks = 0; visits = 0;
      // Bounded and nonblocking. Keepalive also delivers navigation clicks.
      void fetch('/api/usage', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(batch),keepalive:true}).catch(() => {});
    };
    const click = (event:MouseEvent) => {
      if (!event.isTrusted || document.visibilityState !== 'visible' || !(event.target instanceof Element)) return;
      const control = event.target.closest('a,button,summary,input[type=checkbox],input[type=radio],select');
      if (!control || control.closest('[data-usage-exclude]') || control.matches(':disabled,[aria-disabled=true]')) return;
      clicks = Math.min(200, clicks + 1);
    };
    const hidden = () => {if (document.visibilityState === 'hidden') flush();};
    const timer = window.setInterval(flush,15000);
    document.addEventListener('click',click,{capture:true,passive:true});
    document.addEventListener('visibilitychange',hidden);
    window.addEventListener('pagehide',flush);
    return () => {window.clearInterval(timer);document.removeEventListener('click',click,true);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',flush);flush();};
  },[pathname,userId,enabled]);
  return null;
}
