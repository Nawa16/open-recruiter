import Link from "next/link";
import { ArrowRight, Lock, Github, Sparkles } from "lucide-react";
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
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] shadow-[var(--shadow-soft)] transition-transform group-hover:rotate-[-4deg]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          </span>
          open-recruiter
        </Link>
        <a
          href="https://github.com/Nawa16/open-recruiter"
          className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
          target="_blank"
          rel="noreferrer"
        >
          <Github className="h-4 w-4" aria-hidden />
          GitHub
        </a>
      </header>

      <section className="mt-24 grid items-start gap-16 lg:grid-cols-[1.05fr_minmax(0,420px)]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-primary-soft)] px-3 py-1 text-xs font-medium text-[color:var(--color-khuzama-700)] dark:text-[color:var(--color-khuzama-300)]">
            <Sparkles className="h-3 w-3" aria-hidden />
            Gemini 2.5 Flash with Thinking Mode
          </span>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight leading-[1.05] text-[color:var(--color-foreground)] sm:text-6xl">
            Hire faster with a portal
            <br />
            <span className="bg-gradient-to-r from-[color:var(--color-khuzama-600)] via-[color:var(--color-khuzama-500)] to-[color:var(--color-khuzama-400)] bg-clip-text text-transparent">
              built around your taste.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[color:var(--color-muted-foreground)]">
            Paste a job description, share a public apply link, and rank
            applicants automatically. Resumes are parsed and scored 0–100
            against the JD by Gemini 2.5 Flash with Thinking Mode.
          </p>
          <ul className="mt-8 grid gap-3 text-sm text-[color:var(--color-muted-foreground)] sm:grid-cols-2">
            <Bullet>MIT-licensed. No paywalls, no telemetry.</Bullet>
            <Bullet>One recruiter account, provisioned from env.</Bullet>
            <Bullet>Per-job application cap, enforced at the database.</Bullet>
            <Bullet>One-click resume review via signed URLs.</Bullet>
          </ul>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-[color:var(--color-khuzama-200)] to-transparent opacity-70 blur-2xl"
          />
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-7 shadow-[var(--shadow-lift)]">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--color-primary-soft)] text-[color:var(--color-khuzama-700)] dark:text-[color:var(--color-khuzama-300)]">
                <Lock className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-base font-semibold leading-none">
                  Sign in
                </h2>
                <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
                  Email and password. No public signup.
                </p>
              </div>
            </div>
            <form action={signInWithPassword} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="recruiter@company.com"
                />
              </div>
              <div className="space-y-1.5">
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
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
              {error ? (
                <p className="rounded-md bg-[color:var(--color-destructive-soft)] px-3 py-2 text-xs text-[color:var(--color-destructive)]">
                  {decodeURIComponent(error)}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mt-28 grid gap-6 sm:grid-cols-3">
        <Step
          n="01"
          title="Paste a JD"
          body="Sign in, create a job, set an application cap. You get a shareable apply link instantly."
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
        <Link href="/dashboard" className="hover:text-[color:var(--color-foreground)]">
          Go to dashboard →
        </Link>
      </footer>
    </main>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        aria-hidden
        className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-[color:var(--color-khuzama-500)]"
      />
      {children}
    </li>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
      <div className="text-xs font-semibold tracking-wider text-[color:var(--color-khuzama-700)] dark:text-[color:var(--color-khuzama-300)]">
        {n}
      </div>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-muted-foreground)]">
        {body}
      </p>
    </div>
  );
}
