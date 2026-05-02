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
NORMS FOR COLD EMAILING ABOUT AN INTERNSHIP OR ENGINEERING ROLE:

Subject line:
- 4 to 8 words.
- Reference a specific product, team, or recent company news when possible.
- Good: "CS sophomore interested in Linear sync work"
- Bad: "Interested in opportunities at your company"

Opening:
- One sentence: full name, university, major, and one concrete signal of what you build, drawn from CONTEXT.experience or CONTEXT.researchInterests.
- Lead with capability: a project, a shipped thing, or a number pulled from CONTEXT.
- Do NOT invent year, age, or any biographical detail not present in CONTEXT.

Reference to their work:
- Reference a specific product decision, blog post, talk, or technical choice the recipient or their team made.
- Show you understand the actual work, not the marketing copy.

Connection:
- Tie to one project of yours that demonstrates relevant skill.
- Name the stack, the scale, the outcome.

The ask:
- Process-oriented, not self-promotional. Ask about the team's HIRING state and the next concrete step (e.g. "Is your team hiring interns for summer 2026, and if so what's the application process?"), NOT about whether the recipient will "consider" the writer.
- Best phrasing shapes: "Is your team hiring interns for summer 2026, and if so what's the application process?" / "Are you taking on engineering interns this cycle, and what's the usual way in?" / "Could I send a resume?" / "Open to a quick chat about whether this is a fit?"
- Avoid self-promotional asks like "to be considered for the internship" — same cover-letter problem as the research case. The full rule lives in the VOICE REALISM "ask" section.
- Do not write "Would you have 15 minutes to discuss opportunities" — that is the AI default and reads as such.
- Make it easy to say yes. Offer to send a resume, a project link, or to work around their schedule.

Length:
- Under 180 words for the body.

Closing:
- One line, signature, optional one-line link to portfolio or GitHub.

Hard avoids: same as research.
`.trim()
