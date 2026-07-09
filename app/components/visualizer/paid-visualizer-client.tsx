"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, ImagePlus, Loader2, Lock } from "lucide-react";
import { trackEvent } from "@/app/libs/amplitude";
import { showErrorToast, showSuccessToast } from "@/app/libs/toast";
import { useBodyFatEstimate } from "@/app/hooks/useBodyFatEstimate";
import type { VisualizerPlan } from "@/app/libs/visualizer/plans";
import TrackedPricingLink from "@/app/components/common/tracked-pricing-link";

type StoredAccess = {
  plan: VisualizerPlan;
  unlimited: boolean;
  remainingCredits: number | null;
  sessionId: string;
  verifiedAt: number;
};

type GeneratedImage = {
  id: string;
  url: string;
  createdAt: number;
  targets: {
    bodyFat: number;
    muscleMass: number;
    weightLossKg: number;
  };
};

type AccessResponse = {
  plan: VisualizerPlan;
  unlimited: boolean;
  credits: number | null;
  sessionId: string;
};

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  helper?: string;
  onChange: (value: number) => void;
};

const ACCESS_STORAGE_KEY = "bodyVisualizerAccess:v1";
const PURCHASE_EVENT_STORAGE_PREFIX = "bodyVisualizerPurchaseTracked:v1:";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const PLAN_EVENT_LABELS: Record<VisualizerPlan, string> = {
  ten: "10 Visualizations",
  unlimited: "Unlimited Access",
};

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function kgToLb(kg: number) {
  return Math.round(kg * 2.2046226218);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function readStoredAccess() {
  try {
    const raw = window.localStorage.getItem(ACCESS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredAccess;
    if (
      !parsed?.sessionId ||
      (parsed.plan !== "ten" && parsed.plan !== "unlimited")
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeStoredAccess(access: StoredAccess) {
  window.localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(access));
}

function trackPurchaseOnce(access: AccessResponse) {
  const storageKey = `${PURCHASE_EVENT_STORAGE_PREFIX}${access.sessionId}`;
  try {
    if (window.localStorage.getItem(storageKey)) return;
    window.localStorage.setItem(storageKey, "1");
  } catch {}

  trackEvent("Purchase", {
    Plan: PLAN_EVENT_LABELS[access.plan],
  });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  helper,
  onChange,
}: SliderProps) {
  return (
    <label className="block rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-gray-900">{label}</span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-900">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range range-primary mt-4"
      />
      {helper ? <p className="mt-2 text-sm leading-relaxed text-gray-500">{helper}</p> : null}
    </label>
  );
}

export default function PaidVisualizerClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sessionId = searchParams.get("session_id");

  const [access, setAccess] = useState<StoredAccess | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [bodyFatTarget, setBodyFatTarget] = useState(20);
  const [muscleMassTarget, setMuscleMassTarget] = useState(0);
  const [weightLossKgTarget, setWeightLossKgTarget] = useState(0);
  const [hasPresetFromEstimate, setHasPresetFromEstimate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);

  const estimateState = useBodyFatEstimate(imageDataUrl, { source: "upload" });
  const estimate = estimateState.estimate;
  const perceivedGender = estimate?.perceivedGender === "female" ? "female" : "male";
  const bodyFatRange = perceivedGender === "female" ? { min: 14, max: 55 } : { min: 5, max: 45 };
  const selectedGeneratedImage = generatedImages.find((image) => image.url === selectedImageUrl);
  const canGenerate =
    !!access &&
    !!imageDataUrl &&
    !!estimate?.bodyFat &&
    !estimateState.loading &&
    !estimateState.error &&
    !generating &&
    (access.unlimited || (access.remainingCredits ?? 0) > 0);

  const creditsLabel = useMemo(() => {
    if (!access) return "Locked";
    if (access.unlimited) return "Unlimited generations";
    return `${access.remainingCredits ?? 0} credits left`;
  }, [access]);

  useEffect(() => {
    let cancelled = false;

    async function verifyAccess() {
      setAccessLoading(true);
      setAccessError(null);

      const storedAccess = readStoredAccess();
      if (storedAccess && !cancelled) {
        setAccess(storedAccess);
      }

      if (!sessionId) {
        setAccessLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/visualizer/access?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );
        const data = (await response.json()) as AccessResponse & { error?: string };

        if (!response.ok) {
          throw new Error(data.error || "Unable to verify payment");
        }

        const existing = readStoredAccess();
        const remainingCredits =
          data.unlimited
            ? null
            : existing?.sessionId === data.sessionId &&
              typeof existing.remainingCredits === "number"
            ? existing.remainingCredits
            : data.credits ?? 10;
        const nextAccess: StoredAccess = {
          plan: data.plan,
          unlimited: data.unlimited,
          remainingCredits,
          sessionId: data.sessionId,
          verifiedAt: Date.now(),
        };

        writeStoredAccess(nextAccess);
        if (!cancelled) {
          setAccess(nextAccess);
          showSuccessToast("Body Visualizer unlocked.");
          trackEvent("Visualizer Access Verified", {
            plan: data.plan,
            unlimited: data.unlimited,
          });
          trackPurchaseOnce(data);
          router.replace("/visualizer");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to verify payment";
        if (!cancelled) {
          setAccessError(message);
          showErrorToast(message);
        }
      } finally {
        if (!cancelled) setAccessLoading(false);
      }
    }

    verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [router, sessionId]);

  useEffect(() => {
    setHasPresetFromEstimate(false);
  }, [imageDataUrl]);

  useEffect(() => {
    if (hasPresetFromEstimate || typeof estimate?.bodyFat !== "number") return;

    setBodyFatTarget(clamp(Math.round(estimate.bodyFat), bodyFatRange.min, bodyFatRange.max));
    setHasPresetFromEstimate(true);

    trackEvent("Visualizer Estimate Complete", {
      bodyFat: estimate.bodyFat,
      perceivedGender: estimate.perceivedGender,
      accuracy: estimate.accuracy,
    });
  }, [bodyFatRange.max, bodyFatRange.min, estimate, hasPresetFromEstimate]);

  async function handleFile(file: File | null | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showErrorToast("Please upload an image file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showErrorToast("File size exceeds 5MB. Please upload a smaller photo.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setImageDataUrl(dataUrl);
      setSelectedImageUrl(dataUrl);
      setGeneratedImages([]);
      setMuscleMassTarget(0);
      setWeightLossKgTarget(0);
      setGenerationMessage(null);
      trackEvent("Visualizer Upload Image", { fileType: file.type, fileSize: file.size });
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Failed to read image");
    }
  }

  async function pollVisualization(getUrl: string) {
    for (let index = 0; index < 180; index++) {
      const response = await fetch(
        `/api/visualizer/status?getUrl=${encodeURIComponent(getUrl)}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as {
        status?: string;
        imageUrls?: string[];
        error?: string | null;
      };

      if (!response.ok) {
        throw new Error(data.error || "Visualization status failed");
      }

      if (data.status === "failed" || data.status === "canceled") {
        throw new Error(data.error || "Visualization failed");
      }

      if (data.status === "succeeded") {
        const imageUrl = data.imageUrls?.find(Boolean);
        if (!imageUrl) throw new Error("Visualization finished without an image");
        return imageUrl;
      }

      await sleep(1500);
    }

    throw new Error("Visualization timed out");
  }

  function persistAccess(nextAccess: StoredAccess) {
    setAccess(nextAccess);
    writeStoredAccess(nextAccess);
  }

  async function handleGenerate() {
    if (!access || !imageDataUrl || !estimate?.bodyFat) return;

    if (!access.unlimited && (access.remainingCredits ?? 0) <= 0) {
      showErrorToast("You have no visualization credits left.");
      return;
    }

    const targets = {
      bodyFat: bodyFatTarget,
      muscleMass: muscleMassTarget,
      weightLossKg: weightLossKgTarget,
    };

    setGenerating(true);
    setGenerationMessage("Creating your body visualization...");
    trackEvent("Visualizer Generate Start", {
      plan: access.plan,
      ...targets,
    });

    try {
      const response = await fetch("/api/visualizer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: access.sessionId,
          imageBase64: imageDataUrl,
          estimate: {
            bodyFat: estimate.bodyFat,
            perceivedGender: estimate.perceivedGender,
            perceivedAge: estimate.perceivedAge,
          },
          targets,
        }),
      });

      const data = (await response.json()) as {
        getUrl?: string;
        error?: string;
        detail?: string | null;
      };

      if (!response.ok || !data.getUrl) {
        throw new Error(data.detail || data.error || "Failed to start visualization");
      }

      const imageUrl = await pollVisualization(data.getUrl);
      const generatedImage: GeneratedImage = {
        id: `${Date.now()}`,
        url: imageUrl,
        createdAt: Date.now(),
        targets,
      };

      setGeneratedImages((current) => [generatedImage, ...current]);
      setSelectedImageUrl(imageUrl);
      setGenerationMessage("Visualization ready.");

      if (!access.unlimited) {
        const nextAccess = {
          ...access,
          remainingCredits: Math.max(0, (access.remainingCredits ?? 0) - 1),
        };
        persistAccess(nextAccess);
      }

      trackEvent("Visualizer Generate Success", {
        plan: access.plan,
        ...targets,
      });
      showSuccessToast("Visualization ready.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate visualization";
      setGenerationMessage(message);
      trackEvent("Visualizer Generate Error", {
        plan: access.plan,
        error: message.slice(0, 200),
      });
      showErrorToast(message);
    } finally {
      setGenerating(false);
    }
  }

  async function downloadImage(url: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `body-visualization-${Date.now()}.jpg`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  async function handleSave() {
    if (!selectedGeneratedImage) return;

    const url = selectedGeneratedImage.url;
    trackEvent("Visualizer Save Image", {
      plan: access?.plan,
      bodyFat: selectedGeneratedImage.targets.bodyFat,
    });

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Body visualization",
          text: "My AI body visualization",
          url,
        });
        return;
      }
    } catch {
      // fall through to download/open
    }

    await downloadImage(url);
  }

  if (accessLoading) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-lg font-semibold text-gray-900">Checking your access...</p>
        </div>
      </main>
    );
  }

  if (!access) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-gray-900">Unlock Body Visualizer</h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-gray-600">
            Choose a plan to upload your photo, adjust target body stats, and generate AI body
            visualizations.
          </p>
          {accessError ? (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {accessError}
            </p>
          ) : null}
          <TrackedPricingLink
            location="Locked Visualizer Page"
            className="btn btn-primary btn-lg mt-6 text-white"
          >
            View Pricing
          </TrackedPricingLink>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 lg:text-5xl">Body Visualizer</h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-600">
            Upload your photo, adjust target body fat, muscle mass, and visual weight loss, then
            generate realistic AI previews.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm">
          {creditsLabel}
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl bg-gray-100 lg:max-h-[680px]">
            {selectedImageUrl ? (
              <img
                src={selectedImageUrl}
                alt="Selected body visualization"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="px-6 text-center">
                <ImagePlus className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                <p className="mt-4 text-lg font-semibold text-gray-900">Upload your photo</p>
                <p className="mt-2 text-sm text-gray-500">
                  Your generated visualization will appear here.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => fileInputRef.current?.click()}
            >
              {imageDataUrl ? "Change Photo" : "Upload Photo"}
            </button>
            <p className="text-sm text-gray-500">
              AI visuals are illustrative estimates, not medical measurements.
            </p>
          </div>
        </div>

        <aside className="rounded-3xl border border-gray-200 bg-gray-50 p-4 shadow-sm sm:p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="text-xl font-bold text-gray-900">Target stats</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              We estimate your current body fat after upload, then preset the body-fat slider.
            </p>

            {estimateState.loading ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Estimating your body fat...
              </div>
            ) : null}

            {estimateState.error ? (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {estimateState.error}
              </p>
            ) : null}

            {estimate?.bodyFat ? (
              <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                Current estimate: {estimate.bodyFat}% body fat
              </p>
            ) : null}
          </div>

          <div className="mt-4 space-y-4">
            <SliderControl
              label="Body fat percentage"
              value={bodyFatTarget}
              min={bodyFatRange.min}
              max={bodyFatRange.max}
              suffix="%"
              onChange={setBodyFatTarget}
            />
            <SliderControl
              label="Muscle mass"
              value={muscleMassTarget}
              min={-10}
              max={30}
              suffix="%"
              onChange={setMuscleMassTarget}
            />
            <SliderControl
              label="Weight loss"
              value={weightLossKgTarget}
              min={0}
              max={30}
              suffix=" kg"
              helper={`${weightLossKgTarget} kg / ${kgToLb(weightLossKgTarget)} lb lighter visual target.`}
              onChange={setWeightLossKgTarget}
            />
          </div>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              className="btn btn-primary btn-lg text-white"
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-lg"
              disabled={!selectedGeneratedImage}
              onClick={handleSave}
            >
              <Download className="h-5 w-5" aria-hidden="true" />
              Save
            </button>
          </div>

          {generationMessage ? (
            <p className="mt-4 text-center text-sm font-medium text-gray-600">{generationMessage}</p>
          ) : null}

          {!access.unlimited && (access.remainingCredits ?? 0) <= 0 ? (
            <p className="mt-4 rounded-2xl bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-800">
              You have used all 10 visualization credits.
            </p>
          ) : null}
        </aside>
      </section>

      <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">Generated images</h2>
          <span className="text-sm text-gray-500">{generatedImages.length} saved this session</span>
        </div>

        {generatedImages.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {generatedImages.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImageUrl(image.url)}
                className={[
                  "overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition",
                  selectedImageUrl === image.url
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-gray-200 hover:border-primary/60",
                ].join(" ")}
              >
                <img
                  src={image.url}
                  alt={`${image.targets.bodyFat}% body fat visualization`}
                  className="aspect-[3/4] w-full object-cover"
                />
                <div className="p-3 text-xs font-semibold text-gray-700">
                  {image.targets.bodyFat}% BF · {image.targets.muscleMass >= 0 ? "+" : ""}
                  {image.targets.muscleMass}% muscle · -{image.targets.weightLossKg} kg
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            Generated visualizations will appear here as clickable cards.
          </p>
        )}
      </section>
    </main>
  );
}
