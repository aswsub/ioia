# Requirements: Professor Search and Draft Pipeline

## Overview

The professor search pipeline powers the main ioia promise: a student asks for professors in an area and receives personalized outreach drafts grounded in real research context.

## Requirements

### 1. Request parsing supports natural language and tags

**User story:** As a student, I want to type a normal request with optional shortcuts.

**Acceptance criteria:**
- Natural language prompts work without tags.
- `@school:<value>`, `@topic:<value>`, and `@n:<number>` are parsed when present.
- Quoted tag values such as `@school:"UC Berkeley"` are supported.
- Parsed tags are visually highlighted in the chat bubble.

### 2. Discovery uses real helpers

**User story:** As a student, I want results that look grounded, not generic.

**Acceptance criteria:**
- Professor discovery calls `src/lib/openalex.ts` where applicable.
- Company discovery calls `src/lib/find_company.ts` or `src/lib/find_company_live.ts` when the request is company-oriented.
- Live network failures degrade to a readable message or cached/local fallback.

### 3. Draft generation preserves voice and specificity

**User story:** As a student, I want drafts that sound personal and mention specific work.

**Acceptance criteria:**
- Drafting flows through `src/lib/claude.ts` and `cold_email_workflow/prompts/*`.
- Drafts include a subject and body suitable for Outreach review.
- Draft text references specific professor/company context when available.
- The pipeline avoids unsupported claims when source context is missing.

### 4. Outreach integration is durable

**User story:** As a student, I want generated drafts to stay available after leaving the agent view.

**Acceptance criteria:**
- Generated drafts are converted to the shared `OutreachDraft` shape.
- Drafts are saved through `src/lib/db.ts`.
- Draft status changes propagate to Outreach and detail views.
