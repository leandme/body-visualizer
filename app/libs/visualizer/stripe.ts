import {
  getVisualizerPlanFromPriceId,
  isVisualizerPlan,
  VISUALIZER_PLAN_CONFIG,
  type VisualizerAccess,
  type VisualizerPlan,
} from "./plans";
import { SITE_URL } from "@/app/seo";

type StripeCheckoutSession = {
  id: string;
  payment_status?: string;
  metadata?: Record<string, string>;
  line_items?: {
    data?: Array<{
      price?: {
        id?: string;
      };
    }>;
  };
};

function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");
  return secretKey;
}

export function getSiteUrl(reqUrl?: string) {
  const requestOrigin = reqUrl ? new URL(reqUrl).origin : null;

  if (requestOrigin && isLocalOrigin(requestOrigin)) {
    return requestOrigin;
  }

  const configuredUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (configuredUrl) return configuredUrl;
  if (requestOrigin) return normalizeSiteUrl(requestOrigin) ?? requestOrigin;

  return SITE_URL;
}

function normalizeSiteUrl(value?: string | null) {
  if (!value) return null;

  const parsed = new URL(value.replace(/\/$/, ""));
  if (parsed.hostname === "bodyvisualizer.ai" || parsed.hostname === "www.bodyvisualizer.ai") {
    return SITE_URL;
  }

  return parsed.origin;
}

function isLocalOrigin(origin: string) {
  const hostname = new URL(origin).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getPlanPriceId(plan: VisualizerPlan) {
  const priceId = process.env[VISUALIZER_PLAN_CONFIG[plan].envVar];
  if (!priceId) throw new Error(`Missing ${VISUALIZER_PLAN_CONFIG[plan].envVar}`);
  return priceId;
}

export async function createVisualizerCheckoutSession({
  plan,
  siteUrl,
}: {
  plan: VisualizerPlan;
  siteUrl: string;
}) {
  const priceId = getPlanPriceId(plan);
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("line_items[0][price]", priceId);
  body.set("line_items[0][quantity]", "1");
  body.set("success_url", `${siteUrl}/visualizer?session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${siteUrl}/pricing`);
  body.set("metadata[plan]", plan);
  body.set("allow_promotion_codes", "true");

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const session = await response.json();
  if (!response.ok) {
    throw new Error(session?.error?.message || "Stripe checkout failed");
  }

  return session as { id: string; url?: string };
}

export async function getVisualizerAccessFromSession(sessionId: string): Promise<VisualizerAccess> {
  const params = new URLSearchParams();
  params.append("expand[]", "line_items.data.price");

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?${params}`,
    {
      headers: {
        Authorization: `Bearer ${getStripeSecretKey()}`,
      },
      cache: "no-store",
    }
  );

  const session = (await response.json()) as StripeCheckoutSession & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(session?.error?.message || "Stripe session lookup failed");
  }

  if (session.payment_status !== "paid") {
    throw new Error("Stripe session is not paid");
  }

  const metadataPlan = session.metadata?.plan;
  const priceId = session.line_items?.data?.[0]?.price?.id ?? null;
  const pricePlan = getVisualizerPlanFromPriceId(priceId);
  const plan = isVisualizerPlan(metadataPlan) ? metadataPlan : pricePlan;

  if (!plan) {
    throw new Error("Unable to infer visualizer plan from Stripe session");
  }

  return {
    plan,
    unlimited: plan === "unlimited",
    credits: VISUALIZER_PLAN_CONFIG[plan].credits,
    sessionId: session.id,
  };
}
