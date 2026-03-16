---
description: Run the full SDLC artifact pipeline for a project — generates PRD, validation framework, risk analysis, compliance report, estimations, test plan, and deployment plan in sequence.
---

You are an AI orchestrator for the SDLC AI Platform. Your task is to run the full SDLC artifact generation pipeline for a project.

## Pipeline Steps

Execute these steps **in order**. Each step depends on the previous artifact being generated successfully.

### Step 1 — Product Requirements Document
```
POST /api/projects/{projectId}/artifacts
{ "type": "prd", "additionalContext": "{projectDescription}" }
```
Wait for response, extract artifact ID as `prdId`.

### Step 2 — Validation Framework
```
POST /api/projects/{projectId}/artifacts
{ "type": "validation_framework", "additionalContext": "Based on PRD: {prdContent}" }
```

### Step 3 — Preliminary Estimation
```
POST /api/projects/{projectId}/artifacts
{ "type": "preliminary_estimation", "additionalContext": "Based on PRD: {prdContent}" }
```

### Step 4 — Cyber Risk Analysis
```
POST /api/projects/{projectId}/artifacts
{ "type": "cyber_risk_analysis", "additionalContext": "Based on PRD: {prdContent}" }
```

### Step 5 — Compliance Report
```
POST /api/projects/{projectId}/artifacts
{ "type": "compliance_report", "additionalContext": "Based on PRD: {prdContent}" }
```

### Step 6 — Revised Estimation (incorporates risk + compliance findings)
```
POST /api/projects/{projectId}/artifacts
{ "type": "revised_estimation", "additionalContext": "Incorporating risk and compliance findings." }
```

### Step 7 — Test Plan
```
POST /api/projects/{projectId}/artifacts
{ "type": "test_plan", "additionalContext": "Based on PRD and validation framework." }
```

### Step 8 — Deployment Plan
```
POST /api/projects/{projectId}/artifacts
{ "type": "deployment_plan", "additionalContext": "Based on full SDLC context." }
```

---

## Instructions

1. Ask the user for the `projectId` (visible in the URL when viewing a project: `/projects/{projectId}`)
2. Ask for a brief project description if not already available in context
3. Run each step sequentially via the API (server must be running on `http://localhost:3001`)
4. Report success/failure after each step with the artifact title and ID
5. At the end, summarise all generated artifacts with their IDs and statuses

## Project Details

**Project ID**: [REPLACE — find in URL: /projects/{id}]
**Project Description**: [REPLACE]
**Server URL**: http://localhost:3001

---

## Quick Start (terminal)

You can also trigger generation via curl:
```bash
curl -X POST http://localhost:3001/api/projects/{projectId}/artifacts \
  -H "Content-Type: application/json" \
  -d '{"type":"prd","additionalContext":"Your project description here"}'
```
