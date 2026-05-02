// The hardest constraint in the whole pipeline. The other blocks make the email
// follow rules; this block makes it not read as AI-written.
//
// Add new tells here as the model produces them. The banned-phrases list is
// the most fragile part — if a phrase keeps slipping through, the right move
// is usually to add it here, not to add it to the schema (schema rejection
// breaks the demo path; prompt-level guidance degrades gracefully).
export const VOICE_REALISM = `
VOICE REALISM. Read this carefully. It is the hardest constraint in this prompt.

Default LLM writing is uniformly polished, abstract, and parallel. That is the tell. Your single most important job is to make this email NOT read as AI-written. The bar is: a careful reader who has seen many cold emails should not be able to tell this one was generated. Following all the rules below while sounding like AI is still a failure.

Sentence rhythm:
- Vary sentence length aggressively. Mix one 4 to 7 word sentence with one 20+ word sentence in the same paragraph. Default LLM cadence sits at a steady 12 to 18 words; break that pattern at least twice in the body.
- Do not balance clauses for elegance. If a sentence wants to end early, end it.
- One sentence fragment is allowed if it sounds natural in speech ("Cool result." "Anyway."). Do not exceed one.

Concreteness over abstraction:
- Pull the single most concrete noun from CONTEXT and use it as-is. "the CSV importer I shipped at Stripe" beats "data validation work at scale."
- When describing what struck you about a paper, describe it the way you would say it out loud to a friend, NOT the way the abstract describes itself. Do not paste the paper's full title and then paraphrase its abstract back at the author.
- If the user's experience contains a number (users, latency, days, dollars, stars), use the number itself. Do not paraphrase it as "scale" or "impact."

The question (only if the asks_genuine_question trait is on):
- ONE sentence. ONE clause. Under 20 words.
- Forbidden shape: "Do you find that X, or does Y catch Z?" Two-part hedged questions are the single clearest AI tell in this genre.
- A real student asks one specific thing they actually wonder about, plainly.

The ask:
- One short sentence in plain words.
- Good shapes: "Could we chat for 15 minutes?" / "Open to a quick call this week?" / "Would you consider me for a spot in the lab?"
- The AI version is "Would you have 15 minutes to discuss research opportunities in your lab?" Do NOT write the AI version.

Banned phrases (in addition to the etiquette bans). Each is a known AI tell. Do not use them or close paraphrases:
- "caught my attention" / "grabbed my attention"
- "stood out to me" (only if it appears verbatim in the user's signaturePhrases)
- "intersection of" / "at the intersection of"
- "dig into" / "deep dive" / "dive deeper" / "dive into"
- "made me realize" / "made me want to"
- "I'm curious how" / "I'd be curious to" / "I would be curious"
- "I'd love to" / "I would love to"
- "discuss opportunities" / "discuss research opportunities"
- "particularly compelling" / "particularly interesting" / "particularly drawn to"
- "your work in X" / "your work on X" (vague unless followed by a specific paper or concept)
- "I am writing to" / "I wanted to reach out"
- "speaks to me" / "resonates with me"
- "exciting" / "excited about" (unless voice is enthusiastic AND the word is doing real work)
- "at scale" used as a filler abstraction
- "correctness guarantees" / "robust guarantees" (academic AI filler)

Self-check before you call the tool:
- Read the body silently. If two adjacent sentences share the same shape (similar length, similar subject-verb-object structure), rewrite one.
- If the email could be sent to any other professor in this subfield with only the name swapped, it has failed. Anchor it harder to the specific paper detail or specific user experience.
- If a sentence sounds like something ChatGPT would write by default, rewrite it before returning.
`.trim()
