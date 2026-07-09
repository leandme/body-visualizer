"use client";

import React, { useEffect, useState } from "react";
import { trackEvent } from "@/app/libs/amplitude";

const ACCESS_STORAGE_KEY = "bodyVisualizerAccess:v1";
const VALID_VISUALIZER_PLANS = new Set(["ten", "unlimited"]);

type Props = {
  location: string;
  className?: string;
  children: React.ReactNode;
};

function hasVisualizerAccess() {
  try {
    const raw = window.localStorage.getItem(ACCESS_STORAGE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as { sessionId?: unknown; plan?: unknown };
    return typeof parsed.sessionId === "string" && VALID_VISUALIZER_PLANS.has(String(parsed.plan));
  } catch {
    return false;
  }
}

export default function BodyVisualizerAccessLink({ location, className, children }: Props) {
  const [href, setHref] = useState("/pricing");

  useEffect(() => {
    setHref(hasVisualizerAccess() ? "/visualizer" : "/pricing");
  }, []);

  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        if (href === "/pricing") {
          trackEvent("Go to Pricing Page", {
            Location: location,
          });
        }
      }}
    >
      {children}
    </a>
  );
}
