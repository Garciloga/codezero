-- Repair solutions for scenario questions added in 013_expand_exam_bank.
with bank(slug, correct_answer) as (
  values
  ('n1-scenario-09','B'),('n1-scenario-10','B'),
  ('n2-scenario-09','A'),('n2-scenario-10','B'),
  ('n3-scenario-09','B'),('n3-scenario-10','B'),
  ('n4-scenario-09','A'),('n4-scenario-10','A'),
  ('n5-scenario-09','C'),('n5-scenario-10','A'),
  ('n6-scenario-09','B'),('n6-scenario-10','A'),
  ('n7-scenario-09','A'),('n7-scenario-10','B'),
  ('n8-scenario-09','B'),('n8-scenario-10','B'),
  ('n9-scenario-09','A'),('n9-scenario-10','A'),
  ('n10-scenario-09','A'),('n10-scenario-10','A'),
  ('n11-scenario-09','A'),('n11-scenario-10','A'),
  ('n12-scenario-09','A'),('n12-scenario-10','A'),
  ('n13-scenario-09','A'),('n13-scenario-10','A'),
  ('n14-scenario-09','A'),('n14-scenario-10','A'),
  ('n15-scenario-09','A'),('n15-scenario-10','A')
)
insert into public.exam_solutions (question_id, correct_answer)
select q.id, b.correct_answer
from bank b
join public.exam_questions q on q.slug=b.slug
on conflict (question_id) do nothing;
