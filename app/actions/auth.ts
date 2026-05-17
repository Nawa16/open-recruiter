"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase";
import { signInSchema } from "@/lib/schemas";

export async function signInWithPassword(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/?error=missing-fields");

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect(`/?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/");
}
