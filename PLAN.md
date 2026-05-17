# open-recruiter — Implementation Plan

## Context

Greenfield build of **open-recruiter**: a free, MIT-licensed, self-hostable recruiter portal. Recruiters paste a JD, share a public `/apply/[slug]` URL, candidates upload a resume, a Supabase Edge Function calls **Gemini 2.5 Flash with Thinking Mode** twice (parse → score 0–100 + one-sentence rationale), and the dashboard renders a ranked list with a client-side Top-N stepper. Stack is fixed: Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui + Supabase (Postgres/Storage/Auth/Edge Functions) + `@google/genai`. pnpm. MIT.

Goal: a clean fork-and-run repo where `cp .env.example .env.local && pnpm i && pnpm dev` reaches a working app with no code edits.

## Phase 1 — Repo init & scaffolding

1. `corepack enable pnpm` + `corepack prepare pnpm@latest --activate`.
2. `pnpm create next-app@latest .` with: TypeScript, ESLint, Tailwind, App Router, no `src/`, import alias `@/*`.
3. Initialize git.
4. Runtime deps: `@google/genai`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `nanoid`.
5. Dev deps: `vitest`, `@vitest/coverage-v8`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@playwright/test`, `tsx`, `@types/node`.
6. Init shadcn (`pnpm dlx shadcn@latest init`); add `button input label textarea card form badge`.
7. Scripts: `dev`, `build`, `start`, `typecheck`, `lint`, `test`, `test:e2e`.
8. `vitest.config.ts` (jsdom + `@` alias), `playwright.config.ts` (chromium, webServer = `pnpm dev`).
9. Strict `tsconfig.json` (`strict`, `noUncheckedIndexedAccess`).
10. `.gitignore` extends Next defaults with `.env.local`, `playwright-report/`, `test-results/`, `supabase/.branches`, `supabase/.temp`.

## Phase 2 — Foundation files (first commit)

- **CLAUDE.md** (~100 lines, `@README.md` import): purpose, stack, file layout, Gemini Integration Contract verbatim, twin-file rule, naming rule, commit format, verification commands, scope reminders.
- **PLAN.md**: this plan, kept current.

## Phase 3 — Static deliverables

- **LICENSE** — MIT.
- **.env.example** — `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **README.md** — prerequisites, 6-step quickstart, env-var table, one-click Vercel deploy button, 3 troubleshooting items, license + contributing line.

## Phase 4 — Supabase schema & RLS

`supabase/migrations/0001_init.sql`:

- `jobs(id uuid pk, slug text unique, title, description, created_by uuid → auth.users, created_at)`.
- `candidates(id uuid pk, job_id uuid fk, full_name, email, phone, resume_path, parsed jsonb, score int 0–100, rationale text, status text default 'pending', created_at)`.
- Storage bucket `resumes` (private).
- RLS:
  - `jobs`: select/insert/update where `created_by = auth.uid()`. Public access to job-by-slug exposed via `security definer` function `public.get_job_by_slug(text)` returning the public columns.
  - `candidates`: anon `insert` allowed (any valid `job_id`); `select/update` only when joined job's `created_by = auth.uid()`.
  - Storage policy: anon `insert` to `resumes/{slug}/*`; owner-only `select` via signed URLs.

## Phase 5 — Library modules

- **`lib/gemini.ts`** — single SDK call site; `generate()` exactly per contract; throws on `thinkingBudget === 0`; default `-1`.
- **`lib/supabase.ts`** — `createBrowserSupabase()` (anon), `createServerSupabase()` (cookies via `@supabase/ssr`), `createAdminSupabase()` (service role, server-only).
- **`lib/schemas.ts`** — Zod + Gemini `responseSchema`s for `parsedResumeSchema`, `scoreSchema`, plus form Zod schemas `candidateFormSchema`, `newJobSchema`.

## Phase 6 — App Router pages & components

- `app/layout.tsx` — Inter via `next/font/google`, neutral palette, accent `#2563EB`, container max-w-6xl.
- `app/page.tsx` — landing + magic-link sign-in (server action). Loads without env keys.
- `app/auth/callback/route.ts` — OTP exchange → `/dashboard`.
- `app/auth/sign-out/route.ts` — sign out → `/`.
- `app/dashboard/page.tsx` — server component: jobs list + new-job form (server action; slug = `nanoid(10)`).
- `app/dashboard/[id]/page.tsx` — server component: JD, share link, candidates table sorted `score desc nulls last`, wrapped by `<TopNStepper>`.
- `app/apply/[slug]/page.tsx` — server component: fetches job via `get_job_by_slug`, renders `<ApplyForm>`.
- `app/apply/[slug]/ApplyForm.tsx` — `"use client"`: validates form, uploads to Storage (anon), inserts `candidates`, invokes `score-candidate` edge function.
- `components/TopNStepper.tsx` — `"use client"`: `+/-` stepper; slices children client-side; no inference re-run.
- `components/ui/*` — shadcn primitives only.

## Phase 7 — Edge function

`supabase/functions/score-candidate/index.ts` (Deno):

1. Accepts `{ candidate_id }`.
2. Loads candidate + job (service role).
3. Downloads resume from Storage, encodes as base64 multimodal part.
4. Calls Gemini 2.5 Flash with Thinking Mode (dynamic budget) + `parsedResumeSchema`.
5. Calls Gemini 2.5 Flash with Thinking Mode again + 5-axis rubric + `scoreSchema`.
6. Updates candidate: `parsed`, `score`, `rationale`, `status='scored'`.

The `generate()` helper is inlined at the top of `supabase/functions/score-candidate/index.ts` and mirrors `lib/gemini.ts` exactly (same signature, same `thinkingBudget` default of `-1`, same throw on `0`); the only adaptations are Deno env access and `npm:` imports.

## Phase 8 — Tests

- `tests/unit/gemini.test.ts` — asserts `generate({ thinkingBudget: 0 })` throws; asserts `-1` default; uses `vi.mock('@google/genai')`.
- `tests/unit/schemas.test.ts` — round-trip valid/invalid samples per Zod schema.
- `tests/e2e/flow.spec.ts` — Playwright: sign in test user, create job, candidate submits sample PDF, dashboard shows integer 0–100 + non-empty rationale within 30 s. README documents required env (`GEMINI_API_KEY`, Supabase project, deployed edge function).

## Phase 9 — Verification

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`
4. `pnpm test:e2e` (with `.env.local` + deployed edge function)
5. Fresh-clone: `cp .env.example .env.local && pnpm i && pnpm dev` → homepage renders.
6. `grep -rEi "claude|anthropic|sonnet|haiku|opus|gpt|openai" --include="*.md" --include="*.ts" --include="*.tsx" --include="*.sql" .` → only literal filename `CLAUDE.md`.

## Commits

1. `chore: add CLAUDE.md and PLAN.md`
2. `chore: scaffold Next.js 15 + Tailwind + shadcn + pnpm`
3. `chore: add MIT license, .env.example, README`
4. `feat(supabase): initial schema, RLS, resumes bucket`
5. `feat(lib): gemini single call site + supabase factories + zod schemas`
6. `feat(ui): layout, landing, magic-link auth`
7. `feat(dashboard): jobs list, new-job form, ranked candidates view with TopNStepper`
8. `feat(apply): public candidate submission flow`
9. `feat(scoring): score-candidate edge function (Gemini 2.5 Flash with Thinking Mode)`
10. `test: unit (gemini + schemas) and e2e (Playwright submit→score flow)`

## Out of scope

Resume preview, candidate emails, score recompute, ATS integrations, analytics, plugin systems, provider abstractions, retries with backoff, rate limiting, multi-tenant accounts, comments/notes on candidates, CSV export.
