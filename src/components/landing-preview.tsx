import { Search } from "lucide-react";

import logoMark from "@/assets/talentmap-mark.png.asset.json";

const stats = [
  { label: "Employees", value: "8" },
  { label: "Skills identified", value: "42" },
  { label: "Potential capabilities", value: "17" },
  { label: "Internal opportunities", value: "6" },
];

const coverageBars = [
  { team: "Eng", value: 86 },
  { team: "Data", value: 72 },
  { team: "Design", value: 58 },
  { team: "Product", value: 64 },
  { team: "Ops", value: 41 },
];

const matches = [
  {
    name: "Arjun Kumar",
    role: "Technical Lead",
    band: "Strong",
    bandClass: "bg-primary/10 text-primary",
    evidence: "GitHub · 14 repos · interview",
  },
  {
    name: "Sneha Nair",
    role: "Senior Machine Learning Engineer",
    band: "Strong",
    bandClass: "bg-primary/10 text-primary",
    evidence: "Projects · recommendation models",
  },
  {
    name: "Meera Iyer",
    role: "Engineering Manager",
    band: "Good",
    bandClass: "bg-success/15 text-success",
    evidence: "Coaching · delivery leadership",
  },
  {
    name: "Daniel Fernandes",
    role: "Product Manager",
    band: "Good",
    bandClass: "bg-success/15 text-success",
    evidence: "Internal tooling adoption",
  },
  {
    name: "Rahul Verma",
    role: "Analytics Lead",
    band: "Partial",
    bandClass: "bg-warning/15 text-warning",
    evidence: "Reporting · SQL · stakeholder reviews",
  },
];

const capability = {
  person: "Arjun Kumar",
  title: "System design",
  confidence: 78,
  why: [
    "GitHub — LocalShore: PostgreSQL + Redis architecture",
    "Interview Q3 — described caching trade-offs",
    "Project — billing platform migration lead",
  ],
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

export function LandingPreview() {
  return (
    <div className="panel overflow-hidden p-2">
      <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
        {/* window chrome */}
        <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <img src={logoMark.url} alt="" className="size-5 rounded object-contain" />
            <span className="text-xs font-semibold tracking-tight">Workforce overview</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
            <Search aria-hidden className="size-3" />
            Search skills, people, roles…
          </span>
        </div>

        {/* stats */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-md border border-border bg-background p-3">
              <p className="text-lg font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            {/* skill coverage */}
            <div className="rounded-md border border-border bg-background p-3.5">
              <p className="text-xs font-semibold">Skill coverage across teams</p>
              <div className="mt-3 flex h-28 items-end gap-3">
                {coverageBars.map((bar) => (
                  <div key={bar.team} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-20 w-full items-end rounded-sm bg-muted/60">
                      <div
                        className="w-full rounded-sm bg-primary"
                        style={{ height: `${bar.value}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{bar.team}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* candidate matches */}
            <div className="rounded-md border border-border bg-background p-3.5">
              <p className="text-xs font-semibold">Internal matches this week</p>
              <ul className="mt-3 space-y-2.5">
                {matches.map((match) => (
                  <li key={match.name} className="flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                      {initials(match.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">
                        {match.name} <span className="text-muted-foreground">→ {match.role}</span>
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {match.evidence}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${match.bandClass}`}
                    >
                      {match.band}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* capability evidence card */}
          <div className="rounded-md border border-border bg-background p-3.5">
            <p className="eyebrow">Potential capability</p>
            <p className="mt-2 text-sm font-semibold">{capability.title}</p>
            <p className="text-[11px] text-muted-foreground">{capability.person}</p>

            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-semibold">{capability.confidence}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success"
                  style={{ width: `${capability.confidence}%` }}
                />
              </div>
            </div>

            <p className="mt-4 text-[11px] font-semibold">Why we think so</p>
            <ul className="mt-2 space-y-2">
              {capability.why.map((line) => (
                <li
                  key={line}
                  className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-[10px] leading-relaxed text-muted-foreground"
                >
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] italic text-muted-foreground">
              A suggested strength — validated by evidence, never asserted by a questionnaire alone.
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Sample view using the demo workforce included with TalentMap AI.
        </p>
      </div>
    </div>
  );
}
