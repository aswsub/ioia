import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const professors = [
  { name: 'Franz Kurfess', affiliation: 'Cal Poly' },
  { name: 'Igors Medvedevs', affiliation: 'Cal Poly' },
  { name: 'Lubomir Stanchev', affiliation: 'Cal Poly' },
];

async function searchGoogleScholar(name, affiliation) {
  const query = encodeURIComponent(`${name} ${affiliation}`);
  const url = `https://scholar.google.com/scholar?q=${query}&hl=en`;
  
  try {
    // Note: Google Scholar may block automated requests. This is a best-effort approach.
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch for ${name}: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const papers = [];
    $('div.gs_ri').slice(0, 3).each((i, elem) => {
      const titleElem = $(elem).find('h3 a');
      const title = titleElem.text().trim();
      const paperUrl = titleElem.attr('href');
      
      const infoElem = $(elem).find('.gs_a').text();
      const [authors, source, year] = infoElem.split(' - ').map(s => s.trim());
      
      const abstractElem = $(elem).find('.gs_rs').text();
      
      if (title) {
        papers.push({
          title,
          url: paperUrl || '',
          abstract: abstractElem.slice(0, 200),
          year: parseInt(year) || new Date().getFullYear(),
          authors
        });
      }
    });
    
    return papers;
  } catch (error) {
    console.error(`Error scraping ${name}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('Scraping Google Scholar for papers...\n');
  
  const results = {};
  for (const prof of professors) {
    console.log(`Fetching papers for ${prof.name}...`);
    const papers = await searchGoogleScholar(prof.name, prof.affiliation);
    results[prof.name] = papers;
    console.log(`  Found ${papers.length} papers\n`);
    
    // Rate limit to avoid blocking
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n=== Results ===\n');
  console.log(JSON.stringify(results, null, 2));
}

main();
