import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase";
import { TopNStepper } from "@/components/TopNStepper";

type Params = Promise<{ id: string }>;

const RESUME_URL_TTL_SECONDS = 60;

export default async function JobDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, slug, title, description, max_applications, created_at")
    .eq("id", id)
    .single();
  if (!job) notFound();

  const { data: candidates } = await supabase
    .from("candidates")
    .select(
      "id, full_name, email, phone, score, rationale, status, resume_path, created_at",
    )
    .eq("job_id", id)
    .order("score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const rows = candidates ?? [];

  const signedUrls = new Map<string, string>();
  if (rows.length > 0) {
    const { data: signed } = await supabase.storage
      .from("resumes")
      .createSignedUrls(
        rows.map((c) => c.resume_path),
        RESUME_URL_TTL_SECONDS,
      );
    for (const entry of signed ?? []) {
      if (entry.path && entry.signedUrl)
        signedUrls.set(entry.path, entry.signedUrl);
    }
  }

  const total = rows.length;
  const full = total >= job.max_applications;

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--color-muted-foreground)]">
            {job.description}
          </p>
        </div>
        <ShareCard
          slug={job.slug}
          total={total}
          cap={job.max_applications}
          full={full}
        />
      </header>

      <section>
        <h2 className="text-sm font-semibold">
          Candidates{" "}
          <span className="text-[color:var(--color-muted-foreground)]">
            · {total} of {job.max_applications}
          </span>
        </h2>
        {total === 0 ? (
          <div className="mt-4 rounded-lg border border-[color:var(--color-border)] px-4 py-12 text-center text-sm text-[color:var(--color-muted-foreground)]">
            No applicants yet. Share the apply link to start collecting resumes.
          </div>
        ) : (
          <div className="mt-4">
            <TopNStepper initialN={10}>
              {rows.map((c) => (
                <CandidateRow
                  key={c.id}
                  c={c}
                  resumeUrl={signedUrls.get(c.resume_path)}
                />
              ))}
            </TopNStepper>
          </div>
        )}
      </section>
    </div>
  );
}

function ShareCard({
  slug,
  total,
  cap,
  full,
}: {
  slug: string;
  total: number;
  cap: number;
  full: boolean;
}) {
  const path = `/apply/${slug}`;
  return (
    <div className="w-full max-w-sm rounded-lg border border-[color:var(--color-border)] p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-[color:var(--color-muted-foreground)]">
          Share with candidates
        </div>
        <span
          className={
            "text-xs tabular-nums " +
            (full
              ? "text-[color:var(--color-destructive)]"
              : "text-[color:var(--color-muted-foreground)]")
          }
        >
          {total} / {cap}
        </span>
      </div>
      <div className="mt-2 break-all rounded-md bg-[color:var(--color-muted)] px-3 py-2 font-mono text-xs">
        {path}
      </div>
      <p className="mt-2 text-xs text-[color:var(--color-muted-foreground)]">
        {full
          ? "The application cap has been reached. The public apply page now shows that applications are closed."
          : "Anyone with this link can submit a resume. Resumes are scored 0–100 by Gemini 2.5 Flash with Thinking Mode."}
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
    resume_path: string;
    created_at: string;
  };
  resumeUrl: string | undefined;
};

function CandidateRow({ c, resumeUrl }: CandidateRowProps) {
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
        <div className="mt-2">
          {resumeUrl ? (
            <a
              data-testid="candidate-resume"
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-[color:var(--color-accent)] hover:underline"
            >
              View resume →
            </a>
          ) : (
            <span className="text-xs text-[color:var(--color-muted-foreground)]">
              Resume unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
