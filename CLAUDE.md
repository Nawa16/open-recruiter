# CLAUDE.md — open-recruiter

Context for future Claude Code sessions working in this repo.

## Project purpose

**open-recruiter** is a free, MIT-licensed, self-hostable recruiter portal. Hiring managers log in (Supabase magic link), paste a job description, share a public `/apply/[slug]` URL. Candidates upload a resume. A Supabase Edge Function calls **Gemini 2.5 Flash with Thinking Mode** twice — once to parse the resume into structured fields, once to score 0–100 against the JD with a one-sentence rationale — and writes the result to Postgres. The dashboard renders the ranked list as a server component; a client-side `+/-` Top-N stepper filters the rendered slice and never re-runs inference.

This is **not a commercial product**: no paywalls, no telemetry, no feature gates.

## Tech stack (fixed — do not substitute)

- Next.js 15 (App Router, TypeScript, Tailwind, shadcn/ui), pnpm
- Supabase (Postgres + Storage + Magic-Link Auth + Edge Functions)
- **Gemini 2.5 Flash with Thinking Mode (always on)** via `@google/genai`
- Vercel Hobby or any Node 20+ host

## File layout

```
/app                Next.js App Router (apply/[slug], dashboard, auth)
/components         shadcn/ui primitives + TopNStepper
/lib                gemini.ts, supabase.ts, schemas.ts
/supabase           migrations/ and functions/score-candidate/
/tests              Vitest unit + Playwright e2e
README.md           Setup, deploy, troubleshooting
PLAN.md             Live plan, kept current
.env.example        GEMINI_API_KEY + 3 Supabase keys
```

Setup details live in @README.md; the live plan lives in @PLAN.md.

## Gemini integration contract (verbatim — do not deviate)

- **SDK:** `@google/genai` (latest)
- **Model string:** `gemini-2.5-flash` (stable channel, no version suffix)
- **Thinking Mode: enabled exclusively.** `thinkingBudget` is `-1` (dynamic) by default. The helper **must throw** if anyone passes `0`. Never disable thinking anywhere.
- **Single call site:** `lib/gemini.ts` exports `generate()`. Every other module in `/app` and `/lib` imports from there. No direct SDK calls elsewhere.
- **Twin helper for Deno:** the Supabase Edge Function lives in a separate Deno runtime that cannot import from `/lib`. The same `generate()` helper is therefore inlined at the top of `supabase/functions/score-candidate/index.ts`. It must mirror `lib/gemini.ts` exactly — same signature, same `thinkingBudget` default of `-1`, same throw on `0`. The only adaptations are Deno env access (`Deno.env.get("GEMINI_API_KEY")`) and `npm:@google/genai` import. Any change to one must be made in the other.
- **Resume parsing:** pass PDF/DOCX as inline base64 multimodal input. Request structured JSON via `responseSchema`. Schema fields: `fullName, email, phone, totalYearsExperience, skills[], companies[{name,title,years}], education[]`.
- **Scoring:** send JD + parsed resume JSON + a 5-axis rubric (skills match, years of experience, seniority level, domain fit, education). Schema: `{ score: integer 0-100, rationale: string }`.
- Use dynamic thinking (`-1`) for both calls. Setting a numeric budget requires an explicit code comment justifying it.

## Naming rule (strict)

Every comment, doc string, log line, error message, README sentence, and CLAUDE.md reference must name **"Gemini 2.5 Flash with Thinking Mode"** — never any other model or vendor name. A grep check enforces this in verification (step 6 below).

## Commit format

Conventional Commits. One focused commit per coherent unit of work. Examples:

- `feat(scoring): add Gemini 2.5 Flash scoring edge function`
- `fix(dashboard): preserve TopN selection across navigation`
- `chore: bump Next.js patch`

## Verification commands

After every implementation block, all four must be green before moving on:

```bash
pnpm typecheck    # tsc --noEmit
pnpm lint         # next lint
pnpm test         # vitest run (includes thinkingBudget:0 throws assertion)
pnpm test:e2e     # playwright; candidate submit → scored within 30 s
```

Plus the model-name grep (must return only the literal filename `CLAUDE.md`):

```bash
grep -rEi "claude|anthropic|sonnet|haiku|opus|gpt|openai" \
  --include="*.md" --include="*.ts" --include="*.tsx" --include="*.sql" .
```

## Scope reminders

- No features beyond what's in PLAN.md / project spec. Resume preview, candidate emails, ATS integrations, analytics — all out of scope.
- No abstractions for "future flexibility". One Gemini call site. One Supabase client factory module. No plugin systems, no provider patterns.
- No comments, docstrings, or type annotations added to code you did not write or change.
- No error handling for cases that cannot happen. Trust framework guarantees.
- No files outside the structure above.
