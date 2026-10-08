import {createAdminSupabase} from "../../../../lib/admin";
import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { workspaceEnabled } from "../../../../lib/workspace-sandbox";
import { consumeRateLimit } from "../../../../lib/rate-limit";
import {roleTrainingEnabled} from '../../../../lib/role-training-policy';
import {readWorkspacePages} from '../../../../lib/workspace-pages';

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const rate = await consumeRateLimit(`profile-export:${user.id}`, 5, 3600);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rate.retry_after_seconds) } }
    );
  }

  const [
    profile,
    progress,
    lessonProgress,
    exerciseAttempts,
    examAttempts,
    projectSubmissions,
    certificates,
    usage,
  ] = await Promise.all([
    supabase.from("profiles")
      .select("id,email,full_name,role,plan_name,status,billing_status,stripe_cancel_at_period_end,created_at,updated_at,avatar_version")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("progress")
      .select("*")
      .eq("user_id", user.id),
    supabase.from("lesson_progress")
      .select("lesson_id,status,completed_at,created_at,updated_at")
      .eq("user_id", user.id),
    supabase.from("exercise_attempts")
      .select("exercise_id,answer,is_correct,created_at")
      .eq("user_id", user.id),
    supabase.from("exam_attempts")
      .select("exam_id,score,passed,answers,created_at")
      .eq("user_id", user.id),
    supabase.from("project_submissions")
      .select("project_id,submission_text,status,score,feedback,created_at,updated_at")
      .eq("user_id", user.id),
    supabase.from("certificates")
      .select("id,certificate_type,title,issued_at,metadata")
      .eq("user_id", user.id),
    supabase.from("usage_monthly")
      .select("period_start,exercises,exams,ai_queries,projects")
      .eq("user_id", user.id)
      .order("period_start", { ascending: true }),
  ]);

  const queries = [
    profile,
    progress,
    lessonProgress,
    exerciseAttempts,
    examAttempts,
    projectSubmissions,
    certificates,
    usage,
  ];

  const firstError = queries.find((query) => query.error)?.error;
  if (firstError) {
    return NextResponse.json({ error: "EXPORT_FAILED" }, { status: 500 });
  }

  const workspace = workspaceEnabled() ? await Promise.all([
    supabase.from("user_preferences").select("mode,accent,colors,updated_at").eq("user_id",user.id),
    supabase.from("private_practice_progress").select("progress,revision,updated_at").eq("user_id",user.id),
    supabase.from("addon_waitlist").select("addon_key,created_at").eq("user_id",user.id),
    supabase.from("issued_block_diplomas").select("id,level_number,learner_name,block_title,issued_at").eq("user_id",user.id),
    supabase.from("organization_memberships").select("organization_id,display_name,role,reports_to,active").eq("user_id",user.id),
    supabase.from("certificate_publications").select("certificate_id,public_id,display_name,title,issued_on,status,consented_at,updated_at").eq("user_id",user.id),
    supabase.from("cs_course_units").select("unit_index,choice,draft,version,updated_at").eq("user_id",user.id),
    supabase.from("cs_course_attempts").select("id,score,passed,version,created_at").eq("user_id",user.id),
    supabase.from("cs_course_projects").select("id,draft,status,score,feedback,rubric,created_at,reviewed_at").eq("user_id",user.id),
    supabase.from("addon_billing_operations").select("addon_key,action,status,created_at,updated_at").eq("user_id",user.id),
  ]) : [];
  if(workspace.some(query=>query.error)) return NextResponse.json({error:"EXPORT_FAILED"},{status:500});
  const training=roleTrainingEnabled()?await Promise.all([
    readWorkspacePages((a,b)=>supabase.from('learning_practice_submissions').select('id,organization_id,activity_id,draft,self_scores,assistance,answers,reevaluation_of,created_at').eq('user_id',user.id).order('created_at').order('id').range(a,b)),
    readWorkspacePages((a,b)=>supabase.from('learning_evidence_history').select('id,submission_id,organization_id,activity_key,independent_key,kind,competency_scores,assistance,review_source,observed_at,reevaluation_of,critical_errors,feedback,rubric_version').eq('user_id',user.id).order('observed_at').order('id').range(a,b)),
    readWorkspacePages((a,b)=>supabase.from('learning_assignments').select('organization_id,activity_key,title,due_at,reinforcement_before,reinforcement_after').eq('user_id',user.id).eq('activity_type','route_unit').order('organization_id').order('activity_key').range(a,b)),
  ]):[];
  if(training.some(q=>q.error))return NextResponse.json({error:'EXPORT_FAILED'},{status:500});
  const growth=workspaceEnabled()?await Promise.all([readWorkspacePages((a,b)=>supabase.from('learning_development_plans').select('*').eq('user_id',user.id).order('created_at').order('id').range(a,b)),supabase.from('notice_preferences').select('disabled_types,updated_at').eq('user_id',user.id),readWorkspacePages((a,b)=>supabase.from('notice_read_states').select('event_key,read_at').eq('user_id',user.id).order('event_key').range(a,b))]):[];
  if(growth.some(q=>q.error))return NextResponse.json({error:'EXPORT_FAILED'},{status:500});
  const cancellations=await readWorkspacePages((a,b)=>supabase.from('account_cancellation_history').select('event_id,subscription_id,action,occurred_at').eq('user_id',user.id).order('occurred_at').order('event_id').range(a,b));
  if(cancellations.error)return NextResponse.json({error:'EXPORT_FAILED'},{status:500});
  const admin=createAdminSupabase();
  const [activation,portfolio]=await Promise.all([admin.from('activation_events').select('event,observed_at').eq('user_id',user.id).gte('observed_at',new Date(Date.now()-90*86400000).toISOString()),admin.from('public_portfolios').select('published,display_name,evidence_ids,certificate_ids,competency_keys,consent_at,updated_at').eq('user_id',user.id)]);
  if(activation.error||portfolio.error)return NextResponse.json({error:'EXPORT_FAILED'},{status:500});
  const body = JSON.stringify({
    development_plans:growth[0]?.data??[],notification_preferences:growth[1]?.data??[],notification_read_states:growth[2]?.data??[],
    activation_events:activation.data,public_portfolio:portfolio.data,
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email ?? null,
      preferences: { locale: user.user_metadata?.locale ?? "es" },
      registration: { full_name: user.user_metadata?.full_name ?? null, signup_age: user.user_metadata?.signup_age ?? null },
      profile: profile.data,
    },
    learning: {
      progress: progress.data ?? [],
      lesson_progress: lessonProgress.data ?? [],
      exercise_attempts: exerciseAttempts.data ?? [],
      exam_attempts: examAttempts.data ?? [],
      project_submissions: projectSubmissions.data ?? [],
      certificates: certificates.data ?? [],
    },
    usage: usage.data ?? [],
    cancellation_history:cancellations.data??[],
    role_training:training.length?{submissions:training[0].data,evidence_history:training[1].data,reinforcements:training[2].data}:null,
    workspace: workspace.length ? {appearance:workspace[0].data,practice:workspace[1].data,interests:workspace[2].data,diplomas:workspace[3].data,memberships:workspace[4].data,certificate_publications:workspace[5].data,customer_success:{units:workspace[6].data,attempts:workspace[7].data,projects:workspace[8].data},billing_operations:workspace[9].data} : null,
  }, null, 2);

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="codezero-data-export.json"',
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}




