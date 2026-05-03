# Realism Asset Slot (Premium Kits)

This directory hosts the premium realism integration contract used by `BodyVisualizerTool`.

- Contract schema: `asset-manifest.schema.json`
- Active manifest: `asset-manifest.json`

Current state:
- Manifest is integration-ready.
- TurboSquid runtime assets are integrated from `public/models/body-visualizer/turbosquid`.
- Runtime falls back to MPFB assets if realism files are unavailable.

Validation commands:
- `npm run assets:body-visualizer:realism:validate`
- `npm run assets:body-visualizer:realism:validate:strict`

Build command:
- `npm run assets:body-visualizer:realism:build:turbosquid`

After purchase/import:
1. Place male/female GLBs and texture folders at manifest paths.
2. Update `morphMap` aliases to match actual blendshape names.
3. Verify desktop/mobile path and LOD behavior.
4. Keep `license` metadata up to date for audit/compliance.
