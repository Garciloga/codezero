import {notFound,redirect} from "next/navigation";
import {advancedLearner} from "../../lib/advanced-assessment-server";
import {isUuid} from "../../lib/workspace-sandbox";
import {localeContext} from "../../lib/localization/server";
import AdvancedAssessmentPlayer from "../components/advanced-assessment-player";
import LocalizedContent from "../components/localization/server";
export const dynamic="force-dynamic";
export default async function Decisions({searchParams}:{searchParams:Promise<{organization_id?:string}>}){
 const params=await searchParams;
 const org=params.organization_id??null;
 if(org&&!isUuid(org))notFound();
 const session=await advancedLearner(org);
 if(!session)redirect("/dashboard");
 const {locale}=await localeContext();
 return <LocalizedContent><AdvancedAssessmentPlayer locale={locale} org={org} canSave={true}/></LocalizedContent>;
}
