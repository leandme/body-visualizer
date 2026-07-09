export type VisualizerPlan = "ten" | "unlimited";

export type VisualizerAccess = {
  plan: VisualizerPlan;
  unlimited: boolean;
  credits: number | null;
  sessionId: string;
};

export const VISUALIZER_PLAN_CONFIG: Record<
  VisualizerPlan,
  {
    name: string;
    localStorageLabel: string;
    envVar: "STRIPE_PRICE_10_VISUALIZATIONS" | "STRIPE_PRICE_UNLIMITED";
    credits: number | null;
  }
> = {
  ten: {
    name: "10 Visualizations",
    localStorageLabel: "10 visualizations",
    envVar: "STRIPE_PRICE_10_VISUALIZATIONS",
    credits: 10,
  },
  unlimited: {
    name: "Unlimited Access",
    localStorageLabel: "unlimited",
    envVar: "STRIPE_PRICE_UNLIMITED",
    credits: null,
  },
};

export function isVisualizerPlan(plan: unknown): plan is VisualizerPlan {
  return plan === "ten" || plan === "unlimited";
}

export function getVisualizerPlanFromPriceId(priceId: string | null | undefined) {
  if (!priceId) return null;

  if (priceId === process.env.STRIPE_PRICE_10_VISUALIZATIONS) return "ten";
  if (priceId === process.env.STRIPE_PRICE_UNLIMITED) return "unlimited";

  return null;
}
