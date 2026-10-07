import { notFound } from "next/navigation";
import { careerLabOwner } from "../../../lib/career-lab-owner";
import EnterpriseLab from "./enterprise-lab";
export const dynamic = "force-dynamic";
export const metadata = {title:"Enterprise · laboratorio interno", robots:{index:false,follow:false}};
export default async function EnterpriseLabPage() {
  if (process.env.CODEZERO_ENTERPRISE_PREVIEW !== "1" || !await careerLabOwner()) notFound();
  return <EnterpriseLab />;
}
