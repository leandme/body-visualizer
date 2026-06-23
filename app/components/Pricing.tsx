import { CheckCircle2 } from "lucide-react";

const checkoutLinks = {
  tenVisualizations: "https://buy.stripe.com/5kQ00j25J1X3clZ2ekfAc0h",
  unlimitedAccess: "https://buy.stripe.com/4gMdR95hVdFL99N2ekfAc0i",
};

const plans = [
  {
    name: "10 Visualizations",
    description: "Best for testing a few goal scenarios or comparing several body-shape variations.",
    originalPrice: "$9",
    price: "$5",
    href: checkoutLinks.tenVisualizations,
    cta: "Get 10 Visualizations",
    features: [
      "10 AI body visualizations",
      "Upload an image and adjust target stats",
      "Tweak body fat percentage, BMI, and weight",
      "Save previews for progress planning",
    ],
  },
  {
    name: "Unlimited Access",
    description: "Best for ongoing progress tracking, coaching, or experimenting with many what-if scenarios.",
    originalPrice: "$24",
    price: "$15",
    href: checkoutLinks.unlimitedAccess,
    cta: "Get Unlimited Access",
    badge: "Best Value",
    highlighted: true,
    features: [
      "Unlimited AI body visualizations",
      "Create as many body-shape scenarios as you want",
      "Compare changes across body fat, BMI, weight, and measurements",
      "Use for long-term goal and progress planning",
    ],
  },
];

export default function Pricing() {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 px-6 py-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={[
              "card w-full border bg-base-100 shadow-xl",
              plan.highlighted ? "border-[#00AA6E]" : "border-gray-200",
            ].join(" ")}
          >
            <div className="card-body">
              <div className="flex flex-col items-center gap-3 text-center">
                {plan.badge ? (
                  <span className="badge border-0 bg-[#00AA6E] px-3 py-3 text-white">
                    {plan.badge}
                  </span>
                ) : null}
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
                <a
                  href={plan.href}
                  className="btn btn-primary w-full text-lg text-white"
                  aria-disabled={plan.href === "#"}
                >
                  {plan.cta}
                </a>
                <p className="mt-2 w-full text-center text-sm text-gray-500">
                  Pay once. No subscription.
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
