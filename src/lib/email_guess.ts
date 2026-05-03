// Pattern-based email guesser for live-discovered Apollo contacts where the
// real email is locked behind a paid plan. We surface these with
// emailStatus: "guessed" so the UI can warn the user before send.
//
// The CLAUDE.md research-side fallback uses the same approach for professors
// whose homepages don't expose an address. We mirror it for internships.
//
// Patterns are tried in order; first non-null wins. Most companies use
// firstname.lastname or firstinitiallastname; a tiny minority use firstname.

const SAFE_NAME_RE = /[^a-z]/g

function normalize(part: string): string {
  // NFD splits accented chars into base + combining mark; SAFE_NAME_RE then
  // strips everything outside a-z, which removes the combining marks too.
  return part.toLowerCase().normalize("NFD").replace(SAFE_NAME_RE, "")
}

function splitName(full: string): { first: string; last: string } | null {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return null
  // First name is the first token; last name is the LAST token (drops middle
  // names so "Lydia A. Hallie" → first=lydia, last=hallie).
  const first = normalize(parts[0])
  const last = normalize(parts[parts.length - 1])
  if (!first || !last) return null
  return { first, last }
}

export type EmailGuessPattern =
  | "firstname.lastname"
  | "firstnamelastname"
  | "firstinitiallastname"
  | "firstname"

export function guessEmail(
  fullName: string,
  domain: string,
  pattern: EmailGuessPattern = "firstname.lastname",
): string | null {
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")
  if (!cleanDomain || !cleanDomain.includes(".")) return null

  const parts = splitName(fullName)
  if (!parts) return null

  const local = (() => {
    switch (pattern) {
      case "firstname.lastname":
        return `${parts.first}.${parts.last}`
      case "firstnamelastname":
        return `${parts.first}${parts.last}`
      case "firstinitiallastname":
        return `${parts.first[0]}${parts.last}`
      case "firstname":
        return parts.first
    }
  })()

  return `${local}@${cleanDomain}`
}

// Returns the most-likely guess plus the alternates the user can click
// through if the primary bounces. The UI should label these as guesses.
export function guessEmailWithAlternates(
  fullName: string,
  domain: string,
): { primary: string | null; alternates: string[] } {
  const patterns: EmailGuessPattern[] = [
    "firstname.lastname",
    "firstinitiallastname",
    "firstnamelastname",
    "firstname",
  ]
  const guesses = patterns
    .map(p => guessEmail(fullName, domain, p))
    .filter((g): g is string => Boolean(g))
  const unique = Array.from(new Set(guesses))
  return {
    primary: unique[0] ?? null,
    alternates: unique.slice(1),
  }
}
