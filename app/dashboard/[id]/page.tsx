import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase";
import { TopNStepper } from "@/components/TopNStepper";

type Params = Promise<{ id: string }>;

export default async function JobDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, slug, title, description, created_at")
    .eq("id", id)
    .single();
  if (!job) notFound();

  const { data: candidates } = await supabase
    .from("candidates")
    .select(
      "id, full_name, email, phone, score, rationale, status, created_at",
    )
    .eq("job_id", id)
    .order("score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const rows = candidates ?? [];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--color-muted-foreground)]">
            {job.description}
          </p>
        </div>
        <ShareCard slug={job.slug} />
      </header>

      <section>
        <h2 className="text-sm font-semibold">
          Candidates{" "}
          <span className="text-[color:var(--color-muted-foreground)]">
            · {rows.length}
          </span>
        </h2>
        {rows.length === 0 ? (
          <div className="mt-4 rounded-lg border border-[color:var(--color-border)] px-4 py-12 text-center text-sm text-[color:var(--color-muted-foreground)]">
            No applicants yet. Share the apply link to start collecting resumes.
          </div>
        ) : (
          <div className="mt-4">
            <TopNStepper initialN={10}>
              {rows.map((c) => (
                <CandidateRow key={c.id} c={c} />
              ))}
            </TopNStepper>
          </div>
        )}
      </section>
    </div>
  );
}

function ShareCard({ slug }: { slug: string }) {
  const path = `/apply/${slug}`;
  return (
    <div className="w-full max-w-sm rounded-lg border border-[color:var(--color-border)] p-4">
      <div className="text-xs font-semibold text-[color:var(--color-muted-foreground)]">
        Share with candidates
      </div>
      <div className="mt-2 break-all rounded-md bg-[color:var(--color-muted)] px-3 py-2 font-mono text-xs">
        {path}
      </div>
      <p className="mt-2 text-xs text-[color:var(--color-muted-foreground)]">
        Anyone with this link can submit a resume. Resumes are scored 0–100 by
        Gemini 2.5 Flash with Thinking Mode.
      </p>
    </div>
  );
}

type CandidateRowProps = {
  c: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    score: number | null;
    rationale: string | null;
    status: string;
    created_at: string;
  };
};

function CandidateRow({ c }: CandidateRowProps) {
  return (
    <div
      data-testid="candidate-row"
      className="grid grid-cols-[64px_1fr] gap-4 rounded-lg border border-[color:var(--color-border)] px-4 py-3"
    >
      <div className="flex flex-col items-start">
        <span
          data-testid="candidate-score"
          className="text-xl font-semibold tabular-nums"
        >
          {c.score ?? "—"}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
          {c.status}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium">{c.full_name}</span>
          <span className="text-xs text-[color:var(--color-muted-foreground)]">
            {c.email} · {c.phone}
          </span>
        </div>
        <p
          data-testid="candidate-rationale"
          className="mt-1 text-sm text-[color:var(--color-muted-foreground)]"
        >
          {c.rationale ?? "Scoring…"}
        </p>
      </div>
    </div>
  );
}
