-- Metadata-only editorial review ledger, not linked to student progress.
-- Service-role read/write happens exclusively after server-side requireOwner.
CREATE TABLE IF NOT EXISTS public.owner_lesson_editorial_reviews (
 program_key text NOT NULL CHECK (length(program_key) BETWEEN 2 AND 80),
 lesson_key text NOT NULL CHECK (length(lesson_key) BETWEEN 2 AND 150),
 content_hash text NOT NULL CHECK (content_hash ~ '^[a-f0-9]{64}$'),
 state text NOT NULL CHECK (state IN ('reviewed','observation')),
 note text NULL CHECK (note IS NULL OR length(note) <= 500),
 reviewed_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 reviewed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(program_key,lesson_key),
 CONSTRAINT observation_has_note CHECK (state <> 'observation' OR length(trim(COALESCE(note,'')))>=5)
);
CREATE INDEX IF NOT EXISTS owner_review_person_idx ON public.owner_lesson_editorial_reviews (reviewed_by,reviewed_at DESC);
ALTER TABLE public.owner_lesson_editorial_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.owner_lesson_editorial_reviews FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.owner_lesson_editorial_reviews TO service_role;
