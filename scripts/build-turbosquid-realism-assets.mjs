#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import convert from "fbx2gltf";

const root = process.cwd();

const jobs = [
  {
    label: "male",
    input: "public/models/body-visualizer/turbosquid/Male_Base.fbx",
    desktop: "public/models/body-visualizer/realism/premium/male/body_male_realism_v1.glb",
    mobile: "public/models/body-visualizer/realism/premium/male/body_male_realism_mobile.glb",
  },
  {
    label: "female",
    input: "public/models/body-visualizer/turbosquid/Female_Base.fbx",
    desktop: "public/models/body-visualizer/realism/premium/female/body_female_realism_v1.glb",
    mobile: "public/models/body-visualizer/realism/premium/female/body_female_realism_mobile.glb",
  },
];

function abs(p) {
  return path.join(root, p);
}

async function run() {
  for (const job of jobs) {
    const inputAbs = abs(job.input);
    const desktopAbs = abs(job.desktop);
    const mobileAbs = abs(job.mobile);

    if (!fs.existsSync(inputAbs)) {
      throw new Error(`Missing input file for ${job.label}: ${job.input}`);
    }

    fs.mkdirSync(path.dirname(desktopAbs), { recursive: true });
    console.log(`Converting ${job.label} FBX -> GLB...`);
    await convert(inputAbs, desktopAbs, []);

    // Mobile profile currently reuses desktop geometry. This keeps profile wiring stable
    // and can be replaced later with a decimated mobile export.
    fs.copyFileSync(desktopAbs, mobileAbs);

    const desktopSizeMb = (fs.statSync(desktopAbs).size / (1024 * 1024)).toFixed(2);
    const mobileSizeMb = (fs.statSync(mobileAbs).size / (1024 * 1024)).toFixed(2);
    console.log(`Done ${job.label}: desktop=${desktopSizeMb}MB mobile=${mobileSizeMb}MB`);
  }

  console.log("TurboSquid realism runtime assets built successfully.");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
