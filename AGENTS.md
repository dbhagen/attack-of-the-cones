# AGENTS.md — attack-of-the-cones

Guide for coding agents working in this repository.

## What this is

"Attack of Cones" is a browser-based 3D vertical-scroller driving game. The player
drives a car up a procedurally generated road and either avoids traffic cones
(Normal Mode) or deliberately hits them (Daniel Mode), with per-mode scoring shown
in a HUD (`src/core/Game.ts`, `index.html`). Deployed demo:
https://attack-of-the-cones.vercel.app (Vercel).

## Stack

- TypeScript (strict; `noUnusedLocals`/`noUnusedParameters`) checked by `tsc`
- Three.js ^0.160.0 for 3D rendering — the only runtime dependency
- Vite ^5 for dev server and build (dev server: port 3000, auto-open)
- Vitest for tests (jsdom environment configured in `vite.config.ts`)
- Vercel for deployment (`vercel.json`)

## Gate commands

Run from the repo root (verified on Node 20.20.2 / npm 10.8.2):

```bash
npm ci                 # fresh install from package-lock.json
npm run typecheck      # tsc --noEmit
npm run lint           # eslint . --ext ts,tsx --max-warnings 0 (warnings fail)
npm run build          # tsc && vite build
npm test               # vitest
```

Note on `npm test`: vitest is configured (jsdom environment, `vite.config.ts`
`test` block) but currently fails with `MISSING DEPENDENCY 'jsdom'` and there are
no test files yet. A separate unit is repairing the test runner this wave —
check current `package.json` and `git log` before relying on the test gate.

## Source layout

- `src/main.ts` — entry point: DOM-ready hook, instantiates `Game`, hides the loading screen, enables debug overlay via `?debug=1`, HMR stub.
- `src/core/Game.ts` — orchestrator: Three.js scene/camera/renderer, keyboard input (`e.key`), game loop, mode selection and scoring, road/cone lifecycle, camera follow, HUD/debug DOM updates.
- `src/core/Car.ts` — car mesh plus force-based physics: velocity integration with rolling/ground friction, max-speed clamp, wheel-ratio damage effects (tilt, height drop), on/off-road speed multiplier.
- `src/core/Wheel.ts` — wheel mesh with health; damage tinting, detach at zero health, rotation from linear velocity.
- `src/core/Cone.ts` — cone mesh with HTML commit-message label; hit → flying animation (gravity + spin), near miss → white flash + shake; disposal ~3 s after impact.
- `src/core/ObstacleManager.ts` — spawns cones per road segment (difficulty-scaled spacing), sphere-distance collision/near-miss checks, culls cones behind the camera, per-mode score helpers.
- `src/core/RoadGenerator.ts` — procedural road: CatmullRomCurve3 segments from difficulty-driven control points, hand-built ribbon `BufferGeometry` meshes, segment recycling.
- `src/core/DifficultyManager.ts` — difficulty parameters (curve intensity/frequency, obstacle frequency, road width, spawn rate) lerped by time (5 min to max) and distance (1000 units) with cubic easing.
- `src/utils/commitMessageGenerator.ts` — random conventional-commit-style strings ("feat: STORY-1234 …") used as cone labels.

## Conventions

- ESLint: `eslint:recommended` + `@typescript-eslint/recommended`; the lint script passes `--max-warnings 0`, so even `warn`-level findings fail the gate (`.eslintrc.json`).
- Prettier: single quotes, semicolons, 100 print width, ES5 trailing commas (`.prettierrc.json`); `npm run format` writes `src/**`.
- TypeScript: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` (`tsconfig.json`).
- Path alias `@/` → `src/` (`vite.config.ts`, `tsconfig.json`).
- UI is plain DOM declared in `index.html` and looked up by element ID in `Game.ts`; there is no framework and no CSS file.

## Repo

- Default branch: `main`. Conventional commit prefixes (`feat:`, `fix:`, `docs:`, `chore:`).
- Deployment is Vercel-driven (`vercel.json` + GitHub integration). Do not commit `.env` files or local lockfiles other than `package-lock.json`. No environment variables are required today.
- `Product.md` is the original product specification and is aspirational in parts (vehicle selection, pedestrians, level progression, config system are not implemented); implemented behavior in `src/` is the source of truth.
