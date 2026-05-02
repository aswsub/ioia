import Anthropic from "@anthropic-ai/sdk"
import {
  EXTRACT_TONE_SYSTEM,
  buildToneExtractorUserMessage,
  TONE_PROFILE_TOOL,
} from "./prompts/extract_tone"
import type { ToneProfile } from "./prompts/tone"

// The extractor only fills the slice of ToneProfile that comes from the
// writing sample. Voice / length / traits are user-selected on the frontend
// and get merged in downstream.
type ExtractedTonePhrases = Pick<
  ToneProfile,
  "signaturePhrases" | "avoidPhrases" | "confidence"
>

const client = new Anthropic()

async function extractTone(sample: string): Promise<ExtractedTonePhrases> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 800,
    system: EXTRACT_TONE_SYSTEM,
    tools: [TONE_PROFILE_TOOL as unknown as Anthropic.Messages.Tool],
    tool_choice: { type: "tool", name: TONE_PROFILE_TOOL.name },
    messages: [{ role: "user", content: buildToneExtractorUserMessage(sample) }],
  })

  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === TONE_PROFILE_TOOL.name) {
      return block.input as ExtractedTonePhrases
    }
  }
  throw new Error(
    `expected a ${TONE_PROFILE_TOOL.name} tool_use block; got stop_reason=${response.stop_reason}`,
  )
}

const fixtures: { label: string; sample: string }[] = [
  {
    label: "casual hackathon writeup",
    sample: `Built a thing this weekend that scrapes professor pages and dumps a CSV. Honestly thought it'd take 2 hours, ended up shipping at 4am. The gnarly part was OpenAlex rate limits — I ended up batching with backoff and that fixed it. Not perfect but it works on three universities.`,
  },
  {
    label: "formal research statement excerpt",
    sample: `My undergraduate research has focused on the application of program synthesis techniques to the verification of distributed systems. I am particularly drawn to the question of how synthesized invariants can be made interpretable to the engineers who must maintain them. This raises the broader question of whether the artifacts of formal methods can be designed for human collaboration rather than purely for machine consumption.`,
  },
  {
    label: "short LinkedIn About (deliberately weak sample)",
    sample: `CS junior at Cal Poly. Interested in compilers and ML systems. Looking for summer 2026 research roles.`,
  },
]

async function main() {
  for (const { label, sample } of fixtures) {
    console.log("=".repeat(72))
    console.log(label)
    console.log("=".repeat(72))
    console.log("sample:")
    console.log(sample)
    console.log()
    const phrases = await extractTone(sample)
    console.log("extracted phrases + confidence:")
    console.log(JSON.stringify(phrases, null, 2))
    console.log()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
