import { findCompany } from "./find_company"

// CLI runner for the find_company module. Mirrors extract_tone_runner.ts —
// runs a handful of canned queries against data/seed/companies.json so the
// scoring + contact-suggestion logic can be eyeballed end-to-end.
//
// Run with: npm run find:company

const queries: string[] = [
  "intern at Linear",
  "Linear sync engine internship",
  "Vercel edge runtime",
  "summer internship at a payments company",
  "Anthropic safety team",
  "Supabase API platform",
  "looking for a SWE role at Ramp",
  "garbage query that matches nothing xyzzy",
]

function main(): void {
  for (const query of queries) {
    console.log("=".repeat(72))
    console.log(`query: ${query}`)
    console.log("=".repeat(72))

    try {
      const result = findCompany(query)
      if (result.matches.length === 0) {
        console.log("(no matches)")
      } else {
        for (const match of result.matches) {
          const contact = match.company.contacts.find(c => c.id === match.suggestedContactId)
          console.log(`  ${match.company.name} (${match.company.domain})`)
          console.log(`    reason: ${match.matchReason}`)
          console.log(`    suggested contact: ${contact?.name ?? "?"} (${contact?.role ?? "?"})`)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`[error] ${msg}`)
      if (msg.includes("ENOENT")) {
        console.log(
          "Seed file is missing. Create cold_email_workflow/companies.json with verified company data before running this.",
        )
      }
    }
    console.log()
  }
}

main()
