import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Sparkles } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
      <header className="flex items-center justify-between border-b border-[color:var(--color-border)] pb-5">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] shadow-[var(--shadow-soft)] transition-transform group-hover:rotate-[-4deg]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          </span>
          open-recruiter
        </Link>
        <div className="flex items-center gap-3 text-sm text-[color:var(--color-muted-foreground)]">
          <span className="hidden sm:inline">{user.email}</span>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2.5 py-1 text-xs font-medium hover:border-[color:var(--color-khuzama-300)] hover:bg-[color:var(--color-primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]/40"
            >
              <LogOut className="h-3 w-3" aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mt-8 flex-1">{children}</main>
    </div>
  );
}
