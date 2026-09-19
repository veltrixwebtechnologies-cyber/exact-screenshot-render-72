import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { talentSearch } from "@/lib/talent.functions";
import { AIDisclosure, Chip, EmptyState, PageHeader } from "@/components/talent/primitives";
import { StaffGuard } from "@/components/talent/staff-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/hr/talent-search")({
  head: () => ({
    meta: [
      { title: "Talent search — TalentIQ" },
      {
        name: "description",
        content: "Search the workforce by meaning, not keywords, and see the evidence behind every result.",
      },
      { property: "og:title", content: "Talent search — TalentIQ" },
      { property: "og:description", content: "Evidence-backed semantic talent search." },
    ],
  }),
  component: () => (
    <StaffGuard>
      <TalentSearchPage />
    </StaffGuard>
  ),
});

interface SearchResult {
  employee: { id: string; name: string; job_title: string | null; department: string | null; location: string | null };
  skills: string[];
  capabilities: Array<{ capability: string; confidence: number }>;
  experience: string[];
  reasons: string[];
  relevance: string;
  suggestedRoles: string[];
}

const examples = [
  "Someone who can mentor junior developers",
  "A developer with potential leadership capability",
  "Who could lead a customer-facing analytics project?",
  "People strong in stakeholder communication",
];

function TalentSearchPage() {
  const search = useServerFn(talentSearch);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [mode, setMode] = useState<"semantic" | "keyword" | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(text: string) {
    const value = text.trim();
    if (!value) return;
    setQuery(value);
    setBusy(true);
    try {
      const result = await search({ data: { query: value } });
      setResults(result.results as SearchResult[]);
      setMode(result.mode);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Talent search"
        title="Find capability, not keywords"
        description="Describe what you need in plain language. Results show the evidence that justified each match."
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          run(query);
        }}
        className="space-y-3"
      >
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. someone who can coordinate a cross-team delivery"
          />
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Search aria-hidden className="size-4" />}
            <span className="ml-1.5 hidden sm:inline">Search</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => run(example)}
              className="rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:bg-accent"
            >
              {example}
            </button>
          ))}
        </div>
      </form>

      {mode === "keyword" ? (
        <AIDisclosure>
          Semantic ranking is unavailable right now, so these results come from a keyword match across
          skills, projects, achievements and capability insights.
        </AIDisclosure>
      ) : null}

      {results === null ? null : results.length === 0 ? (
        <EmptyState
          title="No one matched that search"
          description="Try describing the capability differently, or search for the underlying skill."
        />
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <article key={result.employee.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{result.employee.name}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {result.employee.job_title}
                    {result.employee.department ? ` · ${result.employee.department}` : ""}
                    {result.employee.location ? ` · ${result.employee.location}` : ""}
                  </p>
                </div>
                <Chip tone={result.relevance === "Strong" ? "success" : result.relevance === "Good" ? "primary" : "warning"}>
                  {result.relevance} relevance
                </Chip>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="eyebrow">Why this person</p>
                  <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                    {result.reasons.map((reason) => (
                      <li key={reason} className="flex gap-2">
                        <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {result.skills.slice(0, 8).map((skill) => (
                    <Chip key={skill} tone="outline">
                      {skill}
                    </Chip>
                  ))}
                </div>

                {result.capabilities.length ? (
                  <div>
                    <p className="eyebrow">Potential capabilities</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {result.capabilities.map((capability) => (
                        <Chip key={capability.capability} tone="primary">
                          {capability.capability} · {Math.round(capability.confidence * 100)}%
                        </Chip>
                      ))}
                    </div>
                  </div>
                ) : null}

                {result.experience.length ? (
                  <p className="text-xs text-muted-foreground">
                    Relevant experience: {result.experience.slice(0, 4).join(", ")}
                  </p>
                ) : null}

                {result.suggestedRoles.length ? (
                  <p className="text-xs text-muted-foreground">
                    Could be considered for: {result.suggestedRoles.join(", ")}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <AIDisclosure>
        Results rank recorded evidence against your description. Potential capabilities are indications
        to explore in conversation and must not be treated as verified skills.
      </AIDisclosure>
    </div>
  );
}
