import {notFound,redirect} from "next/navigation";
import Link from "next/link";
import {getServerUser} from "../../../lib/supabase-server";
import {requireOwner} from "../../../lib/admin";
import {localeContext} from "../../../lib/localization/server";
import {ownerDemoCopy} from "../../../lib/localization/owner-demo";
import LocalizedContent from "../../components/localization/server";
import OwnerSelfReset from "../../components/owner-self-reset";
import OwnerSalesDemo from "../../components/owner-sales-demo";

export const dynamic="force-dynamic";
export default async function OwnerDemoCenter(){
 const {data:{user}}=await getServerUser();
 if(!user)redirect("/login");
 try{await requireOwner(user.id);}catch{notFound();}
 const {locale}=await localeContext(),t=ownerDemoCopy(locale);
 return <LocalizedContent><main className="wrap" style={{maxWidth:1100}}>
  <div className="nav"><div><span className="pill">GARCILOGA</span>
   <h1>{t.title}</h1><p className="muted">{t.subtitle}</p></div>
   <Link className="btn secondary" href="/admin">{t.back}</Link>
  </div>
  <p role="note">{t.private}</p>
  <OwnerSalesDemo locale={locale}/>
  <OwnerSelfReset locale={locale}/>
  <p className="muted">{t.notice}</p>
 </main></LocalizedContent>;
}
