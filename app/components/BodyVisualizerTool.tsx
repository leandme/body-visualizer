"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { Bone, Group, Mesh, MeshStandardMaterial, SkinnedMesh } from "three";
import { Color } from "three";

type Gender = "male" | "female";
type Units = "imperial" | "metric";
type SyncMode = "linked" | "independent";
type RenderMode = "legacy" | "mpfb";
type ViewPreset = "front" | "left" | "right" | "back";

type BodyFatBounds = {
  min: number;
  max: number;
};

type Category = {
  label: string;
  color: string;
  note: string;
};

const HEIGHT_CM_MIN = 145;
const HEIGHT_CM_MAX = 210;
const WEIGHT_KG_MIN = 40;
const WEIGHT_KG_MAX = 220;
const BMI_MIN = 16;
const BMI_MAX = 45;
const MODEL_AGE = 30;
const LEGACY_FRONT_MODEL_YAW = Math.PI / 2;
const MPFB_FRONT_MODEL_YAW = 0;
const LEGACY_MODEL_PATH = "/models/body-visualizer/male_base_mesh.glb";
const MPFB_MODEL_PATHS: Record<Gender, string> = {
  male: "/models/body-visualizer/mpfb/body_male_v1.glb",
  female: "/models/body-visualizer/mpfb/body_female_v1.glb",
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

// Deurenberg-style relation with age fixed for auto-sync behavior.
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
      color: "#3b82f6",
      note: "Below the standard BMI range.",
    };
  }
  if (bmi < 25) {
    return {
      label: "Normal",
      color: "#22c55e",
      note: "Within the standard BMI range.",
    };
  }
  if (bmi < 30) {
    return {
      label: "Overweight",
      color: "#f59e0b",
      note: "Above standard BMI range.",
    };
  }
  return {
    label: "Obesity",
    color: "#ef4444",
    note: "High BMI range; track trends and context.",
  };
}

function bodyFatCategory(gender: Gender, bodyFatPct: number): Category {
  if (gender === "male") {
    if (bodyFatPct < 6) {
      return {
        label: "Essential",
        color: "#3b82f6",
        note: "Extremely lean and hard to sustain.",
      };
    }
    if (bodyFatPct < 14) {
      return {
        label: "Athletic",
        color: "#22c55e",
        note: "Lean with stronger visual definition.",
      };
    }
    if (bodyFatPct < 18) {
      return {
        label: "Fit",
        color: "#84cc16",
        note: "Common target range for active adults.",
      };
    }
    if (bodyFatPct < 25) {
      return {
        label: "Average",
        color: "#f59e0b",
        note: "Typical adult range.",
      };
    }
    if (bodyFatPct < 32) {
      return {
        label: "High",
        color: "#f97316",
        note: "Higher body-fat range.",
      };
    }
    return {
      label: "Very High",
      color: "#ef4444",
      note: "Use gradual, sustainable changes.",
    };
  }

  if (bodyFatPct < 14) {
    return {
      label: "Essential",
      color: "#3b82f6",
      note: "Very lean and hard to sustain long term.",
    };
  }
  if (bodyFatPct < 21) {
    return {
      label: "Athletic",
      color: "#22c55e",
      note: "Lean, performance-oriented range.",
    };
  }
  if (bodyFatPct < 28) {
    return {
      label: "Fit",
      color: "#84cc16",
      note: "Balanced range for many active adults.",
    };
  }
  if (bodyFatPct < 35) {
    return {
      label: "Average",
      color: "#f59e0b",
      note: "Typical adult range.",
    };
  }
  if (bodyFatPct < 42) {
    return {
      label: "High",
      color: "#f97316",
      note: "Higher range; evaluate trends.",
    };
  }
  return {
    label: "Very High",
    color: "#ef4444",
    note: "Prioritize consistency and realistic timelines.",
  };
}

function SliderField(props: {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const { label, valueLabel, min, max, step = 1, value, onChange } = props;

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-sm font-semibold text-gray-700">{valueLabel}</p>
      </div>

      <input
        type="range"
        className="range range-primary mt-2"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function StatCard(props: { label: string; value: string; note?: string; valueColor?: string }) {
  const { label, value, note, valueColor = "#111827" } = props;

  return (
    <div className="rounded-2xl bg-base-200/60 p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: valueColor }}>
        {value}
      </p>
      {note ? <p className="mt-1 text-sm text-gray-600">{note}</p> : null}
    </div>
  );
}

function applyMaterialOverride(root: Group, gender: Gender) {
  const flatSkinColor = gender === "female" ? "#f0c9b5" : "#ddb99f";

  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return;

    const mesh = obj as Mesh;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const updated = mats.map((mat) => {
      const source = mat as MeshStandardMaterial;
      const clone = source.clone();
      const activeMap = source.map ?? null;

      // Use authored or injected albedo maps where possible, with a neutral fallback tone.
      clone.map = activeMap;
      clone.color = activeMap ? new Color("#ffffff") : new Color(flatSkinColor);
      clone.roughness = activeMap ? 0.73 : 0.62;
      clone.metalness = 0;
      clone.envMapIntensity = activeMap ? 0.36 : 0.45;
      clone.needsUpdate = true;
      return clone;
    });

    mesh.material = Array.isArray(mesh.material) ? updated : updated[0];
  });
}

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
  local_torso_muscle: ["local_torso_muscle", "torso_muscle", "torso_muscle_pectoral_incr", "torso_muscle_dorsi_incr"],
  local_chest_muscle: ["local_chest_muscle", "chest_muscle", "torso_muscle_pectoral_incr"],
  local_shoulder_muscle: ["local_shoulder_muscle", "shoulder_muscle", "upperarm_shoulder_muscle_incr"],
  local_arms_fat: ["local_arms_fat", "arms_fat", "upperarm_fat_incr", "lowerarm_fat_incr"],
  local_forearms_fat: ["local_forearms_fat", "forearms_fat", "lowerarm_fat_incr"],
  local_arms_muscle: ["local_arms_muscle", "arms_muscle", "upperarm_muscle_incr", "lowerarm_muscle_incr"],
  local_forearms_muscle: ["local_forearms_muscle", "forearms_muscle", "lowerarm_muscle_incr"],
  local_legs_fat: ["local_legs_fat", "legs_fat", "upperleg_fat_incr", "lowerleg_fat_incr"],
  local_calves_fat: ["local_calves_fat", "calves_fat", "lowerleg_fat_incr"],
  local_legs_muscle: ["local_legs_muscle", "legs_muscle", "upperleg_muscle_incr", "lowerleg_muscle_incr"],
  local_calves_muscle: ["local_calves_muscle", "calves_muscle", "lowerleg_muscle_incr"],
  local_thigh_shape: ["local_thigh_shape", "thigh_shape", "upperleg_scale_horiz_incr", "upperleg_scale_depth_incr"],
  local_calf_shape: ["local_calf_shape", "calf_shape", "lowerleg_scale_horiz_incr", "lowerleg_scale_depth_incr"],
};

function normalizeMorphName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveMorphIndex(
  dictionary: Record<string, number>,
  channel: MorphChannel
): number | null {
  const names = Object.keys(dictionary);
  if (!names.length) return null;

  const normalizedToIndex = new Map<string, number>();
  names.forEach((name) => normalizedToIndex.set(normalizeMorphName(name), dictionary[name]));

  for (const alias of MORPH_CHANNEL_ALIASES[channel]) {
    const exact = normalizedToIndex.get(normalizeMorphName(alias));
    if (typeof exact === "number") return exact;
  }

  for (const alias of MORPH_CHANNEL_ALIASES[channel]) {
    const aliasNorm = normalizeMorphName(alias);
    for (const [normalizedName, index] of normalizedToIndex.entries()) {
      if (normalizedName.includes(aliasNorm)) return index;
    }
  }

  return null;
}

function buildMorphChannels(props: {
  gender: Gender;
  bmi: number;
  bodyFatPct: number;
  heightCm: number;
}): Record<MorphChannel, number> {
  const { gender, bmi, bodyFatPct, heightCm } = props;
  const bfBounds = bodyFatBounds(gender);

  const fatNorm = clamp((bodyFatPct - bfBounds.min) / (bfBounds.max - bfBounds.min), 0, 1);
  const bmiNorm = clamp((bmi - BMI_MIN) / (BMI_MAX - BMI_MIN), 0, 1);
  const heightNorm = clamp((heightCm - HEIGHT_CM_MIN) / (HEIGHT_CM_MAX - HEIGHT_CM_MIN), 0, 1);
  const leanProxy = clamp((bmi * (1 - bodyFatPct / 100) - 15) / 12, 0, 1);

  // Nonlinear shaping gives stronger visible differences across practical body-fat ranges.
  const fatCurve = Math.pow(fatNorm, 1.18);
  const fatMid = smoothstep(0.22, 0.62, fatNorm);
  const fatHigh = smoothstep(0.58, 0.9, fatNorm);
  const bmiCurve = Math.pow(bmiNorm, 1.08);
  const leanCurve = Math.pow(leanProxy, 0.92);

  const maleTorsoBias = gender === "male" ? 1.12 : 0.9;
  const femaleLowerBias = gender === "female" ? 1.2 : 0.92;

  const torsoFat = clamp(
    (0.35 * fatCurve + 0.45 * fatMid + 0.25 * fatHigh + 0.12 * bmiCurve) * maleTorsoBias,
    0,
    1
  );
  const waistFat = clamp(
    (0.32 * fatCurve + 0.48 * fatMid + 0.28 * fatHigh + 0.1 * bmiCurve) *
      (gender === "male" ? 1.1 : 0.94),
    0,
    1
  );
  const gluteFat = clamp(
    (0.24 * fatCurve + 0.38 * fatMid + 0.24 * fatHigh) * (gender === "female" ? 1.28 : 0.82),
    0,
    1
  );
  const chestFat = clamp(
    (0.22 * fatCurve + 0.2 * fatMid + 0.08 * bmiCurve) * (gender === "female" ? 1.1 : 0.9),
    0,
    1
  );
  const faceFat = clamp(0.18 * fatCurve + 0.26 * fatMid + 0.24 * fatHigh, 0, 1);
  const neckFat = clamp(0.12 * fatCurve + 0.18 * fatMid + 0.24 * fatHigh, 0, 1);
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
    (0.26 * fatCurve + 0.3 * fatMid + 0.1 * bmiCurve) * (gender === "female" ? 0.95 : 1.05),
    0,
    1
  );
  const forearmFat = clamp(
    (0.18 * fatCurve + 0.22 * fatMid) * (gender === "female" ? 0.96 : 1),
    0,
    1
  );
  const armMuscle = clamp(
    (0.14 + 0.88 * leanCurve - 0.28 * fatCurve) * (gender === "female" ? 0.9 : 1.05),
    0,
    1
  );
  const forearmMuscle = clamp(
    (0.18 + 0.74 * leanCurve - 0.16 * fatCurve) * (gender === "female" ? 0.88 : 1.03),
    0,
    1
  );

  const legFat = clamp(
    (0.34 * fatCurve + 0.38 * fatMid + 0.14 * bmiCurve) * femaleLowerBias,
    0,
    1
  );
  const calfFat = clamp(
    (0.2 * fatCurve + 0.24 * fatMid + 0.06 * bmiCurve) * (gender === "female" ? 1.05 : 0.95),
    0,
    1
  );
  const legMuscle = clamp(
    (0.16 + 0.78 * leanCurve - 0.2 * fatCurve) * (gender === "female" ? 0.98 : 1),
    0,
    1
  );
  const calfMuscle = clamp(
    (0.16 + 0.7 * leanCurve - 0.14 * fatCurve) * (gender === "female" ? 0.92 : 1.02),
    0,
    1
  );
  const thighShape = clamp(
    (0.2 + 0.46 * fatMid + 0.22 * leanCurve) * (gender === "female" ? 1.16 : 0.95),
    0,
    1
  );
  const calfShape = clamp(
    (0.16 + 0.3 * fatMid + 0.22 * leanCurve) * (gender === "female" ? 1.05 : 0.98),
    0,
    1
  );

  return {
    macro_weight: clamp(0.28 + 0.52 * bmiCurve + 0.4 * fatCurve + 0.12 * fatHigh, 0, 1),
    macro_muscle: clamp(0.12 + 0.92 * leanCurve - 0.18 * fatCurve, 0, 1),
    macro_height: clamp(Math.pow(heightNorm, 1.04), 0, 1),
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
    const values: Record<string, { sx: number; sy: number; sz: number; px: number; py: number; pz: number }> = {};
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

    // Torso shaping.
    const torsoWidth = 1 + 0.22 * fatNorm + 0.08 * leanProxy;
    const torsoDepth = 1 + 0.36 * fatNorm + 0.03 * bmiNorm;

    scaleBone("spine", torsoWidth * 0.98, 1 + 0.03 * heightNorm, torsoDepth * 0.95);
    scaleBone("spine001", torsoWidth, 1 + 0.04 * heightNorm, torsoDepth);
    scaleBone("spine002", torsoWidth * 1.04, 1 + 0.03 * heightNorm, torsoDepth * 1.08);
    scaleBone("spine003", torsoWidth * 1.05, 1 + 0.02 * heightNorm, torsoDepth * 1.1);
    scaleBone("spine004", (1 + 0.12 * leanProxy) * shoulderBias, 1 + 0.03 * heightNorm, 1 + 0.05 * leanProxy);
    scaleBone("spine005", (1 + 0.1 * leanProxy) * shoulderBias, 1 + 0.02 * heightNorm, 1 + 0.04 * leanProxy);

    // Shoulder and arms.
    const upperArmBulk = 1 + 0.18 * leanProxy + 0.06 * fatNorm;
    const forearmBulk = 1 + 0.12 * leanProxy + 0.03 * fatNorm;

    scaleBone("shoulderL", 1 + 0.1 * leanProxy, 1, 1);
    scaleBone("shoulderR", 1 + 0.1 * leanProxy, 1, 1);

    scaleBone("upper_armL", upperArmBulk, 1 + 0.05 * leanProxy, upperArmBulk);
    scaleBone("upper_armR", upperArmBulk, 1 + 0.05 * leanProxy, upperArmBulk);
    scaleBone("forearmL", forearmBulk, 1 + 0.03 * leanProxy, forearmBulk);
    scaleBone("forearmR", forearmBulk, 1 + 0.03 * leanProxy, forearmBulk);

    // Pelvis and legs.
    const pelvisScale = (1 + 0.11 * fatNorm) * hipBias;
    scaleBone("pelvisL", pelvisScale, 1 + 0.03 * fatNorm, 1 + 0.14 * fatNorm);
    scaleBone("pelvisR", pelvisScale, 1 + 0.03 * fatNorm, 1 + 0.14 * fatNorm);

    const thighBulk = 1 + 0.22 * fatNorm + 0.12 * leanProxy;
    const shinBulk = 1 + 0.12 * fatNorm + 0.08 * leanProxy;

    scaleBone("thighL", thighBulk * hipBias, 1 + 0.05 * heightNorm, 1 + 0.24 * fatNorm);
    scaleBone("thighR", thighBulk * hipBias, 1 + 0.05 * heightNorm, 1 + 0.24 * fatNorm);
    scaleBone("shinL", shinBulk, 1 + 0.05 * heightNorm, 1 + 0.1 * fatNorm);
    scaleBone("shinR", shinBulk, 1 + 0.05 * heightNorm, 1 + 0.1 * fatNorm);

    // Overall height/size response.
    const sceneScaleY = 0.92 + heightNorm * 0.24;
    const sceneScaleX = 0.98 + 0.07 * bmiNorm;
    const sceneScaleZ = 0.98 + 0.16 * fatNorm;
    modelRoot.scale.set(sceneScaleX, sceneScaleY, sceneScaleZ);
  }, [baseline, bmi, bodyFatPct, bones, gender, heightCm, modelRoot, skinnedMesh]);

  return (
    <primitive
      object={modelRoot}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

function MpfbMorphModel(props: {
  gender: Gender;
  bmi: number;
  bodyFatPct: number;
  heightCm: number;
}) {
  const { gender, bmi, bodyFatPct, heightCm } = props;
  const gltf = useGLTF(MPFB_MODEL_PATHS[gender]);

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
      }),
    [gender, bmi, bodyFatPct, heightCm]
  );

  useEffect(() => {
    morphMeshes.forEach((mesh) => {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

      for (let i = 0; i < mesh.morphTargetInfluences.length; i += 1) {
        mesh.morphTargetInfluences[i] = 0;
      }

      (Object.keys(channels) as MorphChannel[]).forEach((channel) => {
        const index = resolveMorphIndex(mesh.morphTargetDictionary!, channel);
        if (index === null) return;
        mesh.morphTargetInfluences![index] = channels[channel];
      });
    });
  }, [channels, morphMeshes]);

  return <primitive object={modelRoot} position={[0, 0, 0]} rotation={[0, 0, 0]} />;
}

function BodyRender(props: {
  gender: Gender;
  bmi: number;
  bodyFatPct: number;
  heightCm: number;
  bodyFatColor: string;
  resetNonce: number;
  renderMode: RenderMode;
  viewPreset: ViewPreset;
  screenshotToken: number;
  screenshotFilename: string;
}) {
  const {
    gender,
    bmi,
    bodyFatPct,
    heightCm,
    bodyFatColor,
    resetNonce,
    renderMode,
    viewPreset,
    screenshotToken,
    screenshotFilename,
  } = props;
  const modelYaw = renderMode === "mpfb" ? MPFB_FRONT_MODEL_YAW : LEGACY_FRONT_MODEL_YAW;
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
      className="w-full h-full rounded-3xl border bg-[#e8e8e8] overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ borderColor: bodyFatColor }}
    >
      <Canvas
        key={resetNonce}
        camera={{ position: [0, -0.02, 5.4], fov: 24 }}
        dpr={[1, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <color attach="background" args={["#e8e8e8"]} />

        <hemisphereLight intensity={0.46} groundColor="#c0c0c0" />
        <directionalLight position={[3.4, 3.8, 2.4]} intensity={1.08} castShadow />
        <directionalLight position={[-2.6, 1.8, -1.6]} intensity={0.56} />
        <directionalLight position={[0.4, -1.8, 2.5]} intensity={0.28} />

        <Suspense fallback={null}>
          <group position={[-0.025, 0.025, 0]} rotation={[0, modelYaw + viewOffset, 0]}>
            {renderMode === "mpfb" ? (
              <MpfbMorphModel gender={gender} bmi={bmi} bodyFatPct={bodyFatPct} heightCm={heightCm} />
            ) : (
              <LegacyHumanModel gender={gender} bmi={bmi} bodyFatPct={bodyFatPct} heightCm={heightCm} />
            )}
          </group>
        </Suspense>

        <ScreenshotCapture token={screenshotToken} filename={screenshotFilename} />

        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.8}
          minDistance={3.7}
          maxDistance={7.4}
          minPolarAngle={Math.PI / 2 - 0.45}
          maxPolarAngle={Math.PI / 2 + 0.45}
          target={[0, 0.95, 0]}
        />
      </Canvas>
    </div>
  );
}

function ScreenshotCapture(props: { token: number; filename: string }) {
  const { token, filename } = props;
  const { gl } = useThree();

  useEffect(() => {
    if (!token) return;

    const run = () => {
      try {
        const target = gl.domElement;
        if (!target) return;

        const dataUrl = target.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = filename;
        link.click();
      } catch (error) {
        console.error("Screenshot export failed:", error);
      }
    };

    const id = window.setTimeout(run, 80);
    return () => window.clearTimeout(id);
  }, [token, filename, gl]);

  return null;
}

Object.values(MPFB_MODEL_PATHS).forEach((path) => useGLTF.preload(path));

export default function BodyVisualizerTool() {
  const [units, setUnits] = useState<Units>("imperial");
  const [gender, setGender] = useState<Gender>("male");
  const [syncMode, setSyncMode] = useState<SyncMode>("linked");
  const [viewPreset, setViewPreset] = useState<ViewPreset>("front");
  const [screenshotToken, setScreenshotToken] = useState(0);
  const [screenshotFilename, setScreenshotFilename] = useState("body-visualizer.png");
  const [viewerResetNonce, setViewerResetNonce] = useState(0);
  const maleMpfbAvailable = useAssetAvailable(MPFB_MODEL_PATHS.male);
  const femaleMpfbAvailable = useAssetAvailable(MPFB_MODEL_PATHS.female);

  const [heightCm, setHeightCm] = useState<number>(178);
  const [weightKg, setWeightKg] = useState<number>(78);
  const [bodyFatPct, setBodyFatPct] = useState<number>(18);

  const renderMode: RenderMode =
    maleMpfbAvailable === true && femaleMpfbAvailable === true ? "mpfb" : "legacy";

  const bmi = useMemo(() => bmiFrom(weightKg, heightCm), [weightKg, heightCm]);

  const fatMassKg = useMemo(() => weightKg * (bodyFatPct / 100), [weightKg, bodyFatPct]);
  const leanMassKg = useMemo(() => weightKg - fatMassKg, [weightKg, fatMassKg]);

  const ffmi = useMemo(() => {
    const hM = heightCm / 100;
    if (hM <= 0) return 0;
    return leanMassKg / (hM * hM);
  }, [heightCm, leanMassKg]);

  const bmiClass = useMemo(() => bmiCategory(bmi), [bmi]);
  const bfClass = useMemo(() => bodyFatCategory(gender, bodyFatPct), [gender, bodyFatPct]);

  const healthyMinWeightKg = useMemo(() => weightFromBmi(18.5, heightCm), [heightCm]);
  const healthyMaxWeightKg = useMemo(() => weightFromBmi(24.9, heightCm), [heightCm]);

  const estimatedWaistCm = useMemo(() => {
    const baseRatio = gender === "male" ? 0.43 : 0.4;
    const fatAnchor = gender === "male" ? 15 : 24;
    const fatAdj = (bodyFatPct - fatAnchor) * (gender === "male" ? 0.007 : 0.0065);
    const bmiAdj = (bmi - 22) * 0.004;
    const ffmiAnchor = gender === "male" ? 20 : 17;
    const muscleAdj = (ffmi - ffmiAnchor) * -0.003;

    const ratio = clamp(baseRatio + fatAdj + bmiAdj + muscleAdj, 0.35, 0.74);
    return ratio * heightCm;
  }, [gender, bodyFatPct, bmi, ffmi, heightCm]);

  const bounds = bodyFatBounds(gender);

  const handleGenderChange = (nextGender: Gender) => {
    setGender(nextGender);

    const nextBmi = bmiFrom(weightKg, heightCm);
    const nextBounds = bodyFatBounds(nextGender);
    if (syncMode === "linked") {
      const modeled = clamp(round(predictBodyFatFromBmi(nextBmi, nextGender), 1), nextBounds.min, nextBounds.max);
      setBodyFatPct(modeled);
    } else {
      setBodyFatPct((current) => clamp(current, nextBounds.min, nextBounds.max));
    }
  };

  const handleHeightChange = (nextHeightCm: number) => {
    const clampedHeight = clamp(nextHeightCm, HEIGHT_CM_MIN, HEIGHT_CM_MAX);
    setHeightCm(clampedHeight);

    if (syncMode === "linked") {
      const nextBmi = bmiFrom(weightKg, clampedHeight);
      const modeled = clamp(round(predictBodyFatFromBmi(nextBmi, gender), 1), bounds.min, bounds.max);
      setBodyFatPct(modeled);
    }
  };

  const handleWeightChange = (nextWeightKg: number) => {
    const clampedWeight = clamp(nextWeightKg, WEIGHT_KG_MIN, WEIGHT_KG_MAX);
    setWeightKg(clampedWeight);

    if (syncMode === "linked") {
      const nextBmi = bmiFrom(clampedWeight, heightCm);
      const modeled = clamp(round(predictBodyFatFromBmi(nextBmi, gender), 1), bounds.min, bounds.max);
      setBodyFatPct(modeled);
    }
  };

  const handleBmiChange = (nextBmi: number) => {
    const clampedBmi = clamp(nextBmi, BMI_MIN, BMI_MAX);
    const nextWeight = clamp(weightFromBmi(clampedBmi, heightCm), WEIGHT_KG_MIN, WEIGHT_KG_MAX);
    setWeightKg(nextWeight);

    if (syncMode === "linked") {
      const modeled = clamp(round(predictBodyFatFromBmi(clampedBmi, gender), 1), bounds.min, bounds.max);
      setBodyFatPct(modeled);
    }
  };

  const handleBodyFatChange = (nextBodyFatPct: number) => {
    const clampedBodyFat = clamp(nextBodyFatPct, bounds.min, bounds.max);
    setBodyFatPct(clampedBodyFat);

    if (syncMode === "linked") {
      const modeledBmi = clamp(
        bmiFromPredictedBodyFat(clampedBodyFat, gender),
        BMI_MIN,
        BMI_MAX
      );
      const modeledWeight = clamp(weightFromBmi(modeledBmi, heightCm), WEIGHT_KG_MIN, WEIGHT_KG_MAX);
      setWeightKg(modeledWeight);
    }
  };

  const heightInchesUI = Math.round(cmToIn(heightCm));
  const heightFeetUI = Math.floor(heightInchesUI / 12);
  const heightRemainderInchesUI = heightInchesUI % 12;

  const weightLbUI = Math.round(kgToLb(weightKg));

  const healthyWeightText = units === "metric"
    ? `${round(healthyMinWeightKg, 1)}-${round(healthyMaxWeightKg, 1)} kg`
    : `${Math.round(kgToLb(healthyMinWeightKg))}-${Math.round(kgToLb(healthyMaxWeightKg))} lb`;

  const fatMassText = units === "metric"
    ? `${round(fatMassKg, 1)} kg`
    : `${round(kgToLb(fatMassKg), 1)} lb`;

  const leanMassText = units === "metric"
    ? `${round(leanMassKg, 1)} kg`
    : `${round(kgToLb(leanMassKg), 1)} lb`;

  const waistText = units === "metric"
    ? `${round(estimatedWaistCm, 1)} cm`
    : `${round(cmToIn(estimatedWaistCm), 1)} in`;

  const triggerScreenshot = () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = `body-${gender}-bf${round(bodyFatPct, 1)}-bmi${round(bmi, 1)}-${stamp}.png`;
    setScreenshotFilename(file);
    setScreenshotToken((v) => v + 1);
  };

  return (
    <section className="w-full">
      <div className="w-full max-w-6xl mx-auto rounded-3xl bg-white/80 backdrop-blur border shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_520px]">
          <div className="p-4 sm:p-6 bg-base-100 flex min-h-[680px] lg:min-h-0">
            <div className="w-full flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <p className="text-xs font-semibold text-gray-600">Drag to rotate, scroll to zoom</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={triggerScreenshot}
                    className="text-xs font-semibold text-primary underline hover:opacity-80"
                  >
                    Take Screenshot
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotToken(0);
                      setViewerResetNonce((v) => v + 1);
                    }}
                    className="text-xs font-semibold text-primary underline hover:opacity-80"
                  >
                    Reset View
                  </button>
                </div>
              </div>
              <div className="px-1">
                <div className="inline-flex rounded-xl bg-gray-100 p-1">
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        viewPreset === preset
                          ? "bg-white shadow-sm text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="px-1 text-xs text-gray-500">
                {renderMode === "mpfb"
                  ? "Model: MPFB morph-target render"
                  : "Model: legacy fallback (MPFB files not detected yet)"}
              </p>
              <BodyRender
                gender={gender}
                bmi={bmi}
                bodyFatPct={bodyFatPct}
                heightCm={heightCm}
                bodyFatColor={bfClass.color}
                resetNonce={viewerResetNonce}
                renderMode={renderMode}
                viewPreset={viewPreset}
                screenshotToken={screenshotToken}
                screenshotFilename={screenshotFilename}
              />
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-white min-w-0 border-t lg:border-t-0 lg:border-l">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex rounded-2xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => handleGenderChange("male")}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                    gender === "male" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
                  }`}
                  aria-pressed={gender === "male"}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderChange("female")}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                    gender === "female" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
                  }`}
                  aria-pressed={gender === "female"}
                >
                  Female
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${units === "imperial" ? "text-primary" : "text-gray-500"}`}>
                  Imperial
                </span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={units === "metric"}
                  onChange={(e) => setUnits(e.target.checked ? "metric" : "imperial")}
                  aria-label="Toggle units"
                />
                <span className={`text-sm font-semibold ${units === "metric" ? "text-primary" : "text-gray-500"}`}>
                  Metric
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-gray-900">Slider Sync</p>
              <div className="inline-flex rounded-xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setSyncMode("linked")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    syncMode === "linked" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Linked
                </button>
                <button
                  type="button"
                  onClick={() => setSyncMode("independent")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    syncMode === "independent" ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Independent
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Linked mode keeps BMI and body-fat sliders synchronized. Independent mode lets each slider move on its own.
            </p>

            <SliderField
              label="Body Fat %"
              valueLabel={`${round(bodyFatPct, 1)}%`}
              min={bounds.min}
              max={bounds.max}
              step={0.1}
              value={round(bodyFatPct, 1)}
              onChange={handleBodyFatChange}
            />

            <p className="mt-2 text-gray-500 text-sm">
              Don’t know?{" "}
              <a
                href="https://bodyfatestimator.ai/estimate"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-md font-semibold text-primary underline hover:underline"
              >
                Estimate Body Fat %
              </a>
            </p>

            <SliderField
              label="BMI"
              valueLabel={round(bmi, 1).toString()}
              min={BMI_MIN}
              max={BMI_MAX}
              step={0.1}
              value={round(bmi, 1)}
              onChange={handleBmiChange}
            />

            {units === "metric" ? (
              <>
                <SliderField
                  label="Height"
                  valueLabel={`${Math.round(heightCm)} cm`}
                  min={HEIGHT_CM_MIN}
                  max={HEIGHT_CM_MAX}
                  step={1}
                  value={Math.round(heightCm)}
                  onChange={handleHeightChange}
                />

                <SliderField
                  label="Weight"
                  valueLabel={`${round(weightKg, 1)} kg`}
                  min={WEIGHT_KG_MIN}
                  max={WEIGHT_KG_MAX}
                  step={0.5}
                  value={round(weightKg, 1)}
                  onChange={handleWeightChange}
                />
              </>
            ) : (
              <>
                <SliderField
                  label="Height"
                  valueLabel={`${heightFeetUI}' ${heightRemainderInchesUI}"`}
                  min={Math.round(cmToIn(HEIGHT_CM_MIN))}
                  max={Math.round(cmToIn(HEIGHT_CM_MAX))}
                  step={1}
                  value={heightInchesUI}
                  onChange={(inches) => handleHeightChange(inToCm(inches))}
                />

                <SliderField
                  label="Weight"
                  valueLabel={`${weightLbUI} lb`}
                  min={Math.round(kgToLb(WEIGHT_KG_MIN))}
                  max={Math.round(kgToLb(WEIGHT_KG_MAX))}
                  step={1}
                  value={weightLbUI}
                  onChange={(lb) => handleWeightChange(lbToKg(lb))}
                />
              </>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}

useGLTF.preload(LEGACY_MODEL_PATH);
useGLTF.preload(MPFB_MODEL_PATHS.male);
useGLTF.preload(MPFB_MODEL_PATHS.female);
