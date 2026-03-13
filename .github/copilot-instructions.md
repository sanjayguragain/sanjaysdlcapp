# SDLC AI Platform — Copilot Agent Instructions

## Project Overview
This is an AI-assisted Software Development Lifecycle (SDLC) platform built with:
- **Next.js 16** App Router (TypeScript, Tailwind CSS v4)
- **Prisma 6 + SQLite** for persistence
- **TipTap v2** rich text editor
- **AI backend**: GitHub Models (primary) → Azure OpenAI → OpenAI → mock fallback

The platform helps teams generate, review, and approve SDLC artifacts (PRDs, test plans, risk analyses, etc.) using AI.

## Key Directories
```
src/
  app/(dashboard)/          # All UI pages (Next.js App Router)
  app/api/                  # API routes (REST)
  components/
    artifacts/              # ArtifactSidePanel, ArtifactEditor, ArtifactCard
    chat/                   # ChatInterface, MessageBubble
    layout/                 # Sidebar, Header
    projects/               # ProjectCard, ProgressTracker
  lib/
    ai.ts                   # All LLM calls — streamChatResponse, generateArtifact
    db.ts                   # Prisma client singleton
    workflow.ts             # Artifact state machine
  types/index.ts            # Shared TypeScript types
prisma/schema.prisma        # Database schema
```

## Artifact Types
The platform supports these SDLC artifact types (defined in `src/types/index.ts`):
- `prd` — Product Requirements Document
- `validation_framework` — Requirements Validation Framework
- `preliminary_estimation` — Story points and effort estimation
- `cyber_risk_analysis` — STRIDE-based threat model
- `compliance_report` — GDPR/SOC2/HIPAA compliance
- `revised_estimation` — Updated estimates post risk/compliance review
- `test_plan` — Comprehensive QA test plan
- `quality_review` — Release readiness report
- `deployment_plan` — Blue-green/canary deployment strategy
- `prd_validation` — PRD validation and completeness check

## Artifact Status Flow
`draft` → `in_progress` → `generated` → `awaiting_approval` → `approved` / `rejected`

## AI Integration
All AI calls go through `src/lib/ai.ts`:
- `streamChatResponse()` — streaming SSE for chat (used in chat route)
- `generateChatResponse()` — non-streaming for artifact generation
- `generateArtifact(type, projectContext)` — generates a specific artifact type
- `generateMockArtifact()` — fallback when no API key is configured

The AI provider is selected by env vars (checked in order):
1. `AZURE_OPENAI_ENDPOINT` + `AZURE_OPENAI_API_KEY` → Azure OpenAI
2. `GITHUB_TOKEN` → GitHub Models (openai/gpt-4o by default)
3. `OPENAI_API_KEY` → OpenAI
4. No key → mock mode (template-based responses)

## Coding Conventions
- All new API routes go in `src/app/api/` following the Next.js App Router pattern
- Use `prisma` from `src/lib/db.ts` — never instantiate a new `PrismaClient` directly
- Artifact content from TipTap is **HTML**; AI-generated content is **markdown** — always detect before processing: `/<[a-z][\s\S]*>/i.test(content)`
- Confidence scores are stored as decimals (0.0–1.0), never percentages
- Use `NextResponse.json()` for all API responses
- TypeScript strict mode is enabled — no `any` types

## Database Schema Key Models
- `Project` — has many `Artifact`, `Document`, `Notification`
- `Artifact` — has `status`, `confidenceScore`, `version`, many `ArtifactVersion`
- `Approval` — linked to `Artifact`, has `status` (approved/rejected) and `feedback`
- `ArtifactVersion` — snapshot of artifact content at a point in time
- `User` — owner of projects and artifacts

## Environment Variables
See `.env.example` for full list. Minimum to run with real AI:
```
GITHUB_TOKEN=ghp_...          # GitHub PAT — enables GitHub Models
DATABASE_URL="file:./dev.db"
```
