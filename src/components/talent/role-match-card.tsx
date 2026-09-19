import { Link } from "@tanstack/react-router";
import { Check, Triangle } from "lucide-react";

import { Chip } from "./primitives";
import { bandTone, type RoleMatch } from "@/lib/talent";

export function RoleMatchCard({ match }: { match: RoleMatch }) {
  const tone = bandTone(match.band);
  return (
    <article className="panel flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{match.role.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{match.role.department}</p>
        </div>
        <Chip tone={tone === "muted" ? "muted" : tone}>{match.band}</Chip>
      </div>

      {match.matched.length > 0 ? (
        <div className="mt-4 space-y-1.5">
          <p className="eyebrow">Why this role matches</p>
          {match.matched.slice(0, 4).map((skill) => (
            <p key={skill} className="flex items-center gap-2 text-sm">
              <Check aria-hidden className="size-3.5 shrink-0 text-success" />
              {skill}
            </p>
          ))}
        </div>
      ) : null}

      {match.missing.length > 0 ? (
        <div className="mt-4 space-y-1.5">
          <p className="eyebrow">Skills to develop</p>
          {match.missing.slice(0, 4).map((skill) => (
            <p key={skill} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Triangle aria-hidden className="size-3 shrink-0 text-warning" />
              {skill}
              {match.capabilitySupport.includes(skill) ? (
                <span className="text-xs text-primary">potential capability detected</span>
              ) : null}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-auto pt-5">
        <Link
          to="/roles/$roleId"
          params={{ roleId: match.role.id }}
          className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Why this match?
        </Link>
      </div>
    </article>
  );
}
