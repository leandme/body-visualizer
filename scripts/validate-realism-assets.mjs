#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const strictMode = process.argv.includes("--strict");
const projectRoot = process.cwd();
const manifestFile = path.join(
  projectRoot,
  "public/models/body-visualizer/realism/asset-manifest.json"
);

const issues = [];
const warnings = [];

function fail(message) {
  issues.push(message);
}

function warn(message) {
  warnings.push(message);
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mustString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`${label} must be a non-empty string.`);
    return "";
  }
  return value;
}

function mustNumber(value, label) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    fail(`${label} must be a valid number.`);
    return 0;
  }
  return value;
}

function checkUrl(value, label) {
  try {
    new URL(value);
  } catch {
    fail(`${label} must be a valid absolute URL.`);
  }
}

function publicPathToDisk(virtualPath) {
  if (!virtualPath.startsWith("/")) {
    warn(`Path ${virtualPath} should start with '/'.`);
  }
  return path.join(projectRoot, "public", virtualPath.replace(/^\/+/, ""));
}

function validateGenderConfig(gender, config, expectedFiles) {
  if (!isObject(config)) {
    fail(`gender.${gender} must be an object.`);
    return;
  }

  const primaryModelPath = mustString(config.primaryModelPath, `gender.${gender}.primaryModelPath`);
  if (primaryModelPath) expectedFiles.push({ label: `${gender} primary model`, file: primaryModelPath });

  if (config.desktopModelPath) {
    mustString(config.desktopModelPath, `gender.${gender}.desktopModelPath`);
    expectedFiles.push({ label: `${gender} desktop model`, file: config.desktopModelPath });
  }

  if (config.mobileModelPath) {
    mustString(config.mobileModelPath, `gender.${gender}.mobileModelPath`);
    expectedFiles.push({ label: `${gender} mobile model`, file: config.mobileModelPath });
  }

  if (config.fallbackModelPath) {
    mustString(config.fallbackModelPath, `gender.${gender}.fallbackModelPath`);
    expectedFiles.push({ label: `${gender} fallback model`, file: config.fallbackModelPath });
  }

  if (config.materialSet !== undefined) {
    if (!isObject(config.materialSet)) {
      fail(`gender.${gender}.materialSet must be an object when provided.`);
    } else {
      mustString(config.materialSet.id, `gender.${gender}.materialSet.id`);
      if (config.materialSet.baseColor !== undefined) {
        mustString(config.materialSet.baseColor, `gender.${gender}.materialSet.baseColor`);
      }

      ["roughness", "metalness", "envMapIntensity", "normalScale", "alphaTest"].forEach((key) => {
        if (config.materialSet[key] !== undefined) {
          mustNumber(config.materialSet[key], `gender.${gender}.materialSet.${key}`);
        }
      });

      if (config.materialSet.texturePaths !== undefined) {
        if (!isObject(config.materialSet.texturePaths)) {
          fail(`gender.${gender}.materialSet.texturePaths must be an object.`);
        } else {
          ["albedo", "normal", "roughness", "metalness", "ao", "alpha", "emissive"].forEach((mapKey) => {
            const texturePath = config.materialSet.texturePaths[mapKey];
            if (texturePath !== undefined) {
              mustString(texturePath, `gender.${gender}.materialSet.texturePaths.${mapKey}`);
              expectedFiles.push({
                label: `${gender} ${mapKey} texture`,
                file: texturePath,
              });
            }
          });
        }
      }
    }
  }

  if (config.morphMap !== undefined && !isObject(config.morphMap)) {
    fail(`gender.${gender}.morphMap must be an object when provided.`);
  }

  if (config.license === undefined || !isObject(config.license)) {
    fail(`gender.${gender}.license is required and must be an object.`);
    return;
  }

  const source = mustString(config.license.source, `gender.${gender}.license.source`);
  const sku = mustString(config.license.sku, `gender.${gender}.license.sku`);
  const productName = mustString(config.license.productName, `gender.${gender}.license.productName`);
  const productUrl = mustString(config.license.productUrl, `gender.${gender}.license.productUrl`);
  const rightsNote = mustString(config.license.rightsNote, `gender.${gender}.license.rightsNote`);

  if (productUrl) checkUrl(productUrl, `gender.${gender}.license.productUrl`);
  if (config.license.licenseUrl !== undefined) {
    const licenseUrl = mustString(config.license.licenseUrl, `gender.${gender}.license.licenseUrl`);
    if (licenseUrl) checkUrl(licenseUrl, `gender.${gender}.license.licenseUrl`);
  }

  if (source && sku && productName && rightsNote && !rightsNote.toLowerCase().includes("license")) {
    warn(`gender.${gender}.license.rightsNote does not mention the word 'license'.`);
  }
}

if (!fs.existsSync(manifestFile)) {
  console.error(`Manifest not found: ${manifestFile}`);
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
} catch (error) {
  console.error(`Failed to parse manifest JSON: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

if (!isObject(manifest)) {
  console.error("Manifest root must be an object.");
  process.exit(1);
}

mustNumber(manifest.manifestVersion, "manifestVersion");
mustString(manifest.generatedAt, "generatedAt");
mustString(manifest.sourceNote, "sourceNote");

if (!isObject(manifest.defaults)) {
  fail("defaults must be an object.");
} else {
  mustString(manifest.defaults.preferredVariant, "defaults.preferredVariant");
  mustNumber(manifest.defaults.mobileProfileMaxTextureSize, "defaults.mobileProfileMaxTextureSize");
}

if (!isObject(manifest.gender)) {
  fail("gender must be an object with male/female keys.");
}

const expectedFiles = [];
if (isObject(manifest.gender)) {
  validateGenderConfig("male", manifest.gender.male, expectedFiles);
  validateGenderConfig("female", manifest.gender.female, expectedFiles);
}

const seen = new Set();
const dedupedExpected = expectedFiles.filter((entry) => {
  const key = `${entry.label}:${entry.file}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const missingFiles = [];
for (const entry of dedupedExpected) {
  const diskPath = publicPathToDisk(entry.file);
  if (!fs.existsSync(diskPath)) {
    missingFiles.push({ ...entry, diskPath });
  }
}

console.log("Realism Asset Manifest Validation");
console.log(`- Manifest: ${path.relative(projectRoot, manifestFile)}`);
console.log(`- Strict mode: ${strictMode ? "on" : "off"}`);
console.log(`- Contract issues: ${issues.length}`);
console.log(`- Contract warnings: ${warnings.length}`);
console.log(`- Referenced files: ${dedupedExpected.length}`);
console.log(`- Missing files: ${missingFiles.length}`);

if (warnings.length) {
  console.log("\nWarnings:");
  warnings.forEach((item) => console.log(`  - ${item}`));
}

if (issues.length) {
  console.log("\nContract issues:");
  issues.forEach((item) => console.log(`  - ${item}`));
}

if (missingFiles.length) {
  console.log("\nMissing files:");
  missingFiles.forEach((item) => {
    console.log(`  - ${item.label}: ${item.file}`);
  });
}

if (issues.length > 0) {
  process.exit(1);
}

if (strictMode && missingFiles.length > 0) {
  process.exit(1);
}

process.exit(0);
