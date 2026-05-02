import { renderToneBlock, type ToneProfile } from "../prompts/tone"

const profiles: { label: string; tone: ToneProfile }[] = [
  {
    label: "conversational, concise, mentions paper + asks question",
    tone: {
      voice: "conversational",
      length: "concise",
      traits: [
        "mentions_specific_paper",
        "asks_genuine_question",
        "avoids_buzzwords",
      ],
      confidence: "high",
      signaturePhrases: ["I built", "ended up shipping", "the gnarly part was"],
      avoidPhrases: ["leverage", "synergize", "passionate about"],
    },
  },
  {
    label: "formal, detailed, humble tone with shared interest + career goals",
    tone: {
      voice: "formal",
      length: "detailed",
      traits: [
        "mentions_specific_paper",
        "references_shared_interest",
        "mentions_career_goals",
        "keeps_it_personal",
      ],
      confidence: "high",
      signaturePhrases: ["I am particularly drawn to", "this raises the question of"],
      avoidPhrases: ["super cool", "pretty awesome"],
    },
  },
  {
    label: "direct, moderate, no traits selected, empty phrase lists",
    tone: {
      voice: "direct",
      length: "moderate",
      traits: [],
      confidence: "medium",
      signaturePhrases: [],
      avoidPhrases: [],
    },
  },
  {
    label: "enthusiastic, concise, uses_first_name override + data-driven",
    tone: {
      voice: "enthusiastic",
      length: "concise",
      traits: ["uses_first_name", "data_driven_language", "keeps_it_personal"],
      confidence: "low",
      signaturePhrases: ["weak signal"],
      avoidPhrases: [],
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
