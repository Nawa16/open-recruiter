import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword } from "@/app/actions/auth";

type Search = Promise<{ error?: string }>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-12">
      <header className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-tight">
          open-recruiter
        </span>
        <a
          href="https://github.com/open-recruiter/open-recruiter"
          className="text-sm text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </header>

      <section className="mt-20 grid gap-12 lg:grid-cols-2 lg:items-start">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight leading-tight">
            A free, self-hosted recruiter portal.
          </h1>
          <p className="mt-4 text-base text-[color:var(--color-muted-foreground)]">
            Paste a job description, share a public apply link, and rank
            applicants automatically. Resumes are parsed and scored 0–100 by
            Gemini 2.5 Flash with Thinking Mode.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-[color:var(--color-muted-foreground)]">
            <li>— MIT-licensed. No paywalls, no telemetry.</li>
            <li>— Recruiter account provisioned from environment variables.</li>
            <li>— Deploy on Vercel Hobby or any Node 20+ host.</li>
          </ul>
        </div>

        <div className="rounded-lg border border-[color:var(--color-border)] p-6">
          <h2 className="text-sm font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
            Email and password. No public signup.
          </p>
          <form action={signInWithPassword} className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
            {error ? (
              <p className="text-xs text-[color:var(--color-destructive)]">
                {error}
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <section id="how-it-works" className="mt-24 grid gap-8 sm:grid-cols-3">
        <Step
          n="01"
          title="Paste a JD"
          body="Sign in, create a job with an application cap, get a shareable apply link."
        />
        <Step
          n="02"
          title="Candidates apply"
          body="Name, email, phone, and a PDF or DOCX resume. No account needed. Cap closes new submissions automatically."
        />
        <Step
          n="03"
          title="Ranked list"
          body="Each resume is parsed and scored by Gemini 2.5 Flash with Thinking Mode and added to your dashboard."
        />
      </section>

      <footer className="mt-auto pt-24 flex items-center justify-between text-xs text-[color:var(--color-muted-foreground)]">
        <span>MIT licensed.</span>
        <Link href="/dashboard">Go to dashboard →</Link>
      </footer>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-[color:var(--color-accent)]">
        {n}
      </div>
      <h3 className="mt-2 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
        {body}
      </p>
    </div>
  );
}
