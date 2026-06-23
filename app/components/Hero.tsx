"use client";

import Image from "next/image";
import TryExamples from "./TryExamples";
import UploadDropzone from "./UploadDropZone";

export default function Hero() {
  return (
    <div id="upload" className="hero min-h-screen lg:-mt-28 flex items-start lg:items-center justify-center pt-0 lg:pt-0">
      <div className="hero-content w-full max-w-6xl px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-6 lg:gap-16">
        <div className="w-full lg:w-1/2 text-center lg:text-left">
          <div className="flex justify-center mb-6 lg:mb-8">
            <div className="relative w-full max-w-[360px] aspect-[3/2] mx-auto">
              <Image
                src="/hero/body-visualizer-header.webp"
                alt="BodyVisualizer preview"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 640px) 320px, 360px"
              />
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold">See Your Future Body with AI</h1>

          <p className="py-6 text-lg mt-2">
            Upload a photo, tweak body fat %, BMI, weight, and measurements, then visualize how your body could change. Fast and{" "}
            <span className="inline-block rounded-md border border-primary px-2 py-0.5 text-base font-semibold text-primary">
              realistic
            </span>
            .
          </p>
        </div>

        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
          <div className="w-full max-w-xl">
            <UploadDropzone basePath="/" />
            <TryExamples />
          </div>
        </div>
      </div>
    </div>
  );
}
