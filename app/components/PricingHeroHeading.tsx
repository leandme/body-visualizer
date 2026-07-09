"use client";

import { useEffect, useState } from "react";

const PRICING_HEADLINE_SUFFIXES = [
  "20lbs Lighter",
  "at 8% Body Fat",
  "with 20lbs More Muscle",
];

export default function PricingHeroHeading() {
  const [suffixIndex, setSuffixIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSuffixIndex((currentIndex) => (currentIndex + 1) % PRICING_HEADLINE_SUFFIXES.length);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <h1 className="max-w-4xl text-4xl font-bold lg:text-5xl">
      <span>See Yourself </span>
      <span className="underline decoration-primary underline-offset-8">
        {PRICING_HEADLINE_SUFFIXES[suffixIndex]}
      </span>
    </h1>
  );
}
