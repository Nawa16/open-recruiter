"use server";

import { customAlphabet } from "nanoid";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase";
import { editJobSchema, newJobSchema } from "@/lib/schemas";

const slugid = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  10,
);

export async function createJob(formData: FormData) {
  const parsed = newJobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    maxApplications: formData.get("maxApplications"),
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
      max_applications: parsed.data.maxApplications,
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

export async function updateJob(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) redirect("/dashboard?error=missing-job");

  const parsed = editJobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    maxApplications: formData.get("maxApplications"),
  });
  if (!parsed.success) {
    redirect(`/dashboard/${jobId}?error=invalid-input`);
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("jobs")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      max_applications: parsed.data.maxApplications,
    })
    .eq("id", jobId);

  if (error)
    redirect(`/dashboard/${jobId}?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${jobId}`);
  redirect(`/dashboard/${jobId}?saved=1`);
}

export async function deleteJob(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) redirect("/dashboard?error=missing-job");

  const supabase = await createServerSupabase();

  const { data: candidates } = await supabase
    .from("candidates")
    .select("resume_path")
    .eq("job_id", jobId);
  const paths = (candidates ?? [])
    .map((c) => c.resume_path)
    .filter((p): p is string => typeof p === "string" && p.length > 0);

  if (paths.length > 0) {
    await supabase.storage.from("resumes").remove(paths);
  }

  const { error } = await supabase.from("jobs").delete().eq("id", jobId);
  if (error)
    redirect(`/dashboard/${jobId}?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard");
  redirect("/dashboard?deleted=1");
}
