import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
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

      <section className="mt-24 max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">
          A free, self-hosted recruiter portal.
        </h1>
        <p className="mt-4 text-base text-[color:var(--color-muted-foreground)]">
          Paste a job description, share a public apply link, and rank applicants
          automatically. Resumes are parsed and scored 0–100 against the JD by
          Gemini 2.5 Flash with Thinking Mode.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-[color:var(--color-accent)] px-4 py-2 text-sm font-medium text-[color:var(--color-accent-foreground)] hover:opacity-90"
          >
            Sign in
          </Link>
          <a
            href="#how-it-works"
            className="rounded-md border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[color:var(--color-muted)]"
          >
            How it works
          </a>
        </div>
      </section>

      <section id="how-it-works" className="mt-24 grid gap-8 sm:grid-cols-3">
        <div>
          <div className="text-xs font-semibold text-[color:var(--color-accent)]">
            01
          </div>
          <h2 className="mt-2 text-sm font-semibold">Paste a JD</h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
            Sign in, create a job, get a shareable apply link.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold text-[color:var(--color-accent)]">
            02
          </div>
          <h2 className="mt-2 text-sm font-semibold">Candidates apply</h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
            Name, email, phone, and a PDF or DOCX resume. No account needed.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold text-[color:var(--color-accent)]">
            03
          </div>
          <h2 className="mt-2 text-sm font-semibold">Ranked list</h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
            Each resume is parsed and scored by Gemini 2.5 Flash with Thinking
            Mode and added to your dashboard.
          </p>
        </div>
      </section>

      <footer className="mt-auto pt-24 text-xs text-[color:var(--color-muted-foreground)]">
        MIT licensed. Bring your own Supabase project and Gemini API key.
      </footer>
    </main>
  );
}
