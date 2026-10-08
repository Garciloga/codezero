'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import LanguageProvider from './provider';
import {messageSection} from '../../../lib/localization/section';
import type {Locale,Messages} from '../../../lib/localization/shared';
import type {ReactNode} from 'react';
export default function SectionLanguage({locale,messages,section,children}:{locale:Locale;messages:Messages;section:string;children:ReactNode}){
 const pathname=usePathname(),target=messageSection(pathname);
 const [loaded,setLoaded]=useState({locale,section,messages});
 useEffect(()=>{if(locale==='es'||section===target||loaded.locale===locale&&loaded.section===target)return;const controller=new AbortController();fetch(`/api/localization/section?locale=${locale}&section=${target}`,{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error('CATALOG_LOAD_FAILED');return r.json();}).then(messages=>setLoaded({locale,section:target,messages})).catch(()=>{});return ()=>controller.abort();},[locale,target,section,loaded.locale,loaded.section]);
 return <LanguageProvider locale={locale} messages={section===target?messages:loaded.locale===locale&&loaded.section===target?loaded.messages:messages}>{children}</LanguageProvider>;
}
