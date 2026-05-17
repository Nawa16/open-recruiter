"use client";

import * as React from "react";
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
            size="icon"
            onClick={dec}
            disabled={n <= min}
            aria-label="Show fewer"
          >
            −
          </Button>
          <span
            className="min-w-[2ch] text-center font-medium tabular-nums"
            data-testid="topn-value"
          >
            {Math.min(n, total)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={inc}
            disabled={n >= max}
            aria-label="Show more"
          >
            +
          </Button>
          <span className="text-[color:var(--color-muted-foreground)]">
            of {total} candidates
          </span>
        </div>
      </div>
      <div className="space-y-2">{visible}</div>
    </div>
  );
}
