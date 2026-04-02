const base = process.env.BASE_URL || "http://localhost:3001";

function timeoutSignal(ms) {
  return AbortSignal.timeout(ms);
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: timeoutSignal(180000),
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { res, data };
}

async function postAutofill(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: timeoutSignal(180000),
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { res, data };
  }

  if (!contentType.includes("text/event-stream") || !res.body) {
    return { res, data: null };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let donePayload = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload);
        if (parsed.done) {
          donePayload = parsed;
          break;
        }
      } catch {
        // ignore non-json payload chunks
      }
    }
    if (donePayload) break;
  }

  return { res, data: donePayload };
}

async function putJson(url, body) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    signal: timeoutSignal(180000),
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { res, data };
}

async function run() {
  const createProject = await postJson(`${base}/api/projects`, {
    name: `Autofill PRD Smoke ${Date.now()}`,
    description: "Validate deterministic PRD autofill enrichment",
  });

  if (!createProject.res.ok || !createProject.data?.id) {
    console.log(JSON.stringify({
      ok: false,
      step: "create-project",
      status: createProject.res.status,
      response: createProject.data,
    }, null, 2));
    process.exit(1);
  }

  const projectId = createProject.data.id;

  const createArtifact = await postJson(`${base}/api/projects/${projectId}/artifacts`, { type: "prd" });
  if (!createArtifact.res.ok || !createArtifact.data?.id) {
    console.log(JSON.stringify({
      ok: false,
      step: "create-artifact",
      status: createArtifact.res.status,
      projectId,
      response: createArtifact.data,
    }, null, 2));
    process.exit(1);
  }

  const artifactId = createArtifact.data.id;

  const seededPrd = [
    "<h1>Product Requirements Document</h1>",
    "<h2>Revision History</h2>",
    "<p>[To be confirmed — add first revision entry]</p>",
    "<h2>Acceptance Criteria</h2>",
    "<p>[To be confirmed — measurable acceptance criteria]</p>",
    "<h2>Traceability Matrix</h2>",
    "<p>[To be confirmed — requirement to design and test mapping]</p>",
    "<h2>Open Questions</h2>",
    "<ul><li>[To be confirmed — ownership model]</li><li>[To be confirmed — compliance validation approach]</li></ul>",
  ].join("\n");

  const seed = await putJson(`${base}/api/projects/${projectId}/artifacts?artifactId=${artifactId}`, {
    content: seededPrd,
    title: "Product Requirements Document",
  });

  if (!seed.res.ok) {
    console.log(JSON.stringify({
      ok: false,
      step: "seed-artifact",
      status: seed.res.status,
      projectId,
      artifactId,
      response: seed.data,
    }, null, 2));
    process.exit(1);
  }

  const autofill = await postAutofill(`${base}/api/projects/${projectId}/chat`, {
    artifactId,
    autofillArtifact: true,
  });

  const updated = autofill.data?.updatedArtifact || null;
  const content = String(updated?.content || "");

  const result = {
    ok: autofill.res.ok,
    step: "autofill",
    status: autofill.res.status,
    projectId,
    artifactId,
    updatedArtifactId: updated?.id || null,
    confidenceScore: typeof updated?.confidenceScore === "number" ? updated.confidenceScore : null,
    checks: {
      hasTraceabilityHeading: /Traceability Matrix/i.test(content),
      hasTraceabilityReqRows: /REQ-001|REQ-002/i.test(content),
      hasAcceptanceCriteriaHeading: /Acceptance Criteria/i.test(content),
      hasDecisionLog: /Decision Log/i.test(content),
      hasRevisionHistory: /Revision History/i.test(content),
      hasAutofillRevisionEntry: /Autofill best-practice completion for previously open items/i.test(content),
      hasGroundingAttribution: /Grounding and Sources|Source Attribution|Grounding References/i.test(content),
      referencesSkillsOrTemplates: /Skills\/Templates\/Prompts/i.test(content),
      referencesDocsOrProject: /Uploaded Project Documents|Project Metadata/i.test(content),
      confidenceAtLeast90: typeof updated?.confidenceScore === "number" ? updated.confidenceScore >= 0.9 : false,
      noToBeConfirmedMarkers: !/\[\s*To be confirmed/i.test(content),
    },
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.ok || !updated?.id) process.exit(1);
}

run().catch((error) => {
  console.error(JSON.stringify({ ok: false, step: "unhandled", error: String(error) }, null, 2));
  process.exit(1);
});
