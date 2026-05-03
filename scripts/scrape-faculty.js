#!/usr/bin/env node

/**
 * University Faculty Directory Scraper
 * Extracts professor names and emails from university CS/EE faculty pages
 * Output: seed data JSON files
 */

import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

const FACULTIES = {
  stanford: {
    name: "Stanford University",
    urls: [
      "https://www.cs.stanford.edu/people/faculty",
      "https://profiles.stanford.edu/search?organization=Computer%20Science",
    ],
  },
  berkeley: {
    name: "University of California, Berkeley",
    urls: [
      "https://www2.eecs.berkeley.edu/Faculty/",
      "https://www2.eecs.berkeley.edu/Faculty/Lists/CS/",
      "https://www2.eecs.berkeley.edu/Faculty/Lists/EE/",
    ],
  },
  mit: {
    name: "Massachusetts Institute of Technology",
    urls: [
      "https://www.csail.mit.edu/people",
      "https://www.eecs.mit.edu/people/faculty",
    ],
  },
  ucla: {
    name: "University of California, Los Angeles",
    urls: [
      "https://www.cs.ucla.edu/faculty",
      "https://ee.ucla.edu/faculty",
    ],
  },
  cmu: {
    name: "Carnegie Mellon University",
    urls: [
      "https://www.cs.cmu.edu/directory/faculty",
      "https://www.ece.cmu.edu/directory/faculty",
    ],
  },
  "cal-poly": {
    name: "California Polytechnic State University",
    urls: [
      "https://csc.calpoly.edu/people/faculty/",
      "https://www.calpoly.edu/directory?department=Computer%20Science",
    ],
  },
};

async function scrapeUniversity(key, config) {
  console.log(`\n📍 Scraping ${config.name}...`);

  for (const url of config.urls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 8000,
      });

      if (!response.ok) {
        console.log(`    ℹ️  URL failed (${response.status}): ${url}`);
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const professors = [];
      const seen = new Set();

      // Extract emails from HTML: look for mailto links and email patterns
      const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      const emailsInHtml = new Map();

      const links = $("a[href^='mailto:']");
      links.each((i, elem) => {
        const email = $(elem).attr("href")?.replace("mailto:", "").trim();
        const name = $(elem).text().trim();
        if (email) emailsInHtml.set(email.toLowerCase(), { email, name });
      });

      // Also extract emails from text content and links
      const allText = $.html();
      let match;
      while ((match = emailPattern.exec(allText)) !== null) {
        const email = match[1];
        if (!emailsInHtml.has(email.toLowerCase())) {
          emailsInHtml.set(email.toLowerCase(), { email, name: null });
        }
      }

      // Extract potential professor names (headings, divs with faculty info)
      $("h2, h3, h4, [class*='faculty'], [class*='professor'], [data-faculty], [data-person]")
        .each((i, elem) => {
          if (professors.length >= 10) return;

          let text = $(elem).text().trim();
          if (!text || text.length < 3) return;

          // Clean up
          text = text
            .replace(/\s+/g, " ")
            .replace(/,.*/, "")
            .replace(/\(.*\)/, "")
            .replace(/^\d+\.?\s*/, "")
            .trim();

          // Check if it looks like a name (2-4 words, mostly letters)
          const words = text.split(/\s+/);
          if (
            words.length < 2 ||
            words.length > 5 ||
            text.length > 50 ||
            !/^[A-Z]/.test(text)
          ) {
            return;
          }

          if (seen.has(text.toLowerCase())) return;
          seen.add(text.toLowerCase());

          professors.push({
            name: text,
            email: null,
            url,
          });
        });

      if (professors.length > 0) {
        // Try to match emails to professor names
        professors.forEach((prof) => {
          const lastNameLower = prof.name.split(/\s+/).pop()?.toLowerCase();
          for (const [emailKey, emailData] of emailsInHtml) {
            if (
              lastNameLower &&
              emailKey.includes(lastNameLower)
            ) {
              prof.email = emailData.email;
              break;
            }
          }
        });

        console.log(`  ✅ Found ${professors.length} professors at ${url.split('/')[2]}`);
        return professors;
      }
    } catch (error) {
      console.log(`    ℹ️  Error: ${error.message}`);
    }
  }

  console.warn(`  ⚠️  No professors found after trying all URLs`);
  return null;
}

async function enrichWithOpenAlex(professors, keywords = ["machine learning", "ai"]) {
  console.log(`  📚 Enriching with OpenAlex data...`);
  const enriched = [];

  for (const prof of professors) {
    try {
      // Search OpenAlex for this author
      const query = encodeURIComponent(`${prof.name}`);
      const res = await fetch(
        `https://api.openalex.org/authors?search=${query}&per_page=1&select=id,display_name,x_concepts`,
        {
          headers: { "User-Agent": "ioia-scraper" },
          timeout: 5000,
        }
      );

      if (!res.ok) continue;
      const data = await res.json();
      const author = data.results?.[0];

      if (!author) continue;

      // Get recent papers
      const papersRes = await fetch(
        `https://api.openalex.org/works?filter=authorships.author.id:${author.id},publication_year:>2020&sort=publication_year:desc&per_page=3&select=id,title,publication_year`,
        {
          headers: { "User-Agent": "ioia-scraper" },
          timeout: 5000,
        }
      );

      const papersData = await papersRes.json();
      const papers = papersData.results || [];

      enriched.push({
        id: author.id.replace("https://openalex.org/", ""),
        name: author.display_name,
        affiliation: prof.affiliation || "Unknown",
        email: prof.email,
        homepage: prof.homepage || null,
        concepts: (author.x_concepts || [])
          .slice(0, 4)
          .map((c) => ({ name: c.display_name, score: c.score })),
        recentPapers: papers.map((p) => ({
          title: p.title,
          year: p.publication_year,
          abstract: null,
          url: `https://openalex.org/${p.id.replace("https://openalex.org/", "")}`,
        })),
        matchScore: 0.5,
      });
    } catch (error) {
      // Fallback: just use scraped data
      enriched.push({
        id: `scraped_${Math.random().toString(36).slice(2, 9)}`,
        name: prof.name,
        affiliation: prof.affiliation || "Unknown",
        email: prof.email,
        homepage: prof.homepage || null,
        concepts: [],
        recentPapers: [],
        matchScore: 0.3,
      });
    }
  }

  return enriched;
}

async function main() {
  console.log("🔍 University Faculty Scraper");
  console.log("============================\n");

  for (const [key, config] of Object.entries(FACULTIES)) {
    const scraped = await scrapeUniversity(key, config);
    if (!scraped) continue;

    // Add affiliation
    scraped.forEach((p) => {
      p.affiliation = config.name;
    });

    // Enrich with OpenAlex
    const enriched = await enrichWithOpenAlex(scraped);

    // Write to seed file
    const seedPath = path.join(
      process.cwd(),
      "public",
      "data",
      "seed",
      `${key}.json`
    );
    fs.mkdirSync(path.dirname(seedPath), { recursive: true });
    fs.writeFileSync(seedPath, JSON.stringify(enriched, null, 2));

    console.log(`  💾 Saved to ${seedPath}`);
  }

  console.log("\n✅ Scraping complete!");
}

main().catch(console.error);
