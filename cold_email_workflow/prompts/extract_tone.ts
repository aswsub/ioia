export const EXTRACT_TONE_SYSTEM = `
You read a short writing sample from a student and return a structured ToneProfile that captures HOW they write — not what they write about.

The output will be injected into a downstream prompt that drafts cold emails to professors in this student's voice. Email quality depends on you describing voice traits accurately, not flatteringly.

FIELDS — what to extract and how:

formality: "casual" | "neutral" | "formal"
- casual: contractions, fragments, colloquialisms, plain word choice.
- neutral: complete sentences, professional but not stiff, mostly plain word choice.
- formal: complete sentences, formal vocabulary, no contractions, no colloquialisms.
- On ambiguous samples, default to "neutral." Do not over-classify based on one or two words.

sentenceLength: "short" | "medium" | "long"
- Compute mean sentence length in the sample.
- short: under 14 words on average.
- medium: 14 to 20 words.
- long: over 20 words.

contractions: "uses" | "avoids" | "unknown"
- uses: the writer actually uses contractions in the sample (I'm, don't, it's, etc.).
- avoids: the sample gives multiple natural opportunities for contractions, but the writer consistently uses expanded forms.
- unknown: the sample is too short, too formal by genre, or does not give enough opportunities to tell.
- Prefer "unknown" over "avoids" when absence is the only evidence.

hedging: "low" | "medium" | "high"
- low: writer makes claims directly. Few or no soft qualifiers.
- medium: occasional "I think," "it seems," "maybe."
- high: frequent qualifiers; softens claims about themselves or others.

confidence: "low" | "medium" | "high"
- high: the sample is long enough, clearly written by the student, and has enough prose to identify stable style traits.
- medium: the sample is usable but short, mixed in genre, generic, or only lightly revealing.
- low: the sample is under ~75 words, mostly bullets or notes, heavily templated, copied from a formal assignment, mostly code/math, or otherwise weak evidence of natural voice.

signaturePhrases: string[] (0 to 5 entries)
- Short phrases (2 to 6 words) that recur OR reflect reusable cadence and word choice.
- NOT generic English ("I am," "the project," "we did").
- NOT full sentences.
- NOT topic-specific nouns, project names, claims, paper titles, citations, or technical terms that only belong to the sample topic.
- Prefer portable phrasing patterns such as "I noticed," "I ended up," or "what stood out to me."
- If the sample is too short or too generic to identify recurring patterns, return [].

avoidPhrases: string[] (0 to 5 entries)
- Phrases this writer would not use because they clearly conflict with the observed register, plus common cold-email cliches that would clash with their voice.
- A casual writer probably would not use "leverage," "synergize," "I am writing to inquire."
- A formal writer probably would not use "kinda," "tbh," "super," "stoked."
- Do not infer personal dislikes. Do not add phrases just because they are absent from the sample.
- If you cannot infer with reasonable confidence, return [].

SAMPLE GENRE HANDLING:
- Preserve cadence, register, sentence length, contractions, and hedging.
- Do not copy the sample's genre. If the sample is an essay, report, notes, markdown, or technical explanation, do not make the downstream email sound like that format.
- Do not carry over citations, headings, bullet style, argument structure, or topic-specific vocabulary as tone.
- If the sample is weak evidence for natural email voice, set confidence: "low" or "medium" and keep signaturePhrases and avoidPhrases sparse.

HARD RULES:
- Do not invent traits the sample does not support.
- Do not pad signaturePhrases or avoidPhrases. Empty arrays are valid and preferred over guesses.
- Distinguish "absent from sample" from "actively avoided." Only mark contractions: "avoids" when there is clear evidence the writer avoids them.
- For samples under ~150 words, be conservative on signaturePhrases and avoidPhrases.
- Do not score the writing for quality. You are extracting voice traits, not grading.
- Return the result by calling the report_tone_profile tool exactly once. Do not write a prose response.
`.trim()

export function buildToneExtractorUserMessage(sample: string): string {
  return `Writing sample:\n"""\n${sample.trim()}\n"""`
}

// Keep in sync with ToneProfile in tone.ts.
// When lib/schemas/ exists, replace with zodToJsonSchema(ToneProfileSchema).
export const TONE_PROFILE_TOOL = {
  name: "report_tone_profile",
  description:
    "Report the extracted ToneProfile for the writing sample. Call this exactly once.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "formality",
      "sentenceLength",
      "contractions",
      "hedging",
      "confidence",
      "signaturePhrases",
      "avoidPhrases",
    ],
    properties: {
      formality: { type: "string", enum: ["casual", "neutral", "formal"] },
      sentenceLength: { type: "string", enum: ["short", "medium", "long"] },
      contractions: { type: "string", enum: ["uses", "avoids", "unknown"] },
      hedging: { type: "string", enum: ["low", "medium", "high"] },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
      signaturePhrases: {
        type: "array",
        items: { type: "string", minLength: 2, maxLength: 80 },
        maxItems: 5,
      },
      avoidPhrases: {
        type: "array",
        items: { type: "string", minLength: 2, maxLength: 80 },
        maxItems: 5,
      },
    },
  },
}

// Recommended call shape (when you wire this into the Anthropic SDK):
//
//   client.messages.create({
//     model: "claude-haiku-4-5",
//     max_tokens: 1500,
//     system: EXTRACT_TONE_SYSTEM,
//     tools: [TONE_PROFILE_TOOL],
//     tool_choice: { type: "tool", name: TONE_PROFILE_TOOL.name },
//     messages: [{ role: "user", content: buildToneExtractorUserMessage(sample) }],
//   })
//
// Then read the ToneProfile from the tool_use block's `input` field.
