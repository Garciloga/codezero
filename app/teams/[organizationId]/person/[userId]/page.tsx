import DevelopmentPlans from '../../../../components/development-plan';
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
import DraftCourseAssignment from '../../../../components/enterprise/draft-course-assignment';
import {draftCourseAssignmentsEnabled} from '../../../../../lib/draft-course-assignment-policy';
import {workspaceSandboxEnabled} from '../../../../../lib/workspace-sandbox';
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
  // A person profile is restricted to the organization owner, admins, direct reports,
  // or a leader who has explicit visibility permission for the target's team.
  const isAdmin=['owner','admin'].includes(d.own.role);
  const teamAccess=!isAdmin&&person.reports_to!==d.user.id?await d.supabase.from('organization_team_members').select('team_id').eq('organization_id',organizationId).eq('user_id',userId):null;
  const grants=teamAccess?.data?.length?await d.supabase.from('organization_team_grants').select('team_id').eq('organization_id',organizationId).eq('user_id',d.user.id).eq('can_view',true):null;
  const permitted=isAdmin||person.reports_to===d.user.id||Boolean(teamAccess?.data?.some(m=>grants?.data?.some(g=>g.team_id===m.team_id)));
  if(!permitted)redirect('/dashboard');
  const preview=draftCourseAssignmentsEnabled()&&workspaceSandboxEnabled();
  const availableTeams=preview?await d.supabase.from('organization_teams').select('id,name').eq('organization_id',organizationId):null;
  const training=roleTrainingEnabled()?await trainingPerson(userId,organizationId):null;
  const reinforcement=training?await d.supabase.from('learning_assignments').select('activity_key,title,due_at,reinforcement_before,reinforcement_after').eq('organization_id',organizationId).eq('user_id',userId).eq('activity_type','route_unit'):null;
  return (
    <LocalizedContent>
      <main className="wrap">
        <h1>Ficha de aprendizaje</h1>
        <PersonCard org={organizationId} person={person} />
        {preview&&<DraftCourseAssignment org={organizationId} target={userId} teams={availableTeams?.data??[]}/>} 
        {training&&<><section className="card"><h2>Perfil del puesto para aprendizaje</h2><form action="/api/role-training" method="post"><input type="hidden" name="action" value="position"/><input type="hidden" name="organization_id" value={organizationId}/><input type="hidden" name="user_id" value={userId}/><label>Puesto<select name="position" defaultValue={training.profile?.position_key??''} required><option value="" disabled>Elige un puesto</option>{Object.entries(ROLE_WORKFLOWS).map(([key,r])=><option key={key} value={key}>{r.title}</option>)}{training.profiles.some(p=>p.position_key==='product_specialist')&&<option value="product_specialist">Product Specialist</option>}</select></label><button className="btn">Guardar perfil de aprendizaje</button></form></section><DevelopmentPlans org={organizationId} userId={userId} summary={training.summary} canPropose/><CompetencyPanel evidence={training.evidence} profile={training.profile} org={organizationId} userId={userId} canAssign={true}/>
         {reinforcement?.error?<p>No pudimos cargar los refuerzos.</p>:<ReinforcementPanel records={reinforcement?.data??[]}/>}</>}
        <section className="card">
          <h2>Competencias</h2>
          <SkillBars skills={person.competencies} />
        </section>
      </main>
    </LocalizedContent>
  );
}


