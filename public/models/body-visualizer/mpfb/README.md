# Body Visualizer Phase 2B Assets (MakeHuman + MPFB)

This folder tracks the approved source assets for the Phase 2B body visualizer upgrade.

## Decision

Use the MakeHuman + MPFB ecosystem as the open-source baseline for higher-fidelity male/female bodies and morph-driven body-composition changes.

## Why this stack

- `makehuman-assets` provides CC0 base meshes and skin materials.
- MakeHuman exposes a large, structured target library for body weight and muscle variation.
- MPFB provides a Blender workflow to build/export web-ready characters from these assets.

## Canonical sources

- MakeHuman assets repo (CC0): https://github.com/makehumancommunity/makehuman-assets
- MakeHuman app repo (targets + modifier definitions): https://github.com/makehumancommunity/makehuman
- MPFB docs: https://static.makehumancommunity.org/mpfb/docs.html
- MPFB FAQ (license/reuse): https://static.makehumancommunity.org/mpfb/faq.html

## Selected core mesh files

From `makehuman-assets`:

- `base/proxymeshes/male_generic/male_generic.obj`
- `base/proxymeshes/female_generic/female_generic.obj`
- `base/proxymeshes/male_muscle_13290/male_muscle_13290.obj`
- `base/proxymeshes/female_muscle_13442/female_muscle_13442.obj`

## Selected supplemental target packs

Used for shape fidelity and local detail:

- `arms01`
- `cheek01`
- `ears01`
- `hands01`
- `nose01`
- `skins01`
- `skins02`

Direct links are stored in `asset-manifest.json`.

## Fetch command

Use the helper script from project root:

- Core meshes + modifier references only:
  - `./scripts/fetch-body-visualizer-mpfb-assets.sh`
- Core + optional packs:
  - `./scripts/fetch-body-visualizer-mpfb-assets.sh --with-packs`

## Build runtime GLBs

Generate the runtime files directly from official MakeHuman base mesh + targets:

- `npm run assets:body-visualizer:mpfb:build`

This writes:

- `public/models/body-visualizer/mpfb/body_male_v1.glb`
- `public/models/body-visualizer/mpfb/body_female_v1.glb`

Notes:

- GLBs include `TEXCOORD_0` UVs for future texture-based skin rendering.
- GLBs include 22 canonical morph channels.

## Expected exported web assets (next step)

After authoring in MPFB/Blender, export and place (or replace the generated files above):

- `public/models/body-visualizer/mpfb/body_male_v1.glb`
- `public/models/body-visualizer/mpfb/body_female_v1.glb`

Planned minimum morph channels for runtime:

- `macro_weight`
- `macro_muscle`
- `macro_height`
- `local_torso_fat`
- `local_waist_fat`
- `local_glute_fat`
- `local_chest_fat`
- `local_face_fat`
- `local_neck_fat`
- `local_torso_muscle`
- `local_chest_muscle`
- `local_shoulder_muscle`
- `local_arms_fat`
- `local_forearms_fat`
- `local_arms_muscle`
- `local_forearms_muscle`
- `local_legs_fat`
- `local_calves_fat`
- `local_legs_muscle`
- `local_calves_muscle`
- `local_thigh_shape`
- `local_calf_shape`

Names can differ in Blender; the export step should remap them to the canonical runtime names above.
