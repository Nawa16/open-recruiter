export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const email = process.env.RECRUITER_EMAIL?.trim();
  const password = process.env.RECRUITER_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!email || !password || !url || !serviceRole) return;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(url, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw listErr;

    const existing = list.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (existing) {
      const { error: updErr } = await admin.auth.admin.updateUserById(
        existing.id,
        { password, email_confirm: true },
      );
      if (updErr) throw updErr;
    } else {
      const { error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) throw createErr;
    }

    console.log(
      `[open-recruiter] Recruiter ${email} provisioned. Scoring uses Gemini 2.5 Flash with Thinking Mode.`,
    );
  } catch (err) {
    console.error(
      "[open-recruiter] Could not provision recruiter from env vars:",
      err instanceof Error ? err.message : err,
    );
  }
}
