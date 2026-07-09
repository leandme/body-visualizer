import { Suspense } from "react";
import type { Metadata } from "next";
import PaidVisualizerClient from "@/app/components/visualizer/paid-visualizer-client";

export const metadata: Metadata = {
  title: "Body Visualizer",
  description:
    "Generate AI body visualizations from your photo by adjusting target body fat, muscle mass, and visual weight loss.",
};

export default function VisualizerPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4">
          <p className="text-lg font-semibold text-gray-900">Loading Body Visualizer...</p>
        </main>
      }
    >
      <PaidVisualizerClient />
    </Suspense>
  );
}
