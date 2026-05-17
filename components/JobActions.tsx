"use client";

import * as React from "react";
import { Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateJob, deleteJob } from "@/app/actions/jobs";
import {
  MAX_APPLICATION_CAP,
  MIN_APPLICATION_CAP,
} from "@/lib/schemas";

type Mode = "view" | "edit" | "confirm-delete";

export function JobActions({
  jobId,
  defaultTitle,
  defaultDescription,
  defaultCap,
  currentCount,
}: {
  jobId: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultCap: number;
  currentCount: number;
}) {
  const [mode, setMode] = React.useState<Mode>("view");
  const [pending, startTransition] = React.useTransition();

  if (mode === "view") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMode("edit")}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
        </Button>
        <Button
          type="button"
          variant="destructive-outline"
          size="sm"
          onClick={() => setMode("confirm-delete")}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Delete job
        </Button>
      </div>
    );
  }

  if (mode === "confirm-delete") {
    return (
      <form
        action={(fd) => {
          fd.set("jobId", jobId);
          startTransition(() => deleteJob(fd));
        }}
        className="flex flex-col gap-3 rounded-xl border border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive-soft)] p-4 sm:flex-row sm:items-center"
      >
        <p className="flex-1 text-sm text-[color:var(--color-foreground)]">
          Delete this job and every candidate, resume, and score under it.{" "}
          <span className="font-medium">This cannot be undone.</span>
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => setMode("view")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            )}
            Yes, delete
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form
      action={(fd) => {
        fd.set("jobId", jobId);
        startTransition(() => updateJob(fd));
      }}
      className="space-y-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Edit job</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Cancel"
          onClick={() => setMode("view")}
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          name="title"
          required
          maxLength={200}
          defaultValue={defaultTitle}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-description">Job description</Label>
        <Textarea
          id="edit-description"
          name="description"
          required
          maxLength={20000}
          rows={8}
          defaultValue={defaultDescription}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-maxApplications">Max applications</Label>
        <Input
          id="edit-maxApplications"
          name="maxApplications"
          type="number"
          required
          min={Math.max(MIN_APPLICATION_CAP, currentCount)}
          max={MAX_APPLICATION_CAP}
          defaultValue={defaultCap}
        />
        <p className="text-xs text-[color:var(--color-muted-foreground)]">
          {currentCount} application{currentCount === 1 ? "" : "s"} received so
          far. The cap cannot be lowered below this number.
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => setMode("view")}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Save className="h-3.5 w-3.5" aria-hidden />
          )}
          Save changes
        </Button>
      </div>
    </form>
  );
}
