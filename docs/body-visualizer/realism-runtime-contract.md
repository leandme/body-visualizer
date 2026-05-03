# Realistic Runtime Asset Contract

Date: 2026-05-02

This contract defines how premium male/female realism assets plug into the existing `BodyVisualizerTool` pipeline without changing the user-facing control surface.

## Canonical runtime requirements

1. Neutral body baseline
- Gender-specific neutral A-pose/T-pose bodies.
- Consistent orientation and scale across male/female assets.

2. Material requirements
- Preferred channels: albedo, normal, roughness, metalness, AO.
- Optional: alpha/emissive maps for brows/lashes accessories if included.

3. Required morph groups
- Macro fat: global adiposity response.
- Macro muscle: global lean/muscle definition response.
- Regional fat: torso, waist, glute, chest, face, neck, limbs.
- Regional muscle: torso, chest, shoulders, arms, forearms, legs, calves.

4. Optional high-detail channels
- Abdomen definition
- Pectoral/chest detail
- Deltoid/shoulder detail
- Glute contour detail
- Thigh/calf refinement

## Manifest format

Path: `public/models/body-visualizer/realism/asset-manifest.json`
Schema: `public/models/body-visualizer/realism/asset-manifest.schema.json`

Top-level fields:
- `manifestVersion`
- `generatedAt`
- `sourceNote`
- `defaults`
- `gender`

Per-gender fields:
- `primaryModelPath`
- `desktopModelPath` (optional)
- `mobileModelPath` (optional)
- `fallbackModelPath` (optional)
- `materialSet`
- `morphMap`
- `lod`
- `license`

## Runtime resolution order

1. Load realism manifest.
2. Select profile by capability:
- Desktop high: default for larger screens and stronger devices.
- Mobile fallback: selected for narrower screens/touch/lower memory devices.
3. Attempt realism `desktopModelPath/mobileModelPath`.
4. If missing, use `fallbackModelPath`.
5. If realism unavailable, fall back to existing MPFB, then legacy model.

## Morph mapping behavior

- Canonical morph names remain the engine contract.
- `morphMap` aliases allow kit-specific blendshape names to map into canonical channels.
- Missing optional channels are ignored gracefully.

## Performance strategy

- Desktop profile: high-resolution textures + full material detail.
- Mobile profile: lower-res textures and/or lower LOD model path.
- Existing UI, presets, snapshots, and measurement controls remain unchanged.

## Licensing metadata

Each gender entry stores:
- source marketplace
- SKU/ID
- product name + URL
- rights note
- license URL

This enables auditability and compliance before production rollout.
