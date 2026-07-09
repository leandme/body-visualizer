"use client";

import React from "react";
import { trackEvent } from "@/app/libs/amplitude";

type Props = {
  location: string;
  className?: string;
  children: React.ReactNode;
};

export default function TrackedPricingLink({ location, className, children }: Props) {
  return (
    <a
      href="/pricing"
      className={className}
      onClick={() =>
        trackEvent("Go to Pricing Page", {
          Location: location,
        })
      }
    >
      {children}
    </a>
  );
}
