import { NextRequest, NextResponse } from "next/server";
import { getVisualizerAccessFromSession } from "@/app/libs/visualizer/stripe";

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const access = await getVisualizerAccessFromSession(sessionId);
    return NextResponse.json(access);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify access";
    console.error("Visualizer access verification failed:", error);
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
