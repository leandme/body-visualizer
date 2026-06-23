import { Metadata } from "next";
import FaqSection from "@/app/components/FaqSection";

export const metadata: Metadata = {
  title: "Contact - BodyVisualizer",
  description:
    "Contact BodyVisualizer support for questions about AI body visualization, photo uploads, privacy, accuracy, or feedback.",
};

const CONTACT_FAQS = [
  {
    question: "What should I include in a support email?",
    answer:
      "Include what you were trying to do, the device and browser you used, and a screenshot if something looked wrong. That usually lets us help faster.",
  },
  {
    question: "Can I ask about body visualization accuracy?",
    answer:
      "Yes. Share the scenario you were testing, such as body fat percentage, BMI, weight, or measurement changes, and we can help interpret what the tool is showing.",
  },
  {
    question: "Can I send feedback or feature requests?",
    answer:
      "Yes. Feedback about photo uploads, sliders, presets, model views, or export snapshots is welcome.",
  },
  {
    question: "Can I ask about privacy?",
    answer:
      "Yes. Email us with any questions about uploaded images, analytics, data retention, or deletion requests.",
  },
];

export default function ContactPage() {
  return (
    <main className="bg-base-100">
      <section className="mx-auto max-w-5xl px-6 mt-10 text-center">
        <h1 className="text-4xl lg:text-5xl font-bold">Contact</h1>

        <p className="mt-4 text-lg text-gray-700 max-w-2xl mx-auto">
          Questions about BodyVisualizer, photo uploads, body-shape previews, accuracy, or privacy? Email us and we will get back to you as soon as we can.
        </p>

        <div className="mt-8 flex justify-center">
          <a
            href="mailto:matt@leandme.com"
            className="btn btn-primary btn-lg text-white"
          >
            Email Support
          </a>
        </div>
      </section>

      <FaqSection
        id="contact-faq"
        accordionName="contact-faq-accordion"
        heading="Contact FAQs"
        items={CONTACT_FAQS}
        className="mt-20 pb-20"
      />
    </main>
  );
}
