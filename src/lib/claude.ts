/// <reference types="vite/client" />
import Anthropic from "@anthropic-ai/sdk";
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
import { ExtractedTonePhrasesSchema, EmailDraftSchema } from "../../cold_email_workflow/schemas";
import type { ToneProfile } from "../../cold_email_workflow/prompts/tone";

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

export async function extractKeywordsFromPrompt(prompt: string): Promise<{
  researchAreas: string[];
  institutions: string[];
  opportunityType: "research" | "internship";
}> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 400,
    system: `You extract structured search parameters from a student's natural language prompt about finding professors or research opportunities.

Return a JSON object with:
- researchAreas: string[] — research topics, fields, keywords (e.g. ["LLMs", "RLHF", "distributed systems"])
- institutions: string[] — universities or schools mentioned (e.g. ["MIT", "Stanford"]) — empty array if none specified
- opportunityType: "research" | "internship" — default to "research" if unclear

Return ONLY valid JSON, no prose.`,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
  try {
    const parsed = JSON.parse(text);
    return {
      researchAreas: parsed.researchAreas ?? [],
      institutions: parsed.institutions ?? [],
      opportunityType: parsed.opportunityType ?? "research",
    };
  } catch {
    return { researchAreas: [], institutions: [], opportunityType: "research" };
  }
}
