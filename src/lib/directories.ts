// Lightweight, browser-safe directory fetchers for a fixed set of schools.
// Goal: widen coverage beyond OpenAlex by pulling names from official faculty directories,
// then letting the app enrich/draft from those.

export type DirectoryHit = {
  name: string;
  institution: string;
  profileUrl: string | null;
};

export type InstitutionKey = "UC Berkeley" | "UCLA" | "CMU" | "Cal Poly";

type DirectorySource = {
  institution: InstitutionKey;
  // Official directory/list page URLs. Keep this curated and small.
  urls: string[];
};

// NOTE: These are best-effort defaults and may need adjustment over time.
// If a URL stops working (CORS/403/layout), replace it here.
export const DIRECTORY_SOURCES: Record<InstitutionKey, DirectorySource> = {
  "UC Berkeley": {
    institution: "UC Berkeley",
    urls: [
      // EECS faculty lists (commonly used and stable-ish)
      "https://www2.eecs.berkeley.edu/Faculty/Lists/CS/",
      "https://www2.eecs.berkeley.edu/Faculty/Lists/EE/",
    ],
  },
  UCLA: {
    institution: "UCLA",
    urls: [
      // UCLA CS faculty directory pages (may vary by department site)
      "https://www.cs.ucla.edu/faculty/",
    ],
  },
  CMU: {
    institution: "CMU",
    urls: [
      // CMU SCS faculty listing
      "https://www.cs.cmu.edu/directory/faculty",
    ],
  },
  "Cal Poly": {
    institution: "Cal Poly",
    urls: [
      // Cal Poly CSSE directory pages can change; adjust as needed
      "https://csc.calpoly.edu/faculty/",
    ],
  },
};

function looksLikePersonName(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t.length < 5 || t.length > 60) return false;
  if (/\b(faculty|staff|directory|contact|admissions|research|undergraduate|graduate|people|profile)\b/i.test(t)) return false;
  // Two to four words, mostly letters, capitalized-ish
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return false;
  if (words.some((w) => w.length > 24)) return false;
  if (!/^[A-Za-z][A-Za-z.'-]+$/.test(words[0])) return false;
  return true;
}

function uniqBy<T>(arr: T[], key: (x: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Directory fetch failed ${res.status} for ${url}`);
  return res.text();
}

export async function fetchDirectoryHits(
  institution: InstitutionKey,
  limit = 50
): Promise<DirectoryHit[]> {
  const src = DIRECTORY_SOURCES[institution];
  if (!src) return [];

  const hits: DirectoryHit[] = [];
  for (const url of src.urls) {
    try {
      const html = await fetchHtml(url);
      const doc = new DOMParser().parseFromString(html, "text/html");
      const anchors = Array.from(doc.querySelectorAll("a"));
      for (const a of anchors) {
        const name = (a.textContent ?? "").replace(/\s{2,}/g, " ").trim();
        if (!looksLikePersonName(name)) continue;
        const href = a.getAttribute("href");
        const profileUrl = href ? new URL(href, url).toString() : null;
        hits.push({ name, institution: src.institution, profileUrl });
        if (hits.length >= limit) break;
      }
    } catch {
      // ignore one broken source, continue
    }
    if (hits.length >= limit) break;
  }

  return uniqBy(hits, (h) => `${h.institution}::${h.name.toLowerCase()}`).slice(0, limit);
}

