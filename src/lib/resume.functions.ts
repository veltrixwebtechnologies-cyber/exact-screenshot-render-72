import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

    return {
      resume: insert.data,
      githubUsername,
      readable: cleaned.length > 40,
    };
  });
