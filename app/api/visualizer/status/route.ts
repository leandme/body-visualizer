import { NextRequest, NextResponse } from "next/server";

function collectImageUrls(output: unknown): string[] {
  if (typeof output === "string") return [output];

  if (Array.isArray(output)) {
    return output.flatMap((item) => collectImageUrls(item));
  }

  if (output && typeof output === "object") {
    const record = output as Record<string, unknown>;
    return [
      ...collectImageUrls(record.url),
      ...collectImageUrls(record.image),
      ...collectImageUrls(record.images),
      ...collectImageUrls(record.output),
    ];
  }

  return [];
}

export async function GET(req: NextRequest) {
  const getUrl = new URL(req.url).searchParams.get("getUrl");

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
  }

  if (!getUrl) {
    return NextResponse.json({ error: "Missing getUrl" }, { status: 400 });
  }

  try {
    const pollRes = await fetch(getUrl, {
      headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
      cache: "no-store",
    });

    const prediction = await pollRes.json();

    if (!pollRes.ok) {
      return NextResponse.json(
        { error: prediction?.detail || prediction?.error || "Replicate status failed" },
        { status: pollRes.status }
      );
    }

    return NextResponse.json({
      status: prediction.status,
      imageUrls: collectImageUrls(prediction.output),
      error: prediction.error ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to poll visualization";
    console.error("Visualizer status failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
