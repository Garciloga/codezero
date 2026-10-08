import { redirect } from "next/navigation";
import {
  accountNavigation,
  organizationView,
} from "../../lib/organization-server";
import { getPassedLevelNumbers } from "../../lib/learning";
import LocalizedContent from "../components/localization/server";
import { SkillBars } from "../components/enterprise/person-card";
export default async function Competencies() {
  const account = await accountNavigation();
  if (!account) redirect("/login");
  const d = account.organization
    ? await organizationView(account.organization.organization_id)
    : null;
  const own = d?.people.find((p) => p.user_id === account.user.id);
  const passed = await getPassedLevelNumbers(account.user.id);
  const level =
    Array.from({ length: 15 }, (_, i) => i + 1).find((n) => !passed.has(n)) ??
    15;
  return (
    <LocalizedContent>
      <main className="wrap">
        <h1>Mis competencias</h1>
        <p>Nivel {level} de 15</p>
        <section className="card">
          <SkillBars skills={own?.competencies ?? []} />
        </section>
      </main>
    </LocalizedContent>
  );
}
