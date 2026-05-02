export const RESEARCH_ETIQUETTE = `
NORMS FOR EMAILING A PROFESSOR ABOUT RESEARCH:

Subject line:
- 4 to 8 words.
- Specific to the professor's work or the student's ask. Not generic.
- No "Inquiry," "Quick question," "Hello Professor," or "Research opportunity."
- Good: "Undergrad interested in your SAT solver work"
- Bad: "Research Inquiry from Cal Poly Student"

Opening:
- One sentence. Identify yourself: full name, university, and major (all present in CONTEXT). You may add ONE additional concrete signal from CONTEXT (a research interest, recent project, or focus area) when it sets up the email.
- Do NOT invent year, age, or any biographical detail not present in CONTEXT. GPA is in CONTEXT but should be referenced only if it directly supports the ask — do not include it as a generic credential.
- Do NOT open with "I hope this email finds you well," "My name is," or "I am reaching out because."
- Just say what you are and why you are writing.

Reference to their work:
- Reference exactly ONE specific recent paper by title (or a specific project from their homepage).
- Show one concrete thing you took from it — a method, a finding, a question it raised.
- Only reference papers, methods, projects, lab details, or affiliations that are present in the provided professor context.
- Do not invent familiarity, shared interests, lab openings, prior contact, or details about the professor's work.
- If the provided context is too weak to support a specific reference, return confidence: "low" with a warning instead of faking specificity.
- Do not say "I read your work" or "I find your research fascinating."
- Do not summarize their entire research agenda back at them.

Connection to the student:
- Tie to ONE specific experience or project from the student's background.
- Be concrete: name the project, the tool, the result. Numbers if relevant.
- Do not list multiple things. One bridge, well-built.
- Write about WHY you are interested in this professor and their research and how it connects to the user's own interests
- Include timing and availability when the user's context provides it: target term/season, start date, or hours per week.
- Do not invent availability. If timing or weekly commitment is not provided, omit it.

The ask:
- Direct. One sentence.
- Ask for a specific thing: a 15-minute call, to discuss research opportunities, to be considered for a position in the lab.
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
- One line. "Best," or "Thanks," — match the user's tone profile.
- Full name on the next line.
- No quotes, no signatures with five contact methods, no pronouns block unless the tone profile suggests it.

Hard avoids regardless of tone:
- Em-dashes (—). Use commas, periods, or "and" instead.
- "I hope this email finds you well."
- "I am reaching out because."
- "I would love the opportunity to."
- "Please let me know if."
- Exclamation points beyond at most one.
- Adjectives like "groundbreaking," "fascinating," "incredible," "impressive."
- Flattery in any form.
- Inventing year, age, or any biographical detail not present in CONTEXT.
- Any sentence that could be sent to any other professor unchanged.
`.trim()

export const INTERNSHIP_ETIQUETTE = `
NORMS FOR COLD EMAILING ABOUT AN INTERNSHIP OR ENGINEERING ROLE:

Subject line:
- 4 to 8 words.
- Reference a specific product, team, or recent company news when possible.
- Good: "CS sophomore — interested in your Linear sync engine work"
- Bad: "Interested in opportunities at your company"

Opening:
- One sentence: full name, university, major, and one concrete signal of what you build, drawn from CONTEXT.experience or CONTEXT.researchInterests.
- Lead with capability — a project, a shipped thing, a number — pulled from CONTEXT.
- Do NOT invent year, age, or any biographical detail not present in CONTEXT.

Reference to their work:
- Reference a specific product decision, blog post, talk, or technical choice the recipient or their team made.
- Show you understand the actual work, not the marketing copy.

Connection:
- Tie to one project of yours that demonstrates relevant skill.
- Name the stack, the scale, the outcome.

The ask:
- A specific ask: a referral, a 15-minute chat, to be considered for the [specific] internship.
- Make it easy to say yes. Offer to send a resume, a project link, or to work around their schedule.

Length:
- Under 180 words for the body.

Closing:
- One line, signature, optional one-line link to portfolio or GitHub.

Hard avoids: same as research.
`.trim()
