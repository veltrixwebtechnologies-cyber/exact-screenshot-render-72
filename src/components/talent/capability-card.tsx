import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Chip, ConfidenceMeter } from "./primitives";
import { FeedbackButtons } from "./feedback-buttons";
import type { TalentInsight } from "@/hooks/useTalentData";

export function CapabilityCard({ insight }: { insight: TalentInsight }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Chip tone="primary">Potential capability</Chip>
          <h3 className="mt-2.5 text-lg font-semibold">{insight.capability}</h3>
        </div>
      </div>

      <div className="mt-4">
        <ConfidenceMeter confidence={Number(insight.confidence)} />
      </div>

      {insight.evidence.length > 0 ? (
        <div className="mt-4">
          <p className="eyebrow">Why we identified this</p>
          <ul className="mt-2 space-y-1.5">
            {insight.evidence.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-foreground">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {insight.explanation ? (
        <div className="mt-4 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-2 text-left text-sm font-medium text-primary"
            aria-expanded={open}
          >
            AI reasoning
            <ChevronDown
              aria-hidden
              className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open ? (
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{insight.explanation}</p>
          ) : null}
        </div>
      ) : null}

      {insight.explore.length > 0 ? (
        <div className="mt-4">
          <p className="eyebrow">Areas to explore</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {insight.explore.map((area) => (
              <Chip key={area} tone="outline">
                {area}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-muted-foreground">
        Evidence-based insight, not a definitive assessment. Source: {insight.source}.
      </p>

      <div className="mt-3 border-t border-border pt-3">
        <FeedbackButtons
          targetType="capability"
          targetLabel={insight.capability}
          label="Does this reflect you?"
        />
      </div>
    </article>
  );
}
