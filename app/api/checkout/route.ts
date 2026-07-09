import { NextRequest, NextResponse } from "next/server";
import { isVisualizerPlan } from "@/app/libs/visualizer/plans";
import { createVisualizerCheckoutSession, getSiteUrl } from "@/app/libs/visualizer/stripe";

type ReqBody = {
  plan?: unknown;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ReqBody;
    const { plan } = body;

    if (!isVisualizerPlan(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const session = await createVisualizerCheckoutSession({
      plan,
      siteUrl: getSiteUrl(req.url),
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 502 });
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    console.error("Visualizer checkout failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
