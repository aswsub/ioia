import type { ToneProfile } from "./tone"

export type ExperienceItem = {
  title: string
  org: string
  description: string
  startDate?: string
  endDate?: string
}

export type UserProfile = {
  name: string
  email: string
  school: string
  interests: string[]
  experience: ExperienceItem[]
  goals: string
  tone: ToneProfile
}

export type RecentPaper = {
  title: string
  year: number
  abstract: string | null
  url: string
}

export type Professor = {
  id: string
  name: string
  affiliation: string
  email: string | null
  homepage: string | null
  concepts: { name: string; score: number }[]
  recentPapers: RecentPaper[]
  matchScore: number
}

export type OpportunityType = "research" | "internship"

export type ContextInput = {
  user: UserProfile
  professor: Professor
  opportunity: OpportunityType
  userNotes?: string
}

const ABSTRACT_MAX_CHARS = 500
const MAX_PAPERS = 3
const MAX_EXPERIENCE = 3
const MAX_CONCEPTS = 5

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + "…"
}

function renderPapers(papers: RecentPaper[]): string {
  return papers
    .map((p, i) => {
      const head = `${i + 1}. "${p.title}" (${p.year}) — ${p.url}`
      if (!p.abstract) return head
      return `${head}\n   abstract: ${truncate(p.abstract, ABSTRACT_MAX_CHARS)}`
    })
    .join("\n")
}

function renderExperience(items: ExperienceItem[]): string {
  return items
    .map((e, i) => {
      const dates = [e.startDate, e.endDate].filter(Boolean).join("–")
      const head = `${i + 1}. ${e.title}, ${e.org}${dates ? ` (${dates})` : ""}`
      return `${head}\n   ${e.description}`
    })
    .join("\n")
}

export function renderContextBlock(input: ContextInput): string {
  const { user, professor, opportunity, userNotes } = input

  const papers = professor.recentPapers.slice(0, MAX_PAPERS)
  const experience = user.experience.slice(0, MAX_EXPERIENCE)
  const concepts = professor.concepts.slice(0, MAX_CONCEPTS).map(c => c.name)

  const sections: string[] = [
    "CONTEXT — DRAW THE EMAIL FROM THESE FACTS ONLY.",
    "",
    `Opportunity type: ${opportunity}`,
    "",
    "PROFESSOR:",
    `- Name: ${professor.name}`,
    `- Affiliation: ${professor.affiliation}`,
  ]

  if (concepts.length > 0) {
    sections.push(`- Top research concepts: ${concepts.join(", ")}`)
  }

  sections.push(
    "",
    "Recent papers (pick exactly ONE to reference, by title):",
    papers.length > 0
      ? renderPapers(papers)
      : "  (no recent papers available — return EmailDraft with confidence: \"low\" and a warning)",
    "",
    "USER:",
    `- Name: ${user.name}`,
    `- School: ${user.school}`,
  )

  if (user.interests.length > 0) {
    sections.push(`- Interests: ${user.interests.join(", ")}`)
  }
  if (user.goals.trim()) {
    sections.push(`- Goals: ${user.goals.trim()}`)
  }

  sections.push(
    "",
    "Experience (pick the SINGLE most relevant item to reference; ignore the rest):",
    experience.length > 0 ? renderExperience(experience) : "  (none provided)",
  )

  if (userNotes?.trim()) {
    sections.push(
      "",
      "User notes (incorporate if directly relevant; otherwise ignore):",
      userNotes.trim(),
    )
  }

  sections.push(
    "",
    "Hard reminders for this context:",
    "- Reference exactly ONE paper from the list above, by title, with one concrete sentence about what caught your attention.",
    "- Tie to exactly ONE user experience item, naming the project or role concretely.",
    "- Do not invent papers, methods, lab details, prior contact, or shared interests beyond what is above.",
  )

  return sections.join("\n")
}
