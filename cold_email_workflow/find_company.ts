import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { z } from "zod"
import { CompanySchema, type Company } from "./schemas"
import {
  findCompanyMatches,
  FindCompanyMatchSchema,
  FindCompanyOutputSchema,
  type FindCompanyMatch,
  type FindCompanyOutput,
} from "./find_company_core"

// ============================================================================
// Node-side company discovery. Reads companies.json from disk on first call
// and delegates ranking + contact suggestion to find_company_core.ts.
//
// The browser path (src/lib/find_company.ts) imports the JSON via Vite and
// calls findCompanyMatches directly — it can't use node:fs.
// ============================================================================

const SeedFileSchema = z.object({
  companies: z.array(CompanySchema),
})

// Re-exports kept for callers that imported these from this module.
export {
  FindCompanyMatchSchema,
  FindCompanyOutputSchema,
  type FindCompanyMatch,
  type FindCompanyOutput,
}

function defaultSeedPath(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  return resolve(here, "companies.json")
}

let cachedCompanies: Company[] | null = null

export function loadCompanies(seedPath: string = defaultSeedPath()): Company[] {
  if (cachedCompanies) return cachedCompanies
  const raw = readFileSync(seedPath, "utf-8")
  const parsed = SeedFileSchema.parse(JSON.parse(raw))
  cachedCompanies = parsed.companies
  return cachedCompanies
}

// Test-only — not exported by index.
export function _resetCompanyCache(): void {
  cachedCompanies = null
}

export function findCompany(
  query: string,
  opts: { seedPath?: string; limit?: number } = {},
): FindCompanyOutput {
  const companies = loadCompanies(opts.seedPath)
  return findCompanyMatches(companies, query, opts.limit ?? 5)
}
