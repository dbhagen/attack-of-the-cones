# QA — attack-of-the-cones

What quality assurance exists, what can be verified headlessly today, and what
cannot. Proof results below were captured on Node v20.20.2 against base
`2734e81` (main: behavior tests via PR #15, vite ^7.2.1 / vitest ^4.0.7 via
PR #11) on 2026-10-09; the original proof at `62e3c61` is in PR #10 history.

## Verifiable headlessly today

| Check | Command | Status @ 2734e81 |
|---|---|---|
| Clean install | `npm ci` | ✅ exit 0 (Node v20.20.2 / npm 10.8.2) |
| Typecheck | `npm run typecheck` | ✅ passes |
| Lint (0 warnings allowed) | `npm run lint` | ✅ passes |
| Production build | `npm run build` | ✅ passes (dist: 498.51 kB JS / 8.87 kB HTML) |
| Tests (vitest 4, node env) | `npm test -- --run` | ✅ passes (5 files / 33 tests, ~0.4 s) |

`npm ci` note: this repo's pre-provisioned sandbox originally shipped a
root-owned `node_modules` that made `npm ci` fail with `EACCES`. Resolved
2026-10-09 by removing the pre-baked tree (`sudo rm -rf node_modules`) — after
that `npm ci` runs clean against the current lockfile.

## Automated tests

`npm test -- --run` (vitest 4, node environment) passes: **5 test files /
33 tests** (2026-10-09). The suites establish behavior, not implementation:

- `src/core/DifficultyManager.test.ts` (7) — easiest-start config, monotonic
  time/distance ramp, cap without overshoot, halfway point, reset
- `src/core/ObstacleManager.test.ts` (14) — spawn spacing + difficulty scaling,
  on-road placement, direct hit vs near miss vs out-of-range, overlap-is-hit,
  no double-reporting, per-mode scoring (Daniel counts hits, Normal counts
  unhit passed cones), cleanup behind the car, reset
- `src/core/RoadGenerator.test.ts` (8) — segment chaining/geometry, straight
  road at zero curve intensity, bounded curve corridor, ribbon mesh structure,
  removal, reset
- `src/core/gameLoop.smoke.test.ts` (1) — headless entry → logic → output:
  difficulty ramp, road chaining, cone spawning, collision, scoring, cleanup
- `src/utils/commitMessageGenerator.test.ts` (3) — deterministic conventional-
  commit-shaped labels for a seeded random stream

No `jsdom` dependency: the test block in `vite.config.ts` sets
`environment: 'node'` because no suite needs a DOM.

## Boundary: the game runtime itself

The 3D presentation and interaction layer — WebGL rendering via Three.js, the
requestAnimationFrame loop, keyboard input, collision feel, camera follow, cone
animations, HUD refresh — requires a real browser and cannot be verified
headlessly here. Pure game logic is now covered headlessly by the vitest suite
(including the game-loop smoke test); what remains browser-only is rendering
and interactive feel. Manual smoke
path for a human or browser-automation session:

1. `npm run dev` → http://localhost:3000 opens automatically.
2. Start menu shows "Play Normal Mode" / "Play Daniel Mode" buttons.
3. Pick a mode → HUD appears (speed / distance / time / cones hit / cones missed / score).
4. Drive with WASD or arrows: W accelerates, S brakes/reverses, A/D steer
   (steering strength scales with forward speed).
5. Normal mode: a near miss shows "Near miss!" (+5); hitting a cone shows a red
   "-10 points" message. Daniel mode: hits show a green "+3 points" message.
6. Hit cones turn grey, fly off with spin, and are removed ~3 s later; near-miss
   cones flash white and shake.
7. `?debug=1` query param shows the FPS / draw-calls / triangles overlay.

What a smoke pass cannot establish here: sustained frame rate on target
hardware, mobile/touch behavior (Product.md aspirations — no touch controls are
implemented), and long-session memory behavior.

## Deployment

Vercel builds and hosts the demo (`vercel.json`, GitHub integration):
https://attack-of-the-cones.vercel.app — verified live (HTTP 200, page title
"Attack of Cones") on 2026-10-09.

No CI workflow exists on main yet (`.github/` is absent at `2734e81`); the
gates above are the automation surface until a workflow lands.
