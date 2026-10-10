import { notFound, redirect } from "next/navigation";
import { getServerUser } from "../../../lib/supabase-server";
import { requireOwner } from "../../../lib/admin";
import { localeContext } from "../../../lib/localization/server";
import { translatedMetadata } from "../../../lib/localization/metadata";
import AssessmentDecisionPilot from "./assessment-pilot";

export const dynamic = "force-dynamic";
export async function generateMetadata(){
  return translatedMetadata({title:"Garciloga · Assessment 2.0 internal pilot",robots:{index:false,follow:false}});
}
export default async function OwnerAssessmentPilot(){
  const {data:{user}}=await getServerUser();
  if(!user)redirect("/login");
  try{await requireOwner(user.id);}catch{notFound();}
  const {locale}=await localeContext();
  return <AssessmentDecisionPilot locale={locale}/>;
}
