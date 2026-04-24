-- ═══════════════════════════════════════════════════════════════
-- overhoorme.nl — Supabase schema
-- ═══════════════════════════════════════════════════════════════
-- Visie-uitgangspunt (zie VISION.md):
--   Leerling = baas. Geen docent/ouder kan voortgang inzien.
--   Daarom: alle voortgangsdata heeft RLS waarbij ALLEEN de
--   eigenaar zelf kan lezen/schrijven. Geen rol "teacher" of
--   "parent" met read-access op andermans data.
--
-- Run dit bestand één keer in Supabase Dashboard → SQL Editor.
-- Idempotent: kan opnieuw gedraaid worden bij schema-wijzigingen.
-- ═══════════════════════════════════════════════════════════════


-- ─── 1. STUDENTS ───────────────────────────────────────────────
-- Profiel-tabel naast Supabase Auth's `auth.users`.
-- Auth.users heeft email/password, maar wij willen óók een
-- gebruikersnaam (leerlingnummer of vrij gekozen) en optionele
-- voornaam voor begroeting.
CREATE TABLE IF NOT EXISTS public.students (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        VARCHAR(40) UNIQUE NOT NULL,
  voornaam        VARCHAR(60),
  klas            VARCHAR(20),  -- "1A", "5V", etc. — vrij invulbaar
  jaarlaag        INT,          -- 1, 2, 3 (onderbouw), 4-6 (bovenbouw)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_username ON public.students(username);


-- ─── 2. WORD PROGRESS ──────────────────────────────────────────
-- Per (student, lijst, woord) één rij. Spiegelt de localStorage
-- ListProgress.wordProgress maar dan server-side persistent.
CREATE TABLE IF NOT EXISTS public.word_progress (
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  list_id         VARCHAR(80) NOT NULL,
  word_id         VARCHAR(80) NOT NULL,
  box             SMALLINT NOT NULL DEFAULT 1 CHECK (box BETWEEN 1 AND 5),
  correct_count   INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  last_seen       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_promoted_at TIMESTAMPTZ,
  PRIMARY KEY (student_id, list_id, word_id)
);

CREATE INDEX IF NOT EXISTS idx_word_progress_student_list
  ON public.word_progress(student_id, list_id);


-- ─── 3. LIST META (per student per lijst) ──────────────────────
-- Aggregated info per lijst: practice days, sessions completed,
-- direction preference, etc. Eén rij per (student, lijst).
CREATE TABLE IF NOT EXISTS public.list_progress_meta (
  student_id           UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  list_id              VARCHAR(80) NOT NULL,
  practice_days        DATE[] NOT NULL DEFAULT '{}',
  sessions_completed   INT NOT NULL DEFAULT 0,
  last_practiced       TIMESTAMPTZ,
  direction_pref       VARCHAR(10),  -- 'vt-nl' | 'nl-vt' | 'mix' | NULL
  PRIMARY KEY (student_id, list_id)
);


-- ─── 4. STREAK ─────────────────────────────────────────────────
-- Globale practice-day-tracking voor de streak-badge. Eén rij per
-- student met een DATE[]. Bij elke oefening: today eraan toevoegen.
CREATE TABLE IF NOT EXISTS public.student_streak (
  student_id      UUID PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  practice_days   DATE[] NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── 5. CREDITS / TEGOED ───────────────────────────────────────
-- Saldo-veld + transactie-log. Saldo wordt gecached op students,
-- maar audit-trail in transactions.
--
-- Bedragen in CENTEN (integer) om floating-point ellende te vermijden.
-- €5,00 = 500 cent.
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS credits_cents INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.balance_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  delta_cents     INT NOT NULL,                    -- + = bijschrijving, - = afschrijving
  reason          VARCHAR(40) NOT NULL,            -- 'tikkie', 'mondeling-sessie', 'admin-correctie', 'welcome-bonus'
  description     TEXT,                            -- vrije omschrijving (Tikkie-id, sessie-id, etc.)
  external_ref    VARCHAR(120),                    -- Tikkie-betaalreferentie of vergelijkbaar
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID REFERENCES public.students(id) -- admin die het deed; NULL = systeem
);

CREATE INDEX IF NOT EXISTS idx_balance_transactions_student
  ON public.balance_transactions(student_id, created_at DESC);

ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

-- Leerling ziet alleen eigen transacties
DROP POLICY IF EXISTS "balance_transactions_owner_select" ON public.balance_transactions;
CREATE POLICY "balance_transactions_owner_select"
  ON public.balance_transactions FOR SELECT
  USING (auth.uid() = student_id);

-- Bijschrijvingen kan ALLEEN service-role doen (admin actie via server).
-- Geen INSERT-policy voor users → standaard geen toegang.

-- Trigger: bij INSERT in balance_transactions, update students.credits_cents
CREATE OR REPLACE FUNCTION public.update_credits_cache()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.students
     SET credits_cents = credits_cents + NEW.delta_cents
   WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_balance_transaction_insert ON public.balance_transactions;
CREATE TRIGGER on_balance_transaction_insert
  AFTER INSERT ON public.balance_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_credits_cache();


-- ─── 6. ADMIN USERS ────────────────────────────────────────────
-- Heel simpele admin-tabel: welke users hebben admin-rechten
-- (kunnen saldo bijschrijven). Apart van auth.users; gewoon een
-- whitelist van student-IDs die admin zijn.
CREATE TABLE IF NOT EXISTS public.admins (
  student_id      UUID PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Alleen service-role kan admins-tabel beheren. Geen client-policies.

-- Helper-functie om te checken of huidige user admin is
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE student_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ─── 7. MONDELING SESSIES (placeholder, voor later) ────────────
-- Transcripten van mondeling-sessies. Eén rij per sessie.
-- Wordt actief gebruikt zodra mondelingen-app live is.
CREATE TABLE IF NOT EXISTS public.mondeling_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  boek_slug       VARCHAR(120) NOT NULL,
  niveau          VARCHAR(20),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ,
  messages        JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback        TEXT,
  cost_eur        NUMERIC(10,4) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_mondeling_sessions_student
  ON public.mondeling_sessions(student_id, started_at DESC);


-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════
-- Visie: leerling ziet ALLEEN eigen data. Geen rol voor docent/ouder
-- die andermans data kan lezen. Service role key (server-only)
-- bypassed RLS, dus admin-tools blijven mogelijk maar nooit via
-- de client.

ALTER TABLE public.students            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_progress       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_progress_meta  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_streak      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mondeling_sessions  ENABLE ROW LEVEL SECURITY;


-- ─── students: lees/schrijf alleen eigen profiel ───────────────
DROP POLICY IF EXISTS "students_self_select" ON public.students;
CREATE POLICY "students_self_select"
  ON public.students FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "students_self_insert" ON public.students;
CREATE POLICY "students_self_insert"
  ON public.students FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "students_self_update" ON public.students;
CREATE POLICY "students_self_update"
  ON public.students FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ─── word_progress: alleen eigenaar ────────────────────────────
DROP POLICY IF EXISTS "word_progress_owner" ON public.word_progress;
CREATE POLICY "word_progress_owner"
  ON public.word_progress FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);


-- ─── list_progress_meta: alleen eigenaar ───────────────────────
DROP POLICY IF EXISTS "list_progress_meta_owner" ON public.list_progress_meta;
CREATE POLICY "list_progress_meta_owner"
  ON public.list_progress_meta FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);


-- ─── student_streak: alleen eigenaar ───────────────────────────
DROP POLICY IF EXISTS "student_streak_owner" ON public.student_streak;
CREATE POLICY "student_streak_owner"
  ON public.student_streak FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);


-- ─── mondeling_sessions: alleen eigenaar ───────────────────────
DROP POLICY IF EXISTS "mondeling_sessions_owner" ON public.mondeling_sessions;
CREATE POLICY "mondeling_sessions_owner"
  ON public.mondeling_sessions FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);


-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS / FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Auto-create student row bij signup. Email/password → auth.users
-- → trigger maakt student-profiel aan met username uit raw_user_meta_data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.students (id, username, voornaam, klas, jaarlaag)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username',
             'student_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'voornaam',
    NEW.raw_user_meta_data->>'klas',
    NULLIF(NEW.raw_user_meta_data->>'jaarlaag', '')::INT
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ═══════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════
-- Volgende stappen:
--   1. Plak deze SQL in Supabase Dashboard → SQL Editor → Run
--   2. Auth Settings → Email auth aan, magic link optioneel
--   3. (Optioneel) Disable email confirmation voor MVP-test
--   4. Plak credentials in .env.local
