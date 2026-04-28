import { Metadata } from "next";
import { Suspense } from "react";
import BodyVisualizerTool from "../components/BodyVisualizerTool";

const title = "Body Fat Visualizer – BMI, Weight, Height & Measurements";
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
      </div>
    </Suspense>
  );
}
