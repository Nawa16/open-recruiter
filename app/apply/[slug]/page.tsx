import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase";
import { ApplyForm } from "./ApplyForm";

type Params = Promise<{ slug: string }>;

export default async function ApplyPage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc("get_job_by_slug", { p_slug: slug });
  const job = Array.isArray(data) ? data[0] : null;
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
        <ApplyForm slug={job.slug} jobId={job.id} />
      </section>

      <footer className="mt-auto pt-12 text-xs text-[color:var(--color-muted-foreground)]">
        Resumes are parsed and scored by Gemini 2.5 Flash with Thinking Mode.
      </footer>
    </main>
  );
}
