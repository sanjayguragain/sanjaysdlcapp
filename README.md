# SDLC Platform

This project generates SDLC artifacts (especially PRDs) using template, skill, agent, prompt, and standards context from the repository.

## Prerequisites

- **Node.js**: v18 or later
- **npm**: v9 or later
- **Git**: for version control
- **Environment Variables**: OpenAI API key or GitHub Copilot API access (for AI-powered generation)

## Installation

### 1. Clone and Navigate to Project

```bash
cd sdlc-platform
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is required due to peer dependency constraints in the project.

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# AI Provider Configuration (choose one or more)

# OpenAI API
OPENAI_API_KEY=sk-...                    # OpenAI API key for model access

# GitHub Copilot
GITHUB_TOKEN=ghp_...                     # GitHub Personal Access Token (required for Copilot API access)
                                          # - Must have 'read:user' and 'gist' scopes
                                          # - Generate at: https://github.com/settings/tokens

# Azure OpenAI (alternative to standard OpenAI)
AZURE_OPENAI_API_KEY=...                 # Your Azure OpenAI API key
AZURE_OPENAI_ENDPOINT=https://...openai.azure.com/  # Your Azure OpenAI endpoint URL
AZURE_OPENAI_API_VERSION=2024-02-15      # API version (e.g., 2024-02-15, 2023-12-01-preview)
AZURE_OPENAI_MODEL_NAME=gpt-4            # Deployed model name in Azure (e.g., gpt-4, gpt-35-turbo)

# Database
DATABASE_URL=file:./dev.db               # SQLite dev database

# Auth (NextAuth)
NEXTAUTH_SECRET=your-secret-key-here     # Random secret for session encryption
NEXTAUTH_URL=http://localhost:3000       # Auth callback URL

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Public app URL for client-side references
```

**AI Provider Notes:**

- **OpenAI**: Use `OPENAI_API_KEY` for direct OpenAI API access
- **GitHub Copilot**: Use `GITHUB_TOKEN` with a personal access token from https://github.com/settings/tokens
  - Token requires `read:user` and `gist` scopes
  - Generate a new token specifically for this app
- **Azure OpenAI**: Fill in `AZURE_OPENAI_*` variables for Azure-hosted models
  - Find your endpoint and API key in Azure Portal under your OpenAI resource
  - Specify the exact deployed model name (e.g., `gpt-4`, `gpt-35-turbo`)
  - Use appropriate API version for your deployed model

### 4. Initialize Database

```bash
npx prisma migrate deploy
npx prisma db seed
```

This creates the SQLite database and seeds it with initial data.

### 5. Start Development Server

```bash
npm run dev
```

The application will start at **http://localhost:3000**.

Jump to http://localhost:3000/login to log in.

## Quick Start

1. **Login**: Navigate to http://localhost:3000/login
2. **Create Project**: Click "New Project" and provide a name and description
3. **Create Artifact**: Select an artifact type (PRD, SAD, etc.)
4. **Generate Content**: 
   - Auto-generate: Click "Auto-Generate with Best Practices"
   - Or manually edit the artifact
   - Or answer clarifying questions for detailed autofill

## Usage Guide

### Projects

**Create a Project:**
- Click **New Project** in the dashboard
- Enter project name and description
- Upload supporting documents (optional)
- Click **Create**

**Manage Documents:**
- In your project, click **Documents**
- Upload industry standards, competitive analysis, or other reference files
- System uses these documents as context for artifact generation

### Artifacts

**Generate Artifacts:**
1. Go to **Projects** → select your project
2. Click **New Artifact** → choose type (PRD, SAD, BRD, etc.)
3. Choose completion method:
   - **Autofill with Best Practices**: AI generates based on template + project context
   - **Answer Clarifying Questions**: Walk through guided Q&A to build artifact
4. Review and edit the generated content in the side panel

**Edit Artifacts:**
- Click the artifact in the chat panel to open side editor
- Edit sections directly in HTML or Markdown
- Changes are auto-saved
- Click **Regenerate Section** or use **Autofill** for specific sections

**Version History:**
- Artifacts track all changes
- Access version history via the artifact menu
- Restore previous versions if needed

### Chat Interface

**Send Messages:**
- Type questions or feedback about artifacts
- Use **quick-reply buttons** for common actions (e.g., "Autofill Best Practices")
- Reference artifact sections by name or number

**Artifacts in Chat:**
- Chat shows artifact updates in real-time
- Streaming responses update sections incrementally
- Click artifact titles to view or edit in side panel

### Using Autofill Best Practices

In the artifact side panel, use **Autofill with Best Practices** to replace unresolved placeholders like:

- `[To be confirmed — ...]`
- `[To be confirmed - requirement depth]`

Autofill behavior:

- **Preserves** existing resolved content
- **Uses** project context + uploaded docs + mapped skills/templates/prompts/standards
- **Fills** missing values with concrete defaults only when project context does not provide them
- **Removes** answered items from Open Questions when possible
- **Enforces** minimum quality gates (e.g., minimum functional requirement count for PRDs)

### Name Handling Rules (Important)

Autofill and generation must follow strict naming rules:

- Never invent fake personal names
- Never copy sample names from template examples unless explicitly provided in project context
- Preserve existing real names as-is if already present
- If a name is unknown, use role-only labels (e.g., Product Manager, Engineering Lead, Compliance Officer)

## PRD Template Source of Truth

PRD generation uses this canonical template:

- `.github/templates/PRD/PRD-{product-name-kebab-case}.md`

The system loads template content dynamically, so updates to this template are picked up for future generation and validation.

## Using Autofill Best Practices

In the artifact side panel, click **Autofill with Best Practices** to replace unresolved placeholders like:

- `[To be confirmed — ...]`

Autofill behavior:

- Preserves existing resolved content.
- Uses project context + uploaded docs + mapped skills/templates/prompts/standards.
- Fills missing values with concrete defaults only when project context does not provide them.
- Removes answered items from Open Questions when possible.

### Name Handling Rules (Important)

Autofill and generation must follow strict naming rules:

- Never invent fake personal names.
- Never copy sample names from template examples unless explicitly provided in project context.
- Preserve existing real names as-is if already present.
- If a name is unknown, use role-only labels (for example: Product Manager, Engineering Lead, Compliance Officer).

## Watermark Format

Every artifact ends with a **Watermark** section.

The watermark now includes metadata in a single JSON code block containing:

- `generated_by`
- `agents_used`
- `skills_used`
- `references_used`

This supports traceability for how each artifact was produced.

## Notes

- Existing artifacts can be backfilled to the latest watermark format.
- New and updated artifacts automatically use the current watermark renderer.