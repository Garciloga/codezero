import { redirect } from "next/navigation";
import { requireOrganization } from "../../../../../lib/organization-server";
import LocalizedContent from "../../../../components/localization/server";
import PersonCard, {
  SkillBars,
} from "../../../../components/enterprise/person-card";
export default async function PersonPage({
  params,
}: {
  params: Promise<{ organizationId: string; userId: string }>;
}) {
  const { organizationId, userId } = await params;
  const d = await requireOrganization(organizationId, [
    "owner",
    "admin",
    "manager",
    "supervisor",
  ]);
  const person = d.people.find((p) => p.user_id === userId);
  if (!person) redirect("/dashboard");
  return (
    <LocalizedContent>
      <main className="wrap">
        <h1>Ficha de aprendizaje</h1>
        <PersonCard org={organizationId} person={person} />
        <section className="card">
          <h2>Competencias</h2>
          <SkillBars skills={person.competencies} />
        </section>
      </main>
    </LocalizedContent>
  );
}
