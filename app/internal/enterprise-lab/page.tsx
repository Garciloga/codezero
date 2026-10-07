import { translatedMetadata } from '../../../lib/localization/metadata';
import LocalizedContent from "../../components/localization/server";
import { notFound } from "next/navigation";
import { careerLabOwner } from "../../../lib/career-lab-owner";
import EnterpriseLab from "./enterprise-lab";
export const dynamic = "force-dynamic";
export async function generateMetadata() { return translatedMetadata({title:"Enterprise · laboratorio interno", robots:{index:false,follow:false}}); }
export default async function EnterpriseLabPage() {
  if (process.env.CODEZERO_ENTERPRISE_PREVIEW !== "1" || !await careerLabOwner()) notFound();
  return <LocalizedContent><EnterpriseLab /></LocalizedContent>;
}

