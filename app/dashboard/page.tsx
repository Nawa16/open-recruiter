import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase";
import { createJob } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_APPLICATION_CAP,
  MIN_APPLICATION_CAP,
  MAX_APPLICATION_CAP,
} from "@/lib/schemas";

type Search = Promise<{ error?: string }>;

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
  const { error } = await searchParams;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("jobs")
    .select("id, slug, title, max_applications, candidates(count)")
    .order("created_at", { ascending: false });
  const jobs = (data ?? []) as JobRow[];

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,360px)]">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
          One row per role. Open a job to see ranked candidates.
        </p>
        <div className="mt-6 rounded-lg border border-[color:var(--color-border)]">
          {jobs.length > 0 ? (
            <ul className="divide-y divide-[color:var(--color-border)]">
              {jobs.map((j) => {
                const count = j.candidates?.[0]?.count ?? 0;
                const full = count >= j.max_applications;
                return (
                  <li
                    key={j.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/${j.id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {j.title}
                      </Link>
                      <span className="text-xs text-[color:var(--color-muted-foreground)]">
                        /apply/{j.slug}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs tabular-nums text-[color:var(--color-muted-foreground)]">
                        <span
                          className={
                            full ? "text-[color:var(--color-destructive)]" : ""
                          }
                        >
                          {count}
                        </span>
                        <span> / {j.max_applications}</span>
                      </span>
                      <Link
                        href={`/dashboard/${j.id}`}
                        className="text-xs text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
                      >
                        Open →
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-12 text-center text-sm text-[color:var(--color-muted-foreground)]">
              No jobs yet. Create one on the right.
            </div>
          )}
        </div>
      </section>

      <aside>
        <h2 className="text-sm font-semibold">New job</h2>
        <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
          Paste a title and full job description. Set the maximum number of
          applications you want to collect.
        </p>
        <form action={createJob} className="mt-4 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              maxLength={200}
              placeholder="Senior Backend Engineer"
            />
          </div>
          <div className="space-y-1">
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
          <div className="space-y-1">
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
              automatically.
            </p>
          </div>
          <Button type="submit" className="w-full">
            Create job
          </Button>
          {error ? (
            <p className="text-xs text-[color:var(--color-destructive)]">
              {error}
            </p>
          ) : null}
        </form>
      </aside>
    </div>
  );
}
