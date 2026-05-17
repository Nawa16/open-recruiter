# open-recruiter

A free, MIT-licensed, self-hostable recruiter portal. Paste a job description, share a public apply link, get a ranked list of candidates. Resumes are parsed and scored 0–100 against the JD by **Gemini 2.5 Flash with Thinking Mode**. Bring your own Supabase project and Gemini API key — both have free tiers.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fopen-recruiter%2Fopen-recruiter&env=GEMINI_API_KEY,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Gemini%20and%20Supabase%20keys&project-name=open-recruiter)

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable pnpm`)
- A free [Supabase](https://supabase.com) project
- A free [Gemini API key](https://aistudio.google.com/apikey)

## Quickstart

```bash
git clone https://github.com/open-recruiter/open-recruiter.git
cd open-recruiter
cp .env.example .env.local
# fill in the four keys in .env.local
pnpm install
pnpm dev
```

Then:

1. Open <http://localhost:3000> and sign in with a magic link.
2. Create a job by pasting a description.
3. Share the `/apply/[slug]` URL with candidates.
4. Watch the dashboard fill with ranked applicants.

To deploy the resume-scoring edge function to your Supabase project:

```bash
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <your-project-ref>
pnpm dlx supabase db push                          # apply the migration in supabase/migrations
pnpm dlx supabase secrets set GEMINI_API_KEY=...   # the same key as .env.local
pnpm dlx supabase functions deploy score-candidate
```

## Environment variables

| Name                              | Required | Where used        | Notes                                                                          |
| --------------------------------- | -------- | ----------------- | ------------------------------------------------------------------------------ |
| `GEMINI_API_KEY`                  | yes      | edge function     | Gemini 2.5 Flash with Thinking Mode (parsing + scoring).                       |
| `NEXT_PUBLIC_SUPABASE_URL`        | yes      | browser + server  | Your Supabase project URL.                                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | yes      | browser + server  | Anon key — safe to expose.                                                     |
| `SUPABASE_SERVICE_ROLE_KEY`       | yes      | edge function     | Service role key — server-only. Never reference this from a `"use client"` file. |

## Scripts

```bash
pnpm dev          # Next.js dev server
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest unit tests
pnpm test:e2e     # Playwright end-to-end (requires real keys + deployed edge function)
```

## Troubleshooting

- **Magic link email never arrives.** Supabase's free tier rate-limits auth emails and may queue them; check the Supabase dashboard → Authentication → Logs. For local testing, use a custom SMTP provider or enable the `Inbucket` mailbox in `supabase start`.
- **Gemini call fails with quota or 403.** Free-tier Gemini keys have a rate cap. Wait a minute and retry. Confirm `GEMINI_API_KEY` is set both in your `.env.local` (for any local invocations) and as a Supabase function secret (for production scoring) — they're separate stores.
- **Edge function times out (`score-candidate`).** Large resumes plus dynamic Thinking Mode can exceed the default 60-second function timeout. Trim the resume to the first page or bump the function timeout in `supabase/config.toml` to 120s.

## How scoring works

Each submitted resume goes through the edge function `supabase/functions/score-candidate`, which calls Gemini 2.5 Flash with Thinking Mode twice:

1. **Parse.** PDF or DOCX bytes are passed as multimodal input. The model returns structured JSON: name, email, phone, total years of experience, skills, companies (with title and years), education.
2. **Score.** The parsed JSON plus the job description are scored on a 5-axis rubric (skills match, years of experience, seniority level, domain fit, education). The model returns `{ score: 0–100, rationale: one sentence }`.

Both calls run with dynamic Thinking Mode (`thinkingBudget: -1`). Disabling Thinking Mode is rejected at the helper level.

## License

MIT. See [LICENSE](LICENSE).

## Contributing

Issues and pull requests are welcome. Please keep contributions focused — this project deliberately has no plugin system, no paywall, no telemetry. Run `pnpm typecheck && pnpm lint && pnpm test` before opening a PR.
