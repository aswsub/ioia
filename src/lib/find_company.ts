import companiesSeed from "../../cold_email_workflow/companies.json";
import {
  findCompanyMatches,
  type FindCompanyMatch,
  type FindCompanyOutput,
} from "../../cold_email_workflow/find_company_core";
import type { Company } from "../../cold_email_workflow/schemas";

// Browser-side company finder. Vite inlines companies.json at build time, so
// we never hit the filesystem (the Node-side counterpart in
// cold_email_workflow/find_company.ts uses node:fs and would not bundle).
//
// The two paths share scoring + contact-suggestion logic via find_company_core.

// JSON imports come back loosely-typed; runtime shape is validated by the
// CompanySchema inside findCompanyMatches's downstream Zod calls (well, by
// FindCompanyOutputSchema's parse on the way out). The cast here is fine.
const SEED_COMPANIES = (companiesSeed as { companies: Company[] }).companies;

export function findCompanyForQuery(query: string, limit = 5): FindCompanyOutput {
  return findCompanyMatches(SEED_COMPANIES, query, limit);
}

export function getCompanyById(id: string): Company | null {
  return SEED_COMPANIES.find((c) => c.id === id) ?? null;
}

export type { FindCompanyMatch, FindCompanyOutput };
