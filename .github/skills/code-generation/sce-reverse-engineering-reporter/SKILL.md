---
name: sce-reverse-engineering-reporter
description: "Generates navigable HTML documentation from reverse engineering analysis results. Produces a multi-page HTML site with SCE theme (white, green, gold), sidebar navigation, inline Mermaid/PlantUML diagrams, searchable file/class indexes, and per-phase content pages. Contains all HTML/CSS/JS templates internally."
compatibility:
  - "3 - Analysis - Reverse Engineering Agent"
license: "Proprietary"
metadata:
  version: 1.0.0
  author: SDLC Analysis Team
  category: code-generation
  tags: [reverse-engineering, html-report, documentation, mermaid, visualization]
  tools: ['read', 'search', 'edit', 'execute']
---

# sce-reverse-engineering-reporter

## When to Use This Skill

- Generating the final HTML output from codebase reverse engineering analysis
- Stitching per-phase JSON results into navigable HTML pages
- Producing searchable file and class indexes with inline diagrams
- Creating a self-contained documentation site for a reverse-engineered codebase

## Unitary Function

**ONE responsibility:** Take structured JSON output from all reverse engineering phases and generate a complete, navigable HTML documentation site with SCE branding.

## NOT RESPONSIBLE FOR

- Performing any code analysis (receives pre-analyzed data)
- Generating diagrams from code (receives Mermaid/PlantUML strings from upstream phases)
- Deciding analysis depth or file classification
- Hosting or deploying the HTML output

## Input

```json
{
  "repo_name": "my-application",
  "output_dir": "docs/codebase-analysis/",
  "discovery_results": {},
  "file_analysis_results": [],
  "data_model_results": {},
  "flow_mapping_results": {},
  "architecture_results": {},
  "business_logic_results": {},
  "test_analysis_results": {},
  "checklist": {}
}
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `repo_name` | Yes | Repository name for page titles |
| `output_dir` | Yes | Relative path for HTML output |
| `discovery_results` | Yes | Phase 1 output JSON |
| `file_analysis_results` | Yes | Phase 2 per-file analysis array |
| `data_model_results` | Yes | Phase 3 data model JSON |
| `flow_mapping_results` | Yes | Phase 4 flow mapping JSON |
| `architecture_results` | Yes | Phase 5 architecture JSON |
| `business_logic_results` | Yes | Phase 6 business logic JSON |
| `test_analysis_results` | Yes | Phase 7 test analysis JSON |
| `checklist` | Yes | Master Checklist JSON (for status tracking display) |

## Output Structure

```
{output_dir}/
├── index.html                        # Overview dashboard
├── assets/
│   ├── style.css                     # SCE theme styles
│   └── app.js                        # Search, navigation, Mermaid init
├── 1-discovery/
│   └── index.html                    # Discovery results
├── 2-file-analysis/
│   ├── index.html                    # Searchable file list
│   └── files/
│       └── {sanitized-filename}.html # Per-file detail pages
├── 3-data-model/
│   └── index.html                    # ER diagram + entities
├── 4-user-flows/
│   └── index.html                    # Sequence diagrams
├── 5-architecture/
│   └── index.html                    # Architecture diagrams
├── 6-business-logic/
│   └── index.html                    # Capabilities + Q&A
├── 7-tests/
│   └── index.html                    # Test inventory + gaps
└── checklist.json                    # Machine-readable checklist
```

## SCE Theme Specification

### Color Palette
```css
:root {
    /* Primary */
    --sce-white: #FFFFFF;
    --sce-bg-light: #F5F5F5;
    --sce-green: #1B6B3C;
    --sce-green-dark: #145A30;
    --sce-green-light: #E8F5E9;
    --sce-gold: #D4A017;
    --sce-gold-light: #FFF8E1;
    --sce-teal: #0D6B5F;

    /* Text */
    --sce-text-primary: #333333;
    --sce-text-secondary: #666666;
    --sce-text-light: #999999;

    /* Functional */
    --sce-success: #2E7D32;
    --sce-warning: #F57C00;
    --sce-error: #D32F2F;
    --sce-info: #1565C0;

    /* Layout */
    --sidebar-width: 260px;
    --header-height: 64px;
    --content-max-width: 1200px;
}
```

### Typography
```css
body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: var(--sce-text-primary);
    background: var(--sce-bg-light);
}
h1, h2, h3, h4 { color: var(--sce-green); font-weight: 600; }
h1 { font-size: 1.75rem; }
h2 { font-size: 1.4rem; border-bottom: 2px solid var(--sce-gold); padding-bottom: 0.3rem; }
h3 { font-size: 1.15rem; }
```

### Component Styles

**Sidebar:**
```css
.sidebar {
    width: var(--sidebar-width);
    background: var(--sce-white);
    border-right: 1px solid #E0E0E0;
    height: 100vh;
    position: fixed;
    overflow-y: auto;
    padding-top: var(--header-height);
}
.sidebar-item {
    padding: 10px 20px;
    color: var(--sce-text-primary);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 10px;
    border-left: 3px solid transparent;
    transition: all 0.2s ease;
}
.sidebar-item:hover {
    background: var(--sce-green-light);
    border-left-color: var(--sce-green);
}
.sidebar-item.active {
    color: var(--sce-gold);
    font-weight: 600;
    border-left-color: var(--sce-gold);
    background: var(--sce-gold-light);
}
```

**Header Bar:**
```css
.header {
    height: var(--header-height);
    background: var(--sce-white);
    border-bottom: 1px solid #E0E0E0;
    display: flex;
    align-items: center;
    padding: 0 24px;
    position: fixed;
    width: 100%;
    z-index: 100;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.header-title {
    color: var(--sce-green);
    font-size: 1.3rem;
    font-weight: 700;
}
.header-icon {
    color: var(--sce-gold);
    font-size: 1.5rem;
    margin-right: 10px;
}
.header-subtitle {
    color: var(--sce-text-secondary);
    font-size: 0.85rem;
    margin-left: 12px;
}
```

**Content Cards:**
```css
.card {
    background: var(--sce-white);
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border: 1px solid #E8E8E8;
}
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}
```

**Tables:**
```css
table {
    width: 100%;
    border-collapse: collapse;
    background: var(--sce-white);
    border-radius: 8px;
    overflow: hidden;
}
th {
    background: var(--sce-green);
    color: var(--sce-white);
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
td {
    padding: 10px 16px;
    border-bottom: 1px solid #F0F0F0;
}
tr:nth-child(even) { background: var(--sce-bg-light); }
tr:hover { background: var(--sce-green-light); }
```

**Search Bar:**
```css
.search-container {
    position: relative;
    margin-bottom: 20px;
}
.search-input {
    width: 100%;
    padding: 10px 16px 10px 40px;
    border: 2px solid #E0E0E0;
    border-radius: 8px;
    font-size: 0.95rem;
    transition: border-color 0.2s;
    background: var(--sce-white);
}
.search-input:focus {
    border-color: var(--sce-green);
    outline: none;
    box-shadow: 0 0 0 3px rgba(27, 107, 60, 0.1);
}
.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--sce-text-light);
}
```

**Status Badges:**
```css
.badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}
.badge-completed { background: var(--sce-green-light); color: var(--sce-green); }
.badge-in-progress { background: var(--sce-gold-light); color: #B8860B; }
.badge-not-started { background: #F5F5F5; color: var(--sce-text-light); }
.badge-error { background: #FFEBEE; color: var(--sce-error); }
.badge-critical { background: #FFEBEE; color: var(--sce-error); }
.badge-high { background: #FFF3E0; color: var(--sce-warning); }
.badge-medium { background: var(--sce-gold-light); color: #B8860B; }
.badge-low { background: var(--sce-green-light); color: var(--sce-green); }
```

**Collapsible Sections:**
```css
.collapsible-header {
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--sce-bg-light);
    border-radius: 6px;
    margin-bottom: 4px;
    user-select: none;
}
.collapsible-header:hover { background: var(--sce-green-light); }
.collapsible-content {
    display: none;
    padding: 16px;
    border-left: 3px solid var(--sce-gold);
    margin-left: 8px;
}
.collapsible-content.open { display: block; }
```

**Mermaid Diagram Container:**
```css
.diagram-container {
    background: var(--sce-white);
    border: 1px solid #E8E8E8;
    border-radius: 8px;
    padding: 24px;
    margin: 16px 0;
    overflow-x: auto;
}
.diagram-container .mermaid {
    display: flex;
    justify-content: center;
}
```

## HTML Templates

### index.html (Main Shell)
The main `index.html` MUST include:
1. `<head>` with viewport meta, charset, CSS link, Mermaid CDN script
2. Header bar with SCE icon (📊), repo name, and subtitle "Codebase Analysis Report"
3. Sidebar with navigation links to all 7 phase pages
4. Main content area with overview dashboard:
   - Repository summary card (name, language, frameworks, project type)
   - Statistics cards (files, classes, methods, flows, capabilities, tests)
   - Phase completion status
   - Top health issues (from architecture)
   - Top test gaps (from test analysis)

**Mermaid initialization script:**
```html
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
    mermaid.initialize({
        startOnLoad: true,
        theme: 'base',
        themeVariables: {
            primaryColor: '#E8F5E9',
            primaryTextColor: '#1B6B3C',
            primaryBorderColor: '#1B6B3C',
            lineColor: '#1B6B3C',
            secondaryColor: '#FFF8E1',
            tertiaryColor: '#F5F5F5',
            noteBkgColor: '#FFF8E1',
            noteTextColor: '#333333'
        },
        securityLevel: 'strict'
    });
</script>
```

> **Strict-mode line breaks:** Mermaid `securityLevel: 'strict'` blocks `<br>` HTML tags inside diagram labels. Use `\n` for line breaks in node text instead (e.g., `A["Line 1\nLine 2"]`).

### app.js (Client-Side Logic)

**Search functionality:**
```javascript
function initSearch(inputId, listSelector, fieldSelector) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        document.querySelectorAll(listSelector).forEach(function(item) {
            const fields = item.querySelectorAll(fieldSelector);
            let match = false;
            fields.forEach(function(f) {
                if (f.textContent.toLowerCase().includes(query)) match = true;
            });
            item.style.display = match ? '' : 'none';
        });
        // Update count
        const visible = document.querySelectorAll(listSelector + ':not([style*="display: none"])').length;
        const counter = document.getElementById(inputId + '-count');
        if (counter) counter.textContent = visible + ' results';
    });
}
```

**Collapsible sections:**
```javascript
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.collapsible-header').forEach(function(header) {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            content.classList.toggle('open');
            const arrow = this.querySelector('.arrow');
            if (arrow) arrow.textContent = content.classList.contains('open') ? '▼' : '▶';
        });
    });
});
```

**Active sidebar highlighting:**
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar-item').forEach(function(item) {
        if (currentPath.includes(item.getAttribute('href').replace('index.html', ''))) {
            item.classList.add('active');
        }
    });
});
```

### sidebar-nav (Shared Across All Pages)

```html
<nav class="sidebar">
    <div style="padding: 16px 20px; border-bottom: 1px solid #E0E0E0;">
        <span class="header-icon">☰</span>
    </div>
    <a href="../index.html" class="sidebar-item">
        <span class="nav-icon">📊</span> Overview
    </a>
    <a href="../1-discovery/index.html" class="sidebar-item">
        <span class="nav-icon">🔍</span> Discovery
    </a>
    <a href="../2-file-analysis/index.html" class="sidebar-item">
        <span class="nav-icon">📄</span> File Analysis
    </a>
    <a href="../3-data-model/index.html" class="sidebar-item">
        <span class="nav-icon">🗄️</span> Data Model
    </a>
    <a href="../4-user-flows/index.html" class="sidebar-item">
        <span class="nav-icon">🔀</span> User Flows
    </a>
    <a href="../5-architecture/index.html" class="sidebar-item">
        <span class="nav-icon">🏗️</span> Architecture
    </a>
    <a href="../6-business-logic/index.html" class="sidebar-item">
        <span class="nav-icon">💼</span> Business Logic
    </a>
    <a href="../7-tests/index.html" class="sidebar-item">
        <span class="nav-icon">🧪</span> Tests
    </a>
</nav>
```

### Phase Page Templates

Each phase page (`{N}-{phase}/index.html`) MUST follow this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{Phase Name} — {repo_name} Analysis</title>
    <link rel="stylesheet" href="../assets/style.css">
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <span class="header-icon">📊</span>
        <span class="header-title">{repo_name}</span>
        <span class="header-subtitle">Codebase Analysis Report</span>
    </header>

    <!-- Sidebar -->
    {sidebar-nav}

    <!-- Main Content -->
    <main class="main-content">
        <div class="content-container">
            <h1>{Phase Name}</h1>

            <!-- Phase-specific content here -->

        </div>
    </main>

    <script src="../assets/app.js"></script>
    <script>mermaid.initialize({startOnLoad: true, theme: 'base', themeVariables: {primaryColor: '#E8F5E9', primaryTextColor: '#1B6B3C', primaryBorderColor: '#1B6B3C', lineColor: '#1B6B3C', secondaryColor: '#FFF8E1', tertiaryColor: '#F5F5F5', noteBkgColor: '#FFF8E1', noteTextColor: '#333333'}, securityLevel: 'strict'});</script>
</body>
</html>
```

### Per-File Detail Page Template (2-file-analysis/files/{name}.html)

Each per-file page MUST include:
1. File path breadcrumb
2. Summary card with language, LOC, complexity, framework usage
3. Class list with collapsible method details
4. Import table (internal vs external)
5. Design patterns identified
6. Change Readiness card with coupling, cohesion, risks, recommendations
7. Inline Mermaid class diagram
8. Inline Mermaid logical flow diagram

### File List Page Template (2-file-analysis/index.html)

MUST include:
1. Search bar filtering by file name, class name, or language
2. Result counter
3. Table with columns: File Path, Language, Classes, Methods, Complexity, Analysis Status
4. Each file name links to its detail page
5. Status badges for analysis state

## File Name Sanitization

When generating per-file HTML filenames, MUST sanitize:
```
src/auth/views.py → src-auth-views-py.html
Controllers/UserController.cs → controllers-usercontroller-cs.html
```

Rules:
1. Replace `/` and `\` with `-`
2. Replace `.` with `-` (except final `.html`)
3. Convert to lowercase
4. Remove characters not in `[a-z0-9-]`
5. Collapse multiple `-` into single

## Generation Process

### Step 1: Create Directory Structure
1. Create `{output_dir}/` and all subdirectories
2. Create `{output_dir}/assets/` for CSS and JS

### Step 2: Generate Shared Assets
1. Write `style.css` with full SCE theme (from specification above)
2. Write `app.js` with search, collapsible, navigation, and Mermaid init

### Step 3: Generate Overview Page
1. Populate `index.html` with repository summary from discovery results
2. Add statistics cards from all phase results
3. Add phase completion status from checklist
4. Add top issues/gaps summaries

### Step 4: Generate Phase Pages
1. For each phase (1-7), generate `{N}-{phase}/index.html`
2. Populate with phase-specific data from input JSON
3. Embed Mermaid diagram strings in `<div class="mermaid">` blocks
4. Add search bars to list-heavy pages (files, flows, capabilities)

### Step 5: Generate Per-File Detail Pages
1. For each analyzed file in `file_analysis_results`, generate detail HTML
2. Apply filename sanitization
3. Include all class/method data with collapsible sections
4. Embed Mermaid diagrams inline

### Step 6: Write Checklist
1. Write `checklist.json` to output directory

### Step 7: Validate
1. Verify all HTML files have closing tags
2. Verify all internal links reference existing files
3. Verify Mermaid blocks have valid syntax (basic check: matching brackets)

## Quality Checks

- [ ] All phase pages generated and contain data
- [ ] `style.css` contains full SCE theme
- [ ] `app.js` contains search, collapsible, and Mermaid init
- [ ] Overview page shows summary statistics
- [ ] File analysis page has working search filter
- [ ] Per-file detail pages generated for all analyzed files
- [ ] All Mermaid diagrams embedded in `<div class="mermaid">` blocks
- [ ] Sidebar links all resolve correctly (relative paths)
- [ ] No broken internal links
- [ ] HTML is valid (proper DOCTYPE, charset, closing tags)
- [ ] `checklist.json` written to output directory

## Guardrails

- MUST NOT include any JavaScript that makes network requests (except Mermaid CDN)
- MUST NOT embed executable code from the analyzed repository
- MUST sanitize all data inserted into HTML to prevent XSS (escape `<`, `>`, `&`, `"`, `'`)
- MUST use relative paths for all internal links (portable output)
- MUST NOT include sensitive data (secrets, credentials, PII) in HTML output
- MUST encode special characters in Mermaid diagrams (especially `<`, `>`, `&`)
- **Mermaid string XSS sanitization:** Before embedding any string from the analyzed codebase (class names, method names, file paths, labels) into a Mermaid diagram block, the reporter MUST strip or escape characters that could break out of the diagram DSL or inject SVG/HTML: remove `<`, `>`, `"`, `'`, `` ` ``, `{`, `}`, and replace with safe equivalents or underscores. This prevents untrusted repository content from producing malicious SVG output even under `securityLevel: 'strict'`.

## Authority Boundaries

**CAN:**
- Create files and directories in the output directory
- Read phase result data from input
- Generate HTML, CSS, and JavaScript files
- Embed Mermaid diagram syntax provided by upstream phases

**CANNOT:**
- Read source code directly (receives only analyzed results)
- Modify files outside the output directory
- Make network requests
- Execute arbitrary scripts
