import { Metadata } from "next";
import Image from "next/image";
import {
  BarChart3,
  Camera,
  CheckCircle2,
  ImageUp,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import FaqSection from "../components/FaqSection";
import Hero from "../components/Hero";

const title = "Body Visualizer - AI Body Visualization Tool";
const description =
  "Upload a body photo, adjust body fat percentage, BMI, weight, and measurements, then visualize realistic body-shape scenarios with Body Visualizer AI.";

export const metadata: Metadata = {
  title,
  description,
};

type StepItem = {
  id: number;
  title: string;
  imageSrc: string;
  imageAlt: string;
  description: string;
};

type BenefitItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type FaqItem = {
  question: string;
  answer: string;
};

const HOW_BODY_VISUALIZER_AI_WORKS_STEPS: StepItem[] = [
  {
    id: 1,
    title: "Upload a Body Photo",
    imageSrc: "/tools/height-estimator/height-example-1.jpg",
    imageAlt: "Full-body photo upload example for Body Visualizer AI",
    description:
      "Start with a clear full-body image so Body Visualizer AI can use your real proportions as the baseline for the preview.",
  },
  {
    id: 2,
    title: "Tweak Your Stats",
    imageSrc: "/tools/height-estimator/height-example-2.jpg",
    imageAlt: "Body composition controls for BMI, weight, and body fat percentage",
    description:
      "Adjust body fat percentage, BMI, weight, height, and optional measurements to test realistic what-if scenarios.",
  },
  {
    id: 3,
    title: "Compare the Visualization",
    imageSrc: "/tools/height-estimator/height-example-3.jpg",
    imageAlt: "Body visualization result for comparing composition changes",
    description:
      "Review the updated body visualization, rotate the model, save presets, and compare baseline versus target looks.",
  },
];

const BENEFITS: BenefitItem[] = [
  {
    title: "Photo-Based Starting Point",
    description:
      "Use an uploaded image as the context, then explore changes without losing sight of your actual proportions.",
    icon: ImageUp,
  },
  {
    title: "Body Fat, BMI, and Weight Controls",
    description:
      "Move the core sliders together or independently to see how each metric affects the modeled shape.",
    icon: SlidersHorizontal,
  },
  {
    title: "Progress and Goal Planning",
    description:
      "Save setups, compare scenarios, and export snapshots for a more visual way to plan body-composition goals.",
    icon: BarChart3,
  },
];

const FAQS: FaqItem[] = [
  {
    question: "How does Body Visualizer work?",
    answer:
      "Body Visualizer combines a photo-based starting point with adjustable body-composition controls so you can preview changes to body fat percentage, BMI, weight, height, and proportions.",
  },
  {
    question: "What is Body Visualizer AI?",
    answer:
      "Body Visualizer AI is the AI-assisted workflow behind the visualizer. It is designed to help turn an uploaded image and your inputs into a practical body-shape preview.",
  },
  {
    question: "Do I need to upload a photo?",
    answer:
      "The intended workflow starts with a clear full-body photo, then lets you tweak body fat, BMI, weight, and measurements. The current visualizer controls also let you explore scenarios directly.",
  },
  {
    question: "What stats can I adjust?",
    answer:
      "You can adjust body fat percentage, BMI, weight, height, gender profile, units, and optional measurements such as chest, waist, hips, and inseam.",
  },
  {
    question: "Can I compare different body scenarios?",
    answer:
      "Yes. Body Visualizer is built for what-if comparisons, local presets, reset states, and exported snapshots.",
  },
  {
    question: "Is Body Visualizer a medical tool?",
    answer:
      "No. It is a visual planning and education tool, not a clinical measurement system or medical diagnosis.",
  },
  {
    question: "How accurate are the visualizations?",
    answer:
      "The previews are directional estimates. They are best used for scenario planning and trend context because individual anatomy, posture, lighting, and fat distribution vary.",
  },
  {
    question: "Can I use metric and imperial units?",
    answer:
      "Yes. The visualizer supports metric and imperial units so you can work in the format you already use.",
  },
  {
    question: "Is my photo private?",
    answer:
      "Privacy matters. Uploaded images are intended for processing and result generation only, and Body Visualizer aims to minimize retention wherever possible.",
  },
  {
    question: "Who is Body Visualizer for?",
    answer:
      "It is useful for people planning fitness goals, comparing body-composition scenarios, coaching clients, or understanding how abstract stats may translate visually.",
  },
];

function HowBodyVisualizerAiWorks() {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 pt-8 pb-12 lg:pt-12 lg:pb-16">
      <h2 className="text-3xl lg:text-4xl font-semibold text-center">
        How Body Visualizer AI Works
      </h2>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
        {HOW_BODY_VISUALIZER_AI_WORKS_STEPS.map((step) => (
          <article key={step.id} className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary text-xl font-bold">
              {step.id}
            </div>
            <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-base-100">
              <Image
                src={step.imageSrc}
                alt={step.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 767px) 100vw, 33vw"
              />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-center text-gray-900">{step.title}</h3>
            <p className="mt-3 text-lg leading-relaxed text-left text-gray-700">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function BodyVisualizerExplainer() {
  return (
    <section className="mx-auto mt-12 max-w-6xl px-6 lg:mt-20 lg:px-12">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
        <div className="relative min-h-[22rem] overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.12)_1px,transparent_1px)] bg-[size:34px_34px]" />
          <div className="absolute left-1/2 top-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm">
            <Sparkles size={15} />
            Live Body Preview
          </div>
          <div className="absolute bottom-8 left-8 right-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              <span className="rounded-xl border border-gray-200 px-3 py-2">Body Fat %</span>
              <span className="rounded-xl border border-gray-200 px-3 py-2">BMI</span>
              <span className="rounded-xl border border-gray-200 px-3 py-2">Weight</span>
              <span className="rounded-xl border border-gray-200 px-3 py-2">Measurements</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl lg:text-4xl font-semibold">
            A Better Way to Understand Body-Shape Changes
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-700">
            Body Visualizer is designed for one simple goal: helping you see how body-composition changes may look before you commit to a target.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-gray-700">
            Instead of relying only on scale weight, BMI, or a formula, Body Visualizer turns those inputs into a visual reference you can adjust, compare, and save.
          </p>
          <ul className="mt-5 list-disc space-y-2 pl-6 text-lg text-gray-700">
            <li>Explore fat loss, weight gain, or recomposition scenarios</li>
            <li>Compare before and target settings with more context</li>
            <li>Understand why the same BMI can look different across bodies</li>
            <li>Use snapshots and presets for visual progress planning</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function BenefitsComparison() {
  return (
    <section className="mt-20 flex items-center justify-center lg:mt-28">
      <div className="w-full max-w-6xl px-6 lg:px-12">
        <h2 className="text-3xl lg:text-4xl font-bold text-center">
          Visualize Body Changes <i>Easily</i>
        </h2>

        <p className="mt-4 text-lg text-center text-gray-600 max-w-3xl mx-auto">
          Compare static body-composition numbers with an interactive visualizer built for practical what-if planning.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="card bg-[#FFEAEC] shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-center justify-center text-xl font-semibold">
                Numbers Alone
              </h3>
              <ul className="mt-4 space-y-4 text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">x</span>
                  BMI and weight can feel abstract without visual context
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">x</span>
                  Body fat percentage can be hard to imagine accurately
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">x</span>
                  Progress photos can be difficult to compare consistently
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">x</span>
                  Goal setting often becomes a guessing game
                </li>
              </ul>
            </div>
          </div>

          <div className="card bg-[#DEFCED] shadow-xl border border-green-200">
            <div className="card-body">
              <h3 className="card-title text-center justify-center text-xl font-semibold">
                Body Visualizer
              </h3>
              <ul className="mt-4 space-y-4 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle2 className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  Upload an image and use it as a body-shape reference
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  Tweak body fat percentage, BMI, weight, and measurements
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  Save presets and compare realistic body scenarios
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  Export snapshots for easier progress planning
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitList() {
  return (
    <section className="mx-auto mt-20 max-w-5xl px-4 lg:mt-28">
      <h2 className="text-3xl lg:text-4xl font-semibold text-center">
        Why Use Body Visualizer
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {BENEFITS.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Icon size={22} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-3 text-lg leading-relaxed text-gray-700">{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 pb-20">
      <Hero />

      <HowBodyVisualizerAiWorks />
      <BodyVisualizerExplainer />
      <BenefitList />
      <BenefitsComparison />

      <FaqSection
        id="faqs"
        heading="Body Visualizer FAQ"
        description="Answers to common questions about AI body visualization, adjustable stats, accuracy, and privacy."
        items={FAQS}
        accordionName="bodyvisualizer-home-faq-accordion"
        className="mt-20 lg:mt-28"
      />

      <section className="mt-20 lg:mt-28">
        <div
          id="cta"
          className="mx-auto w-full max-w-4xl rounded-3xl bg-white px-6 py-14 text-center shadow-sm"
        >
          <Camera className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-3xl font-semibold text-gray-900 lg:text-4xl">
            Start Visualizing Your Body Shape
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-gray-700">
            Use Body Visualizer to test realistic body-composition scenarios before setting your next goal.
          </p>
          <div className="mt-10">
            <a href="#upload" className="btn btn-primary btn-lg inline-flex items-center gap-2 text-white">
              Upload Photo
              <Camera size={20} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
