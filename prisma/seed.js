const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Create users
  const pm = await prisma.user.create({
    data: {
      name: "Sarah Chen",
      email: "sarah@example.com",
      role: "product_manager",
    },
  });

  const dev = await prisma.user.create({
    data: {
      name: "Alex Rivera",
      email: "alex@example.com",
      role: "developer",
    },
  });

  const security = await prisma.user.create({
    data: {
      name: "Jordan Lee",
      email: "jordan@example.com",
      role: "security_analyst",
    },
  });

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      name: "E-Commerce Platform Redesign",
      description:
        "Complete redesign of our e-commerce platform with improved UX, performance optimizations, and new payment integrations.",
      status: "active",
      phase: "requirements",
      ownerId: pm.id,
    },
  });

  // Create a PRD artifact
  const prd = await prisma.artifact.create({
    data: {
      type: "prd",
      title: "Product Requirements Document",
      content: `# Product Requirements Document\n## E-Commerce Platform Redesign\n\n### 1. Executive Summary\nThis document outlines the requirements for the complete redesign of our e-commerce platform, focusing on improved user experience, performance, and new payment integrations.\n\n### 2. Problem Statement\nOur current platform suffers from slow page loads (avg 4.2s), a 68% cart abandonment rate, and limited payment options. Customer satisfaction scores have dropped 15% over the past two quarters.\n\n### 3. Goals & Objectives\n- Reduce page load time to under 2 seconds\n- Decrease cart abandonment rate to below 45%\n- Support 5+ payment methods including digital wallets\n- Improve mobile conversion rate by 30%\n\n### 4. User Stories\n- As a shopper, I want to quickly find products so I can make purchases efficiently\n- As a shopper, I want multiple payment options so I can use my preferred method\n- As an admin, I want real-time analytics so I can optimize the shopping experience\n\n### 5. Technical Requirements\n- Next.js frontend with SSR/SSG\n- Microservices backend architecture\n- Redis caching layer\n- PostgreSQL database\n- Stripe + PayPal integration\n\n### 6. Success Metrics\n| Metric | Current | Target |\n|--------|---------|--------|\n| Page Load | 4.2s | <2s |\n| Cart Abandonment | 68% | <45% |\n| Mobile Conversion | 2.1% | 2.7% |\n| Payment Methods | 2 | 5+ |`,
      status: "approved",
      confidenceScore: 92,
      version: 1,
      projectId: project.id,
      ownerId: pm.id,
    },
  });

  // Create approval for PRD
  await prisma.approval.create({
    data: {
      artifactId: prd.id,
      userId: pm.id,
      status: "approved",
      comment: "Comprehensive and well-structured. Approved.",
    },
  });

  // Create a validation framework artifact
  await prisma.artifact.create({
    data: {
      type: "validation_framework",
      title: "Validation Framework",
      content: `# Validation Framework\n## E-Commerce Platform Redesign\n\n### Validation Approach\nWe will validate the PRD requirements through a multi-phase approach combining user research, technical feasibility analysis, and market benchmarking.\n\n### Key Validation Areas\n1. **Performance Targets**: Load testing with k6 to confirm <2s achievability\n2. **Payment Integration**: Stripe/PayPal sandbox testing\n3. **User Experience**: A/B testing with 500+ users\n4. **Mobile Responsiveness**: Cross-device testing matrix\n\n### Risk Assessment\n- High: Payment gateway migration complexity\n- Medium: Performance targets on legacy infrastructure\n- Low: UI/UX redesign timeline`,
      status: "generated",
      confidenceScore: 85,
      version: 1,
      projectId: project.id,
      ownerId: pm.id,
    },
  });

  // Create some chat messages
  await prisma.chatMessage.create({
    data: {
      projectId: project.id,
      userId: pm.id,
      role: "user",
      content:
        "I need to create a PRD for our e-commerce platform redesign. We want to improve performance and add new payment methods.",
    },
  });

  await prisma.chatMessage.create({
    data: {
      projectId: project.id,
      role: "assistant",
      content:
        "I'd be happy to help you create a comprehensive PRD for the e-commerce platform redesign! I've analyzed your requirements and generated a detailed Product Requirements Document covering the executive summary, problem statement, goals, user stories, technical requirements, and success metrics. You can review it in the Artifacts section. Would you like me to refine any specific section?",
    },
  });

  // Create a second project
  await prisma.project.create({
    data: {
      name: "Mobile Banking App",
      description:
        "New mobile banking application with biometric authentication, real-time notifications, and budget tracking features.",
      status: "active",
      phase: "initiation",
      ownerId: dev.id,
    },
  });

  // Create a third project
  await prisma.project.create({
    data: {
      name: "Healthcare Data Platform",
      description:
        "HIPAA-compliant data platform for healthcare analytics with role-based access control and audit logging.",
      status: "active",
      phase: "initiation",
      ownerId: security.id,
    },
  });

  console.log("Seed data created successfully!");
  console.log(`  - 3 users created`);
  console.log(`  - 3 projects created`);
  console.log(`  - 2 artifacts created (1 approved)`);
  console.log(`  - 2 chat messages created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
