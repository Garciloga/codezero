"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useLanguage} from "./localization/provider";
import LineIcon from "./line-icon";
import {mobileMessages} from "../../lib/localization/mobile-experience";
export default function MobileLearningHome({progress,nextTitle,nextHref,orgId}:{progress:number;nextTitle:string;nextHref:string;orgId:string|null}){
  const {locale}=useLanguage();
  const copy=mobileMessages[locale]??mobileMessages.es;
  const [nativeApp,setNativeApp]=useState(false);
  useEffect(()=>{setNativeApp(/(?:^|\s)GarcilogaAndroid\/1\./.test(window.navigator.userAgent));},[]);
  const safeProgress=Math.min(100,Math.max(0,Number.isFinite(progress)?progress:0));
  return <section className="garciloga-mobile-home" aria-labelledby="garciloga-mobile-heading">
    <header className="garciloga-mobile-hero">
      <small>{nativeApp?copy.native:copy.eyebrow}</small>
      <h2 id="garciloga-mobile-heading">{copy.title}</h2>
      <p>{copy.subtitle}</p>
    </header>
    <div className="garciloga-mobile-next">
      <div><span className="garciloga-mobile-kicker">{copy.next}</span><h3 translate="no">{nextTitle||copy.path}</h3></div>
      <div className="garciloga-mobile-progress"><span>{copy.progress}</span><strong>{safeProgress}%</strong></div>
      <div role="progressbar" aria-label={copy.progress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeProgress} className="garciloga-mobile-track"><span style={{width:safeProgress+"%"}}/></div>
      <Link prefetch={false} className="garciloga-mobile-cta" href={nextHref}>{copy.continue} <span aria-hidden="true">→</span></Link>
    </div>
    <nav className="garciloga-mobile-shortcuts" aria-label={copy.title}>
      <Link prefetch={false} href={"/weekly-cases"+(orgId?"?organization_id="+encodeURIComponent(orgId):"")}><LineIcon kind="task"/><span>{copy.challenges}</span></Link>
      <Link prefetch={false} href="/competencies"><LineIcon kind="certificate"/><span>{copy.skills}</span></Link>
      <Link prefetch={false} href={orgId?"/teams/"+encodeURIComponent(orgId)+"/tasks":"/dashboard?view=learning#my-learning-path"}><LineIcon kind="learning"/><span>{orgId?copy.tasks:copy.path}</span></Link>
    </nav>
    {nativeApp&&<a className="garciloga-mobile-share" href="/dashboard?garciloga_native_action=share">{copy.share} <span aria-hidden="true">↗</span></a>}
  </section>;
}
