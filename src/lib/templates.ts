/**
 * Document type templates — expected sections for each artifact type.
 * Used by the structure parser and rule engine to score structural quality.
 */
import { DocumentType } from "@/types";

export interface SectionTemplate {
  name: string;
  required: boolean;
  patterns: RegExp[];
}

export const DOCUMENT_TEMPLATES: Record<DocumentType, SectionTemplate[]> = {
  vision_document: [
    { name: "Executive Summary", required: true, patterns: [/executive\s*summary/i] },
    { name: "Problem Statement", required: true, patterns: [/problem\s*statement/i] },
    { name: "Vision Statement", required: true, patterns: [/vision\s*statement/i, /vision\b/i] },
    { name: "Business Goals", required: true, patterns: [/business\s*goal/i, /goal/i] },
    { name: "Success Metrics", required: true, patterns: [/success\s*metric/i, /kpi/i, /metric/i] },
    { name: "Stakeholders", required: true, patterns: [/stakeholder/i] },
    { name: "Target Users", required: true, patterns: [/target\s*user/i, /persona/i, /audience/i] },
    { name: "High-Level Requirements", required: false, patterns: [/high.level\s*requirement/i, /requirement/i] },
    { name: "Assumptions and Constraints", required: false, patterns: [/assumption/i, /constraint/i] },
    { name: "Glossary", required: false, patterns: [/glossary/i, /definition/i, /terminology/i] },
  ],

  prd: [
    { name: "Executive Summary", required: true, patterns: [/executive\s*summary/i] },
    { name: "Problem Statement", required: true, patterns: [/problem\s*statement/i] },
    { name: "Goals and Objectives", required: true, patterns: [/goal/i, /objective/i] },
    { name: "Target Users / Personas", required: true, patterns: [/target\s*user/i, /persona/i] },
    { name: "Functional Requirements", required: true, patterns: [/functional\s*requirement/i] },
    { name: "Non-Functional Requirements", required: true, patterns: [/non.functional/i, /nfr/i] },
    { name: "User Stories", required: true, patterns: [/user\s*stor/i, /use\s*case/i] },
    { name: "Acceptance Criteria", required: true, patterns: [/acceptance\s*criter/i] },
    { name: "Dependencies and Assumptions", required: false, patterns: [/dependenc/i, /assumption/i] },
    { name: "Out of Scope", required: false, patterns: [/out\s*of\s*scope/i, /exclusion/i] },
    { name: "Success Metrics", required: false, patterns: [/success\s*metric/i, /kpi/i] },
    { name: "Timeline", required: false, patterns: [/timeline/i, /milestone/i, /schedule/i] },
    { name: "Glossary", required: false, patterns: [/glossary/i] },
  ],

  srs: [
    { name: "Introduction", required: true, patterns: [/introduction/i, /purpose/i] },
    { name: "System Overview", required: true, patterns: [/system\s*overview/i, /scope/i] },
    { name: "Functional Requirements", required: true, patterns: [/functional\s*requirement/i] },
    { name: "Non-Functional Requirements", required: true, patterns: [/non.functional/i, /nfr/i] },
    { name: "Interface Requirements", required: true, patterns: [/interface\s*requirement/i, /external\s*interface/i] },
    { name: "Data Requirements", required: true, patterns: [/data\s*requirement/i, /data\s*model/i] },
    { name: "Security Requirements", required: true, patterns: [/security\s*requirement/i, /security/i] },
    { name: "Performance Requirements", required: true, patterns: [/performance/i] },
    { name: "Design Constraints", required: false, patterns: [/design\s*constraint/i, /constraint/i] },
    { name: "Traceability Matrix", required: false, patterns: [/traceability/i, /trace\s*matrix/i] },
    { name: "Glossary", required: false, patterns: [/glossary/i] },
  ],

  sad: [
    { name: "Executive Summary", required: true, patterns: [/executive\s*summary/i] },
    { name: "Business Context", required: true, patterns: [/business\s*context/i, /business\s*driver/i] },
    { name: "System Context Diagram", required: true, patterns: [/system\s*context/i, /context\s*diagram/i] },
    { name: "Component Architecture", required: true, patterns: [/component/i, /logical\s*architecture/i] },
    { name: "Data Architecture", required: true, patterns: [/data\s*architecture/i, /data\s*model/i, /data\s*flow/i] },
    { name: "Integration Architecture", required: true, patterns: [/integration/i, /interface/i, /api/i] },
    { name: "Security Architecture", required: true, patterns: [/security\s*architecture/i, /security\s*design/i, /security/i] },
    { name: "Deployment Architecture", required: true, patterns: [/deployment/i, /infrastructure/i] },
    { name: "Operational Design", required: true, patterns: [/operational/i, /monitoring/i, /observability/i] },
    { name: "Architecture Decision Records", required: false, patterns: [/architecture\s*decision/i, /adr/i, /decision\s*record/i] },
    { name: "Glossary", required: false, patterns: [/glossary/i] },
  ],

  other: [
    { name: "Introduction", required: true, patterns: [/introduction/i, /overview/i, /executive\s*summary/i] },
    { name: "Main Content", required: true, patterns: [/./] },
    { name: "Conclusion", required: false, patterns: [/conclusion/i, /summary/i, /recommendation/i] },
  ],
};
