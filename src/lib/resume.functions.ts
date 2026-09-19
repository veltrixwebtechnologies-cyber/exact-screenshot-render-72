import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAI, parseJSON } from "@/lib/ai.server";
import {
  deterministicExtraction,
  mentionStrength,
  normalizeExtraction,
  type ResumeExtraction,
} from "@/lib/resume-extract";

const RESERVED = new Set([
  "orgs",
  "about",
  "features",
  "pricing",
  "enterprise",
  "explore",
  "topics",
  "collections",
  "events",
  "sponsors",
  "login",
  "join",
  "settings",
  "marketplace",
  "apps",
  "blog",
]);

export function detectGithubUsername(text: string): string | null {
  const re = /github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const candidate = match[1];
    if (!candidate) continue;
    if (RESERVED.has(candidate.toLowerCase())) continue;
    return candidate;
  }
  return null;
}

function detectLinks(text: string): string[] {
  const re = /https?:\/\/[^\s)<>",]+/gi;
  return [...new Set(text.match(re) ?? [])].slice(0, 20);
}

async function extractResumeText(fileName: string, bytes: ArrayBuffer): Promise<string> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: true });
    return typeof text === "string" ? text : (text as string[]).join("\n");
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Stores an uploaded resume, reads its text, and reports any GitHub profile
 * link found. Reading the resume never touches GitHub — the employee must
 * authorize that separately.
 */
export const processResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { filePath: string; fileName: string }) => {
    if (!input?.filePath || !input?.fileName) throw new Error("A resume file is required.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };

    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!employee) throw new Error("No employee profile found for this account.");

    if (!data.filePath.startsWith(`${userId}/`)) {
      throw new Error("Unauthorized file path.");
    }

    const download = await supabase.storage.from("resumes").download(data.filePath);
    if (download.error || !download.data) {
      throw new Error(download.error?.message ?? "Could not read the uploaded file.");
    }

    const bytes = await (download.data as Blob).arrayBuffer();
    let text = "";
    try {
      text = await extractResumeText(data.fileName, bytes);
    } catch (error) {
      console.error("Resume text extraction failed", error);
    }

    const cleaned = text.replace(/\u0000/g, " ").slice(0, 60000);
    const githubUsername = detectGithubUsername(cleaned);

    const insert = await supabase
      .from("employee_resumes")
      .insert({
        employee_id: employee.id,
        file_name: data.fileName,
        file_path: data.filePath,
        extracted_text: cleaned || null,
        detected_github_username: githubUsername,
        detected_links: detectLinks(cleaned),
      })
      .select("id, file_name, detected_github_username, created_at")
      .maybeSingle();

    if (insert.error) throw new Error(insert.error.message);

    const applied =
      cleaned.length > 40
        ? await applyResumeToProfile(supabase, employee.id, cleaned)
        : { skills: 0, projects: 0, achievements: 0, certifications: 0, learning: 0, portfolioUrl: null };

    return {
      resume: insert.data,
      githubUsername,
      readable: cleaned.length > 40,
      applied,
    };
  });

/** Asks the model for structure, but only accepts fields present in the resume. */
async function extractionFor(text: string): Promise<ResumeExtraction> {
  const deterministic = deterministicExtraction(text);
  const raw = await callAI(
    [
      {
        role: "system",
        content: [
          "You read a resume and return structured JSON.",
          "Use ONLY information written in the resume. Never invent projects, employers, numbers, technologies, certifications or dates.",
          "Never judge the person or claim they are talented at something — only record what the resume states.",
          "Return JSON only: {\"job_title\":string,\"summary\":string,\"skills\":string[],\"projects\":[{\"title\":string,\"description\":string,\"technologies\":string[]}],\"achievements\":[{\"title\":string,\"impact\":string}],\"certifications\":[{\"name\":string,\"issuer\":string}],\"learning\":[{\"course\":string,\"provider\":string}],\"portfolio_url\":string}",
          "Keep each description under 60 words. Omit a field rather than guessing it.",
        ].join(" "),
      },
      { role: "user", content: `Resume text:\n${text.slice(0, 12000)}` },
    ],
    { model: "openai/gpt-6-astra", temperature: 0.1 },
  );

  const parsed = normalizeExtraction(parseJSON<unknown>(raw), text);
  if (!parsed) return deterministic;

  // Merge: the model adds structure, the deterministic pass guarantees coverage.
  return {
    jobTitle: parsed.jobTitle ?? deterministic.jobTitle,
    summary: parsed.summary ?? deterministic.summary,
    skills: [...new Set([...parsed.skills, ...deterministic.skills])],
    projects: parsed.projects.length ? parsed.projects : deterministic.projects,
    achievements: parsed.achievements.length ? parsed.achievements : deterministic.achievements,
    certifications: parsed.certifications.length ? parsed.certifications : deterministic.certifications,
    learning: parsed.learning.length ? parsed.learning : deterministic.learning,
    portfolioUrl: parsed.portfolioUrl ?? deterministic.portfolioUrl,
  };
}

/**
 * Turns the resume into profile records so every other screen has data to work
 * with the moment the upload finishes. Existing records are never overwritten.
 */
async function applyResumeToProfile(supabase: any, employeeId: string, text: string) {
  const extraction = await extractionFor(text);
  const counts = { skills: 0, projects: 0, achievements: 0, certifications: 0, learning: 0 };

  // Fill only blank profile fields — the employee's own edits win.
  const { data: employee } = await supabase
    .from("employees")
    .select("job_title, summary")
    .eq("id", employeeId)
    .maybeSingle();
  const patch: Record<string, string> = {};
  if (!employee?.job_title && extraction.jobTitle) patch["job_title"] = extraction.jobTitle;
  if (!employee?.summary && extraction.summary) patch["summary"] = extraction.summary;
  if (Object.keys(patch).length) {
    await supabase.from("employees").update(patch).eq("id", employeeId);
  }

  const existingTitles = async (table: string, column: string) => {
    const { data } = await supabase.from(table).select(column).eq("employee_id", employeeId);
    return new Set((data ?? []).map((row: any) => String(row[column] ?? "").toLowerCase()));
  };

  const projectTitles = await existingTitles("projects", "title");
  for (const project of extraction.projects) {
    if (projectTitles.has(project.title.toLowerCase())) continue;
    const { error } = await supabase.from("projects").insert({
      employee_id: employeeId,
      title: project.title,
      description: project.description || null,
      technologies: project.technologies,
      outcomes: null,
    });
    if (!error) counts.projects += 1;
  }

  const achievementTitles = await existingTitles("achievements", "title");
  for (const achievement of extraction.achievements) {
    if (achievementTitles.has(achievement.title.toLowerCase())) continue;
    const { error } = await supabase.from("achievements").insert({
      employee_id: employeeId,
      title: achievement.title,
      impact: achievement.impact,
    });
    if (!error) counts.achievements += 1;
  }

  const certNames = await existingTitles("certifications", "name");
  for (const cert of extraction.certifications) {
    if (certNames.has(cert.name.toLowerCase())) continue;
    const { error } = await supabase.from("certifications").insert({
      employee_id: employeeId,
      name: cert.name,
      issuer: cert.issuer,
    });
    if (!error) counts.certifications += 1;
  }

  const courses = await existingTitles("learning_records", "course");
  for (const record of extraction.learning) {
    if (courses.has(record.course.toLowerCase())) continue;
    const { error } = await supabase.from("learning_records").insert({
      employee_id: employeeId,
      course: record.course,
      provider: record.provider,
      skills_gained: [],
    });
    if (!error) counts.learning += 1;
  }

  // Skills live in a shared catalogue that employees cannot write to, so the
  // resume-sourced rows are written with the service client after the caller
  // has already been authenticated and scoped to their own employee row.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  for (const name of extraction.skills.slice(0, 30)) {
    const existing = await (supabaseAdmin as any)
      .from("skills")
      .select("id")
      .ilike("name", name)
      .maybeSingle();
    let skillId = existing.data?.id as string | undefined;
    if (!skillId) {
      const created = await (supabaseAdmin as any)
        .from("skills")
        .insert({ name, category: "Technical" })
        .select("id")
        .maybeSingle();
      skillId = created.data?.id as string | undefined;
    }
    if (!skillId) continue;

    const { proficiency, confidence, count } = mentionStrength(text, name);
    const evidence = `Named in the uploaded resume (${count} ${count === 1 ? "mention" : "mentions"}).`;

    const current = await (supabaseAdmin as any)
      .from("employee_skills")
      .select("id, source")
      .eq("employee_id", employeeId)
      .eq("skill_id", skillId)
      .maybeSingle();

    if (current.data) {
      if (current.data.source === "Resume") {
        await (supabaseAdmin as any)
          .from("employee_skills")
          .update({ proficiency, confidence, evidence, last_updated: new Date().toISOString() })
          .eq("id", current.data.id);
        counts.skills += 1;
      }
      continue;
    }

    const { error } = await (supabaseAdmin as any).from("employee_skills").insert({
      employee_id: employeeId,
      skill_id: skillId,
      proficiency,
      confidence,
      source: "Resume",
      evidence,
    });
    if (!error) counts.skills += 1;
  }

  return { ...counts, portfolioUrl: extraction.portfolioUrl };
}
