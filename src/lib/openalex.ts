/// <reference types="vite/client" />

// OpenAlex REST API client
// Docs: https://docs.openalex.org

import type { Professor, RecentPaper } from "../../cold_email_workflow/prompts/context";
import type { DirectoryHit, InstitutionKey } from "./directories";
import { fetchDirectoryHits } from "./directories";

const BASE = "https://api.openalex.org";
const MAILTO = (import.meta.env.VITE_OPENALEX_EMAIL as string) || "ioia-app@example.com";
const OA_CLIENT_VERSION = "2026-05-02a";

// Build URL with params — filter/select/sort must NOT be URL-encoded
async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const parts: string[] = [`mailto=${encodeURIComponent(MAILTO)}`];
  const apiKey = import.meta.env.VITE_OPENALEX_API_KEY as string | undefined;
  if (apiKey) parts.push(`api_key=${encodeURIComponent(apiKey)}`);

  for (const [k, v] of Object.entries(params)) {
    // These params use colons/commas that must stay unencoded
    if (k === "filter" || k === "select" || k === "sort") {
      parts.push(`${k}=${v}`);
    } else {
      parts.push(`${k}=${encodeURIComponent(v)}`);
    }
  }

  const url = `${BASE}${path}?${parts.join("&")}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAlex ${path} → ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type OAInstitution = { id: string; display_name: string };
type OAConcept = { id: string; display_name: string; works_count?: number; level?: number };
type OATopic = { id: string; display_name: string };

type OAAuthor = {
  id: string;
  display_name: string;
  orcid: string | null;
  last_known_institutions: { id: string; display_name: string }[];
  x_concepts: { id: string; display_name: string; score: number; level: number }[];
  works_count: number;
};

type OAWork = {
  id: string;
  title: string;
  publication_year: number;
  abstract_inverted_index: Record<string, number[]> | null;
  primary_location: { landing_page_url: string | null } | null;
  authorships: { author: { id: string; display_name?: string }; author_position?: string }[];
};

type OAList<T> = { results: T[]; meta: { count: number } };

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortId(id: string): string {
  return id.replace("https://openalex.org/", "");
}

function fullId(id: string): string {
  const trimmed = id.trim();
  if (trimmed.startsWith("https://openalex.org/")) return trimmed;
  const withoutHost = trimmed.startsWith("openalex.org/") ? trimmed.slice("openalex.org/".length) : trimmed;
  return `https://openalex.org/${withoutHost}`;
}

function reconstructAbstract(inv: Record<string, number[]> | null): string | null {
  if (!inv) return null;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const pos of positions) words[pos] = word;
  }
  return words.filter(Boolean).join(" ");
}

// Common institution name aliases → full OpenAlex name
const INST_ALIASES: Record<string, string> = {
  "uc berkeley": "University of California, Berkeley",
  "berkeley": "University of California, Berkeley",
  "uc davis": "University of California, Davis",
  "uc san diego": "University of California, San Diego",
  "ucsd": "University of California, San Diego",
  "ucla": "University of California, Los Angeles",
  "uc los angeles": "University of California, Los Angeles",
  "uc santa barbara": "University of California, Santa Barbara",
  "ucsb": "University of California, Santa Barbara",
  "cal poly slo": "California Polytechnic State University",
  "cal poly": "California Polytechnic State University",
  "mit": "Massachusetts Institute of Technology",
  "cmu": "Carnegie Mellon University",
  "nyu": "New York University",
  "usc": "University of Southern California",
  "georgia tech": "Georgia Institute of Technology",
  "ut austin": "University of Texas at Austin",
  "uci": "University of California, Irvine",
  "uc irvine": "University of California, Irvine",
  "uc, irvine": "University of California, Irvine",
  "university of california irvine": "University of California, Irvine",
};

async function resolveInstitution(name: string): Promise<string | null> {
  const expanded = INST_ALIASES[name.toLowerCase().trim()] ?? name;
  // OpenAlex `filter` uses commas to separate clauses; strip commas from search strings
  // (e.g. "University of California, Berkeley") so we don't accidentally split filters.
  const safeSearch = expanded.replace(/,/g, " ");

  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const scoreInstitutionMatch = (query: string, candidate: string): number => {
    const q = norm(query);
    const c = norm(candidate);
    if (!q || !c) return 0;

    // Strong preference for exact-ish matches and UC system wording.
    const qNoSpaces = q.replace(/\s+/g, "");
    const cNoSpaces = c.replace(/\s+/g, "");
    if (cNoSpaces === qNoSpaces) return 1_000_000;
    if (c.startsWith(q)) return 900_000;
    if (c.includes(q)) return 800_000;

    // Token overlap (requires most tokens to be present).
    const qTokens = q.split(/\s+/).filter(Boolean);
    const cTokens = new Set(c.split(/\s+/).filter(Boolean));
    let hits = 0;
    for (const t of qTokens) if (cTokens.has(t)) hits++;
    const ratio = hits / Math.max(qTokens.length, 1);
    return Math.floor(ratio * 100_000) + hits * 1000;
  };

  try {
    const data = await get<OAList<OAInstitution>>("/institutions", {
      filter: `display_name.search:${safeSearch}`,
      per_page: "10",
      select: "id,display_name",
    });
    const scored = (data.results ?? [])
      .map((r) => ({ r, score: scoreInstitutionMatch(expanded, r.display_name) }))
      .sort((a, b) => b.score - a.score);
    const best = scored[0]?.r;
    if (best) {
      console.log(`Resolved institution "${name}" → ${best.display_name} (${shortId(best.id)})`);
      if (scored.length > 1) {
        console.log(
          `Institution candidates: ${scored.slice(0, 4).map((x) => `${x.r.display_name} (${shortId(x.r.id)})`).join(" | ")}`
        );
      }
      return fullId(best.id);
    }
    return null;
  } catch {
    return null;
  }
}

function scoreConceptMatch(keyword: string, concept: OAConcept): number {
  const kw = keyword.toLowerCase().trim();
  const name = concept.display_name.toLowerCase().trim();
  const works = concept.works_count ?? 0;
  const level = concept.level ?? 99;

  // Prefer broad/primary concepts (lower level) and high works_count, but only
  // after ensuring the name is a good textual match.
  if (name === kw) return 1_000_000 + works - level * 10_000;
  if (name.startsWith(kw)) return 900_000 + works - level * 10_000;
  if (name.includes(kw)) return 800_000 + works - level * 10_000;

  // Token overlap fallback
  const kwTokens = new Set(kw.split(/\s+/).filter(Boolean));
  const nameTokens = new Set(name.split(/\s+/).filter(Boolean));
  let overlap = 0;
  for (const t of kwTokens) if (nameTokens.has(t)) overlap++;
  return overlap * 10_000 + works - level * 10_000;
}

// Resolve keywords → best OpenAlex concept IDs for author/work filtering
async function resolveConcepts(keywords: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const kw of keywords.slice(0, 4)) {
    try {
      const data = await get<OAList<OAConcept>>("/concepts", {
        filter: `display_name.search:${kw}`,
        per_page: "10",
        select: "id,display_name,works_count,level",
      });

      const scored = (data.results ?? [])
        .map((c) => ({ c, score: scoreConceptMatch(kw, c) }))
        .sort((a, b) => b.score - a.score);

      const picked = scored.slice(0, 2).map(({ c }) => c);
      for (const c of picked) {
        console.log(
          `Resolved concept "${kw}" → ${c.display_name} (${shortId(c.id)})` +
          (typeof c.works_count === "number" ? ` works:${c.works_count}` : "") +
          (typeof c.level === "number" ? ` level:${c.level}` : "")
        );
        ids.push(fullId(c.id));
      }
    } catch { /* ignore */ }
  }
  return [...new Set(ids)];
}

// ── Seed data loader ─────────────────────────────────────────────────────────
async function loadSeedData(school: string): Promise<Professor[]> {
  const schoolLower = school.toLowerCase().trim();

  let seedName: string | null = null;
  if (schoolLower === "mit" || schoolLower.includes("massachusetts institute")) seedName = "mit";
  else if (schoolLower.includes("stanford")) seedName = "stanford";
  else if (schoolLower.includes("berkeley") || schoolLower.includes("uc berkeley")) seedName = "berkeley";
  else if (schoolLower.includes("ucla") || schoolLower.includes("los angeles")) seedName = "ucla";
  else if (schoolLower.includes("cal poly") || schoolLower.includes("calpoly")) seedName = "cal-poly";
  else if (schoolLower.includes("cmu") || schoolLower.includes("carnegie")) seedName = "cmu";

  if (!seedName) return [];

  try {
    const response = await fetch(`/data/seed/${seedName}.json`);
    if (!response.ok) return [];
    const data = await response.json() as Professor[];
    console.log(`Loaded ${data.length} professors from seed data for ${seedName}`);
    return data;
  } catch (e) {
    console.warn(`Failed to load seed data for ${seedName}:`, e);
    return [];
  }
}

// ── Web scraper fallback ──────────────────────────────────────────────────────
// Scrapes university faculty directories when OpenAlex doesn't find enough results
async function scrapeFacultyDirectory(school: string, keywords: string[], limit = 5): Promise<Professor[]> {
  const schoolLower = school.toLowerCase().trim();

  const urls: Record<string, string[]> = {
    stanford: ["https://www.cs.stanford.edu/people/faculty"],
    cmu: ["https://www.cs.cmu.edu/directory/faculty"],
    "cal-poly": ["https://csc.calpoly.edu/people/faculty/"],
  };

  const schoolKey = Object.keys(urls).find(k => schoolLower.includes(k));
  if (!schoolKey) return [];

  console.log(`🔍 Scraping ${school} faculty directory as fallback...`);

  for (const url of urls[schoolKey]) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "ioia-app" }
      });
      if (!response.ok) continue;

      const html = await response.text();
      // Extract emails and names via regex
      const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      const emails = new Set<string>();
      let match;
      while ((match = emailPattern.exec(html)) !== null) {
        emails.add(match[1]);
      }

      // Extract potential names (3-5 word strings that look like names)
      const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g;
      const names: string[] = [];
      const seenNames = new Set<string>();
      while ((match = namePattern.exec(html)) !== null && names.length < limit * 2) {
        const name = match[1];
        if (!seenNames.has(name.toLowerCase())) {
          names.push(name);
          seenNames.add(name.toLowerCase());
        }
      }

      if (names.length === 0) continue;

      // Enrich with OpenAlex (try to match names)
      const professors: Professor[] = [];
      for (const name of names.slice(0, limit)) {
        try {
          const query = encodeURIComponent(name);
          const res = await fetch(
            `https://api.openalex.org/authors?search=${query}&per_page=1`,
            { signal: AbortSignal.timeout(3000) }
          );
          if (!res.ok) continue;

          const data = await res.json() as { results: OAAuthor[] };
          const author = data.results?.[0];
          if (!author) continue;

          const prof = await enrichAuthor(author, keywords);
          professors.push(prof);
        } catch {
          // Skip this author
        }
      }

      if (professors.length > 0) {
        console.log(`  Found ${professors.length} professors via scraper`);
        return professors;
      }
    } catch (e) {
      console.log(`  Scraper failed for ${url}: ${String(e).slice(0, 50)}`);
    }
  }

  return [];
}

// ── Main search: works-first approach ────────────────────────────────────────
// Search /works by concept + institution, collect unique authors, fetch profiles

export async function searchProfessors(
  keywords: string[],
  institutions: string[],
  limit = 8
): Promise<Professor[]> {
  if (keywords.length === 0) return [];
  console.log("OpenAlex client:", OA_CLIENT_VERSION);

  // Try seed data first for supported schools
  if (institutions.length > 0) {
    const seedData = await loadSeedData(institutions[0]);
    if (seedData.length > 0) {
      // Score seed data by keyword match
      const scored = seedData.map(prof => ({
        ...prof,
        matchScore: computeMatchScore(prof.concepts, keywords)
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
      if (scored.length > 0) return scored;
    }
  }

  const [instId, conceptIds] = await Promise.all([
    institutions.length > 0 ? resolveInstitution(institutions[0]) : Promise.resolve(null),
    resolveConcepts(keywords),
  ]);

  console.log("instId:", instId, "conceptIds:", conceptIds);

  // Strategy 1: works filtered by concept + institution
  // Strategy 2: works filtered by concept only (then post-filter authors by inst)
  // Strategy 3: works filtered by institution only (then score by keyword)
  let lastWorksError: unknown = null;
  const collectAuthorsFromWorks = async (filter: string): Promise<string[]> => {
    try {
      console.log("OpenAlex works filter:", filter);
      // Note: OpenAlex /works `select` does not support nested fields and may omit
      // `authorships` entirely. We intentionally omit `select` so we can reliably
      // extract author IDs from `authorships`.
      const data = await get<OAList<OAWork>>("/works", {
        filter,
        sort: "cited_by_count:desc",
        per_page: "50",
      });
      console.log("OpenAlex works count:", data.meta?.count ?? 0);
      const seen = new Set<string>();
      const ids: string[] = [];
      for (const work of data.results) {
        const authorships = (work as OAWork).authorships ?? [];
        for (const a of authorships) {
          const id = a.author?.id;
          if (id && !seen.has(id)) { seen.add(id); ids.push(fullId(id)); }
          if (ids.length >= Math.max(limit * 10, 30)) break;
        }
        if (ids.length >= Math.max(limit * 10, 30)) break;
      }
      console.log("OpenAlex authorIds collected:", ids.length);
      return ids;
    } catch (e) {
      lastWorksError = e;
      console.warn("works search failed:", e);
      return [];
    }
  };

  let authorIds: string[] = [];
  const conceptsFilter = conceptIds.length > 0 ? conceptIds.slice(0, 4).join("|") : "";

  if (conceptIds.length > 0 && instId) {
    authorIds = await collectAuthorsFromWorks(
      `concepts.id:${conceptsFilter},institutions.id:${instId},publication_year:>2017`
    );
  }
  if (authorIds.length === 0 && conceptIds.length > 0 && instId) {
    authorIds = await collectAuthorsFromWorks(
      `concepts.id:${conceptsFilter},institutions.id:${instId},publication_year:>2010`
    );
  }
  if (authorIds.length === 0 && conceptIds.length > 0 && instId) {
    authorIds = await collectAuthorsFromWorks(
      `concepts.id:${conceptsFilter},institutions.id:${instId}`
    );
  }
  if (authorIds.length === 0 && conceptIds.length > 0) {
    authorIds = await collectAuthorsFromWorks(
      `concepts.id:${conceptsFilter},publication_year:>2017`
    );
  }
  if (authorIds.length === 0 && conceptIds.length > 0) {
    // Broaden to all years if still no results
    authorIds = await collectAuthorsFromWorks(
      `concepts.id:${conceptsFilter}`
    );
  }
  // Last resort: keyword title search (only if concepts didn't work)
  if (authorIds.length === 0) {
    const titleFilter = instId
      ? `title.search:${keywords.slice(0, 3).join(" ")},institutions.id:${instId}`
      : `title.search:${keywords.slice(0, 3).join(" ")}`;
    authorIds = await collectAuthorsFromWorks(titleFilter);
  }

  // If the user asked for more than we could collect via concept filters, broaden:
  // pull additional authors from related concepts (not just institution-only)
  if (instId && authorIds.length < limit && conceptIds.length > 0) {
    // Try searching for related concepts at the same institution
    const relatedFilter = conceptIds.length > 4
      ? conceptIds.slice(4, 8).join("|")
      : conceptIds.slice(0, 2).join("|");
    if (relatedFilter) {
      const extra = await collectAuthorsFromWorks(
        `concepts.id:${relatedFilter},institutions.id:${instId},publication_year:>2015`
      );
      const merged = new Map<string, true>();
      for (const id of authorIds) merged.set(id, true);
      for (const id of extra) merged.set(id, true);
      authorIds = Array.from(merged.keys());
    }
  }

  if (authorIds.length === 0) {
    // Distinguish "no matches" from "OpenAlex call failed" so the UI can show a useful error.
    if (lastWorksError instanceof Error) throw lastWorksError;
    if (lastWorksError) throw new Error(`OpenAlex works search failed: ${String(lastWorksError)}`);
    return [];
  }

  // Fetch author profiles in one batch
  // Fetch more authors than requested so post-filters don't shrink below limit.
  const batchIds = authorIds.slice(0, Math.min(Math.max(limit * 8, 40), 200));
  const batchFilter = `id:${batchIds.join("|")}`;
  console.log("OpenAlex authors filter:", batchFilter);
  let authors: OAAuthor[] = [];
  try {
    const data = await get<OAList<OAAuthor>>("/authors", {
      filter: batchFilter,
      per_page: String(batchIds.length),
      select: "id,display_name,orcid,last_known_institutions,x_concepts,works_count",
    });
    authors = data.results;
    console.log("OpenAlex authors fetched:", authors.length);
  } catch (e) {
    console.warn("author batch fetch failed:", e);
    return [];
  }

  // Post-filter to institution if specified
  if (instId && authors.length > 0) {
    // If the user requested an institution, never return out-of-institution authors.
    authors = authors.filter((a) =>
      a.last_known_institutions?.some((i) => fullId(i.id) === instId)
    );
  }

  const professors = await Promise.all(
    authors.map((a) => enrichAuthor(a, keywords))
  );

  let ranked = professors.sort((a, b) => b.matchScore - a.matchScore);

  // Filter out low-confidence matches (< 0.35 match score) to avoid returning irrelevant professors
  // This prevents returning psychology professors when searching for reinforcement learning
  const strongMatches = ranked.filter((p) => p.matchScore >= 0.35);

  // If we have strong matches, use only those. Otherwise, keep all matches but mark them as weak.
  if (strongMatches.length > 0) {
    ranked = strongMatches;
  } else if (ranked.length > 0) {
    // Log that we're returning weak matches
    console.warn(
      `No strong matches found (threshold: 0.35). Returning ${ranked.length} weak matches with scores: ${ranked.map((p) => `${p.name}:${p.matchScore.toFixed(2)}`).join(", ")}`
    );
  }

  // Scraper fallback: if OpenAlex can't fill quota, try web scraper
  if (instId && institutions.length > 0 && ranked.length < limit) {
    const scrapedProfs = await scrapeFacultyDirectory(institutions[0], keywords, limit - ranked.length);
    if (scrapedProfs.length > 0) {
      const existingNames = new Set(ranked.map((p) => p.name.toLowerCase()));
      const newProfs = scrapedProfs.filter((p) => !existingNames.has(p.name.toLowerCase()));
      ranked = [...ranked, ...newProfs];
    }
  }

  // Directory fallback: if still need more, use official directories
  if (instId && institutions.length > 0 && ranked.length < limit) {
    const instName = institutions[0] as InstitutionKey;
    const dirHits: DirectoryHit[] = await fetchDirectoryHits(instName, Math.max(40, limit * 4));
    const existingNames = new Set(ranked.map((p) => p.name.toLowerCase()));
    const fillers = dirHits
      .filter((h) => !existingNames.has(h.name.toLowerCase()))
      .slice(0, Math.max(0, limit - ranked.length))
      .map((h) => ({
        id: `dir_${h.institution}_${h.name}`.replace(/\s+/g, "_"),
        name: h.name,
        affiliation: h.institution,
        email: null,
        homepage: h.profileUrl,
        concepts: [],
        recentPapers: [],
        matchScore: 0.05,
      })) satisfies Professor[];

    ranked = [...ranked, ...fillers];
  }

  return ranked.slice(0, limit);
}

export async function getProfessorByOrcid(orcid: string): Promise<Professor | null> {
  try {
    const clean = orcid.replace("https://orcid.org/", "").trim();
    const data = await get<OAList<OAAuthor>>("/authors", {
      filter: `orcid:https://orcid.org/${clean}`,
      select: "id,display_name,orcid,last_known_institutions,x_concepts,works_count",
    });
    if (data.results.length === 0) return null;
    return enrichAuthor(data.results[0], []);
  } catch {
    return null;
  }
}

export async function getRecentWorksByAuthor(
  authorId: string,
  limit = 8
): Promise<RecentPaper[]> {
  try {
    const cleanId = authorId.startsWith("https://openalex.org/") ? authorId : `https://openalex.org/${authorId}`;
    const data = await get<OAList<OAWork>>("/works", {
      filter: `authorships.author.id:${cleanId},publication_year:>2018`,
      sort: "publication_year:desc",
      per_page: String(Math.min(limit, 25)),
      select: "id,title,publication_year,primary_location",
    });
    return (data.results ?? [])
      .filter((w) => w.title)
      .slice(0, limit)
      .map((w) => ({
        title: w.title,
        year: w.publication_year,
        abstract: null,
        url: w.primary_location?.landing_page_url ?? `https://openalex.org/${shortId(w.id)}`,
      }));
  } catch {
    return [];
  }
}

export async function findAuthorIdByNameAndInstitution(
  name: string,
  institutionName: string
): Promise<string | null> {
  const qName = name.trim();
  const qInst = institutionName.trim();
  if (!qName || !qInst) return null;

  const instId = await resolveInstitution(qInst);
  if (!instId) return null;

  try {
    const data = await get<OAList<OAAuthor>>("/authors", {
      filter: `display_name.search:${qName},last_known_institutions.id:${instId}`,
      per_page: "5",
      select: "id,display_name,last_known_institutions,works_count",
    });
    const best = (data.results ?? [])[0];
    return best?.id ? fullId(best.id) : null;
  } catch {
    return null;
  }
}

// ── Email extraction via pattern guessing ────────────────────────────────────

function guessEmailByPattern(name: string, institution: string): string | null {
  const parts = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;

  const first = parts[0];
  const last = parts[parts.length - 1];

  // Map institution names to common email domains
  const domainMap: Record<string, string> = {
    "stanford": "stanford.edu",
    "mit": "mit.edu",
    "massachusetts institute": "mit.edu",
    "berkeley": "eecs.berkeley.edu",
    "uc berkeley": "eecs.berkeley.edu",
    "ucla": "cs.ucla.edu",
    "los angeles": "cs.ucla.edu",
    "cal poly": "calpoly.edu",
    "calpoly": "calpoly.edu",
    "cmu": "cs.cmu.edu",
    "carnegie mellon": "cs.cmu.edu",
    "harvard": "harvard.edu",
    "yale": "yale.edu",
    "princeton": "princeton.edu",
    "caltech": "caltech.edu",
    "uchicago": "uchicago.edu",
    "university of chicago": "uchicago.edu",
  };

  // Find matching domain
  let domain: string | null = null;
  const instLower = institution.toLowerCase();
  for (const [key, val] of Object.entries(domainMap)) {
    if (instLower.includes(key)) {
      domain = val;
      break;
    }
  }

  if (!domain) return null;

  // Most common pattern is firstname.lastname@domain
  return `${first}.${last}@${domain}`;
}

async function enrichAuthor(author: OAAuthor, keywords: string[]): Promise<Professor> {
  const authorId = shortId(author.id);
  const institution = author.last_known_institutions?.[0]?.display_name ?? "Unknown";

  let recentPapers: RecentPaper[] = [];
  try {
    const data = await get<OAList<OAWork>>("/works", {
      filter: `authorships.author.id:${authorId},publication_year:>2019`,
      sort: "publication_year:desc",
      per_page: "5",
      select: "id,title,publication_year,abstract_inverted_index,primary_location",
    });
    recentPapers = data.results
      .filter((w) => w.title)
      .slice(0, 3)
      .map((w) => ({
        title: w.title,
        year: w.publication_year,
        abstract: reconstructAbstract(w.abstract_inverted_index),
        url: w.primary_location?.landing_page_url ?? `https://openalex.org/${shortId(w.id)}`,
      }));
  } catch { /* continue */ }

  // Extract email via pattern guessing
  let email = guessEmailByPattern(author.display_name, institution);

  const kw = keywords.map((k) => k.toLowerCase());
  const concepts = (author.x_concepts ?? [])
    .map((c) => {
      const level = typeof c.level === "number" ? c.level : 2;
      const baseScore = typeof c.score === "number" ? c.score : 0.5;
      const name = c.display_name ?? "";
      const adjustedScore = kw.length > 0
        ? kw.some((k) => name.toLowerCase().includes(k) || k.includes(name.toLowerCase()))
          ? baseScore : baseScore * 0.3
        : baseScore;
      return { name, score: adjustedScore, level };
    })
    .filter((c) => c.name && c.level <= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return {
    id: authorId,
    name: author.display_name,
    affiliation: institution,
    email,
    homepage: null,
    concepts,
    recentPapers,
    matchScore: computeMatchScore(concepts, keywords),
  };
}

function computeMatchScore(concepts: { name: string; score: number }[], keywords: string[]): number {
  if (keywords.length === 0 || concepts.length === 0) return 0.5;
  const kw = keywords.map((k) => k.toLowerCase());
  let total = 0, hits = 0;
  for (const c of concepts.slice(0, 5)) {
    const name = c.name.toLowerCase();
    // Require more substantial keyword matches, not just substring inclusion
    // This prevents "making" from matching "reinforcement learning"
    if (kw.some((k) => {
      const kwLower = k.toLowerCase();
      // Exact match or significant substring (at least 4 chars)
      return name === kwLower ||
             (name.includes(kwLower) && kwLower.length >= 4) ||
             (kwLower.includes(name) && name.length >= 4);
    })) {
      total += c.score;
      hits++;
    }
  }
  return hits > 0 ? Math.min(total / hits, 1) : 0.2;
}
