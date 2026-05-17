import { redirect } from "next/navigation";
import Link from "next/link";
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
      <header className="flex items-center justify-between border-b border-[color:var(--color-border)] pb-4">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          open-recruiter
        </Link>
        <div className="flex items-center gap-3 text-sm text-[color:var(--color-muted-foreground)]">
          <span className="hidden sm:inline">{user.email}</span>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="rounded-md border border-[color:var(--color-border)] px-2.5 py-1 text-xs hover:bg-[color:var(--color-muted)]"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mt-8 flex-1">{children}</main>
    </div>
  );
}
