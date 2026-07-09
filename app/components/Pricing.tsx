"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/app/libs/amplitude";
import type { VisualizerPlan } from "@/app/libs/visualizer/plans";

type PricingPlan = {
  name: string;
  plan: string;
  planKey: VisualizerPlan;
  description: string;
  originalPrice: string;
  price: string;
  cta: string;
  badge?: string;
  highlighted?: boolean;
  features: string[];
};

const plans: PricingPlan[] = [
  {
    name: "10 Visualizations",
    plan: "10 visualizations",
    planKey: "ten",
    description: "Best for testing a few goal scenarios or comparing several body-shape variations.",
    originalPrice: "$9",
    price: "$6",
    cta: "Get 10 Visualizations",
    features: [
      "10 AI body visualizations",
      "Upload an image and adjust target stats",
      "Tweak body fat, muscle mass, and weight loss",
      "Save previews for progress planning",
    ],
  },
  {
    name: "Unlimited Access",
    plan: "unlimited",
    planKey: "unlimited",
    description: "Best for ongoing progress tracking, coaching, or experimenting with many what-if scenarios.",
    originalPrice: "$24",
    price: "$15",
    cta: "Get Unlimited Access",
    badge: "Best Value",
    highlighted: true,
    features: [
      "Unlimited AI body visualizations",
      "Create as many body-shape scenarios as you want",
      "Compare body fat, muscle mass, and weight-loss scenarios",
      "Use for long-term goal and progress planning",
    ],
  },
];

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<VisualizerPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handleCheckout(planKey: VisualizerPlan, planName: string) {
    setCheckoutError(null);
    setLoadingPlan(planKey);
    trackEvent("Visualizer Checkout Start", {
      plan: planName,
    });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout");
      }

      window.location.href = data.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout";
      setCheckoutError(message);
      trackEvent("Visualizer Checkout Error", {
        plan: planName,
        error: message.slice(0, 200),
      });
      setLoadingPlan(null);
    }
  }

  return (
    <div className="flex w-full items-center justify-center">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 px-6 py-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={[
              "card relative w-full overflow-visible border bg-base-100 shadow-xl",
              plan.highlighted ? "border-[#00AA6E]" : "border-gray-200",
            ].join(" ")}
          >
            {plan.badge ? (
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-base-100 px-2">
                <span className="badge border-0 bg-[#00AA6E] px-3 py-3 text-white">
                  {plan.badge}
                </span>
              </div>
            ) : null}

            <div className={["card-body", plan.badge ? "pt-8" : ""].join(" ")}>
              <div className="flex flex-col items-center gap-3 text-center">
                <h2 className="card-title justify-center text-3xl font-bold">
                  {plan.name}
                </h2>
                <p className="max-w-sm text-base leading-relaxed text-gray-600">
                  {plan.description}
                </p>
              </div>

              <div className="mt-6 flex items-end justify-center gap-2">
                <span className="mb-1 text-lg text-gray-500 line-through">
                  {plan.originalPrice}
                </span>
                <span className="text-5xl font-extrabold">{plan.price}</span>
                <span className="mb-2 text-xs text-gray-500">USD</span>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start text-left text-gray-600">
                    <CheckCircle2 className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-[#00AA6E]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="card-actions mt-8">
                <button
                  type="button"
                  onClick={() => handleCheckout(plan.planKey, plan.plan)}
                  className="btn btn-primary w-full text-lg text-white"
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === plan.planKey ? "Opening checkout..." : plan.cta}
                </button>
                <p className="mt-2 w-full text-center text-sm text-gray-500">
                  🔒 100% money-back guarantee
                </p>
              </div>
            </div>
          </article>
        ))}
        {checkoutError ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 lg:col-span-2">
            {checkoutError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
