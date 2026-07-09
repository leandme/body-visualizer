import { Metadata } from "next";
import { canonicalUrl } from "../../seo";

const title = "About";
const description =
  "Learn what Body Visualizer is, how the AI body visualization workflow works, key limitations, and how to use it responsibly.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: canonicalUrl("/about"),
  },
};

export default function AboutPage() {
  return (
    <div className="hero min-h-screen flex mt-10 items-center justify-center">
      <div className="flex flex-col items-center gap-10 px-4">
        <h1 className="text-4xl lg:text-5xl font-bold text-center">About</h1>

        <div className="prose prose-invert max-w-3xl text-center lg:text-left">
          <p className="text-lg">
            Body Visualizer is an AI body visualization tool designed to help people explore how body fat percentage,
            BMI, height, weight, and measurements can change overall body appearance. The goal is simple: make
            body-composition context easier to understand and easier to use.
          </p>

          <h2>Why this tool exists</h2>
          <p className="text-lg">
            Numbers like BMI, weight, and body-fat percentage are useful, but they can feel abstract in isolation.
            Body Visualizer exists to turn those metrics into a visual model so scenario planning and progress reviews
            become more intuitive.
          </p>

          <h2>How it works (high level)</h2>
          <p className="text-lg">
            The intended workflow starts with a clear full-body photo, then lets you adjust body fat percentage, BMI,
            height, weight, and measurements. As you change those inputs, the preview and derived metrics update so you
            can compare scenarios.
          </p>
          <p className="text-lg">
            You can switch between male and female profiles, imperial and metric units, plus linked or independent
            controls depending on how you want to test changes.
          </p>

          <h2>Accuracy and limitations</h2>
          <p className="text-lg">
            Body Visualizer is a directional planning tool, not a clinical measurement system. It is most useful for
            trend comparison, education, and what-if scenario testing.
          </p>
          <ul className="text-lg">
            <li>Not intended for medical diagnosis or treatment decisions</li>
            <li>Does not replicate each person&apos;s exact anatomy or fat distribution</li>
            <li>Best used with consistent tracking habits and real-world measurements over time</li>
          </ul>

          <h2>Privacy</h2>
          <p className="text-lg">
            Privacy matters. Uploaded photos are intended for processing and result generation only, and Body Visualizer
            aims to minimize retention wherever possible. Review the Privacy Policy for details on data handling.
          </p>

          <h2>Who should use this tool</h2>
          <ul className="text-lg">
            <li>People who want visual context for BMI and body-fat scenarios</li>
            <li>Users tracking body-composition trends over time</li>
            <li>Coaches and individuals planning realistic physique goals</li>
          </ul>

          <h2>Who should not rely on this tool</h2>
          <ul className="text-lg">
            <li>Anyone needing exact values for medical or legal decisions</li>
            <li>Individuals requiring clinical-grade body-composition testing</li>
          </ul>

          <h2>Contact</h2>
          <p className="text-lg mb-12">
            Have questions, feedback, or need assistance? You can reach us at{" "}
            <a href="mailto:bodyfatestimator@gmail.com" className="text-primary">
              bodyfatestimator@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
