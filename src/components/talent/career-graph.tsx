import { ArrowRight } from "lucide-react";

import type { RoleMatch } from "@/lib/talent";
import { Chip } from "@/components/talent/primitives";
import { cn } from "@/lib/utils";

/**
 * A branching view from the person's current role to the internal destinations
 * their evidence points at. Selecting a branch drives the roadmap below it.
 */
export function CareerGraph({
  currentRole,
  branches,
  selectedId,
  onSelect,
}: {
  currentRole: string;
  branches: RoleMatch[];
  selectedId: string | null;
  onSelect: (roleId: string) => void;
}) {
  return (
    <div className="panel p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="shrink-0">
          <p className="eyebrow">Current role</p>
          <p className="mt-1 text-base font-semibold">{currentRole}</p>
        </div>

        <ArrowRight aria-hidden className="hidden size-4 shrink-0 text-muted-foreground lg:block" />

        <div className="relative flex-1 space-y-2 lg:pl-6">
          <span
            aria-hidden
            className="absolute left-0 top-4 hidden h-[calc(100%-2rem)] w-px bg-border lg:block"
          />
          {branches.map((branch) => {
            const selected = branch.role.id === selectedId;
            return (
              <button
                key={branch.role.id}
                type="button"
                onClick={() => onSelect(branch.role.id)}
                className={cn(
                  "relative flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                  selected ? "border-primary bg-primary-soft" : "border-border hover:bg-accent",
                )}
              >
                <span
                  aria-hidden
                  className="absolute -left-6 top-1/2 hidden h-px w-6 bg-border lg:block"
                />
                <span className="text-sm font-semibold">{branch.role.title}</span>
                <span className="flex items-center gap-2">
                  <Chip tone="outline">{branch.role.department ?? "Internal"}</Chip>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {Math.round(branch.score * 100)}% covered
                  </span>
                </span>
              </button>
            );
          })}
          {branches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No internal destinations published yet.
            </p>
          ) : null}
        </div>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">
        Coverage compares your recorded evidence with each role&apos;s requirements. It is a coarse
        indication, not a readiness score.
      </p>
    </div>
  );
}

export function CoverageBar({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: number;
  tone?: "primary" | "warning";
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="font-mono tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", tone === "warning" ? "bg-warning" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
