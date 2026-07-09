  "use client";

  import { useEffect, useState } from "react";
  import { trackEvent } from "@/app/libs/amplitude";
  import { normalizeBodyShapeKey, type BodyShapeKey } from "@/app/libs/body-shape";

  type EstimateSource = "example" | "upload";

  type EstimateResult = {
    bodyFat: number | null;
    perceivedAge: number | null;
    perceivedGender: string | null;
    bodyShape: BodyShapeKey | null;
    accuracy: "low" | "medium" | "high" | null;
    rationale: string | null;
    improve: string[];
    raw?: any;
  };

  type State = {
    estimate: EstimateResult | null;
    loading: boolean;
    error: string | null;
  };

  function isE005SensitiveFlag(msg: string) {
    const m = (msg || "").toLowerCase();
    return (
      m.includes("(e005)") ||
      m.includes("flagged as sensitive") ||
      m.includes("input or output was flagged as sensitive")
    );
  }

  function buildFriendlyErrorMessage(rawMsg: string) {
    const msg = rawMsg || "";
    const lower = msg.toLowerCase();

    if (lower.includes("monthly spend limit reached") || lower.includes("spend limit")) {
      return "Estimation is temporarily unavailable because the Replicate monthly spend limit was reached. Increase billing limit in Replicate and retry.";
    }

    if (lower.includes("insufficient credits")) {
      return "Estimation is temporarily unavailable due to insufficient Replicate credits.";
    }

    if (isE005SensitiveFlag(msg)) {
      return [
        "Ugh! Our AI can’t process this photo.",
        "It thinks that it's nudity.",
        "Try again with another image?",
      ].join("\n");
    }

    if (msg.toLowerCase().includes("timed out")) {
      return "This one took too long to process. Please try again (or use a smaller/lower-res image).";
    }

    return msg || "Something went wrong. Please try a different photo.";
  }

  const resolveToAbsoluteUrl = (url: string) => {
    if (url.startsWith("/")) return `${window.location.origin}${url}`;
    return url;
  };

  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  export function useBodyFatEstimate(
    imageUrl: string | null,
    options?: { source?: EstimateSource }
  ) {
    // ✅ stable attribution for this lifecycle
    const source: EstimateSource = options?.source ?? "upload";

    const [state, setState] = useState<State>({
      estimate: null,
      loading: false,
      error: null,
    });

    useEffect(() => {
      if (!imageUrl) {
        setState({ estimate: null, loading: false, error: null });
        return;
      }

      const controller = new AbortController();
      const { signal } = controller;

      const run = async () => {
        setState({ estimate: null, loading: true, error: null });

        try {
          // 1) Fetch image and convert to data URL
          const resolvedUrl = resolveToAbsoluteUrl(imageUrl);

          const response = await fetch(resolvedUrl, { cache: "no-store", signal });
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }

          const contentType = response.headers.get("content-type") || "";
          if (!contentType.startsWith("image/")) {
            throw new Error(`Not an image: ${contentType}`);
          }

          const blob = await response.blob();
          const base64WithMime = await blobToDataUrl(blob);

          // 2) Start prediction (fast)
          const startRes = await fetch("/api/estimate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64WithMime }),
            signal,
          });

          if (!startRes.ok) {
            let startErrDetail = "";
            try {
              const startErr = await startRes.json();
              startErrDetail =
                startErr?.detail ||
                startErr?.error ||
                startErr?.message ||
                "";
            } catch {
              // ignore parse failures and fallback to status-only message
            }

            const detailPart = startErrDetail ? ` - ${startErrDetail}` : "";
            throw new Error(`Estimate start failed (${startRes.status})${detailPart}`);
          }

          let startData: any = null;
          try {
            startData = await startRes.json();
          } catch {
            throw new Error("Estimate start returned invalid JSON");
          }

          const getUrl = startData?.getUrl;
          if (!getUrl) {
            throw new Error("Estimate start did not return getUrl");
          }

          // 3) Poll status (short requests; avoids serverless timeouts)
          const maxPolls = 240; // ~4 minutes at 1s intervals
          let finalEstimate: any = null;

          for (let i = 0; i < maxPolls; i++) {
            if (signal.aborted) return;

            const statusRes = await fetch(
              `/api/estimate/status?getUrl=${encodeURIComponent(getUrl)}`,
              { cache: "no-store", signal }
            );

            if (!statusRes.ok) {
              throw new Error(`Estimate status failed: ${statusRes.status}`);
            }

            let statusData: any = null;
            try {
              statusData = await statusRes.json();
            } catch {
              throw new Error("Estimate status returned invalid JSON");
            }

            const status = statusData?.status;

            if (status === "failed" || status === "canceled") {
              throw new Error(statusData?.error || "Prediction failed");
            }

            if (status === "succeeded") {
              finalEstimate = statusData?.estimate;
              break;
            }

            await sleep(1000);
          }

          if (!finalEstimate) {
            throw new Error("Prediction timed out");
          }

          // 4) Normalize into stable variables for the UI
          const normalized: EstimateResult = {
            bodyFat:
              finalEstimate?.estimation?.body_fat_percent ??
              finalEstimate?.body_fat_percent ??
              null,

            perceivedAge: (() => {
              const v = finalEstimate?.photo_assessment?.perceived_age;
              const s = Array.isArray(v) ? v[0] : v;
              const n = Number(s);
              return Number.isFinite(n) ? n : null;
            })(),

            perceivedGender: (() => {
              const v = finalEstimate?.photo_assessment?.perceived_gender;
              const raw = Array.isArray(v) ? v[0] : v;
              return typeof raw === "string" ? raw.toLowerCase().trim() : null;
            })(),

            bodyShape: normalizeBodyShapeKey(
              finalEstimate?.photo_assessment?.body_shape
            ),

            accuracy: finalEstimate?.estimation?.accuracy_rating ?? null,

            rationale:
              finalEstimate?.estimation?.estimation_rationale ??
              finalEstimate?.estimation?.accuracy_rationale ??
              null,

            improve: Array.isArray(finalEstimate?.estimation?.accuracy_improvements)
              ? finalEstimate.estimation.accuracy_improvements
              : [],

            raw: finalEstimate,
          };

          if (normalized.bodyFat == null) {
            throw new Error("Model returned no body fat estimate");
          }

          if (signal.aborted) return;

          trackEvent("Estimate Body Fat Percentage", {
            'body fat': normalized.bodyFat,
            'perceived age': normalized.perceivedAge,
            'perceived gender': normalized.perceivedGender,
            'body shape': normalized.bodyShape,
             accuracy: normalized.accuracy,
             source,
             type: 'basic'
          });

          setState({ estimate: normalized, loading: false, error: null });
        } catch (err: any) {
          if (signal.aborted) return;

          const rawMessage =
            err?.message ?? (typeof err === "string" ? err : "") ?? "Error";

          const friendly = buildFriendlyErrorMessage(rawMessage);

          console.error("Estimation error:", err);

          // ✅ Track error type + attribution
          trackEvent("Estimate Error", {
           'error type': isE005SensitiveFlag(rawMessage) ? "E005_sensitive" : "other",
            'error message': rawMessage.slice(0, 200),
             source,
            'estimate type': 'basic'
          });

          setState({
            estimate: null,
            loading: false,
            error: friendly,
          });
        }
      };

      run();
      return () => controller.abort();
    }, [imageUrl, source]);

    return state;
  }
