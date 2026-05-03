/// <reference types="vite/client" />
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  EXTRACT_TONE_SYSTEM,
  buildToneExtractorUserMessage,
  TONE_PROFILE_TOOL,
} from "../../cold_email_workflow/prompts/extract_tone";
import {
  buildDraftEmailSystem,
  buildDraftEmailUserMessage,
  EMAIL_DRAFT_TOOL,
  type DraftEmailInput,
  type EmailDraft,
} from "../../cold_email_workflow/prompts/draft_email";
import {
  EXTRACT_KEYWORDS_SYSTEM,
  buildExtractKeywordsUserMessage,
  ExtractedKeywordsSchema,
  type ExtractedKeywords,
} from "../../cold_email_workflow/prompts/extract_keywords";
import { ExtractedTonePhrasesSchema, EmailDraftSchema } from "../../cold_email_workflow/schemas";
import type { ToneProfile } from "../../cold_email_workflow/prompts/tone";
import type { Project } from "../../cold_email_workflow/prompts/context";

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY as string,
  dangerouslyAllowBrowser: true,
});

// ── Tone extraction ───────────────────────────────────────────────────────────

export async function extractToneFromSample(
  sample: string
): Promise<Pick<ToneProfile, "signaturePhrases" | "avoidPhrases" | "confidence">> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 800,
    system: EXTRACT_TONE_SYSTEM,
    tools: [TONE_PROFILE_TOOL as unknown as Anthropic.Messages.Tool],
    tool_choice: { type: "tool", name: TONE_PROFILE_TOOL.name },
    messages: [{ role: "user", content: buildToneExtractorUserMessage(sample) }],
  });

  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === TONE_PROFILE_TOOL.name) {
      return ExtractedTonePhrasesSchema.parse(block.input);
    }
  }
  // Fallback if extraction fails
  return { signaturePhrases: [], avoidPhrases: [], confidence: "low" };
}

// ── Project extraction from resume ────────────────────────────────────────────

const ProjectsSchema = z.array(
  z.object({
    name: z.string().min(2).max(100),
    description: z.string().min(10).max(500),
    technologies: z.array(z.string()).optional(),
    link: z.string().url().optional().nullable(),
  })
);

export async function extractProjectsFromResume(resumeText: string): Promise<Project[]> {
  if (!resumeText || resumeText.length < 50) return [];

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1000,
      system: `You are a resume parser. Extract projects from the resume text.
Return a JSON array of projects. Each project should have:
- name: project title/name
- description: 1-2 sentence description of what the project does
- technologies: array of tech stack used (optional)
- link: URL to project if mentioned (optional, can be null)

Focus on actual projects, not just job responsibilities. Skip generic descriptions.
Return ONLY valid JSON array, no markdown or extra text.`,
      messages: [
        {
          role: "user",
          content: `Extract all projects from this resume:\n\n${resumeText}`,
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text")?.text ?? "[]";
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned);
    return ProjectsSchema.parse(parsed);
  } catch (e) {
    console.warn("Failed to extract projects:", e);
    return [];
  }
}

// ── Email drafting ────────────────────────────────────────────────────────────

function normalizeEmailDashes<T extends { subject?: unknown; body?: unknown }>(draft: T): T {
  const replace = (s: string) => s.replace(/[\u2013\u2014]/g, "-");
  const subject = typeof draft.subject === "string" ? replace(draft.subject) : draft.subject;
  const body = typeof draft.body === "string" ? replace(draft.body) : draft.body;
  return { ...draft, subject, body };
}

function truncateWarnings<T extends { warnings?: unknown }>(draft: T): T {
  if (!Array.isArray(draft.warnings)) return draft;
  const truncated = draft.warnings.map((w: unknown) =>
    typeof w === "string" ? w.slice(0, 200) : w
  );
  return { ...draft, warnings: truncated };
}

export async function draftEmail(input: DraftEmailInput): Promise<EmailDraft> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1200,
    system: buildDraftEmailSystem(input),
    tools: [EMAIL_DRAFT_TOOL as unknown as Anthropic.Messages.Tool],
    tool_choice: { type: "tool", name: EMAIL_DRAFT_TOOL.name },
    messages: [{ role: "user", content: buildDraftEmailUserMessage(input) }],
  });

  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === EMAIL_DRAFT_TOOL.name) {
      return EmailDraftSchema.parse(truncateWarnings(normalizeEmailDashes(block.input as any)));
    }
  }
  throw new Error("Email draft tool call not found in response");
}

// ── Keyword extraction from chat prompt ──────────────────────────────────────

export async function extractKeywordsFromPrompt(prompt: string): Promise<ExtractedKeywords> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 400,
    system: EXTRACT_KEYWORDS_SYSTEM,
    messages: [{ role: "user", content: buildExtractKeywordsUserMessage(prompt) }],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
  // Strip ```json fences if the model included them despite instructions.
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    return ExtractedKeywordsSchema.parse(JSON.parse(cleaned));
  } catch {
    return { researchAreas: [], institutions: [], opportunityType: "research" };
  }
}
