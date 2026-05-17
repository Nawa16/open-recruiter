import { notFound } from "next/navigation";
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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-12">
      <header className="border-b border-[color:var(--color-border)] pb-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-accent)]">
          open-recruiter
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {job.title}
        </h1>
      </header>

      <section className="mt-8 grid gap-10 lg:grid-cols-[1fr_minmax(0,360px)]">
        <article className="whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--color-muted-foreground)]">
          {job.description}
        </article>
        {job.accepting ? (
          <ApplyForm slug={job.slug} jobId={job.id} />
        ) : (
          <ClosedCard cap={job.max_applications} />
        )}
      </section>

      <footer className="mt-auto pt-12 text-xs text-[color:var(--color-muted-foreground)]">
        Resumes are parsed and scored by Gemini 2.5 Flash with Thinking Mode.
      </footer>
    </main>
  );
}

function ClosedCard({ cap }: { cap: number }) {
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] p-6">
      <h2 className="text-sm font-semibold">Applications closed</h2>
      <p className="mt-2 text-sm text-[color:var(--color-muted-foreground)]">
        This role has reached its cap of {cap} application
        {cap === 1 ? "" : "s"}. The hiring manager will reopen submissions if
        they raise the cap.
      </p>
    </div>
  );
}
