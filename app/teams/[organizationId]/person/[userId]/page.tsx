import { redirect } from "next/navigation";
import { requireOrganization } from "../../../../../lib/organization-server";
import LocalizedContent from "../../../../components/localization/server";
import PersonCard, {
  SkillBars,
} from "../../../../components/enterprise/person-card";
import {roleTrainingEnabled,trainingPerson} from '../../../../../lib/role-training-server';
import CompetencyPanel from '../../../../components/enterprise/competency-panel';
import {ROLE_WORKFLOWS} from '../../../../../lib/career-role-workflows';
import ReinforcementPanel from '../../../../components/enterprise/reinforcement-panel';
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
  const training=roleTrainingEnabled()?await trainingPerson(userId,organizationId):null;
  const reinforcement=training?await d.supabase.from('learning_assignments').select('activity_key,title,due_at,reinforcement_before,reinforcement_after').eq('organization_id',organizationId).eq('user_id',userId).eq('activity_type','route_unit'):null;
  return (
    <LocalizedContent>
      <main className="wrap">
        <h1>Ficha de aprendizaje</h1>
        <PersonCard org={organizationId} person={person} />
        {training&&<><section className="card"><h2>Perfil del puesto para aprendizaje</h2><form action="/api/role-training" method="post"><input type="hidden" name="action" value="position"/><input type="hidden" name="organization_id" value={organizationId}/><input type="hidden" name="user_id" value={userId}/><label>Puesto<select name="position" defaultValue={training.profile?.position_key??''} required><option value="" disabled>Elige un puesto</option>{Object.entries(ROLE_WORKFLOWS).map(([key,r])=><option key={key} value={key}>{r.title}</option>)}{training.profiles.some(p=>p.position_key==='product_specialist')&&<option value="product_specialist">Product Specialist</option>}</select></label><button className="btn">Guardar perfil de aprendizaje</button></form></section><CompetencyPanel evidence={training.evidence} profile={training.profile} org={organizationId} userId={userId} canAssign={true}/>
         {reinforcement?.error?<p>No pudimos cargar los refuerzos.</p>:<ReinforcementPanel records={reinforcement?.data??[]}/>}</>}
        <section className="card">
          <h2>Competencias</h2>
          <SkillBars skills={person.competencies} />
        </section>
      </main>
    </LocalizedContent>
  );
}

