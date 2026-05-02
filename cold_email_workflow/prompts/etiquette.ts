export const RESEARCH_ETIQUETTE = `
NORMS FOR EMAILING A PROFESSOR ABOUT RESEARCH:

Subject line:
- 4 to 8 words.
- Specific to the professor's work or the student's ask. Not generic.
- No "Inquiry," "Quick question," "Hello Professor," or "Research opportunity."
- Good: "Undergrad interested in your SAT solver work"
- Bad: "Research Inquiry from Cal Poly Student"

Opening:
- Exactly TWO short sentences (per the VOICE REALISM "opener" rule).
- Sentence 1: identify the writer. Full name, year (only if in CONTEXT), school. Major if it adds signal. Stop there.
- Sentence 2: ONE specific reason the writer is reaching out NOW — a class they are taking, a project they are working on, a specific chain of how they found the professor, or (fallback) a small-admission shape ("I've been teaching myself X this term"). Must be grounded in CONTEXT, must topically lead into the paper paragraph that follows.
- The added signal must NOT be a list. "Interested in X and Y" / "focused on X, Y, and Z" / "working at the intersection of X and Y" are banned shapes — see the VOICE REALISM "opener" rule.
- Do NOT invent year, age, timing, or any biographical detail not present in CONTEXT. GPA is in CONTEXT but should be referenced only if it directly supports the ask; do not include it as a generic credential.
- Do NOT open with "I hope this email finds you well," "My name is," or "I am reaching out because."
- Just say what you are and why you are writing.

Reference to their work:
- Reference exactly ONE specific recent paper by title (or a specific project from their homepage).
- Show one concrete thing you took from it: a method, a finding, a question it raised.
- Do not open the reference with "Your paper caught my eye." That phrase reads generated.
- Do not write "The idea of X is compelling" or praise the paper. Professors do not need a student review of the paper.
- Keep the paper reference to one grounded observation, then move on.
- Only reference papers, methods, projects, lab details, or affiliations that are present in the provided professor context.
- Do not invent familiarity, shared interests, lab openings, prior contact, or details about the professor's work.
- If the provided context is too weak to support a specific reference, return confidence: "low" with a warning instead of faking specificity.
- Do not say "I read your work" or "I find your research fascinating."
- Do not summarize their entire research agenda back at them.

The interest declaration:
- Between the paper paragraph and the experience paragraph, include EXACTLY ONE sentence stating what kind of problem the writer wants to work on. It is its own structural beat — write it as a one-sentence paragraph, OR as the last sentence of the paper paragraph, OR as the first sentence of the experience paragraph (pick whichever reads most naturally).
- The sentence must do three things at once:
  1. Name a SPECIFIC technical area, not a broad field. "Invariant synthesis for distributed protocols," not "formal methods." "Compiler infrastructure for ML kernels," not "systems." Pull the area from CONTEXT.researchInterests, or from the overlap between user interests and the professor's concepts.
  2. Be HONEST about the writer's level. A junior is not going to "contribute novel results in" anything. The right verbs are "learn how X actually works in practice," "build skill in X," "work on X under supervision."
  3. CONNECT explicitly to what the professor does, but NOT by flattery. Good: "This is the kind of work I want to spend the next two years on." Bad (flattery): "Your group's work is exactly what I want to do."
- Banned shapes (also enforced by VOICE REALISM): "I am passionate about X." "I am deeply interested in X." "X is my dream area." "X is exactly what I want to do." Anything with "passionate," "deeply," or "dream" is banned.
- This sentence is NOT the post-experience bridge banned in VOICE REALISM. It is a substantive declaration of intent that comes BEFORE the experience paragraph, not after. The post-experience transition ban still applies separately.
- WHEN THERE IS NO OVERLAP: if no item in CONTEXT.experience meaningfully overlaps with the professor's research (per the VOICE REALISM "name the gap" rule), this sentence is the natural place to name the gap honestly. Example shape: "I have not worked on X directly, but I want to spend the next two years learning how it actually works in practice." Use this in place of the standard interest-declaration shape, not in addition to it.

Connection to the student:
- Tie to ONE specific experience or project from the student's background, AND surface one slightly-awkward specific detail from that experience (the authenticity-signal rule in VOICE REALISM). If the user's experience description does not contain enough material to ground that detail honestly, OMIT this paragraph entirely per the VOICE REALISM rule rather than writing a generic experience tie. The VOICE REALISM rule overrides this requirement.
- Be concrete: name the project, the tool, the result. Numbers if relevant.
- Do not list multiple things. One experience item, well-described.
- Do NOT write a transition sentence linking the experience to the professor's research. The reader infers the connection from the pairing; the VOICE REALISM block governs this rule and overrides any prior instruction to spell out the link.
- End the experience paragraph at the experience. Start the next paragraph with the ask.
- Include timing and availability when the user's context provides it: target term/season, start date, or hours per week.
- Do not invent availability. If timing or weekly commitment is not provided, omit it.
- Do not invent dates, seasons, or relative timing for experiences. If an experience has no startDate/endDate, do not write "last summer," "this semester," or similar timing.

The ask:
- Direct. Process-oriented, not self-promotional. Ask about the LAB'S intake state and the next concrete step (e.g. "Is your group taking undergrads for fall 2026, and if so what's the right way to apply?"), NOT about whether the professor will "consider" the writer. Cover-letter framing reads as cover-letter writing.
- Best phrasing shapes: "Is your group taking undergrads for fall 2026, and if so what's the right way to apply?" / "Are you accepting research students this term, and what's the usual process?" / "Could we chat for 15 minutes?" / "Open to a quick call to talk about whether this is a fit?"
- Avoid self-promotional asks like "Would you consider me for a spot in the lab" — that frames the writer as a candidate to be evaluated and reads as a cover letter. Use the intake-process framing instead. The full rule lives in the VOICE REALISM "ask" section.
- Do not write "Would you have 15 minutes to discuss research opportunities" — that is the AI default and reads as such.
- Do not ask "if there are any opportunities" without specifying what kind.
- Do not apologize for emailing.

Attachments and links:
- Mention a resume, GitHub, portfolio, personal website, transcript, or project link only if it is present in the user's context.
- Include at most two supporting materials, and prefer the most relevant one or two.
- Do not say something is attached unless the workflow has actually attached it. Otherwise say it is available to send.

Length:
- Under 150 words for the body. Aim for 100 to 130.
- Three to four short paragraphs, or two slightly longer ones.

Closing:
- One line. Pick "Best," or "Thanks," DELIBERATELY based on tone.voice — these are not interchangeable:
  - "Thanks," when tone.voice is "conversational," "enthusiastic," or "humble." A 15-minute meeting is asking a small favor, and thanking in advance lands well in casual or warm voices.
  - "Best," when tone.voice is "formal" or "direct." Slightly more formal; works when the writer does not personally know the recipient and avoids the implied warmth of "Thanks."
  - When in doubt, "Best," is the safer default.
- Full name on the next line.
- No quotes, no signatures with five contact methods, no pronouns block unless the tone profile suggests it.

Hard avoids regardless of tone:
- Em dash or en dash characters. Use commas, periods, plain hyphens, or "and" instead.
- "I hope this email finds you well."
- "I am reaching out because."
- "I would love the opportunity to."
- "Please let me know if."
- Exclamation points beyond at most one.
- Evaluative adjectives applied to the professor's work (full ban, all grammatical forms): "compelling," "fascinating," "interesting," "impressive," "exciting," "novel," "elegant," "beautiful," "powerful," "important," "groundbreaking," "innovative," "thoughtful," "clever," "rigorous," "promising," "remarkable," "incredible." To convey that something mattered to the writer, name an action they took (read it twice, tried to reimplement it, sent it to a friend), not a label. Full rule lives in the VOICE REALISM block.
- Flattery in any form.
- Inventing year, age, or any biographical detail not present in CONTEXT.
- Any sentence that could be sent to any other professor unchanged.
`.trim()

export const INTERNSHIP_ETIQUETTE = `
NORMS FOR COLD EMAILING ABOUT A SOFTWARE ENGINEERING INTERNSHIP OR EARLY-CAREER ROLE:

POSTURE:
This email is a sales pitch for the writer as an engineer. It is not a research inquiry. The voice is shorter, punchier, more verb-driven, and more direct than a research email. The writer is selling capability, not curiosity.

SUBJECT LINE (this matters more than the body):
- Format: "[Credential signal] interested in [specific role or team] @ [Company]"
- 5 to 7 words. Must render on mobile (under 60 characters).
- The credential before "interested in" is the click. Pick the strongest signal the writer has, in this priority order:
  1. Prior internship at a known company ("Ex-Stripe intern...")
  2. Shipped product with users or stars ("Built fere.dev (200 GitHub stars)...")
  3. Hackathon win or competition placement ("HackMIT 2025 winner...")
  4. School + concrete skill ("Cal Poly engineer who ships React Native...")
  5. Specific technical achievement ("Built CSV importer that 10x'd onboarding speed...")
- The "specific role or team" must reference an actual team, product, or technical area at the company, not the company in general.
- Examples that work:
  - "Ex-Stripe intern interested in Linear's sync engine"
  - "Cal Poly junior who built a CSV importer @ Ramp"
  - "HackMIT winner interested in Vercel's edge runtime"
- Examples that fail:
  - "Internship inquiry"
  - "Software engineering opportunities"
  - "Cal Poly student interested in your company"
- Forbidden subject line words: "inquiry," "opportunity," "opportunities," "application," "request," "quick question," "hello."

OPENER (sentence 1):
- Identify the writer in one sentence: name, year, school, and the strongest credential signal repeated from the subject line.
- Do NOT open with "I hope this email finds you well," "I am reaching out because," "My name is," or "I came across [Company] and."
- Just state who you are and what you've done. Example shape: "I'm Sid, a CS junior at Cal Poly. Last summer I built X at Y."

THE HOOK (sentence 2):
- One sentence about a specific thing the company or team did, such as a blog post, a product decision, a technical talk, a recent launch, or an open-source repo.
- Must be specific enough that it could not be sent to any other company unchanged.
- Do NOT compliment the company. Do NOT say "I love what you're doing." Show the research by referencing a specific artifact.
- Example: "Your post on rebuilding the sync engine from scratch was one of the better systems writeups I read this year."

THE PROOF (sentences 3-4):
- One specific project the writer built, with numbers and a link.
- Format: [what it does] + [scale/result number] + [link].
- The project must be the one most relevant to the team being emailed, NOT the most impressive one. If the most impressive project is unrelated, demote it to a brief mention or omit.
- Numbers required wherever possible: users, GitHub stars, latency improvement, dollars saved, time saved, scale processed.
- Link to GitHub, a deployed URL, a demo video, or a portfolio. Inline link, not "see attached."
- Example: "I built fere.dev, a macOS dev tool that maps local environments. 200+ stars, 1k installs in the first month: github.com/sid/fere"

THE ASK (sentence 5):
- Be specific. Not "would love to chat." Not "any opportunities."
- Pick one of these shapes:
  - "Are you taking summer 2026 SWE interns? Happy to send a resume."
  - "Could I get 15 minutes to talk about the [specific team] internship?"
  - "Would a referral to your recruiting team be possible?"
- Include a specific timeframe ("summer 2026," "fall 2026"). Never just "an internship."

OPTIONAL, SOCIAL PROOF / URGENCY (insert before the ask if applicable):
- If the writer has a competing offer or interview at another known company, mention it in one short sentence: "I'm interviewing with [Company] but their team is less aligned with what I want to build."
- This creates urgency. Use only if true.

CLOSING:
- "Thanks," or "Best," to match tone profile.
- Full name.
- One line below: link to portfolio, GitHub, or LinkedIn. Pick one, not all three.

LENGTH:
- 75 to 110 words target. Hard cap 130. Shorter than research outreach.
- 4 to 5 short sentences in the body. No long paragraphs.

HARD AVOIDS (regardless of tone):
- "I hope this email finds you well."
- "I am reaching out because" / "I am writing to."
- "I would love the opportunity to."
- "I know I'm just a student" / "I don't have much experience yet" / any apology for credentials.
- "Passionate," "deeply interested," "dream company," "love what you're doing."
- "Set up a time to chat" without specifying duration or topic.
- Em-dashes. Use commas, periods, or "and."
- Adjectives like "innovative," "groundbreaking," "incredible," "exciting," "amazing."
- Listing more than two prior experiences. Pick one and lean in.
- Mentioning the company without referencing a specific product, team, post, or decision.
- Asking for "any opportunities" without specifying summer/fall/spring + role type.

VOICE NOTES:
- Lead sentences with verbs and concrete nouns. "I built X" beats "I have experience with X."
- Strip every word that does not change meaning. If you can delete it without losing information, delete it.
- One technical detail per sentence. Not three.
- It is fine to be slightly choppy. Internship emails are read in 10 seconds. Polish that smooths out punch is a loss.
`.trim()
