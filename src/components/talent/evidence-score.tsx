import { useState } from "react";

import { Chip, SectionTitle } from "@/components/talent/primitives";
import { Button } from "@/components/ui/button";
import {
  BAND_LABEL,
  BAND_TONE,
  profileEvidenceScore,
  type ProfileEvidenceInput,
} from "@/lib/evidence-score";

export function EvidenceScoreCard({
  input,
  compact = false,
}: {
  input: ProfileEvidenceInput;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const score = profileEvidenceScore(input);

  if (compact) {
    return (
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Evidence validation</p>
          <Chip tone={BAND_TONE[score.band]}>{BAND_LABEL[score.band]}</Chip>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{score.headline}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {score.validated} of {score.total} evidence sources fully support your profile.
        </p>
      </div>
    );
  }

  return (
    <section>
      <SectionTitle
        title="Evidence validation"
        description="Each source is validated separately, then rated. This rates the evidence — not you — and always says what is strong and what is missing."
      />
      <div className="panel space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <p className="text-sm font-semibold">{score.headline}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {score.validated} of {score.total} sources fully support your profile. No rating here
              means anything is proven — it means how far the evidence currently goes.
            </p>
          </div>
          <Chip tone={BAND_TONE[score.band]}>{BAND_LABEL[score.band]}</Chip>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <p className="eyebrow text-success">Why this is good</p>
            <ul className="mt-3 space-y-2">
              {score.strengths.length ? (
                score.strengths.map((line) => (
                  <li key={line} className="flex gap-2 text-xs leading-relaxed">
                    <span className="font-semibold text-success">✓</span>
                    <span>{line}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground">
                  Nothing is supported yet — start by uploading your résumé.
                </li>
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="eyebrow text-warning">Why it is not strong yet</p>
            <ul className="mt-3 space-y-2">
              {score.weaknesses.length ? (
                score.weaknesses.map((line) => (
                  <li key={line} className="flex gap-2 text-xs leading-relaxed">
                    <span className="font-semibold text-warning">○</span>
                    <span>{line}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground">
                  Every source is supported. Keep it current as you ship new work.
                </li>
              )}
            </ul>
          </div>
        </div>

        <Button type="button" variant="ghost" size="sm" className="px-0" onClick={() => setOpen(!open)}>
          {open ? "Hide source-by-source detail" : "Show source-by-source detail"}
        </Button>

        {open ? (
          <div className="space-y-3">
            {score.dimensions.map((dimension) => (
              <div key={dimension.label} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{dimension.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{dimension.summary}</p>
                  </div>
                  <Chip tone={BAND_TONE[dimension.band]}>{BAND_LABEL[dimension.band]}</Chip>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ul className="space-y-1.5">
                    {dimension.good.map((line) => (
                      <li key={line} className="flex gap-2 text-xs leading-relaxed">
                        <span className="font-semibold text-success">✓</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-1.5">
                    {dimension.bad.map((line) => (
                      <li key={line} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                        <span className="font-semibold">○</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
