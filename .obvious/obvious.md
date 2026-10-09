# Repository Context — attack-of-the-cones

"Attack of Cones" is a browser-based 3D vertical-scroller driving game built with
TypeScript, Three.js ^0.160, and Vite 5, deployed to
https://attack-of-the-cones.vercel.app via Vercel (`vercel.json` + GitHub
integration — merges to `main` auto-deploy to production). Players pick Normal
Mode (avoid cones: +10 per avoided cone, +5 near miss, −10 per hit) or Daniel
Mode (hit cones: +3 per hit, +5 near miss) and drive a physics-based car up a
procedurally generated road with progressive difficulty. Implemented behavior in
`src/` is the source of truth; `Product.md` is partly aspirational.

## Commands

Verified on Node v20.20.2 / npm 10.8.2 — dated results and any current failures
are recorded in `.obvious/QA.md`. Once the test-runner repair (PR #15) lands,
all five exit 0 on Node 20.20.2:

```bash
npm ci                # clean install from package-lock.json
npm run typecheck     # tsc --noEmit
npm run lint          # eslint --max-warnings 0 (warnings fail)
npm run build         # tsc && vite build → dist/
npm test -- --run     # vitest, single run
```

Current state (2026-10-09, main @ 48d24b1): typecheck / lint / build pass;
`npm test -- --run` fails with `MISSING DEPENDENCY 'jsdom'` — vitest is
configured (`vite.config.ts` test block) but jsdom is not installed and no test
files exist yet; PR #15 repairs this. Re-check `.obvious/QA.md` before relying
on the test gate.

## Codebase map

Full detail (architecture, types, UI-ID contract, scoring model, line refs):
[`.obvious/orientation.md`](./orientation.md).

- `src/main.ts` — bootstrap: Game instance, loading screen, `?debug=1` overlay
- `src/core/Game.ts` — orchestrator: scene, keyboard input (`e.key`), loop, modes, scoring, camera, HUD
- `src/core/Car.ts` — car mesh + force/friction physics, speed clamp, damage tilt
- `src/core/Wheel.ts` — wheel mesh, health/detach, rotation from velocity
- `src/core/Cone.ts` — cone mesh, commit-message label, fly/shake animations
- `src/core/ObstacleManager.ts` — cone spawning, collision/near-miss detection
- `src/core/RoadGenerator.ts` — procedural spline road segments + recycling
- `src/core/DifficultyManager.ts` — time/distance-scaled difficulty parameters
- `src/utils/commitMessageGenerator.ts` — random conventional-commit label strings

## QA

`.obvious/QA.md` — headless gates (typecheck / lint / build / tests) plus the
honest boundary: the 3D runtime (WebGL rendering, input, collisions, feel)
requires a real browser and cannot be verified headlessly; a manual smoke path
is documented there.

## Boundaries

- Never commit `.env` (git-ignored; no env vars are required today) or
  `bun.lock` (not used by this repo's npm-based toolchain).
- Default base branch is `main` (`branches.defaultBase` in `.obvious/config.yml`).
- Vercel auto-deploys merges to `main` to production — the demo URL serves
  merged code.
- PR merge method is squash (`pr.merge.method` in `.obvious/config.yml`).
