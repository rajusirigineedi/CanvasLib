# CanvasLib (`fitt-canvas`): agent instructions

The shared customizer and rendering library, published to npm as `fitt-canvas` (currently 3.0.1). Entry points:

- `./core`: pure logic (`src/core/customizer.ts`, `canvasGeometry.ts`)
- `.` and `./web`: HTML canvas renderer
- `./native`: React Native Skia `FittCanvas`

`fitt-native` and `fitt-fulfillment` install it from the npm registry. Changes here reach them only after a version bump, a publish, and a dependency update in both apps.

Cross-repo knowledge lives in the sibling folder `../docs/` (index: `../docs/README.md`, entry point: `../AGENTS.md`). Read `../docs/architecture/repo-canvaslib.md` and `../.claude/skills/fitt-builder-publishing/SKILL.md` first.

## Rules specific to this repo

- The input shape is produced by `fitt-backend/services/builders/runtime.js`, plus historical purchase snapshots. Keep the legacy `images` / `substituteMaterial` path working, because old orders render with it.
- Keep `core` free of React and platform imports.
- Price helpers (`getAddOnTotal`, `getCustomizerTotal`) are display estimates. The backend `getAddOnsPrice` is authoritative. Keep the formulas equivalent.
- Follow semver. Changing a type or behaviour that consumers rely on is a major version.
- `dist/` is gitignored and built by `prepare`/`npm test`.

## Checks

```bash
npm test   # builds dist, then runs test/core.test.cjs
```

Add tests for any change to `deriveImageList`, `getDisabledOptions`, `selectGroupOption`, `applyCreation` or `buildCreationPayload`. The v3 `renderLayers` path is untested today.

If `../docs/` does not exist, this repo was opened on its own. The shared docs and skills live in the Fitt workspace repo (the parent `fittSource/` folder). Clone that repo and run `./bootstrap.sh` to get the side-by-side layout.
