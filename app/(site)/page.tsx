import { Metadata } from "next";
import { Suspense } from "react";
import BodyVisualizerTool from "../components/BodyVisualizerTool";
import FaqSection, { type FaqSectionItem } from "../components/FaqSection";

const title = "Body Visualizer – BMI, Weight, Height & Shape";
const description =
  "Use an interactive body visualizer to test BMI, weight, height, and body-fat scenarios. Compare fat mass and lean mass outputs with a dynamic body render.";

export const metadata: Metadata = {
  title: title,
  description: description,
};

const BODY_VISUALIZER_STEPS = [
  {
    id: "1",
    title: "Set Your Profile",
    description:
      "Choose male or female mode and switch between imperial or metric units so your inputs match how you track measurements.",
  },
  {
    id: "2",
    title: "Adjust Sliders",
    description:
      "Move body fat %, BMI, height, and weight to test different scenarios. Linked mode syncs sliders, Independent mode gives full manual control.",
  },
  {
    id: "3",
    title: "Review the Snapshot",
    description:
      "Use the 3D model and metric outputs together to compare trend direction across scenarios, not just one single value.",
  },
] as const;

const BODY_VISUALIZER_FAQS: FaqSectionItem[] = [
  {
    question: "What is a body visualizer?",
    answer:
      "A body visualizer is an interactive model that shows how body appearance may shift when you change body fat percentage, BMI, height, and weight assumptions.",
  },
  {
    question: "How is this different from a BMI calculator?",
    answer:
      "A BMI calculator gives only a number. Body Visualizer combines BMI with a dynamic body render and additional composition context so scenario changes are easier to interpret.",
  },
  {
    question: "What is Linked mode vs Independent mode?",
    answer:
      "Linked mode keeps BMI and body-fat sliders synchronized for fast scenario testing. Independent mode lets each slider move separately for manual what-if comparisons.",
  },
  {
    question: "Can I switch between imperial and metric units?",
    answer:
      "Yes. You can toggle between imperial and metric units at any time and continue from the same scenario.",
  },
  {
    question: "Do I need to upload photos to use this tool?",
    answer:
      "No. The Body Visualizer runs from your slider inputs and does not require photo upload.",
  },
  {
    question: "Why can two people with the same BMI look different?",
    answer:
      "BMI uses only height and weight. It does not account for fat distribution, muscle mass, frame size, posture, and other factors that affect how a physique looks.",
  },
  {
    question: "What happens if I increase height while keeping weight the same?",
    answer:
      "BMI decreases because the same body mass is distributed across a taller frame, and the model typically appears leaner in that scenario.",
  },
  {
    question: "Is fat mass the same as body-fat percentage?",
    answer:
      "No. Body-fat percentage is the share of total body weight that is fat. Fat mass is the absolute fat amount in kg or lb.",
  },
  {
    question: "How accurate is Body Visualizer?",
    answer:
      "It is best used as a directional planning and tracking tool, not a medical measurement. It helps compare trends and scenarios rather than predict exact anatomy.",
  },
  {
    question: "Can this replace DEXA, calipers, or clinical assessment?",
    answer:
      "No. Use Body Visualizer for education and planning, then validate with consistent real-world tracking or clinical methods when precision is required.",
  },
  {
    question: "Should I trust BMI or body-fat percentage more for physique tracking?",
    answer:
      "For visual physique tracking, body-fat percentage plus lean and fat mass context is usually more informative than BMI alone. BMI is still useful as a broad screening metric.",
  },
  {
    question: "How should I use this week to week?",
    answer:
      "Keep inputs consistent and compare scenarios every 2-4 weeks. Pair the tool with regular scale weight, waist measurements, and progress photos for better decisions.",
  },
];

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading...</p>
        </div>
      }
    >
      <div className="mx-auto max-w-6xl">
        <section className="mx-auto max-w-4xl pt-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold">Body Visualizer</h1>
          <p className="mt-4 text-lg text-gray-700 leading-relaxed">
            Visualize your body shape with an interactive male or female model based on body fat, BMI, height, and
            weight.
          </p>
        </section>

        <section className="mx-auto max-w-6xl pt-8">
          <BodyVisualizerTool />
        </section>

        <section className="mx-auto max-w-6xl mt-20 lg:mt-28">
          <h2 className="text-3xl lg:text-4xl font-semibold text-center">How to Use Body Visualizer</h2>
          <p className="mt-4 text-center text-lg text-gray-700 max-w-3xl mx-auto">
            Follow these quick steps to run useful body-shape scenarios and interpret the output clearly.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {BODY_VISUALIZER_STEPS.map((step) => (
              <article key={step.id} className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary text-xl font-bold">
                  {step.id}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-center text-gray-900">{step.title}</h3>
                <p className="mt-3 text-lg leading-relaxed text-left text-gray-700">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <FaqSection
          id="body-visualizer-faq"
          heading="Body Visualizer FAQ"
          description="Common questions about body visualizer outputs, slider behavior, and accuracy limits."
          items={BODY_VISUALIZER_FAQS}
          accordionName="body-visualizer-faq-accordion"
          className="mt-20 lg:mt-32 pb-20"
        />
      </div>
    </Suspense>
  );
}
