import { notFound } from "next/navigation";
import ModularPlanPreview from "../../components/modular-plan-preview";
import { workspaceUser } from "../../../lib/workspace-server";
import { workspaceSandboxEnabled } from "../../../lib/workspace-sandbox";
export const metadata = { title: "Vista previa de planes modulares", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function ModularPreviewPage() {
  if (process.env.CODEZERO_MODULAR_PREVIEW !== "1") notFound();
  let waitlist: string[] = []; let enabled = false; let viewerIdentity = "guest";
  if(workspaceSandboxEnabled()){
    const session=await workspaceUser();
    if(session){
      viewerIdentity=session.user.id;
      const {data,error}=await session.supabase.from("addon_waitlist").select("addon_key").eq("user_id",session.user.id);
      enabled=!error; if(data && !error)waitlist=data.map(row=>row.addon_key);
    }
  }
  return <main className="wrap"><header className="public-pricing-intro">
    <p className="pill">Vista previa · sin compras</p><h1>Aprende a tu manera</h1>
    <p>Explora la propuesta aprobada de planes y módulos. Su disponibilidad real se validará antes del lanzamiento.</p>
  </header><ModularPlanPreview key={viewerIdentity} waitlist={waitlist} waitlistEnabled={enabled} /></main>;
}
