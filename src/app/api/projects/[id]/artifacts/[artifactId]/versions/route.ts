import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; artifactId: string }> }
) {
  const { artifactId } = await params;

  const versions = await prisma.artifactVersion.findMany({
    where: { artifactId },
    orderBy: { savedAt: "desc" },
  });

  return NextResponse.json({ versions });
}
