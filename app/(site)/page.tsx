import { Metadata } from "next";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Ruler,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import BodyVisualizerTool from "../components/BodyVisualizerTool";
import FaqSection from "../components/FaqSection";

const title = "Body Visualizer – BMI, Weight, Height & Shape";
const description =
  "Interactive body visualizer with male/female morph models, advanced measurements, local presets, and snapshot export.";

export const metadata: Metadata = {
  title,
  description,
};

type BenefitItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type StepItem = {
  title: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const BENEFITS: BenefitItem[] = [
  {
    title: "Visualize Fitness Progress",
    description:
      "See how body composition changes may influence appearance so you can set realistic goals and track outcomes more confidently.",
    icon: Ruler,
  },
  {
    title: "Better Body Understanding",
    description:
      "Translate BMI, height, weight, and measurements into a lifelike 3D reference that is easier to interpret than isolated numbers.",
    icon: Activity,
  },
  {
    title: "Explore Body Changes",
    description:
      "Run fast what-if scenarios and compare saved configurations to plan adjustments over time.",
    icon: RotateCcw,
  },
];

const STEPS: StepItem[] = [
  {
    title: "Input Measurements",
    description:
      "Enter height, weight, and body-fat context. Add chest, waist, hips, and inseam for more detailed shaping.",
  },
  {
    title: "Generate 3D Model",
    description:
      "Body Visualizer maps your stats to a dynamic 3D avatar so you can instantly review proportion and composition changes.",
  },
  {
    title: "Explore and Adjust",
    description:
      "Rotate the model, save presets, and test multiple scenarios to compare progress and plan next steps.",
  },
];

const FAQS: FaqItem[] = [
  {
    question: "How does Body Visualizer work?",
    answer:
      "Body Visualizer converts your inputs into a real-time 3D body-shape estimate using linked statistical relationships between BMI, body fat percentage, and measurements.",
  },
  {
    question: "Is Body Visualizer free to use?",
    answer:
      "Yes. You can use Body Visualizer for free without creating an account.",
  },
  {
    question: "What measurements should I enter?",
    answer:
      "You can start with height and weight, then optionally add body fat %, chest, waist, hips, and inseam for a more detailed shape result.",
  },
  {
    question: "Do I need to upload a photo?",
    answer:
      "No. The visualizer works from slider and measurement inputs only.",
  },
  {
    question: "Can I switch between imperial and metric units?",
    answer:
      "Yes. You can toggle units at any time, and values will update automatically.",
  },
  {
    question: "What is linked mode in this version?",
    answer:
      "Linked mode is the default behavior: BMI, body fat %, weight, and related proportions stay synchronized for realistic adjustments.",
  },
  {
    question: "Can I save and compare multiple body setups?",
    answer:
      "Yes. You can create local presets in your browser, switch between them, and reset to defaults at any time.",
  },
  {
    question: "Can I rotate the model and view different angles?",
    answer:
      "Yes. You can rotate and zoom the model interactively and use front/left/right/back presets.",
  },
  {
    question: "Can I export a snapshot of my current setup?",
    answer:
      "Yes. Use the camera/share actions to preview and download a PNG snapshot card with your current stats.",
  },
  {
    question: "How accurate is Body Visualizer?",
    answer:
      "It is a visual estimator designed for trend exploration and planning, not a clinical or medical diagnostic tool.",
  },
  {
    question: "Is my data private?",
    answer:
      "Your preset and control data are stored locally in your browser for this experience. You can clear them anytime.",
  },
  {
    question: "Who is Body Visualizer best for?",
    answer:
      "It is useful for anyone comparing body-shape scenarios for fitness planning, progress tracking, or general visualization.",
  },
];

export default function Home() {
  return (
    <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 pb-20">
      <section className="pt-6 text-center">
        <h1 className="text-4xl font-bold text-gray-900 lg:text-5xl">Body Visualizer</h1>
      </section>

      <section id="visualizer-tool" className="mt-6">
        <BodyVisualizerTool />
      </section>

      <section className="mx-auto mt-16 max-w-[1400px] overflow-hidden rounded-[30px] border border-gray-200 bg-white text-gray-900 shadow-sm">
        <div className="px-6 pb-10 pt-12 text-center sm:px-8">
          <h2 className="text-4xl font-bold tracking-tight lg:text-6xl">Body Visualizer</h2>
          <p className="mx-auto mt-5 max-w-4xl text-xl text-gray-600">
            Transform your measurements into a lifelike 3D body model in seconds.
          </p>
        </div>

        <div className="grid gap-8 px-6 pb-12 sm:px-8 lg:grid-cols-2 lg:items-start">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(107,114,128,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(107,114,128,0.08)_1px,transparent_1px)] bg-[size:34px_34px]" />
              <div className="absolute left-1/2 top-12 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800">
                <Sparkles size={15} />
                Live 3D Reference
              </div>
              <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-gray-200 bg-white p-4">
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-700">
                  <span className="rounded-lg border border-gray-200 px-3 py-2">BMI + Body Fat</span>
                  <span className="rounded-lg border border-gray-200 px-3 py-2">Height + Weight</span>
                  <span className="rounded-lg border border-gray-200 px-3 py-2">Chest + Waist</span>
                  <span className="rounded-lg border border-gray-200 px-3 py-2">Hips + Inseam</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-7">
            <h3 className="text-4xl font-bold leading-tight">What is Body Visualizer</h3>
            <p className="text-2xl leading-relaxed text-gray-600">
              Body Visualizer creates realistic 3D body references from your measurements so you can compare shape changes in a clearer, more intuitive way.
            </p>
            <p className="text-2xl leading-relaxed text-gray-600">
              Enter BMI, height, weight, chest, waist, hips, and inseam to explore how different combinations influence overall proportions.
            </p>

            <div className="space-y-6 pt-2">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-gray-100 p-2.5">
                  <CheckCircle2 className="text-[#66cf7f]" size={22} />
                </div>
                <div>
                  <p className="text-3xl font-semibold">Free and No Login</p>
                  <p className="mt-2 text-xl leading-relaxed text-gray-600">
                    Use Body Visualizer instantly without creating an account.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-gray-100 p-2.5">
                  <Activity className="text-[#66cf7f]" size={22} />
                </div>
                <div>
                  <p className="text-3xl font-semibold">Real-Time Visualization</p>
                  <p className="mt-2 text-xl leading-relaxed text-gray-600">
                    Watch the avatar update instantly as you adjust sliders and measurements.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-gray-100 p-2.5">
                  <Smartphone className="text-[#66cf7f]" size={22} />
                </div>
                <div>
                  <p className="text-3xl font-semibold">Simple Interface</p>
                  <p className="mt-2 text-xl leading-relaxed text-gray-600">
                    Easy controls on desktop and mobile make body-shape exploration straightforward.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[1400px] overflow-hidden rounded-[30px] border border-gray-200 bg-white text-gray-900 shadow-sm">
        <div className="grid gap-10 px-6 py-10 sm:px-8 lg:grid-cols-2 lg:items-start">
          <div>
            <span className="inline-flex rounded-full border border-gray-300 bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-700">
              Benefits
            </span>
            <h3 className="mt-5 text-5xl font-bold leading-tight">Why Use Our Body Visualizer</h3>
            <p className="mt-5 text-xl leading-relaxed text-gray-600">
              Discover how Body Visualizer transforms abstract body numbers into meaningful visual insights for better decision-making.
            </p>

            <div className="mt-8 space-y-4">
              {BENEFITS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <details
                    key={item.title}
                    open={index === 0}
                    className="group rounded-xl border border-gray-200 bg-white px-4 py-3"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <span className="flex items-center gap-3">
                        <span className="rounded-lg border border-gray-200 bg-gray-100 p-2">
                          <Icon size={18} className="text-[#66cf7f]" />
                        </span>
                        <span className="text-xl font-semibold">{item.title}</span>
                      </span>
                      <span className="text-gray-500 transition group-open:rotate-180">⌄</span>
                    </summary>
                    <p className="mt-3 pl-12 text-lg leading-relaxed text-gray-600">{item.description}</p>
                  </details>
                );
              })}
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(107,114,128,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(107,114,128,0.12)_1px,transparent_1px)] bg-[size:36px_36px] opacity-30" />
            <div className="absolute left-12 top-16 h-44 w-32 rounded-[40%] border-4 border-[#66cf7f]" />
            <div className="absolute right-12 top-16 h-44 w-32 rounded-[40%] border-4 border-[#66cf7f]" />
            <div className="absolute left-1/2 top-28 h-1 w-44 -translate-x-1/2 rounded-full bg-[#66cf7f]" />
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-4 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800">
              <Sparkles size={16} />
              Shape Progress View
            </div>
            <div className="absolute bottom-10 left-8 right-8 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
              Compare baseline and target configurations with a real-time visual reference.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[1400px] overflow-hidden rounded-[30px] border border-gray-200 bg-white px-6 py-10 shadow-sm sm:px-8">
        <h3 className="mx-auto max-w-2xl text-center text-5xl font-bold leading-tight text-gray-900">How to Use the Body Visualizer</h3>
        <p className="mx-auto mt-5 max-w-3xl text-center text-xl leading-relaxed text-gray-600">
          Creating your personalized 3D model takes less than a minute with these straightforward steps.
        </p>

        <div className="relative mt-10 grid gap-6 lg:grid-cols-3">
          <div className="absolute left-7 right-7 top-7 hidden h-px bg-gray-200 lg:block" />
          {STEPS.map((step, index) => (
            <article
              key={step.title}
              className="relative rounded-2xl border border-gray-200 bg-white p-6"
            >
              <div
                className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl font-bold ${
                  index === 0
                    ? "border-[#66cf7f] bg-[#66cf7f]/18 text-[#1f5f3a]"
                    : "border-gray-300 bg-gray-100 text-gray-700"
                }`}
              >
                {index + 1}
              </div>
              <h4 className="text-3xl font-semibold text-gray-900">{step.title}</h4>
              <p className="mt-3 text-xl leading-relaxed text-gray-600">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <FaqSection
        id="homepage-faq"
        heading="Body Visualizer FAQs"
        description="Everything you need to know about using the Body Visualizer service."
        items={FAQS}
        accordionName="body-visualizer-home-faq-accordion"
        className="mx-auto mt-16 max-w-[1400px]"
      />

      <section className="mt-16">
        <div
          id="cta"
          className="mx-auto w-full max-w-4xl rounded-3xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm"
        >
          <h3 className="text-3xl font-semibold text-gray-900 lg:text-5xl">
            Start Visualizing Your Body Shape Today
          </h3>
          <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-gray-700">
            Join thousands of satisfied Body Visualizer users and create your personalized 3D avatar now.
          </p>
          <div className="mt-10">
            <a href="#visualizer-tool" className="btn btn-primary btn-lg inline-flex items-center gap-2 text-white">
              Try Body Visualizer
              <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
