"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopNStepper({
  children,
  initialN = 10,
  step = 5,
  min = 5,
}: {
  children: React.ReactNode;
  initialN?: number;
  step?: number;
  min?: number;
}) {
  const items = React.Children.toArray(children);
  const total = items.length;
  const max = Math.max(total, min);
  const [n, setN] = React.useState(Math.min(initialN, max));

  const visible = items.slice(0, Math.min(n, total));
  const dec = () => setN((v) => Math.max(min, v - step));
  const inc = () => setN((v) => Math.min(max, v + step));
  const shown = Math.min(n, total);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[color:var(--color-muted-foreground)]">
            Show top
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={dec}
            disabled={n <= min}
            aria-label="Show fewer"
          >
            <Minus className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <span
            className="min-w-[2ch] text-center font-semibold tabular-nums text-[color:var(--color-foreground)]"
            data-testid="topn-value"
          >
            {shown}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={inc}
            disabled={n >= max}
            aria-label="Show more"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <span className="text-[color:var(--color-muted-foreground)]">
            of {total} candidate{total === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      <div className="space-y-2.5">{visible}</div>
    </div>
  );
}
