import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { pickFallbackQuestion, QUESTION_BANK, type BankQuestion } from "./question-bank";
import {
  deriveHypotheses,
  groundedFallbackQuestion,
  hypothesesToText,
  typeForStep,
  type CapabilityHypothesis,
  type QuestionType,
} from "./hypotheses";
import { callAI, parseJSON } from "./ai.server";

export const TOTAL_QUESTIONS = 10;

type SupabaseCtx = { supabase: any; userId: string };

interface EmployeeContext {
  employee: any;
  skills: Array<{ name: string; proficiency: number; source: string; evidence: string | null }>;
  projects: any[];
  achievements: any[];
  certifications: any[];
  learning: any[];
  insights: any[];
  github: any[];
  resumes: any[];
}

async function loadEmployeeContext(
  ctx: SupabaseCtx,
  employeeId: string,
): Promise<EmployeeContext | null> {
  const { supabase } = ctx;
  const [employee, skills, projects, achievements, certifications, learning, insights, github, resumes] =
    await Promise.all([
      supabase.from("employees").select("*").eq("id", employeeId).maybeSingle(),
      supabase
        .from("employee_skills")
        .select("proficiency, source, evidence, skills(name)")
        .eq("employee_id", employeeId),
      supabase.from("projects").select("*").eq("employee_id", employeeId),
      supabase.from("achievements").select("*").eq("employee_id", employeeId),
      supabase.from("certifications").select("*").eq("employee_id", employeeId),
      supabase.from("learning_records").select("*").eq("employee_id", employeeId),
      supabase.from("talent_insights").select("*").eq("employee_id", employeeId),
      supabase.from("github_evidence").select("*").eq("employee_id", employeeId),
      supabase
        .from("employee_resumes")
        .select("file_name, extracted_text, created_at")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

  if (!employee.data) return null;

  return {
    employee: employee.data,
    skills: (skills.data ?? []).map((row: any) => ({
      name: row.skills?.name ?? "Unknown",
      proficiency: row.proficiency,
      source: row.source,
      evidence: row.evidence,
    })),
    projects: projects.data ?? [],
    achievements: achievements.data ?? [],
    certifications: certifications.data ?? [],
    learning: learning.data ?? [],
    insights: insights.data ?? [],
    github: github.data ?? [],
    resumes: resumes.data ?? [],
  };
}

function hypothesesFor(context: EmployeeContext | null): CapabilityHypothesis[] {
  if (!context) return [];
  return deriveHypotheses({
    github: context.github as any[],
    projects: context.projects as any[],
    achievements: context.achievements as any[],
    certifications: context.certifications as any[],
    learning: context.learning as any[],
    resumeText: context.resumes[0]?.extracted_text ?? null,
  });
}


function contextToText(context: EmployeeContext): string {
  const e = context.employee;
  const lines = [
    `Employee: ${e.name}`,
    `Job title: ${e.job_title ?? "unknown"} | Department: ${e.department ?? "unknown"} | Location: ${e.location ?? "unknown"}`,
    `Joined: ${e.joining_date ?? "unknown"}`,
    `Summary: ${e.profile_summary ?? "none recorded"}`,
    "",
    "Recorded skills:",
    ...(context.skills.length
      ? context.skills.map(
          (s) => `- ${s.name} (level ${s.proficiency}/5, source: ${s.source}${s.evidence ? `, evidence: ${s.evidence}` : ""})`,
        )
      : ["- none recorded"]),
    "",
    "Projects:",
    ...(context.projects.length
      ? context.projects.map(
          (p) =>
            `- ${p.title}: ${p.description ?? ""} | role: ${p.role ?? "unspecified"} | technologies: ${(p.technologies ?? []).join(", ")} | outcomes: ${p.outcomes ?? "unspecified"}`,
        )
      : ["- none recorded"]),
    "",
    "Achievements:",
    ...(context.achievements.length
      ? context.achievements.map((a) => `- ${a.title}: ${a.description ?? ""} | impact: ${a.impact ?? "unspecified"}`)
      : ["- none recorded"]),
    "",
    "Certifications:",
    ...(context.certifications.length
      ? context.certifications.map((c) => `- ${c.name} (${c.issuer ?? "unknown issuer"})`)
      : ["- none recorded"]),
    "",
    "Learning history:",
    ...(context.learning.length
      ? context.learning.map((l) => `- ${l.course} (${l.provider ?? "unknown"}) skills: ${(l.skills_gained ?? []).join(", ")}`)
      : ["- none recorded"]),
    "",
    "GitHub evidence (actual repositories analysed with the employee's authorisation):",
    ...(context.github.length
      ? context.github.map(
          (g: any) =>
            `- ${g.repo_name}${g.is_private ? " (private)" : ""}: languages ${(g.languages ?? []).join(", ") || "unknown"}; detected tech ${(g.detected_tech ?? []).join(", ") || "none"}; last activity ${g.last_pushed_at ? String(g.last_pushed_at).slice(0, 10) : "unknown"}; readme summary: ${(g.summary ?? "none").slice(0, 300)}`,
        )
      : ["- no GitHub connected"]),
    "",
    "Resume extract (first 1500 characters of the uploaded resume):",
    context.resumes[0]?.extracted_text
      ? String(context.resumes[0].extracted_text).slice(0, 1500)
      : "- no resume uploaded",
    "",
    "Previously detected potential capabilities:",
    ...(context.insights.length
      ? context.insights.map((i) => `- ${i.capability} (confidence ${Math.round(Number(i.confidence) * 100)}%): ${i.explanation ?? ""}`)
      : ["- none yet"]),

  ];
  return lines.join("\n");
}

const LANGUAGE_RULES = `You are the analysis engine of TalentIQ, an internal talent intelligence platform.
Rules you must never break:
- Never claim certainty about a person's talent. Use "potential capability", "suggested strength", "evidence suggests".
- Every claim must be tied to concrete evidence drawn from the provided data.
- Never invent projects, achievements, employers, numbers or dates that are not in the provided data.
- If the data is insufficient, say so plainly.`;

/* ------------------------------------------------------------------ */
/* Assessment                                                          */
/* ------------------------------------------------------------------ */

export const startAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as SupabaseCtx;
    const { data: employee } = await ctx.supabase
      .from("employees")
      .select("id")
      .eq("user_id", ctx.userId)
      .maybeSingle();
    if (!employee) throw new Error("No employee profile yet");

    await ctx.supabase
      .from("assessments")
      .update({ status: "abandoned" })
      .eq("employee_id", employee.id)
      .eq("status", "in_progress");

    const { data, error } = await ctx.supabase
      .from("assessments")
      .insert({ employee_id: employee.id, status: "in_progress" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { assessmentId: data.id as string };
  });

interface QuestionPayload {
  question: string;
  category: string;
  options: Array<{ label: string; signals: string[] }>;
  step: number;
  total: number;
  fallback: boolean;
  /** "Evidence validation" | "Behavioural" | "Technical deep dive" */
  type: QuestionType;
  /** Plain-language answer to "Why are we asking this?" */
  rationale: string;
  /** The real records this question was built from. Never invented. */
  evidenceConsidered: string[];
  /** Short grounding line, e.g. "Based on your GitHub projects and your previous answer". */
  groundedIn: string;
}

function groundingLine(hasEvidence: boolean, sources: string[], hasPrevious: boolean): string {
  const parts: string[] = [];
  if (hasEvidence && sources.length) parts.push(`your ${sources.join(", ")}`);
  if (hasPrevious) parts.push("your previous answer");
  if (!parts.length) return "Based on general working-style signals — connect your evidence for grounded questions";
  return `Based on ${parts.join(" and ")}`;
}

function bankToPayload(
  question: BankQuestion,
  step: number,
  grounded: string,
  hasPrevious: boolean,
): QuestionPayload {
  return {
    question: question.question,
    category: question.category,
    options: question.options.map((o) => ({ label: o.label, signals: o.signals })),
    step,
    total: TOTAL_QUESTIONS,
    fallback: true,
    type: "behavioural",
    rationale: `This question helps TalentIQ understand how you work in practice${
      hasPrevious ? ", building on your previous answers" : ""
    }. It is a standard question, used because we could not generate one from your own evidence right now.`,
    evidenceConsidered: [],
    groundedIn: grounded,
  };
}

export const nextQuestion = createServerFn({ method: "POST" })
  .inputValidator((data: { assessmentId: string }) => {
    if (!data?.assessmentId) throw new Error("assessmentId is required");
    return { assessmentId: data.assessmentId };
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<QuestionPayload | { done: true }> => {
    const ctx = context as unknown as SupabaseCtx;

    const { data: assessment } = await ctx.supabase
      .from("assessments")
      .select("id, employee_id")
      .eq("id", data.assessmentId)
      .maybeSingle();
    if (!assessment) throw new Error("Assessment not found");

    const { data: responses } = await ctx.supabase
      .from("assessment_responses")
      .select("question, answer, detected_signals, step")
      .eq("assessment_id", data.assessmentId)
      .order("step");

    const asked = responses ?? [];
    const step = asked.length + 1;
    if (step > TOTAL_QUESTIONS) return { done: true };

    const signalCount = new Map<string, number>();
    for (const row of asked) {
      for (const signal of row.detected_signals ?? []) {
        signalCount.set(signal, (signalCount.get(signal) ?? 0) + 1);
      }
    }
    const leading = [...signalCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([signal]) => signal);

    const askedTexts = asked.map((r: any) => r.question);
    const employeeContext = await loadEmployeeContext(ctx, assessment.employee_id);
    const hypotheses = hypothesesFor(employeeContext);

    const sourceLabels: string[] = [];
    if (employeeContext?.github.length) sourceLabels.push("GitHub projects");
    if (employeeContext?.resumes.length) sourceLabels.push("resume");
    if (employeeContext?.projects.length) sourceLabels.push("recorded projects");
    if ((employeeContext?.learning.length ?? 0) + (employeeContext?.certifications.length ?? 0) > 0)
      sourceLabels.push("learning history");

    const hasEvidence = hypotheses.length > 0;
    const previous = asked[asked.length - 1];
    const grounded = groundingLine(hasEvidence, sourceLabels.slice(0, 2), Boolean(previous));
    const wantedType = typeForStep(step, hasEvidence);

    const prompt = `${LANGUAGE_RULES}

You are running an adaptive, EVIDENCE-GROUNDED capability discovery interview. Ask ONE next question.

Hard requirements:
- The question must be grounded in the person's ACTUAL evidence below (name the real repository, project, certification or achievement). Never invent evidence, repository names, employers or numbers.
- This question must be of type: ${wantedType}.
  * evidence_validation: "Your GitHub shows <real repo>. Which part did you personally implement?" — the goal is to separate real ownership from mere repository membership.
  * behavioural: "When <situation seen in their evidence> happened, how did you approach it?" — the goal is working style.
  * technical_deep_dive: "Why did you choose <real technology in their evidence> for <real repo/project>?" — the goal is reasoning and depth.
${previous ? `- Make it a FOLLOW-UP on their last answer where that adds information. Last question: "${previous.question}" -> answer: "${previous.answer}".` : ""}
- There is no correct answer. Each option must map to a DIFFERENT capability signal.
- Do not repeat a theme already covered.

Question ${step} of about ${TOTAL_QUESTIONS}.

Capability hypotheses derived from their evidence (each still needs validation):
${hypothesesToText(hypotheses)}

Full evidence:
${employeeContext ? contextToText(employeeContext) : "no profile data"}

Questions already asked:
${askedTexts.length ? askedTexts.map((q: string, i: number) => `${i + 1}. ${q} -> answered: ${asked[i].answer}`).join("\n") : "none"}

Current leading capability signals: ${leading.length ? leading.join(", ") : "none yet"}

Allowed signals: Leadership, Communication, Mentoring, Decision Making, Problem Solving, Creativity, Planning, Research, Team Coordination, Customer Understanding, Ownership, Strategic Thinking, System Thinking, Technical Implementation, Applied AI Engineering.

Return ONLY JSON:
{"question":"...","category":"short label such as the capability under test","rationale":"1-2 sentences: what this question helps TalentIQ understand","evidence_considered":["real repository / project / record name and why it was considered"],"options":[{"label":"first person answer option","signals":["Signal"]}]}
Provide 4 or 5 options. evidence_considered must only list records that appear in the evidence above; use an empty array if you used none.`;

    const raw = await callAI([{ role: "user", content: prompt }], { temperature: 0.7 });
    const parsed = parseJSON<{
      question: string;
      category?: string;
      rationale?: string;
      evidence_considered?: string[];
      options: Array<{ label: string; signals?: string[] }>;
    }>(raw);

    if (parsed?.question && Array.isArray(parsed.options) && parsed.options.length >= 3) {
      const known = new Set<string>();
      for (const h of hypotheses) for (const e of h.evidence) known.add(e.ref.toLowerCase());
      // Keep only evidence references that really exist in the employee's records.
      const evidenceConsidered = (parsed.evidence_considered ?? [])
        .map((e) => String(e))
        .filter((e) => [...known].some((ref) => e.toLowerCase().includes(ref)))
        .slice(0, 5);

      return {
        question: parsed.question,
        category: parsed.category ?? "Adaptive",
        options: parsed.options.slice(0, 5).map((o) => ({
          label: o.label,
          signals: (o.signals ?? []).slice(0, 3),
        })),
        step,
        total: TOTAL_QUESTIONS,
        fallback: false,
        type: wantedType,
        rationale:
          parsed.rationale ??
          "This question helps TalentIQ understand how you actually work, so capabilities are backed by evidence rather than assumed.",
        evidenceConsidered: evidenceConsidered.length
          ? evidenceConsidered
          : hypotheses.slice(0, 3).flatMap((h) => h.evidence.slice(0, 1).map((e) => `${e.ref} — ${e.detail}`)),
        groundedIn: grounded,
      };
    }

    // AI unavailable: still ground the question in real evidence where we can.
    const groundedQuestion = groundedFallbackQuestion(hypotheses, askedTexts, step);
    if (groundedQuestion) {
      return {
        ...groundedQuestion,
        step,
        total: TOTAL_QUESTIONS,
        fallback: true,
        groundedIn: grounded,
      };
    }

    const askedIds = QUESTION_BANK.filter((q) => askedTexts.includes(q.question)).map((q) => q.id);
    return bankToPayload(pickFallbackQuestion(askedIds, leading), step, grounded, Boolean(previous));
  });


export const submitAnswer = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      assessmentId: string;
      question: string;
      category?: string;
      answer: string;
      signals: string[];
      step: number;
    }) => {
      if (!data?.assessmentId || !data.question || !data.answer) {
        throw new Error("assessmentId, question and answer are required");
      }
      return data;
    },
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as SupabaseCtx;
    const { error } = await ctx.supabase.from("assessment_responses").insert({
      assessment_id: data.assessmentId,
      question: data.question,
      category: data.category ?? null,
      answer: data.answer,
      detected_signals: data.signals ?? [],
      step: data.step,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export interface GeneratedInsight {
  capability: string;
  confidence: number;
  evidence: string[];
  explanation: string;
  explore: string[];
}

export const completeAssessment = createServerFn({ method: "POST" })
  .inputValidator((data: { assessmentId: string }) => {
    if (!data?.assessmentId) throw new Error("assessmentId is required");
    return data;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as SupabaseCtx;

    const { data: assessment } = await ctx.supabase
      .from("assessments")
      .select("id, employee_id")
      .eq("id", data.assessmentId)
      .maybeSingle();
    if (!assessment) throw new Error("Assessment not found");

    const { data: responses } = await ctx.supabase
      .from("assessment_responses")
      .select("question, answer, detected_signals")
      .eq("assessment_id", data.assessmentId)
      .order("step");

    const employeeContext = await loadEmployeeContext(ctx, assessment.employee_id);
    const answers = responses ?? [];

    const prompt = `${LANGUAGE_RULES}

Combine the assessment answers with the employee's recorded experience to identify potential capabilities.

${employeeContext ? contextToText(employeeContext) : "no profile data"}

Assessment answers:
${answers.map((r: any, i: number) => `${i + 1}. Q: ${r.question}\n   A: ${r.answer}\n   signals: ${(r.detected_signals ?? []).join(", ")}`).join("\n")}

Return ONLY JSON of 3 to 5 items:
[{"capability":"Leadership","confidence":0.78,"evidence":["short factual bullet drawn from the data"],"explanation":"We identified potential ... because ...","explore":["Role or area to explore"]}]
Confidence is 0.4-0.9. Evidence bullets must come from the data above, never invented.`;

    let insights = parseJSON<GeneratedInsight[]>(await callAI([{ role: "user", content: prompt }]));

    if (!Array.isArray(insights) || insights.length === 0) {
      // Deterministic fallback: derive from signal frequency plus recorded evidence.
      const counts = new Map<string, number>();
      for (const row of answers) {
        for (const signal of row.detected_signals ?? []) {
          counts.set(signal, (counts.get(signal) ?? 0) + 1);
        }
      }
      const evidenceBullets = [
        ...(employeeContext?.projects ?? []).map((p) => `${p.title}: ${p.role ?? "contributor"}`),
        ...(employeeContext?.achievements ?? []).map((a) => a.title),
      ].slice(0, 4);

      insights = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([capability, count]) => ({
          capability,
          confidence: Math.min(0.85, 0.45 + count * 0.1),
          evidence: [
            `Chosen in ${count} of ${answers.length} assessment answers`,
            ...evidenceBullets,
          ].slice(0, 4),
          explanation: `We identified potential ${capability.toLowerCase()} capability because your answers repeatedly described this way of working, and your recorded projects and achievements show related evidence.`,
          explore: [],
        }));
    }

    const clean = insights.slice(0, 5).map((i) => ({
      employee_id: assessment.employee_id,
      capability: String(i.capability).slice(0, 80),
      confidence: Math.max(0.3, Math.min(0.95, Number(i.confidence) || 0.6)),
      evidence: (i.evidence ?? []).map((e) => String(e)).slice(0, 6),
      explanation: String(i.explanation ?? ""),
      explore: (i.explore ?? []).map((e) => String(e)).slice(0, 4),
      source: "Assessment + profile",
    }));

    await ctx.supabase
      .from("talent_insights")
      .delete()
      .eq("employee_id", assessment.employee_id)
      .eq("source", "Assessment + profile");

    if (clean.length) {
      const { error } = await ctx.supabase.from("talent_insights").insert(clean);
      if (error) throw new Error(error.message);
    }

    await ctx.supabase
      .from("assessments")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data.assessmentId);

    return { insights: clean };
  });

/* ------------------------------------------------------------------ */
/* Career assistant (retrieval + generation over the employee's data)  */
/* ------------------------------------------------------------------ */

export const careerChat = createServerFn({ method: "POST" })
  .inputValidator((data: { message: string; history?: Array<{ role: string; content: string }> }) => {
    if (!data?.message) throw new Error("message is required");
    return { message: data.message, history: data.history ?? [] };
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as SupabaseCtx;
    const { data: employee } = await ctx.supabase
      .from("employees")
      .select("id")
      .eq("user_id", ctx.userId)
      .maybeSingle();
    if (!employee) {
      return {
        answer: "I don't have your profile yet. Add your role, projects and achievements first and I can work from real evidence.",
        sources: [] as string[],
      };
    }

    const employeeContext = await loadEmployeeContext(ctx, employee.id);
    const { data: roles } = await ctx.supabase
      .from("internal_roles")
      .select("title, department, required_skills, preferred_skills, experience_required");

    const retrieved = `${employeeContext ? contextToText(employeeContext) : ""}

Open internal roles:
${(roles ?? []).map((r: any) => `- ${r.title} (${r.department}) requires: ${(r.required_skills ?? []).join(", ")}; preferred: ${(r.preferred_skills ?? []).join(", ")}`).join("\n")}`;

    const answer = await callAI([
      {
        role: "system",
        content: `${LANGUAGE_RULES}
You are "Career AI", the career assistant inside TalentIQ. Answer only from the retrieved context below. If the context does not contain the answer, say "I don't have enough information to determine that yet." Keep answers under 180 words, concrete, and reference the evidence you used.

RETRIEVED CONTEXT:
${retrieved}`,
      },
      ...data.history.slice(-6).map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
      { role: "user", content: data.message },
    ]);

    const sources = [
      employeeContext?.projects.length ? `${employeeContext.projects.length} projects` : null,
      employeeContext?.achievements.length ? `${employeeContext.achievements.length} achievements` : null,
      employeeContext?.skills.length ? `${employeeContext.skills.length} recorded skills` : null,
      employeeContext?.insights.length ? `${employeeContext.insights.length} capability insights` : null,
      roles?.length ? `${roles.length} open internal roles` : null,
    ].filter(Boolean) as string[];

    if (!answer) {
      return {
        answer:
          "The AI assistant is unavailable right now, so I can't reason over your profile this moment. Your skills, capabilities, role matches and skill gaps are all still available on their own pages.",
        sources,
      };
    }
    return { answer, sources };
  });

/* ------------------------------------------------------------------ */
/* HR intelligence                                                     */
/* ------------------------------------------------------------------ */

export const talentSearch = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string }) => {
    if (!data?.query) throw new Error("query is required");
    return { query: data.query.slice(0, 300) };
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as SupabaseCtx;

    const { data: staff } = await ctx.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", ctx.userId);
    const isStaff = (staff ?? []).some((r: any) => r.role === "hr" || r.role === "admin");
    if (!isStaff) throw new Error("HR access required");

    const [{ data: employees }, { data: skills }, { data: projects }, { data: insights }, { data: achievements }] =
      await Promise.all([
        ctx.supabase.from("employees").select("id, name, department, job_title, location, joining_date, profile_summary"),
        ctx.supabase.from("employee_skills").select("employee_id, proficiency, skills(name)"),
        ctx.supabase.from("projects").select("employee_id, title, description, role"),
        ctx.supabase.from("talent_insights").select("employee_id, capability, confidence, explanation"),
        ctx.supabase.from("achievements").select("employee_id, title, impact"),
      ]);

    const dossiers: any[] = ((employees ?? []) as any[]).map((e: any) => {
      const empSkills = (skills ?? []).filter((s: any) => s.employee_id === e.id).map((s: any) => s.skills?.name).filter(Boolean);
      const empProjects = (projects ?? []).filter((p: any) => p.employee_id === e.id);
      const empInsights = (insights ?? []).filter((i: any) => i.employee_id === e.id);
      const empAchievements = (achievements ?? []).filter((a: any) => a.employee_id === e.id);
      return { employee: e, empSkills, empProjects, empInsights, empAchievements };
    });

    const corpus = dossiers
      .map(
        (d: any) =>
          `ID: ${d.employee.id}
Name: ${d.employee.name} | ${d.employee.job_title} | ${d.employee.department} | ${d.employee.location}
Summary: ${d.employee.profile_summary ?? ""}
Skills: ${d.empSkills.join(", ") || "none"}
Projects: ${d.empProjects.map((p: any) => `${p.title} (${p.role ?? ""}) ${p.description ?? ""}`).join(" | ") || "none"}
Achievements: ${d.empAchievements.map((a: any) => a.title).join(" | ") || "none"}
Potential capabilities: ${d.empInsights.map((i: any) => `${i.capability} (${Math.round(Number(i.confidence) * 100)}%)`).join(", ") || "none"}`,
      )
      .join("\n---\n");

    const raw = await callAI([
      {
        role: "user",
        content: `${LANGUAGE_RULES}

An HR user searched: "${data.query}"

Rank the employees below by how well they fit that search, using meaning rather than exact keywords (for example "helped junior developers" is relevant to a search for mentoring). Include at most 6, only those with real supporting evidence.

${corpus}

Return ONLY JSON:
[{"id":"employee id","reasons":["evidence-based reason"],"relevance":"Strong|Good|Partial","suggested_roles":["internal role or area"]}]`,
      },
    ]);

    const ranked = parseJSON<Array<{ id: string; reasons?: string[]; relevance?: string; suggested_roles?: string[] }>>(raw);

    if (Array.isArray(ranked) && ranked.length) {
      const byId = new Map(dossiers.map((d: any) => [d.employee.id, d]));
      const results = ranked
        .filter((r) => byId.has(r.id))
        .map((r) => {
          const d = byId.get(r.id)!;
          return {
            employee: d.employee,
            skills: d.empSkills,
            capabilities: d.empInsights.map((i: any) => ({ capability: i.capability, confidence: Number(i.confidence) })),
            experience: d.empProjects.map((p: any) => p.title),
            reasons: (r.reasons ?? []).slice(0, 4),
            relevance: r.relevance ?? "Good",
            suggestedRoles: (r.suggested_roles ?? []).slice(0, 3),
          };
        });
      return { results, mode: "semantic" as const };
    }

    // Keyword fallback across skills, capabilities, projects and summary.
    const terms = data.query.toLowerCase().split(/[^a-z0-9+#.]+/).filter((t) => t.length > 2);
    const scored = dossiers
      .map((d: any) => {
        const haystack = [
          d.employee.name,
          d.employee.job_title,
          d.employee.department,
          d.employee.location,
          d.employee.profile_summary,
          ...d.empSkills,
          ...d.empProjects.map((p: any) => `${p.title} ${p.description ?? ""} ${p.role ?? ""}`),
          ...d.empAchievements.map((a: any) => `${a.title} ${a.impact ?? ""}`),
          ...d.empInsights.map((i: any) => `${i.capability} ${i.explanation ?? ""}`),
        ]
          .join(" ")
          .toLowerCase();
        const hits = terms.filter((t) => haystack.includes(t));
        return { d, hits };
      })
      .filter((row: any) => row.hits.length > 0)
      .sort((a: any, b: any) => b.hits.length - a.hits.length)
      .slice(0, 6);

    return {
      mode: "keyword" as const,
      results: scored.map(({ d, hits }: any) => ({
        employee: d.employee,
        skills: d.empSkills,
        capabilities: d.empInsights.map((i: any) => ({ capability: i.capability, confidence: Number(i.confidence) })),
        experience: d.empProjects.map((p: any) => p.title),
        reasons: [`Matched on: ${hits.join(", ")}`],
        relevance: hits.length > 2 ? "Strong" : "Partial",
        suggestedRoles: [] as string[],
      })),
    };
  });

export const emergingSkills = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as SupabaseCtx;

    const [{ data: skills }, { data: roles }, { data: learning }, { data: employees }] = await Promise.all([
      ctx.supabase.from("employee_skills").select("proficiency, employee_id, skills(name, category)"),
      ctx.supabase.from("internal_roles").select("title, department, required_skills, preferred_skills"),
      ctx.supabase.from("learning_records").select("course, skills_gained, completion_date"),
      ctx.supabase.from("employees").select("id, department"),
    ]);

    const summary = `Workforce size: ${employees?.length ?? 0}
Skill records: ${(skills ?? []).map((s: any) => `${s.skills?.name} (level ${s.proficiency})`).join(", ")}
Open roles need: ${(roles ?? []).map((r: any) => `${r.title}: ${(r.required_skills ?? []).join(", ")}`).join(" | ")}
Recent learning: ${(learning ?? []).map((l: any) => `${l.course} -> ${(l.skills_gained ?? []).join(", ")} (${l.completion_date})`).join(" | ")}`;

    const raw = await callAI([
      {
        role: "user",
        content: `${LANGUAGE_RULES}

Analyse this workforce data and produce organisational insights. Label everything as AI-generated organisational insight.

${summary}

Return ONLY JSON:
{"growing":[{"skill":"...","insight":"..."}],"shortages":[{"skill":"...","insight":"..."}],"future_gaps":[{"skill":"...","insight":"..."}]}
Base every insight on the data above. Keep each insight under 30 words.`,
      },
    ]);

    const parsed = parseJSON<{
      growing?: Array<{ skill: string; insight: string }>;
      shortages?: Array<{ skill: string; insight: string }>;
      future_gaps?: Array<{ skill: string; insight: string }>;
    }>(raw);

    if (parsed) {
      return {
        mode: "ai" as const,
        growing: parsed.growing ?? [],
        shortages: parsed.shortages ?? [],
        futureGaps: parsed.future_gaps ?? [],
      };
    }

    // Deterministic fallback: compare demand from open roles with supply on record.
    const supply = new Map<string, number>();
    for (const row of skills ?? []) {
      const name = (row as any).skills?.name;
      if (name) supply.set(name, (supply.get(name) ?? 0) + 1);
    }
    const demand = new Map<string, number>();
    for (const role of roles ?? []) {
      for (const name of [...((role as any).required_skills ?? []), ...((role as any).preferred_skills ?? [])]) {
        demand.set(name, (demand.get(name) ?? 0) + 1);
      }
    }
    const learningCounts = new Map<string, number>();
    for (const row of learning ?? []) {
      for (const name of (row as any).skills_gained ?? []) {
        learningCounts.set(name, (learningCounts.get(name) ?? 0) + 1);
      }
    }

    return {
      mode: "computed" as const,
      growing: [...learningCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([skill, count]) => ({
          skill,
          insight: `${count} recent course completion${count > 1 ? "s" : ""} added this skill, so capability here is growing.`,
        })),
      shortages: [...demand.entries()]
        .filter(([skill]) => (supply.get(skill) ?? 0) <= 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([skill, count]) => ({
          skill,
          insight: `Required by ${count} open role${count > 1 ? "s" : ""} but held by at most one person on record.`,
        })),
      futureGaps: [...demand.entries()]
        .filter(([skill]) => (supply.get(skill) ?? 0) === 0)
        .slice(0, 4)
        .map(([skill]) => ({
          skill,
          insight: "No recorded capability anywhere in the workforce while open roles ask for it.",
        })),
    };
  });
