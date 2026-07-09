import { NextRequest, NextResponse } from "next/server";

type ReqBody = {
  imageBase64?: string; // ideally a data URL: "data:image/jpeg;base64,..."
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ReqBody;
  const { imageBase64 } = body;

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: "Missing REPLICATE_API_TOKEN" },
      { status: 500 }
    );
  }

  if (!imageBase64) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  const system_prompt = `You are a careful body-composition assistant.
Return ONLY valid JSON. No markdown. No extra text.`;

  const prompt = `
Determine the perceived age and gender of the human in the image. Be as specific as possible and return theses values to the nearest integer.
Estimate the perceived body fat percentage of the individual and take account of the perceived age and gender, as well as all data available around body fat percentage.
Take into account the fat distribution on the body, muscle mass etc.
Determine the accuracy of your estimate and provide an explanation as to why you provided that estimate based on the visuals of the human in the photo. Do not mention results from validated methods like DEXA or multi-frequency BIA. Do not mention muscle or fat history or weight trends. Provide this explanation in a talkative manner as though you are talking to the person.
For "estimation_rationale", do not start with generic comments such as "you look fit", "you look healthy", or "you look like...".
Start immediately with specific visual evidence tied to body-fat estimation (for example: lower-abdomen softness, waist taper, oblique visibility, shoulder-arm separation, chest definition, back/love-handle area).
The first sentence must include at least two concrete visual cues from the image.
Provide a list of things the person in the image to do to help you provide a more accurate estimate.

Return JSON exactly in this shape:
{
  "version": "1.0",
  "photo_assessment": {
    "perceived_gender": "string",
    "perceived_age": "string",
    "body_shape": "string"
  },
  "estimation": {
    "body_fat_percent": number | null,
    "accuracy_rating": "low" | "medium" | "high",
    "estimation_rationale": "string",
    "accuracy_improvements": ["string"]
  }
}

Rules:
- Estimate age to the nearest year. Be as specific as possible.
- Estimate body fat percentage to the nearest integer. Be as specific as possible.
- Return "body_shape" using ONE of these values:
  - For women: "hourglass", "triangle", "rectangle", "inverted-triangle", or "oval"
  - For men: "trapezoid", "triangle", "rectangle", "inverted-triangle", or "oval"
- Take as much time as you need to be as accurate as you possibly can.
- In "estimation_rationale", avoid generic appearance judgments and focus only on specific observable cues.
– Do not provide medical advice or diagnosis. Provide an approximate, appearance-based estimate for fitness tracking.
`.trim();

  try {
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "e526a4c7f3e940fa28e7e6bdf3a00ac35e11f004e10c5fb12b51f576663de814",
        input: {
          prompt,
          system_prompt,
          image_input: [imageBase64],
          reasoning_effort: "low",
          max_completion_tokens: 20000,
        },
      }),
    });

    const createJson = await createRes.json();

    if (!createRes.ok) {
      console.error("Replicate create prediction error:", createJson);
      const upstreamStatus =
        createRes.status >= 400 && createRes.status <= 599 ? createRes.status : 502;
      const detail =
        createJson?.detail ||
        createJson?.error ||
        createJson?.message ||
        null;

      return NextResponse.json(
        {
          error: "Replicate create prediction failed",
          detail,
          details: createJson,
        },
        { status: upstreamStatus }
      );
    }

    if (!createJson?.urls?.get) {
      console.error("Unexpected Replicate response:", createJson);
      return NextResponse.json(
        { error: "Invalid Replicate response", details: createJson },
        { status: 500 }
      );
    }

    // ✅ Return immediately — client will poll status
    return NextResponse.json({
      predictionId: createJson.id,
      getUrl: createJson.urls.get,
    });
  } catch (err) {
    console.error("Replicate call failed:", err);
    return NextResponse.json(
      { error: "Failed to create prediction" },
      { status: 500 }
    );
  }
}
