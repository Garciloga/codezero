"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useLanguage} from "./localization/provider";
import LineIcon from "./line-icon";
import {mobileTabLabels,mobileNavigationLabels} from "../../lib/localization/mobile-experience";

export default function MobileTabs({orgId,roleTrainingActive}:{orgId:string|null;roleTrainingActive:boolean}) {
  const pathname=usePathname();
  const {locale}=useLanguage();
  const words=mobileTabLabels[locale]??mobileTabLabels.es;
  const paths=[
    "/dashboard?view=learning",
    roleTrainingActive?"/positions"+(orgId?"?organization_id="+encodeURIComponent(orgId):""):"/dashboard?view=learning#my-learning-path",
    "/weekly-cases"+(orgId?"?organization_id="+encodeURIComponent(orgId):""),
    "/competencies",
    "/profile"
  ];
  const active=(index:number)=>{
    if(index===0)return pathname==="/dashboard";
    if(index===1)return pathname.startsWith("/positions")||pathname.startsWith("/learn/")||pathname.startsWith("/role-training");
    if(index===2)return pathname.startsWith("/weekly-cases")||pathname.startsWith("/decisions");
    if(index===3)return pathname.startsWith("/competencies")||pathname.startsWith("/certificates");
    return pathname.startsWith("/profile");
  };
  return <nav className="garciloga-mobile-tabs" aria-label={mobileNavigationLabels[locale]}>
    {paths.map((href,i)=><Link prefetch={false} key={i} href={href} aria-current={active(i)?"page":undefined}>
      <LineIcon kind={["home","learning","task","certificate","settings"][i]}/>
      <span>{words[i]}</span>
    </Link>)}
  </nav>;
}
