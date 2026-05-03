# Realistic Body Upgrade Procurement Shortlist (No Purchase Yet)

Date: 2026-05-02
Budget target: under $300 total for male + female kit(s)
Status: shortlist complete, integration-ready spec added, purchase pending

## Recommended selection

- Primary kit: TurboSquid Bundle ID `2391247` ("Realistic Human Base Models - Male And Female")
- Fallback kit: TurboSquid Product ID `2552927` ("Realistic Human Body Base Mesh Pack 10 Rigged 3D Models")
- Contingency kit: TurboSquid Product ID `1678218` ("Male and Female Body Base Mesh 10k Polygons")

Estimated spend if purchasing primary + fallback: `$144`.
Estimated spend if purchasing all three for pipeline flexibility: `$162`.

## License validation (commercial web/app)

- TurboSquid license source: https://www.turbosquid.com/licensing
- Validation summary:
  - Royalty-free usage is allowed in games/software/web projects.
  - Redistribution of raw model files is not allowed.
  - WebGL/browser usage is allowed when assets are packaged/converted so end users cannot trivially extract source files.

## Candidate matrix

| Candidate | Price (USD) | Male+Female Included | Detail Signals | Commercial Rights | Notes |
|---|---:|---|---|---|---|
| TurboSquid `2391247` | 45 | Yes | 52 ARKit blendshapes, 4K body textures, higher poly counts, rigged | Pass (Standard License) | Best realism-per-dollar; selected primary |
| TurboSquid `2552927` | 99 | Yes (plus additional body variants) | 10 rigged body variants, UV mapped, lower poly for performance | Pass (Standard License) | Strong fallback and mobile-friendly source |
| TurboSquid `1678218` | 18 | Yes | Clean base meshes, UV + rig support, lower geometric detail | Pass (Standard License) | Low-cost contingency for backup/adaptation |

## Pass/fail checklist

Each candidate is evaluated against this strict gate before import:

1. Topology quality
- Pass if quad-dominant body topology deforms cleanly at shoulder/hip/torso joints.

2. Blendshape/morph readiness
- Pass if either canonical channels already exist or the kit provides enough shape basis (fat/muscle/regional) to author the canonical set.

3. Texture/material quality
- Pass if body materials include at least albedo + normal + roughness (preferred 2K/4K maps).

4. UV quality
- Pass if non-overlapping UVs exist for body and major material regions.

5. Rig compatibility
- Pass if Blender/FBX/GLB rig is usable for neutral mannequin posing and export.

6. Redistribution/legal
- Pass if commercial incorporation is allowed and raw source redistribution is prohibited (which aligns with app packaging rules).

## Selection decision

- Primary (`2391247`): Pass on realism, morph breadth, and texture quality; best balance for the target look.
- Fallback (`2552927`): Pass on legal/rigging and provides extra body-shape coverage for fallback mapping.
- Contingency (`1678218`): Pass as low-cost backup; lower realism so not first choice.

## Pre-purchase acceptance tasks

1. Confirm each product page is not marked editorial-only.
2. Verify exact included files for GLB/FBX/BLEND and texture maps.
3. Message seller for explicit confirmation that browser runtime usage is permitted under Standard License when source files are not exposed.
4. Capture invoice + product snapshots into project docs for audit trail.
