"use client";

import * as React from "react";
import { CopyButton } from "@/components/CopyButton";

export function ShareUrl({ path }: { path: string }) {
  const [absolute, setAbsolute] = React.useState(path);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setAbsolute(window.location.origin + path);
    }
  }, [path]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 truncate rounded-lg bg-[color:var(--color-muted)] px-3 py-2 font-mono text-xs text-[color:var(--color-foreground)]">
        {absolute}
      </div>
      <CopyButton value={absolute} label="Copy apply link" />
    </div>
  );
}
