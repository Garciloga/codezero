import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TutorContextStore, TutorLesson, TutorLevel } from "./tutor-context";
import { TUTOR_LIMITS } from "./tutor-context";
/** Every private query uses the verified user's session and explicit user_id filter. */
type VerifiedProfile = { id:string; status:string; role:string; plan_name:string };
export function tutorContextStore(supabase:SupabaseClient,userId:string,verifiedProfile?:VerifiedProfile):TutorContextStore {
 // This optional snapshot must come from workspaceUser's own RLS profile query,
 // never request input or Auth user_metadata. It lives only for this request.
 if(verifiedProfile && verifiedProfile.id!==userId)throw new Error("PROFILE_USER_MISMATCH");
 return {
  async profile(){if(verifiedProfile)return verifiedProfile;const {data,error}=await supabase.from("profiles").select("status,role,plan_name").eq("id",userId).maybeSingle();if(error)throw error;return data;},
  async lesson(id){const {data,error}=await supabase.from("lessons").select("id,level_id,title,content,status").eq("id",id).eq("status","published").maybeSingle();if(error)throw error;return data as TutorLesson|null;},
  async level(id){const {data,error}=await supabase.from("levels").select("id,level_number,title,status").eq("id",id).eq("status","published").maybeSingle();if(error)throw error;return data as TutorLevel|null;},
  async passedPriorLevels(levelNumber){
   const {data:levels,error:levelError}=await supabase.from("levels").select("id,level_number").lt("level_number",levelNumber).gte("level_number",1).eq("status","published").order("level_number").limit(15);
   if(levelError || !levels || levels.length!==levelNumber-1 || levels.some((level,index)=>level.level_number!==index+1))throw new Error("PREREQUISITES_UNAVAILABLE");
   const {data:exams,error:examError}=await supabase.from("level_exams").select("id,level_id").in("level_id",levels.map(level=>level.id)).eq("status","published").limit(101);
   if(examError || !exams || exams.length>100)throw new Error("PREREQUISITES_UNAVAILABLE");
   if(!exams.length)return new Set<number>();
   const {data:attempts,error:attemptError}=await supabase.from("exam_attempts").select("exam_id").eq("user_id",userId).eq("passed",true).in("exam_id",exams.map(exam=>exam.id)).limit(1001);
   if(attemptError || !attempts || attempts.length>1000)throw new Error("PREREQUISITES_UNAVAILABLE");
   const passedExamIds=new Set(attempts.map(attempt=>attempt.exam_id));
   const numberByLevel=new Map(levels.map(level=>[level.id,level.level_number]));
   return new Set(exams.filter(exam=>passedExamIds.has(exam.id)).map(exam=>numberByLevel.get(exam.level_id)!).filter(Number.isInteger));
  },
  async progress(lesson){const {data,error}=await supabase.from("lesson_progress").select("status").eq("user_id",userId).eq("lesson_id",lesson).maybeSingle();if(error)throw error;return data;},
  async recentOutcomes(lesson){
   const {data:attempts,error}=await supabase.from("exercise_attempts")
    .select("is_correct,exercises!inner(lesson_id,status)")
    .eq("user_id",userId).eq("exercises.lesson_id",lesson).eq("exercises.status","published")
    .order("created_at",{ascending:false}).order("id",{ascending:false}).limit(TUTOR_LIMITS.recentAttempts);
   if(error || !attempts)throw new Error("PRACTICE_UNAVAILABLE");
   return attempts.map(attempt=>attempt.is_correct);
  },
 };
}
