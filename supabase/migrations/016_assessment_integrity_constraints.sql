-- Strengthen learning-content integrity for multiple-choice assessments.

alter table public.exercises
  add constraint exercises_options_four_check
  check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4);

alter table public.exam_questions
  add constraint exam_questions_options_four_check
  check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4);

alter table public.exercise_solutions
  add constraint exercise_solutions_answer_check
  check (correct_answer in ('A','B','C','D'));

alter table public.exam_solutions
  add constraint exam_solutions_answer_check
  check (correct_answer in ('A','B','C','D'));

alter table public.levels
  add constraint levels_course_level_number_key unique (course_id, level_number);

alter table public.level_exams
  add constraint level_exams_level_id_key unique (level_id);
