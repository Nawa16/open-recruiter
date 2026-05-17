import { notFound } from "next/navigation";
import { Lock, Sparkles } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase";
import { ApplyForm } from "./ApplyForm";

type Params = Promise<{ slug: string }>;

type JobRpcRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  max_applications: number;
  current_count: number;
  accepting: boolean;
};

export default async function ApplyPage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc("get_job_by_slug", { p_slug: slug });
  const job = (Array.isArray(data) ? data[0] : null) as JobRpcRow | null;
  if (!job) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-10">
      <header className="border-b border-[color:var(--color-border)] pb-7">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-[color:var(--color-muted-foreground)]">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] shadow-[var(--shadow-soft)]">
            <Sparkles className="h-3 w-3" aria-hidden />
          </span>
          open-recruiter
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {job.title}
        </h1>
        <p className="mt-2 text-xs text-[color:var(--color-muted-foreground)]">
          {job.accepting
            ? `Accepting applications · ${job.current_count} of ${job.max_applications} so far.`
            : "Applications closed."}
        </p>
      </header>

      <section className="mt-10 grid gap-10 lg:grid-cols-[1fr_minmax(0,380px)] lg:items-start">
        <article className="whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--color-foreground)]">
          {job.description}
        </article>
        {job.accepting ? (
          <ApplyForm slug={job.slug} jobId={job.id} />
        ) : (
          <ClosedCard cap={job.max_applications} />
        )}
      </section>

      <footer className="mt-auto pt-12 flex items-center gap-2 text-xs text-[color:var(--color-muted-foreground)]">
        <Sparkles className="h-3 w-3" aria-hidden />
        Resumes are parsed and scored by Gemini 2.5 Flash with Thinking Mode.
      </footer>
    </main>
  );
}

function ClosedCard({ cap }: { cap: number }) {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--color-primary-soft)] text-[color:var(--color-khuzama-700)] dark:text-[color:var(--color-khuzama-300)]">
        <Lock className="h-4 w-4" aria-hidden />
      </span>
      <h2 className="mt-3 text-base font-semibold">Applications closed</h2>
      <p className="mt-2 text-sm text-[color:var(--color-muted-foreground)]">
        This role has reached its cap of {cap} application
        {cap === 1 ? "" : "s"}. The hiring manager will reopen submissions if
        they raise the cap.
      </p>
    </div>
  );
}
