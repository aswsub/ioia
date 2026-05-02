import { renderToneBlock, type ToneProfile } from "../prompts/tone"

const profiles: { label: string; tone: ToneProfile }[] = [
  {
    label: "casual CS undergrad, contractions, low hedge",
    tone: {
      formality: "casual",
      sentenceLength: "short",
      contractions: "uses",
      hedging: "low",
      confidence: "high",
      signaturePhrases: ["I built", "ended up shipping", "the gnarly part was"],
      avoidPhrases: ["leverage", "synergize", "passionate about"],
    },
  },
  {
    label: "formal pre-PhD applicant, no contractions, high hedge",
    tone: {
      formality: "formal",
      sentenceLength: "long",
      contractions: "avoids",
      hedging: "high",
      confidence: "high",
      signaturePhrases: ["I am particularly drawn to", "this raises the question of"],
      avoidPhrases: ["super cool", "pretty awesome"],
    },
  },
  {
    label: "neutral, medium length, empty phrase lists",
    tone: {
      formality: "neutral",
      sentenceLength: "medium",
      contractions: "unknown",
      hedging: "medium",
      confidence: "medium",
      signaturePhrases: [],
      avoidPhrases: [],
    },
  },
  {
    label: "weak sample, low confidence fallback",
    tone: {
      formality: "casual",
      sentenceLength: "short",
      contractions: "unknown",
      hedging: "low",
      confidence: "low",
      signaturePhrases: ["not enough evidence"],
      avoidPhrases: ["overly specific avoid"],
    },
  },
]

for (const { label, tone } of profiles) {
  console.log("=".repeat(72))
  console.log(label)
  console.log("=".repeat(72))
  console.log(renderToneBlock(tone))
  console.log()
}
