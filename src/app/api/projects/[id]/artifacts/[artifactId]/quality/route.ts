import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ArtifactType } from "@/types";
import { evaluateArtifactQuality } from "@/lib/artifactChecks";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; artifactId: string }> }
) {
  const { artifactId } = await params;

  const artifact = await prisma.artifact.findUnique({
    where: { id: artifactId },
  });

  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const quality = evaluateArtifactQuality(
    artifact.type as ArtifactType,
    artifact.content
  );

  return NextResponse.json(quality);
}
