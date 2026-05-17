import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Mail,
  Phone,
  Users,
} from "lucide-react";
import { createServerSupabase } from "@/lib/supabase";
import { TopNStepper } from "@/components/TopNStepper";
import { ShareUrl } from "@/components/ShareUrl";
import { JobActions } from "@/components/JobActions";
import { Badge } from "@/components/ui/badge";

type Params = Promise<{ id: string }>;
type Search = Promise<{ saved?: string; error?: string }>;

const RESUME_URL_TTL_SECONDS = 60;

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { id } = await params;
  const { saved, error } = await searchParams;
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
  const cap = job.max_applications;
  const full = total >= cap;
  const remaining = Math.max(0, cap - total);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          All jobs
        </Link>
        <JobActions
          jobId={job.id}
          defaultTitle={job.title}
          defaultDescription={job.description}
          defaultCap={cap}
          currentCount={total}
        />
      </div>

      {saved ? (
        <div className="flex items-center gap-2 rounded-lg border border-[color:var(--color-success)]/30 bg-[color:var(--color-success-soft)] px-4 py-3 text-sm text-[color:var(--color-success)]">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Changes saved.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive-soft)] px-4 py-3 text-sm text-[color:var(--color-destructive)]">
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <header className="grid gap-6 lg:grid-cols-[1fr_minmax(0,360px)] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {job.title}
            </h1>
            {full ? (
              <Badge variant="destructive">Applications closed</Badge>
            ) : (
              <Badge variant="default">
                {remaining} slot{remaining === 1 ? "" : "s"} left
              </Badge>
            )}
          </div>
          <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--color-muted-foreground)]">
            {job.description}
          </p>
        </div>
        <ShareCard slug={job.slug} total={total} cap={cap} full={full} />
      </header>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Candidates
            <span className="ml-2 text-sm font-normal text-[color:var(--color-muted-foreground)]">
              · {total} of {cap}
            </span>
          </h2>
        </div>
        {total === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-muted)]/60 px-6 py-16 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[color:var(--color-primary-soft)] text-[color:var(--color-khuzama-700)] dark:text-[color:var(--color-khuzama-300)]">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="mt-3 text-sm font-semibold">No applicants yet</h3>
            <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
              Share the apply link above to start collecting resumes.
            </p>
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
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
          Share with candidates
        </div>
        <span
          className={
            "text-xs font-semibold tabular-nums " +
            (full
              ? "text-[color:var(--color-destructive)]"
              : "text-[color:var(--color-khuzama-700)] dark:text-[color:var(--color-khuzama-300)]")
          }
        >
          {total} / {cap}
        </span>
      </div>
      <div className="mt-3">
        <ShareUrl path={path} />
      </div>
      <p className="mt-3 text-xs text-[color:var(--color-muted-foreground)]">
        {full
          ? "Cap reached. The apply page is closed. Raise the cap with the Edit button to reopen."
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

function scoreTone(score: number | null): {
  bg: string;
  text: string;
  ring: string;
} {
  if (score == null)
    return {
      bg: "bg-[color:var(--color-muted)]",
      text: "text-[color:var(--color-muted-foreground)]",
      ring: "ring-[color:var(--color-border)]",
    };
  if (score >= 80)
    return {
      bg: "bg-[color:var(--color-khuzama-700)]",
      text: "text-white",
      ring: "ring-[color:var(--color-khuzama-700)]/30",
    };
  if (score >= 60)
    return {
      bg: "bg-[color:var(--color-khuzama-500)]",
      text: "text-white",
      ring: "ring-[color:var(--color-khuzama-500)]/30",
    };
  if (score >= 40)
    return {
      bg: "bg-[color:var(--color-khuzama-200)]",
      text: "text-[color:var(--color-khuzama-900)]",
      ring: "ring-[color:var(--color-khuzama-300)]/40",
    };
  return {
    bg: "bg-[color:var(--color-muted)]",
    text: "text-[color:var(--color-foreground)]",
    ring: "ring-[color:var(--color-border)]",
  };
}

function CandidateRow({ c, resumeUrl }: CandidateRowProps) {
  const tone = scoreTone(c.score);
  return (
    <div
      data-testid="candidate-row"
      className="grid grid-cols-[auto_1fr] gap-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-4 shadow-[var(--shadow-soft)] transition-colors hover:border-[color:var(--color-khuzama-300)]"
    >
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={
            "grid h-14 w-14 place-items-center rounded-full font-semibold tabular-nums ring-4 " +
            tone.bg +
            " " +
            tone.text +
            " " +
            tone.ring
          }
        >
          <span data-testid="candidate-score" className="text-lg">
            {c.score ?? "—"}
          </span>
        </div>
        <Badge variant={c.status === "scored" ? "success" : "muted"}>
          {c.status}
        </Badge>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="truncate text-base font-semibold">
            {c.full_name}
          </span>
          {resumeUrl ? (
            <a
              data-testid="candidate-resume"
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-primary-soft)] px-2.5 py-1 text-xs font-medium text-[color:var(--color-khuzama-700)] hover:bg-[color:var(--color-khuzama-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]/40 dark:text-[color:var(--color-khuzama-300)]"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden />
              View resume
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          ) : (
            <span className="text-xs text-[color:var(--color-muted-foreground)]">
              Resume unavailable
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[color:var(--color-muted-foreground)]">
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3 w-3" aria-hidden />
            {c.email}
          </span>
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3 w-3" aria-hidden />
            {c.phone}
          </span>
        </div>
        <p
          data-testid="candidate-rationale"
          className="mt-2 text-sm leading-relaxed text-[color:var(--color-foreground)]"
        >
          {c.rationale ?? (
            <span className="text-[color:var(--color-muted-foreground)]">
              Scoring with Gemini 2.5 Flash with Thinking Mode…
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
