// Fallback adaptive question bank. Used when the AI provider is unavailable so
// the discovery assessment always works. Original questions written for TalentMap AI.

export interface BankOption {
  label: string;
  signals: string[];
}

export interface BankQuestion {
  id: string;
  category: string;
  question: string;
  options: BankOption[];
  /** Signals that make this question more useful as a follow-up. */
  probes: string[];
}

export const QUESTION_BANK: BankQuestion[] = [
  {
    id: "q_start",
    category: "Working style",
    question: "When a project gets difficult, what do you usually end up doing?",
    probes: [],
    options: [
      { label: "Dig into the technical problem myself", signals: ["Problem Solving", "Ownership"] },
      { label: "Get the right people talking to each other", signals: ["Team Coordination", "Communication"] },
      { label: "Research how others have solved it", signals: ["Research", "Creativity"] },
      { label: "Support whoever is most stuck", signals: ["Mentoring", "Communication"] },
      { label: "Step back and re-plan the approach", signals: ["Planning", "Strategic Thinking"] },
    ],
  },
  {
    id: "q_decisions",
    category: "Decisions",
    question: "A decision is needed and the information is incomplete. What happens?",
    probes: ["Planning", "Strategic Thinking", "Ownership"],
    options: [
      { label: "I make the call and own the outcome", signals: ["Decision Making", "Ownership"] },
      { label: "I gather a quick read from the people affected", signals: ["Communication", "Team Coordination"] },
      { label: "I look for the smallest reversible next step", signals: ["Problem Solving", "Strategic Thinking"] },
      { label: "I escalate with a clear recommendation", signals: ["Communication", "Decision Making"] },
    ],
  },
  {
    id: "q_teaching",
    category: "Growing others",
    question: "How often does someone ask you to explain or review their work?",
    probes: ["Mentoring", "Communication", "Team Coordination"],
    options: [
      { label: "Most weeks, and I make time for it", signals: ["Mentoring", "Communication"] },
      { label: "Occasionally, usually in my own area", signals: ["Mentoring"] },
      { label: "Rarely, I mostly work heads-down", signals: ["Problem Solving"] },
      { label: "I run sessions or write docs for the whole team", signals: ["Mentoring", "Communication", "Ownership"] },
    ],
  },
  {
    id: "q_delivery",
    category: "Delivery",
    question: "Think of your last piece of work that shipped late or nearly did. What was your part?",
    probes: ["Ownership", "Planning", "Team Coordination"],
    options: [
      { label: "I tracked the plan and chased the blockers", signals: ["Team Coordination", "Planning", "Ownership"] },
      { label: "I took on the hardest remaining piece", signals: ["Problem Solving", "Ownership"] },
      { label: "I managed expectations outside the team", signals: ["Communication", "Strategic Thinking"] },
      { label: "I focused on my own tasks being ready", signals: ["Ownership"] },
    ],
  },
  {
    id: "q_customer",
    category: "Customers",
    question: "How close do you get to the people who actually use what you build?",
    probes: ["Research", "Customer Understanding", "Creativity"],
    options: [
      { label: "I talk to users or read their feedback directly", signals: ["Customer Understanding", "Research"] },
      { label: "I work from requirements others gather", signals: ["Planning"] },
      { label: "I look at usage data to infer what they need", signals: ["Research", "Customer Understanding"] },
      { label: "I push for changes based on what users struggle with", signals: ["Customer Understanding", "Ownership"] },
    ],
  },
  {
    id: "q_newproblem",
    category: "Ambiguity",
    question: "You are handed a problem nobody in the team has solved before. First move?",
    probes: ["Research", "Creativity", "Problem Solving"],
    options: [
      { label: "Break it into smaller known problems", signals: ["Problem Solving", "Planning"] },
      { label: "Prototype something rough to learn fast", signals: ["Creativity", "Ownership"] },
      { label: "Find prior work inside or outside the company", signals: ["Research"] },
      { label: "Map who needs to be involved before starting", signals: ["Team Coordination", "Strategic Thinking"] },
    ],
  },
  {
    id: "q_conflict",
    category: "People",
    question: "Two teammates disagree strongly on an approach. What do you typically do?",
    probes: ["Team Coordination", "Communication", "Decision Making"],
    options: [
      { label: "Facilitate until they agree on criteria", signals: ["Team Coordination", "Communication"] },
      { label: "Test both options with a small experiment", signals: ["Problem Solving", "Decision Making"] },
      { label: "Give my view and let the owner decide", signals: ["Communication"] },
      { label: "Take the decision if it is blocking delivery", signals: ["Decision Making", "Ownership", "Leadership"] },
    ],
  },
  {
    id: "q_horizon",
    category: "Horizon",
    question: "Which conversation do you find yourself drawn into most?",
    probes: ["Strategic Thinking", "Planning", "Customer Understanding"],
    options: [
      { label: "How we should build this properly", signals: ["Problem Solving", "Ownership"] },
      { label: "Where this area should be in a year", signals: ["Strategic Thinking", "Planning"] },
      { label: "Whether this is what customers actually need", signals: ["Customer Understanding", "Research"] },
      { label: "How the team can work better together", signals: ["Team Coordination", "Mentoring", "Leadership"] },
    ],
  },
  {
    id: "q_scope",
    category: "Scope",
    question: "How much of your work involves people outside your immediate team?",
    probes: ["Communication", "Strategic Thinking", "Team Coordination"],
    options: [
      { label: "A lot — I coordinate across several groups", signals: ["Team Coordination", "Communication", "Leadership"] },
      { label: "Some — mostly one partner team", signals: ["Communication"] },
      { label: "Little — my work is inside the team", signals: ["Problem Solving"] },
      { label: "I am usually the one representing the team", signals: ["Communication", "Leadership", "Strategic Thinking"] },
    ],
  },
  {
    id: "q_energy",
    category: "Motivation",
    question: "Which of these leaves you most satisfied at the end of a week?",
    probes: [],
    options: [
      { label: "A hard problem finally solved", signals: ["Problem Solving"] },
      { label: "Someone I helped made real progress", signals: ["Mentoring", "Leadership"] },
      { label: "A plan that came together cleanly", signals: ["Planning", "Team Coordination"] },
      { label: "A new idea that changed how we work", signals: ["Creativity", "Strategic Thinking"] },
      { label: "A customer telling us it helped", signals: ["Customer Understanding"] },
    ],
  },
  {
    id: "q_risk",
    category: "Judgement",
    question: "Something you own is about to slip. When do you raise it?",
    probes: ["Ownership", "Communication", "Decision Making"],
    options: [
      { label: "As soon as I see the risk, with options", signals: ["Ownership", "Communication", "Decision Making"] },
      { label: "Once I have tried to recover it myself", signals: ["Ownership", "Problem Solving"] },
      { label: "At the next scheduled update", signals: ["Planning"] },
      { label: "I ask the team to decide together", signals: ["Team Coordination"] },
    ],
  },
  {
    id: "q_improve",
    category: "Initiative",
    question: "Have you changed how your team works, outside of assigned work?",
    probes: ["Ownership", "Leadership", "Creativity"],
    options: [
      { label: "Yes — I introduced a practice the team kept", signals: ["Ownership", "Leadership", "Creativity"] },
      { label: "Yes — small improvements to my own workflow", signals: ["Ownership"] },
      { label: "I have suggested changes but not driven them", signals: ["Communication"] },
      { label: "Not yet, I follow the team's way of working", signals: ["Planning"] },
    ],
  },
];

export function pickFallbackQuestion(
  askedIds: string[],
  leadingSignals: string[],
): BankQuestion {
  const remaining = QUESTION_BANK.filter((q) => !askedIds.includes(q.id));
  if (remaining.length === 0) return QUESTION_BANK[0]!;
  if (askedIds.length === 0) return remaining.find((q) => q.id === "q_start") ?? remaining[0]!;

  // Prefer a question that probes the signals we have partial evidence for:
  // this is what reduces uncertainty instead of repeating a theme.
  const scored = remaining.map((q) => ({
    q,
    score: q.probes.filter((p) => leadingSignals.includes(p)).length,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0]!.q;
}
