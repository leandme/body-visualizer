export type BodyShapeKey =
  | "hourglass"
  | "pear"
  | "rectangle"
  | "inverted-triangle"
  | "apple"
  | "trapezoid";

export type BodyShapeGender = "male" | "female";

export type BodyShapeCard = {
  key: BodyShapeKey;
  title: string;
  description: string;
  imageSrc: string;
};

const FEMALE_BODY_SHAPES: BodyShapeCard[] = [
  {
    key: "hourglass",
    title: "Hourglass",
    imageSrc: "/tools/body-shape-analyzer/hourglass-body-type.png",
    description:
      "Balanced shoulder and hip width with a more clearly defined waist.",
  },
  {
    key: "pear",
    title: "Triangle",
    imageSrc: "/tools/body-shape-analyzer/triangle-body-type.png",
    description: "Lower body appears wider than upper body with hip emphasis.",
  },
  {
    key: "rectangle",
    title: "Rectangle",
    imageSrc: "/tools/body-shape-analyzer/rectangle-body-type.png",
    description: "Straighter silhouette with less waist-to-hip contrast.",
  },
  {
    key: "inverted-triangle",
    title: "Inverted Triangle",
    imageSrc: "/tools/body-shape-analyzer/inverted-triangle-body-type.png",
    description: "Upper body appears wider than hips with stronger top-frame emphasis.",
  },
  {
    key: "apple",
    title: "Oval",
    imageSrc: "/tools/body-shape-analyzer/oval-body-type.png",
    description: "More visual fullness tends to collect around the midsection.",
  },
];

const MALE_BODY_SHAPES: BodyShapeCard[] = [
  {
    key: "trapezoid",
    title: "Trapezoid",
    imageSrc: "/tools/body-shape-analyzer/male-trapezoid-body-type.jpg",
    description: "Balanced frame with shoulder width greater than waist width.",
  },
  {
    key: "pear",
    title: "Triangle",
    imageSrc: "/tools/body-shape-analyzer/male-triangle-body-type.jpg",
    description: "Waist and lower frame appear wider than the upper torso.",
  },
  {
    key: "rectangle",
    title: "Rectangle",
    imageSrc: "/tools/body-shape-analyzer/male-rectangle-body-type.jpg",
    description: "Straighter shoulder-to-waist line with less visible taper.",
  },
  {
    key: "inverted-triangle",
    title: "Inverted Triangle",
    imageSrc: "/tools/body-shape-analyzer/male-inverted-triangle-body-type.jpg",
    description: "Upper torso appears broader than hips with a V-taper profile.",
  },
  {
    key: "apple",
    title: "Oval",
    imageSrc: "/tools/body-shape-analyzer/male-oval-body-type.jpg",
    description: "Fullness is more concentrated through the midsection.",
  },
];

function normalizeToken(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\(.*?\)/g, "")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

export function normalizeBodyShapeKey(value: unknown): BodyShapeKey | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;

  const token = normalizeToken(raw);

  if (token.includes("inverted") && token.includes("triangle")) {
    return "inverted-triangle";
  }

  if (token.includes("hourglass")) return "hourglass";
  if (token.includes("trapezoid")) return "trapezoid";
  if (token.includes("rectangle")) return "rectangle";
  if (token.includes("triangle") || token.includes("pear")) return "pear";
  if (token.includes("oval") || token.includes("apple")) return "apple";

  return null;
}

export function coerceBodyShapeForGender(
  key: BodyShapeKey | null,
  gender: BodyShapeGender
): BodyShapeKey | null {
  if (!key) return null;

  if (gender === "male" && key === "hourglass") return "trapezoid";
  if (gender === "female" && key === "trapezoid") return "hourglass";

  return key;
}

export function getBodyShapeCards(gender: BodyShapeGender): BodyShapeCard[] {
  return gender === "female" ? FEMALE_BODY_SHAPES : MALE_BODY_SHAPES;
}

export function getBodyShapeCard(
  gender: BodyShapeGender,
  key: BodyShapeKey | null
): BodyShapeCard | null {
  if (!key) return null;
  const normalized = coerceBodyShapeForGender(key, gender);
  if (!normalized) return null;

  return getBodyShapeCards(gender).find((shape) => shape.key === normalized) ?? null;
}
