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
} from "three";
import { Color } from "three";
import {
  Camera,
  Heart,
  Menu,
  MoveHorizontal,
  RotateCcw,
  Ruler,
  Save,
  Share2,
  SlidersHorizontal,
  Weight,
  X,
} from "lucide-react";

type Gender = "male" | "female";
type Units = "imperial" | "metric";
type SyncMode = "linked" | "independent";
type ViewPreset = "front" | "left" | "right" | "back";
type ModelVariant = "legacy" | "mpfb" | "custom";

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

const LEGACY_MODEL_PATH = "/models/body-visualizer/male_base_mesh.glb";
const MPFB_MODEL_PATHS: Record<Gender, string> = {
  male: "/models/body-visualizer/mpfb/body_male_v1.glb",
  female: "/models/body-visualizer/mpfb/body_female_v1.glb",
};

const CUSTOM_MODEL_PATHS: Record<Gender, string> = {
  male: "/models/body-visualizer/custom/body_male_v2.glb",
  female: "/models/body-visualizer/custom/body_female_v2.glb",
};

const MODEL_ADAPTERS: Record<ModelVariant, MorphAdapter> = {
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
  const leanProxy = clamp((bmi * (1 - bodyFatPct / 100) - 15) / 12, 0, 1);

  const fatCurve = Math.pow(fatNorm, 1.14);
  const fatMid = smoothstep(0.2, 0.62, fatNorm);
  const fatHigh = smoothstep(0.58, 0.9, fatNorm);
  const bmiCurve = Math.pow(bmiNorm, 1.06);
  const leanCurve = Math.pow(leanProxy, 0.94);

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

  const torsoMuscle = clamp(0.18 + 0.82 * leanCurve - 0.34 * fatCurve, 0, 1);
  const chestMuscle = clamp(
    (0.18 + 0.78 * leanCurve - 0.24 * fatCurve) * (gender === "male" ? 1.05 : 0.82),
    0,
    1
  );
  const shoulderMuscle = clamp(
    (0.16 + 0.82 * leanCurve - 0.18 * fatCurve) * (gender === "male" ? 1.08 : 0.8),
    0,
    1
  );

  const armFat = clamp(
    0.25 * fatCurve + 0.32 * fatMid + 0.1 * bmiCurve + measurementAdjustments.chestDelta * 0.25,
    0,
    1
  );
  const forearmFat = clamp(0.18 * fatCurve + 0.22 * fatMid, 0, 1);
  const armMuscle = clamp((0.14 + 0.88 * leanCurve - 0.28 * fatCurve) * (gender === "female" ? 0.92 : 1.05), 0, 1);
  const forearmMuscle = clamp((0.18 + 0.74 * leanCurve - 0.16 * fatCurve) * (gender === "female" ? 0.9 : 1.03), 0, 1);

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
  const legMuscle = clamp((0.16 + 0.78 * leanCurve - 0.2 * fatCurve) * (gender === "female" ? 0.98 : 1), 0, 1);
  const calfMuscle = clamp((0.16 + 0.7 * leanCurve - 0.14 * fatCurve) * (gender === "female" ? 0.92 : 1.02), 0, 1);
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
    macro_muscle: clamp(0.12 + 0.92 * leanCurve - 0.18 * fatCurve, 0, 1),
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

function applyMaterialOverride(root: Group, gender: Gender) {
  const flatSkinColor = gender === "female" ? "#dce5f2" : "#d9e2ef";

  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return;

    const mesh = obj as Mesh;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const updated = mats.map((mat) => {
      const source = mat as MeshStandardMaterial;
      const clonedMat = source.clone();
      clonedMat.map = source.map ?? null;
      clonedMat.color = source.map ? new Color("#ffffff") : new Color(flatSkinColor);
      clonedMat.roughness = source.map ? 0.72 : 0.56;
      clonedMat.metalness = 0;
      clonedMat.envMapIntensity = source.map ? 0.25 : 0.35;
      clonedMat.needsUpdate = true;
      return clonedMat;
    });

    mesh.material = Array.isArray(mesh.material) ? updated : updated[0];
  });
}

function useAssetAvailable(path: string) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
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

function LegacyHumanModel(props: {
  gender: Gender;
  bmi: number;
  bodyFatPct: number;
  heightCm: number;
}) {
  const { gender, bmi, bodyFatPct, heightCm } = props;
  const gltf = useGLTF(LEGACY_MODEL_PATH);

  const modelRoot = useMemo(() => {
    const cloned = clone(gltf.scene) as Group;
    applyMaterialOverride(cloned, gender);
    return cloned;
  }, [gender, gltf.scene]);

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
}) {
  const {
    modelPath,
    morphAdapter,
    gender,
    bmi,
    bodyFatPct,
    heightCm,
    measurementAdjustments,
  } = props;
  const gltf = useGLTF(modelPath);

  const modelRoot = useMemo(() => {
    const cloned = clone(gltf.scene) as Group;
    applyMaterialOverride(cloned, gender);
    return cloned;
  }, [gender, gltf.scene]);

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
    morphMeshes.forEach((mesh) => {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

      for (let i = 0; i < mesh.morphTargetInfluences.length; i += 1) {
        mesh.morphTargetInfluences[i] = 0;
      }

      (Object.keys(channels) as MorphChannel[]).forEach((channel) => {
        const index = resolveMorphIndex(mesh.morphTargetDictionary!, channel, morphAdapter);
        if (index === null) return;
        mesh.morphTargetInfluences![index] = channels[channel];
      });
    });
  }, [channels, morphAdapter, morphMeshes]);

  return <primitive object={modelRoot} position={[0, 0, 0]} rotation={[0, 0, 0]} />;
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
  heightCm: number;
  viewPreset: ViewPreset;
  modelVariant: ModelVariant;
  morphAdapter: MorphAdapter;
  modelPath: string | null;
  measurementAdjustments: MeasurementAdjustments;
  onCanvasReady: (element: HTMLCanvasElement | null) => void;
}) {
  const {
    gender,
    bmi,
    bodyFatPct,
    heightCm,
    viewPreset,
    modelVariant,
    morphAdapter,
    modelPath,
    measurementAdjustments,
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
    <div className="relative h-full w-full overflow-hidden rounded-[26px] border border-white/10 bg-[#02050b]">
      <Canvas
        camera={{ position: [0, 0.08, 5.3], fov: 24 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <color attach="background" args={["#02050b"]} />

        <hemisphereLight intensity={0.42} groundColor="#070a10" />
        <directionalLight position={[3.5, 4.2, 2.4]} intensity={1.1} />
        <directionalLight position={[-2.8, 1.4, -1.8]} intensity={0.48} />
        <directionalLight position={[0.2, -2.1, 2.3]} intensity={0.22} />

        <Suspense fallback={null}>
          <group position={[-0.02, 0.02, 0]} rotation={[0, modelYaw + viewOffset, 0]}>
            {modelVariant === "legacy" || !modelPath ? (
              <LegacyHumanModel gender={gender} bmi={bmi} bodyFatPct={bodyFatPct} heightCm={heightCm} />
            ) : (
              <MorphTargetModel
                modelPath={modelPath}
                morphAdapter={morphAdapter}
                gender={gender}
                bmi={bmi}
                bodyFatPct={bodyFatPct}
                heightCm={heightCm}
                measurementAdjustments={measurementAdjustments}
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
          rotateSpeed={0.8}
          minDistance={3.6}
          maxDistance={7.5}
          minPolarAngle={Math.PI / 2 - 0.5}
          maxPolarAngle={Math.PI / 2 + 0.5}
          target={[0, 1.02, 0]}
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
        <div className="flex items-center gap-2 text-white/80">
          <span className="text-white/40">{icon}</span>
          <span className="font-medium">{label}</span>
        </div>
        <p className="font-semibold text-white/90">{valueLabel}</p>
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
        active ? "bg-white/18 text-white" : "text-white/55 hover:text-white"
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
  derivedMeasurements: MeasurementSet;
  activePresetName: string;
  canResetSaved: boolean;
  isDirty: boolean;
  onGenderChange: (gender: Gender) => void;
  onUnitsChange: (units: Units) => void;
  onSyncModeChange: (mode: SyncMode) => void;
  onHeightChange: (valueCm: number) => void;
  onWeightChange: (valueKg: number) => void;
  onBodyFatChange: (value: number) => void;
  onBmiChange: (value: number) => void;
  onMeasurementChange: (key: keyof MeasurementSet, valueCm: number) => void;
  onToggleAdvancedMeasurements: () => void;
  onResetDefault: () => void;
  onResetSaved: () => void;
  onSavePreset: () => void;
}) {
  const {
    profile,
    bmi,
    bmiClass,
    measurements,
    derivedMeasurements,
    activePresetName,
    canResetSaved,
    isDirty,
    onGenderChange,
    onUnitsChange,
    onSyncModeChange,
    onHeightChange,
    onWeightChange,
    onBodyFatChange,
    onBmiChange,
    onMeasurementChange,
    onToggleAdvancedMeasurements,
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

  const measurementSubtitle = profile.advancedMeasurementsEnabled
    ? "Manual measurements influence local morph detail"
    : "Auto mode derives measurements from height, weight, and body fat";

  return (
    <div className="flex h-full flex-col rounded-[24px] border border-white/10 bg-white/[0.03]">
      <div className="border-b border-white/10 p-4">
        <div className="grid grid-cols-2 rounded-xl bg-black/40 p-1">
          <PanelButton active={profile.gender === "female"} onClick={() => onGenderChange("female")}>Female</PanelButton>
          <PanelButton active={profile.gender === "male"} onClick={() => onGenderChange("male")}>Male</PanelButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <div className="inline-flex rounded-xl bg-black/40 p-1">
          <PanelButton active={profile.units === "imperial"} onClick={() => onUnitsChange("imperial")}>Imperial</PanelButton>
          <PanelButton active={profile.units === "metric"} onClick={() => onUnitsChange("metric")}>Metric</PanelButton>
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
            disabled={!profile.advancedMeasurementsEnabled}
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
            disabled={!profile.advancedMeasurementsEnabled}
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
            disabled={!profile.advancedMeasurementsEnabled}
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
            disabled={!profile.advancedMeasurementsEnabled}
          />

          <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">
            <button
              type="button"
              onClick={onToggleAdvancedMeasurements}
              className="flex w-full items-center justify-between font-semibold text-white/90"
            >
              <span>Advanced measurements</span>
              <span>{profile.advancedMeasurementsEnabled ? "On" : "Off"}</span>
            </button>
            <p className="mt-2 text-white/60">{measurementSubtitle}</p>
            {!profile.advancedMeasurementsEnabled ? (
              <p className="mt-2 text-white/40">
                Auto reference: chest {formatLength(derivedMeasurements.chestCm, profile.units)}, waist {formatLength(derivedMeasurements.waistCm, profile.units)}, hips {formatLength(derivedMeasurements.hipsCm, profile.units)}, inseam {formatLength(derivedMeasurements.inseamCm, profile.units)}.
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Core composition</p>
              <div className="inline-flex rounded-lg bg-black/40 p-1">
                <button
                  type="button"
                  onClick={() => onSyncModeChange("linked")}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                    profile.syncMode === "linked" ? "bg-white/20 text-white" : "text-white/55"
                  }`}
                >
                  Linked
                </button>
                <button
                  type="button"
                  onClick={() => onSyncModeChange("independent")}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                    profile.syncMode === "independent" ? "bg-white/20 text-white" : "text-white/55"
                  }`}
                >
                  Independent
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <SliderField
                icon={<SlidersHorizontal size={16} />}
                label="Body Fat %"
                valueLabel={`${round(profile.bodyFatPct, 1)}%`}
                min={bounds.min}
                max={bounds.max}
                step={0.1}
                value={round(profile.bodyFatPct, 1)}
                onChange={onBodyFatChange}
              />

              <SliderField
                icon={<SlidersHorizontal size={16} />}
                label="BMI"
                valueLabel={round(bmi, 1).toString()}
                min={BMI_MIN}
                max={BMI_MAX}
                step={0.1}
                value={round(bmi, 1)}
                onChange={onBmiChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-white/10 p-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onResetDefault}
            className="flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm font-medium text-white/85 transition hover:border-white/40"
          >
            <RotateCcw size={14} />
            Reset Default
          </button>
          <button
            type="button"
            onClick={onResetSaved}
            disabled={!canResetSaved}
            className="flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm font-medium text-white/85 transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={14} />
            Reset Saved
          </button>
        </div>

        <button
          type="button"
          onClick={onSavePreset}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2ecc71] px-4 py-2.5 text-sm font-semibold text-[#07120b] transition hover:bg-[#35db7b]"
        >
          <Save size={15} />
          {isDirty ? `Save (${activePresetName})` : "Saved"}
        </button>

        <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
          <div className="mb-2 flex items-end justify-between">
            <p className="text-sm text-white/70">
              BMI <span className="text-2xl font-bold text-white">{round(bmi, 1)}</span>
            </p>
            <p className="text-sm font-semibold" style={{ color: bmiClass.color }}>
              {bmiClass.label}
            </p>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] via-[#66cf7f] via-50% to-[#ef5f7b]" />
            <div
              className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-white"
              style={{
                left: `${clamp(((bmi - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100, 0, 100)}%`,
              }}
            />
          </div>
        </div>
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-5xl rounded-3xl border border-white/15 bg-[#070b14] p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-3xl font-semibold">Snapshot</h3>
            <p className="mt-2 text-white/60">Export a fixed-size share card with your current body stats.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-2">
            <img src={previewImage} alt="Snapshot Preview" className="h-[360px] w-full rounded-xl object-cover" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-wide text-white/50">{snapshotPayload.gender} profile</p>
            <div className="mt-3 space-y-2 text-sm text-white/85">
              <p>Height: {formatHeight(snapshotPayload.heightCm, snapshotPayload.units)}</p>
              <p>Weight: {formatWeight(snapshotPayload.weightKg, snapshotPayload.units)}</p>
              <p>Chest: {formatLength(snapshotPayload.measurements.chestCm, snapshotPayload.units)}</p>
              <p>Waist: {formatLength(snapshotPayload.measurements.waistCm, snapshotPayload.units)}</p>
              <p>Hips: {formatLength(snapshotPayload.measurements.hipsCm, snapshotPayload.units)}</p>
              <p>Inseam: {formatLength(snapshotPayload.measurements.inseamCm, snapshotPayload.units)}</p>
              <p>BMI: {round(snapshotPayload.bmi, 1)}</p>
              <p>Body Fat: {round(snapshotPayload.bodyFatPct, 1)}%</p>
            </div>
            <p className="mt-4 text-xs text-white/50">{new Date(snapshotPayload.timestampIso).toLocaleString()}</p>
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
            className="rounded-xl bg-[#2ecc71] px-5 py-2.5 font-semibold text-[#07120b] transition hover:bg-[#35db7b] disabled:opacity-60"
          >
            {isDownloading ? "Preparing..." : "Download PNG"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/25 px-5 py-2.5 font-semibold text-white/85 transition hover:border-white/40"
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

  const maleCustomAvailable = useAssetAvailable(CUSTOM_MODEL_PATHS.male);
  const femaleCustomAvailable = useAssetAvailable(CUSTOM_MODEL_PATHS.female);
  const maleMpfbAvailable = useAssetAvailable(MPFB_MODEL_PATHS.male);
  const femaleMpfbAvailable = useAssetAvailable(MPFB_MODEL_PATHS.female);

  const modelVariant: ModelVariant =
    maleCustomAvailable === true && femaleCustomAvailable === true
      ? "custom"
      : maleMpfbAvailable === true && femaleMpfbAvailable === true
      ? "mpfb"
      : "legacy";

  const morphAdapter = MODEL_ADAPTERS[modelVariant];
  const modelPath = modelVariant === "legacy" ? LEGACY_MODEL_PATH : morphAdapter.paths?.[profile.gender] ?? null;

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
    if (!profile.advancedMeasurementsEnabled) return derivedMeasurements;

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
  }, [profile.advancedMeasurementsEnabled, profile.manualMeasurements, derivedMeasurements]);

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
      manualMeasurements: next.advancedMeasurementsEnabled
        ? next.manualMeasurements ??
          estimateMeasurements({
            gender: next.gender,
            heightCm: next.heightCm,
            weightKg: next.weightKg,
            bodyFatPct: next.bodyFatPct,
          })
        : undefined,
    });
  }, []);

  const handleGenderChange = (nextGender: Gender) => {
    setProfile((current) => {
      const bounds = bodyFatBounds(nextGender);
      const nextBmi = bmiFrom(current.weightKg, current.heightCm);
      const nextBodyFat =
        current.syncMode === "linked"
          ? clamp(round(predictBodyFatFromBmi(nextBmi, nextGender), 1), bounds.min, bounds.max)
          : clamp(current.bodyFatPct, bounds.min, bounds.max);

      const nextProfile: BodyProfile = {
        ...current,
        gender: nextGender,
        bodyFatPct: nextBodyFat,
      };

      if (nextProfile.advancedMeasurementsEnabled) {
        nextProfile.manualMeasurements = estimateMeasurements({
          gender: nextGender,
          heightCm: nextProfile.heightCm,
          weightKg: nextProfile.weightKg,
          bodyFatPct: nextProfile.bodyFatPct,
        });
      }

      return nextProfile;
    });
  };

  const handleUnitsChange = (units: Units) => {
    setProfile((current) => ({ ...current, units }));
  };

  const handleSyncModeChange = (syncMode: SyncMode) => {
    setProfile((current) => ({ ...current, syncMode }));
  };

  const handleHeightChange = (nextHeightCm: number) => {
    setProfile((current) => {
      const clampedHeight = clamp(nextHeightCm, HEIGHT_CM_MIN, HEIGHT_CM_MAX);
      let nextBodyFat = current.bodyFatPct;
      if (current.syncMode === "linked") {
        const nextBmi = bmiFrom(current.weightKg, clampedHeight);
        const bounds = bodyFatBounds(current.gender);
        nextBodyFat = clamp(round(predictBodyFatFromBmi(nextBmi, current.gender), 1), bounds.min, bounds.max);
      }

      return {
        ...current,
        heightCm: clampedHeight,
        bodyFatPct: nextBodyFat,
      };
    });
  };

  const handleWeightChange = (nextWeightKg: number) => {
    setProfile((current) => {
      const clampedWeight = clamp(nextWeightKg, WEIGHT_KG_MIN, WEIGHT_KG_MAX);
      let nextBodyFat = current.bodyFatPct;
      if (current.syncMode === "linked") {
        const nextBmi = bmiFrom(clampedWeight, current.heightCm);
        const bounds = bodyFatBounds(current.gender);
        nextBodyFat = clamp(round(predictBodyFatFromBmi(nextBmi, current.gender), 1), bounds.min, bounds.max);
      }

      return {
        ...current,
        weightKg: clampedWeight,
        bodyFatPct: nextBodyFat,
      };
    });
  };

  const handleBodyFatChange = (nextBodyFatPct: number) => {
    setProfile((current) => {
      const bounds = bodyFatBounds(current.gender);
      const clampedBodyFat = clamp(nextBodyFatPct, bounds.min, bounds.max);
      if (current.syncMode !== "linked") {
        return {
          ...current,
          bodyFatPct: clampedBodyFat,
        };
      }

      const modeledBmi = clamp(bmiFromPredictedBodyFat(clampedBodyFat, current.gender), BMI_MIN, BMI_MAX);
      const modeledWeight = clamp(weightFromBmi(modeledBmi, current.heightCm), WEIGHT_KG_MIN, WEIGHT_KG_MAX);
      return {
        ...current,
        bodyFatPct: clampedBodyFat,
        weightKg: modeledWeight,
      };
    });
  };

  const handleBmiChange = (nextBmi: number) => {
    setProfile((current) => {
      const clampedBmi = clamp(nextBmi, BMI_MIN, BMI_MAX);
      const nextWeight = clamp(weightFromBmi(clampedBmi, current.heightCm), WEIGHT_KG_MIN, WEIGHT_KG_MAX);
      let nextBodyFat = current.bodyFatPct;
      if (current.syncMode === "linked") {
        const bounds = bodyFatBounds(current.gender);
        nextBodyFat = clamp(round(predictBodyFatFromBmi(clampedBmi, current.gender), 1), bounds.min, bounds.max);
      }

      return {
        ...current,
        weightKg: nextWeight,
        bodyFatPct: nextBodyFat,
      };
    });
  };

  const handleMeasurementChange = (key: keyof MeasurementSet, valueCm: number) => {
    setProfile((current) => {
      if (!current.advancedMeasurementsEnabled) return current;
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

  const toggleAdvancedMeasurements = () => {
    setProfile((current) => {
      if (!current.advancedMeasurementsEnabled) {
        return {
          ...current,
          advancedMeasurementsEnabled: true,
          manualMeasurements: derivedMeasurements,
        };
      }

      return {
        ...current,
        advancedMeasurementsEnabled: false,
        manualMeasurements: undefined,
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
    if (modelVariant === "custom") return MODEL_ADAPTERS.custom.label;
    if (modelVariant === "mpfb") return MODEL_ADAPTERS.mpfb.label;
    return "Legacy fallback render";
  }, [modelVariant]);

  return (
    <section className="w-full">
      <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#04070d] text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <header className="border-b border-white/10 bg-[radial-gradient(circle_at_center,_rgba(45,120,88,0.2),_rgba(4,7,13,0.98)_60%)] px-5 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/favicon.ico" alt="Body Visualizer" className="h-10 w-10 rounded-xl" />
              <div>
                <p className="text-2xl font-semibold leading-none">Body Visualizer</p>
                <p className="mt-1 text-xs text-white/50">Visual estimator, non-clinical</p>
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <PanelButton active={profile.gender === "female"} onClick={() => handleGenderChange("female")}>Female</PanelButton>
              <PanelButton active={profile.gender === "male"} onClick={() => handleGenderChange("male")}>Male</PanelButton>
            </div>

            <div className="flex items-center gap-2 text-white/65">
              <span className="hidden text-sm sm:inline">English</span>
              <button
                type="button"
                className="inline-flex rounded-lg border border-white/20 p-2 text-white/75 transition hover:border-white/40 lg:hidden"
                onClick={() => setMobilePanelOpen(true)}
                aria-label="Open controls"
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="grid min-h-[760px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div className="relative p-4 sm:p-6 lg:p-7">
            <div className="absolute left-8 top-7 z-20 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={resetToDefault}
                className="rounded-full border border-white/30 bg-white/16 px-4 py-2 text-sm font-medium text-white"
              >
                Default Body
              </button>
              <button
                type="button"
                onClick={newProfileDraft}
                className="rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm font-medium text-white/85 hover:border-white/40"
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
                      ? "border-[#2ecc71] bg-[#2ecc71]/20 text-[#8df0b3]"
                      : "border-white/20 bg-black/25 text-white/70 hover:border-white/35"
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
                heightCm={profile.heightCm}
                viewPreset={viewPreset}
                modelVariant={modelVariant}
                morphAdapter={morphAdapter}
                modelPath={modelPath}
                measurementAdjustments={measurementAdjustments}
                onCanvasReady={(el) => {
                  canvasRef.current = el;
                }}
              />
            </div>

            <div className="absolute bottom-8 right-8 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={captureSnapshot}
                className="rounded-full border border-white/20 bg-black/45 p-2.5 text-white/85 transition hover:border-white/40 hover:text-white"
                aria-label="Share Snapshot"
              >
                <Share2 size={16} />
              </button>
              <button
                type="button"
                onClick={captureSnapshot}
                className="rounded-full border border-white/20 bg-black/45 p-2.5 text-white/85 transition hover:border-white/40 hover:text-white"
                aria-label="Take Snapshot"
              >
                <Camera size={16} />
              </button>
            </div>

            <div className="absolute bottom-8 left-8 z-20 flex flex-wrap items-center gap-2 text-xs text-white/55">
              <div className="rounded-full border border-white/20 bg-black/35 px-3 py-1">{modelBadgeText}</div>
              <div className="rounded-full border border-white/20 bg-black/35 px-3 py-1">Drag to rotate, scroll to zoom</div>
            </div>

            <div className="absolute right-8 top-7 z-20 hidden items-center gap-2 rounded-full border border-white/15 bg-black/30 p-1 md:flex">
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
                    viewPreset === preset ? "bg-white/20 text-white" : "text-white/55"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <aside className="hidden border-l border-white/10 p-4 lg:block">
            <ControlPanel
              profile={profile}
              bmi={bmi}
              bmiClass={bmiClass}
              measurements={measurements}
              derivedMeasurements={derivedMeasurements}
              activePresetName={activePresetName}
              canResetSaved={Boolean(savedBaselineProfile)}
              isDirty={isDirty}
              onGenderChange={handleGenderChange}
              onUnitsChange={handleUnitsChange}
              onSyncModeChange={handleSyncModeChange}
              onHeightChange={handleHeightChange}
              onWeightChange={handleWeightChange}
              onBodyFatChange={handleBodyFatChange}
              onBmiChange={handleBmiChange}
              onMeasurementChange={handleMeasurementChange}
              onToggleAdvancedMeasurements={toggleAdvancedMeasurements}
              onResetDefault={resetToDefault}
              onResetSaved={resetToSaved}
              onSavePreset={saveCurrentAsPreset}
            />
          </aside>
        </div>
      </div>

      {mobilePanelOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/65 backdrop-blur-sm lg:hidden">
          <div className="max-h-[86vh] w-full overflow-hidden rounded-t-3xl border-t border-white/15 bg-[#050811] p-3">
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="text-sm font-semibold text-white/80">Controls</p>
              <button
                type="button"
                onClick={() => setMobilePanelOpen(false)}
                className="rounded-md p-2 text-white/70 hover:bg-white/10"
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
                derivedMeasurements={derivedMeasurements}
                activePresetName={activePresetName}
                canResetSaved={Boolean(savedBaselineProfile)}
                isDirty={isDirty}
                onGenderChange={handleGenderChange}
                onUnitsChange={handleUnitsChange}
                onSyncModeChange={handleSyncModeChange}
                onHeightChange={handleHeightChange}
                onWeightChange={handleWeightChange}
                onBodyFatChange={handleBodyFatChange}
                onBmiChange={handleBmiChange}
                onMeasurementChange={handleMeasurementChange}
                onToggleAdvancedMeasurements={toggleAdvancedMeasurements}
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
