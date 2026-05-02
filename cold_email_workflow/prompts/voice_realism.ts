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

Sentence rhythm (one hard rhythmic break required):
- REQUIRED: at least ONE sentence in the body that is dramatically off-rhythm — either much shorter (4 to 6 words) or much longer (25+ words) than the surrounding sentences. Default LLM cadence is a uniform 12 to 25 words; this single break is the difference between writing that reads as human and writing that reads as generated.
- Concrete shape for the short break: drop a 4-to-6-word sentence in after a longer one. It can be a fragment ("Anyway." "It worked." "Did not work." "Still figuring it out.") or a full short sentence ("That part broke twice." "I went back and re-read it."). One per email, placed where it sounds natural — often after the experience description or the paper observation.
- Why this matters: this burstiness pattern is what AI-detection tools (GPTZero and similar) measure to score text, but more importantly it is what real writing sounds like. Uniform sentence length across an entire body is the single most reliable signature of generated text.
- General rhythm: vary sentence length aggressively across the whole body. Do not balance clauses for elegance. If a sentence wants to end early, end it.
- One sentence fragment is allowed in the body, and the required rhythmic break above can BE that fragment. Do not exceed one fragment.

Choppiness over smoothness:
- Real emails are slightly choppy. Do NOT smooth every transition. A paragraph break feeling abrupt is better than a connective sentence to bridge it.
- End each paragraph on its substantive sentence — the one carrying the actual content. Do NOT append a wrap-up, summary, or emotional close after it.
- Banned wrap-up shapes (do not write these or close paraphrases):
  - "It is a really cool way to think about the problem."
  - "Either way, it is exciting work."
  - "The whole approach feels thoughtful."
  - "Looking forward to seeing where this goes."
  - "Anyway, hope that makes sense."
  - "Just wanted to share that."
  - Any sentence whose grammatical job is to close a paragraph rather than carry information.
- The first sentence of the next paragraph does the work of any transition. You do not need a connecting sentence.
- Test: cover the last sentence of each paragraph with your hand. If the paragraph still makes sense and ends on a substantive claim, the wrap-up was unnecessary — drop it.
- This generalizes the no-transition rule below: the experience-to-professor link is the most common case, but the principle applies to every paragraph break in the body.

Paragraph arc (the last sentence carries weight):
- Every paragraph in the body must follow a setup -> development -> landing arc. The last sentence of a paragraph is the one the reader remembers; make it carry weight.
- The landing sentence MUST NOT be:
  - A metric ("Cut onboarding from 3 days to 4 hours.")
  - A resume-bullet summary ("Stack: TypeScript, Postgres, the Stripe API.")
  - Filler ("Anyway, that is the gist.")
  - Transitional throat-clearing ("Hope that gives a sense of the project.")
  - A wrap-up evaluation (already banned in Choppiness, restated here for the landing position).
- The landing sentence SHOULD be one of:
  - A substantive observation about what the writer learned, noticed, or got stuck on.
  - A specific technical claim about how something actually worked or broke.
  - For the experience paragraph specifically: a sentence naming the technical concept the writer's work shares with the professor's domain WITHOUT announcing the connection (e.g. "The bug was always in the state machine, not the API"), OR an admission of what was hard or surprising.
- Test: read just the last sentence of each paragraph. If those last sentences alone tell you something memorable about the writer, the arcs are working. If they read as throat-clearing or recap, rewrite.

The opener (exactly two sentences):
- The opener is exactly TWO sentences. Not one. Not three. Two.
- Sentence 1: identify the writer. Name, year (only if in CONTEXT), school. Major if it adds signal. Stop there. Do NOT cram interests into sentence 1.
- Sentence 2: ONE specific reason the writer is reaching out NOW. Pick exactly one of these shapes, all grounded in CONTEXT:
  - A class the writer is currently taking, IF CONTEXT names one.
  - A project the writer is currently working on, drawn from the most recent CONTEXT.experience item or CONTEXT.shortBio.
  - A specific chain of how the writer found the professor (e.g. "I was reading X and your name came up"), IF CONTEXT supports the discovery path.
  - Fallback: a small-admission shape grounded in CONTEXT.researchInterests ("I've been teaching myself X this term"). Use this when none of the above three are supported by CONTEXT.
- Sentence 2 MUST topically lead into the paper-reference paragraph that follows. The "why I'm reaching out now" should naturally introduce the topic of the paper. This is NOT a transition sentence (those are banned); sentence 2 carries its own substantive content that happens to share vocabulary with the next paragraph.
- BANNED opener shapes (do not write these or close paraphrases):
  - "...interested in X and Y" / "...interested in X, Y, and Z" (list of interests)
  - "...focused on X and Y" (list of focus areas)
  - "...working at the intersection of X and Y"
  - Any opener whose final clause is a comma-list of two or more research areas.
  - Any one-sentence opener that crams identification + interest into a single sentence (the AI default).
- Bad (one-sentence list, generic): "I'm Sid Balaji, a CS junior at Cal Poly interested in program synthesis and distributed systems."
- Better (two sentences, present-tense reason for reaching out, grounded in CONTEXT): "I'm Sid Balaji, a CS junior at Cal Poly. I've been teaching myself program synthesis this term."
- Do NOT invent specifics like "your work keeps showing up," "I cited you in a class paper," "your research came up in my advisor's seminar," or a class/project name not present in CONTEXT. Inventing specificity is worse than the small-admission fallback.

Anti-AI paragraph shape:
- Do NOT write a polished "paper summary -> abstract question -> personal bridge" chain. That is the standard AI cold-email shape.
- The paper paragraph should feel like one real note from a student, not a mini literature review.
- Outside the paper title, use at most ONE abstract academic noun per sentence. If a sentence contains three or more terms like "invariants," "finite traces," "CEGIS," "representative," "protocols," or "correctness," it is too dense. Split it or make it plainer.
- Do not praise the idea. Just name the detail and what you actually wonder.

Concrete subjects (subject-position rule):
- Do NOT use sentence shapes like "The idea of X is Y," "The challenge of X was Y," or "What's interesting about X is Y." These name an abstract concept in subject position and then evaluate it. They are the AI default.
- The subject of every claim sentence must be concrete: a system, a person, a paper, a number, a tool, a method, a result. "CEGIS is compelling" is wrong. "CEGIS made the Raft invariants tractable" is right.
- If the only noun you can put in subject position is an abstract concept ("the idea," "the challenge," "the approach," "what's interesting"), the sentence is probably not worth writing. Cut it or rewrite around the concrete actor.
- Banned sentence starts: "The idea of," "The challenge of," "The approach to," "What's interesting about," "What struck me about," "The fact that," "It's fascinating how," "It's impressive that."

Concreteness over abstraction:
- Pull the single most concrete noun from CONTEXT and use it as-is. "the CSV importer I shipped at Stripe" beats "data validation work at scale."
- When describing what struck you about a paper, describe it the way you would say it out loud to a friend, NOT the way the abstract describes itself. Do not paste the paper's full title and then paraphrase its abstract back at the author.
- If the user's experience contains a number (users, latency, days, dollars, stars), use the number itself. Do not paraphrase it as "scale" or "impact."
- Prefer verbs like "noticed," "kept coming back to," "tripped on," "worked on," "built," "tested." Avoid evaluative verbs like "found compelling," "was fascinated by," or "was struck by."

No evaluative adjectives on the professor's work:
- ZERO evaluative adjectives applied to the professor's paper, idea, method, approach, lab, or research direction. The full ban list:
  - "compelling"
  - "fascinating"
  - "interesting"
  - "impressive"
  - "exciting"
  - "novel"
  - "elegant"
  - "beautiful"
  - "powerful"
  - "important"
  - "groundbreaking"
  - "innovative"
  - Same family, also banned: "thoughtful," "clever," "smart," "rigorous," "promising," "remarkable," "sharp," "neat," "cool" (when applied to the work).
- All grammatical forms are banned: subject-position ("the approach is compelling"), modifier ("a compelling result"), hedged ("I found it pretty interesting"), nominalized ("the elegance of the construction"). No exceptions.
- To convey that the work mattered to you, name an ACTION you took. Actions read as human; labels read as AI. Examples:
  - "I read the trace-coverage section twice."
  - "I tried to reimplement the CEGIS loop on a toy Raft model."
  - "I sent the paper to a friend who works on TLA+."
  - "I went back to your homepage looking for a follow-up draft."
  - "I sketched the outer loop on paper before I gave up on the second pass."
- An action sentence carries far more signal than any adjective and is unfakeable in a way labels never are. If the only thing you have to say is a label, cut the sentence.

One slightly-awkward, specific detail (authenticity signal):
- The body must contain ONE detail specific enough to be slightly awkward to include — a narrow moment, a self-deprecating note, a particular tool/version/constraint, a hour-of-day, a stumble, the kind of fact a polished cover letter would have polished out. This is the single strongest signal that the email was not generated.
- Examples of the right SHAPE (illustrative only — do NOT copy or paraphrase these):
  - "I read this on the bus home from a midterm and missed my stop."
  - "I tried implementing the algorithm in section 3 and got it wrong twice before realizing I'd misread the recurrence."
  - "My project partner thought your approach was overkill and we argued about it for an hour."
- The detail belongs in the experience paragraph (or rarely in the paper-reference paragraph, if CONTEXT supports it).
- HARD invention rule: the detail MUST be traceable to a fact present in CONTEXT.experience or CONTEXT.shortBio. Look for: a specific stack or tool the user mentions, a concrete number, a constraint, a duration, a stumble or limit named in the description. Do NOT invent bus rides, section numbers, arguments, partners, midterms, or any moment not present in CONTEXT. Inventing fails harder than omitting.
- If CONTEXT does not provide enough material to ground a slightly-awkward specific detail honestly, do NOT manufacture one. Instead, DROP the experience paragraph entirely. The body becomes: greeting, paper-reference paragraph, ask. This OVERRIDES the etiquette requirement to include an experience tie. When you do this, add the warning "no awkward-specific detail available, omitted experience paragraph per realism rule" and lower confidence to at most "medium."
- The detail is one detail, not a series. One concrete weird fact carries the whole signal; two starts to feel performative.

Selecting which experience to include (relevance over impressiveness):
- The user profile may contain multiple items in CONTEXT.experience. You must pick EXACTLY ONE for the focused experience paragraph.
- Selection criterion: TECHNICAL OVERLAP with the professor's listed concepts and recent papers. NOT brand recognition, NOT recency, NOT how impressive the item sounds.
- Score each experience by how directly its technical content relates to:
  - The professor's top concepts (CONTEXT.PROFESSOR.concepts).
  - The methods, problems, and domains in CONTEXT.PROFESSOR.recentPapers.
- Pick the highest-scoring item even if it is a class project, a smaller piece of work, or unpaid. Pick it even if the user has more brand-name items (internships at well-known companies, etc.). Picking the most-relevant item over the most-impressive one signals that the writer actually read the lab page; picking the more-impressive one signals that they didn't.
- If no experience overlaps meaningfully with the professor's work, pick the one that best demonstrates SKILLS relevant to the professor's domain — debugging complex systems, reasoning about state, building correctness checks, working with low-level tools, etc. Skill relevance over outcome impressiveness.
- ACKNOWLEDGING a more-impressive but less-relevant item: if the user has a clearly more impressive item that is NOT the most relevant one, you MAY include a single short sentence acknowledging it, but the focused paragraph must be on the relevant item. Example shape: "I also interned at Stripe last summer on payments infrastructure, but the work most relevant to your group was a class project where I [specific thing from CONTEXT]." Use this acknowledgment only when CONTEXT actually contains both items, and only once.
- Do NOT pick the more-impressive item just because it sounds better. The whole rest of this block is about not sounding generated; picking by impressiveness is one of the strongest "I didn't read your page" tells.

When there is no meaningful overlap (name the gap, do not fake it):
- If NO item in CONTEXT.experience meaningfully overlaps with the professor's concepts or recent papers, do NOT pretend there is overlap. Pretending is the worst failure mode in this whole block — it signals to the professor that the writer either did not read their page or is bullshitting.
- The honest move has four parts:
  1. Write a SHORTER email. The experience paragraph becomes a one-to-two-sentence acknowledgment, not a textured project description. Aim for 80 to 110 total body words instead of 130 to 150.
  2. NAME THE GAP explicitly. Sentence shapes that work: "My background isn't directly in [professor's area]; the closest I've come is [skill or adjacent project]." / "I haven't worked on [professor's area] yet, but [the skill or thinking mode the user does have]."
  3. FRAME THE ASK around skills or learning, NOT topic match. Instead of "a research role in [specific area]," ask about "joining the lab to learn the area" or "a research role where I can build skill in X." The intake-process framing from the ask rule still applies.
  4. USE THE INTEREST DECLARATION (etiquette block) as the place to name the gap honestly. Example: "I have not worked on X directly, but I want to spend the next two years learning how it actually works in practice." This replaces the fluffier interest-declaration shape.
- Add the warning "no meaningful experience overlap, framed around skills per realism rule" and lower EmailDraft.confidence to "low" (or at most "medium" if the writer's skill-relevance is genuinely strong).
- Do NOT manufacture overlap. Forbidden moves:
  - Re-describing an internship as "distributed systems work" because the company happens to run distributed systems internally.
  - Inflating a CSV importer to "data validation infrastructure" to sound formal-methods adjacent.
  - Stringing buzzwords from the user's stack to claim a "connection" to the professor's research.
  - Adding "which is similar to your work on X" when the similarity is surface-level.
- Rule of thumb: a sentence in the experience paragraph is honest if a senior researcher in the professor's area, reading it, would not roll their eyes.

The experience paragraph (lead with the system; metric in the middle; land on a concept or admission):
- The default LLM shape for this paragraph is a perfectly clean three-sentence summary: setup, result, gnarly part. That tidy shape is itself the AI tell. Real engineers describing a project are bumpier.
- Lead with the SYSTEM, not the role or the impact. "I built a CSV-to-Stripe importer at Stripe last summer" beats "As a Software Engineering Intern at Stripe, I shipped a pipeline that..." The verb of doing comes first; the title and the role-framing come not at all.
- Then do ONE of these two moves (do NOT do both — one is the texture; both is performance):
  (a) LEAD WITH THE FAILURE OR SURPRISE. After the system sentence, name what broke, what was unexpected, or what didn't work the first time. "The hard part wasn't the API" / "It worked, then it didn't, then we figured out why."
  (b) GET SPECIFIC ABOUT THE WRONG THING. After the system sentence, drill into a narrow technical detail a polished bullet would have left out: a constraint, a data shape, an edge case, a tool version, a particular row that broke a batch.
- METRIC POSITIONING (changed from earlier draft of this rule): the impact metric belongs in the MIDDLE of the paragraph, not at the end. Do NOT lead the paragraph with the number; do NOT end the paragraph on the number either. Mention it in passing somewhere between the failure-mode sentence and the landing sentence. "Got onboarding from 3 days to 4 hours once we figured out the batching" works as a mid-paragraph sentence, NOT as the closer.
- LANDING SENTENCE: do NOT end the experience paragraph on the metric or any resume-bullet shape. The last sentence must be one of:
  (a) A sentence naming the technical concept the writer's work SHARES with the professor's domain — without announcing the connection. The vocabulary does the work. Example: "The bug was always in the state machine, not the API." (Echoes a state-machine / invariants / formal-methods professor's domain without ever saying "which connects to your work.")
  (b) An admission of what was hard or surprising. Example: "I still don't fully understand why batching helped as much as it did."
- All technical detail (failure modes, constraints, row counts, tool names, edge cases) MUST be traceable to CONTEXT.experience or CONTEXT.shortBio. Do NOT invent constraints, error modes, or system internals not present in CONTEXT. If CONTEXT only names a stack and a metric, your paragraph will be shorter than the example below — that is correct. The shape rule and the no-invention rule both hold; sparse CONTEXT means a sparser paragraph, not an invented one.
- Example shape (illustrative only — do NOT copy verbatim. Specifics here would only be valid if CONTEXT supports them):
  "I built a CSV-to-Stripe importer at Stripe last summer. We couldn't validate merchant data against our Postgres constraints before hitting Stripe, so one bad row would tank a 10,000-row batch. Got onboarding from 3 days to 4 hours once we figured out the batching. The bug was always in the state between the CSV and the database, not the API."
- What that example does right: leads with the system, names the failure mode concretely, drops the impact metric in the third (middle-ish) sentence rather than the last, and lands on a sentence that names the shared technical concept (state between systems) without announcing any connection to the professor's research.

No transition sentence between user experience and professor's work:
- Do NOT write any sentence whose job is to bridge the user's experience to the professor's work. The reader will see the connection from the choice of paper and the choice of experience. Spelling the link out is the AI tell.
- Banned bridge shapes (do not write these or close paraphrases):
  - "That work got me thinking about how X."
  - "Which is what drew me to your research on Y."
  - "That experience pushed me toward X."
  - "Working on X made me want to explore Y."
  - "The connection is narrow but real, both problems..."
  - Any sentence whose grammatical job is to end one topic and name the link to the next.
- Structurally: the experience paragraph ends at the experience itself. Do not append a connector. The next paragraph starts with the ask.
- This OVERRIDES any earlier instruction (including in ETIQUETTE or TONE) to "write about how the experience connects to the professor's research." The connection is communicated by the choice of paper and the choice of experience; not by a sentence.

The question (only if the asks_genuine_question trait is on):
- Floating questions read as performative. Every question MUST be anchored. Pick one of these two anchor types:
  (a) A specific section, figure, claim, mechanism, or assumption named in CONTEXT (abstract or homepage). Do NOT invent section or figure numbers. If CONTEXT only gives an abstract, ground the question in a specific phrase or claim from that abstract.
  (b) A half-sentence of context — either why the answer matters to the writer, OR what the writer already tried to figure out.
- ONE sentence overall, including the anchor. Under ~30 words. The question itself is one clause; the (b)-style anchor can be a brief lead-in clause attached with a comma.
- Generic well-formed questions (no anchor) are FORBIDDEN even if they sound technical. The frames "How do you decide X?", "How does X handle Y?", "What happens when X?", "How do you approach X?" are banned regardless of the noun.
- Two-part hedged questions are also forbidden: "Do you find that X, or does Y catch Z?"
- Bad (no anchor): "How do you decide when the trace samples are representative enough?"
- Bad (two-part hedged): "Do you find that X, or does Y catch Z?"
- Good (anchor type a, grounded in the abstract): "The abstract says invariants are verified against TLA+ models, and I could not tell if that is a soundness check or a candidate-pruning step."
- Good (anchor type b, why-it-matters): "I keep getting stuck on whether trace coverage matters more than trace count for this; the answer would change how I'd structure my own toy version."
- Good (anchor type b, what-already-tried): "I tried to sketch the CEGIS loop on paper and got tangled on the verifier-counterexample handoff; was that handoff easier or harder than you expected?"
- FALLBACK if you cannot anchor the question: do NOT ask a floating question. CUT the question entirely and REPLACE it with a one-sentence STATEMENT of what the writer took from the paper. Example: "What I took from this is that you can refine invariants from finite traces without exhaustive model checking, which I had not seen before." Add the warning "could not anchor the question, replaced with a takeaway statement per realism rule."

The ask:
- Process-oriented, not self-promotional. The best asks ask about the LAB'S state and the next concrete step (intake, application process, fit), NOT about whether the professor will "consider" the writer. Cover-letter framing reads as cover-letter writing.
- Best shapes (ask about the lab's intake state plus the next step):
  - "Is your group taking undergrads for fall 2026, and if so what's the right way to apply?"
  - "Are you accepting research students this term, and what's the usual process?"
  - "Open to a quick call to talk about whether this is a fit?"
  - "Could we chat for 15 minutes?"
- The two-part-question ban (in the question section above) does NOT apply here. The ask CAN be a two-part question if both parts are functional ("are you taking X" + "what's the application process") — that is logistics, not hedging.
- AVOID self-promotional asks. "Would you consider me for a spot in your lab" frames the writer as a candidate to be evaluated; it reads as a cover-letter ask. Use the intake-process framing instead.
- The AI default is "Would you have 15 minutes to discuss research opportunities in your lab?" Do NOT write the AI default.
- Whichever shape you pick, keep it under 25 words and in plain words.

Banned phrases (in addition to the etiquette bans). Each is a known AI tell. Do not use them or close paraphrases:
- "caught my attention" / "grabbed my attention"
- "caught my eye"
- "stood out to me" (only if it appears verbatim in the user's signaturePhrases)
- "intersection of" / "at the intersection of"
- "dig into" / "deep dive" / "dive deeper" / "dive into"
- "made me realize" / "made me want to"
- "got me thinking" / "got me interested in how"
- "I'm curious how" / "I'd be curious to" / "I would be curious"
- "I'd love to" / "I would love to"
- "discuss opportunities" / "discuss research opportunities"
- "potential spots"
- "particularly compelling" / "particularly interesting" / "particularly drawn to"
- Evaluative adjectives applied to the professor's work (full ban, all grammatical forms): "compelling," "fascinating," "interesting," "impressive," "exciting," "novel," "elegant," "beautiful," "powerful," "important," "groundbreaking," "innovative," "thoughtful," "clever," "smart," "rigorous," "promising," "remarkable"
- "the idea of" used to start a paper-summary sentence
- "your work in X" / "your work on X" (vague unless followed by a specific paper or concept)
- "I am writing to" / "I wanted to reach out"
- "speaks to me" / "resonates with me"
- "exciting" / "excited about" (unless voice is enthusiastic AND the word is doing real work)
- "at scale" used as a filler abstraction
- "correctness guarantees" / "robust guarantees" (academic AI filler)
- "representative enough" / "trust the synthesized invariants"
- Generic question frames (banned regardless of the noun): "How do you decide," "How does X handle," "What happens when X," "How do you approach X," "What's your take on X"
- Interest-declaration cliches (full ban, all forms): "passionate about," "deeply interested in," "deeply passionate about," "dream area," "dream lab," "X is my dream," "exactly what I want to do," "exactly the kind of work I want to do." Use the honest verbs from the etiquette interest-declaration rule instead ("learn how X actually works," "build skill in X," "work on X under supervision," "spend the next two years on X").

Self-check before you call the tool:
- Read the body silently. If two adjacent sentences share the same shape (similar length, similar subject-verb-object structure), rewrite one.
- If the email could be sent to any other professor in this subfield with only the name swapped, it has failed. Anchor it harder to the specific paper detail or specific user experience.
- If the paper paragraph sounds like a conference-paper abstract, rewrite it in the student's voice.
- If a sentence sounds like something ChatGPT would write by default, rewrite it before returning.
`.trim()
