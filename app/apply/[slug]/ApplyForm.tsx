"use client";

import * as React from "react";
import { customAlphabet } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabase } from "@/lib/supabase";
import { candidateFormSchema, MAX_RESUME_BYTES } from "@/lib/schemas";

const fileId = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  16,
);

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ok" }
  | { kind: "closed" }
  | { kind: "error"; message: string };

function isCapReached(message: string | undefined): boolean {
  return !!message && /application cap reached/i.test(message);
}

export function ApplyForm({ slug, jobId }: { slug: string; jobId: string }) {
  const [state, setState] = React.useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = form.get("file");
    const parsed = candidateFormSchema.safeParse({
      fullName: form.get("fullName"),
      email: form.get("email"),
      phone: form.get("phone"),
      file,
    });
    if (!parsed.success) {
      setState({
        kind: "error",
        message: parsed.error.issues[0]?.message ?? "Invalid form.",
      });
      return;
    }

    setState({ kind: "submitting" });
    const supabase = createBrowserSupabase();
    const f = parsed.data.file;
    const ext = f.type === "application/pdf" ? "pdf" : "docx";
    const resumePath = `${slug}/${fileId()}.${ext}`;

    const upload = await supabase.storage
      .from("resumes")
      .upload(resumePath, f, { contentType: f.type, upsert: false });
    if (upload.error) {
      setState({ kind: "error", message: upload.error.message });
      return;
    }

    const candidateId = crypto.randomUUID();
    const insert = await supabase.from("candidates").insert({
      id: candidateId,
      job_id: jobId,
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      resume_path: resumePath,
    });
    if (insert.error) {
      if (isCapReached(insert.error.message)) {
        await supabase.storage.from("resumes").remove([resumePath]);
        setState({ kind: "closed" });
        return;
      }
      setState({ kind: "error", message: insert.error.message });
      return;
    }

    const invoked = await supabase.functions.invoke("score-candidate", {
      body: { candidate_id: candidateId },
    });
    if (invoked.error) {
      setState({
        kind: "error",
        message: `Resume uploaded, but scoring could not start: ${invoked.error.message}`,
      });
      return;
    }

    setState({ kind: "ok" });
  }

  if (state.kind === "ok") {
    return (
      <div className="rounded-lg border border-[color:var(--color-border)] p-6">
        <h2 className="text-sm font-semibold">Application received</h2>
        <p className="mt-2 text-sm text-[color:var(--color-muted-foreground)]">
          Thanks. Your resume is being scored by Gemini 2.5 Flash with Thinking
          Mode and added to the hiring manager&apos;s ranked list.
        </p>
      </div>
    );
  }

  if (state.kind === "closed") {
    return (
      <div className="rounded-lg border border-[color:var(--color-border)] p-6">
        <h2 className="text-sm font-semibold">Applications closed</h2>
        <p className="mt-2 text-sm text-[color:var(--color-muted-foreground)]">
          This role just reached its application cap while you were submitting.
          Your resume was not stored. The hiring manager will reopen submissions
          if they raise the cap.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-[color:var(--color-border)] p-6"
    >
      <h2 className="text-sm font-semibold">Apply</h2>
      <div className="space-y-1">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" required maxLength={120} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" required maxLength={40} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="file">Resume (PDF or DOCX, ≤10 MB)</Label>
        <Input
          id="file"
          name="file"
          type="file"
          required
          accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          data-max-bytes={MAX_RESUME_BYTES}
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={state.kind === "submitting"}
      >
        {state.kind === "submitting" ? "Submitting…" : "Submit application"}
      </Button>
      {state.kind === "error" ? (
        <p className="text-xs text-[color:var(--color-destructive)]">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
