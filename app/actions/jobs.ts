"use server";

import { customAlphabet } from "nanoid";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase";
import { newJobSchema } from "@/lib/schemas";

const slugid = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  10,
);

export async function createJob(formData: FormData) {
  const parsed = newJobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    redirect("/dashboard?error=invalid-input");
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      slug: slugid(),
      title: parsed.data.title,
      description: parsed.data.description,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data)
    redirect(
      `/dashboard?error=${encodeURIComponent(error?.message ?? "insert-failed")}`,
    );

  revalidatePath("/dashboard");
  redirect(`/dashboard/${data.id}`);
}
