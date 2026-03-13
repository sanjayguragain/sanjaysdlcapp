import { ArtifactType } from "@/types";

const SYSTEM_PROMPT = `You are an expert AI product documentation assistant for enterprise software teams. You help generate structured SDLC artifacts including Product Requirements Documents, risk analyses, compliance reports, test plans, and deployment plans.

Your role:
- Generate comprehensive, well-structured documentation artifacts
- Ask clarifying questions when information is missing
- Identify gaps, risks, and dependencies
- Provide confidence scores for generated content
- Maintain traceability between artifacts

When generating artifacts, use clear headings, structured sections, and professional enterprise language. Be thorough but concise.`;

const ARTIFACT_PROMPTS: Record<ArtifactType, string> = {
  prd: `Generate a comprehensive Product Requirements Document (PRD) with the following sections:
1. Executive Summary
2. Problem Statement
3. Goals and Objectives
4. Target Users / Personas
5. Functional Requirements (detailed, numbered)
6. Non-Functional Requirements (performance, security, scalability)
7. User Stories / Use Cases
8. Acceptance Criteria
9. Dependencies and Assumptions
10. Out of Scope
11. Success Metrics
12. Timeline Considerations

Use the provided project context and uploaded documents to generate accurate, specific requirements.`,

  prd_validation: `Generate a PRD Validation Report analyzing the PRD for:
1. Requirement Clarity Score (1-10 for each requirement)
2. Completeness Analysis - missing requirements or gaps
3. Consistency Check - contradictions between requirements
4. Testability Assessment - can each requirement be tested?
5. Ambiguity Detection - vague or unclear language
6. Dependency Analysis - unstated dependencies
7. Risk Areas - requirements that pose implementation risk
8. Recommendations - specific improvements needed`,

  preliminary_estimation: `Generate a Preliminary Estimation with:
1. Effort Breakdown by Feature/Epic
2. Team Composition Requirements
3. Timeline Estimate (phases with durations)
4. Resource Requirements
5. Key Assumptions
6. Risk Factors Affecting Estimates
7. Confidence Level for Each Estimate
8. Dependencies on External Teams`,

  cyber_risk_analysis: `Generate a Cyber Risk Analysis including:
1. Threat Model (STRIDE-based analysis)
2. Attack Surface Assessment
3. Data Classification and Sensitivity
4. Authentication and Authorization Risks
5. API Security Assessment
6. Third-Party Integration Risks
7. Compliance-Related Security Requirements
8. Risk Severity Matrix (likelihood x impact)
9. Mitigation Strategies (prioritized)
10. Residual Risk Assessment`,

  compliance_report: `Generate a Compliance Report covering:
1. Regulatory Framework Applicability (GDPR, SOC2, HIPAA, etc.)
2. Data Privacy Assessment
3. Data Retention Requirements
4. Audit Trail Requirements
5. Access Control Requirements
6. Reporting Obligations
7. Third-Party Compliance Dependencies
8. Gap Analysis vs. Current State
9. Remediation Recommendations
10. Compliance Monitoring Plan`,

  revised_estimation: `Generate a Revised Estimation incorporating risk and compliance findings:
1. Updated Effort Breakdown (reflecting security/compliance work)
2. Additional Security Implementation Tasks
3. Compliance Implementation Tasks
4. Revised Timeline
5. Updated Resource Requirements
6. Risk Contingency Buffer
7. Comparison with Preliminary Estimate
8. Key Changes and Justification`,

  test_plan: `Generate a comprehensive Test Plan including:
1. Test Strategy Overview
2. Test Scope (in-scope and out-of-scope)
3. Test Types (unit, integration, e2e, performance, security)
4. Test Environment Requirements
5. Test Data Requirements
6. Test Cases by Feature (high-level)
7. Acceptance Criteria Mapping
8. Automation Strategy
9. Performance Testing Criteria
10. Security Testing Approach
11. Regression Strategy
12. Defect Management Process`,

  quality_review: `Generate a Quality Review / Release Readiness Report:
1. Test Execution Summary
2. Defect Summary and Trends
3. Requirements Coverage Analysis
4. Performance Test Results
5. Security Test Results
6. Code Quality Metrics
7. Technical Debt Assessment
8. Release Risks
9. Go/No-Go Recommendation
10. Outstanding Items and Mitigations`,

  deployment_plan: `Generate a Deployment Plan including:
1. Deployment Strategy (blue-green, canary, rolling)
2. Environment Architecture (dev, test, staging, prod)
3. Pre-Deployment Checklist
4. Deployment Steps (detailed, sequential)
5. Configuration Management
6. Database Migration Plan
7. Rollback Procedure
8. Health Check Criteria
9. Monitoring and Alerting Setup
10. Post-Deployment Verification
11. Communication Plan
12. Change Management Requirements`,
};

export interface ChatResponse {
  content: string;
  metadata?: {
    artifactType?: ArtifactType;
    confidenceScore?: number;
    isArtifact?: boolean;
  };
}

/** Returns a streaming Response body from the AI provider (raw SSE from OpenAI format). */
export async function streamChatResponse(
  messages: { role: string; content: string }[],
  projectContext?: string
): Promise<ReadableStream<Uint8Array> | null> {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";
  const openaiKey = process.env.OPENAI_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;
  const githubModel = process.env.GITHUB_MODEL || "openai/gpt-4o";

  const useAzure = !!(azureEndpoint && azureKey && azureDeployment);
  const useGitHub = !useAzure && !!githubToken;
  const useOpenAI = !useAzure && !useGitHub && !!openaiKey;

  if (!useAzure && !useGitHub && !useOpenAI) return null;

  const systemMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(projectContext
      ? [{ role: "system", content: `Project Context:\n${projectContext}` }]
      : []),
  ];

  let url: string;
  let authHeaders: Record<string, string>;
  let model: string | undefined;

  if (useAzure) {
    const base = azureEndpoint!.replace(/\/$/, "");
    url = `${base}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`;
    authHeaders = { "api-key": azureKey! };
    model = undefined;
  } else if (useGitHub) {
    url = "https://models.inference.ai.azure.com/chat/completions";
    authHeaders = { Authorization: `Bearer ${githubToken}` };
    model = githubModel;
  } else {
    url = "https://api.openai.com/v1/chat/completions";
    authHeaders = { Authorization: `Bearer ${openaiKey}` };
    model = "gpt-4o";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({
      ...(model ? { model } : {}),
      messages: [...systemMessages, ...messages],
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) return null;
  return response.body;
}

export async function generateChatResponse(
  messages: { role: string; content: string }[],
  projectContext?: string
): Promise<ChatResponse> {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";
  const openaiKey = process.env.OPENAI_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;
  const githubModel = process.env.GITHUB_MODEL || "openai/gpt-4o";

  const useAzure = !!(azureEndpoint && azureKey && azureDeployment);
  const useGitHub = !useAzure && !!githubToken;
  const useOpenAI = !useAzure && !useGitHub && !!openaiKey;

  if (!useAzure && !useGitHub && !useOpenAI) {
    return generateMockResponse(messages);
  }

  const systemMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(projectContext
      ? [{ role: "system", content: `Project Context:\n${projectContext}` }]
      : []),
  ];

  let url: string;
  let authHeaders: Record<string, string>;
  let model: string | undefined;

  if (useAzure) {
    // Azure OpenAI — deployment name is in the URL, not the body
    const base = azureEndpoint!.replace(/\/$/, "");
    url = `${base}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`;
    authHeaders = { "api-key": azureKey! };
    model = undefined;
  } else if (useGitHub) {
    // GitHub Models — OpenAI-compatible, auth via GitHub PAT
    // https://docs.github.com/en/github-models
    url = "https://models.inference.ai.azure.com/chat/completions";
    authHeaders = { Authorization: `Bearer ${githubToken}` };
    model = githubModel;
  } else {
    // Standard OpenAI
    url = "https://api.openai.com/v1/chat/completions";
    authHeaders = { Authorization: `Bearer ${openaiKey}` };
    model = "gpt-4o";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      ...(model ? { model } : {}),
      messages: [...systemMessages, ...messages],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`AI API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
  };
}

export async function generateArtifact(
  type: ArtifactType,
  projectContext: string,
  additionalContext?: string
): Promise<ChatResponse> {
  const prompt = ARTIFACT_PROMPTS[type];
  const apiKey = process.env.OPENAI_API_KEY;

  const messages = [
    {
      role: "user" as const,
      content: `${prompt}\n\nProject Context:\n${projectContext}${
        additionalContext ? `\n\nAdditional Context:\n${additionalContext}` : ""
      }`,
    },
  ];

  if (!apiKey) {
    return generateMockArtifact(type, projectContext);
  }

  const response = await generateChatResponse(messages, projectContext);
  return {
    ...response,
    metadata: {
      artifactType: type,
      confidenceScore: 0.85,
      isArtifact: true,
    },
  };
}

function generateMockResponse(
  messages: { role: string; content: string }[]
): ChatResponse {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";

  if (lastMessage.includes("generate") || lastMessage.includes("create")) {
    return {
      content: `I'd be happy to help generate that artifact. To create the best possible document, I have a few clarifying questions:

1. **Target Audience**: Who is the primary audience for this document?
2. **Scope**: Are there any specific areas you'd like me to focus on or exclude?
3. **Constraints**: Are there known technical constraints or regulatory requirements?
4. **Timeline**: What's the expected timeline for this project?

Please provide any additional context, and I'll generate a comprehensive artifact for you.`,
    };
  }

  return {
    content: `Thank you for that information. I've noted the details and can incorporate them into the documentation.

Here's what I understand so far. Let me know if I should adjust anything:

- I'll use the context you've provided to ensure accuracy
- The artifact will follow enterprise documentation standards
- I'll flag any gaps or areas needing clarification

Would you like me to proceed with generating the artifact, or do you have additional context to share?`,
  };
}

function generateMockArtifact(
  type: ArtifactType,
  projectContext: string
): ChatResponse {
  const projectName = projectContext.split("\n")[0] || "Project";
  const templates: Record<string, string> = {
    prd: `# Product Requirements Document

## 1. Executive Summary
This document outlines the product requirements for ${projectName}. It defines the functional and non-functional requirements, user stories, and acceptance criteria needed for successful delivery.

## 2. Problem Statement
Based on the provided context, the key problem being addressed involves streamlining enterprise workflows and improving team collaboration across the software development lifecycle.

## 3. Goals and Objectives
- **Primary Goal**: Deliver a platform that reduces documentation overhead by 40%
- **Secondary Goal**: Improve cross-team visibility into project status
- **Tertiary Goal**: Enforce governance and compliance throughout the SDLC

## 4. Target Users / Personas
- **Product Managers**: Create and manage requirements documentation
- **Security Leads**: Conduct risk assessments and threat modeling
- **Compliance Officers**: Ensure regulatory adherence
- **QA Leads**: Define testing strategies and quality gates
- **Infrastructure Leads**: Plan and execute deployments
- **Engineering Teams**: Implement features based on approved requirements
- **Executive Stakeholders**: Monitor project progress and readiness

## 5. Functional Requirements

### FR-1: Project Management
- FR-1.1: Users shall be able to create new projects with metadata
- FR-1.2: Users shall be able to upload supporting documents
- FR-1.3: Users shall be able to view project status and progress

### FR-2: AI-Assisted Documentation
- FR-2.1: System shall generate structured artifact drafts using AI
- FR-2.2: System shall ask clarifying questions to improve completeness
- FR-2.3: System shall provide confidence scores for generated content

### FR-3: Approval Workflow
- FR-3.1: Each artifact shall require explicit human approval
- FR-3.2: System shall enforce approval SLAs (48-hour window)
- FR-3.3: System shall support rejection with feedback

### FR-4: Progress Tracking
- FR-4.1: Visual progress tracker showing all artifact states
- FR-4.2: Real-time status updates across all phases
- FR-4.3: Dependency visualization between artifacts

## 6. Non-Functional Requirements
- **Performance**: Page load times under 2 seconds
- **Scalability**: Support 100+ concurrent users
- **Security**: Role-based access control, encrypted storage
- **Availability**: 99.9% uptime SLA
- **Audit**: Complete audit trail for all actions

## 7. User Stories
- As a Product Manager, I want to generate a PRD using AI so that I can reduce documentation time
- As a Security Lead, I want to review risk analysis artifacts so that I can identify threats early
- As an Executive, I want to view project progress so that I can make informed decisions

## 8. Acceptance Criteria
- AI generates artifacts within 30 seconds
- All artifacts follow enterprise templates
- Approval workflow prevents progression without sign-off

## 9. Dependencies and Assumptions
- OpenAI API availability for AI generation
- Enterprise SSO integration for authentication
- Team members available for approval workflows

## 10. Out of Scope
- Real-time collaborative editing
- Backlog or sprint management
- CI/CD pipeline execution

## 11. Success Metrics
- 40% reduction in documentation creation time
- 90%+ artifact acceptance rate on first generation
- 3+ enterprise organizations adopted within 6 months

## 12. Timeline Considerations
- Phase 1: PRD generation and approval (8 weeks)
- Phase 2: Risk, compliance, QA artifacts (6 weeks)
- Phase 3: Enterprise integrations (6 weeks)
- Phase 4: Analytics and insights (4 weeks)`,

    cyber_risk_analysis: `# Cyber Risk Analysis

## 1. Threat Model (STRIDE Analysis)

### Spoofing
- Risk: Unauthorized users impersonating team members
- Mitigation: Implement enterprise SSO with MFA

### Tampering
- Risk: Unauthorized modification of approved artifacts
- Mitigation: Version control, audit trails, digital signatures

### Repudiation
- Risk: Users denying approval actions
- Mitigation: Complete audit logging with timestamps

### Information Disclosure
- Risk: Sensitive project data exposure
- Mitigation: Encryption at rest and in transit, RBAC

### Denial of Service
- Risk: Platform unavailability during critical reviews
- Mitigation: Rate limiting, horizontal scaling, CDN

### Elevation of Privilege
- Risk: Users gaining unauthorized approval rights
- Mitigation: Strict RBAC, principle of least privilege

## 2. Risk Severity Matrix
| Risk | Likelihood | Impact | Severity |
|------|-----------|--------|----------|
| Data breach | Medium | High | High |
| Auth bypass | Low | Critical | High |
| API abuse | Medium | Medium | Medium |
| XSS attacks | Medium | Medium | Medium |

## 3. Mitigation Strategies (Prioritized)
1. Implement comprehensive authentication and authorization
2. Enable encryption for all data at rest and in transit
3. Deploy Web Application Firewall (WAF)
4. Implement input validation and output encoding
5. Set up security monitoring and alerting`,

    compliance_report: `# Compliance Report

## 1. Regulatory Framework Applicability
- SOC 2 Type II: Applicable for enterprise SaaS
- GDPR: Applicable if processing EU user data
- HIPAA: Conditional based on healthcare clients

## 2. Data Privacy Assessment
- User data collected: names, emails, roles
- Project data: documentation artifacts, attachments
- Recommendation: Implement data minimization principles

## 3. Audit Trail Requirements
- All CRUD operations must be logged
- Approval actions require non-repudiation
- Logs retained for minimum 7 years

## 4. Access Control Requirements
- Role-based access control (RBAC)
- Principle of least privilege
- Regular access reviews (quarterly)

## 5. Compliance Status: REVIEW REQUIRED`,

    test_plan: `# Test Plan

## 1. Test Strategy
Comprehensive testing covering unit, integration, E2E, performance, and security testing.

## 2. Test Scope
- In Scope: All user-facing features, API endpoints, AI generation
- Out of Scope: Third-party service internal testing

## 3. Test Types
- Unit Tests: 80% code coverage target
- Integration Tests: API and database layer
- E2E Tests: Critical user workflows
- Performance: Load testing up to 500 concurrent users
- Security: OWASP Top 10 validation

## 4. Test Cases
| ID | Feature | Test Case | Priority |
|----|---------|-----------|----------|
| TC-1 | Project Creation | Create project with valid data | High |
| TC-2 | Document Upload | Upload PDF document | High |
| TC-3 | AI Generation | Generate PRD from context | Critical |
| TC-4 | Approval | Approve artifact | Critical |
| TC-5 | Rejection | Reject and revise artifact | High |`,
  };

  const content =
    templates[type] ||
    `# ${type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}

## Generated Artifact

This is a draft artifact generated based on the project context for ${projectName}.

### Key Sections
1. Overview and scope
2. Detailed analysis
3. Recommendations
4. Action items

*This artifact requires human review and approval before progression.*

---
**Confidence Score**: 0.78
**Generated**: ${new Date().toISOString()}`;

  return {
    content,
    metadata: {
      artifactType: type,
      confidenceScore: 0.82,
      isArtifact: true,
    },
  };
}
