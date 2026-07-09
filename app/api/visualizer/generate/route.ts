import { NextRequest, NextResponse } from "next/server";
import { getVisualizerAccessFromSession } from "@/app/libs/visualizer/stripe";

type VisualizerTargets = {
  bodyFat: number;
  muscleMass: number;
  weightLossKg: number;
};

type VisualizerEstimate = {
  bodyFat?: number | null;
  perceivedGender?: string | null;
  perceivedAge?: number | null;
};

type ReqBody = {
  sessionId?: string;
  imageBase64?: string;
  targets?: Partial<VisualizerTargets>;
  estimate?: VisualizerEstimate;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getReplicateModel() {
  return process.env.REPLICATE_VISUALIZER_MODEL || "google/nano-banana-2";
}

function buildPrompt({
  targets,
  estimate,
}: {
  targets: VisualizerTargets;
  estimate?: VisualizerEstimate;
}) {
  const genderContext = estimate?.perceivedGender
    ? `The person appears ${estimate.perceivedGender}.`
    : "Do not change the person's gender presentation.";
  const ageContext =
    typeof estimate?.perceivedAge === "number"
      ? `The person appears around ${estimate.perceivedAge} years old.`
      : "Keep the person's apparent age unchanged.";
  const currentBodyFat =
    typeof estimate?.bodyFat === "number"
      ? `Current estimated body fat is about ${estimate.bodyFat}%.`
      : "Current body fat is unknown.";

  return `
Edit the supplied full-body photo into a realistic body-composition visualization.
${genderContext}
${ageContext}
${currentBodyFat}

Target visualization:
- Body fat percentage: ${targets.bodyFat}%
- Muscle mass visual change: ${targets.muscleMass >= 0 ? "+" : ""}${targets.muscleMass}%
- Weight loss visual change: ${targets.weightLossKg} kg lighter

Rules:
- Preserve the person's identity, face, pose, camera angle, background, clothing style, and lighting.
- Change only body shape, body fat distribution, muscle definition, waist taper, limb fullness, and overall body composition.
- Keep the result photorealistic and plausible, like a realistic fitness transformation preview.
- Do not add text, labels, measurements, watermarks, nudity, underwear-only styling, or sexualized posing.
- If clothing covers the body, keep clothing realistic while subtly reflecting the target body composition.
`.trim();
}

function normalizeTargets(rawTargets: Partial<VisualizerTargets> | undefined): VisualizerTargets {
  return {
    bodyFat: clamp(Math.round(Number(rawTargets?.bodyFat ?? 20)), 5, 55),
    muscleMass: clamp(Math.round(Number(rawTargets?.muscleMass ?? 0)), -10, 30),
    weightLossKg: clamp(Math.round(Number(rawTargets?.weightLossKg ?? 0)), 0, 30),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ReqBody;
    const { sessionId, imageBase64, estimate } = body;

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Missing paid session" }, { status: 401 });
    }

    await getVisualizerAccessFromSession(sessionId);

    if (!imageBase64) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const model = getReplicateModel();
    if (!model.includes("/")) {
      return NextResponse.json(
        { error: "REPLICATE_VISUALIZER_MODEL must use owner/model format" },
        { status: 500 }
      );
    }

    const targets = normalizeTargets(body.targets);
    const prompt = buildPrompt({ targets, estimate });

    const createRes = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt,
          image_input: [imageBase64],
          aspect_ratio: "match_input_image",
          resolution: "1K",
          output_format: "jpg",
        },
      }),
    });

    const createJson = await createRes.json();

    if (!createRes.ok) {
      console.error("Replicate visualizer create prediction error:", createJson);
      const detail = createJson?.detail || createJson?.error || createJson?.message || null;
      return NextResponse.json(
        {
          error: "Replicate create prediction failed",
          detail,
          details: createJson,
        },
        { status: createRes.status >= 400 && createRes.status <= 599 ? createRes.status : 502 }
      );
    }

    if (!createJson?.urls?.get) {
      return NextResponse.json(
        { error: "Invalid Replicate response", details: createJson },
        { status: 500 }
      );
    }

    return NextResponse.json({
      predictionId: createJson.id,
      getUrl: createJson.urls.get,
      targets,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create visualization";
    console.error("Visualizer generation failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
