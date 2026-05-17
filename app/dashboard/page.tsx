import Link from "next/link";
import { ArrowUpRight, Briefcase, CheckCircle2, PlusCircle, Users } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase";
import { createJob } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DEFAULT_APPLICATION_CAP,
  MIN_APPLICATION_CAP,
  MAX_APPLICATION_CAP,
} from "@/lib/schemas";

type Search = Promise<{ error?: string; deleted?: string }>;

type JobRow = {
  id: string;
  slug: string;
  title: string;
  max_applications: number;
  candidates: { count: number }[] | null;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { error, deleted } = await searchParams;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("jobs")
    .select("id, slug, title, max_applications, candidates(count)")
    .order("created_at", { ascending: false });
  const jobs = (data ?? []) as JobRow[];
  const totalCandidates = jobs.reduce(
    (sum, j) => sum + (j.candidates?.[0]?.count ?? 0),
    0,
  );

  return (
    <div className="space-y-10">
      {deleted ? (
        <div className="flex items-center gap-2 rounded-lg border border-[color:var(--color-success)]/30 bg-[color:var(--color-success-soft)] px-4 py-3 text-sm text-[color:var(--color-success)]">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Job and all associated resumes deleted.
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Briefcase className="h-4 w-4" aria-hidden />}
          label="Open jobs"
          value={jobs.length}
        />
        <StatCard
          icon={<Users className="h-4 w-4" aria-hidden />}
          label="Total candidates"
          value={totalCandidates}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
          label="Powered by"
          value="Gemini 2.5 Flash · Thinking"
          valueSize="sm"
        />
      </section>

      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,380px)]">
        <section>
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
            <span className="text-xs text-[color:var(--color-muted-foreground)]">
              Newest first
            </span>
          </div>
          <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
            One row per role. Open a job to see ranked candidates, edit it, or
            delete it.
          </p>
          <div className="mt-6 overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[var(--shadow-soft)]">
            {jobs.length > 0 ? (
              <ul className="divide-y divide-[color:var(--color-border)]">
                {jobs.map((j) => {
                  const count = j.candidates?.[0]?.count ?? 0;
                  const full = count >= j.max_applications;
                  return (
                    <li key={j.id}>
                      <Link
                        href={`/dashboard/${j.id}`}
                        className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[color:var(--color-primary-soft)]/60 focus-visible:bg-[color:var(--color-primary-soft)] focus-visible:outline-none"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold">
                              {j.title}
                            </span>
                            {full ? (
                              <Badge variant="destructive">Cap reached</Badge>
                            ) : null}
                          </div>
                          <span className="mt-1 inline-block font-mono text-xs text-[color:var(--color-muted-foreground)]">
                            /apply/{j.slug}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs tabular-nums">
                            <span
                              className={
                                full
                                  ? "font-semibold text-[color:var(--color-destructive)]"
                                  : "font-semibold text-[color:var(--color-foreground)]"
                              }
                            >
                              {count}
                            </span>
                            <span className="text-[color:var(--color-muted-foreground)]">
                              {" "}
                              / {j.max_applications}
                            </span>
                          </span>
                          <ArrowUpRight
                            className="h-4 w-4 text-[color:var(--color-muted-foreground)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[color:var(--color-khuzama-700)] dark:group-hover:text-[color:var(--color-khuzama-300)]"
                            aria-hidden
                          />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[color:var(--color-primary-soft)] text-[color:var(--color-khuzama-700)] dark:text-[color:var(--color-khuzama-300)]">
                  <Briefcase className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-3 text-sm font-semibold">No jobs yet</h3>
                <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
                  Create your first job on the right. You&apos;ll get a public
                  apply link instantly.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside>
          <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[color:var(--color-primary-soft)] text-[color:var(--color-khuzama-700)] dark:text-[color:var(--color-khuzama-300)]">
                <PlusCircle className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-semibold leading-none">New job</h2>
                <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
                  Paste a title and full description. Set a cap.
                </p>
              </div>
            </div>
            <form action={createJob} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  maxLength={200}
                  placeholder="Senior Backend Engineer"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Job description</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  maxLength={20000}
                  rows={10}
                  placeholder="Paste the full JD here…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxApplications">Max applications</Label>
                <Input
                  id="maxApplications"
                  name="maxApplications"
                  type="number"
                  required
                  min={MIN_APPLICATION_CAP}
                  max={MAX_APPLICATION_CAP}
                  defaultValue={DEFAULT_APPLICATION_CAP}
                />
                <p className="text-xs text-[color:var(--color-muted-foreground)]">
                  Once this cap is reached, the public apply page closes
                  automatically. You can raise or lower it later.
                </p>
              </div>
              <Button type="submit" className="w-full">
                Create job
              </Button>
              {error ? (
                <p className="rounded-md bg-[color:var(--color-destructive-soft)] px-3 py-2 text-xs text-[color:var(--color-destructive)]">
                  {decodeURIComponent(error)}
                </p>
              ) : null}
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueSize = "lg",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueSize?: "sm" | "lg";
}) {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-[color:var(--color-primary-soft)] text-[color:var(--color-khuzama-700)] dark:text-[color:var(--color-khuzama-300)]">
          {icon}
        </span>
        {label}
      </div>
      <div
        className={
          "mt-2 font-semibold tracking-tight tabular-nums " +
          (valueSize === "lg" ? "text-2xl" : "text-sm")
        }
      >
        {value}
      </div>
    </div>
  );
}
