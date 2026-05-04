"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type {
  Bone,
  Group,
  Mesh,
  MeshStandardMaterial,
  SkinnedMesh,
  Texture,
} from "three";
import {
  ACESFilmicToneMapping,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  PCFSoftShadowMap,
  SRGBColorSpace,
  TextureLoader,
} from "three";
import {
  Camera,
  Heart,
  Menu,
  MoveHorizontal,
  RotateCcw,
  Ruler,
  Save,
  Share2,
  Weight,
  X,
} from "lucide-react";

type Gender = "male" | "female";
type Units = "imperial" | "metric";
type SyncMode = "linked" | "independent";
type ViewPreset = "front" | "left" | "right" | "back";
type ModelVariant = "legacy" | "mpfb" | "custom" | "realism" | "statistical";
type RenderQualityProfile = "desktop-high" | "mobile-fallback";

type BodyFatBounds = {
  min: number;
  max: number;
};

type Category = {
  label: string;
  color: string;
  note: string;
};

type MeasurementSet = {
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  inseamCm: number;
};

type BodyProfile = {
  gender: Gender;
  units: Units;
  syncMode: SyncMode;
  heightCm: number;
  weightKg: number;
  bodyFatPct: number;
  advancedMeasurementsEnabled: boolean;
  manualMeasurements?: MeasurementSet;
};

type PresetRecord = {
  id: string;
  name: string;
  profile: BodyProfile;
  createdAt: string;
  updatedAt: string;
};

type SnapshotPayload = {
  gender: Gender;
  units: Units;
  heightCm: number;
  weightKg: number;
  bodyFatPct: number;
  bmi: number;
  measurements: MeasurementSet;
  timestampIso: string;
  presetName: string;
};

type MorphChannel =
  | "macro_weight"
  | "macro_muscle"
  | "macro_height"
  | "local_torso_fat"
  | "local_waist_fat"
  | "local_glute_fat"
  | "local_chest_fat"
  | "local_face_fat"
  | "local_neck_fat"
  | "local_torso_muscle"
  | "local_chest_muscle"
  | "local_shoulder_muscle"
  | "local_arms_fat"
  | "local_forearms_fat"
  | "local_arms_muscle"
  | "local_forearms_muscle"
  | "local_legs_fat"
  | "local_calves_fat"
  | "local_legs_muscle"
  | "local_calves_muscle"
  | "local_thigh_shape"
  | "local_calf_shape";

type MorphAdapter = {
  id: ModelVariant;
  label: string;
  paths?: Record<Gender, string>;
  aliases?: Partial<Record<MorphChannel, string[]>>;
};

type MaterialTextureSet = {
  albedo?: string;
  normal?: string;
  roughness?: string;
  metalness?: string;
  ao?: string;
  alpha?: string;
  emissive?: string;
};

type MaterialSet = {
  id: string;
  baseColor?: string;
  roughness?: number;
  metalness?: number;
  envMapIntensity?: number;
  normalScale?: number;
  alphaTest?: number;
  transparent?: boolean;
  texturePaths?: MaterialTextureSet;
};

type RealismAssetGenderConfig = {
  primaryModelPath: string;
  desktopModelPath?: string;
  mobileModelPath?: string;
  fallbackModelPath?: string;
  materialSet?: MaterialSet;
  morphMap?: Partial<Record<MorphChannel, string[]>>;
  lod?: {
    desktopLabel?: string;
    mobileLabel?: string;
  };
  license: {
    source: string;
    sku: string;
    productName: string;
    productUrl: string;
    rightsNote: string;
    licenseUrl?: string;
  };
};

type RealismAssetManifest = {
  manifestVersion: number;
  generatedAt: string;
  sourceNote: string;
  defaults: {
    preferredVariant: "statistical" | "realism" | "mpfb" | "custom" | "legacy";
    mobileProfileMaxTextureSize: number;
  };
  gender: Record<Gender, RealismAssetGenderConfig>;
};

type StatisticalShapeInfo = {
  ordering: string[];
  means: number[];
  covariance: number[][];
  filenames?: string[];
};

type StatisticalShapeData = {
  shapeInfo: StatisticalShapeInfo;
  baseVertices: Array<[number, number, number]>;
  baseFaceIndices: Array<[number, number, number]>;
  morphTargetDeltas: Record<string, Array<[number, number, number]>>;
};

type MeasurementAdjustments = {
  chestDelta: number;
  waistDelta: number;
  hipsDelta: number;
  inseamDelta: number;
};

const HEIGHT_CM_MIN = 145;
const HEIGHT_CM_MAX = 210;
const WEIGHT_KG_MIN = 40;
const WEIGHT_KG_MAX = 220;
const BMI_MIN = 16;
const BMI_MAX = 45;
const MODEL_AGE = 30;

const LEGACY_FRONT_MODEL_YAW = Math.PI / 2;
const MODERN_FRONT_MODEL_YAW = 0;

const STORAGE_KEY = "body-visualizer-presets-v1";
const REALISM_MANIFEST_PATH = "/models/body-visualizer/realism/asset-manifest.json";

const LEGACY_MODEL_PATH = "/models/body-visualizer/male_base_mesh.glb";
const MPFB_MODEL_PATHS: Record<Gender, string> = {
  male: "/models/body-visualizer/mpfb/body_male_v1.glb",
  female: "/models/body-visualizer/mpfb/body_female_v1.glb",
};

const CUSTOM_MODEL_PATHS: Record<Gender, string> = {
  male: "/models/body-visualizer/custom/body_male_v2.glb",
  female: "/models/body-visualizer/custom/body_female_v2.glb",
};

const STATISTICAL_DATA_PATHS: Record<Gender, string> = {
  male: "/models/body-visualizer/statistical/male_shape_data.json",
  female: "/models/body-visualizer/statistical/female_shape_data.json",
};

const TURBOSQUID_MODEL_ROOT = "/models/body-visualizer/realism/premium/";
const TURBOSQUID_HIDDEN_MESH_PATTERNS = [
  "hair",
  "eyebrow",
  "eyelash",
  "eyeball",
  "eyeshadow",
  "teeth",
  "hair_cap",
  "tongue",
  "gums",
  "oral",
  "mouth_inner",
];

const TURBOSQUID_REGION_TEXTURES: Record<
  Gender,
  Record<"head" | "torso" | "arms" | "legs" | "underwear", MaterialTextureSet>
> = {
  male: {
    head: {
      albedo: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Head_Bald_BaseColor.png",
      normal: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Head_Normal.png",
      roughness:
        "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Head_Bald_OcclusionRoughnessMetallic.png",
      metalness:
        "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Head_Bald_OcclusionRoughnessMetallic.png",
      ao: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Head_Bald_OcclusionRoughnessMetallic.png",
    },
    torso: {
      albedo: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Torso_BaseColor.png",
      normal: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Torso_Normal.png",
      roughness:
        "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Torso_OcclusionRoughnessMetallic.png",
      metalness:
        "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Torso_OcclusionRoughnessMetallic.png",
      ao: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Torso_OcclusionRoughnessMetallic.png",
    },
    arms: {
      albedo: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Arms_BaseColor.png",
      normal: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Arms_Normal.png",
      roughness:
        "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Arms_OcclusionRoughnessMetallic.png",
      metalness:
        "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Arms_OcclusionRoughnessMetallic.png",
      ao: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Arms_OcclusionRoughnessMetallic.png",
    },
    legs: {
      albedo: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Legs_BaseColor.png",
      normal: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Legs_Normal.png",
      roughness:
        "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Legs_OcclusionRoughnessMetallic.png",
      metalness:
        "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Legs_OcclusionRoughnessMetallic.png",
      ao: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Legs_OcclusionRoughnessMetallic.png",
    },
    underwear: {
      albedo: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Underwear_BaseColor.png",
      normal: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Underwear_Normal.png",
      roughness:
        "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Underwear_OcclusionRoughnessMetallic.png",
      metalness:
        "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Underwear_OcclusionRoughnessMetallic.png",
      ao: "/models/body-visualizer/turbosquid/Male_Base_Textures/Body_Male/T_Male_Underwear_OcclusionRoughnessMetallic.png",
    },
  },
  female: {
    head: {
      albedo: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Head_Bold_BaseColor.png",
      normal: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Head_Normal.png",
      roughness:
        "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Head_Bald_OcclusionRoughnessMetallic.png",
      metalness:
        "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Head_Bald_OcclusionRoughnessMetallic.png",
      ao: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Head_Bald_OcclusionRoughnessMetallic.png",
    },
    torso: {
      albedo: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Torso_BaseColor.png",
      normal: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Torso_Normal.png",
      roughness:
        "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Torso_OcclusionRoughnessMetallic.png",
      metalness:
        "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Torso_OcclusionRoughnessMetallic.png",
      ao: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Torso_OcclusionRoughnessMetallic.png",
    },
    arms: {
      albedo: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Arms_BaseColor.png",
      normal: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Arms_Normal.png",
      roughness:
        "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Arms_OcclusionRoughnessMetallic.png",
      metalness:
        "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Arms_OcclusionRoughnessMetallic.png",
      ao: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Arms_OcclusionRoughnessMetallic.png",
    },
    legs: {
      albedo: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Legs_BaseColor.png",
      normal: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Legs_Normal.png",
      roughness:
        "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Legs_OcclusionRoughnessMetallic.png",
      metalness:
        "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Legs_OcclusionRoughnessMetallic.png",
      ao: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Legs_OcclusionRoughnessMetallic.png",
    },
    underwear: {
      albedo: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Underwear_BaseColor.png",
      normal: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Underwear_Normal.png",
      roughness:
        "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Underwear_OcclusionRoughnessMetallic.png",
      metalness:
        "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Underwear_OcclusionRoughnessMetallic.png",
      ao: "/models/body-visualizer/turbosquid/Female_Base_Textures/Body_Female/T_Female_Underwear_OcclusionRoughnessMetallic.png",
    },
  },
};

const textureLoader = new TextureLoader();
const textureCache = new Map<string, Texture>();

function getCachedTexture(path: string) {
  if (!textureCache.has(path)) {
    const texture = textureLoader.load(path);
    texture.flipY = false;
    if (path.toLowerCase().includes("basecolor")) {
      texture.colorSpace = SRGBColorSpace;
    }
    texture.needsUpdate = true;
    textureCache.set(path, texture);
  }
  return textureCache.get(path)!;
}

function shouldHideTurboSquidMesh(meshName: string) {
  const normalized = meshName.toLowerCase();
  return TURBOSQUID_HIDDEN_MESH_PATTERNS.some((token) => normalized.includes(token));
}

function resolveTurboSquidRegion(meshName: string): keyof (typeof TURBOSQUID_REGION_TEXTURES)["male"] | null {
  if (meshName.includes("Torso")) return "torso";
  if (meshName.includes("Arms")) return "arms";
  if (meshName.includes("Legs")) return "legs";
  if (meshName.includes("Underwear")) return "underwear";
  if (meshName.includes("Head")) return "head";
  return null;
}

function ensureUv2(mesh: Mesh) {
  const geometry = mesh.geometry as BufferGeometry;
  if (!geometry?.attributes?.uv || geometry.attributes.uv2) return;
  geometry.setAttribute("uv2", geometry.attributes.uv);
}

const MODEL_ADAPTERS: Record<ModelVariant, MorphAdapter> = {
  statistical: {
    id: "statistical",
    label: "Statistical morph render",
  },
  realism: {
    id: "realism",
    label: "Realistic premium render",
    aliases: {},
  },
  custom: {
    id: "custom",
    label: "Custom high-detail morph render",
    paths: CUSTOM_MODEL_PATHS,
    aliases: {},
  },
  mpfb: {
    id: "mpfb",
    label: "MPFB morph-target render",
    paths: MPFB_MODEL_PATHS,
    aliases: {},
  },
  legacy: {
    id: "legacy",
    label: "Legacy fallback render",
  },
};

const DEFAULT_PROFILE_BY_GENDER: Record<Gender, Omit<BodyProfile, "gender">> = {
  male: {
    units: "imperial",
    syncMode: "linked",
    heightCm: inToCm(70),
    weightKg: lbToKg(181),
    bodyFatPct: 22,
    advancedMeasurementsEnabled: true,
  },
  female: {
    units: "imperial",
    syncMode: "linked",
    heightCm: inToCm(65),
    weightKg: lbToKg(141),
    bodyFatPct: 31,
    advancedMeasurementsEnabled: true,
  },
};

const SLIDER_BOUNDS_CM = {
  chestCm: { min: 70, max: 150, step: 0.5 },
  waistCm: { min: 55, max: 145, step: 0.5 },
  hipsCm: { min: 75, max: 160, step: 0.5 },
  inseamCm: { min: 55, max: 115, step: 0.5 },
};

const MORPH_CHANNEL_ALIASES: Record<MorphChannel, string[]> = {
  macro_weight: ["macro_weight", "macro-weight", "weight", "maxweight"],
  macro_muscle: ["macro_muscle", "macro-muscle", "muscle", "maxmuscle"],
  macro_height: ["macro_height", "macro-height", "height", "maxheight"],
  local_torso_fat: ["local_torso_fat", "torso_fat", "stomach_tone_decr", "head_fat_incr"],
  local_waist_fat: ["local_waist_fat", "waist_fat", "hip_waist_up"],
  local_glute_fat: ["local_glute_fat", "glute_fat", "buttocks_volume_incr"],
  local_chest_fat: ["local_chest_fat", "chest_fat", "torso_scale_depth_incr"],
  local_face_fat: ["local_face_fat", "face_fat", "head_fat_incr", "cheek_volume_incr"],
  local_neck_fat: ["local_neck_fat", "neck_fat", "neck_double_incr"],
  local_torso_muscle: [
    "local_torso_muscle",
    "torso_muscle",
    "torso_muscle_pectoral_incr",
    "torso_muscle_dorsi_incr",
  ],
  local_chest_muscle: ["local_chest_muscle", "chest_muscle", "torso_muscle_pectoral_incr"],
  local_shoulder_muscle: [
    "local_shoulder_muscle",
    "shoulder_muscle",
    "upperarm_shoulder_muscle_incr",
  ],
  local_arms_fat: ["local_arms_fat", "arms_fat", "upperarm_fat_incr", "lowerarm_fat_incr"],
  local_forearms_fat: ["local_forearms_fat", "forearms_fat", "lowerarm_fat_incr"],
  local_arms_muscle: [
    "local_arms_muscle",
    "arms_muscle",
    "upperarm_muscle_incr",
    "lowerarm_muscle_incr",
  ],
  local_forearms_muscle: ["local_forearms_muscle", "forearms_muscle", "lowerarm_muscle_incr"],
  local_legs_fat: ["local_legs_fat", "legs_fat", "upperleg_fat_incr", "lowerleg_fat_incr"],
  local_calves_fat: ["local_calves_fat", "calves_fat", "lowerleg_fat_incr"],
  local_legs_muscle: [
    "local_legs_muscle",
    "legs_muscle",
    "upperleg_muscle_incr",
    "lowerleg_muscle_incr",
  ],
  local_calves_muscle: ["local_calves_muscle", "calves_muscle", "lowerleg_muscle_incr"],
  local_thigh_shape: [
    "local_thigh_shape",
    "thigh_shape",
    "upperleg_scale_horiz_incr",
    "upperleg_scale_depth_incr",
  ],
  local_calf_shape: [
    "local_calf_shape",
    "calf_shape",
    "lowerleg_scale_horiz_incr",
    "lowerleg_scale_depth_incr",
  ],
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function round(n: number, decimals = 1) {
  const m = Math.pow(10, decimals);
  return Math.round(n * m) / m;
}

function toRangePercent(value: number, min: number, max: number) {
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

function buildBandedGradient(
  min: number,
  max: number,
  stops: Array<{ until: number; color: string }>
) {
  if (!stops.length) return "linear-gradient(90deg, #d1d5db 0%, #d1d5db 100%)";

  let cursor = 0;
  const parts: string[] = [];

  stops.forEach((stop, index) => {
    const end = toRangePercent(stop.until, min, max);
    parts.push(`${stop.color} ${cursor}%`, `${stop.color} ${end}%`);
    cursor = end;

    if (index === stops.length - 1 && end < 100) {
      parts.push(`${stop.color} ${end}%`, `${stop.color} 100%`);
    }
  });

  return `linear-gradient(90deg, ${parts.join(", ")})`;
}

function kgToLb(kg: number) {
  return kg * 2.2046226218;
}

function lbToKg(lb: number) {
  return lb / 2.2046226218;
}

function cmToIn(cm: number) {
  return cm / 2.54;
}

function inToCm(inches: number) {
  return inches * 2.54;
}

function toWeightCubeRootKg(weightKg: number) {
  return Math.pow(Math.max(weightKg, 0.001), 1 / 3);
}

function invertMatrix(matrix: number[][]) {
  const n = matrix.length;
  if (!n || matrix.some((row) => row.length !== n)) return null;

  const a = matrix.map((row) => row.slice());
  const inv = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );

  for (let i = 0; i < n; i += 1) {
    let pivot = i;
    for (let r = i + 1; r < n; r += 1) {
      if (Math.abs(a[r][i]) > Math.abs(a[pivot][i])) pivot = r;
    }

    if (Math.abs(a[pivot][i]) < 1e-12) return null;

    if (pivot !== i) {
      [a[i], a[pivot]] = [a[pivot], a[i]];
      [inv[i], inv[pivot]] = [inv[pivot], inv[i]];
    }

    const div = a[i][i];
    for (let c = 0; c < n; c += 1) {
      a[i][c] /= div;
      inv[i][c] /= div;
    }

    for (let r = 0; r < n; r += 1) {
      if (r === i) continue;
      const factor = a[r][i];
      if (Math.abs(factor) < 1e-12) continue;
      for (let c = 0; c < n; c += 1) {
        a[r][c] -= factor * a[i][c];
        inv[r][c] -= factor * inv[i][c];
      }
    }
  }

  return inv;
}

function multiplyMatrixVector(matrix: number[][], vector: number[]) {
  return matrix.map((row) => row.reduce((sum, value, i) => sum + value * vector[i], 0));
}

function multiplyMatrices(a: number[][], b: number[][]) {
  const rows = a.length;
  const cols = b[0]?.length ?? 0;
  const inner = b.length;
  const out = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      let sum = 0;
      for (let k = 0; k < inner; k += 1) {
        sum += (a[r]?.[k] ?? 0) * (b[k]?.[c] ?? 0);
      }
      out[r][c] = sum;
    }
  }
  return out;
}

function normalizeVectorTriplets(input: unknown): Array<[number, number, number]> {
  if (!Array.isArray(input)) return [];

  if (input.length > 0 && Array.isArray(input[0])) {
    const out: Array<[number, number, number]> = [];
    for (const entry of input) {
      if (!Array.isArray(entry) || entry.length < 3) continue;
      const x = Number(entry[0]);
      const y = Number(entry[1]);
      const z = Number(entry[2]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
      out.push([x, y, z]);
    }
    return out;
  }

  const out: Array<[number, number, number]> = [];
  for (let i = 0; i + 2 < input.length; i += 3) {
    const x = Number(input[i]);
    const y = Number(input[i + 1]);
    const z = Number(input[i + 2]);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
    out.push([x, y, z]);
  }
  return out;
}

function normalizeFaceTriplets(input: unknown): Array<[number, number, number]> {
  if (!Array.isArray(input)) return [];
  if (input.length > 0 && Array.isArray(input[0])) {
    return input
      .map((entry) => {
        if (!Array.isArray(entry) || entry.length < 3) return null;
        const a = Number(entry[0]);
        const b = Number(entry[1]);
        const c = Number(entry[2]);
        if (!Number.isInteger(a) || !Number.isInteger(b) || !Number.isInteger(c)) return null;
        return [a, b, c] as [number, number, number];
      })
      .filter(Boolean) as Array<[number, number, number]>;
  }

  const out: Array<[number, number, number]> = [];
  for (let i = 0; i + 2 < input.length; i += 3) {
    const a = Number(input[i]);
    const b = Number(input[i + 1]);
    const c = Number(input[i + 2]);
    if (!Number.isInteger(a) || !Number.isInteger(b) || !Number.isInteger(c)) continue;
    out.push([a, b, c]);
  }
  return out;
}

function normalizeStatisticalShapeData(raw: unknown): StatisticalShapeData | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const shapeInfoRaw =
    (source.shapeInfo as Record<string, unknown> | undefined) ??
    ({
      ordering: source.ordering,
      means: source.means,
      covariance: source.covariance,
      filenames: source.filenames,
    } as Record<string, unknown>);

  const ordering = Array.isArray(shapeInfoRaw.ordering)
    ? shapeInfoRaw.ordering.map((item) => String(item))
    : [];
  const means = Array.isArray(shapeInfoRaw.means) ? shapeInfoRaw.means.map((value) => Number(value)) : [];
  const covariance = Array.isArray(shapeInfoRaw.covariance)
    ? shapeInfoRaw.covariance.map((row) => (Array.isArray(row) ? row.map((value) => Number(value)) : []))
    : [];

  const baseVertices = normalizeVectorTriplets(source.baseVertices ?? source.vertices);
  const baseFaceIndices = normalizeFaceTriplets(source.baseFaceIndices ?? source.faceIndices ?? source.faces);

  const morphRaw =
    (source.morphTargetDeltas as Record<string, unknown> | undefined) ??
    (source.morphTargets as Record<string, unknown> | undefined) ??
    (source.targets as Record<string, unknown> | undefined) ??
    (source.deltas as Record<string, unknown> | undefined);

  const morphTargetDeltas: Record<string, Array<[number, number, number]>> = {};
  if (morphRaw && typeof morphRaw === "object") {
    for (const [name, values] of Object.entries(morphRaw)) {
      const deltas = normalizeVectorTriplets(values);
      if (deltas.length) morphTargetDeltas[name] = deltas;
    }
  }

  if (!ordering.length || !means.length || !covariance.length || !baseVertices.length || !baseFaceIndices.length) {
    return null;
  }

  return {
    shapeInfo: {
      ordering,
      means,
      covariance,
      filenames: Array.isArray(shapeInfoRaw.filenames)
        ? shapeInfoRaw.filenames.map((item) => String(item))
        : undefined,
    },
    baseVertices,
    baseFaceIndices,
    morphTargetDeltas,
  };
}

function solveConditionalGaussian(
  info: StatisticalShapeInfo,
  knownValuesByName: Partial<Record<string, number>>
) {
  const ordering = info.ordering;
  const means = info.means;
  const covariance = info.covariance;

  const knownIndices: number[] = [];
  const unknownIndices: number[] = [];

  for (let i = 0; i < ordering.length; i += 1) {
    const value = knownValuesByName[ordering[i]];
    if (typeof value === "number" && Number.isFinite(value)) knownIndices.push(i);
    else unknownIndices.push(i);
  }

  const solved = means.slice();
  for (const index of knownIndices) {
    solved[index] = knownValuesByName[ordering[index]] as number;
  }
  if (!knownIndices.length || !unknownIndices.length) {
    return solved;
  }

  const sigmaKK = knownIndices.map((r) => knownIndices.map((c) => covariance[r]?.[c] ?? 0));
  const sigmaUK = unknownIndices.map((r) => knownIndices.map((c) => covariance[r]?.[c] ?? 0));
  const sigmaKKInv = invertMatrix(sigmaKK);
  if (!sigmaKKInv) return solved;

  const deltaKnown = knownIndices.map((index) => solved[index] - means[index]);
  const gain = multiplyMatrices(sigmaUK, sigmaKKInv);
  const deltaUnknown = multiplyMatrixVector(gain, deltaKnown);

  unknownIndices.forEach((index, idx) => {
    const variance = Math.max(covariance[index]?.[index] ?? 0, 0);
    const std = Math.sqrt(variance);
    const unconstrained = means[index] + (deltaUnknown[idx] ?? 0);
    // Keep solution numerically stable around plausible ranges.
    solved[index] = std > 0 ? clamp(unconstrained, means[index] - 4 * std, means[index] + 4 * std) : unconstrained;
  });

  return solved;
}

function buildStatisticalKnownValues(props: {
  heightCm: number;
  weightKg: number;
  measurements: MeasurementSet;
  bodyFatPct: number;
  gender: Gender;
}) {
  const { heightCm, weightKg, measurements, bodyFatPct, gender } = props;
  const fitnessHours = clamp(
    round((gender === "male" ? 28 : 26) - bodyFatPct * 0.62 + Math.max(0, 24 - bmiFrom(weightKg, heightCm)) * 0.22, 1),
    0,
    20
  );
  return {
    stature_mm: heightCm * 10,
    weight_cube_root_kg: toWeightCubeRootKg(weightKg),
    chest_circumference_mm: measurements.chestCm * 10,
    waist_circumference_pref_mm: measurements.waistCm * 10,
    hip_circumference_maximum_mm: measurements.hipsCm * 10,
    inseam_right_mm: measurements.inseamCm * 10,
    fitness_hours: fitnessHours,
  } satisfies Partial<Record<string, number>>;
}

function bmiFrom(weightKg: number, heightCm: number) {
  const hM = heightCm / 100;
  if (hM <= 0) return 0;
  return weightKg / (hM * hM);
}

function weightFromBmi(bmi: number, heightCm: number) {
  const hM = heightCm / 100;
  return bmi * hM * hM;
}

function bodyFatBounds(gender: Gender): BodyFatBounds {
  if (gender === "male") return { min: 6, max: 45 };
  return { min: 14, max: 55 };
}

function predictBodyFatFromBmi(bmi: number, gender: Gender) {
  const sexFactor = gender === "male" ? 1 : 0;
  return 1.2 * bmi + 0.23 * MODEL_AGE - 10.8 * sexFactor - 5.4;
}

function bmiFromPredictedBodyFat(bodyFatPct: number, gender: Gender) {
  const sexFactor = gender === "male" ? 1 : 0;
  return (bodyFatPct - 0.23 * MODEL_AGE + 10.8 * sexFactor + 5.4) / 1.2;
}

function bmiCategory(bmi: number): Category {
  if (bmi < 18.5) {
    return {
      label: "Underweight",
      color: "#4f86ff",
      note: "Below the standard BMI range.",
    };
  }
  if (bmi < 25) {
    return {
      label: "Normal weight",
      color: "#66cf7f",
      note: "Within the standard BMI range.",
    };
  }
  if (bmi < 30) {
    return {
      label: "Overweight",
      color: "#edca53",
      note: "Above the standard BMI range.",
    };
  }
  return {
    label: "Obesity",
    color: "#ef5f7b",
    note: "Higher BMI range.",
  };
}

function bodyFatCategory(gender: Gender, bodyFatPct: number): Category {
  if (gender === "male") {
    if (bodyFatPct < 10) return { label: "Lean", color: "#52a1ff", note: "Lower body-fat range." };
    if (bodyFatPct < 18) return { label: "Fit", color: "#66cf7f", note: "Fitness-oriented range." };
    if (bodyFatPct < 25) return { label: "Average", color: "#8ad66e", note: "Typical range." };
    if (bodyFatPct < 32) return { label: "High", color: "#edca53", note: "Higher body-fat range." };
    return { label: "Very high", color: "#ef5f7b", note: "Elevated body-fat range." };
  }

  if (bodyFatPct < 18) return { label: "Lean", color: "#52a1ff", note: "Lower body-fat range." };
  if (bodyFatPct < 28) return { label: "Fit", color: "#66cf7f", note: "Fitness-oriented range." };
  if (bodyFatPct < 35) return { label: "Average", color: "#8ad66e", note: "Typical range." };
  if (bodyFatPct < 42) return { label: "High", color: "#edca53", note: "Higher body-fat range." };
  return { label: "Very high", color: "#ef5f7b", note: "Elevated body-fat range." };
}

function estimateMeasurements(props: {
  gender: Gender;
  heightCm: number;
  weightKg: number;
  bodyFatPct: number;
}) {
  const { gender, heightCm, weightKg, bodyFatPct } = props;
  const bmi = bmiFrom(weightKg, heightCm);
  const fatNorm = clamp((bodyFatPct - (gender === "male" ? 14 : 24)) / 22, -0.5, 1.4);
  const bmiNorm = clamp((bmi - 22) / 10, -0.7, 1.6);

  const chestBase = heightCm * (gender === "male" ? 0.525 : 0.505);
  const waistBase = heightCm * (gender === "male" ? 0.42 : 0.395);
  const hipsBase = heightCm * (gender === "male" ? 0.505 : 0.535);
  const inseamBase = heightCm * (gender === "male" ? 0.455 : 0.447);

  const chestCm = chestBase * (1 + 0.1 * fatNorm + 0.075 * bmiNorm);
  const waistCm = waistBase * (1 + 0.18 * fatNorm + 0.09 * bmiNorm);
  const hipsCm = hipsBase * (1 + (gender === "female" ? 0.14 : 0.1) * fatNorm + 0.05 * bmiNorm);
  const inseamCm = inseamBase * (1 + 0.01 * (clamp(heightCm, HEIGHT_CM_MIN, HEIGHT_CM_MAX) - 175) / 25);

  return {
    chestCm: clamp(round(chestCm, 1), SLIDER_BOUNDS_CM.chestCm.min, SLIDER_BOUNDS_CM.chestCm.max),
    waistCm: clamp(round(waistCm, 1), SLIDER_BOUNDS_CM.waistCm.min, SLIDER_BOUNDS_CM.waistCm.max),
    hipsCm: clamp(round(hipsCm, 1), SLIDER_BOUNDS_CM.hipsCm.min, SLIDER_BOUNDS_CM.hipsCm.max),
    inseamCm: clamp(round(inseamCm, 1), SLIDER_BOUNDS_CM.inseamCm.min, SLIDER_BOUNDS_CM.inseamCm.max),
  };
}

function normalizeMorphName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveMorphIndex(
  dictionary: Record<string, number>,
  channel: MorphChannel,
  adapter: MorphAdapter
): number | null {
  const names = Object.keys(dictionary);
  if (!names.length) return null;

  const channelAliases = adapter.aliases?.[channel]?.length
    ? adapter.aliases[channel]!
    : MORPH_CHANNEL_ALIASES[channel];

  const normalizedToIndex = new Map<string, number>();
  names.forEach((name) => normalizedToIndex.set(normalizeMorphName(name), dictionary[name]));

  for (const alias of channelAliases) {
    const exact = normalizedToIndex.get(normalizeMorphName(alias));
    if (typeof exact === "number") return exact;
  }

  for (const alias of channelAliases) {
    const aliasNorm = normalizeMorphName(alias);
    for (const [normalizedName, index] of normalizedToIndex.entries()) {
      if (normalizedName.includes(aliasNorm)) return index;
    }
  }

  return null;
}

function buildMeasurementAdjustments(effective: MeasurementSet, derived: MeasurementSet): MeasurementAdjustments {
  const chestDelta = clamp((effective.chestCm - derived.chestCm) / Math.max(derived.chestCm, 1), -0.35, 0.35);
  const waistDelta = clamp((effective.waistCm - derived.waistCm) / Math.max(derived.waistCm, 1), -0.35, 0.35);
  const hipsDelta = clamp((effective.hipsCm - derived.hipsCm) / Math.max(derived.hipsCm, 1), -0.35, 0.35);
  const inseamDelta = clamp((effective.inseamCm - derived.inseamCm) / Math.max(derived.inseamCm, 1), -0.3, 0.3);

  return {
    chestDelta,
    waistDelta,
    hipsDelta,
    inseamDelta,
  };
}

function buildMorphChannels(props: {
  gender: Gender;
  bmi: number;
  bodyFatPct: number;
  heightCm: number;
  measurementAdjustments: MeasurementAdjustments;
}): Record<MorphChannel, number> {
  const { gender, bmi, bodyFatPct, heightCm, measurementAdjustments } = props;
  const bfBounds = bodyFatBounds(gender);

  const fatNorm = clamp((bodyFatPct - bfBounds.min) / (bfBounds.max - bfBounds.min), 0, 1);
  const bmiNorm = clamp((bmi - BMI_MIN) / (BMI_MAX - BMI_MIN), 0, 1);
  const heightNorm = clamp((heightCm - HEIGHT_CM_MIN) / (HEIGHT_CM_MAX - HEIGHT_CM_MIN), 0, 1);
  const leanMassProxy = bmi * (1 - bodyFatPct / 100);
  const rawLeanProxy = clamp((leanMassProxy - (gender === "male" ? 14.2 : 13.4)) / 11.5, 0, 1);
  const lowFatSignal =
    1 -
    smoothstep(
      gender === "male" ? 18 : 28,
      gender === "male" ? 30 : 41,
      clamp(bodyFatPct, bfBounds.min, bfBounds.max)
    );
  const muscularityLift = smoothstep(
    gender === "male" ? 9.5 : 8.8,
    gender === "male" ? 17.5 : 16.5,
    leanMassProxy
  );
  const leanProxy = clamp(rawLeanProxy * 0.62 + muscularityLift * 0.38, 0, 1);

  const fatCurve = Math.pow(fatNorm, 1.14);
  const fatMid = smoothstep(0.2, 0.62, fatNorm);
  const fatHigh = smoothstep(0.58, 0.9, fatNorm);
  const bmiCurve = Math.pow(bmiNorm, 1.06);
  const fatSuppression = Math.pow(fatNorm, 1.32);
  const leanCurve = Math.pow(clamp(leanProxy * 0.7 + lowFatSignal * 0.3, 0, 1), 0.82);

  const torsoFat = clamp(
    0.32 * fatCurve + 0.46 * fatMid + 0.25 * fatHigh + 0.12 * bmiCurve + measurementAdjustments.waistDelta * 0.95,
    0,
    1
  );
  const waistFat = clamp(
    0.3 * fatCurve + 0.46 * fatMid + 0.28 * fatHigh + 0.1 * bmiCurve + measurementAdjustments.waistDelta * 1.2,
    0,
    1
  );
  const gluteFat = clamp(
    (0.24 * fatCurve + 0.38 * fatMid + 0.24 * fatHigh) * (gender === "female" ? 1.25 : 0.9) +
      measurementAdjustments.hipsDelta * 1.05,
    0,
    1
  );
  const chestFat = clamp(
    (0.2 * fatCurve + 0.24 * fatMid + 0.1 * bmiCurve) * (gender === "female" ? 1.12 : 0.9) +
      measurementAdjustments.chestDelta * 1.1,
    0,
    1
  );

  const faceFat = clamp(0.16 * fatCurve + 0.27 * fatMid + 0.24 * fatHigh, 0, 1);
  const neckFat = clamp(0.11 * fatCurve + 0.2 * fatMid + 0.22 * fatHigh, 0, 1);

  const torsoMuscle = clamp(0.08 + 0.94 * leanCurve + 0.22 * lowFatSignal - 0.58 * fatSuppression, 0, 1);
  const chestMuscle = clamp(
    (0.08 + 0.9 * leanCurve + 0.18 * lowFatSignal - 0.52 * fatSuppression) *
      (gender === "male" ? 1.06 : 0.84),
    0,
    1
  );
  const shoulderMuscle = clamp(
    (0.1 + 0.95 * leanCurve + 0.24 * lowFatSignal - 0.45 * fatSuppression) *
      (gender === "male" ? 1.1 : 0.82),
    0,
    1
  );

  const armFat = clamp(
    0.25 * fatCurve + 0.32 * fatMid + 0.1 * bmiCurve + measurementAdjustments.chestDelta * 0.25,
    0,
    1
  );
  const forearmFat = clamp(0.18 * fatCurve + 0.22 * fatMid, 0, 1);
  const armMuscle = clamp(
    (0.08 + 0.92 * leanCurve + 0.16 * lowFatSignal - 0.48 * fatSuppression) * (gender === "female" ? 0.94 : 1.06),
    0,
    1
  );
  const forearmMuscle = clamp(
    (0.1 + 0.8 * leanCurve + 0.13 * lowFatSignal - 0.36 * fatSuppression) * (gender === "female" ? 0.92 : 1.05),
    0,
    1
  );

  const legFat = clamp(
    (0.34 * fatCurve + 0.4 * fatMid + 0.14 * bmiCurve) * (gender === "female" ? 1.14 : 0.96) +
      measurementAdjustments.hipsDelta * 0.34 +
      measurementAdjustments.inseamDelta * 0.26,
    0,
    1
  );
  const calfFat = clamp(
    (0.2 * fatCurve + 0.24 * fatMid + 0.06 * bmiCurve) * (gender === "female" ? 1.05 : 0.95) +
      measurementAdjustments.inseamDelta * 0.2,
    0,
    1
  );
  const legMuscle = clamp(
    (0.08 + 0.86 * leanCurve + 0.16 * lowFatSignal - 0.42 * fatSuppression) * (gender === "female" ? 0.99 : 1.01),
    0,
    1
  );
  const calfMuscle = clamp(
    (0.1 + 0.74 * leanCurve + 0.12 * lowFatSignal - 0.32 * fatSuppression) * (gender === "female" ? 0.94 : 1.04),
    0,
    1
  );
  const thighShape = clamp(
    (0.2 + 0.46 * fatMid + 0.22 * leanCurve) * (gender === "female" ? 1.16 : 0.95) +
      measurementAdjustments.hipsDelta * 0.8 +
      measurementAdjustments.inseamDelta * 0.22,
    0,
    1
  );
  const calfShape = clamp(
    (0.16 + 0.3 * fatMid + 0.22 * leanCurve) * (gender === "female" ? 1.05 : 0.98) +
      measurementAdjustments.inseamDelta * 0.42,
    0,
    1
  );

  const macroAdjust =
    measurementAdjustments.chestDelta * 0.2 +
    measurementAdjustments.waistDelta * 0.28 +
    measurementAdjustments.hipsDelta * 0.22;

  return {
    macro_weight: clamp(0.28 + 0.52 * bmiCurve + 0.4 * fatCurve + 0.12 * fatHigh + macroAdjust, 0, 1),
    macro_muscle: clamp(0.06 + 1.02 * leanCurve + 0.18 * lowFatSignal - 0.5 * fatSuppression, 0, 1),
    macro_height: clamp(Math.pow(heightNorm, 1.04) + measurementAdjustments.inseamDelta * 0.28, 0, 1),
    local_torso_fat: torsoFat,
    local_waist_fat: waistFat,
    local_glute_fat: gluteFat,
    local_chest_fat: chestFat,
    local_face_fat: faceFat,
    local_neck_fat: neckFat,
    local_torso_muscle: torsoMuscle,
    local_chest_muscle: chestMuscle,
    local_shoulder_muscle: shoulderMuscle,
    local_arms_fat: armFat,
    local_forearms_fat: forearmFat,
    local_arms_muscle: armMuscle,
    local_forearms_muscle: forearmMuscle,
    local_legs_fat: legFat,
    local_calves_fat: calfFat,
    local_legs_muscle: legMuscle,
    local_calves_muscle: calfMuscle,
    local_thigh_shape: thighShape,
    local_calf_shape: calfShape,
  };
}

function loadMaterialTextures(texturePaths?: MaterialTextureSet) {
  if (!texturePaths) return {};

  const resolveTexture = (path?: string) => {
    if (!path) return null;
    try {
      return getCachedTexture(path);
    } catch {
      return null;
    }
  };

  return {
    map: resolveTexture(texturePaths.albedo),
    normalMap: resolveTexture(texturePaths.normal),
    roughnessMap: resolveTexture(texturePaths.roughness),
    metalnessMap: resolveTexture(texturePaths.metalness),
    aoMap: resolveTexture(texturePaths.ao),
    alphaMap: resolveTexture(texturePaths.alpha),
    emissiveMap: resolveTexture(texturePaths.emissive),
  };
}

function applyMaterialOverride(
  root: Group,
  gender: Gender,
  options?: {
    materialSet?: MaterialSet;
    renderProfile?: RenderQualityProfile;
    modelPath?: string;
  }
) {
  const renderProfile = options?.renderProfile ?? "desktop-high";
  const materialSet = options?.materialSet;
  const isTurboSquidRuntime = Boolean(options?.modelPath?.includes(TURBOSQUID_MODEL_ROOT));
  const flatSkinColor = gender === "female" ? "#ede8e0" : "#e9e2d8";
  const mannequinTint = gender === "female" ? "#f4eee7" : "#efe8de";
  const materialTextures = loadMaterialTextures(materialSet?.texturePaths);

  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return;

    const mesh = obj as Mesh;
    if (isTurboSquidRuntime && shouldHideTurboSquidMesh(mesh.name)) {
      mesh.visible = false;
      return;
    }

    const turboSquidRegion = isTurboSquidRuntime ? resolveTurboSquidRegion(mesh.name) : null;
    const isHeadRegion = turboSquidRegion === "head";
    const isUnderwearRegion = turboSquidRegion === "underwear";
    const regionalTextures = turboSquidRegion
      ? loadMaterialTextures(TURBOSQUID_REGION_TEXTURES[gender][turboSquidRegion])
      : null;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const updated = mats.map((mat) => {
      const source = mat as MeshStandardMaterial;
      const clonedMat = source.clone();

      clonedMat.map = regionalTextures?.map ?? materialTextures.map ?? source.map ?? null;
      clonedMat.normalMap = regionalTextures?.normalMap ?? materialTextures.normalMap ?? source.normalMap ?? null;
      clonedMat.roughnessMap =
        regionalTextures?.roughnessMap ?? materialTextures.roughnessMap ?? source.roughnessMap ?? null;
      clonedMat.metalnessMap =
        regionalTextures?.metalnessMap ?? materialTextures.metalnessMap ?? source.metalnessMap ?? null;
      clonedMat.aoMap = regionalTextures?.aoMap ?? materialTextures.aoMap ?? source.aoMap ?? null;
      clonedMat.alphaMap = regionalTextures?.alphaMap ?? materialTextures.alphaMap ?? source.alphaMap ?? null;
      clonedMat.emissiveMap =
        regionalTextures?.emissiveMap ?? materialTextures.emissiveMap ?? source.emissiveMap ?? null;

      const hasTextureMap = Boolean(clonedMat.map);
      const defaultRoughness = hasTextureMap
        ? isUnderwearRegion
          ? renderProfile === "mobile-fallback"
            ? 0.74
            : 0.66
          : isHeadRegion
          ? renderProfile === "mobile-fallback"
            ? 0.84
            : 0.79
          : renderProfile === "mobile-fallback"
          ? 0.8
          : 0.72
        : 0.58;
      const tunedRoughness =
        typeof materialSet?.roughness === "number" ? materialSet.roughness : defaultRoughness;
      const tunedMetalness =
        typeof materialSet?.metalness === "number" ? materialSet.metalness : hasTextureMap ? 0.015 : 0;
      const tunedEnv =
        typeof materialSet?.envMapIntensity === "number"
          ? materialSet.envMapIntensity
          : hasTextureMap
          ? isHeadRegion
            ? 0.22
            : 0.28
          : 0.24;

      clonedMat.color = new Color(materialSet?.baseColor ?? (hasTextureMap ? mannequinTint : flatSkinColor));
      clonedMat.roughness = clamp(tunedRoughness, 0.02, 1);
      clonedMat.metalness = clamp(tunedMetalness, 0, 1);
      clonedMat.envMapIntensity = clamp(tunedEnv, 0, 1.5);

      if (clonedMat.normalMap && clonedMat.normalScale) {
        const normalScale = materialSet?.normalScale
          ? materialSet.normalScale
          : isHeadRegion
          ? renderProfile === "mobile-fallback"
            ? 0.18
            : 0.24
          : renderProfile === "mobile-fallback"
          ? 0.48
          : 0.58;
        clonedMat.normalScale.set(normalScale, normalScale);
      }

      if (typeof materialSet?.transparent === "boolean") {
        clonedMat.transparent = materialSet.transparent;
      }
      if (typeof materialSet?.alphaTest === "number") {
        clonedMat.alphaTest = materialSet.alphaTest;
      }

      if (clonedMat.aoMap) {
        ensureUv2(mesh);
        clonedMat.aoMapIntensity = isHeadRegion ? 0.62 : 0.9;
      }

      clonedMat.flatShading = false;
      clonedMat.depthWrite = true;
      clonedMat.needsUpdate = true;
      return clonedMat;
    });

    mesh.material = Array.isArray(mesh.material) ? updated : updated[0];
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}

function useAssetAvailable(path: string | null | undefined) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!path) {
      setAvailable(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const response = await fetch(path, { method: "HEAD" });
        if (!cancelled) setAvailable(response.ok);
      } catch {
        if (!cancelled) setAvailable(false);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [path]);

  return available;
}

function useAssetPairAvailable(paths: Record<Gender, string | null>) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const malePath = paths.male;
    const femalePath = paths.female;

    if (!malePath || !femalePath) {
      setAvailable(false);
      return;
    }

    let cancelled = false;
    const check = async () => {
      try {
        const [maleResponse, femaleResponse] = await Promise.all([
          fetch(malePath, { method: "HEAD" }),
          fetch(femalePath, { method: "HEAD" }),
        ]);
        if (!cancelled) setAvailable(maleResponse.ok && femaleResponse.ok);
      } catch {
        if (!cancelled) setAvailable(false);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [paths.female, paths.male]);

  return available;
}

function useRealismManifest() {
  const [manifest, setManifest] = useState<RealismAssetManifest | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(REALISM_MANIFEST_PATH, { cache: "no-store" });
        if (!response.ok) throw new Error("manifest unavailable");
        const parsed = (await response.json()) as RealismAssetManifest;
        if (!cancelled) setManifest(parsed);
      } catch {
        if (!cancelled) setManifest(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { manifest, loaded };
}

function useStatisticalShapeData(gender: Gender, enabled: boolean) {
  const [shapeData, setShapeData] = useState<StatisticalShapeData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setShapeData(null);
      setLoaded(false);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    const load = async () => {
      try {
        const response = await fetch(STATISTICAL_DATA_PATHS[gender], { cache: "no-store" });
        if (!response.ok) throw new Error("statistical data unavailable");
        const raw = (await response.json()) as unknown;
        const normalized = normalizeStatisticalShapeData(raw);
        if (!normalized) throw new Error("invalid statistical shape data");
        if (!cancelled) setShapeData(normalized);
      } catch {
        if (!cancelled) setShapeData(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, gender]);

  return { shapeData, loaded };
}

function useRenderQualityProfile() {
  const [profile, setProfile] = useState<RenderQualityProfile>("desktop-high");

  useEffect(() => {
    const pickProfile = () => {
      if (typeof window === "undefined") return "desktop-high" as RenderQualityProfile;

      const nav = navigator as Navigator & { deviceMemory?: number };
      const width = window.innerWidth;
      const touchCapable = navigator.maxTouchPoints > 0;
      const memory = nav.deviceMemory ?? 8;
      const cores = navigator.hardwareConcurrency ?? 8;

      if (width < 1024 || touchCapable || memory <= 6 || cores <= 6) {
        return "mobile-fallback" as RenderQualityProfile;
      }
      return "desktop-high" as RenderQualityProfile;
    };

    const update = () => setProfile(pickProfile());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return profile;
}

function pickRealismModelPath(config: RealismAssetGenderConfig, qualityProfile: RenderQualityProfile) {
  if (qualityProfile === "mobile-fallback") {
    return config.mobileModelPath ?? config.fallbackModelPath ?? config.primaryModelPath;
  }
  return config.desktopModelPath ?? config.primaryModelPath;
}

function applyTurboSquidRigShaping(props: {
  bones: Map<string, Bone>;
  baseline: Record<string, { sx: number; sy: number; sz: number; px: number; py: number; pz: number }>;
  modelRoot: Group;
  gender: Gender;
  bmi: number;
  bodyFatPct: number;
  heightCm: number;
  measurementAdjustments: MeasurementAdjustments;
}) {
  const { bones, baseline, modelRoot, gender, bmi, bodyFatPct, heightCm, measurementAdjustments } = props;
  const channels = buildMorphChannels({
    gender,
    bmi,
    bodyFatPct,
    heightCm,
    measurementAdjustments,
  });

  const heightNorm = clamp((heightCm - HEIGHT_CM_MIN) / (HEIGHT_CM_MAX - HEIGHT_CM_MIN), 0, 1);
  const shoulderBias = gender === "female" ? 0.9 : 1.04;
  const hipBias = gender === "female" ? 1.1 : 0.94;

  const scaleBone = (name: string, sx: number, sy: number, sz = sx) => {
    const bone = bones.get(name);
    const base = baseline[name];
    if (!bone || !base) return;
    bone.scale.set(base.sx * sx, base.sy * sy, base.sz * sz);
  };

  const torsoWidth =
    0.98 +
    0.28 * channels.local_torso_fat +
    0.12 * channels.local_waist_fat +
    0.08 * channels.local_torso_muscle +
    measurementAdjustments.waistDelta * 0.38;
  const torsoDepth =
    0.98 +
    0.36 * channels.local_torso_fat +
    0.1 * channels.local_chest_fat +
    measurementAdjustments.waistDelta * 0.45;

  scaleBone("spine_01", torsoWidth * 0.98, 1 + 0.04 * heightNorm, torsoDepth * 0.94);
  scaleBone("spine_02", torsoWidth, 1 + 0.05 * heightNorm, torsoDepth);
  scaleBone(
    "spine_03",
    torsoWidth * (0.98 + channels.local_shoulder_muscle * 0.12) * shoulderBias,
    1 + 0.04 * heightNorm,
    torsoDepth * (0.96 + channels.local_chest_muscle * 0.12)
  );

  scaleBone("clavicle_l", 0.98 + channels.local_shoulder_muscle * 0.18, 1, 1);
  scaleBone("clavicle_r", 0.98 + channels.local_shoulder_muscle * 0.18, 1, 1);

  const upperArmBulk =
    0.98 +
    channels.local_arms_muscle * 0.2 +
    channels.local_arms_fat * 0.16 +
    measurementAdjustments.chestDelta * 0.12;
  const forearmBulk = 0.98 + channels.local_forearms_muscle * 0.16 + channels.local_forearms_fat * 0.14;

  scaleBone("upperarm_l", upperArmBulk, 1 + channels.local_arms_muscle * 0.06, upperArmBulk);
  scaleBone("upperarm_r", upperArmBulk, 1 + channels.local_arms_muscle * 0.06, upperArmBulk);
  scaleBone("lowerarm_l", forearmBulk, 1 + channels.local_forearms_muscle * 0.05, forearmBulk);
  scaleBone("lowerarm_r", forearmBulk, 1 + channels.local_forearms_muscle * 0.05, forearmBulk);

  const pelvisBulk = 0.98 + channels.local_glute_fat * 0.22 + channels.local_thigh_shape * 0.15;
  scaleBone("pelvis", pelvisBulk * hipBias, 1 + channels.local_glute_fat * 0.04, 1 + channels.local_glute_fat * 0.18);

  const thighBulk =
    0.98 +
    channels.local_legs_fat * 0.22 +
    channels.local_legs_muscle * 0.15 +
    channels.local_thigh_shape * 0.14 +
    measurementAdjustments.hipsDelta * 0.2;
  const calfBulk = 0.98 + channels.local_calves_fat * 0.18 + channels.local_calves_muscle * 0.15 + channels.local_calf_shape * 0.1;

  scaleBone("thigh_l", thighBulk * hipBias, 1 + 0.05 * heightNorm, 0.98 + channels.local_legs_fat * 0.24);
  scaleBone("thigh_r", thighBulk * hipBias, 1 + 0.05 * heightNorm, 0.98 + channels.local_legs_fat * 0.24);
  scaleBone("calf_l", calfBulk, 1 + 0.05 * heightNorm, 0.98 + channels.local_calves_fat * 0.16);
  scaleBone("calf_r", calfBulk, 1 + 0.05 * heightNorm, 0.98 + channels.local_calves_fat * 0.16);

  const sceneScaleY = 0.92 + heightNorm * 0.24;
  const sceneScaleX = 0.97 + channels.macro_weight * 0.08;
  const sceneScaleZ = 0.98 + channels.local_torso_fat * 0.18;
  modelRoot.scale.set(sceneScaleX, sceneScaleY, sceneScaleZ);
}

function LegacyHumanModel(props: {
  gender: Gender;
  bmi: number;
  bodyFatPct: number;
  heightCm: number;
  materialSet?: MaterialSet;
  renderProfile: RenderQualityProfile;
  modelPath: string;
}) {
  const { gender, bmi, bodyFatPct, heightCm, materialSet, renderProfile, modelPath } = props;
  const gltf = useGLTF(LEGACY_MODEL_PATH);

  const modelRoot = useMemo(() => {
    const cloned = clone(gltf.scene) as Group;
    applyMaterialOverride(cloned, gender, { materialSet, renderProfile, modelPath });
    return cloned;
  }, [gender, gltf.scene, materialSet, renderProfile, modelPath]);

  const skinnedMesh = useMemo<SkinnedMesh | null>(() => {
    let found: SkinnedMesh | null = null;
    modelRoot.traverse((obj) => {
      if (!found && (obj as { isSkinnedMesh?: boolean }).isSkinnedMesh) {
        found = obj as SkinnedMesh;
      }
    });
    return found;
  }, [modelRoot]);

  const bones = useMemo(() => {
    const map = new Map<string, Bone>();
    skinnedMesh?.skeleton?.bones.forEach((b) => map.set(b.name, b));
    return map;
  }, [skinnedMesh]);

  const baseline = useMemo(() => {
    const values: Record<
      string,
      { sx: number; sy: number; sz: number; px: number; py: number; pz: number }
    > = {};
    bones.forEach((b, name) => {
      values[name] = {
        sx: b.scale.x,
        sy: b.scale.y,
        sz: b.scale.z,
        px: b.position.x,
        py: b.position.y,
        pz: b.position.z,
      };
    });
    return values;
  }, [bones]);

  useEffect(() => {
    if (!skinnedMesh) return;

    bones.forEach((b, name) => {
      const base = baseline[name];
      if (!base) return;
      b.scale.set(base.sx, base.sy, base.sz);
      b.position.set(base.px, base.py, base.pz);
    });

    const bfBounds = bodyFatBounds(gender);
    const fatNorm = clamp((bodyFatPct - bfBounds.min) / (bfBounds.max - bfBounds.min), 0, 1);
    const bmiNorm = clamp((bmi - BMI_MIN) / (BMI_MAX - BMI_MIN), 0, 1);
    const heightNorm = clamp((heightCm - HEIGHT_CM_MIN) / (HEIGHT_CM_MAX - HEIGHT_CM_MIN), 0, 1);

    const leanProxy = clamp((bmi * (1 - bodyFatPct / 100) - 15) / 12, 0, 1);

    const shoulderBias = gender === "female" ? 0.92 : 1;
    const hipBias = gender === "female" ? 1.12 : 1;

    const scaleBone = (name: string, sx: number, sy: number, sz = sx) => {
      const bone = bones.get(name);
      const base = baseline[name];
      if (!bone || !base) return;
      bone.scale.set(base.sx * sx, base.sy * sy, base.sz * sz);
    };

    const torsoWidth = 1 + 0.22 * fatNorm + 0.08 * leanProxy;
    const torsoDepth = 1 + 0.36 * fatNorm + 0.03 * bmiNorm;

    scaleBone("spine", torsoWidth * 0.98, 1 + 0.03 * heightNorm, torsoDepth * 0.95);
    scaleBone("spine001", torsoWidth, 1 + 0.04 * heightNorm, torsoDepth);
    scaleBone("spine002", torsoWidth * 1.04, 1 + 0.03 * heightNorm, torsoDepth * 1.08);
    scaleBone("spine003", torsoWidth * 1.05, 1 + 0.02 * heightNorm, torsoDepth * 1.1);
    scaleBone(
      "spine004",
      (1 + 0.12 * leanProxy) * shoulderBias,
      1 + 0.03 * heightNorm,
      1 + 0.05 * leanProxy
    );
    scaleBone(
      "spine005",
      (1 + 0.1 * leanProxy) * shoulderBias,
      1 + 0.02 * heightNorm,
      1 + 0.04 * leanProxy
    );

    const upperArmBulk = 1 + 0.18 * leanProxy + 0.06 * fatNorm;
    const forearmBulk = 1 + 0.12 * leanProxy + 0.03 * fatNorm;

    scaleBone("shoulderL", 1 + 0.1 * leanProxy, 1, 1);
    scaleBone("shoulderR", 1 + 0.1 * leanProxy, 1, 1);

    scaleBone("upper_armL", upperArmBulk, 1 + 0.05 * leanProxy, upperArmBulk);
    scaleBone("upper_armR", upperArmBulk, 1 + 0.05 * leanProxy, upperArmBulk);
    scaleBone("forearmL", forearmBulk, 1 + 0.03 * leanProxy, forearmBulk);
    scaleBone("forearmR", forearmBulk, 1 + 0.03 * leanProxy, forearmBulk);

    const pelvisScale = (1 + 0.11 * fatNorm) * hipBias;
    scaleBone("pelvisL", pelvisScale, 1 + 0.03 * fatNorm, 1 + 0.14 * fatNorm);
    scaleBone("pelvisR", pelvisScale, 1 + 0.03 * fatNorm, 1 + 0.14 * fatNorm);

    const thighBulk = 1 + 0.22 * fatNorm + 0.12 * leanProxy;
    const shinBulk = 1 + 0.12 * fatNorm + 0.08 * leanProxy;

    scaleBone("thighL", thighBulk * hipBias, 1 + 0.05 * heightNorm, 1 + 0.24 * fatNorm);
    scaleBone("thighR", thighBulk * hipBias, 1 + 0.05 * heightNorm, 1 + 0.24 * fatNorm);
    scaleBone("shinL", shinBulk, 1 + 0.05 * heightNorm, 1 + 0.1 * fatNorm);
    scaleBone("shinR", shinBulk, 1 + 0.05 * heightNorm, 1 + 0.1 * fatNorm);

    const sceneScaleY = 0.92 + heightNorm * 0.24;
    const sceneScaleX = 0.98 + 0.07 * bmiNorm;
    const sceneScaleZ = 0.98 + 0.16 * fatNorm;
    modelRoot.scale.set(sceneScaleX, sceneScaleY, sceneScaleZ);
  }, [baseline, bmi, bodyFatPct, bones, gender, heightCm, modelRoot, skinnedMesh]);

  return <primitive object={modelRoot} position={[0, 0, 0]} rotation={[0, 0, 0]} />;
}

function MorphTargetModel(props: {
  modelPath: string;
  morphAdapter: MorphAdapter;
  gender: Gender;
  bmi: number;
  bodyFatPct: number;
  heightCm: number;
  measurementAdjustments: MeasurementAdjustments;
  materialSet?: MaterialSet;
  renderProfile: RenderQualityProfile;
}) {
  const {
    modelPath,
    morphAdapter,
    gender,
    bmi,
    bodyFatPct,
    heightCm,
    measurementAdjustments,
    materialSet,
    renderProfile,
  } = props;
  const gltf = useGLTF(modelPath);

  const modelRoot = useMemo(() => {
    const cloned = clone(gltf.scene) as Group;
    applyMaterialOverride(cloned, gender, { materialSet, renderProfile, modelPath });
    return cloned;
  }, [gender, gltf.scene, materialSet, renderProfile, modelPath]);

  const morphMeshes = useMemo(() => {
    const meshes: Array<Mesh> = [];
    modelRoot.traverse((obj) => {
      if (!(obj as Mesh).isMesh) return;
      const mesh = obj as Mesh;
      if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        meshes.push(mesh);
      }
    });
    return meshes;
  }, [modelRoot]);

  const skinnedMesh = useMemo<SkinnedMesh | null>(() => {
    let found: SkinnedMesh | null = null;
    modelRoot.traverse((obj) => {
      if (!found && (obj as { isSkinnedMesh?: boolean }).isSkinnedMesh) {
        found = obj as SkinnedMesh;
      }
    });
    return found;
  }, [modelRoot]);

  const bones = useMemo(() => {
    const map = new Map<string, Bone>();
    skinnedMesh?.skeleton?.bones.forEach((bone) => map.set(bone.name, bone));
    return map;
  }, [skinnedMesh]);

  const baseline = useMemo(() => {
    const values: Record<string, { sx: number; sy: number; sz: number; px: number; py: number; pz: number }> = {};
    bones.forEach((bone, name) => {
      values[name] = {
        sx: bone.scale.x,
        sy: bone.scale.y,
        sz: bone.scale.z,
        px: bone.position.x,
        py: bone.position.y,
        pz: bone.position.z,
      };
    });
    return values;
  }, [bones]);

  const channels = useMemo(
    () =>
      buildMorphChannels({
        gender,
        bmi,
        bodyFatPct,
        heightCm,
        measurementAdjustments,
      }),
    [gender, bmi, bodyFatPct, heightCm, measurementAdjustments]
  );

  useEffect(() => {
    bones.forEach((bone, name) => {
      const base = baseline[name];
      if (!base) return;
      bone.scale.set(base.sx, base.sy, base.sz);
      bone.position.set(base.px, base.py, base.pz);
    });

    let matchedChannelCount = 0;
    morphMeshes.forEach((mesh) => {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

      for (let i = 0; i < mesh.morphTargetInfluences.length; i += 1) {
        mesh.morphTargetInfluences[i] = 0;
      }

      (Object.keys(channels) as MorphChannel[]).forEach((channel) => {
        const index = resolveMorphIndex(mesh.morphTargetDictionary!, channel, morphAdapter);
        if (index === null) return;
        mesh.morphTargetInfluences![index] = channels[channel];
        matchedChannelCount += 1;
      });
    });

    const shouldUseRigFallback = morphAdapter.id === "realism" || matchedChannelCount === 0;
    if (shouldUseRigFallback && bones.size > 0) {
      applyTurboSquidRigShaping({
        bones,
        baseline,
        modelRoot,
        gender,
        bmi,
        bodyFatPct,
        heightCm,
        measurementAdjustments,
      });
    }
  }, [
    baseline,
    bmi,
    bodyFatPct,
    bones,
    channels,
    gender,
    heightCm,
    measurementAdjustments,
    modelRoot,
    morphAdapter,
    morphMeshes,
  ]);

  return <primitive object={modelRoot} position={[0, 0, 0]} rotation={[0, 0, 0]} />;
}

function StatisticalMorphModel(props: {
  shapeData: StatisticalShapeData;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  bodyFatPct: number;
  measurements: MeasurementSet;
  materialSet?: MaterialSet;
  renderProfile: RenderQualityProfile;
}) {
  const { shapeData, gender, heightCm, weightKg, bodyFatPct, measurements, materialSet, renderProfile } = props;
  const meshRef = useRef<Mesh | null>(null);

  const statisticalGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    const vertexCount = shapeData.baseVertices.length;

    const positionArray = new Float32Array(vertexCount * 3);
    shapeData.baseVertices.forEach((vertex, index) => {
      positionArray[index * 3] = vertex[0];
      positionArray[index * 3 + 1] = vertex[1];
      positionArray[index * 3 + 2] = vertex[2];
    });
    geometry.setAttribute("position", new Float32BufferAttribute(positionArray, 3));

    const indexArray = new Uint32Array(shapeData.baseFaceIndices.length * 3);
    shapeData.baseFaceIndices.forEach((face, index) => {
      indexArray[index * 3] = face[0];
      indexArray[index * 3 + 1] = face[1];
      indexArray[index * 3 + 2] = face[2];
    });
    geometry.setIndex(Array.from(indexArray));

    geometry.morphTargetsRelative = true;

    const morphNames: string[] = [];
    const morphAttributes: Float32BufferAttribute[] = [];
    shapeData.shapeInfo.ordering.forEach((name) => {
      const deltas = shapeData.morphTargetDeltas[name];
      if (!deltas || deltas.length !== vertexCount) return;
      const morphArray = new Float32Array(vertexCount * 3);
      for (let i = 0; i < vertexCount; i += 1) {
        const triplet = deltas[i];
        morphArray[i * 3] = triplet[0];
        morphArray[i * 3 + 1] = triplet[1];
        morphArray[i * 3 + 2] = triplet[2];
      }
      const attribute = new Float32BufferAttribute(morphArray, 3);
      attribute.name = name;
      morphAttributes.push(attribute);
      morphNames.push(name);
    });
    geometry.morphAttributes.position = morphAttributes;
    geometry.computeVertexNormals();

    return {
      geometry,
      morphNames,
    };
  }, [shapeData]);

  useEffect(() => {
    return () => {
      statisticalGeometry.geometry.dispose();
    };
  }, [statisticalGeometry.geometry]);

  const solvedInfluences = useMemo(() => {
    const knownValues = buildStatisticalKnownValues({
      heightCm,
      weightKg,
      measurements,
      bodyFatPct,
      gender,
    });
    const solved = solveConditionalGaussian(shapeData.shapeInfo, knownValues);
    const byName: Record<string, number> = {};

    shapeData.shapeInfo.ordering.forEach((name, index) => {
      const mean = shapeData.shapeInfo.means[index] ?? 0;
      byName[name] = clamp((solved[index] - mean) / 5, -3, 3);
    });

    return byName;
  }, [bodyFatPct, gender, heightCm, measurements, shapeData.shapeInfo, weightKg]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh?.morphTargetInfluences?.length) return;

    for (let i = 0; i < mesh.morphTargetInfluences.length; i += 1) {
      mesh.morphTargetInfluences[i] = 0;
    }

    statisticalGeometry.morphNames.forEach((name, index) => {
      mesh.morphTargetInfluences![index] = solvedInfluences[name] ?? 0;
    });
  }, [solvedInfluences, statisticalGeometry.morphNames]);

  const skinColor = materialSet?.baseColor ?? (gender === "female" ? "#f0f2f7" : "#e4eaf3");
  const roughness =
    typeof materialSet?.roughness === "number"
      ? materialSet.roughness
      : renderProfile === "desktop-high"
      ? 0.58
      : 0.64;
  const metalness = typeof materialSet?.metalness === "number" ? materialSet.metalness : 0.02;

  return (
    <mesh
      ref={meshRef}
      geometry={statisticalGeometry.geometry}
      castShadow
      receiveShadow
      position={[0, 0, 0]}
    >
      <meshStandardMaterial
        color={skinColor}
        roughness={clamp(roughness, 0.04, 1)}
        metalness={clamp(metalness, 0, 0.4)}
      />
    </mesh>
  );
}

function CanvasCaptureBridge(props: { onCanvasReady: (element: HTMLCanvasElement | null) => void }) {
  const { gl } = useThree();
  const { onCanvasReady } = props;

  useEffect(() => {
    onCanvasReady(gl.domElement);
    return () => onCanvasReady(null);
  }, [gl, onCanvasReady]);

  return null;
}

function BodyRender(props: {
  gender: Gender;
  bmi: number;
  bodyFatPct: number;
  weightKg: number;
  heightCm: number;
  measurements: MeasurementSet;
  viewPreset: ViewPreset;
  modelVariant: ModelVariant;
  morphAdapter: MorphAdapter;
  modelPath: string | null;
  measurementAdjustments: MeasurementAdjustments;
  statisticalShapeData: StatisticalShapeData | null;
  materialSet?: MaterialSet;
  renderProfile: RenderQualityProfile;
  onCanvasReady: (element: HTMLCanvasElement | null) => void;
}) {
  const {
    gender,
    bmi,
    bodyFatPct,
    weightKg,
    heightCm,
    measurements,
    viewPreset,
    modelVariant,
    morphAdapter,
    modelPath,
    measurementAdjustments,
    statisticalShapeData,
    materialSet,
    renderProfile,
    onCanvasReady,
  } = props;

  const modelYaw = modelVariant === "legacy" ? LEGACY_FRONT_MODEL_YAW : MODERN_FRONT_MODEL_YAW;
  const viewOffset =
    viewPreset === "left"
      ? Math.PI / 2
      : viewPreset === "right"
      ? -Math.PI / 2
      : viewPreset === "back"
      ? Math.PI
      : 0;

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[26px] border border-gray-300 bg-[#5f6469]"
      style={{
        background:
          "radial-gradient(120% 72% at 50% 30%, #7b8189 0%, #6b7178 38%, #5d626a 62%, #52575f 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute inset-x-[-40%] bottom-[-58%] h-[138%] opacity-28 [mask-image:linear-gradient(to_top,black_78%,transparent)] [transform:perspective(1400px)_rotateX(72deg)]">
          <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:72px_72px]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-black/24 via-black/10 to-transparent" />
      </div>

      <Canvas
        className="relative z-[2]"
        shadows="soft"
        camera={{
          position: [0, 0.26, renderProfile === "desktop-high" ? 4.9 : 5.1],
          fov: renderProfile === "desktop-high" ? 24 : 25,
        }}
        dpr={renderProfile === "desktop-high" ? [1, 2] : [1, 1.5]}
        gl={{ antialias: true, preserveDrawingBuffer: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = renderProfile === "desktop-high" ? 1.02 : 0.98;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = PCFSoftShadowMap;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={renderProfile === "desktop-high" ? 0.22 : 0.24} />
        <hemisphereLight
          intensity={renderProfile === "desktop-high" ? 0.62 : 0.54}
          color="#f8fafc"
          groundColor="#6b7280"
        />
        <directionalLight
          castShadow
          position={[3.2, 5.1, 3.8]}
          intensity={renderProfile === "desktop-high" ? 1.08 : 0.94}
          shadow-mapSize-width={renderProfile === "desktop-high" ? 2048 : 1024}
          shadow-mapSize-height={renderProfile === "desktop-high" ? 2048 : 1024}
          shadow-camera-near={0.5}
          shadow-camera-far={12}
          shadow-camera-left={-3.2}
          shadow-camera-right={3.2}
          shadow-camera-top={3.2}
          shadow-camera-bottom={-3.2}
          shadow-bias={-0.00014}
          shadow-normalBias={0.018}
        />
        <directionalLight
          position={[-4.2, 2.5, -1.6]}
          intensity={renderProfile === "desktop-high" ? 0.44 : 0.34}
          color="#dbeafe"
        />
        <directionalLight
          position={[0.2, 2.2, -4.8]}
          intensity={renderProfile === "desktop-high" ? 0.38 : 0.28}
          color="#fef3c7"
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.58, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#7a7f86" roughness={0.92} metalness={0.02} />
        </mesh>

        <Suspense fallback={null}>
          <group position={[-0.01, -0.02, 0]} rotation={[0, modelYaw + viewOffset, 0]}>
            {modelVariant === "statistical" && statisticalShapeData ? (
              <StatisticalMorphModel
                shapeData={statisticalShapeData}
                gender={gender}
                heightCm={heightCm}
                weightKg={weightKg}
                bodyFatPct={bodyFatPct}
                measurements={measurements}
                materialSet={materialSet}
                renderProfile={renderProfile}
              />
            ) : modelVariant === "statistical" || modelVariant === "legacy" || !modelPath ? (
              <LegacyHumanModel
                gender={gender}
                bmi={bmi}
                bodyFatPct={bodyFatPct}
                heightCm={heightCm}
                materialSet={materialSet}
                renderProfile={renderProfile}
                modelPath={LEGACY_MODEL_PATH}
              />
            ) : (
              <MorphTargetModel
                modelPath={modelPath}
                morphAdapter={morphAdapter}
                gender={gender}
                bmi={bmi}
                bodyFatPct={bodyFatPct}
                heightCm={heightCm}
                measurementAdjustments={measurementAdjustments}
                materialSet={materialSet}
                renderProfile={renderProfile}
              />
            )}
          </group>
        </Suspense>

        <CanvasCaptureBridge onCanvasReady={onCanvasReady} />

        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.72}
          minDistance={3.6}
          maxDistance={7.5}
          minPolarAngle={Math.PI / 2 - 0.5}
          maxPolarAngle={Math.PI / 2 + 0.5}
          target={[0, 0.98, 0]}
        />
      </Canvas>
    </div>
  );
}

function SliderField(props: {
  icon: React.ReactNode;
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const {
    icon,
    label,
    valueLabel,
    min,
    max,
    step = 1,
    value,
    onChange,
    disabled = false,
  } = props;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-black">
          <span className="text-gray-500">{icon}</span>
          <span className="font-medium">{label}</span>
        </div>
        <p className="font-semibold text-black">{valueLabel}</p>
      </div>

      <input
        type="range"
        className="range range-success range-xs"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
    </div>
  );
}

function GradientStatSlider(props: {
  label: string;
  value: number;
  valueDisplay: string;
  min: number;
  max: number;
  step?: number;
  statusLabel: string;
  statusColor: string;
  trackGradient: string;
  onChange: (value: number) => void;
}) {
  const {
    label,
    value,
    valueDisplay,
    min,
    max,
    step = 0.1,
    statusLabel,
    statusColor,
    trackGradient,
    onChange,
  } = props;

  const marker = clamp(((value - min) / (max - min)) * 100, 0, 100);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-end justify-between gap-3">
        <p className="text-black">
          <span className="text-lg font-semibold">{label}</span>
          <span className="ml-2 text-3xl font-bold leading-none text-black">{valueDisplay}</span>
        </p>
        <p className="text-2xl font-semibold text-right" style={{ color: statusColor }}>
          {statusLabel}
        </p>
      </div>

      <div className="relative mt-4">
        <div className="h-3 w-full rounded-full" style={{ background: trackGradient }} />
        <div
          className="pointer-events-none absolute top-1/2 z-20 h-5 w-1.5 -translate-y-1/2 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.16)]"
          style={{ left: `${marker}%`, transform: "translate(-50%, -50%)", backgroundColor: statusColor }}
          aria-hidden="true"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 z-30 h-3 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent [&::-moz-range-track]:h-3 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent"
          aria-label={label}
        />
      </div>
    </div>
  );
}

function PanelButton(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { active, onClick, children } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-primary/10 text-black" : "text-black/60 hover:text-black"
      }`}
    >
      {children}
    </button>
  );
}

function compareProfiles(a: BodyProfile, b: BodyProfile) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function formatLength(valueCm: number, units: Units) {
  if (units === "metric") return `${round(valueCm, 1)} cm`;
  return `${round(cmToIn(valueCm), 1)} in`;
}

function formatHeight(heightCm: number, units: Units) {
  if (units === "metric") return `${Math.round(heightCm)} cm`;
  const totalInches = Math.round(cmToIn(heightCm));
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}' ${inches}\"`;
}

function formatWeight(weightKg: number, units: Units) {
  if (units === "metric") return `${round(weightKg, 1)} kg`;
  return `${Math.round(kgToLb(weightKg))} lbs`;
}

function toDisplayUnit(valueCm: number, units: Units) {
  return units === "metric" ? valueCm : cmToIn(valueCm);
}

function fromDisplayUnit(value: number, units: Units) {
  return units === "metric" ? value : inToCm(value);
}

function boundsInDisplayUnits(
  cmBounds: { min: number; max: number; step: number },
  units: Units
) {
  if (units === "metric") return cmBounds;
  return {
    min: round(cmToIn(cmBounds.min), 1),
    max: round(cmToIn(cmBounds.max), 1),
    step: 0.5,
  };
}

function createDefaultProfile(gender: Gender): BodyProfile {
  return {
    gender,
    ...DEFAULT_PROFILE_BY_GENDER[gender],
  };
}

function loadPresets(): PresetRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PresetRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((preset) => {
      return Boolean(preset?.id && preset?.name && preset?.profile);
    });
  } catch {
    return [];
  }
}

function persistPresets(presets: PresetRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

async function exportSnapshotCardPng(payload: SnapshotPayload, modelDataUrl: string) {
  const width = 1600;
  const height = 900;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#060a12");
  gradient.addColorStop(0.55, "#070e1a");
  gradient.addColorStop(1, "#111724");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  roundRect(ctx, 48, 48, width - 96, height - 96, 28);
  ctx.fill();

  try {
    const modelImage = await loadImage(modelDataUrl);
    const imageX = 86;
    const imageY = 86;
    const imageW = 930;
    const imageH = 728;
    ctx.fillStyle = "#02050b";
    roundRect(ctx, imageX, imageY, imageW, imageH, 22);
    ctx.fill();

    ctx.save();
    roundRect(ctx, imageX, imageY, imageW, imageH, 22);
    ctx.clip();

    const ratio = Math.max(imageW / modelImage.width, imageH / modelImage.height);
    const drawW = modelImage.width * ratio;
    const drawH = modelImage.height * ratio;
    const dx = imageX + (imageW - drawW) / 2;
    const dy = imageY + (imageH - drawH) / 2;
    ctx.drawImage(modelImage, dx, dy, drawW, drawH);
    ctx.restore();
  } catch {
    ctx.fillStyle = "#02050b";
    roundRect(ctx, 86, 86, 930, 728, 22);
    ctx.fill();
  }

  const panelX = 1050;
  const panelY = 86;
  const panelW = 464;
  const panelH = 728;
  ctx.fillStyle = "rgba(9, 14, 24, 0.94)";
  roundRect(ctx, panelX, panelY, panelW, panelH, 22);
  ctx.fill();

  ctx.fillStyle = "#d5e6ff";
  ctx.font = "600 30px Inter, system-ui, sans-serif";
  ctx.fillText("Body Visualizer", panelX + 34, panelY + 52);

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = "500 18px Inter, system-ui, sans-serif";
  ctx.fillText(`${payload.gender === "male" ? "Male" : "Female"} profile`, panelX + 34, panelY + 84);

  const fields: Array<{ label: string; value: string }> = [
    { label: "Height", value: formatHeight(payload.heightCm, payload.units) },
    { label: "Weight", value: formatWeight(payload.weightKg, payload.units) },
    { label: "Chest", value: formatLength(payload.measurements.chestCm, payload.units) },
    { label: "Waist", value: formatLength(payload.measurements.waistCm, payload.units) },
    { label: "Hips", value: formatLength(payload.measurements.hipsCm, payload.units) },
    { label: "Inseam", value: formatLength(payload.measurements.inseamCm, payload.units) },
    { label: "BMI", value: round(payload.bmi, 1).toString() },
    { label: "Body Fat", value: `${round(payload.bodyFatPct, 1)}%` },
  ];

  let rowY = panelY + 150;
  fields.forEach((field) => {
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "500 16px Inter, system-ui, sans-serif";
    ctx.fillText(field.label.toUpperCase(), panelX + 34, rowY);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 33px Inter, system-ui, sans-serif";
    ctx.fillText(field.value, panelX + 34, rowY + 36);

    rowY += 82;
  });

  const timestamp = new Date(payload.timestampIso).toLocaleString();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "500 16px Inter, system-ui, sans-serif";
  ctx.fillText(timestamp, panelX + 34, panelY + panelH - 34);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  const stamp = payload.timestampIso.replace(/[:.]/g, "-");
  link.download = `body-visualizer-snapshot-${stamp}.png`;
  link.click();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function ControlPanel(props: {
  profile: BodyProfile;
  bmi: number;
  bmiClass: Category;
  measurements: MeasurementSet;
  activePresetName: string;
  canResetSaved: boolean;
  isDirty: boolean;
  onGenderChange: (gender: Gender) => void;
  onUnitsChange: (units: Units) => void;
  onHeightChange: (valueCm: number) => void;
  onWeightChange: (valueKg: number) => void;
  onBodyFatChange: (value: number) => void;
  onBmiChange: (value: number) => void;
  onMeasurementChange: (key: keyof MeasurementSet, valueCm: number) => void;
  onResetDefault: () => void;
  onResetSaved: () => void;
  onSavePreset: () => void;
}) {
  const {
    profile,
    bmi,
    bmiClass,
    measurements,
    activePresetName,
    canResetSaved,
    isDirty,
    onGenderChange,
    onUnitsChange,
    onHeightChange,
    onWeightChange,
    onBodyFatChange,
    onBmiChange,
    onMeasurementChange,
    onResetDefault,
    onResetSaved,
    onSavePreset,
  } = props;

  const bounds = bodyFatBounds(profile.gender);

  const heightValue = profile.units === "metric" ? round(profile.heightCm, 1) : round(cmToIn(profile.heightCm), 1);
  const heightMin = profile.units === "metric" ? HEIGHT_CM_MIN : round(cmToIn(HEIGHT_CM_MIN), 1);
  const heightMax = profile.units === "metric" ? HEIGHT_CM_MAX : round(cmToIn(HEIGHT_CM_MAX), 1);

  const weightValue = profile.units === "metric" ? round(profile.weightKg, 1) : round(kgToLb(profile.weightKg), 1);
  const weightMin = profile.units === "metric" ? WEIGHT_KG_MIN : round(kgToLb(WEIGHT_KG_MIN), 1);
  const weightMax = profile.units === "metric" ? WEIGHT_KG_MAX : round(kgToLb(WEIGHT_KG_MAX), 1);

  const chestBounds = boundsInDisplayUnits(SLIDER_BOUNDS_CM.chestCm, profile.units);
  const waistBounds = boundsInDisplayUnits(SLIDER_BOUNDS_CM.waistCm, profile.units);
  const hipsBounds = boundsInDisplayUnits(SLIDER_BOUNDS_CM.hipsCm, profile.units);
  const inseamBounds = boundsInDisplayUnits(SLIDER_BOUNDS_CM.inseamCm, profile.units);

  const bodyFatClass = bodyFatCategory(profile.gender, profile.bodyFatPct);
  const bodyFatGradient = useMemo(() => {
    if (profile.gender === "male") {
      return buildBandedGradient(bounds.min, bounds.max, [
        { until: 10, color: "#52a1ff" },
        { until: 18, color: "#66cf7f" },
        { until: 25, color: "#8ad66e" },
        { until: 32, color: "#edca53" },
        { until: bounds.max, color: "#ef5f7b" },
      ]);
    }

    return buildBandedGradient(bounds.min, bounds.max, [
      { until: 18, color: "#52a1ff" },
      { until: 28, color: "#66cf7f" },
      { until: 35, color: "#8ad66e" },
      { until: 42, color: "#edca53" },
      { until: bounds.max, color: "#ef5f7b" },
    ]);
  }, [profile.gender, bounds.min, bounds.max]);
  const bmiGradient = useMemo(
    () =>
      buildBandedGradient(BMI_MIN, BMI_MAX, [
        { until: 18.5, color: "#4f86ff" },
        { until: 25, color: "#66cf7f" },
        { until: 30, color: "#edca53" },
        { until: BMI_MAX, color: "#ef5f7b" },
      ]),
    []
  );

  return (
    <div className="flex h-full flex-col rounded-[24px] border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <div className="grid grid-cols-2 rounded-xl border border-gray-200 bg-gray-100 p-1">
          <PanelButton active={profile.gender === "female"} onClick={() => onGenderChange("female")}>Female</PanelButton>
          <PanelButton active={profile.gender === "male"} onClick={() => onGenderChange("male")}>Male</PanelButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <div className="relative inline-grid w-56 grid-cols-2 rounded-full border border-gray-200 bg-gray-100 p-1">
          <span
            className="pointer-events-none absolute bottom-1 top-1 rounded-full border border-[#66cf7f]/40 bg-[#66cf7f]/20 transition-all duration-200"
            style={{
              left: profile.units === "imperial" ? "0.25rem" : "50%",
              right: profile.units === "imperial" ? "50%" : "0.25rem",
            }}
          />
          <button
            type="button"
            onClick={() => onUnitsChange("imperial")}
            className={`relative z-10 rounded-full px-4 py-2 text-sm font-semibold transition ${
              profile.units === "imperial" ? "text-black" : "text-black/60 hover:text-black"
            }`}
            aria-pressed={profile.units === "imperial"}
          >
            Imperial
          </button>
          <button
            type="button"
            onClick={() => onUnitsChange("metric")}
            className={`relative z-10 rounded-full px-4 py-2 text-sm font-semibold transition ${
              profile.units === "metric" ? "text-black" : "text-black/60 hover:text-black"
            }`}
            aria-pressed={profile.units === "metric"}
          >
            Metric
          </button>
        </div>

        <div className="space-y-4">
          <SliderField
            icon={<Ruler size={16} />}
            label="Height"
            valueLabel={formatHeight(profile.heightCm, profile.units)}
            min={heightMin}
            max={heightMax}
            step={0.5}
            value={heightValue}
            onChange={(value) => onHeightChange(fromDisplayUnit(value, profile.units))}
          />

          <SliderField
            icon={<Weight size={16} />}
            label="Weight"
            valueLabel={formatWeight(profile.weightKg, profile.units)}
            min={weightMin}
            max={weightMax}
            step={0.5}
            value={weightValue}
            onChange={(value) => onWeightChange(profile.units === "metric" ? value : lbToKg(value))}
          />

          <SliderField
            icon={<Heart size={16} />}
            label="Chest"
            valueLabel={formatLength(measurements.chestCm, profile.units)}
            min={chestBounds.min}
            max={chestBounds.max}
            step={chestBounds.step}
            value={toDisplayUnit(measurements.chestCm, profile.units)}
            onChange={(value) => onMeasurementChange("chestCm", fromDisplayUnit(value, profile.units))}
          />

          <SliderField
            icon={<MoveHorizontal size={16} />}
            label="Waist"
            valueLabel={formatLength(measurements.waistCm, profile.units)}
            min={waistBounds.min}
            max={waistBounds.max}
            step={waistBounds.step}
            value={toDisplayUnit(measurements.waistCm, profile.units)}
            onChange={(value) => onMeasurementChange("waistCm", fromDisplayUnit(value, profile.units))}
          />

          <SliderField
            icon={<MoveHorizontal size={16} />}
            label="Hips"
            valueLabel={formatLength(measurements.hipsCm, profile.units)}
            min={hipsBounds.min}
            max={hipsBounds.max}
            step={hipsBounds.step}
            value={toDisplayUnit(measurements.hipsCm, profile.units)}
            onChange={(value) => onMeasurementChange("hipsCm", fromDisplayUnit(value, profile.units))}
          />

          <SliderField
            icon={<Ruler size={16} />}
            label="Inseam"
            valueLabel={formatLength(measurements.inseamCm, profile.units)}
            min={inseamBounds.min}
            max={inseamBounds.max}
            step={inseamBounds.step}
            value={toDisplayUnit(measurements.inseamCm, profile.units)}
            onChange={(value) => onMeasurementChange("inseamCm", fromDisplayUnit(value, profile.units))}
          />

          <div className="space-y-4">
            <GradientStatSlider
              label="Body Fat"
              value={round(profile.bodyFatPct, 1)}
              valueDisplay={`${round(profile.bodyFatPct, 1)}%`}
              min={bounds.min}
              max={bounds.max}
              step={0.1}
              statusLabel={bodyFatClass.label}
              statusColor={bodyFatClass.color}
              trackGradient={bodyFatGradient}
              onChange={onBodyFatChange}
            />

            <GradientStatSlider
              label="BMI"
              value={round(bmi, 1)}
              valueDisplay={round(bmi, 1).toString()}
              min={BMI_MIN}
              max={BMI_MAX}
              step={0.1}
              statusLabel={bmiClass.label}
              statusColor={bmiClass.color}
              trackGradient={bmiGradient}
              onChange={onBmiChange}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onResetDefault}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-black transition hover:border-gray-400"
          >
            <RotateCcw size={14} />
            Reset Default
          </button>
          <button
            type="button"
            onClick={onResetSaved}
            disabled={!canResetSaved}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-black transition hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={14} />
            Reset Saved
          </button>
        </div>

        <button
          type="button"
          onClick={onSavePreset}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
        >
          <Save size={15} />
          {isDirty ? `Save (${activePresetName})` : "Saved"}
        </button>

      </div>
    </div>
  );
}

function SnapshotModal(props: {
  open: boolean;
  snapshotPayload: SnapshotPayload | null;
  previewImage: string | null;
  onClose: () => void;
  onDownload: () => Promise<void>;
}) {
  const { open, snapshotPayload, previewImage, onClose, onDownload } = props;
  const [isDownloading, setIsDownloading] = useState(false);

  if (!open || !snapshotPayload || !previewImage) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-white/70 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-5xl rounded-3xl border border-gray-200 bg-white p-6 text-black shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-3xl font-semibold">Snapshot</h3>
            <p className="mt-2 text-black/60">Export a fixed-size share card with your current body stats.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-black/70 transition hover:bg-gray-100 hover:text-black"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-2">
            <img src={previewImage} alt="Snapshot Preview" className="h-[360px] w-full rounded-xl object-cover" />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-black/50">{snapshotPayload.gender} profile</p>
            <div className="mt-3 space-y-2 text-sm text-black/85">
              <p>Height: {formatHeight(snapshotPayload.heightCm, snapshotPayload.units)}</p>
              <p>Weight: {formatWeight(snapshotPayload.weightKg, snapshotPayload.units)}</p>
              <p>Chest: {formatLength(snapshotPayload.measurements.chestCm, snapshotPayload.units)}</p>
              <p>Waist: {formatLength(snapshotPayload.measurements.waistCm, snapshotPayload.units)}</p>
              <p>Hips: {formatLength(snapshotPayload.measurements.hipsCm, snapshotPayload.units)}</p>
              <p>Inseam: {formatLength(snapshotPayload.measurements.inseamCm, snapshotPayload.units)}</p>
              <p>BMI: {round(snapshotPayload.bmi, 1)}</p>
              <p>Body Fat: {round(snapshotPayload.bodyFatPct, 1)}%</p>
            </div>
            <p className="mt-4 text-xs text-black/50">{new Date(snapshotPayload.timestampIso).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              setIsDownloading(true);
              try {
                await onDownload();
              } finally {
                setIsDownloading(false);
              }
            }}
            disabled={isDownloading}
            className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {isDownloading ? "Preparing..." : "Download PNG"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold text-black transition hover:border-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BodyVisualizerTool() {
  const [profile, setProfile] = useState<BodyProfile>(() => createDefaultProfile("male"));
  const [viewPreset, setViewPreset] = useState<ViewPreset>("front");
  const [presets, setPresets] = useState<PresetRecord[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [savedBaselineProfile, setSavedBaselineProfile] = useState<BodyProfile>(() => createDefaultProfile("male"));
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [snapshotPreviewImage, setSnapshotPreviewImage] = useState<string | null>(null);
  const [snapshotPayload, setSnapshotPayload] = useState<SnapshotPayload | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderProfile = useRenderQualityProfile();
  const { manifest: realismManifest } = useRealismManifest();

  const maleCustomAvailable = useAssetAvailable(CUSTOM_MODEL_PATHS.male);
  const femaleCustomAvailable = useAssetAvailable(CUSTOM_MODEL_PATHS.female);
  const maleMpfbAvailable = useAssetAvailable(MPFB_MODEL_PATHS.male);
  const femaleMpfbAvailable = useAssetAvailable(MPFB_MODEL_PATHS.female);
  const statisticalAvailable = useAssetPairAvailable(STATISTICAL_DATA_PATHS);
  const { shapeData: statisticalShapeData, loaded: statisticalLoaded } = useStatisticalShapeData(
    profile.gender,
    statisticalAvailable === true
  );

  const realismPaths = useMemo<Record<Gender, string | null>>(() => {
    if (!realismManifest) return { male: null, female: null };
    return {
      male: pickRealismModelPath(realismManifest.gender.male, renderProfile),
      female: pickRealismModelPath(realismManifest.gender.female, renderProfile),
    };
  }, [realismManifest, renderProfile]);

  const realismFallbackPaths = useMemo<Record<Gender, string | null>>(() => {
    if (!realismManifest) return { male: null, female: null };
    return {
      male: realismManifest.gender.male.fallbackModelPath ?? null,
      female: realismManifest.gender.female.fallbackModelPath ?? null,
    };
  }, [realismManifest]);

  const realismPrimaryAvailable = useAssetPairAvailable(realismPaths);
  const realismFallbackAvailable = useAssetPairAvailable(realismFallbackPaths);

  const customAvailable = maleCustomAvailable === true && femaleCustomAvailable === true;
  const mpfbAvailable = maleMpfbAvailable === true && femaleMpfbAvailable === true;

  const modelVariant: ModelVariant = useMemo(() => {
    if (statisticalAvailable === true) return "statistical";
    if (realismPrimaryAvailable === true) return "realism";
    if (customAvailable) return "custom";
    if (mpfbAvailable) return "mpfb";
    if (realismFallbackAvailable === true) return "realism";
    return "legacy";
  }, [customAvailable, mpfbAvailable, realismFallbackAvailable, realismPrimaryAvailable, statisticalAvailable]);

  const morphAdapter = MODEL_ADAPTERS[modelVariant];
  const realismConfig = realismManifest?.gender[profile.gender];
  const realismPath = realismConfig ? pickRealismModelPath(realismConfig, renderProfile) : null;
  const realismFallbackPath = realismConfig?.fallbackModelPath ?? null;
  const realismAliasMap = realismConfig?.morphMap;

  const effectiveMorphAdapter = useMemo<MorphAdapter>(() => {
    if (modelVariant !== "realism" || !realismAliasMap) return morphAdapter;
    return {
      ...morphAdapter,
      aliases: { ...MORPH_CHANNEL_ALIASES, ...realismAliasMap },
    };
  }, [modelVariant, morphAdapter, realismAliasMap]);

  const modelPath =
    modelVariant === "statistical"
      ? null
      : modelVariant === "realism"
      ? realismPath ?? realismFallbackPath ?? (mpfbAvailable ? MPFB_MODEL_PATHS[profile.gender] : null)
      : modelVariant === "legacy"
      ? LEGACY_MODEL_PATH
      : morphAdapter.paths?.[profile.gender] ?? null;

  const activeMaterialSet = modelVariant === "realism" ? realismConfig?.materialSet : undefined;

  const bmi = useMemo(() => bmiFrom(profile.weightKg, profile.heightCm), [profile.weightKg, profile.heightCm]);
  const bmiClass = useMemo(() => bmiCategory(bmi), [bmi]);

  const derivedMeasurements = useMemo(
    () =>
      estimateMeasurements({
        gender: profile.gender,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        bodyFatPct: profile.bodyFatPct,
      }),
    [profile.gender, profile.heightCm, profile.weightKg, profile.bodyFatPct]
  );

  const measurements = useMemo<MeasurementSet>(() => {
    return {
      chestCm: clamp(
        profile.manualMeasurements?.chestCm ?? derivedMeasurements.chestCm,
        SLIDER_BOUNDS_CM.chestCm.min,
        SLIDER_BOUNDS_CM.chestCm.max
      ),
      waistCm: clamp(
        profile.manualMeasurements?.waistCm ?? derivedMeasurements.waistCm,
        SLIDER_BOUNDS_CM.waistCm.min,
        SLIDER_BOUNDS_CM.waistCm.max
      ),
      hipsCm: clamp(
        profile.manualMeasurements?.hipsCm ?? derivedMeasurements.hipsCm,
        SLIDER_BOUNDS_CM.hipsCm.min,
        SLIDER_BOUNDS_CM.hipsCm.max
      ),
      inseamCm: clamp(
        profile.manualMeasurements?.inseamCm ?? derivedMeasurements.inseamCm,
        SLIDER_BOUNDS_CM.inseamCm.min,
        SLIDER_BOUNDS_CM.inseamCm.max
      ),
    };
  }, [profile.manualMeasurements, derivedMeasurements]);

  const measurementAdjustments = useMemo(
    () => buildMeasurementAdjustments(measurements, derivedMeasurements),
    [measurements, derivedMeasurements]
  );

  useEffect(() => {
    const stored = loadPresets();
    setPresets(stored);
  }, []);

  const applyProfile = useCallback((next: BodyProfile) => {
    setProfile({
      ...next,
      syncMode: "linked",
      advancedMeasurementsEnabled: true,
      manualMeasurements:
        next.manualMeasurements ??
        estimateMeasurements({
          gender: next.gender,
          heightCm: next.heightCm,
          weightKg: next.weightKg,
          bodyFatPct: next.bodyFatPct,
        }),
    });
  }, []);

  const handleGenderChange = (nextGender: Gender) => {
    setProfile((current) => {
      const bounds = bodyFatBounds(nextGender);
      const nextBmi = bmiFrom(current.weightKg, current.heightCm);
      const nextBodyFat = clamp(round(predictBodyFatFromBmi(nextBmi, nextGender), 1), bounds.min, bounds.max);

      const nextProfile: BodyProfile = {
        ...current,
        syncMode: "linked",
        gender: nextGender,
        bodyFatPct: nextBodyFat,
        advancedMeasurementsEnabled: true,
        manualMeasurements: estimateMeasurements({
          gender: nextGender,
          heightCm: current.heightCm,
          weightKg: current.weightKg,
          bodyFatPct: nextBodyFat,
        }),
      };

      return nextProfile;
    });
  };

  const handleUnitsChange = (units: Units) => {
    setProfile((current) => ({ ...current, units }));
  };

  const handleHeightChange = (nextHeightCm: number) => {
    setProfile((current) => {
      const clampedHeight = clamp(nextHeightCm, HEIGHT_CM_MIN, HEIGHT_CM_MAX);
      const nextBmi = bmiFrom(current.weightKg, clampedHeight);
      const bounds = bodyFatBounds(current.gender);
      const nextBodyFat = clamp(round(predictBodyFatFromBmi(nextBmi, current.gender), 1), bounds.min, bounds.max);

      return {
        ...current,
        syncMode: "linked",
        heightCm: clampedHeight,
        bodyFatPct: nextBodyFat,
      };
    });
  };

  const handleWeightChange = (nextWeightKg: number) => {
    setProfile((current) => {
      const clampedWeight = clamp(nextWeightKg, WEIGHT_KG_MIN, WEIGHT_KG_MAX);
      const nextBmi = bmiFrom(clampedWeight, current.heightCm);
      const bounds = bodyFatBounds(current.gender);
      const nextBodyFat = clamp(round(predictBodyFatFromBmi(nextBmi, current.gender), 1), bounds.min, bounds.max);

      return {
        ...current,
        syncMode: "linked",
        weightKg: clampedWeight,
        bodyFatPct: nextBodyFat,
      };
    });
  };

  const handleBodyFatChange = (nextBodyFatPct: number) => {
    setProfile((current) => {
      const bounds = bodyFatBounds(current.gender);
      const clampedBodyFat = clamp(nextBodyFatPct, bounds.min, bounds.max);
      const modeledBmi = clamp(bmiFromPredictedBodyFat(clampedBodyFat, current.gender), BMI_MIN, BMI_MAX);
      const modeledWeight = clamp(weightFromBmi(modeledBmi, current.heightCm), WEIGHT_KG_MIN, WEIGHT_KG_MAX);
      return {
        ...current,
        syncMode: "linked",
        bodyFatPct: clampedBodyFat,
        weightKg: modeledWeight,
      };
    });
  };

  const handleBmiChange = (nextBmi: number) => {
    setProfile((current) => {
      const clampedBmi = clamp(nextBmi, BMI_MIN, BMI_MAX);
      const nextWeight = clamp(weightFromBmi(clampedBmi, current.heightCm), WEIGHT_KG_MIN, WEIGHT_KG_MAX);
      const bounds = bodyFatBounds(current.gender);
      const nextBodyFat = clamp(round(predictBodyFatFromBmi(clampedBmi, current.gender), 1), bounds.min, bounds.max);

      return {
        ...current,
        syncMode: "linked",
        weightKg: nextWeight,
        bodyFatPct: nextBodyFat,
      };
    });
  };

  const handleMeasurementChange = (key: keyof MeasurementSet, valueCm: number) => {
    setProfile((current) => {
      const bounds = SLIDER_BOUNDS_CM[key];
      const nextManual: MeasurementSet = {
        ...(current.manualMeasurements ?? derivedMeasurements),
        [key]: clamp(valueCm, bounds.min, bounds.max),
      };
      return {
        ...current,
        manualMeasurements: nextManual,
      };
    });
  };

  const currentProfile = profile;

  const activePresetName = activePresetId
    ? presets.find((preset) => preset.id === activePresetId)?.name ?? "Saved"
    : "New";

  const isDirty = !compareProfiles(currentProfile, savedBaselineProfile);

  const saveCurrentAsPreset = () => {
    const now = new Date().toISOString();

    if (activePresetId) {
      const nextPresets = presets.map((preset) =>
        preset.id === activePresetId ? { ...preset, profile: currentProfile, updatedAt: now } : preset
      );
      setPresets(nextPresets);
      persistPresets(nextPresets);
      setSavedBaselineProfile(currentProfile);
      return;
    }

    const nameRaw = window.prompt("Name this preset", `Body ${presets.length + 1}`);
    const name = nameRaw?.trim();
    if (!name) return;

    const created: PresetRecord = {
      id: `preset_${Math.random().toString(36).slice(2, 10)}`,
      name,
      profile: currentProfile,
      createdAt: now,
      updatedAt: now,
    };

    const nextPresets = [created, ...presets];
    setPresets(nextPresets);
    persistPresets(nextPresets);
    setActivePresetId(created.id);
    setSavedBaselineProfile(currentProfile);
  };

  const resetToDefault = () => {
    const next = createDefaultProfile(profile.gender);
    applyProfile(next);
    setSavedBaselineProfile(next);
    setActivePresetId(null);
  };

  const resetToSaved = () => {
    applyProfile(savedBaselineProfile);
  };

  const newProfileDraft = () => {
    const next = createDefaultProfile(profile.gender);
    applyProfile(next);
    setSavedBaselineProfile(next);
    setActivePresetId(null);
  };

  const loadPreset = (preset: PresetRecord) => {
    setActivePresetId(preset.id);
    applyProfile(preset.profile);
    setSavedBaselineProfile(preset.profile);
  };

  const captureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const payload: SnapshotPayload = {
        gender: profile.gender,
        units: profile.units,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        bodyFatPct: profile.bodyFatPct,
        bmi,
        measurements,
        timestampIso: new Date().toISOString(),
        presetName: activePresetName,
      };

      setSnapshotPreviewImage(dataUrl);
      setSnapshotPayload(payload);
      setSnapshotOpen(true);
    } catch (error) {
      console.error("Snapshot capture failed", error);
    }
  };

  const downloadSnapshot = async () => {
    if (!snapshotPayload || !snapshotPreviewImage) return;
    await exportSnapshotCardPng(snapshotPayload, snapshotPreviewImage);
  };

  const modelBadgeText = useMemo(() => {
    if (modelVariant === "statistical") {
      if (!statisticalLoaded) return "Statistical morph render (loading data...)";
      if (!statisticalShapeData) return "Statistical morph render unavailable (fallback active)";
      return "Statistical morph render (high-detail reference)";
    }
    if (modelVariant === "realism") {
      const lodLabel =
        renderProfile === "desktop-high"
          ? realismConfig?.lod?.desktopLabel ?? "Desktop high"
          : realismConfig?.lod?.mobileLabel ?? "Mobile fallback";
      return `Realistic premium render (${lodLabel})`;
    }
    if (modelVariant === "mpfb" && realismManifest && realismPrimaryAvailable === false) {
      return "MPFB render (premium realism files pending import)";
    }
    if (modelVariant === "custom") return MODEL_ADAPTERS.custom.label;
    if (modelVariant === "mpfb") return MODEL_ADAPTERS.mpfb.label;
    return "Legacy fallback render";
  }, [
    modelVariant,
    realismConfig?.lod?.desktopLabel,
    realismConfig?.lod?.mobileLabel,
    realismManifest,
    realismPrimaryAvailable,
    renderProfile,
    statisticalLoaded,
    statisticalShapeData,
  ]);

  return (
    <section className="w-full">
      <div className="overflow-hidden border-y border-gray-200 bg-transparent text-black">
        <div className="grid min-h-[calc(100vh-10rem)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div className="relative p-0">
            <div className="absolute right-8 top-7 z-20 md:hidden">
              <button
                type="button"
                className="inline-flex rounded-lg border border-gray-300 bg-white p-2 text-black transition hover:border-gray-400"
                onClick={() => setMobilePanelOpen(true)}
                aria-label="Open controls"
              >
                <Menu size={18} />
              </button>
            </div>

            <div className="absolute left-8 top-7 z-20 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={resetToDefault}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black"
              >
                Default Body
              </button>
              <button
                type="button"
                onClick={newProfileDraft}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black hover:border-gray-400"
              >
                + New
              </button>
              {presets.slice(0, 3).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => loadPreset(preset)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    activePresetId === preset.id
                      ? "border-[#5e17eb]/45 bg-[#5e17eb]/12 text-black"
                      : "border-gray-300 bg-white text-black hover:border-gray-400"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <div className="h-full min-h-[620px]">
              <BodyRender
                gender={profile.gender}
                bmi={bmi}
                bodyFatPct={profile.bodyFatPct}
                weightKg={profile.weightKg}
                heightCm={profile.heightCm}
                measurements={measurements}
                viewPreset={viewPreset}
                modelVariant={modelVariant}
                morphAdapter={effectiveMorphAdapter}
                modelPath={modelPath}
                measurementAdjustments={measurementAdjustments}
                statisticalShapeData={statisticalShapeData}
                materialSet={activeMaterialSet}
                renderProfile={renderProfile}
                onCanvasReady={(el) => {
                  canvasRef.current = el;
                }}
              />
            </div>

            <div className="absolute bottom-8 right-8 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={captureSnapshot}
                className="rounded-full border border-gray-300 bg-white p-2.5 text-black transition hover:border-gray-400"
                aria-label="Share Snapshot"
              >
                <Share2 size={16} />
              </button>
              <button
                type="button"
                onClick={captureSnapshot}
                className="rounded-full border border-gray-300 bg-white p-2.5 text-black transition hover:border-gray-400"
                aria-label="Take Snapshot"
              >
                <Camera size={16} />
              </button>
            </div>

            <div className="absolute bottom-8 left-8 z-20 flex flex-wrap items-center gap-2 text-xs text-black">
              <div className="rounded-full border border-gray-300 bg-white px-3 py-1">{modelBadgeText}</div>
              <div className="rounded-full border border-gray-300 bg-white px-3 py-1">Drag to rotate, scroll to zoom</div>
            </div>

            <div className="absolute right-8 top-7 z-20 hidden items-center gap-2 rounded-full border border-gray-300 bg-white p-1 md:flex">
              {([
                ["front", "Front"],
                ["left", "Left"],
                ["right", "Right"],
                ["back", "Back"],
              ] as Array<[ViewPreset, string]>).map(([preset, label]) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setViewPreset(preset)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    viewPreset === preset ? "bg-gray-200 text-black" : "text-black"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <aside className="hidden border-l border-gray-200 p-4 lg:block">
            <ControlPanel
              profile={profile}
              bmi={bmi}
              bmiClass={bmiClass}
              measurements={measurements}
              activePresetName={activePresetName}
              canResetSaved={Boolean(savedBaselineProfile)}
              isDirty={isDirty}
              onGenderChange={handleGenderChange}
              onUnitsChange={handleUnitsChange}
              onHeightChange={handleHeightChange}
              onWeightChange={handleWeightChange}
              onBodyFatChange={handleBodyFatChange}
              onBmiChange={handleBmiChange}
              onMeasurementChange={handleMeasurementChange}
              onResetDefault={resetToDefault}
              onResetSaved={resetToSaved}
              onSavePreset={saveCurrentAsPreset}
            />
          </aside>
        </div>
      </div>

      {mobilePanelOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end bg-white/70 backdrop-blur-sm lg:hidden">
          <div className="max-h-[86vh] w-full overflow-hidden rounded-t-3xl border-t border-gray-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="text-sm font-semibold text-black">Controls</p>
              <button
                type="button"
                onClick={() => setMobilePanelOpen(false)}
                className="rounded-md p-2 text-black hover:bg-gray-100"
                aria-label="Close controls"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[78vh] overflow-y-auto pb-4">
              <ControlPanel
                profile={profile}
                bmi={bmi}
                bmiClass={bmiClass}
                measurements={measurements}
                activePresetName={activePresetName}
                canResetSaved={Boolean(savedBaselineProfile)}
                isDirty={isDirty}
                onGenderChange={handleGenderChange}
                onUnitsChange={handleUnitsChange}
                onHeightChange={handleHeightChange}
                onWeightChange={handleWeightChange}
                onBodyFatChange={handleBodyFatChange}
                onBmiChange={handleBmiChange}
                onMeasurementChange={handleMeasurementChange}
                onResetDefault={resetToDefault}
                onResetSaved={resetToSaved}
                onSavePreset={saveCurrentAsPreset}
              />
            </div>
          </div>
        </div>
      ) : null}

      <SnapshotModal
        open={snapshotOpen}
        snapshotPayload={snapshotPayload}
        previewImage={snapshotPreviewImage}
        onClose={() => setSnapshotOpen(false)}
        onDownload={downloadSnapshot}
      />
    </section>
  );
}

useGLTF.preload(LEGACY_MODEL_PATH);
useGLTF.preload(MPFB_MODEL_PATHS.male);
useGLTF.preload(MPFB_MODEL_PATHS.female);
useGLTF.preload("/models/body-visualizer/realism/premium/male/body_male_realism_v1.glb");
useGLTF.preload("/models/body-visualizer/realism/premium/female/body_female_realism_v1.glb");
