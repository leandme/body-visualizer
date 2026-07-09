import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const getUrl = new URL(req.url).searchParams.get("getUrl");

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
  }

  if (!getUrl) {
    return NextResponse.json({ error: "Missing getUrl" }, { status: 400 });
  }

  const pollRes = await fetch(getUrl, {
    headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
    cache: "no-store",
  });

  const pred = await pollRes.json();

  // Normalize output text
  const text =
    Array.isArray(pred.output) ? pred.output.join("") : String(pred.output ?? "");

  // Parse JSON if possible
  let estimate: any = null;
  try {
    estimate = text ? JSON.parse(text) : null;
  } catch {
    estimate = text ? { raw: text } : null;
  }

  return NextResponse.json({
    status: pred.status,          // starting | processing | succeeded | failed | canceled
    estimate,                     // parsed JSON (or {raw})
    error: pred.error ?? null,
  });
}