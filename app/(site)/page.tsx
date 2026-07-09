import { Metadata } from "next";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Ruler,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import BodyVisualizerTool from "../components/BodyVisualizerTool";
import FaqSection from "../components/FaqSection";
import { canonicalUrl } from "../seo";

const title = "Body Visualizer – BMI, Weight, Height & Shape Simulator";
const description =
  "Interactive body visualizer with male/female morph models, advanced measurements, local presets, and snapshot export.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: canonicalUrl(),
  },
};

type BenefitItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type StepItem = {
  title: string;
  description: string;
  visual: "measurements" | "model" | "compare";
};

type FeatureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type FaqItem = {
  question: string;
  answer: string;
};

const FEATURES: FeatureItem[] = [
  {
    title: "No Photo Upload",
    description:
      "Explore body-shape changes from measurements and sliders without adding an image.",
    icon: CheckCircle2,
  },
  {
    title: "Real-Time Visualization",
    description:
      "Watch the 3D avatar update instantly as you adjust BMI, body fat, height, weight, and measurements.",
    icon: Activity,
  },
  {
    title: "Mobile-Friendly Controls",
    description:
      "Use the same simple controls on desktop or mobile for fast scenario planning.",
    icon: Smartphone,
  },
];

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
    visual: "measurements",
  },
  {
    title: "Generate 3D Model",
    description:
      "Body Visualizer maps your stats to a dynamic 3D avatar so you can instantly review proportion and composition changes.",
    visual: "model",
  },
  {
    title: "Explore and Adjust",
    description:
      "Rotate the model, save presets, and test multiple scenarios to compare progress and plan next steps.",
    visual: "compare",
  },
];

const FAQS: FaqItem[] = [
  {
    question: "How does Body Visualizer work?",
    answer:
      "Body Visualizer converts your inputs into a real-time 3D body-shape estimate using linked statistical relationships between BMI, body fat percentage, and measurements.",
  },
  {
    question: "Does Body Visualizer require photo uploads?",
    answer:
      "No. The morph visualizer works from sliders and measurement inputs, so you can adjust body fat, BMI, height, weight, and measurements without uploading an image.",
  },
  {
    question: "What measurements should I enter?",
    answer:
      "You can start with height and weight, then optionally add body fat %, chest, waist, hips, and inseam for a more detailed shape result.",
  },
  {
    question: "What stats can I adjust?",
    answer:
      "You can adjust height, weight, BMI/body-fat context, gender profile, units, and optional measurements such as chest, waist, hips, and inseam.",
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

function StepPreview({ visual }: { visual: StepItem["visual"] }) {
  if (visual === "model") {
    return (
      <div className="flex h-full items-center justify-center bg-[#f6f7f9]">
        <img
          src="/hero/body-visualizer-header.webp"
          alt=""
          className="h-full w-full object-contain p-3"
          loading="lazy"
        />
      </div>
    );
  }

  if (visual === "compare") {
    return (
      <div className="grid h-full grid-cols-2 gap-3 bg-[#f6f7f9] p-3">
        <div className="flex flex-col items-center justify-end rounded-lg border border-gray-200 bg-white p-3">
          <div className="h-16 w-9 rounded-t-full rounded-b-[18px] bg-gray-300" />
          <div className="mt-2 h-2 w-12 rounded-full bg-gray-200" />
        </div>
        <div className="flex flex-col items-center justify-end rounded-lg border border-primary/20 bg-primary/10 p-3">
          <div className="h-16 w-12 rounded-t-full rounded-b-[22px] bg-primary/35" />
          <div className="mt-2 h-2 w-12 rounded-full bg-primary/25" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-3 bg-[#f6f7f9] p-4">
      {[
        ["Height", "72%"],
        ["Weight", "58%"],
        ["Body fat", "42%"],
      ].map(([label, width]) => (
        <div key={label} className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-600">
            <span>{label}</span>
            <span className="h-2 w-8 rounded-full bg-primary/15" />
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-primary" style={{ width }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 pb-20">
      <section id="visualizer-tool">
        <BodyVisualizerTool />
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-6 lg:mt-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              Interactive body-shape simulator
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 lg:text-5xl">
              Body Visualizer
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-gray-700">
              Transform height, weight, BMI, body fat, and body measurements into a real-time
              3D reference you can adjust, compare, and save.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Instead of guessing what a number might look like, use Body Visualizer to explore
              proportion changes in a clear, repeatable way.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
              <img
                src="/hero/body-visualizer-header.webp"
                alt="Body Visualizer 3D body model preview"
                className="h-full w-full object-contain p-4"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-700">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-6 lg:mt-32">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 lg:text-4xl">Why Use Our Body Visualizer</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-gray-700">
            Turn abstract body numbers into practical visual context for progress tracking,
            scenario planning, and better body-composition understanding.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {BENEFITS.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-700">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-5xl px-4 pb-8 pt-4 lg:mt-32 lg:pb-12 lg:pt-8">
        <h2 className="text-center text-3xl font-semibold text-gray-900 lg:text-4xl">
          How to Use the Body Visualizer
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-lg leading-relaxed text-gray-700">
          Creating your personalized 3D model takes less than a minute with these straightforward steps.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
          {STEPS.map((step, index) => (
            <article
              key={step.title}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary">
                {index + 1}
              </div>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-base-100">
                <StepPreview visual={step.visual} />
              </div>
              <h3 className="mt-4 text-center text-xl font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-3 text-left text-lg leading-relaxed text-gray-700">{step.description}</p>
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
        className="mx-auto mt-20 max-w-6xl lg:mt-32"
      />

      <section className="mx-auto mt-20 max-w-6xl px-6 lg:mt-32">
        <div
          id="cta"
          className="rounded-3xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm"
        >
          <h2 className="text-3xl font-semibold text-gray-900 lg:text-4xl">
            Start Visualizing Your Body Shape Today
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-gray-700">
            Join thousands of satisfied Body Visualizer users and create your personalized 3D avatar now.
          </p>
          <div className="mt-10">
            <a href="/pricing" className="btn btn-primary btn-lg inline-flex items-center gap-2 text-white">
              Try Body Visualizer
              <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
