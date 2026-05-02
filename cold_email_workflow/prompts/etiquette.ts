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
NORMS FOR COLD EMAILING ABOUT A SOFTWARE ENGINEERING INTERNSHIP:

POSTURE (read this first):
This is not a research email with the words swapped. The voice, structure, and length are different. The reader is a recruiter or engineer who reads the email in 10 seconds. The writer is selling capability, not curiosity. Verbs over nouns. Numbers over adjectives. Concrete over abstract.

DO NOT include an interest declaration paragraph. Sentences like "I want to spend the next two years working on X" belong in research emails, not here. Capability is shown through projects, not stated through ambitions.

LOGICAL THREAD - the email must make ONE argument:

The email is not a list of facts. It is an argument that builds: the writer wants to work on a specific kind of problem at this company, and the reader should believe it.

The thread must be:
1. WHO I am + WHAT I'M TRYING TO LEARN OR BUILD (opener establishes intent)
2. THE THING YOU/YOUR TEAM DID THAT MATCHES IT (hook proves the company is the right place)
3. THE THING I'VE BUILT THAT MATCHES IT (proof shows this is real, not aspirational)
4. THE ASK (specific, time-bound)

Each sentence must connect to the one before it. Do not write sentences that float.

CRITICAL - THE PROOF PARAGRAPH MUST CONNECT TO THE HOOK:
The experience paragraph (sentences 3-4) must end on the technical concept that ties it back to the hook. Do NOT announce the connection ("which got me thinking about your work"). The connection must be specific and oblique.

If the connection is real, name the SPECIFIC SHARED TECHNICAL CONCEPT.
If no specific shared concept exists, end on a concrete detail about what was hard or surprising in the project. Do not invent a connection.

Example of a connected thread (good):
- Opener: "I'm Sid, CS junior at Cal Poly, ex-Stripe intern. Been trying to figure out streaming and state-reconciliation patterns this term."
- Hook: "Your team's post on streaming from serverless Node landed for me. The callback URL bridge is what I've been trying to replicate in a side project."
- Proof: "Closest thing I've shipped: a CSV-to-Stripe importer at Stripe last summer (200+ merchants, 3 days to 4 hours onboarding). The hard part was always reconciling state between the CSV parser and Postgres before hitting the API, same shape of problem, different stack."
- Ask: "Are you taking summer 2026 SWE interns on Edge Runtime? Happy to send a resume."

Notice: the opener declares intent (streaming + state reconciliation), the hook references the team's work on that exact thing, the proof describes a project on the same shape of problem, and the last sentence of the proof names the technical bridge ("same shape of problem") without announcing it as a bridge.

Example of a disconnected thread (bad, do not produce):
- "I'm Sid, ex-Stripe intern."
- "Your team's post on streaming landed for me."
- "I built a CSV-to-Stripe importer."
- "Stack: TypeScript, Postgres, Stripe API."
- "Are you taking interns?"

Each sentence is fine alone, but there is no argument, just facts. This is the failure mode to avoid.

LENGTH:
- 75 to 110 words target. Hard cap 130 words in the body.
- 4 to 5 short sentences total. No paragraph longer than 2 sentences.
- Shorter than the research email. If the draft hits 130, cut, don't trim.

SUBJECT LINE (this matters more than the body):
Format: "[Strongest credential] interested in [specific team or product] @ [Company]"
- 5 to 7 words, under 60 characters, must render on mobile.
- The credential before "interested in" is the click. Pick the strongest signal from the user's experience in this priority order:
  1. Prior internship at a recognizable company ("Ex-Stripe intern...")
  2. Shipped product with traction ("Built fere.dev (200 stars)...")
  3. Hackathon win or competition placement
  4. School + concrete skill
- The team or product reference must be specific. Not the company in general.
- Good: "Ex-Stripe intern interested in Linear's sync engine"
- Good: "Cal Poly junior who shipped fere.dev, Vercel edge runtime"
- Bad: "Internship inquiry," "Software engineering opportunities," "Cal Poly student interested in your company"
- Forbidden words in subject lines: inquiry, opportunity, opportunities, application, request, hello.

OPENING (one sentence):
- Name, year, school, strongest credential, in that order. Repeat the credential from the subject line.
- Forbidden openers: "I hope this email finds you well," "I am reaching out," "My name is," "I came across [Company]."
- Good: "I'm Sid, a CS junior at Cal Poly, ex-Stripe intern."

THE HOOK (one sentence) - depends on the recipient AND on whether the artifact has a named author:

DETERMINE RECIPIENT TYPE FIRST:
- IC / engineer: role contains "Engineer," "MTS," "Member of Technical Staff," "Staff," "Lead," "Architect," "Founding."
- Recruiter: role contains "Recruiter," "Talent," "People."

IF RECIPIENT IS AN IC AND notableWork has author == recipient.name:
- Reference the artifact AS THEIRS. "Your talk on X..." or "Your post on Y..."
- This is the strongest hook available. Use it.
- Example: "Your post on the streaming architecture stuck with me. The section on the bridge code is what I've been trying to replicate."

IF RECIPIENT IS AN IC AND notableWork has author != null AND author != recipient.name:
- DEFAULT: reference the artifact as "your team's" without naming the author. The recipient knows their coworkers; naming a peer reads as awkward.
- Naming the actual author is only appropriate when the author is clearly SENIOR LEADERSHIP: cofounder, CTO, founding engineer, head of a major area. For peer-level authors (Staff Engineer, Senior Engineer, Senior DevRel, Member of Technical Staff), do NOT name them — say "your team's" instead.
- DO NOT imply the recipient wrote it. This is an instant credibility kill.
- Good (peer author): "Your team's post on streaming from serverless Node landed for me. The callback URL bridge is what I've been trying to replicate in a side project."
- Good (senior leadership author): "Tuomas's talk on scaling the sync engine landed for me. The conflict resolution section is what I've been stuck on."
- BAD (do not produce): "Your post on..." (when the recipient did not write it)
- BAD (do not produce): "Lydia Hallie's post on streaming..." (peer-level author, named unnecessarily — should be "your team's post on streaming")

IF RECIPIENT IS AN IC AND notableWork has author == null:
- The artifact is a company-level piece (product page, generic launch). Reference it neutrally as the company's work.
- Good: "Linear's API design, the way the sync primitives are exposed to webhooks, is what got me reading the rest of the docs."

IF RECIPIENT IS A RECRUITER:
- Do NOT reference a specific engineering artifact. Recruiters do not own technical decisions and referencing internal technical work reads as misdirected.
- Reference the company, the product, the mission, a recent launch, or a customer outcome.
- Good: "Linear is one of the few tools my whole team actually adopted. Issue trackers usually die on the vine."
- Good: "Vercel deploys are what convinced me web infra had finally gotten good. I've shipped four side projects on Vercel in the last year."
- BAD: "Your team's sync engine architecture..." (recruiter doesn't own this; sounds misdirected)

UNIVERSAL RULES FOR THE HOOK:
- One sentence (or two short ones if the second adds a specific concrete detail).
- Specific enough that the email could not be sent to another company unchanged.
- No compliments. ("I love what you're doing" is banned.)
- Show research by citing something specific, not by labeling it good.
- Never use "your post," "your talk," or "your blog" unless the Author field for that artifact exactly matches the recipient's name.

THE PROOF (one or two sentences):
- One project. Numbers. A link.
- Format: [what it does] + [scale or result number] + [link, inline].
- Pick the project most relevant to the team being emailed, not the most impressive one. If a more impressive but less relevant project exists, you may compress it to 4 words ("ex-Stripe payments intern") in the opener and skip it here.
- Numbers required: users, stars, latency, throughput, dollars saved, time saved.
- Good: "I built fere.dev, a macOS dev tool that maps local environments. 200 stars, 1k installs in the first month: github.com/sid/fere"

THE ASK (one sentence):
- Be specific. Pick one shape:
  1. "Are you taking summer 2026 SWE interns? Happy to send a resume."
  2. "Could I get 15 minutes about the [specific team] internship?"
  3. "Would a referral to your university recruiting team be possible?"
- Always specify season + year. Never "an internship."

CLOSING:
- "Thanks," or "Best," to match tone profile.
- Full name.
- One link below the name: GitHub, portfolio, or LinkedIn. Pick one.

HARD AVOIDS:
- "I hope this email finds you well." / "I am reaching out because." / "I would love the opportunity to."
- "I know I'm just a student" / any apology for credentials.
- "Passionate," "deeply interested," "dream company," "love what you're doing," "innovative," "groundbreaking," "exciting."
- "Set up a time to chat" without specifying duration AND topic.
- Em-dashes. Use commas, periods, or "and."
- Mentioning the company without referencing a specific artifact.
- Asking for "any opportunities."
- Listing more than one prior experience in the body. Compress secondary experience to a credential phrase in the opener if needed.

VOICE:
- Lead with verbs and concrete nouns. "I built X" beats "I have experience with X."
- Strip every word that does not change meaning. Delete-test every sentence.
- One technical detail per sentence. Not three.
- Slight choppiness is correct. This email is read in 10 seconds. Polished prose that smooths out punch is a loss.
`.trim()
