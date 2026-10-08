'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useLanguage} from './localization/provider';
import LocalizedContent from './localization/client';
import type {Notice} from '../../lib/notification-types';
export default function NotificationBell(){const {locale}=useLanguage();const [notices,setNotices]=useState<Notice[]>([]),path=usePathname();useEffect(()=>{let active=true;void fetch('/api/notifications',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(active)setNotices(d?.notices??[]);}).catch(()=>{});return ()=>{active=false;};},[path,locale]);const count=notices.filter(n=>!n.read).length;return <LocalizedContent><details className="notification-bell"><summary>Avisos {count>0&&<span className="pill">{count}</span>}</summary><div className="card notification-popover">{notices.filter(n=>!n.read).slice(0,5).map(n=><p key={n.id}><Link href={n.href}>{n.title}</Link></p>)}{!count&&<p>No hay avisos sin leer.</p>}<Link className="btn secondary" href="/notifications">Ver todos los avisos</Link></div></details></LocalizedContent>;}
