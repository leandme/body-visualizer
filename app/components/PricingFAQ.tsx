const pricingFaqs = [
  {
    question: "Which Body Visualizer plan should I choose?",
    answer:
      "Choose 10 Visualizations if you only want to test a few body-shape scenarios. Choose Unlimited Access if you want to experiment freely, compare many targets, or use Body Visualizer regularly over time.",
  },
  {
    question: "What counts as a visualization?",
    answer:
      "A visualization is one generated body-shape preview based on your uploaded image and adjusted stats, such as body fat percentage, BMI, weight, height, or measurements.",
  },
  {
    question: "Does Unlimited Access include future visualizations?",
    answer:
      "Yes. Unlimited Access is intended for ongoing use, so you can keep generating and comparing body visualizations without worrying about a 10-use limit.",
  },
  {
    question: "Can I change my body fat percentage, BMI, and weight after purchase?",
    answer:
      "Yes. The point of Body Visualizer is to let you tweak those values and compare different scenarios, so you can keep adjusting the inputs for each visualization.",
  },
  {
    question: "Is this a subscription?",
    answer:
      "No. These are one-time purchases. The 10 Visualization plan gives you 10 uses, and Unlimited Access gives you ongoing access without a recurring monthly bill.",
  },
  {
    question: "Can I get a refund if I am not satisfied?",
    answer:
      "Yes. If something does not work as expected, contact support within 7 days of purchase and we will help make it right.",
  },
];

export default function PricingFAQ() {
  return (
    <section id="pricing-faq" className="mt-16 mb-20 w-full">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-3xl font-bold lg:text-4xl">
          Pricing FAQs
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-gray-700">
          Questions about Body Visualizer pricing, access, or refunds? Email{" "}
          <a href="mailto:bodyfatestimator@gmail.com" className="text-primary">
            support
          </a>{" "}
          and we will help.
        </p>

        <div className="mt-8 space-y-4">
          {pricingFaqs.map((item) => (
            <div
              key={item.question}
              className="collapse collapse-plus rounded-xl border border-gray-200 bg-base-100"
            >
              <input type="radio" name="pricing-faq-accordion" />
              <div className="collapse-title text-lg font-medium lg:text-xl">
                {item.question}
              </div>
              <div className="collapse-content">
                <p className="text-lg leading-relaxed text-gray-700">
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
