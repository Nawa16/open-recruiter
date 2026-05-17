import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase";
import { createJob } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Search = Promise<{ error?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { error } = await searchParams;
  const supabase = await createServerSupabase();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, slug, title, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,360px)]">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
          One row per role. Open a job to see ranked candidates.
        </p>
        <div className="mt-6 rounded-lg border border-[color:var(--color-border)]">
          {jobs && jobs.length > 0 ? (
            <ul className="divide-y divide-[color:var(--color-border)]">
              {jobs.map((j) => (
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
                  <Link
                    href={`/dashboard/${j.id}`}
                    className="text-xs text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
                  >
                    Open →
                  </Link>
                </li>
              ))}
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
          Paste a title and full job description.
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
